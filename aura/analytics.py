"""Normalisation, cross-contract premiums, GOLDTEN curve, roll-down split and lifecycle map."""
from pathlib import Path

import duckdb
import numpy as np
import pandas as pd

from aura.constants import MIN_DTE
from aura.specs import BASE, CONTRACTS, SYMBOLS, fine_per_gram

DB = Path(__file__).resolve().parent.parent / "data" / "aura.duckdb"
DELIVERY_WINDOW_SESSIONS = 5  # staggered-delivery period before expiry (brokers ask to exit ~5 sessions early)
LIQUID_SHARE = 0.5     # a contract is "mature" once it carries this share of its symbol's open interest


def load(db: Path = DB) -> pd.DataFrame:
    """Traded rows only: an untraded contract's close is a stale or theoretical price."""
    con = duckdb.connect(str(db), read_only=True)
    df = con.execute("SELECT * FROM bhavcopy WHERE volume_lots > 0 AND close > 0").df()
    con.close()
    df["session"] = pd.to_datetime(df["session"])
    df["expiry"] = pd.to_datetime(df["expiry"])
    df["dte"] = (df["expiry"] - df["session"]).dt.days
    df["fine"] = [fine_per_gram(s, p) for s, p in zip(df["symbol"], df["close"])]
    return df


def _anchor(rows: pd.DataFrame) -> pd.Series | None:
    """Most open interest among contracts outside the delivery window."""
    ok = rows[rows["dte"] >= MIN_DTE]
    return None if ok.empty else ok.loc[ok["oi_lots"].idxmax()]


def curve_at(ten: pd.DataFrame, target: pd.Timestamp) -> float | None:
    """GOLDTEN fine price at `target` expiry: log-linear between the two nearest expiries."""
    pts = ten.sort_values("expiry")
    if len(pts) < 2:
        return None
    x = pts["expiry"].map(pd.Timestamp.toordinal).to_numpy(dtype=float)
    y = np.log(pts["fine"].to_numpy())
    t = float(target.toordinal())
    i = int(np.searchsorted(x, t))
    i = min(max(i, 1), len(x) - 1)
    return float(np.exp(y[i - 1] + (y[i] - y[i - 1]) * (t - x[i - 1]) / (x[i] - x[i - 1])))


def panel(df: pd.DataFrame) -> pd.DataFrame:
    """One row per session: normalised prices, premiums (bps) and curve carry."""
    out = []
    for session, day in df.groupby("session"):
        books = {s: day[day["symbol"] == s] for s in SYMBOLS}
        ten = books[BASE]
        a = _anchor(ten)
        if a is None:
            continue
        rec = {"session": session, "expiry": a["expiry"], "ten_fine": a["fine"], "ten_close": a["close"]}
        for s, col in (("GOLDPETAL", "petal"), ("GOLDGUINEA", "guinea")):
            leg = books[s][books[s]["expiry"] == a["expiry"]]
            rec[f"{col}_fine"] = leg["fine"].iloc[0] if len(leg) else np.nan
            rec[f"prem_{col}"] = (rec[f"{col}_fine"] / a["fine"] - 1) * 1e4 if len(leg) else np.nan
        m = _anchor(books["GOLDM"])
        if m is not None:
            fitted = curve_at(ten, m["expiry"])
            rec.update(
                m_expiry=m["expiry"], m_fine=m["fine"],
                m_naive=((m["close"] / CONTRACTS["GOLDM"].quote_g) / (a["close"] / CONTRACTS[BASE].quote_g) - 1) * 1e4,
                m_purity=(m["fine"] / a["fine"] - 1) * 1e4,
                m_carry=(m["fine"] / fitted - 1) * 1e4 if fitted else np.nan,
            )
        front = ten[ten["dte"] >= MIN_DTE].sort_values("expiry").head(2)  # skip contracts in delivery
        if len(front) == 2:
            f0, f1 = front.iloc[0], front.iloc[1]
            days = (f1["expiry"] - f0["expiry"]).days
            rec["carry_pa"] = np.log(f1["close"] / f0["close"]) / days * 365 * 100  # % a year
            rec["slope_per_day"] = np.log(f1["close"] / f0["close"]) / days
        rec["turnover_cr"] = {s: float((books[s]["volume_lots"] * CONTRACTS[s].lot_g * books[s]["close"]
                                        / CONTRACTS[s].quote_g).sum() / 1e7) for s in SYMBOLS}
        out.append(rec)
    return pd.DataFrame(out).set_index("session")


def roll_down_split(df: pd.DataFrame) -> pd.DataFrame:
    """Daily log move of each GOLDTEN contract = mechanical roll-down + genuine curve shift.

    Roll-down is what the move would have been had yesterday's curve stayed put while the
    contract aged by the elapsed days: -slope x days. The rest is a genuine shift.
    """
    ten = df[df["symbol"] == BASE].sort_values(["expiry", "session"])
    p = panel_slopes(df)
    recs = []
    for expiry, g in ten.groupby("expiry"):
        g = g.set_index("session")
        for (t0, r0), (t1, r1) in zip(g.iloc[:-1].iterrows(), g.iloc[1:].iterrows()):
            if t0 not in p.index or r1["dte"] < MIN_DTE:
                continue
            total = np.log(r1["close"] / r0["close"])
            roll = -p.loc[t0] * (t1 - t0).days
            recs.append({"session": t1, "expiry": expiry, "total": total, "roll": roll, "shift": total - roll})
    return pd.DataFrame(recs)


def panel_slopes(df: pd.DataFrame) -> pd.Series:
    """Per session: slope of log GOLDTEN price per day of expiry, from a least-squares fit."""
    ten = df[(df["symbol"] == BASE) & (df["dte"] >= MIN_DTE)]
    out = {}
    for s, g in ten.groupby("session"):
        if len(g) >= 2:
            out[s] = np.polyfit(g["dte"].to_numpy(float), np.log(g["close"].to_numpy()), 1)[0]
    return pd.Series(out)


def lifecycle(df: pd.DataFrame) -> pd.DataFrame:
    """Per contract: first and last traded session, when it became the liquid contract, delivery window."""
    total_oi = df.groupby(["session", "symbol"])["oi_lots"].transform("sum")
    df = df.assign(oi_share=df["oi_lots"] / total_oi.where(total_oi > 0))
    first_session, last_session = df["session"].min(), df["session"].max()
    sessions = sorted(df["session"].unique())
    recs = []
    for (sym, exp), g in df.groupby(["symbol", "expiry"]):
        g = g.sort_values("session")
        liquid = g[g["oi_share"] >= LIQUID_SHARE]
        if exp <= last_session:   # expiry inside the data: count real sessions back from expiry
            before_expiry = [s for s in sessions if s <= exp]
            window_start = before_expiry[-DELIVERY_WINDOW_SESSIONS] if len(before_expiry) >= DELIVERY_WINDOW_SESSIONS else None
        else:                     # future expiry: weekdays back from expiry (exchange holidays not known yet)
            window_start = np.busday_offset(exp.date(), -(DELIVERY_WINDOW_SESSIONS - 1), roll="backward")
        recs.append({
            "symbol": sym, "expiry": exp.date(),
            "first_traded": g["session"].iloc[0].date(),
            "listed_before_data": bool(g["session"].iloc[0] == first_session),
            "became_liquid": liquid["session"].iloc[0].date() if len(liquid) else None,
            "sessions_to_liquid": int((g["session"] < liquid["session"].iloc[0]).sum()) if len(liquid) else None,
            "peak_oi_lots": int(g["oi_lots"].max()),
            "delivery_window_from": pd.Timestamp(window_start).date() if window_start is not None else None,
            "last_traded": g["session"].iloc[-1].date(),
        })
    return pd.DataFrame(recs).sort_values(["symbol", "expiry"])
