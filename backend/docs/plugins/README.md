# Plugins

All Fastify plugins live under `src/plugins/`, wrapped in `fastify-plugin`
(`fp`) so decorations propagate to the root app rather than being scoped to a
child context. `@fastify/autoload` registers every file in this tree
alphabetically by directory, then by filename — see
[../DevelopmentGuide.md](../DevelopmentGuide.md) for why load order matters.

| Plugin | File | Decorates | Doc |
|---|---|---|---|
| ConfigHandler | `LingOnConfig/ConfigHandler.ts` | (none yet — scaffold) | [config-handler.md](config-handler.md) |
| Policy | `LingOnDataManage/Policy.ts` | `app.policy` | [policy.md](policy.md) |
| Repositories | `LingOnDataManage/Repositories.ts` | `app.repos` | [repositories.md](repositories.md) |
| RequestContext | `LingOnDataManage/RequestContext.ts` | `req.ctx` (via `onRequest` hook) | [request-context.md](request-context.md) |
| RequestLog | `LingOnDataManage/RequestLog.ts` | (none — hooks only) | [request-log.md](request-log.md) |
| GoogleOAuth | `LingOnOAuth/GoogleOAuth.ts` | `app.googleOAuth2?` (conditional) | [google-oauth.md](google-oauth.md) |

## Load order vs. hook execution order

Autoload registers files alphabetically: `LingOnConfig/ConfigHandler` →
`LingOnDataManage/Policy` → `Repositories` → `RequestContext` → `RequestLog` →
`LingOnOAuth/GoogleOAuth`.
Note that **file registration order is not what guarantees `req.ctx` is
populated in time** — `Policy` and `RequestLog` are registered *before*
`RequestContext` alphabetically. What actually guarantees correct ordering is
Fastify's **hook-type** execution order: every `onRequest` hook (registered
by `RequestContext`) runs before any `preHandler` hook (`Policy.before`) or
`onResponse` hook (`Policy.after`, `RequestLog`), regardless of which plugin
file registered which hook. See [request-context.md](request-context.md) for
detail. `@fastify/rate-limit` is registered in `app.ts` *after* the whole
`plugins/` autoload block, so its `keyGenerator` can read `req.ctx.userId`.

`LingOnOAuth/GoogleOAuth` requires `@fastify/cookie` to be registered first
(for CSRF state cookie management) — `app.ts` registers `cookie` before the
`plugins/` autoload block.
