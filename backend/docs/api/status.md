# `GET /v1/status`

Source: [src/route/LingOnStatus.ts](../../../src/route/LingOnStatus.ts)

Liveness/health-check endpoint for uptime monitors. No dependencies, no DB
calls beyond the automatic `request_logs` write.

## Route

| Method | Path | Auth |
|---|---|---|
| GET | `/v1/status` | None |

## Middleware / hooks applied

Same as every route: `onRequest` (RequestContext) → `preHandler` (Policy —
no-op) → handler → `onResponse` (Policy.after logging + RequestLog INSERT).
Rate-limited at 30 req/min (unauthenticated tier, since `req.ctx.userId` is
never set here).

## Request

No query, params, or body.

## Validation

None.

## Service

None — the handler reads only `req.ctx.requestId` (set by `RequestContext.ts`).

## Reply

```json
{
  "success": true,
  "data": { "name": "lingon-gateway", "requestId": "<uuid>" },
  "error": null
}
```
