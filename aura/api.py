"""REST API and dashboard host.

Usage:  uvicorn aura.api:app --port 8000   then open http://localhost:8000
Serves the results written by `python -m aura.report`.
"""
import json
import logging
import os
import secrets
import time
import urllib.error
import urllib.request
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from aura.config import live_fresh_seconds, upstash

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "data" / "results.json"
DASHBOARD = ROOT / "public" / "index.html"  # on Vercel the CDN serves this file directly
LIVE = ROOT / "data" / "live.json"          # written by `python -m aura.live` (local mode)
TICKS = ROOT / "data" / "live_ticks.json"
SESSION = ROOT / "data" / "last_session.json"  # committed by the poller

FAVICON = ROOT / "public" / "favicon.svg"

app = FastAPI(title="AuRA", description="Relative-value analytics for MCX gold futures")
log = logging.getLogger("aura.api")


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


def _require_poll_authorization(authorization: str | None) -> None:
    """Keep the write-capable serverless poll endpoint private."""
    secret = os.environ.get("POLL_SECRET", "")
    expected = f"Bearer {secret}"
    if not secret:
        raise HTTPException(503, "Scheduled polling is not configured")
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(401, "Unauthorized")


@app.get("/api/poll", include_in_schema=False)
def poll(authorization: str | None = Header(default=None)) -> dict:
    """Fetch one broker quote snapshot and atomically publish it to shared Upstash state.

    This is intentionally a one-shot request for GitHub Actions or a paid Vercel Cron;
    it never attempts to run a background loop inside a Vercel function.
    """
    _require_poll_authorization(authorization)
    try:
        from aura.angel_one import poll_once
        from aura.live import publish

        snap = poll_once()
        if not publish(snap):
            raise RuntimeError("shared Upstash write was not confirmed")
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Scheduled market-data poll failed")
        raise HTTPException(502, "Market-data poll failed; shared state was not updated") from exc
    return {"status": "published", "published": snap["published"], "poll_s": snap["poll_s"],
            "contracts": len(snap["contracts"]), "feed_source": snap["feed_source"]}


@app.get("/api/live")
def live() -> dict:
    """Latest real-time snapshot and today's ticks.

    Sources in order: Upstash (deployed, poller running), local files (poller on this
    machine), then the committed last session, replayed when no poller is running.
    """
    snap, ticks, source = None, [], None
    if all(upstash(read_only=True)):
        try:
            raw, raw_ticks = _upstash([["GET", "aura:live"], ["LRANGE", "aura:ticks", "0", "-1"]])
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:  # fall through to local / archive
            log.warning("Upstash read failed: %s", exc)
            raw, raw_ticks = None, None
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
    fresh_after_s = live_fresh_seconds()
    poll_s = max(1, int(snap.get("poll_s", 15)))
    if source == "session archive":  # a frozen copy is never live, however recent
        status = "replay"
    elif age <= fresh_after_s:
        status = "live" if snap["market_open"] else "closed"
    elif poll_s >= 60 and age <= poll_s + 90:
        # A scheduled REST snapshot is genuine data, but it is not a streaming quote.
        status = "scheduled" if snap["market_open"] else "closed"
    elif age < max(600, poll_s * 2):
        status = "delayed"
    else:
        status = "replay"
    return {"status": status, "age_s": age, "fresh_after_s": fresh_after_s,
            "source": source, "snapshot": snap, "ticks": ticks}


@app.get("/")
def dashboard() -> FileResponse:
    return FileResponse(DASHBOARD)


@app.get("/live")
def live_page() -> FileResponse:
    return FileResponse(ROOT / "public" / "live.html")


@app.get("/favicon.svg", include_in_schema=False)
def favicon() -> FileResponse:
    return FileResponse(FAVICON, media_type="image/svg+xml")


ASSETS = ROOT / "public" / "assets"
if ASSETS.exists():
    app.mount("/assets", StaticFiles(directory=ASSETS), name="assets")
