# `/v1/apikey/*` — BYOK API key management

Source: [src/route/LingOnApiKey.ts](../../../src/route/LingOnApiKey.ts) ·
Repository: [src/db/apiKeyRepository.ts](../../../src/db/apiKeyRepository.ts)
(see [database/user_api_keys.md](../database/user_api_keys.md))

Lets an authenticated user store, check, and remove their own API key for one
of a fixed set of LLM providers ("bring your own key"). Keys are AES-256-GCM
encrypted before being persisted and are **never** returned in any response.

## Routes

| Method | Path | Auth |
|---|---|---|
| GET | `/v1/apikey/status` | Required (`req.ctx.userId`) |
| PUT | `/v1/apikey/:provider` | Required |
| DELETE | `/v1/apikey/:provider` | Required |

> **Status note**: authentication is not implemented yet — every request to
> these routes currently throws `AppError('UNAUTHORIZED', 401)` because
> `req.ctx.userId` is always `undefined`. See [FeatureList.md](../FeatureList.md).

`/apikey/status` is registered before `/apikey/:provider` so the static path
takes precedence over the dynamic param route (Fastify route-matching note,
documented in the source).

## Provider allow-list

`openai`, `anthropic`, `gemini`, `openrouter` — enforced by `assertProvider()`,
which throws `AppError('INVALID_PROVIDER', 400)` for any other value.

## `GET /v1/apikey/status`

**Request**: no params/body.

**Service**: `apiKeyRepo.hasApiKey(userId, provider)` × 4 (parallel), existence
check only — does not decrypt or return key material.

**Reply**:

```json
{ "success": true, "data": { "openai": false, "anthropic": false, "gemini": false, "openrouter": false }, "error": null }
```

## `PUT /v1/apikey/:provider`

**Params**: `provider` — must be in the allow-list.

**Body**: `{ "key": "<plain-text API key>" }` — `key` required, non-empty string.

**Validation**: `assertProvider(params.provider)`; `AppError('BAD_REQUEST', 400, 'key is required')` if missing/blank.

**Service**: `apiKeyRepo.saveApiKey(userId, provider, key)` → AES-256-GCM
encrypt (`src/db/encrypt.ts`) → upsert on `(user_id, provider)`.

**Reply**: `{ "success": true, "data": null, "error": null }`

## `DELETE /v1/apikey/:provider`

**Params**: `provider` — must be in the allow-list.

**Service**: `apiKeyRepo.deleteApiKey(userId, provider)`. Throws
`AppError('API_KEY_NOT_FOUND', 404)` if no row was deleted.

**Reply**: `{ "success": true, "data": null, "error": null }`
