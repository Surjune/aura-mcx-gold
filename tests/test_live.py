import json
from datetime import date

import pytest

from aura.live import classify, parse_quote
from aura.specs import fine_per_gram

# Trimmed real MCX GetQuote response (GOLDPETAL, 15 Oct 2026).
QUOTE = json.dumps({
    "Summary": {"AsOn": "/Date(1792041000000)/", "Count": 1, "Status": None},
    "Data": [{"Symbol": "GOLDPETAL", "LTP": 14714.0, "PreviousClose": 14591.0, "PercentChange": 0.84, "Volume": 37302,
              "OpenInterest": 200895,
              "QuoteBid": [{"BidPrice": 14713.0, "BidVolume": 10, "AskPrice": 14715.0, "AskVolume": 4}]}],
})
HIST = {"mean": 33.3, "sd": 10.0, "window": 40, "z_in": 1.5}


def test_quote_parses_book_and_exchange_time():
    q = parse_quote("GOLDPETAL", date(2026, 10, 30), QUOTE)
    assert (q["bid"], q["ask"], q["ltp"]) == (14713.0, 14715.0, 14714.0)
    assert q["as_on"] == 1792041000.0
    assert q["spread_bps"] == pytest.approx(2 / 14714 * 1e4, rel=1e-6)
    assert q["fine"] == pytest.approx(fine_per_gram("GOLDPETAL", 14714.0))


def test_inside_normal_range_is_noise():
    p = classify("x", 40.0, 39.0, 41.0, HIST, hurdle=13.0, tradeable=True)
    assert p["status"] == "normal"


def test_unusual_but_not_executable_is_watch_only():
    # z = 2.2 on last trade, but selling at the bid captures only 9.7 bps over the mean: below the hurdle
    p = classify("x", 55.0, 43.0, 57.0, HIST, hurdle=13.0, tradeable=True)
    assert p["status"] == "watch"


def test_flag_requires_executable_gap_above_hurdle():
    p = classify("x", 60.0, 50.0, 62.0, HIST, hurdle=13.0, tradeable=True)
    assert p["status"] == "flagged" and p["exec_gap_bps"] == pytest.approx(16.7)


def test_different_expiry_pair_is_never_flagged():
    p = classify("GOLDM", 60.0, None, None, HIST, hurdle=13.0, tradeable=False)
    assert p["status"] == "watch"
