from datetime import date

import pytest

from aura.angel_one import (Instrument, parse_expiry, pick_contracts_from_master,
                             quote_from_market_data, quote_from_tick, resolve_instruments)


def test_parse_angel_expiry_formats():
    expected = date(2026, 10, 30)
    assert parse_expiry("30OCT2026") == expected
    assert parse_expiry("30-Oct-2026") == expected
    assert parse_expiry("2026-10-30") == expected
    assert parse_expiry("") is None


def test_resolve_instruments_uses_exact_symbol_and_expiry(monkeypatch):
    monkeypatch.delenv("ANGEL_MCX_TOKENS_JSON", raising=False)
    contracts = {"ten": date(2026, 10, 30), "ten_next": date(2026, 11, 30), "m": date(2026, 11, 5)}
    rows = [
        {"exch_seg": "MCX", "name": "GOLDTEN", "expiry": "30OCT2026", "token": "101"},
        {"exch_seg": "MCX", "name": "GOLDTEN", "expiry": "30NOV2026", "token": "102"},
        {"exch_seg": "MCX", "name": "GOLDPETAL", "expiry": "30OCT2026", "token": "103"},
        {"exch_seg": "MCX", "name": "GOLDGUINEA", "expiry": "30OCT2026", "token": "104"},
        {"exch_seg": "MCX", "name": "GOLDM", "expiry": "05NOV2026", "token": "105"},
        # Same contract name but wrong expiry must never replace the selected front month.
        {"exch_seg": "MCX", "name": "GOLDPETAL", "expiry": "30NOV2026", "token": "wrong"},
    ]
    rows = [dict(row, instrumenttype="FUTCOM") for row in rows]
    rows.append(dict(rows[-2], instrumenttype="OPTFUT", token="option"))
    instruments = resolve_instruments(contracts, rows)
    assert {leg: item.token for leg, item in instruments.items()} == {
        "ten": "101", "ten_next": "102", "petal": "103", "guinea": "104", "m": "105"}


def test_cloud_worker_can_select_contracts_from_instrument_master_without_duckdb():
    rows = [
        {"exch_seg": "MCX", "name": "GOLDTEN", "expiry": "30OCT2026"},
        {"exch_seg": "MCX", "name": "GOLDTEN", "expiry": "30NOV2026"},
        {"exch_seg": "MCX", "name": "GOLDM", "expiry": "05NOV2026"},
        # Expiry too close to delivery must not be used.
        {"exch_seg": "MCX", "name": "GOLDTEN", "expiry": "24OCT2026"},
    ]
    rows = [dict(row, instrumenttype="FUTCOM") for row in rows]
    rows.append({"exch_seg": "MCX", "name": "GOLDM", "expiry": "30OCT2026",
                 "instrumenttype": "OPTFUT", "token": "option"})
    assert pick_contracts_from_master(date(2026, 10, 20), rows) == {
        "ten": date(2026, 10, 30), "ten_next": date(2026, 11, 30), "m": date(2026, 11, 5)}


def test_quote_from_snap_quote_converts_paise_and_best_bid_ask():
    item = Instrument("petal", "GOLDPETAL", date(2026, 10, 30), "103")
    quote = quote_from_tick({
        "last_traded_price": 1471400,
        "closed_price": 1460000,
        "best_5_buy_data": [{"price": 1471300}],
        "best_5_sell_data": [{"price": 1471500}],
        "volume_trade_today": 12,
        "open_interest": 9,
        "exchange_timestamp": 1793388600000,
    }, item, 100)
    assert quote["ltp"] == 14714
    assert quote["bid"] == 14713
    assert quote["ask"] == 14715
    # GOLDPETAL is 999 purity, so AuRA converts it to grams of fine gold.
    assert quote["fine"] == pytest.approx(14714 / 0.999)
    assert quote["spread_bps"] == pytest.approx(1.359, rel=1e-3)


def test_quote_depth_converts_every_level_from_paise():
    item = Instrument("ten", "GOLDTEN", date(2026, 10, 30), "101")
    quote = quote_from_tick({
        "last_traded_price": 14536000,
        "best_5_buy_data": [{"price": 14535000, "quantity": 7}, {"price": 14534000, "quantity": 3}],
        "best_5_sell_data": [{"price": 14537000, "quantity": 5}],
    }, item, 100)
    assert quote["depth"] == [{"bid": 145350, "bid_qty": 7, "ask": 145370, "ask_qty": 5},
                              {"bid": 145340, "bid_qty": 3, "ask": None, "ask_qty": None}]


def test_rest_market_data_quote_preserves_rupees_and_depth():
    item = Instrument("petal", "GOLDPETAL", date(2026, 10, 30), "103")
    quote = quote_from_market_data({
        "ltp": 14714,
        "close": 14600,
        "percentChange": 0.78,
        "tradeVolume": 12,
        "opnInterest": 9,
        "depth": {
            "buy": [{"price": 14713, "quantity": 7}],
            "sell": [{"price": 14715, "quantity": 5}],
        },
    }, item)
    assert (quote["ltp"], quote["bid"], quote["ask"], quote["prev_close"]) == (14714, 14713, 14715, 14600)
    assert quote["depth"] == [{"bid": 14713, "bid_qty": 7, "ask": 14715, "ask_qty": 5}]
