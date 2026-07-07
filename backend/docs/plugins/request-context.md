# `RequestContext` (`LingOnDataManage/RequestContext.ts`)

Source: [src/plugins/LingOnDataManage/RequestContext.ts](../../../src/plugins/LingOnDataManage/RequestContext.ts)

Initializes `req.ctx` in the `onRequest` hook — the first plugin in the
request lifecycle that must run before anything else reads `req.ctx`.

## Populated fields (at `onRequest` time)

| Field | Source |
|---|---|
| `requestId` | `X-Request-Id` header, or a fresh `randomUUID()` if absent |
| `ip` | `req.ip` (resolved through proxy headers — `trustProxy: true` in `app.ts`) |
| `startedAtMs` | `Date.now()` — used later for latency calculation |

`userId`, `apiKeyId`, `provider`, `operation` are declared on the `req.ctx`
type but **not** set here — `userId`/`apiKeyId` are populated by future
auth middleware (see [policy.md](policy.md)); `provider`/`operation` are set
by individual route handlers just before calling a gateway (see
[api/weather.md](../api/weather.md)).

## Why `req.ctx` is always populated before `Policy`/`RequestLog` read it

Not because this file loads first alphabetically — plugin autoload order
within `LingOnDataManage/` is actually `Policy` → `Repositories` →
`RequestContext` → `RequestLog` (see [../DevelopmentGuide.md](../DevelopmentGuide.md#fastify-structure)).
The guarantee instead comes from Fastify's **hook-type** execution order:
all `onRequest` hooks across every plugin run before any `preHandler` hook,
which in turn run before `onResponse` hooks — regardless of which plugin
file registered which hook. Since this plugin's hook is `onRequest` and
`Policy`/`RequestLog`'s hooks are `preHandler`/`onResponse`, `req.ctx` is
guaranteed populated first. Do not rely on file/directory naming for this —
rely on choosing the correct hook type.
