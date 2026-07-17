# `Policy` (`LingOnDataManage/Policy.ts`)

Source: [src/plugins/LingOnDataManage/Policy.ts](../../../src/plugins/LingOnDataManage/Policy.ts)

Registers `DefaultPolicy` as the global request lifecycle policy, decorating
`app.policy` (`{ before, after }`, typed in
[FastifyDefinition.ts](../../../src/config/FastifyDefinition.ts)) and wiring
both methods into Fastify hooks.

## `before` — `preHandler` hook

Extracts and verifies the `Authorization: Bearer <token>` header. If present,
calls `verifyAccessToken(token)` ([Jwt.ts](../../../src/core/utils/Jwt.ts)) and
populates `req.ctx.userId` with the `sub` claim on success.

- **No header**: no-op — public routes are unaffected.
- **Malformed header** (`Authorization:` present but not `Bearer <token>`): throws
  `AppError('UNAUTHORIZED', 401, 'Invalid authorization header')`.
- **Invalid/expired token**: `verifyAccessToken` throws
  `AppError('UNAUTHORIZED', 401, 'Invalid token')`.

This is the single hook point for authentication — do not add ad hoc auth checks
in route handlers. To protect a route, read `req.ctx.userId` and throw
`AppError('UNAUTHORIZED', 401)` if it is `undefined`.

## `after` — `onResponse` hook

Logs request completion: `{ latency, userId }` at `info` level, via `req.log`.
Extension point for usage metrics, billing events, or audit trails — the
method signature already accepts `result` (the route handler's return value)
for this purpose, though it's currently always called with `null` from the
hook (`onResponse` doesn't have access to the handler's return value).

## Consumers

Every request, via the `preHandler`/`onResponse` hooks registered in this
plugin's `fp(...)` body — not called directly by route handlers.
