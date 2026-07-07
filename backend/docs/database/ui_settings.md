# `ui_settings` (inferred — no migration file)

Repository: [src/db/settingsRepository.ts](../../../src/db/settingsRepository.ts).

## Columns

| Column | Type (inferred) | Notes |
|---|---|---|
| `user_id` | text PK | one row per user (`ON CONFLICT (user_id)`) |
| `theme` | text | required, non-empty |
| `language` | text | required, non-empty |
| `updated_at` | timestamp | set to `NOW()` on upsert |

## Queries

- `getUISettings(userId)` — `SELECT * ... WHERE user_id = $1`, returns `null` if unset.
- `saveUISettings(userId, input)` — full-replacement upsert on `user_id`, `RETURNING *`.

## Consumers

[LingOnSettings.ts](../../../src/route/LingOnSettings.ts) — `GET`/`PUT /v1/settings/ui`.
