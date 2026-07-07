# `RequestLog` (`LingOnDataManage/RequestLog.ts`)

Source: [src/plugins/LingOnDataManage/RequestLog.ts](../../../src/plugins/LingOnDataManage/RequestLog.ts)

Two responsibilities, both hook-based (no decorations):

## `onResponse` — persist to `request_logs`

Reads `req.ctx` (guaranteed populated by [RequestContext](request-context.md))
and `reply.statusCode`, computes latency, and calls
`appLogger.saveRequestLog(...)`. See [database/request_logs.md](../database/request_logs.md)
for the column mapping. Wrapped in `try/catch` — INSERT failures are logged
via `app.log.error` and swallowed; the response has already been sent.

## `onClose` — `pool.end()`

Ends the shared `pg.Pool` when Fastify shuts down. Ordering note: the
`SIGTERM`/`SIGINT` handler in [app.ts](../../../src/app.ts) writes the
`server_shutdown` `raw_logs` row **before** calling `app.close()`, so the pool
is still alive for that INSERT — this hook only runs after, ending the pool
for good.

## Consumers

Not called directly — wired entirely through Fastify's `onResponse`/`onClose`
hook system, registered once at plugin load time.
