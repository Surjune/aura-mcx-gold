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
    """Latest real-time snapshot from the poller plus today's ticks; status "offline" if none."""
    if all(upstash(read_only=True)):
        snap, ticks = _upstash([["GET", "aura:live"], ["LRANGE", "aura:ticks", "0", "-1"]])
        snap = json.loads(snap) if snap else None
        ticks = [json.loads(t) for t in ticks or []]
        source = "upstash"
    else:
        snap = json.loads(LIVE.read_text(encoding="utf-8")) if LIVE.exists() else None
        ticks = json.loads(TICKS.read_text(encoding="utf-8")) if TICKS.exists() else []
        source = "local"
    if snap is None:
        return {"status": "offline", "source": source, "ticks": ticks}
    age = time.time() - snap["published"]
    status = "live" if age < 3 * snap["poll_s"] else "delayed" if age < 600 else "offline"
    return {"status": status if snap["market_open"] else "closed", "age_s": age, "source": source,
            "snapshot": snap, "ticks": ticks}


@app.get("/")
def dashboard() -> FileResponse:
    return FileResponse(DASHBOARD)


@app.get("/live")
def live_page() -> FileResponse:
    return FileResponse(ROOT / "public" / "live.html")
