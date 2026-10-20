"""Real-time monitor feed: poll MCX quotes, compute live premiums, publish snapshots.

Runs on a machine with Microsoft Edge (MCX serves real browsers only). Each cycle fetches
five ~1 KB quotes with a 5-level order book, computes last-trade and executable premiums,
compares them with the historical distribution from data/results.json, and publishes:
  - data/live.json and data/live_ticks.json (always; the local API reads these)
  - Upstash Redis keys aura:live and aura:ticks when KV_REST_API_URL and KV_REST_API_TOKEN
    are set in the environment or in .env (the deployed API reads these)

Every hour, at market close and on Ctrl+C it also commits data/last_session.json (the day's
snapshots) and pushes, so the deployed site always has the latest real session to replay
when no poller is running.

Usage:  python -m aura.live            (Ctrl+C to stop)
"""
import json
import os
import subprocess
import time
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import duckdb

from aura.analytics import MIN_DTE
from aura.ingest import DB, USER_AGENT
from aura.config import upstash
from aura.specs import BASE, fine_per_gram

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "data" / "results.json"
LIVE = ROOT / "data" / "live.json"
TICKS = ROOT / "data" / "live_ticks.json"
SESSION_FILE = ROOT / "data" / "last_session.json"
QUOTE_PAGE = "https://www.mcxindia.com/en/market-data/get-quote/FUTCOM/GOLDTEN/{expiry}"
QUOTE_API = "/GetQuote?Commodity={symbol}&Expiry={expiry}&culture=en"
IST = timezone(timedelta(hours=5, minutes=30))
POLL_S = 15                 # seconds between polls while the market is open
CLOSED_POLL_S = 300         # seconds between checks while it is closed
SESSION = ((9, 0), (23, 55))  # MCX trading day in IST (evening session ends 23:30 or 23:55 by season)
MAX_TICKS = 4000            # a full 09:00-23:55 session of 15-second ticks
SESSION_PUSH_S = 3600       # publish the session archive to the repo once an hour
REFRESH_PAGE_S = 1800       # reopen the MCX page every 30 minutes to keep the session fresh

FETCH_JS = """async (u) => {
  const r = await fetch(u, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
  return { status: r.status, body: await r.text() };
}"""


def load_env() -> None:
    """Read KEY=VALUE lines from .env without overriding real environment variables."""
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"'))


def pick_contracts(today: date) -> dict[str, date]:
    """Front GOLDTEN expiry outside the delivery window, the next one for the curve, GOLDM front."""
    con = duckdb.connect(str(DB), read_only=True)
    rows = con.execute("SELECT DISTINCT symbol, expiry FROM bhavcopy WHERE expiry >= ? ORDER BY expiry", [today]).fetchall()
    con.close()
    exp = {s: [e for sym, e in rows if sym == s and (e - today).days >= MIN_DTE] for s in ("GOLDTEN", "GOLDM")}
    if len(exp["GOLDTEN"]) < 2 or not exp["GOLDM"]:
        raise RuntimeError("Not enough future expiries in the database: run python -m aura.ingest first")
    return {"ten": exp["GOLDTEN"][0], "ten_next": exp["GOLDTEN"][1], "m": exp["GOLDM"][0]}


def history() -> dict:
    """Trailing mean / sd of each premium (window chosen in the walk-forward) plus thresholds."""
    r = json.loads(RESULTS.read_text(encoding="utf-8"))
    s, out = r["series"], {}
    for key, col, sym in (("petal", "prem_petal", "GOLDPETAL"), ("guinea", "prem_guinea", "GOLDGUINEA"), ("m", "m_carry", None)):
        chosen = r["backtest"][sym]["chosen"] if sym else {"window": 40, "z_in": 2.0}
        vals = [v for v in s[col] if v is not None][-chosen["window"]:]
        mean = sum(vals) / len(vals)
        sd = (sum((v - mean) ** 2 for v in vals) / (len(vals) - 1)) ** 0.5
        out[key] = {"mean": mean, "sd": sd, "window": chosen["window"], "z_in": chosen["z_in"]}
    out["hurdle_bps"] = r["hurdle_bps"]
    out["verdict"] = r["verdict"]
    return out


def parse_quote(symbol: str, expiry: date, body: str) -> dict:
    j = json.loads(body)
    d = j["Data"][0]
    book = d.get("QuoteBid") or []
    bid = book[0]["BidPrice"] if book and book[0]["BidPrice"] else None
    ask = book[0]["AskPrice"] if book and book[0]["AskPrice"] else None
    as_on = int(j["Summary"]["AsOn"].strip("/").removeprefix("Date(").rstrip(")")) / 1000
    return {"symbol": symbol, "expiry": expiry.isoformat(), "ltp": d["LTP"], "bid": bid, "ask": ask,
            "prev_close": d["PreviousClose"], "change_pct": d["PercentChange"], "volume": d["Volume"],
            "oi": d["OpenInterest"], "as_on": as_on,
            "spread_bps": (ask - bid) / ((ask + bid) / 2) * 1e4 if bid and ask else None,
            "fine": fine_per_gram(symbol, d["LTP"])}


def bps(a: float, b: float) -> float:
    return (a / b - 1) * 1e4


def snapshot(q: dict[str, dict], hist: dict, contracts: dict[str, date]) -> dict:
    ten, ten2 = q["ten"], q["ten_next"]
    pairs = []
    for key, label in (("petal", "GOLDPETAL vs GOLDTEN"), ("guinea", "GOLDGUINEA vs GOLDTEN")):
        x, h = q[key], hist[key]
        sym = x["symbol"]
        prem = bps(x["fine"], ten["fine"])
        # Executable: sell the rich leg at its bid and buy the other at its ask (and the reverse).
        sell_x = bps(fine_per_gram(sym, x["bid"]), fine_per_gram(BASE, ten["ask"])) if x["bid"] and ten["ask"] else None
        buy_x = bps(fine_per_gram(sym, x["ask"]), fine_per_gram(BASE, ten["bid"])) if x["ask"] and ten["bid"] else None
        pairs.append(classify(label, prem, sell_x, buy_x, h, hist["hurdle_bps"], tradeable=True))
    # GOLDM: compare with the GOLDTEN curve read at GOLDM's expiry (log-linear between two expiries).
    e1, e2, em = (date.fromisoformat(ten["expiry"]), date.fromisoformat(ten2["expiry"]), date.fromisoformat(q["m"]["expiry"]))
    w = (em - e1).days / (e2 - e1).days
    curve = ten["fine"] ** (1 - w) * ten2["fine"] ** w
    pairs.append(classify("GOLDM vs GOLDTEN curve", bps(q["m"]["fine"], curve), None, None, hist["m"], hist["hurdle_bps"],
                          tradeable=False))
    carry = (ten2["ltp"] / ten["ltp"] - 1) / (e2 - e1).days * 365 * 100
    as_on = max(v["as_on"] for v in q.values())
    now = time.time()
    return {"as_on": as_on, "as_on_ist": datetime.fromtimestamp(as_on, IST).strftime("%Y-%m-%d %H:%M:%S"),
            "published": now, "polled_ist": datetime.fromtimestamp(now, IST).strftime("%Y-%m-%d %H:%M:%S"), "poll_s": POLL_S, "market_open": market_open(datetime.now(IST)),
            "contracts": list(q.values()), "pairs": pairs, "carry_pa": carry, "hurdle_bps": hist["hurdle_bps"],
            "verdict": hist["verdict"]}


def classify(label: str, prem: float, sell_x: float | None, buy_x: float | None, h: dict, hurdle: float,
             tradeable: bool) -> dict:
    z = (prem - h["mean"]) / h["sd"] if h["sd"] else 0.0
    gap = prem - h["mean"]
    # The capturable gap uses the executable side: selling a rich leg, or buying a cheap one.
    exec_gap = (sell_x - h["mean"]) if (gap > 0 and sell_x is not None) else (h["mean"] - buy_x) if (gap < 0 and buy_x is not None) else None
    if abs(z) < h["z_in"]:
        status, why = "normal", f"|z| {abs(z):.1f} below {h['z_in']}: normal noise"
    elif not tradeable:
        status, why = "watch", f"unusual (z {z:+.1f}) but GOLDM's expiry differs; informational"
    elif exec_gap is None or exec_gap < hurdle:
        status, why = "watch", f"unusual (z {z:+.1f}) but the executable gap does not clear the {hurdle:.0f} bps cost hurdle"
    else:
        status, why = "flagged", ("rich" if gap > 0 else "cheap") + f" by {exec_gap:.1f} bps after crossing the spread"
    return {"pair": label, "premium_bps": prem, "exec_sell_bps": sell_x, "exec_buy_bps": buy_x, "mean_bps": h["mean"],
            "sd_bps": h["sd"], "window": h["window"], "z": z, "gap_bps": gap, "exec_gap_bps": exec_gap,
            "status": status, "why": why}


def market_open(now: datetime) -> bool:
    (h0, m0), (h1, m1) = SESSION
    return now.weekday() < 5 and (h0, m0) <= (now.hour, now.minute) <= (h1, m1)


def publish(snap: dict) -> None:
    # Ticks are stamped with the poll time: MCX's own "as on" stamp only moves once a minute.
    tick = {"t": round(snap["published"]), **{f"p{i}": round(p["premium_bps"], 2) for i, p in enumerate(snap["pairs"])},
            **{f"e{i}": (round(p["exec_sell_bps"], 2) if p["exec_sell_bps"] is not None else None) for i, p in enumerate(snap["pairs"])}}
    ticks = json.loads(TICKS.read_text(encoding="utf-8")) if TICKS.exists() else []
    day = lambda ts: datetime.fromtimestamp(ts, IST).date()
    new_day = bool(ticks) and day(ticks[-1]["t"]) != day(tick["t"])
    if new_day:  # one chart per trading day
        ticks = []
    if not ticks or ticks[-1]["t"] != tick["t"]:
        ticks = (ticks + [tick])[-MAX_TICKS:]
    LIVE.write_text(json.dumps(snap), encoding="utf-8")
    TICKS.write_text(json.dumps(ticks), encoding="utf-8")
    url, token = upstash()
    if url and token:
        # No expiry: when the poller stops, viewers still see the last real snapshot, marked by its age.
        cmds = ([["DEL", "aura:ticks"]] if new_day else []) + [
            ["SET", "aura:live", json.dumps(snap)], ["RPUSH", "aura:ticks", json.dumps(tick)],
            ["LTRIM", "aura:ticks", str(-MAX_TICKS), "-1"]]
        req = urllib.request.Request(url.rstrip("/") + "/pipeline", data=json.dumps(cmds).encode(), method="POST",
                                     headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            r.read()


def save_session(reason: str) -> None:
    """Commit and push today's snapshots so the deployed site can replay the last real session."""
    if not (LIVE.exists() and TICKS.exists()):
        return
    SESSION_FILE.write_text(json.dumps({"snapshot": json.loads(LIVE.read_text(encoding="utf-8")),
                                        "ticks": json.loads(TICKS.read_text(encoding="utf-8"))}), encoding="utf-8")
    stamp = datetime.now(IST).strftime("%Y-%m-%d %H:%M")
    git = lambda *a: subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True, timeout=120)
    git("add", str(SESSION_FILE.relative_to(ROOT)))
    if git("diff", "--cached", "--quiet").returncode == 0:
        return
    git("commit", "-m", f"Live session snapshot {stamp} IST ({reason})")
    pushed = git("push")
    print(stamp, f"session archive pushed ({reason})" if pushed.returncode == 0 else f"push failed: {pushed.stderr.strip()}", flush=True)


def run() -> None:
    from playwright.sync_api import sync_playwright

    load_env()
    hist = history()
    remote = "and Upstash" if all(upstash()) else "(local only: no Upstash keys)"
    while True:
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(channel="msedge", headless=True,
                                            args=["--disable-blink-features=AutomationControlled"])
                page = browser.new_context(user_agent=USER_AGENT, locale="en-IN").new_page()
                loop(page, hist, remote)
        except KeyboardInterrupt:
            save_session("poller stopped")
            return
        except BrowserLost as exc:  # e.g. the PC slept: start a fresh browser and carry on
            print(datetime.now(IST).strftime("%H:%M:%S"), "restarting browser:", exc, flush=True)
            time.sleep(30)


class BrowserLost(RuntimeError):
    """Polls keep failing: the browser or its driver is gone and must be relaunched."""


MAX_FAILS = 4  # consecutive failed polls before the browser is relaunched


def loop(page, hist: dict, remote: str) -> None:
    """Poll while MCX is open; archive the session at the first poll, hourly and at the close."""
    opened, contracts, was_open, archived, fails = 0.0, None, False, 0.0, 0
    while True:
        now = datetime.now(IST)
        if contracts is None or contracts["ten"] - now.date() < timedelta(days=MIN_DTE):
            contracts = pick_contracts(now.date())
            print("tracking", {k: v.isoformat() for k, v in contracts.items()}, flush=True)
        if not market_open(now):
            if was_open:
                save_session("market close")
                was_open = False
            print(now.strftime("%H:%M:%S"), "market closed; next check in", CLOSED_POLL_S, "s", flush=True)
            time.sleep(CLOSED_POLL_S)
            continue
        try:
            if time.time() - opened > REFRESH_PAGE_S:
                page.goto(QUOTE_PAGE.format(expiry=contracts["ten"].strftime("%d%b%Y").upper()),
                          wait_until="domcontentloaded", timeout=60_000)
                opened = time.time()
            legs = {"ten": ("GOLDTEN", contracts["ten"]), "ten_next": ("GOLDTEN", contracts["ten_next"]),
                    "petal": ("GOLDPETAL", contracts["ten"]), "guinea": ("GOLDGUINEA", contracts["ten"]),
                    "m": ("GOLDM", contracts["m"])}
            quotes = {}
            for key, (sym, exp) in legs.items():
                res = page.evaluate(FETCH_JS, QUOTE_API.format(symbol=sym, expiry=exp.strftime("%d%b%Y").upper()))
                if res["status"] != 200:
                    raise RuntimeError(f"HTTP {res['status']} for {sym} {exp}")
                quotes[key] = parse_quote(sym, exp, res["body"])
            snap = snapshot(quotes, hist, contracts)
            publish(snap)
            line = "  ".join(f"{x['pair'].split()[0]} {x['premium_bps']:+.1f}bps z{x['z']:+.1f} {x['status']}" for x in snap["pairs"])
            print(snap["polled_ist"], "published", remote, "|", line, flush=True)
            was_open, fails = True, 0
            if time.time() - archived > SESSION_PUSH_S:
                save_session("hourly")
                archived = time.time()
        except Exception as exc:  # network blip or session expiry: reopen the page next cycle
            print(datetime.now(IST).strftime("%H:%M:%S"), "poll failed:", exc, flush=True)
            opened, fails = 0.0, fails + 1
            if fails >= MAX_FAILS:
                raise BrowserLost(exc) from exc
        time.sleep(POLL_S)


if __name__ == "__main__":
    run()
