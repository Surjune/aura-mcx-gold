"""REST API and dashboard host.

Usage:  uvicorn aura.api:app --port 8000   then open http://localhost:8000
Serves the results written by `python -m aura.report`.
"""
import json
import time
import urllib.request
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from aura.config import upstash

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "data" / "results.json"
DASHBOARD = ROOT / "public" / "index.html"  # on Vercel the CDN serves this file directly
LIVE = ROOT / "data" / "live.json"          # written by `python -m aura.live` (local mode)
TICKS = ROOT / "data" / "live_ticks.json"
SESSION = ROOT / "data" / "last_session.json"  # committed by the poller

app = FastAPI(title="AuRA", description="Relative-value analytics for MCX gold futures")


def _results() -> dict:
    if not RESULTS.exists():
        raise HTTPException(503, "No results yet: run `python -m aura.ingest` then `python -m aura.report`.")
    return json.loads(RESULTS.read_text(encoding="utf-8"))


@app.get("/api/summary")
def summary() -> dict:
    r = _results()
    return {k: r[k] for k in ("data", "premiums", "carry_pa", "roll_split", "hurdle_bps", "verdict")}


@app.get("/api/contracts")
def contracts() -> list[dict]:
    """Lifecycle per contract: first traded, when it became liquid, delivery window, last traded."""
    return _results()["lifecycle"]


@app.get("/api/signals")
def signals() -> list[dict]:
    """Latest premium per pair with the reason it is, or is not, a trade."""
    return _results()["signals"]


@app.get("/api/backtest")
def backtest() -> dict:
    r = _results()
    return {"summary": r["backtest"], "trades": r["trades"]}


@app.get("/api/series")
def series() -> dict:
    return _results()["series"]


def _upstash(cmds: list[list[str]]) -> list:
    url, token = upstash(read_only=True)
    req = urllib.request.Request(url.rstrip("/") + "/pipeline", data=json.dumps(cmds).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=5) as r:
        return [x.get("result") for x in json.loads(r.read())]


@app.get("/api/live")
def live() -> dict:
    """Latest real-time snapshot and today's ticks.

    Sources in order: Upstash (deployed, poller running), local files (poller on this
    machine), then the committed last session, replayed when no poller is running.
    """
    snap, ticks, source = None, [], None
    if all(upstash(read_only=True)):
        raw, raw_ticks = _upstash([["GET", "aura:live"], ["LRANGE", "aura:ticks", "0", "-1"]])
        if raw:
            snap, ticks, source = json.loads(raw), [json.loads(x) for x in raw_ticks or []], "upstash"
    if snap is None and LIVE.exists():
        snap = json.loads(LIVE.read_text(encoding="utf-8"))
        ticks = json.loads(TICKS.read_text(encoding="utf-8")) if TICKS.exists() else []
        source = "local"
    if snap is None and SESSION.exists():
        archive = json.loads(SESSION.read_text(encoding="utf-8"))
        snap, ticks, source = archive["snapshot"], archive["ticks"], "session archive"
    if snap is None:
        return {"status": "offline", "source": None, "ticks": []}
    age = time.time() - snap["published"]
    if age < 3 * snap["poll_s"]:
        status = "live" if snap["market_open"] else "closed"
    elif age < 600:
        status = "delayed"
    else:
        status = "replay"
    return {"status": status, "age_s": age, "source": source, "snapshot": snap, "ticks": ticks}


@app.get("/")
def dashboard() -> FileResponse:
    return FileResponse(DASHBOARD)


@app.get("/live")
def live_page() -> FileResponse:
    return FileResponse(ROOT / "public" / "live.html")
