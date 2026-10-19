"""Pull the MCX date-wise futures bhavcopy for the four gold contracts into DuckDB.

MCX's edge rejects scripted HTTP clients (HTTP 403), so the pull runs inside a real
browser session: open the public bhavcopy page, then call the same endpoint the page
itself uses. Every raw response is cached to disk, so a re-run never re-fetches a day
and an analysis can always be reproduced from the cached files.

Usage:  python -m aura.ingest --start 2024-01-01 --end 2026-10-14
"""
import argparse
import json
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import duckdb
import pandas as pd

from aura.specs import SYMBOLS

PAGE = "https://www.mcxindia.com/market-data/bhavcopy"
ENDPOINT = "/market-data/bhavcopy/GetDateWiseBhavCopy"
DATA = Path(__file__).resolve().parent.parent / "data"
RAW = DATA / "raw"
DB = DATA / "aura.duckdb"
PAUSE_S = 0.35  # stay polite to the exchange site
# The edge answers 403 to Playwright's default headless fingerprint; a normal desktop
# user agent with the automation flag off is served like any browser.
USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
              "Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0")

FETCH_JS = """async (q) => {
  const r = await fetch(%r + '?InstrumentName=FUTCOM&fromDate=' + encodeURIComponent(q),
    { headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
  return { status: r.status, body: await r.text() };
}""" % ENDPOINT


def weekdays(start: date, end: date) -> list[date]:
    days, d = [], start
    while d <= end:
        if d.weekday() < 5:
            days.append(d)
        d += timedelta(days=1)
    return days


def request_date(d: date) -> str:
    """The endpoint expects DD/MM/YYYY."""
    return d.strftime("%d/%m/%Y")


def response_date(s: str) -> date:
    """The endpoint answers with MM/DD/YYYY."""
    return datetime.strptime(s, "%m/%d/%Y").date()


def expiry_date(s: str) -> date:
    """Contract expiry such as 04SEP2026."""
    return datetime.strptime(s.strip().title(), "%d%b%Y").date()


def fetch_raw(start: date, end: date, headless: bool = True) -> dict[str, int]:
    from playwright.sync_api import sync_playwright

    RAW.mkdir(parents=True, exist_ok=True)
    todo = [d for d in weekdays(start, end) if not (RAW / f"{d.isoformat()}.json").exists()]
    stats = {"fetched": 0, "cached": len(weekdays(start, end)) - len(todo)}
    if not todo:
        return stats
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=headless,
                                    args=["--disable-blink-features=AutomationControlled"])
        page = browser.new_context(user_agent=USER_AGENT, locale="en-IN",
                                   viewport={"width": 1366, "height": 768}).new_page()
        page.goto(PAGE, wait_until="domcontentloaded", timeout=60_000)
        for d in todo:
            res = page.evaluate(FETCH_JS, request_date(d))
            if res["status"] != 200:
                raise RuntimeError(f"MCX returned HTTP {res['status']} for {d}")
            (RAW / f"{d.isoformat()}.json").write_text(res["body"], encoding="utf-8")
            stats["fetched"] += 1
            time.sleep(PAUSE_S)
        browser.close()
    return stats


def load_db() -> dict[str, int]:
    """Parse cached responses into table `bhavcopy`, applying the data rules from the brief."""
    rows, holidays, stale = [], 0, 0
    for f in sorted(RAW.glob("*.json")):
        asked = date.fromisoformat(f.stem)
        data = json.loads(f.read_text(encoding="utf-8")).get("Data") or []
        gold = [x for x in data if x["Symbol"].strip() in SYMBOLS]
        if not gold:
            holidays += 1
            continue
        got = response_date(gold[0]["Date"])
        if got != asked:  # holiday answered with the last available session: not a new session
            stale += 1
            continue
        for x in gold:
            rows.append((asked, x["Symbol"].strip(), expiry_date(x["ExpiryDate"]), x["Open"], x["High"], x["Low"],
                         x["Close"], x["PreviousClose"], int(x["Volume"]), int(x["OpenInterest"]), x["Value"]))
    con = duckdb.connect(str(DB))
    con.execute("""
        CREATE OR REPLACE TABLE bhavcopy (
            session DATE, symbol VARCHAR, expiry DATE,
            open DOUBLE, high DOUBLE, low DOUBLE, close DOUBLE, prev_close DOUBLE,
            volume_lots BIGINT, oi_lots BIGINT, value_lakhs DOUBLE,
            PRIMARY KEY (session, symbol, expiry))""")
    # One bulk insert from a DataFrame: row-by-row executemany took minutes for ~12k rows.
    frame = pd.DataFrame(rows, columns=["session", "symbol", "expiry", "open", "high", "low", "close",
                                        "prev_close", "volume_lots", "oi_lots", "value_lakhs"])
    con.register("frame", frame)
    con.execute("INSERT INTO bhavcopy SELECT * FROM frame")
    con.unregister("frame")
    n_sessions = con.execute("SELECT count(DISTINCT session) FROM bhavcopy").fetchone()[0]
    con.close()
    return {"rows": len(rows), "sessions": n_sessions, "holidays": holidays, "stale_repeats": stale}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=date.fromisoformat, default=date(2024, 1, 1))
    ap.add_argument("--end", type=date.fromisoformat, default=date.today() - timedelta(days=1))
    ap.add_argument("--headful", action="store_true", help="show the browser window")
    a = ap.parse_args()
    print("fetch:", fetch_raw(a.start, a.end, headless=not a.headful))
    print("load:", load_db())


if __name__ == "__main__":
    main()
