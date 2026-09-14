# `/v1/apikey/*` — BYOK API key management

Source: [src/route/LingOnApiKey.ts](../../../src/route/LingOnApiKey.ts) ·
Repository: [src/db/apiKeyRepository.ts](../../../src/db/apiKeyRepository.ts)
(see [database/user_api_keys.md](../database/user_api_keys.md))

Lets an authenticated user store, check, and remove their own API key for one
of the LLM providers the gateway currently supports ("bring your own key").
The supported set is not fixed in this route — it is derived at import time
from the LLM gateway's provider registry (see "Provider allow-list" below).
Keys are AES-256-GCM encrypted before being persisted and are **never**
returned in any response.

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

`openai`, `gemini` — this is `SUPPORTED_PROVIDER_IDS`, exported from
`src/gateway/llm/LlmGatewayService.ts:188` as
`Object.freeze([...PROVIDER_REGISTRY.keys()])`. `PROVIDER_REGISTRY`
(`LlmGatewayService.ts:161`) is the single source of truth for which
providers the LLM gateway can dispatch to; this route
(`src/route/LingOnApiKey.ts:5`) imports `SUPPORTED_PROVIDER_IDS` from it
and keeps no allow-list of its own. There is no hardcoded provider list
anywhere else in the backend either — a third, stale copy
(`LLM_PROVIDER_IDS` in `src/gateway/llm/types.ts`) existed before Owner
decision D-005 and has been deleted. Adding a new adapter row to
`PROVIDER_REGISTRY` widens the BYOK contract automatically, with no change
required in this file's source.

`anthropic` and `openrouter` are **no longer supported or advertised**
(D-005) — they were removed from the registry, not merely left out of a
separate list.

This allow-list is enforced differently by the two mutating routes:
- `PUT /v1/apikey/:provider` — restricted to `SUPPORTED_PROVIDER_IDS`
  (`LingOnApiKey.ts:29-34`). See below.
- `DELETE /v1/apikey/:provider` — deliberately **not** restricted to
  `SUPPORTED_PROVIDER_IDS`. See below.

## `GET /v1/apikey/status`

**Request**: no params/body.

**Service**: a single `apiKeyRepo.listStoredProviders(userId)` query
(`LingOnApiKey.ts:97`), existence check only — does not decrypt or return
key material. This replaced four parallel `apiKeyRepo.hasApiKey(userId,
provider)` calls.

The handler then iterates `SUPPORTED_PROVIDER_IDS` (`LingOnApiKey.ts:102`)
to build the reply: one boolean per currently-advertised provider, `true`
if that provider appears in the stored set. **Plus**: any provider found
by `listStoredProviders` that is stored but no longer in
`SUPPORTED_PROVIDER_IDS` (i.e. a key saved before it was de-advertised)
is also added to the reply as `true` — so a stale stored key never
disappears from view and stays deletable via `DELETE
/v1/apikey/:provider`, even though it can no longer be re-registered.

**Reply** (user with no keys stored):

```json
{ "success": true, "data": { "openai": false, "gemini": false }, "error": null }
```

## `PUT /v1/apikey/:provider`

**Params**: `provider` — must be one of `SUPPORTED_PROVIDER_IDS`.

**Body**: `{ "key": "<plain-text API key>" }` — `key` required, non-empty string.

**Validation**: `assertSupportedProvider(params.provider)`
(`LingOnApiKey.ts:29-34`) — throws `AppError('INVALID_PROVIDER', 400,
'provider must be one of: <joined SUPPORTED_PROVIDER_IDS>')` for any
other value; `AppError('BAD_REQUEST', 400, 'key is required')` if the
body's `key` is missing/blank. (The validator function was renamed from
an earlier `assertProvider()` — do not refer to it by that name.)

**Service**: `apiKeyRepo.saveApiKey(userId, provider, key)` → AES-256-GCM
encrypt (`src/db/encrypt.ts`) → upsert on `(user_id, provider)`.

**Reply**: `{ "success": true, "data": null, "error": null }`

## `DELETE /v1/apikey/:provider`

**Params**: `provider` — **not** restricted to `SUPPORTED_PROVIDER_IDS`.
Only a syntactic guard applies, `assertWellFormedProvider()`
(`LingOnApiKey.ts:16-18`, pattern `/^[a-z0-9][a-z0-9_-]{0,63}$/`), which
throws `AppError('INVALID_PROVIDER', 400, 'provider is not a valid
provider id')` for a malformed value. This is deliberate
(`LingOnApiKey.ts:154`, comment: "Deliberately NOT restricted to
SUPPORTED_PROVIDER_IDS: a key stored before ..."): a key saved before its
provider was de-advertised (D-005) must remain removable even though it
can no longer be registered via `PUT`.

**Service**: `apiKeyRepo.deleteApiKey(userId, provider)`. The 400-vs-404
outcome (`LingOnApiKey.ts:161-168`) is:
- a row was deleted → success (see Reply below).
- no row was deleted **and** `provider` is not in
  `SUPPORTED_PROVIDER_IDS` → `AppError('INVALID_PROVIDER', 400, 'provider
  must be one of: <joined SUPPORTED_PROVIDER_IDS>')`.
- no row was deleted **and** `provider` is in `SUPPORTED_PROVIDER_IDS` →
  `AppError('API_KEY_NOT_FOUND', 404, 'No <provider> API key
  registered')`.

**Reply**: `{ "success": true, "data": null, "error": null }`
