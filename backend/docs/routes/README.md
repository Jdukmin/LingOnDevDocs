# Route registration mechanics

This document covers *how* routes get registered — for per-endpoint request/
reply/validation details, see [../api/](../api/).

## Autoload

`app.ts` registers `route/` via `@fastify/autoload` with `{ prefix: '/v1' }`:

```ts
await app.register(AutoLoad, {
  dir: join(import.meta.dirname, 'route'),
  options: { prefix: '/v1' }
});
```

Every file under `src/route/` must default-export a `FastifyPluginAsync`.
The convention in this codebase (see any file in `src/route/`) is:

```ts
class MyRoutes extends BaseRoutes {
  readonly name = 'my-routes';
  protected async registerRoutes(app: FastifyInstance) { /* app.get/put/... */ }
}

const plugin: FastifyPluginAsync = async (app) => {
  const routes = new MyRoutes(/* injected deps, e.g. a gateway */);
  await app.register(routes.asPlugin());
};

export default plugin;
```

`BaseRoutes.asPlugin()` ([src/core/base/BaseRoutes.ts](../../../src/core/base/BaseRoutes.ts))
is the adapter that turns a class instance into the `FastifyPluginAsync`
shape `app.register` expects.

## Why `/v1` isn't hardcoded per-file

The prefix is applied once, centrally, by the autoload options in `app.ts` —
every route path inside `src/route/*.ts` is written relative to that prefix
(e.g. `app.get('/status', ...)` becomes `GET /v1/status`). This keeps a
future `/v2` migration to a one-line change in `app.ts` rather than a
per-file edit.

## Registered route groups

See [../FeatureList.md](../FeatureList.md) for the full current endpoint
inventory, and [../api/](../api/) for one doc per group:
[status](../api/status.md), [weather](../api/weather.md),
[apikey](../api/apikey.md), [settings](../api/settings.md),
[users](../api/users.md).

## Route ordering within a group

Static paths must be registered before dynamic/param paths that could shadow
them — e.g. `/apikey/status` is registered before `/apikey/:provider` in
[LingOnApiKey.ts](../../../src/route/LingOnApiKey.ts), or `:provider` would
otherwise match the literal string `status`.
