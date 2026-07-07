# `Policy` (`LingOnDataManage/Policy.ts`)

Source: [src/plugins/LingOnDataManage/Policy.ts](../../../src/plugins/LingOnDataManage/Policy.ts)

Registers `DefaultPolicy` as the global request lifecycle policy, decorating
`app.policy` (`{ before, after }`, typed in
[FastifyDefinition.ts](../../../src/config/FastifyDefinition.ts)) and wiring
both methods into Fastify hooks.

## `before` — `preHandler` hook

Currently a **no-op** — ICD v0.0 specifies `Auth: None`. This is the single
intended hook point for wiring authentication: validate a bearer token/API
key, populate `req.ctx.userId` / `req.ctx.apiKeyId`, or throw
`AppError('UNAUTHORIZED' | 'FORBIDDEN', 401 | 403)` to reject the request.
See [../DevelopmentGuide.md](../DevelopmentGuide.md#authentication).

## `after` — `onResponse` hook

Logs request completion: `{ latency, userId }` at `info` level, via `req.log`.
Extension point for usage metrics, billing events, or audit trails — the
method signature already accepts `result` (the route handler's return value)
for this purpose, though it's currently always called with `null` from the
hook (`onResponse` doesn't have access to the handler's return value).

## Consumers

Every request, via the `preHandler`/`onResponse` hooks registered in this
plugin's `fp(...)` body — not called directly by route handlers.
