"""Optional Angel One SmartAPI market-data adapter for AuRA.

This module is deliberately monitor-only: it authenticates, subscribes to quote data and
publishes the same snapshot schema used by the existing MCX browser monitor.  It contains
no order, position, margin, GTT or portfolio calls.
"""
import json
import os
import time
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from aura.analytics import MIN_DTE
from aura.live import DEPTH_LEVELS, IST, depth_level, history, load_env, market_open, publish, snapshot
from aura.specs import fine_per_gram

INSTRUMENT_MASTER_URL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
LEG_SYMBOLS = {"ten": "GOLDTEN", "ten_next": "GOLDTEN", "petal": "GOLDPETAL", "guinea": "GOLDGUINEA", "m": "GOLDM"}
REQUIRED_LEGS = tuple(LEG_SYMBOLS)
MAX_QUOTE_SKEW_S = 5


@dataclass(frozen=True)
class AngelSettings:
    api_key: str
    client_code: str
    pin: str
    totp_secret: str
    exchange_type: int
    price_divisor: float
    publish_seconds: float

    @classmethod
    def from_env(cls) -> "AngelSettings":
        required = ("ANGEL_API_KEY", "ANGEL_CLIENT_CODE", "ANGEL_PIN", "ANGEL_TOTP_SECRET")
        missing = [key for key in required if not os.environ.get(key, "").strip()]
        if missing:
            raise RuntimeError("Angel One monitor needs " + ", ".join(missing) + " in .env")
        if os.environ.get("MONITOR_ONLY", "true").strip().lower() not in {"1", "true", "yes"}:
            raise RuntimeError("Refusing to start: MONITOR_ONLY must be true")
        return cls(
            api_key=os.environ["ANGEL_API_KEY"].strip(),
            client_code=os.environ["ANGEL_CLIENT_CODE"].strip(),
            pin=os.environ["ANGEL_PIN"].strip(),
            totp_secret=os.environ["ANGEL_TOTP_SECRET"].replace(" ", "").strip(),
            exchange_type=int(os.environ.get("ANGEL_MCX_EXCHANGE_TYPE", "5")),
            price_divisor=float(os.environ.get("ANGEL_PRICE_DIVISOR", "100")),
            publish_seconds=max(1.0, float(os.environ.get("ANGEL_PUBLISH_SECONDS", "2"))),
        )


@dataclass(frozen=True)
class Instrument:
    leg: str
    symbol: str
    expiry: date
    token: str


def parse_expiry(value: Any) -> date | None:
    """Parse the expiry formats currently used by Angel One's instrument master."""
    if not value:
        return None
    text = str(value).strip().upper()
    for fmt in ("%d%b%Y", "%d-%b-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            pass
    return None


def fetch_instrument_master(url: str | None = None) -> list[dict[str, Any]]:
    target = url or os.environ.get("ANGEL_INSTRUMENT_MASTER_URL", INSTRUMENT_MASTER_URL)
    req = urllib.request.Request(target, headers={"User-Agent": "AuRA-monitor/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
    if not isinstance(payload, list):
        raise RuntimeError("Angel One instrument master returned an unexpected response")
    return payload


def pick_contracts_from_master(today: date, rows: list[dict[str, Any]]) -> dict[str, date]:
    """Choose live legs from Angel One's current MCX master, without a local DuckDB file.

    A cloud worker must not depend on the research database that lives on a developer's
    machine. Exact expiry dates still remain the contract identity throughout the monitor.
    """
    expiries: dict[str, set[date]] = {"GOLDTEN": set(), "GOLDM": set()}
    for row in rows:
        symbol = str(row.get("name", "")).upper()
        expiry = parse_expiry(row.get("expiry"))
        if (str(row.get("exch_seg", "")).upper() == "MCX" and symbol in expiries
                and expiry is not None and (expiry - today).days >= MIN_DTE):
            expiries[symbol].add(expiry)
    ten, goldm = sorted(expiries["GOLDTEN"]), sorted(expiries["GOLDM"])
    if len(ten) < 2 or not goldm:
        raise RuntimeError("Angel One master has insufficient eligible MCX GOLDTEN/GOLDM expiries")
    return {"ten": ten[0], "ten_next": ten[1], "m": goldm[0]}


def token_overrides() -> dict[str, str] | None:
    raw = os.environ.get("ANGEL_MCX_TOKENS_JSON", "").strip()
    if not raw:
        return None
    try:
        values = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError("ANGEL_MCX_TOKENS_JSON must be valid JSON") from exc
    if not isinstance(values, dict) or set(values) != set(REQUIRED_LEGS):
        raise RuntimeError("ANGEL_MCX_TOKENS_JSON must contain exactly: " + ", ".join(REQUIRED_LEGS))
    return {leg: str(token) for leg, token in values.items()}


def resolve_instruments(contracts: dict[str, date], rows: list[dict[str, Any]]) -> dict[str, Instrument]:
    """Map AuRA's exact contract expiries to current Angel One MCX tokens.

    Matching expiry dates, rather than display names alone, prevents a front-month rollover
    from silently changing the leg being measured.
    """
    overrides = token_overrides()
    matched: dict[str, Instrument] = {}
    for leg, symbol in LEG_SYMBOLS.items():
        if overrides:
            matched[leg] = Instrument(leg, symbol, contracts["ten"] if leg in {"ten", "petal", "guinea"} else contracts["m"] if leg == "m" else contracts["ten_next"], overrides[leg])
            continue
        expected_expiry = contracts["ten"] if leg in {"ten", "petal", "guinea"} else contracts["m"] if leg == "m" else contracts["ten_next"]
        choices = [
            row for row in rows
            if str(row.get("exch_seg", "")).upper() == "MCX"
            and str(row.get("name", "")).upper() == symbol
            and parse_expiry(row.get("expiry")) == expected_expiry
            and row.get("token")
        ]
        if len(choices) != 1:
            found = ", ".join(str(row.get("symbol", row.get("token", "?"))) for row in choices) or "none"
            raise RuntimeError(f"Could not uniquely resolve {symbol} {expected_expiry} in Angel One master (found: {found})")
        matched[leg] = Instrument(leg, symbol, expected_expiry, str(choices[0]["token"]))
    return matched


def _number(value: Any) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _timestamp(value: Any) -> float:
    number = _number(value)
    if number is None:
        return time.time()
    return number / 1000 if number > 10_000_000_000 else number


def _best_price(levels: Any, field: str, divisor: float) -> float | None:
    if not isinstance(levels, list) or not levels:
        return None
    raw = _number(levels[0].get(field)) if isinstance(levels[0], dict) else None
    return raw / divisor if raw is not None else None


def _depth(buys: Any, sells: Any, divisor: float) -> list[dict[str, float | None]]:
    """Snap Quote best_5_buy/sell_data -> AuRA depth levels (prices from paise, quantities in lots)."""
    buys = buys if isinstance(buys, list) else []
    sells = sells if isinstance(sells, list) else []
    levels = []
    for i in range(min(DEPTH_LEVELS, max(len(buys), len(sells)))):
        b = buys[i] if i < len(buys) and isinstance(buys[i], dict) else {}
        s = sells[i] if i < len(sells) and isinstance(sells[i], dict) else {}
        bid, ask = _number(b.get("price")), _number(s.get("price"))
        levels.append(depth_level(bid / divisor if bid else None, _number(b.get("quantity")),
                                  ask / divisor if ask else None, _number(s.get("quantity"))))
    return levels


def quote_from_tick(tick: dict[str, Any], instrument: Instrument, divisor: float) -> dict[str, Any]:
    """Convert SmartWebSocketV2 Snap Quote fields into AuRA's existing quote shape."""
    ltp_raw = _number(tick.get("last_traded_price", tick.get("ltp")))
    if ltp_raw is None:
        raise ValueError(f"Tick for {instrument.symbol} has no last_traded_price")
    ltp = ltp_raw / divisor
    bid = _best_price(tick.get("best_5_buy_data"), "price", divisor)
    ask = _best_price(tick.get("best_5_sell_data"), "price", divisor)
    depth = _depth(tick.get("best_5_buy_data"), tick.get("best_5_sell_data"), divisor)
    close_raw = _number(tick.get("closed_price", tick.get("close")))
    prev_close = close_raw / divisor if close_raw is not None else None
    return {
        "symbol": instrument.symbol,
        "expiry": instrument.expiry.isoformat(),
        "ltp": ltp,
        "bid": bid,
        "ask": ask,
        "prev_close": prev_close,
        "change_pct": ((ltp / prev_close - 1) * 100) if prev_close else None,
        "volume": tick.get("volume_trade_today", tick.get("volume")),
        "oi": tick.get("open_interest"),
        "as_on": _timestamp(tick.get("exchange_timestamp", tick.get("last_traded_timestamp"))),
        "spread_bps": (ask - bid) / ((ask + bid) / 2) * 1e4 if bid and ask else None,
        "fine": fine_per_gram(instrument.symbol, ltp),
        "depth": depth,
    }


class AngelOneMonitor:
    """Collect a coherent five-leg quote set and publish it through the existing backend."""
    def __init__(self, instruments: dict[str, Instrument], contracts: dict[str, date], hist: dict, settings: AngelSettings):
        self.instruments = instruments
        self.contracts = contracts
        self.hist = hist
        self.settings = settings
        self.by_token = {item.token: item for item in instruments.values()}
        self.quotes: dict[str, dict[str, Any]] = {}
        self.last_publish = 0.0

    def on_data(self, _wsapp: Any, tick: dict[str, Any]) -> None:
        token = str(tick.get("token", ""))
        item = self.by_token.get(token)
        if item is None:
            return
        try:
            self.quotes[item.leg] = quote_from_tick(tick, item, self.settings.price_divisor)
            self.publish_if_ready()
        except Exception as exc:
            print(datetime.now(IST).strftime("%H:%M:%S"), f"Angel One tick ignored for {item.symbol}: {exc}", flush=True)

    def publish_if_ready(self) -> None:
        if set(self.quotes) != set(REQUIRED_LEGS):
            return
        stamps = [quote["as_on"] for quote in self.quotes.values()]
        if max(stamps) - min(stamps) > MAX_QUOTE_SKEW_S:
            return
        now = time.time()
        if now - self.last_publish < self.settings.publish_seconds:
            return
        live = snapshot(self.quotes, self.hist, self.contracts)
        live.update({"feed_source": "angelone_websocket", "poll_s": self.settings.publish_seconds,
                     "market_open": market_open(datetime.now(IST))})
        publish(live)
        self.last_publish = now
        line = "  ".join(f"{item['pair'].split()[0]} {item['premium_bps']:+.1f}bps {item['status']}" for item in live["pairs"])
        print(live["polled_ist"], "published Angel One websocket |", line, flush=True)


def run() -> None:
    """Authenticate and stream data. SmartAPI imports stay here so MCX mode needs none."""
    load_env()
    settings = AngelSettings.from_env()
    try:
        import pyotp
        from SmartApi import SmartConnect
        from SmartApi.smartWebSocketV2 import SmartWebSocketV2
    except ImportError as exc:
        raise RuntimeError("Install Angel One dependencies: pip install -r requirements-dev.txt") from exc

    print("Starting Angel One monitor in monitor-only mode; no order APIs are used.", flush=True)
    while True:
        try:
            master = fetch_instrument_master()
            contracts = pick_contracts_from_master(datetime.now(IST).date(), master)
            instruments = resolve_instruments(contracts, master)
            smart = SmartConnect(api_key=settings.api_key)
            session = smart.generateSession(settings.client_code, settings.pin, pyotp.TOTP(settings.totp_secret).now())
            if not session or not session.get("status"):
                raise RuntimeError(f"Angel One login failed: {session}")
            monitor = AngelOneMonitor(instruments, contracts, history(), settings)
            socket = SmartWebSocketV2(session["data"]["jwtToken"], settings.api_key, settings.client_code, smart.getfeedToken())
            socket.on_open = lambda ws: ws.subscribe("aura-mcx-gold", 3, [{"exchangeType": settings.exchange_type, "tokens": list(monitor.by_token)}])
            socket.on_data = monitor.on_data
            socket.on_error = lambda _ws, error: print("Angel One websocket error:", error, flush=True)
            socket.on_close = lambda _ws: print("Angel One websocket closed; reconnecting", flush=True)
            socket.connect()
        except KeyboardInterrupt:
            return
        except Exception as exc:
            print(datetime.now(IST).strftime("%H:%M:%S"), "Angel One monitor retrying:", exc, flush=True)
            time.sleep(10)


if __name__ == "__main__":
    run()
