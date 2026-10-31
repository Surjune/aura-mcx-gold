# Cloud live monitor deployment

AuRA has two separate deployment roles:

1. **Vercel** serves the React application and FastAPI read API.
2. **One persistent worker** receives market data and writes the latest shared snapshot to Upstash Redis.

Every visitor reads the same Redis keys (`aura:live` and `aura:ticks`) through `/api/live`. The
Vercel function never depends on a developer's machine, browser, `live.json`, or local DuckDB file
for live state.

## Recommended production source

Use `LIVE_SOURCE=angelone` for the cloud worker. It is the resilient option because SmartAPI streams
data over a WebSocket and its instrument master supplies current MCX contract tokens and expiries.
The worker resolves exact contract expiries from that master; it does not need the uncommitted local
research DuckDB file to decide the front contracts.

The worker remains **monitor-only**. It never calls order, margin, positions, GTT, or portfolio APIs.

`LIVE_SOURCE=mcx` remains supported as a fallback using Playwright Chromium. It may be rejected by
MCX from a cloud IP and requires a mounted `data/aura.duckdb` because the browser monitor selects
contracts from the research database. Do not use it for the primary 24/7 deployment.

## Required environment variables

| Variable | Set on | Purpose |
|---|---|---|
| `KV_REST_API_URL` | Render worker + Vercel Production | Shared Upstash REST endpoint |
| `KV_REST_API_TOKEN` | Render worker | Redis write token |
| `KV_REST_API_READ_ONLY_TOKEN` or `KV_REST_API_TOKEN` | Vercel Production | Redis read token for `/api/live` |
| `LIVE_SOURCE=angelone` | Render worker | Selects the cloud feed adapter |
| `MONITOR_ONLY=true` | Render worker | Refuses any non-monitor configuration |
| `ANGEL_API_KEY` | Render worker | SmartAPI application key |
| `ANGEL_CLIENT_CODE` | Render worker | Angel One client code |
| `ANGEL_PIN` | Render worker | Angel One MPIN/PIN |
| `ANGEL_TOTP_SECRET` | Render worker | TOTP seed used for login |
| `ANGEL_MCX_EXCHANGE_TYPE=5` | Render worker | MCX SmartAPI exchange type |
| `ANGEL_PRICE_DIVISOR=100` | Render worker | Convert paise to rupees |
| `ANGEL_PUBLISH_SECONDS=15` | Render worker | Maximum shared-snapshot publish cadence |
| `LIVE_FRESH_SECONDS=45` | Render worker + Vercel Production | Global live-health threshold |

Never commit real values. Use the provider dashboards' encrypted environment-variable controls.

## Render deployment

1. In Upstash, create or select one Redis database. Copy its REST URL and write token.
2. In Vercel project settings, add `KV_REST_API_URL`, plus a Redis read token under
   `KV_REST_API_READ_ONLY_TOKEN` (or use `KV_REST_API_TOKEN`). Add `LIVE_FRESH_SECONDS=45`.
3. In Render, choose **New → Blueprint** and connect `Surjune/aura-mcx-gold`. Render discovers
   `render.yaml` and creates the persistent `aura-live-mcx-poller` worker.
4. Enter the secret environment values above in Render. Keep the worker on a paid always-on plan;
   free/sleeping services cannot provide a continuous feed.
5. Deploy. The worker log must show `AuRA cloud worker started` and then successful Angel One publish
   messages. Do not paste credentials into terminal output, GitHub, or issue comments.

## Health contract and verification

`/api/live` reads Redis first and returns a server-calculated status:

- `live`: Redis snapshot is at most 45 seconds old and was captured while MCX is open.
- `closed`: Redis snapshot is fresh, but MCX is closed.
- `delayed`: snapshot is older than 45 seconds but younger than ten minutes.
- `replay`: stale data or the committed archive fallback.
- `offline`: no shared or archived snapshot exists.

After deployment, verify from a browser without logging in:

```text
https://aura.lightninglogics.me/api/live
```

During an open MCX session, confirm `status` is `live`, `source` is `upstash`, `age_s` is below 45,
and `snapshot.feed_source` is `angelone_websocket`. Then open:

```text
https://aura.lightninglogics.me/live
```

The banner must read **Live Feed Active**, show the shared source, and show a recent timestamp. Open
the same URL in an incognito browser or another device; it should return the same current snapshot.

## Operational notes

- Vercel remains stateless. Do not try to run an infinite poller in a serverless function.
- Upstash is the shared operational database for live state; `data/results.json` remains the versioned
  historical-research artifact.
- Rotate the Angel One PIN/TOTP/API credentials in Render if they are ever exposed.
- A market-closed banner is correct behavior outside MCX trading hours; it is not an archive replay.
