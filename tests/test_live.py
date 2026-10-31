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


def test_published_tick_carries_last_trade_and_executable_premiums(tmp_path, monkeypatch):
    from aura import live
    monkeypatch.setattr(live, "LIVE", tmp_path / "live.json")
    monkeypatch.setattr(live, "TICKS", tmp_path / "ticks.json")
    monkeypatch.delenv("KV_REST_API_URL", raising=False)
    pair = classify("x", 40.0, 39.0, 41.0, HIST, hurdle=13.0, tradeable=True)
    live.publish({"as_on": 1.0, "published": 100.0, "pairs": [pair]})
    tick = json.loads((tmp_path / "ticks.json").read_text())[-1]
    assert tick == {"t": 100, "p0": 40.0, "e0": 39.0}


def test_new_trading_day_starts_a_fresh_chart(tmp_path, monkeypatch):
    from aura import live
    monkeypatch.setattr(live, "LIVE", tmp_path / "live.json")
    monkeypatch.setattr(live, "TICKS", tmp_path / "ticks.json")
    monkeypatch.delenv("KV_REST_API_URL", raising=False)
    pair = classify("x", 40.0, 39.0, 41.0, HIST, hurdle=13.0, tradeable=True)
    day1, day2 = 1792040000, 1792040000 + 86400
    live.publish({"published": day1, "pairs": [pair]})
    live.publish({"published": day2, "pairs": [pair]})
    assert [t["t"] for t in json.loads((tmp_path / "ticks.json").read_text())] == [day2]


def test_api_replays_committed_session_when_no_poller_runs(tmp_path, monkeypatch):
    import time
    from aura import api
    monkeypatch.setattr(api, "LIVE", tmp_path / "missing.json")
    monkeypatch.setattr(api, "SESSION", tmp_path / "session.json")
    for k in ("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"):
        monkeypatch.delenv(k, raising=False)
    snap = {"published": time.time() - 5, "poll_s": 15, "market_open": True, "pairs": []}  # recent, yet archived
    (tmp_path / "session.json").write_text(json.dumps({"snapshot": snap, "ticks": [{"t": 1}]}))
    out = api.live()
    assert out["status"] == "replay" and out["source"] == "session archive" and out["ticks"] == [{"t": 1}]


def test_api_reports_live_for_a_fresh_snapshot(tmp_path, monkeypatch):
    import time
    from aura import api
    monkeypatch.setattr(api, "LIVE", tmp_path / "live.json")
    monkeypatch.setattr(api, "TICKS", tmp_path / "ticks.json")
    for k in ("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"):
        monkeypatch.delenv(k, raising=False)
    (tmp_path / "live.json").write_text(json.dumps({"published": time.time(), "poll_s": 15, "market_open": True}))
    assert api.live()["status"] == "live"


def test_api_uses_45_second_cloud_freshness_contract(tmp_path, monkeypatch):
    import time
    from aura import api
    monkeypatch.setattr(api, "LIVE", tmp_path / "live.json")
    monkeypatch.setattr(api, "TICKS", tmp_path / "ticks.json")
    monkeypatch.setenv("LIVE_FRESH_SECONDS", "45")
    for key in ("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"):
        monkeypatch.delenv(key, raising=False)

    (tmp_path / "live.json").write_text(json.dumps({"published": time.time() - 44, "poll_s": 15, "market_open": True}))
    fresh = api.live()
    assert fresh["status"] == "live" and fresh["fresh_after_s"] == 45

    (tmp_path / "live.json").write_text(json.dumps({"published": time.time() - 46, "poll_s": 15, "market_open": True}))
    assert api.live()["status"] == "delayed"


def test_different_expiry_pair_is_never_flagged():
    p = classify("GOLDM", 60.0, None, None, HIST, hurdle=13.0, tradeable=False)
    assert p["status"] == "watch"


def test_repeated_poll_failures_relaunch_the_browser(monkeypatch):
    from aura import live
    monkeypatch.setattr(live, "pick_contracts",
                        lambda d: {"ten": date(2099, 1, 30), "ten_next": date(2099, 2, 27), "m": date(2099, 2, 5)})
    monkeypatch.setattr(live, "market_open", lambda now: True)
    monkeypatch.setattr(live.time, "sleep", lambda s: None)

    class DeadPage:  # what Playwright looks like after the PC wakes from sleep
        def goto(self, *a, **k):
            raise RuntimeError("Connection closed while reading from the driver")

        evaluate = goto

    with pytest.raises(live.BrowserLost):
        live.loop(DeadPage(), {}, "")


def test_quote_keeps_the_real_order_book_depth():
    body = json.loads(QUOTE)
    body["Data"][0]["QuoteBid"].append({"BidPrice": 14712.0, "BidVolume": 25, "AskPrice": 0, "AskVolume": 0})
    depth = parse_quote("GOLDPETAL", date(2026, 10, 30), json.dumps(body))["depth"]
    assert depth == [{"bid": 14713.0, "bid_qty": 10, "ask": 14715.0, "ask_qty": 4},
                     {"bid": 14712.0, "bid_qty": 25, "ask": None, "ask_qty": None}]   # empty side stays empty


def test_api_falls_back_to_archive_when_upstash_is_down(tmp_path, monkeypatch):
    import time
    import urllib.error
    from aura import api
    monkeypatch.setenv("KV_REST_API_URL", "https://example.invalid")
    monkeypatch.setenv("KV_REST_API_TOKEN", "x")
    monkeypatch.setattr(api, "LIVE", tmp_path / "missing.json")
    monkeypatch.setattr(api, "SESSION", tmp_path / "session.json")

    def down(_cmds):
        raise urllib.error.URLError("connection refused")

    monkeypatch.setattr(api, "_upstash", down)
    snap = {"published": time.time() - 5, "poll_s": 15, "market_open": True, "pairs": []}
    (tmp_path / "session.json").write_text(json.dumps({"snapshot": snap, "ticks": []}))
    out = api.live()
    assert out["status"] == "replay" and out["source"] == "session archive"


def test_upstash_outage_does_not_fail_the_poll(tmp_path, monkeypatch):
    import urllib.error
    from aura import live
    monkeypatch.setattr(live, "LIVE", tmp_path / "live.json")
    monkeypatch.setattr(live, "TICKS", tmp_path / "ticks.json")
    monkeypatch.setenv("KV_REST_API_URL", "https://example.invalid")
    monkeypatch.setenv("KV_REST_API_TOKEN", "x")

    def down(*_a, **_k):
        raise urllib.error.URLError("connection refused")

    monkeypatch.setattr(live.urllib.request, "urlopen", down)
    pair = classify("x", 40.0, 39.0, 41.0, HIST, hurdle=13.0, tradeable=True)
    live.publish({"published": 100.0, "pairs": [pair]})   # must not raise
    assert json.loads((tmp_path / "live.json").read_text())["published"] == 100.0


def test_stale_exchange_stamp_means_not_trading():
    from aura.live import STALE_S, exchange_stale
    now = 1_800_000_000
    assert exchange_stale(now - STALE_S - 1, now)      # holiday morning: last update was last night
    assert not exchange_stale(now - 60, now)           # normal session: stamp moves every minute
