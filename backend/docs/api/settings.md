# `/v1/settings/*` — per-user AI & UI settings

Source: [src/route/LingOnSettings.ts](../../../src/route/LingOnSettings.ts) ·
Repository: [src/db/settingsRepository.ts](../../../src/db/settingsRepository.ts)
(see [database/ai_settings.md](../database/ai_settings.md) and
[database/ui_settings.md](../database/ui_settings.md))

Full-replacement (PUT/upsert) settings storage — there is no partial-update
(`PATCH`) semantics for either resource.

## Routes

| Method | Path | Auth |
|---|---|---|
| GET | `/v1/settings/ai` | Required (`req.ctx.userId`) |
| PUT | `/v1/settings/ai` | Required |
| GET | `/v1/settings/ui` | Required |
| PUT | `/v1/settings/ui` | Required |

> **Status note (정정 2026-07-21)**: `/v1/apikey/*`와 동일한 오래된 안내가 있었다.
> JWT 인증이 전역 `preHandler` 훅으로 구현되어 있어([plugins/policy.md](../plugins/policy.md)),
> 유효한 `Authorization: Bearer <token>`이 있으면 위 네 엔드포인트 모두 정상
> 동작한다. 근거: [api/auth.md](auth.md), `FeatureList.md`("Current (implemented)").
> 토큰이 없거나 유효하지 않을 때만 `AppError('UNAUTHORIZED', 401)`이 발생한다.

## `GET /v1/settings/ai`

**Reply**: `{ success: true, data: AISettings | null, error: null }` — `null`
when the user has not configured AI settings yet.

## `PUT /v1/settings/ai`

**Body**

| Field | Type | Required | Validation |
|---|---|---|---|
| `model` | string | yes | non-empty |
| `temperature` | number | yes | `0 <= temperature <= 2` |
| `max_tokens` | integer | yes | positive integer |
| `system_prompt` | string \| null | no | — |

**Service**: `settingsRepo.saveAISettings(userId, body)` — upsert on `user_id`,
returns the saved row (`RETURNING *`).

**Reply**: `{ success: true, data: AISettings, error: null }`

## `GET /v1/settings/ui`

**Reply**: `{ success: true, data: UISettings | null, error: null }`

## `PUT /v1/settings/ui`

**Body**

| Field | Type | Required | Validation |
|---|---|---|---|
| `theme` | string | yes | non-empty |
| `language` | string | yes | non-empty |

**Service**: `settingsRepo.saveUISettings(userId, body)` — upsert on `user_id`.

**Reply**: `{ success: true, data: UISettings, error: null }`
