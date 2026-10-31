"""Runtime configuration read from the environment."""
import os


def upstash(read_only: bool = False) -> tuple[str | None, str | None]:
    """Upstash REST URL and token, under either naming scheme Vercel's integration may use."""
    url = os.environ.get("KV_REST_API_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")
    token = ((os.environ.get("KV_REST_API_READ_ONLY_TOKEN") if read_only else None)
             or os.environ.get("KV_REST_API_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN"))
    return url, token


def live_source() -> str:
    """Configured market-data source. ``mcx`` preserves the original monitor."""
    source = os.environ.get("LIVE_SOURCE", "mcx").strip().lower()
    if source not in {"mcx", "angelone"}:
        raise ValueError("LIVE_SOURCE must be either 'mcx' or 'angelone'")
    return source


def angel_one_ready() -> bool:
    """Whether all credentials required to start the monitor are present."""
    return all(os.environ.get(key, "").strip() for key in (
        "ANGEL_API_KEY", "ANGEL_CLIENT_CODE", "ANGEL_PIN", "ANGEL_TOTP_SECRET"))


def live_fresh_seconds() -> int:
    """Maximum snapshot age that can be displayed as a globally live feed."""
    try:
        return max(1, int(os.environ.get("LIVE_FRESH_SECONDS", "45")))
    except ValueError as exc:
        raise ValueError("LIVE_FRESH_SECONDS must be a positive integer") from exc
