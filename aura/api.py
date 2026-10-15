"""REST API and dashboard host.

Usage:  uvicorn aura.api:app --port 8000   then open http://localhost:8000
Serves the results written by `python -m aura.report`.
"""
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "data" / "results.json"
DASHBOARD = ROOT / "public" / "index.html"  # on Vercel the CDN serves this file directly

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


@app.get("/")
def dashboard() -> FileResponse:
    return FileResponse(DASHBOARD)
