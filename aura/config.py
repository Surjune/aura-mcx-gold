"""Runtime configuration read from the environment."""
import os


def upstash(read_only: bool = False) -> tuple[str | None, str | None]:
    """Upstash REST URL and token, under either naming scheme Vercel's integration may use."""
    url = os.environ.get("KV_REST_API_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")
    token = ((os.environ.get("KV_REST_API_READ_ONLY_TOKEN") if read_only else None)
             or os.environ.get("KV_REST_API_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN"))
    return url, token
