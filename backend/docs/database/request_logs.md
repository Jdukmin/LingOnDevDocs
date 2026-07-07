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
| `user_id` | text | `req.ctx.userId` (currently always `null` — auth not implemented) |
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
