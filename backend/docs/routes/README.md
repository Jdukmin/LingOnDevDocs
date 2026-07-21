# Route registration mechanics

> **⚠ 2026-07-21 전략 검토 (Action Layer)**: Personal Action OS 전환에 따라 Action이
> API의 중심이 되는 신규 진입점(`POST /v1/actions/execute` 등)이 제안되었다.
> 아래 라우트는 전부 유효하며 변경되지 않는다 — 각 라우트가 Action Layer 도입 후
> Keep/Wrap 중 무엇이 되는지는 [../../../docs/icd/api_comparison.md](../../../docs/icd/api_comparison.md),
> 신규 API 설계는 [../../../docs/icd/action_layer_api.md](../../../docs/icd/action_layer_api.md) 참조.

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
[auth](../api/auth.md), [calendar](../api/calendar.md), [status](../api/status.md),
[weather](../api/weather.md), [apikey](../api/apikey.md),
[settings](../api/settings.md), [users](../api/users.md).

Route files and their primary endpoints:

| File | Endpoints |
|---|---|
| `LingOnAuth.ts` | `POST /v1/auth/google`, `GET /v1/auth/google`, `GET /v1/auth/google/callback`, `GET /v1/auth/google/calendar`, `GET /v1/auth/google/calendar/callback` |
| `LingOnSession.ts` | `GET /v1/auth/me`, `POST /v1/auth/refresh`, `POST /v1/auth/logout` |
| `LingOnCalendar.ts` | `GET /v1/calendar/events` |
| `LingOnStatus.ts` | `GET /v1/status` |
| `LingOnWeather.ts` | `GET /v1/weather/*` |
| `LingOnUsers.ts` | `GET /v1/users/me`, `PATCH /v1/users/me` |
| `LingOnSettings.ts` | `GET\|PUT /v1/settings/ai`, `GET\|PUT /v1/settings/ui` |
| `LingOnApiKey.ts` | `GET /v1/apikey/status`, `PUT\|DELETE /v1/apikey/:provider` |

## Route ordering within a group

Static paths must be registered before dynamic/param paths that could shadow
them — e.g. `/apikey/status` is registered before `/apikey/:provider` in
[LingOnApiKey.ts](../../../src/route/LingOnApiKey.ts), or `:provider` would
otherwise match the literal string `status`.
