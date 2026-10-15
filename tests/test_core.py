from datetime import date

import numpy as np
import pandas as pd
import pytest

from aura import backtest, stats
from aura.analytics import curve_at
from aura.ingest import expiry_date, request_date, response_date
from aura.specs import fine_per_gram, quote_units


# ---- data traps from the brief

def test_request_and_response_dates_use_opposite_orders():
    assert request_date(date(2026, 10, 7)) == "07/10/2026"          # DD/MM/YYYY out
    assert response_date("10/07/2026") == date(2026, 10, 7)          # MM/DD/YYYY back


def test_expiry_is_parsed_from_contract_id():
    assert expiry_date("04SEP2026") == date(2026, 9, 4)
    assert expiry_date("30OCT2026 ") == date(2026, 10, 30)


# ---- normalisation: real MCX closes from 07 Oct 2026 (expiry 30 Oct 2026)

def test_normalisation_matches_hand_worked_example():
    assert fine_per_gram("GOLDTEN", 148276) == pytest.approx(14842.44, abs=0.01)
    assert fine_per_gram("GOLDGUINEA", 119074) == pytest.approx(14899.15, abs=0.01)
    assert fine_per_gram("GOLDPETAL", 14887) == pytest.approx(14901.90, abs=0.01)
    assert fine_per_gram("GOLDM", 147897) == pytest.approx(14864.02, abs=0.01)


def test_whole_lot_hedges_hold_equal_grams():
    assert quote_units("GOLDPETAL", 100) * 1 == quote_units("GOLDTEN", 10) * 10      # 100 g each
    assert quote_units("GOLDGUINEA", 10) * 8 == quote_units("GOLDTEN", 8) * 10       # 80 g each


def test_curve_interpolates_log_linearly():
    ten = pd.DataFrame({"expiry": pd.to_datetime(["2026-10-30", "2026-11-30"]),
                        "fine": [fine_per_gram("GOLDTEN", 148276), fine_per_gram("GOLDTEN", 149571)]})
    at_nov5 = curve_at(ten, pd.Timestamp("2026-11-05"))
    assert fine_per_gram("GOLDM", 147897) / at_nov5 - 1 == pytest.approx(-2.3e-4, abs=0.1e-4)


# ---- costs

def test_statutory_round_trip_is_about_1_7_bps_per_leg():
    c = backtest.Costs(brokerage=0.0, slip_bps={"GOLDTEN": 0.0})
    notional = 1e5
    round_trip = c.leg("GOLDTEN", notional, "buy") + c.leg("GOLDTEN", notional, "sell")
    assert round_trip == pytest.approx(17.19, abs=0.01)     # Rs per Rs 1 lakh


# ---- no look-ahead: changing the future must not change past decisions

def _toy(n=160, seed=1):
    rng = np.random.default_rng(seed)
    sessions = pd.bdate_range("2025-01-01", periods=n)
    expiry = pd.Timestamp("2026-12-31")
    prem = 40 + np.cumsum(rng.normal(0, 3, n)) * 0.3 + rng.normal(0, 4, n)
    ten = 15000 * np.exp(np.cumsum(rng.normal(0, 0.01, n)))
    petal = ten * 0.999 * (1 + prem / 1e4) / 0.999
    rows = []
    for t, a, b in zip(sessions, ten, petal):
        rows.append((t, "GOLDTEN", expiry, a * 10 * 0.999, a))
        rows.append((t, "GOLDPETAL", expiry, b * 0.999, b))
    df = pd.DataFrame(rows, columns=["session", "symbol", "expiry", "close", "fine"])
    pnl = pd.DataFrame({"expiry": expiry, "ten_fine": ten, "prem_petal": (petal / ten - 1) * 1e4}, index=sessions)
    return df, pnl


def test_future_data_cannot_change_past_trades():
    df, pnl = _toy()
    base = backtest.run(df, pnl, "GOLDPETAL")
    cut = pnl.index[120]
    df2 = df.copy()
    later = df2["session"] > cut
    df2.loc[later, "close"] *= 1.05
    df2.loc[later, "fine"] *= 1.05
    pnl2 = pnl.copy()
    pnl2.loc[pnl2.index > cut, "prem_petal"] += 500.0
    shocked = backtest.run(df2, pnl2, "GOLDPETAL")
    past = lambda r: [t for t in r["trades"] if pd.Timestamp(t["exit"]) <= cut]
    assert past(base) == past(shocked)
    assert np.allclose(base["daily"].loc[:cut], shocked["daily"].loc[:cut])


def test_bootstrap_is_reproducible():
    x = np.random.default_rng(3).normal(0.1, 1, 300)
    assert stats.bootstrap_pvalue(x) == stats.bootstrap_pvalue(x)
