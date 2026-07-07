# `ai_settings` (inferred — no migration file)

Repository: [src/db/settingsRepository.ts](../../../src/db/settingsRepository.ts).

## Columns

| Column | Type (inferred) | Notes |
|---|---|---|
| `user_id` | text PK | one row per user (`ON CONFLICT (user_id)`) |
| `model` | text | e.g. an LLM model identifier |
| `temperature` | numeric | validated `0..2` at the route layer |
| `max_tokens` | integer | validated as a positive integer at the route layer |
| `system_prompt` | text, nullable | |
| `updated_at` | timestamp | set to `NOW()` on upsert |

## Queries

- `getAISettings(userId)` — `SELECT * ... WHERE user_id = $1`, returns `null` if unset.
- `saveAISettings(userId, input)` — full-replacement upsert on `user_id`, `RETURNING *`.

## Consumers

[LingOnSettings.ts](../../../src/route/LingOnSettings.ts) — `GET`/`PUT /v1/settings/ai`.
