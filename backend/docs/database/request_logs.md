# `request_logs`

One row per HTTP response. Written by
[`AppLogger.saveRequestLog`](../../../src/core/utils/Logger.ts) from the
`onResponse` hook in
[RequestLog.ts](../../../src/plugins/LingOnDataManage/RequestLog.ts).

**Role**: HTTP data only. Never write lifecycle/exception/provider-error data
here — that belongs in [raw_logs](raw_logs.md).

## Columns

| Column | Type | Source |
|---|---|---|
| `id` | bigserial PK | auto |
| `req_id` | uuid | `req.ctx.requestId` |
| `user_id` | text | `req.ctx.userId` — populated for authenticated routes (JWT verified by `Policy.before()`); `null` for routes that don't require auth (e.g. `GET /v1/status`, `GET /v1/weather/*`, `POST /v1/auth/google`) |
| `method` | varchar(10) | `req.method` |
| `endpoint` | varchar(255) | `req.routeOptions.url` (falls back to path without query string) |
| `remote_ip` | varchar(45) | `req.ctx.ip` |
| `provider` | varchar(64) | `req.ctx.provider`, set by route handlers before a gateway call |
| `operation` | varchar(128) | `req.ctx.operation` |
| `status_code` | integer | `reply.statusCode` |
| `latency_ms` | integer | `Date.now() - req.ctx.startedAtMs` |
| `query_params` | jsonb | `req.query` — **route-level params only** (lat, lon, units, lang, q, limit, ...) |
| `created_at` | timestamptz DEFAULT NOW() | auto |

## Security

Headers, cookies, and API keys must never appear in `query_params` — only
values that were already part of the route's own query string.

## Failure policy

The `INSERT` is wrapped in `try/catch`; failures are logged via `app.log.error`
and swallowed. A `request_logs` write failure never affects the response
(already sent) or crashes the process.

---

# Change Log

- **2026-07-23** — DevDocs SSOT consolidation: corrected `user_id` note, which
  stated auth was "not implemented." JWT authentication has been implemented
  end-to-end since `V_0.0.8`/`V_0.0.16` — see
  [../DevelopmentGuide.md](../DevelopmentGuide.md) "Authentication",
  [../plugins/policy.md](../plugins/policy.md), and [../api/auth.md](../api/auth.md).
  This was the last remaining stale "not implemented" note after the
  2026-07-22 Docs Revision corrected the same claim in
  [../api/apikey.md](../api/apikey.md), [../api/settings.md](../api/settings.md),
  and [../DevelopmentGuide.md](../DevelopmentGuide.md).
