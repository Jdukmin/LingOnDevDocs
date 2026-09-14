# `/v1/weather/*`

Source: [src/route/LingOnWeather.ts](../../../src/route/LingOnWeather.ts) ·
Service: [src/gateway/OpenWeatherAPI.ts](../../../src/gateway/OpenWeatherAPI.ts)
(see [services/openweather.md](../services/openweather.md))

Four endpoints proxying [OpenWeather](https://openweathermap.org/api),
normalized into the ICD v0.0 shape. `req.ctx.provider = 'openweather'` and
`req.ctx.operation` are set before every gateway call so `request_logs`
records which provider/operation served the request.

## Routes

| Method | Path | Auth |
|---|---|---|
| GET | `/v1/weather/current` | None |
| GET | `/v1/weather/forecast5` | None |
| GET | `/v1/weather/geo/direct` | None |
| GET | `/v1/weather/geo/reverse` | None |

## Middleware / hooks applied

Standard chain (RequestContext → Policy.before no-op → handler → RequestLog).
Rate limit: `@fastify/rate-limit`'s `max` is
`(req) => (req.ctx.userId ? 120 : 30)`, keyed by `req.ctx.userId ?? req.ip`
(`src/app.ts:182-183`). These weather routes require no auth, so an
unauthenticated caller gets the 30 req/min tier keyed by IP — but a caller
that sends a valid JWT (`req.ctx.userId` set) to these same routes gets the
120 req/min authenticated tier instead. **DevDocs Update Required
(2026-09-14, TASK-007)**: previously stated flatly as "30 req/min
(unauthenticated tier)" with no mention of the authenticated-caller case.

## Errors

All codes are emitted through the ICD v0.0 error envelope
`{ success:false, data:null, error:{ code, message, meta } }` produced by
`AppError.plugin`'s `setErrorHandler`
(`src/core/utils/AppError.ts:46-70`).

| `error.code` | HTTP | Emitted by | Condition |
|---|---|---|---|
| `BAD_REQUEST` | 400 | `LingOnWeather.parseNumber` (`src/route/LingOnWeather.ts:191`, `:197`) | `lat`/`lon`/`limit` absent, empty, or not a finite number |
| `BAD_REQUEST` | 400 | `LingOnWeather.registerRoutes` (`src/route/LingOnWeather.ts:143`) | `q` absent on `/weather/geo/direct` |
| `BAD_REQUEST` | 400 | `BaseGateway.assertLatLon` (`src/core/base/BaseGateway.ts:222`, `:226`, `:230`) | `lat`/`lon` not numbers, or out of WGS-84 range (lat -90..90, lon -180..180) — gateway-side re-validation |
| `BAD_REQUEST` | 400 | `BaseGateway.assertRequiredString` (`src/core/base/BaseGateway.ts:243`) | required string field empty inside the gateway |
| `OP_NOT_SUPPORTED` | 400 | `OpenWeatherAPI.execute` (`src/gateway/OpenWeatherAPI.ts:63`) | unknown `route` reached the gateway (internal wiring fault; not reachable from the four public routes) |
| `RATE_LIMITED` | 429 | `@fastify/rate-limit` `errorResponseBuilder` (`src/app.ts:192`) | 30 req/min unauthenticated tier (120 req/min if `req.ctx.userId` is set) exceeded. `meta` carries `{ limit, retryAfter }` |
| `PROVIDER_HTTP_ERROR` | provider's status (passed through, e.g. 401/404/429/5xx) | `BaseGateway.httpGetJson` (`src/core/base/BaseGateway.ts:294`) | OpenWeather returned a non-2xx response. Also written to `raw_logs` as `provider_http_error` |
| `PROVIDER_NETWORK_ERROR` | 502 | `BaseGateway.httpGetJson` (`src/core/base/BaseGateway.ts:364`) | `fetch` to OpenWeather threw (DNS/TCP/TLS/timeout). Also written to `raw_logs` as `provider_network_error` |
| `PROVIDER_KEY_MISSING` | 500 | `BaseGateway.getApiKey` (`src/core/base/BaseGateway.ts:113`, `:134`) | `OPENWEATHER_API_KEY` not configured / no active key row |
| `PROVIDER_KEY_INVALID` | 500 | `BaseGateway.getApiKey` (`src/core/base/BaseGateway.ts:123`) | stored key decrypted to an empty string |
| `INTERNAL` | 500 | `LingOnWeather.extractData` (`src/route/LingOnWeather.ts:212`) | gateway returned a non-object response |

Server-side error code semantics live in
[docs/docs/policies/error_policy.md](../../../docs/policies/error_policy.md).
The client also emits its **own**, unrelated `RouteException` codes
(`TIMEOUT`, `CLIENT_EXCEPTION`, `NETWORK_ERROR`, `HTTP_EXCEPTION`,
`FORMAT_ERROR`, `INVALID_JSON_OBJECT`, `HTTP_<status>`, `UNKNOWN_ERROR`)
from `letmeknow/lib/core/utils/error_handler.dart` and
`lib/core/base/base_route.dart` — those are client-side only, are **not**
server `error.code` values, and are documented nowhere in this SSOT yet
(open gap, TASK-007).

## `GET /v1/weather/current`

**Request query**

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `lat` | string→number | yes | — | WGS-84 latitude, validated -90..90 |
| `lon` | string→number | yes | — | WGS-84 longitude, validated -180..180 |
| `accuracy` | string | no | — | Accepted but **not forwarded** to OpenWeather |
| `units` | `standard\|metric\|imperial` | no | `metric` | |
| `lang` | string | no | `kr` | BCP-47 language code |

**Validation**: `parseNumber()` throws `AppError('BAD_REQUEST', 400)` if `lat`/`lon`
are missing or not finite; `OpenWeatherAPI.assertLatLon` re-validates range
inside the gateway.

**Service**: `gatewayService.execute({ gateway: 'openweather', route: 'weather.current', payload })`
→ `OpenWeatherAPI.fetchCurrentWeather` → `GET /data/2.5/weather`.

**Reply** (`normalizeCurrentWeather`):

```json
{
  "success": true,
  "data": {
    "location": { "city": "...", "country": "...", "lat": 0, "lon": 0 },
    "weather": { "main": "...", "description": "...", "icon": "..." },
    "temperature": { "temp": 0, "feels_like": 0, "temp_min": 0, "temp_max": 0, "humidity": 0, "pressure": 0 },
    "wind": { "speed": 0, "deg": 0 },
    "clouds": 0,
    "visibility": 0,
    "sunrise": 0,
    "sunset": 0,
    "observed_at": 0
  },
  "error": null
}
```

## `GET /v1/weather/forecast5`

Same query shape as `current` (`lat`, `lon`, `units`, `lang`). Maps to
`GET /data/2.5/forecast` (5-day / 3-hour interval, up to 40 entries).

**Reply** (`normalizeForecast`): `data.items[]` — each item flattens OWM's
nested `main`/`weather`/`wind`/`clouds`/`rain`/`snow` into a single-level
object (`temp`, `wind_speed`, `rain_3h`, `pop`, ...). Top-level `data` also
carries `city`, `country`, `lat`, `lon`, `timezone`, `sunrise`, `sunset`.

## `GET /v1/weather/geo/direct`

**Request query**

| Field | Type | Required | Default |
|---|---|---|---|
| `q` | string | yes | — |
| `limit` | string→number | no | `5` |

**Validation**: throws `AppError('BAD_REQUEST', 400, 'q is required')` if `q`
is absent; `OpenWeatherAPI.assertRequiredString` re-validates in the gateway.

**Service** → `GET /geo/1.0/direct`.

**Reply** (`normalizeGeoDirect`): array of `{ name, country, state, lat, lon }`.

## `GET /v1/weather/geo/reverse`

**Request query**: `lat`, `lon` (required, validated as above), `accuracy`
(accepted, not forwarded), `limit` (default `5`).

**Service** → `GET /geo/1.0/reverse`.

**Reply** (`normalizeGeoReverse`): array of `{ name, city, country, lat, lon }`.
Note: OWM's `state` field is mapped to ICD `city` (city-level in most
countries) — see the field-mapping comment in `LingOnWeather.ts`.
