# `raw_logs`

Server lifecycle, exceptions, and provider-level errors. Written via
[`AppLogger.saveRawLog`](../../../src/core/utils/Logger.ts).

**Role**: lifecycle/exception/provider-error data only. Never write HTTP
request/response data here — that belongs in [request_logs](request_logs.md).

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | auto |
| `level` | varchar(32) | dedicated column — stripped out of `log` JSONB |
| `event` | varchar(128) | dedicated column — stripped out of `log` JSONB |
| `source` | varchar(128) | dedicated column — stripped out of `log` JSONB |
| `log` | jsonb NOT NULL | all other payload fields + auto-injected `ts` (ISO-8601) |
| `created_at` | timestamptz DEFAULT NOW() | auto |

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
