# Backend Feature List

Updated from analysis of `src/` as of commit `b0ccc21` (`V_0.0.8`).
Update this file whenever a route, gateway, or DB-backed feature is added,
removed, or changes status (see the Documentation Rule in
[../../CLAUDE.md](../../CLAUDE.md)).

## Current (implemented)

| Feature | Endpoint(s) | Notes |
|---|---|---|
| Health/status check | `GET /v1/status` | Returns server name + `requestId`. See [api/status.md](api/status.md). |
| Google login — ID Token | `POST /v1/auth/google` | Flutter native (Android/iOS). Verifies `id_token` via `google-auth-library`, upserts user, issues JWT pair. See [api/auth.md](api/auth.md). |
| Google login — Redirect flow | `GET /v1/auth/google`, `GET /v1/auth/google/callback` | Web / Flutter Web. Requires `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_CALLBACK_URL`. Disabled (501) when env vars absent. See [api/auth.md](api/auth.md). |
| JWT authentication middleware | (`preHandler` hook, all routes) | `DefaultPolicy.before()` extracts `Authorization: Bearer <token>`, verifies HMAC-SHA256 JWT (`JWT_SECRET`), populates `req.ctx.userId`. See [plugins/policy.md](plugins/policy.md). |
| Current weather | `GET /v1/weather/current` | Proxies OpenWeather, normalizes to ICD shape. See [api/weather.md](api/weather.md). |
| 5-day forecast | `GET /v1/weather/forecast5` | 3-hour interval entries, flattened. |
| Forward geocoding | `GET /v1/weather/geo/direct` | City name → coordinates. |
| Reverse geocoding | `GET /v1/weather/geo/reverse` | Coordinates → place names. |
| BYOK API key status | `GET /v1/apikey/status` | Returns boolean per provider (openai/anthropic/gemini/openrouter). See [api/apikey.md](api/apikey.md). |
| BYOK API key save | `PUT /v1/apikey/:provider` | AES-256-GCM encrypted at rest, never echoed back. |
| BYOK API key delete | `DELETE /v1/apikey/:provider` | 404 if not registered. |
| AI settings get/save | `GET`/`PUT /v1/settings/ai` | Full-replacement upsert. See [api/settings.md](api/settings.md). |
| UI settings get/save | `GET`/`PUT /v1/settings/ui` | Full-replacement upsert. |
| User profile get/update | `GET`/`PATCH /v1/users/me` | Requires `req.ctx.userId`. See [api/users.md](api/users.md). |
| Request logging | (all routes) | `request_logs` row per HTTP response. See [database/request_logs.md](database/request_logs.md). |
| Server lifecycle/error logging | (process-level) | `raw_logs` rows for startup/shutdown/exceptions/provider errors. See [database/raw_logs.md](database/raw_logs.md). |
| Rate limiting | (all routes) | 30 req/min unauthenticated, 120 req/min authenticated (by `req.ctx.userId`). |
| Global error envelope | (all routes) | ICD v0.0 `{success,data,error}` via `AppError.plugin`. |

## In progress

| Feature | Status | Notes |
|---|---|---|
| Runtime provider config (`LingOnConfig/ConfigHandler.ts`) | Scaffold only | Plugin registers but its `app.decorate` call is commented out; provider keys are still sourced from `.env` (`app.config.*`), not a DB-backed config store. |
| `app.providers` registry | Type-only placeholder | Declared in `FastifyDefinition.ts` (`get`/`has`), no runtime implementation. |

## Planned (not started)

| Feature | Notes |
|---|---|
| `usage_logs` table | LLM token count / cost tracking. Referenced by TODO comments in `Logger.ts` and `RequestLog.ts`; no table, repository, or route exists yet. |
| Token refresh endpoint | `POST /v1/auth/refresh` — refresh tokens are issued but no exchange endpoint exists. |
| Additional LLM providers | `LingOnApiKey`'s allow-list (`openai`, `anthropic`, `gemini`, `openrouter`) implies planned gateways for these providers; none exist under `src/gateway/` yet besides OpenWeather. |

## Deprecated

None. No routes, gateways, or tables have been removed since project inception.

## TODO (from source comments)

- `src/core/utils/Logger.ts`, `src/plugins/LingOnDataManage/RequestLog.ts`:
  insert into `usage_logs` once LLM features land (token counts, `cost_usd`).
- `src/config/FastifyDefinition.ts`: `app.providers` registry is a placeholder
  type; no runtime registration exists.
- `src/plugins/LingOnConfig/ConfigHandler.ts`: implement DB-backed / secrets-manager
  provider config once the provider key admin API exists.
- `src/core/utils/Crypto.ts`: `cryptoUtil` (Base64) is explicitly documented as
  "NOT secure encryption" — structural scaffolding only, used solely for the
  in-memory `Repositories.ts` provider-key map. Do not confuse with
  `src/db/encrypt.ts` (AES-256-GCM), which is the real encryption path for
  `user_api_keys`.
