# Free automated MCX monitor

This mode has no persistent worker. GitHub Actions calls AuRA's protected Vercel endpoint
every 15 minutes during the weekday MCX session; that function obtains one **read-only**
Angel One SmartAPI `FULL` quote snapshot and writes it to the shared Upstash Redis keys.
Every visitor then reads the same snapshot from `/api/live`.

It is a free scheduled monitor, not a streaming 15-second feed. GitHub does not offer an
uptime or exact-timing guarantee for scheduled workflows, so the UI deliberately labels it
**Automated Scheduled Feed** after the first 45 seconds. It never claims a stale snapshot is
live or tradeable.

## Why there is no `crons` entry in `vercel.json`

Vercel Hobby allows cron jobs only **once per day**. A 15-minute Vercel Cron expression fails
at deployment, so the free implementation uses GitHub Actions for scheduling and Vercel only
for the short, stateless poll request. Vercel Pro can invoke the same `/api/poll` route using
a native cron if paid scheduling is wanted later.

## One-time setup

1. Create an Upstash Redis database on its free tier. Copy its REST URL and a write-capable
   token.
2. In **Vercel → AuRA project → Settings → Environment Variables**, set these for Production:

   | Variable | Value |
   | --- | --- |
   | `KV_REST_API_URL` | Upstash REST URL |
   | `KV_REST_API_TOKEN` | Upstash write token |
   | `POLL_SECRET` | a new long random string |
   | `ANGEL_API_KEY` | SmartAPI app key |
   | `ANGEL_CLIENT_CODE` | Angel One client code |
   | `ANGEL_PIN` | Angel One MPIN/PIN |
   | `ANGEL_TOTP_SECRET` | Angel One TOTP seed |
   | `MONITOR_ONLY` | `true` |
   | `ANGEL_MCX_EXCHANGE_TYPE` | `5` |
   | `ANGEL_PRICE_DIVISOR` | `100` |
   | `SERVERLESS_POLL_SECONDS` | `900` |
   | `LIVE_FRESH_SECONDS` | `45` |

   Redeploy after saving them. Do not put any of these values in GitHub files.
3. In **GitHub → repository → Settings → Secrets and variables → Actions**, add:

   | Secret | Value |
   | --- | --- |
   | `AURA_POLL_URL` | `https://aura.lightninglogics.me/api/poll` |
   | `POLL_SECRET` | exactly the same value used in Vercel |

4. Open **Actions → Poll MCX market data → Run workflow**. This performs one safe manual
   test. The endpoint makes no order, portfolio, position, margin, or payment calls.

## Verification

After a successful workflow during MCX trading hours, open:

```text
https://aura.lightninglogics.me/api/live
```

Expected fields are `source: "upstash"`, `snapshot.feed_source: "angelone_rest"`,
`snapshot.poll_s: 900`, and a recent `age_s`. Immediately after a run, `status` is `live` for
45 seconds; for the remaining scheduled interval it becomes `scheduled`, which is the honest
state for a valid, non-streaming snapshot. If a workflow fails, it becomes `delayed` and later
`replay` instead of pretending old data is current.

Then open `/live` in an incognito window or a second device. Both visitors should see the same
timestamp and shared Upstash source.

## Operations and limits

- Schedules run on weekdays from 09:00 to 23:45 IST. Market holidays may return no usable quote.
- GitHub Actions schedules can be delayed under load; this is why the health state uses timestamps.
- The free approach is suitable for demos and periodic monitoring. For 15-second or guaranteed
  availability, use the existing persistent WebSocket worker and a paid always-on host.
- Rotate the Angel One and poll secrets if they are ever exposed.
