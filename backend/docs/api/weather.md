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
Rate-limited at 30 req/min (unauthenticated tier).

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
