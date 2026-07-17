# Services (gateways)

"Service" in this codebase means a subclass of `BaseGateway` or `BaseProvider`
under `src/gateway/` — each is instantiated once per route-plugin registration
(not a singleton) and injected into its route group as a dependency.

| Service | Base class | Provider | Doc |
|---|---|---|---|
| `OpenWeatherAPI` | `BaseGateway` | OpenWeather (openweathermap.org) | [openweather.md](openweather.md) |
| `GoogleAuthAPI` | `BaseProvider` | Google OAuth2 (`google-auth-library`) | [google-auth.md](google-auth.md) |

`BaseGateway` extends `BaseProvider`. Use `BaseGateway` for services that make
outbound HTTP calls via `fetch`; use `BaseProvider` directly for services that
use an SDK (e.g. `google-auth-library`) or another non-HTTP transport.

## Shared base: `BaseGateway`

All gateways extend [BaseGateway](../../../src/core/base/BaseGateway.ts)
(which itself extends [BaseProvider](../../../src/core/base/BaseProvider.ts)).
It provides, in order of typical use:

1. `getApiKey()` — resolves the API key via `keyRepo + crypto` (DB-backed,
   encrypted) or a directly injected plain-text key (env-backed). Throws
   `AppError('PROVIDER_KEY_MISSING' | 'PROVIDER_KEY_INVALID', 500)` on failure.
2. `buildUrl(path, query)` — constructs a `URL` relative to the gateway's
   `baseUrl`, dropping `undefined`/`null` query values.
3. `getJson(path, query, meta)` / `getJsonWithApiKey(path, query, meta, paramName)`
   — the two public request helpers; the latter merges the resolved API key
   into the query string under `paramName` (default `appid`).
4. `httpGetJson(url, meta)` — the actual `fetch` call. Handles:
   - structured debug/info/error logging (`this.logger`, i.e. `app.log`)
   - `AppError('PROVIDER_HTTP_ERROR', <upstream status>)` on non-2xx,
     with a `raw_logs` `provider_http_error` row
   - `AppError('PROVIDER_NETWORK_ERROR', 502)` on network failure (timeout,
     DNS, connection refused), with a `raw_logs` `provider_network_error` row
   - `sanitizeUrl()` — redacts `appid`/`apikey`/`api_key`/`key`/`token`/`secret`/`password`
     query params before any URL reaches a log line
5. `assertLatLon(lat, lon)` / `assertRequiredString(value, fieldName)` —
   shared input validators, both throwing `AppError('BAD_REQUEST', 400)`.

## Dependency injection shape (`BaseGatewayDeps`)

```ts
type BaseGatewayDeps = {
  keyRepo?: GatewayKeyRepo;   // optional: DB-backed encrypted key lookup
  crypto?: GatewayCrypto;     // optional: decrypts keyRepo's secret
  apiKey: string | undefined; // fallback: plain-text key (e.g. from env)
  baseUrl?: string;           // override for the provider's default base URL
  logger: GatewayLogger;      // typically app.log
};
```

Today every gateway is constructed with the env-injected `apiKey` path (see
`LingOnWeather.ts`'s plugin entry point) — the `keyRepo + crypto` path exists
in the base class but isn't wired to any concrete gateway yet. It is the same
mechanism `Repositories.ts` seeds for `openai` (see
[plugins/repositories.md](../plugins/repositories.md)), reserved for future
gateways that read a DB-stored provider key instead of `.env`.

## Adding a new service

See "Adding a new provider" in [../../CLAUDE.md](../../CLAUDE.md) — create
`src/gateway/<Name>API.ts` extending `BaseGateway`, add a matching route file,
and a doc here.
