"""Cloud entry point for AuRA's standalone, monitor-only live-data worker.

This process deliberately has no FastAPI server. It only collects quote data and publishes
the latest globally shared snapshot and tick stream to Upstash Redis, which Vercel reads.
"""
from aura.config import live_source, upstash
from aura.live import load_env, run


def check_cloud_configuration() -> None:
    """Fail fast instead of silently writing a local-only feed in a cloud container."""
    load_env()
    url, token = upstash()
    if not url or not token:
        raise RuntimeError(
            "Cloud worker requires KV_REST_API_URL and KV_REST_API_TOKEN so all visitors share one live feed."
        )
    # Validate source now; `aura.live.run` dispatches to MCX or Angel One afterwards.
    live_source()


def main() -> None:
    check_cloud_configuration()
    print("AuRA cloud worker started: publishing shared monitor state to Upstash Redis.", flush=True)
    run()


if __name__ == "__main__":
    main()
