# `raw_logs`

Server lifecycle, exceptions, and provider-level errors. Written via
[`AppLogger.saveRawLog`](../../../src/core/utils/Logger.ts).

**Role**: lifecycle/exception/provider-error data only. Never write HTTP
request/response data here — that belongs in [request_logs](request_logs.md).

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | auto |
| `level` | varchar(32), nullable | dedicated column — stripped out of `log` JSONB; optional in `RawLogPayload`, inserted as `?? null` by `AppLogger.saveRawLog` |
| `event` | varchar(128) NOT NULL | dedicated column — stripped out of `log` JSONB; required in `RawLogPayload` |
| `source` | varchar(128), nullable | dedicated column — stripped out of `log` JSONB; optional in `RawLogPayload`, inserted as `?? null` by `AppLogger.saveRawLog` |
| `log` | jsonb NOT NULL | all other payload fields + auto-injected `ts` (ISO-8601) |
| `created_at` | timestamptz NOT NULL DEFAULT NOW() | auto |

> **DevDocs Update Required (2026-09-14, TASK-007)** — `level` and `source`
> were not previously marked nullable. Both are optional fields on
> `RawLogPayload` (`level?: string`, `source?: string` in
> [Logger.ts](../../../src/core/utils/Logger.ts)) and are inserted as
> `level ?? null` / `source ?? null` by `AppLogger.saveRawLog`. Confirmed
> against `lingon/migrations/000_baseline_schema.sql` (currently
> uncommitted in the lingon working tree), which declares `level varchar(32)`
> and `source varchar(128)` without `NOT NULL`, while `event varchar(128)`
> is `NOT NULL`.

`saveRawLog` destructures `{ event, level, source, ...rest }` from the
payload — only `rest` (plus an injected `ts`) goes into the `log` JSONB
column, so `event`/`level`/`source` are never duplicated between a dedicated
column and the JSONB blob.

## Events currently written

| Event | Written from | Typical `log` JSONB fields |
|---|---|---|
| `server_starting` | [app.ts](../../../src/app.ts) | `port`, `logFile`, `logLevel` |
| `server_ready` | `app.ts` | `port`, `host` |
| `server_shutdown` | `app.ts` (`SIGTERM`/`SIGINT` handler) | `signal` |
| `uncaughtException` | `app.ts` (`process.on`) | `error`, `stack` |
| `unhandledRejection` | `app.ts` (`process.on`) | `error`, `stack` |
| `unhandled_exception` | [AppError.ts](../../../src/core/utils/AppError.ts) global error handler | `reqId`, `endpoint`, `error`, `stack` |
| `provider_http_error` | [BaseGateway.ts](../../../src/core/base/BaseGateway.ts) | `provider`, `op`, `code`, `status`, `ms` |
| `provider_network_error` | `BaseGateway.ts` | `provider`, `op`, `error`, `ms` |

## Security

API keys, `Authorization` headers, JWTs, cookies, and passwords must never
appear in any field. Provider URLs must be sanitized (`BaseGateway.sanitizeUrl`)
before being included in any payload passed to `saveRawLog`.

## Failure policy

Every call site wraps `saveRawLog` in `try/catch`; failures fall back to a
Pino `error` log and are otherwise swallowed.
