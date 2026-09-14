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
| `req_id` | uuid NOT NULL | `req.ctx.requestId` |
| `user_id` | text, nullable | `req.ctx.userId` — populated for authenticated routes (JWT verified by `Policy.before()`); `null` for routes that don't require auth (e.g. `GET /v1/status`, `GET /v1/weather/*`, `POST /v1/auth/google`) |
| `method` | varchar(10) NOT NULL | `req.method` |
| `endpoint` | varchar(255) NOT NULL | `req.routeOptions.url` (falls back to path without query string) |
| `remote_ip` | varchar(45) NOT NULL | `req.ctx.ip` |
| `provider` | varchar(64), nullable | `req.ctx.provider`, set by route handlers before a gateway call — `null` for non-gateway routes |
| `operation` | varchar(128), nullable | `req.ctx.operation` — `null` for non-gateway routes |
| `status_code` | integer NOT NULL | `reply.statusCode` |
| `latency_ms` | integer NOT NULL | `Date.now() - req.ctx.startedAtMs` |
| `query_params` | jsonb NOT NULL | `req.query` — **route-level params only** (lat, lon, units, lang, q, limit, ...) |
| `created_at` | timestamptz NOT NULL DEFAULT NOW() | auto |

> **DevDocs Update Required (2026-09-14, TASK-007)** — `provider` and
> `operation` were not previously marked nullable in this table, though the
> prose already noted `user_id` can be `null`. All three must be nullable:
> [RequestLog.ts](../../../src/plugins/LingOnDataManage/RequestLog.ts) feeds
> `req.ctx.userId ?? null`, `req.ctx.provider ?? null`, and
> `req.ctx.operation ?? null` into `AppLogger.saveRequestLog`, because
> non-gateway routes never set `provider`/`operation`. Confirmed against
> `lingon/migrations/000_baseline_schema.sql` (currently uncommitted in the
> lingon working tree), which declares `user_id text`, `provider
> varchar(64)`, and `operation varchar(128)` all without `NOT NULL`.

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
