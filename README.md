# AuRA: Aurum Relative-value Analytics

**Team Lightning Logics · Hack in Hills '26 · Track 03: Commodity Derivatives Intelligence**

MCX lists four gold futures on the same metal: GOLDM, GOLDTEN, GOLDGUINEA and GOLDPETAL.
Once lot size, quote unit, purity and delivery date are accounted for, their prices should
agree. AuRA measures where they don't, separates mechanical carry from genuine dislocation,
and tests on unseen data whether any gap survives real trading costs. Proving that no edge
survives costs is an accepted outcome for this track, and AuRA reports it as plainly as an edge.

## Results (MCX bhavcopy, 01 Jan 2024 – 14 Oct 2026)

716 sessions and 11,789 contract-days ingested; GOLDTEN pairs cover 395 sessions from its
April 2025 listing.

**Verdict: no persistent edge survives costs out of sample.**

| PETAL vs GOLDTEN, net of all costs | Development (Apr 2025 – Apr 2026) | Holdout (Apr – Oct 2026, untouched) |
|---|---|---|
| Trades | 14 | 7 |
| Net bps per trade | +22.1 | −1.4 |
| Net bps per trade, excluding the best trade | +7.6 | −3.7 |
| Sharpe (annualised) | 0.92 | −0.45 |
| Block-bootstrap p-value | 0.12 | 0.76 |
| Deflated Sharpe probability (9 trials) | 0.74 | 0.38 |

78% of the development profit came from a single exit at the 30 January 2026 close, a
gold sell-off day on which contracts closed at inconsistent prices that could not have been
traded. GUINEA vs GOLDTEN made 4 development trades and none in the holdout.

What the data does show:

- **Small lots carry a standing premium.** GOLDPETAL's median premium to GOLDTEN for the same
  expiry is +69 bps and it never fell below +11 bps; GOLDGUINEA's median is +51 bps. It is
  structural, not a mispricing that converges.
- **The carry trap is real.** GOLDM looks 24.6 bps cheap against GOLDTEN on a naive per-gram
  comparison; after purity it is +15.5 bps and after carry +6.7 bps (medians, 395 sessions).
- **Carry and roll-down.** The GOLDTEN front curve implies a median 9.7% a year carry;
  mechanical roll-down accounts for about 4% of a typical day's move, the rest is genuine shift.
- **Lifecycle.** A new contract takes a median 58 sessions (PETAL, GUINEA), 68 (GOLDTEN) or
  37 (GOLDM) from first trade to carrying half its symbol's open interest.

## What it does

| Track 03 direction | Where |
|---|---|
| Cross-contract relative value: size, quote unit, purity (995 vs 999) | `aura/specs.py`, `analytics.panel` |
| Term structure and carry: futures curve, roll-down vs genuine curve shift | `analytics.curve_at`, `analytics.roll_down_split` |
| Walk-forward backtest: day-by-day, no look-ahead, slippage and liquidity | `aura/backtest.py`, test `test_future_data_cannot_change_past_trades` |
| Trader-facing intelligence: suppress noise, isolate edge from gold beta | dashboard signals (z-score **and** cost hurdle), beta and correlation per backtest |
| Contract lifecycle: listing, liquidity maturation, delivery window, expiry | `analytics.lifecycle`, dashboard table |

Data rules from the brief, all enforced in `aura/ingest.py`:
request dates are DD/MM/YYYY while responses are MM/DD/YYYY; a holiday may return no rows or
the last session (both are skipped, never counted as a new session); contracts are tracked by
exact expiry, never a near-month series; untraded rows are dropped because their close is not
a tradeable price; GOLDTEN only lists from April 2025, so its pairs have a shorter history.

## Method

1. **Normalise**: ₹ per gram of fine gold = price ÷ quote grams ÷ purity.
2. **Premium** vs GOLDTEN for the same expiry, in bps. Same delivery date, so carry cancels.
3. **GOLDM** expires on a different date, so it is compared with the GOLDTEN curve read at
   GOLDM's expiry (log-linear between the nearest expiries).
4. **Signal**: z-score of the premium against its trailing window (past sessions only). Enter
   when |z| exceeds the threshold, exit when it reverts, after a maximum hold, or before the
   delivery window. Decisions at close t execute at close t+1.
5. **Hedge** in whole lots holding equal grams: 100 PETAL vs 10 TEN, 10 GUINEA vs 8 TEN.
6. **Costs** per leg per side: MCX fee 0.0021%, SEBI fee 0.0001%, stamp duty 0.002% (buy),
   CTT 0.01% (sell), GST 18% on fees and brokerage, ₹20 brokerage per order, and an assumed
   slippage of 1.5 bps (GOLDTEN) or 3 bps (PETAL, GUINEA).
7. **Validation**: parameters are chosen on the development period only from a 9-point grid;
   the final 6 months are an untouched holdout. Reported per period: trades, win rate, gross,
   cost and net bps per trade, Sharpe, max drawdown, correlation and beta to gold, a block
   bootstrap p-value and the deflated Sharpe ratio (which accounts for the 9 trials).

## Run it

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt   # Windows; use .venv/bin/python elsewhere
.venv/Scripts/python -m aura.ingest --start 2024-01-01      # pulls MCX bhavcopy into data/
.venv/Scripts/python -m aura.report                         # writes data/results.json
.venv/Scripts/python -m uvicorn aura.api:app --port 8000    # dashboard at http://localhost:8000
.venv/Scripts/python -m pytest -q
```

MCX's site rejects plain HTTP clients, so `aura.ingest` drives Microsoft Edge through
Playwright and calls the same endpoint the public bhavcopy page uses. Every raw response is
cached in `data/raw/`, so analysis is reproducible and re-runs never re-fetch a day.

## API

| Endpoint | Returns |
|---|---|
| `GET /api/summary` | data coverage, premium statistics, carry, roll-down split, cost hurdle |
| `GET /api/signals` | today's reading per pair and why it is or is not a trade |
| `GET /api/backtest` | development and holdout results, every trade |
| `GET /api/contracts` | lifecycle per contract |
| `GET /api/series` | daily series behind the charts |

## Limitations

- Bhavcopy closes are used as fill prices plus assumed slippage; no intraday or order-book data.
- Slippage and the brokerage fee are assumptions; statutory rates should be checked against a
  broker contract note.
- GOLDTEN pairs have about 18 months of history, so the holdout is short and results carry
  wide uncertainty; the bootstrap and deflated Sharpe are reported for exactly this reason.

## Team

| Member | Role |
|---|---|
| R S Surjune | Team lead, quant and backend |
| Abhinandana B | Market research and modelling |
| Nithiesh Karthick | Frontend and visualisation |
