"""Run the full analysis and write data/results.json for the API and dashboard.

Usage:  python -m aura.report
"""
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

from aura import analytics, backtest
from aura.backtest import Costs, Params

OUT = Path(__file__).resolve().parent.parent / "data" / "results.json"


def _clean(x):
    """JSON-safe: NaN/inf -> None, numpy and pandas scalars -> Python."""
    if isinstance(x, dict):
        return {str(k): _clean(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [_clean(v) for v in x]
    if isinstance(x, (pd.Timestamp,)):
        return x.date().isoformat()
    if hasattr(x, "isoformat"):
        return x.isoformat()
    if isinstance(x, (np.integer,)):
        return int(x)
    if isinstance(x, (np.floating, float)):
        return None if not math.isfinite(float(x)) else round(float(x), 4)
    return x


def describe(s: pd.Series) -> dict:
    s = s.dropna()
    return {"n": len(s), "mean": s.mean(), "sd": s.std(), "median": s.median(), "p05": s.quantile(0.05),
            "p95": s.quantile(0.95), "min": s.min(), "max": s.max(), "share_positive": (s > 0).mean()}


def half_life(s: pd.Series) -> float | None:
    """AR(1) mean-reversion speed in sessions."""
    s = s.dropna()
    x, dy = (s - s.mean()).iloc[:-1].to_numpy(), np.diff(s.to_numpy())
    b = float((x * dy).sum() / (x * x).sum())
    return -math.log(2) / math.log(1 + b) if -1 < b < 0 else None


def signals(pnl: pd.DataFrame, p: Params, hurdle_bps: float) -> list[dict]:
    """Latest reading per pair, with the reason it is or is not a trade."""
    out = []
    for sym, col in backtest.PREMIUM_COL.items():
        hist = pnl[col].dropna()
        if len(hist) <= p.window:
            continue
        w, now = hist.iloc[-p.window - 1:-1], hist.iloc[-1]
        z = (now - w.mean()) / w.std()
        gap = now - w.mean()
        dte = (pnl["expiry"].iloc[-1] - pnl.index[-1]).days
        if abs(z) < p.z_in:
            why = f"|z| {abs(z):.1f} below {p.z_in} - normal noise"
        elif abs(gap) < hurdle_bps:
            why = f"gap {abs(gap):.1f} bps cannot clear the {hurdle_bps:.0f} bps cost hurdle"
        elif dte < p.entry_dte:
            why = f"only {dte} days to expiry - too close to delivery"
        else:
            why = ("rich" if z > 0 else "cheap") + f" by {abs(gap):.1f} bps vs its {p.window}-session mean"
        out.append({"pair": f"{sym} vs GOLDTEN", "session": pnl.index[-1], "expiry": pnl["expiry"].iloc[-1],
                    "premium_bps": now, "mean_bps": w.mean(), "z": z, "gap_bps": gap, "dte": dte,
                    "action": "trade" if why.startswith(("rich", "cheap")) else "no trade", "why": why})
    return out


def main() -> None:
    df = analytics.load()
    pnl = analytics.panel(df)
    roll = analytics.roll_down_split(df)
    life = analytics.lifecycle(df)

    wf = {sym: backtest.walk_forward(df, pnl, sym) for sym in backtest.PAIRS}
    c = Costs()
    leg = 14.8e5
    # bps of one leg's notional: both legs bought once and sold once over a round trip
    hurdle = sum(c.leg(s, leg, side) for s in ("GOLDTEN", "GOLDPETAL") for side in ("buy", "sell")) / leg * 1e4

    res = {
        "data": {"from": pnl.index.min(), "to": pnl.index.max(), "sessions": len(pnl),
                 "rows": len(df), "contracts": int(df.groupby(["symbol", "expiry"]).ngroups)},
        "premiums": {
            "GOLDPETAL": {**describe(pnl["prem_petal"]), "half_life": half_life(pnl["prem_petal"])},
            "GOLDGUINEA": {**describe(pnl["prem_guinea"]), "half_life": half_life(pnl["prem_guinea"])},
            "GOLDM_naive": describe(pnl["m_naive"]),
            "GOLDM_purity": describe(pnl["m_purity"]),
            "GOLDM_carry": {**describe(pnl["m_carry"]), "half_life": half_life(pnl["m_carry"])},
        },
        "carry_pa": describe(pnl["carry_pa"]),
        "roll_split": {
            "days": len(roll), "var_total": roll["total"].var(), "var_roll": roll["roll"].var(), "var_shift": roll["shift"].var(),
            "mean_roll_bps": roll["roll"].mean() * 1e4, "mean_shift_bps": roll["shift"].mean() * 1e4,
            "share_abs_move_from_roll": (roll["roll"].abs().sum() / (roll["roll"].abs() + roll["shift"].abs()).sum()),
        },
        "lifecycle": life.to_dict(orient="records"),
        "hurdle_bps": hurdle,
        "backtest": {sym: {k: v for k, v in r.items() if k != "result"} for sym, r in wf.items()},
        "trades": {sym: r["result"]["trades"] for sym, r in wf.items()},
        "signals": signals(pnl, Params(**{k: wf["GOLDPETAL"]["chosen"][k] for k in ("window", "z_in")}), hurdle),
        "series": {
            "session": list(pnl.index),
            "ten_fine": pnl["ten_fine"].tolist(), "petal_fine": pnl["petal_fine"].tolist(),
            "guinea_fine": pnl["guinea_fine"].tolist(), "m_fine": pnl["m_fine"].tolist(),
            "prem_petal": pnl["prem_petal"].tolist(), "prem_guinea": pnl["prem_guinea"].tolist(),
            "m_naive": pnl["m_naive"].tolist(), "m_purity": pnl["m_purity"].tolist(), "m_carry": pnl["m_carry"].tolist(),
            "carry_pa": pnl["carry_pa"].tolist(),
            "equity": {sym: r["result"]["daily"].cumsum().tolist() for sym, r in wf.items()},
        },
    }
    OUT.write_text(json.dumps(_clean(res), indent=1), encoding="utf-8")
    print(json.dumps(_clean({k: res[k] for k in ("data", "premiums", "carry_pa", "roll_split", "hurdle_bps")}), indent=1))
    for sym, r in wf.items():
        print(sym, "chosen", r["chosen"]["window"], r["chosen"]["z_in"])
        for part in ("development", "holdout"):
            print(" ", part, json.dumps(_clean(r[part])))


if __name__ == "__main__":
    main()
