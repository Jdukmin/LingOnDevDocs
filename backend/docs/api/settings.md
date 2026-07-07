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

> **Status note**: same as `/v1/apikey/*` — all four endpoints 401 until
> authentication populates `req.ctx.userId`. See [FeatureList.md](../FeatureList.md).

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
