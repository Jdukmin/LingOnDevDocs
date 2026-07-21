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

> **Status note (정정 2026-07-21)**: 이전 버전의 이 안내는 오래된 내용이었다.
> JWT 인증이 전역 `preHandler` 훅으로 구현되어 있어([plugins/policy.md](../plugins/policy.md)),
> 유효한 `Authorization: Bearer <token>`이 있으면 `req.ctx.userId`가 정상적으로
> 채워지고 위 세 라우트 모두 정상 동작한다. `auth.md`([api/auth.md](auth.md))와
> `FeatureList.md`("Current (implemented)")가 이를 뒷받침한다. 토큰이 없거나
> 유효하지 않으면 여전히 `AppError('UNAUTHORIZED', 401)`이 발생한다 — 이는
> 버그가 아니라 인증이 필요한 라우트의 정상 동작이다.

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
