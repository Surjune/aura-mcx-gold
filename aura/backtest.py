"""Walk-forward backtest of same-expiry premium mean reversion, net of every cost.

No look-ahead: the z-score at close t uses premiums up to t-1 for its mean and sd, the
decision is taken at close t and executed at close t+1. P&L is marked on the contracts
actually held (fixed expiry for the life of a trade), never on a rolled series.
"""
from dataclasses import asdict, dataclass, field

import numpy as np
import pandas as pd

from aura import stats
from aura.specs import BASE, quote_units


@dataclass(frozen=True)
class Costs:
    exchange: float = 0.000021   # MCX transaction charge, Rs 2.10 per lakh, both sides
    sebi: float = 0.000001       # SEBI turnover fee, Rs 10 per crore, both sides
    gst: float = 0.18            # on brokerage + exchange + SEBI fees
    stamp_buy: float = 0.00002   # stamp duty, buy side
    ctt_sell: float = 0.0001     # commodity transaction tax, sell side
    brokerage: float = 20.0      # Rs per order, discount-broker flat fee
    slip_bps: dict = field(default_factory=lambda: {"GOLDM": 1.5, "GOLDTEN": 1.5, "GOLDGUINEA": 3.0, "GOLDPETAL": 3.0})

    def leg(self, symbol: str, notional: float, side: str) -> float:
        fees = notional * (self.exchange + self.sebi)
        tax = notional * (self.stamp_buy if side == "buy" else self.ctt_sell)
        return fees + self.brokerage + (fees + self.brokerage) * self.gst + tax + notional * self.slip_bps[symbol] / 1e4


@dataclass(frozen=True)
class Params:
    window: int = 60       # sessions of trailing premium history for mean / sd
    z_in: float = 2.0
    z_out: float = 0.5
    max_hold: int = 10     # sessions
    entry_dte: int = 12    # only open with this many calendar days left
    exit_dte: int = 9      # always out before the delivery window


# Whole-lot, gram-matched hedges: both legs hold the same grams of gold.
PAIRS = {"GOLDPETAL": (100, 10), "GOLDGUINEA": (10, 8)}   # (lots of X, lots of GOLDTEN)
PREMIUM_COL = {"GOLDPETAL": "prem_petal", "GOLDGUINEA": "prem_guinea"}


def run(df: pd.DataFrame, pnl: pd.DataFrame, symbol: str, p: Params = Params(), costs: Costs = Costs()) -> dict:
    lots_x, lots_t = PAIRS[symbol]
    ux, ut = quote_units(symbol, lots_x), quote_units(BASE, lots_t)
    col = PREMIUM_COL[symbol]
    px = {(r.session, r.symbol, r.expiry): r.close for r in df.itertuples()}
    fine = {(r.session, r.symbol, r.expiry): r.fine for r in df.itertuples()}
    sessions = list(pnl.index)
    prem = pnl[col].to_numpy()

    def premium_on(t, e):
        a, b = fine.get((t, symbol, e)), fine.get((t, BASE, e))
        return (a / b - 1) * 1e4 if a and b else None

    def z(i, value):
        w = prem[max(0, i - p.window):i]
        w = w[~np.isnan(w)]
        if len(w) < 0.8 * p.window or value is None or w.std(ddof=1) == 0:
            return None
        return (value - w.mean()) / w.std(ddof=1)

    pos, pending, mark = None, None, None
    trades, daily = [], np.zeros(len(sessions))
    for i, t in enumerate(sessions):
        if pending and pending[0] == "open":
            _, e, d = pending
            pX, pT = px.get((t, symbol, e)), px.get((t, BASE, e))
            if pX and pT:
                cost = costs.leg(symbol, pX * ux, "sell" if d < 0 else "buy") + costs.leg(BASE, pT * ut, "buy" if d < 0 else "sell")
                pos = {"e": e, "d": d, "i": i, "pX": pX, "pT": pT, "cost": cost, "notional": pT * ut}
                mark = (pX, pT)
                daily[i] -= cost
            pending = None
        elif pos is not None:
            pX = px.get((t, symbol, pos["e"]), mark[0])
            pT = px.get((t, BASE, pos["e"]), mark[1])
            daily[i] += pos["d"] * ((pX - mark[0]) * ux - (pT - mark[1]) * ut)
            mark = (pX, pT)
            if pending and pending[0] == "close":
                exit_cost = costs.leg(symbol, pX * ux, "buy" if pos["d"] < 0 else "sell") + costs.leg(BASE, pT * ut, "sell" if pos["d"] < 0 else "buy")
                daily[i] -= exit_cost
                gross = pos["d"] * ((pX - pos["pX"]) * ux - (pT - pos["pT"]) * ut)
                trades.append({"entry": sessions[pos["i"]].date(), "exit": t.date(), "side": "short X" if pos["d"] < 0 else "long X",
                               "held": i - pos["i"], "gross": gross, "costs": pos["cost"] + exit_cost,
                               "net": gross - pos["cost"] - exit_cost, "notional": pos["notional"]})
                pos, pending, mark = None, None, None
        # decide at today's close, execute tomorrow
        if pos is not None and pending is None:
            zz = z(i, premium_on(t, pos["e"]))
            if (zz is not None and abs(zz) < p.z_out) or i - pos["i"] >= p.max_hold or (pos["e"] - t).days < p.exit_dte:
                pending = ("close",)
        elif pos is None and pending is None and not np.isnan(prem[i]):
            zz = z(i, prem[i])
            e = pnl["expiry"].iloc[i]
            if zz is not None and abs(zz) > p.z_in and (e - t).days >= p.entry_dte:
                pending = ("open", e, -1 if zz > 0 else 1)

    gold = np.concatenate([[0.0], np.diff(np.log(pnl["ten_fine"].to_numpy()))])
    return {"symbol": symbol, "params": asdict(p), "lots": {"x": lots_x, "ten": lots_t},
            "trades": trades, "daily": pd.Series(daily, index=sessions), "gold": pd.Series(gold, index=sessions)}


def summarise(res: dict, mask: np.ndarray | None = None, trial_sharpes: list[float] | None = None) -> dict:
    daily = res["daily"].to_numpy() if mask is None else res["daily"].to_numpy()[mask]
    gold = res["gold"].to_numpy() if mask is None else res["gold"].to_numpy()[mask]
    idx = res["daily"].index if mask is None else res["daily"].index[mask]
    lo, hi = idx.min().date(), idx.max().date()
    tr = [t for t in res["trades"] if lo <= t["entry"] <= hi]
    n = len(tr)
    beta = float(np.polyfit(gold, daily, 1)[0]) / 100 if gold.std() > 0 else 0.0   # Rs per 1% gold move
    corr = float(np.corrcoef(gold, daily)[0, 1]) if gold.std() > 0 and daily.std() > 0 else 0.0
    return {
        "from": str(lo), "to": str(hi), "sessions": int(len(daily)), "trades": n,
        "win_rate": sum(t["net"] > 0 for t in tr) / n if n else None,
        "gross_rs": sum(t["gross"] for t in tr), "costs_rs": sum(t["costs"] for t in tr), "net_rs": sum(t["net"] for t in tr),
        "gross_bps_per_trade": np.mean([t["gross"] / t["notional"] * 1e4 for t in tr]) if n else None,
        "cost_bps_per_trade": np.mean([t["costs"] / t["notional"] * 1e4 for t in tr]) if n else None,
        "net_bps_per_trade": np.mean([t["net"] / t["notional"] * 1e4 for t in tr]) if n else None,
        "avg_hold": np.mean([t["held"] for t in tr]) if n else None,
        "sharpe": stats.sharpe(daily), "max_dd_rs": stats.max_drawdown(daily),
        "corr_gold": corr, "beta_rs_per_1pct_gold": beta,
        "bootstrap_p": stats.bootstrap_pvalue(daily),
        "deflated_sharpe_prob": stats.deflated_sharpe(daily, trial_sharpes or []),
    }


GRID = [Params(window=w, z_in=z) for w in (40, 60, 120) for z in (1.5, 2.0, 2.5)]


def walk_forward(df: pd.DataFrame, pnl: pd.DataFrame, symbol: str, holdout_months: int = 6) -> dict:
    """Pick parameters on the development period only, then report the untouched holdout."""
    span = pnl.index.max() - pnl.index.min()
    cut = max(pnl.index.max() - pd.DateOffset(months=holdout_months), pnl.index.min() + span * 2 / 3)
    dev = (pnl.index <= cut)
    trials = []
    for p in GRID:
        r = run(df, pnl, symbol, p)
        trials.append((stats.sharpe(r["daily"].to_numpy()[dev]), p, r))
    trial_sharpes = [s / np.sqrt(stats.TRADING_DAYS) for s, _, _ in trials]   # per-day, for the DSR
    best_sharpe, best_p, best = max(trials, key=lambda x: x[0])
    return {
        "symbol": symbol, "chosen": asdict(best_p), "holdout_from": str((cut + pd.Timedelta(days=1)).date()),
        "grid": [{"window": p.window, "z_in": p.z_in, "dev_sharpe": s} for s, p, _ in trials],
        "development": summarise(best, dev, trial_sharpes),
        "holdout": summarise(best, ~dev),
        "full": summarise(best, None, trial_sharpes),
        "result": best,
    }
