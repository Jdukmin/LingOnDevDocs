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
| `query_params` | jsonb NOT NULL | `req.query`, redacted by [`redactQueryParams`](../../../src/core/utils/Logger.ts) inside `AppLogger.saveRequestLog` — any of the 11 `REDACTED_QUERY_PARAMS` keys is stored as the literal string `[redacted]`; all other params (lat, lon, units, lang, q, limit, ...) are stored unchanged. See [Security](#security) |
| `created_at` | timestamptz NOT NULL DEFAULT NOW() | auto |

`req_id` is a unified correlation id: the same value is used as pino's
`reqId` and as `raw_logs.reqId` (`req.ctx.requestId` is `req.id`, set by
Fastify's `genReqId` in `app.ts`). Full treatment in
[docs/ops/monitoring.md](../../../docs/ops/monitoring.md).

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

Redaction happens in one place:
[`AppLogger.saveRequestLog`](../../../src/core/utils/Logger.ts) calls
`JSON.stringify(redactQueryParams(data.queryParams))` before the `INSERT`.
The `onResponse` hook in
[RequestLog.ts](../../../src/plugins/LingOnDataManage/RequestLog.ts) passes
the whole `req.query` in as `queryParams` — it does no filtering itself. Every
caller of `saveRequestLog` is forced through this one choke point, so a
caller cannot bypass redaction by forgetting to filter query params before
calling it.

Any key present in `REDACTED_QUERY_PARAMS` — `code`, `access_token`,
`id_token`, `token`, `state`, `appid`, `apikey`, `api_key`, `key`, `secret`,
`password` (11 keys) — is stored as the literal string `[redacted]`. All
other params are stored unchanged.

**History**: `RequestLog.ts`'s header comment used to claim "only
route-level query params are stored (lat, lon, units, lang, q, limit).
Headers, cookies, and API keys are never included." That claim was the
source of false confidence — the hook actually passed the entire `req.query`
verbatim into `saveRequestLog`, so the column stored whatever the client
sent. That captured a live LingOn JWT whenever a client passed
`?access_token=`, and the Google OAuth authorization code on the OAuth
callback route — a real credential leak into a persisted DB column. The
guarantee described above is now real, but it is enforced by
`saveRequestLog`, not by the hook — anyone relying on the hook alone should
not assume filtering happens there.

See also the SSOT logging policy:
[logging_policy.md](../../../docs/policies/logging_policy.md).

## Failure policy

The `INSERT` is wrapped in `try/catch`; failures are logged via `app.log.error`
and swallowed. A `request_logs` write failure never affects the response
(already sent) or crashes the process.

---

# Change Log

- **2026-09-14** — Corrected `query_params` documentation, which claimed the
  `onResponse` hook only stored a safe fixed set of route-level params. In
  fact the hook (`RequestLog.ts:40`) passes the whole `req.query` verbatim;
  redaction is now enforced centrally by
  [`AppLogger.saveRequestLog`](../../../src/core/utils/Logger.ts) via
  `redactQueryParams`, which replaces any of the 11
  `REDACTED_QUERY_PARAMS` keys with `[redacted]`. Prior to this, a live
  LingOn JWT (`?access_token=`) or the Google OAuth authorization code
  could be captured verbatim in this column. Added a cross-link to
  [logging_policy.md](../../../docs/policies/logging_policy.md) and a note
  on `req_id` as a unified correlation id (see
  [docs/ops/monitoring.md](../../../docs/ops/monitoring.md)).
- **2026-07-23** — DevDocs SSOT consolidation: corrected `user_id` note, which
  stated auth was "not implemented." JWT authentication has been implemented
  end-to-end since `V_0.0.8`/`V_0.0.16` — see
  [../DevelopmentGuide.md](../DevelopmentGuide.md) "Authentication",
  [../plugins/policy.md](../plugins/policy.md), and [../api/auth.md](../api/auth.md).
  This was the last remaining stale "not implemented" note after the
  2026-07-22 Docs Revision corrected the same claim in
  [../api/apikey.md](../api/apikey.md), [../api/settings.md](../api/settings.md),
  and [../DevelopmentGuide.md](../DevelopmentGuide.md).
