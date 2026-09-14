# `ai_settings`

Repository: [src/db/settingsRepository.ts](../../../src/db/settingsRepository.ts).

> **DevDocs Update Required (2026-09-14, TASK-007)** — this file's title
> previously read "(inferred — no migration file)". That is no longer true:
> `lingon/migrations/000_baseline_schema.sql` (currently **uncommitted** in
> the lingon working tree) defines this table, so the columns below are no
> longer an inference from `src/db/*.ts` alone.

## Columns

| Column | Type | Notes |
|---|---|---|
| `user_id` | text PK | one row per user (`ON CONFLICT (user_id)`) |
| `model` | varchar(64) NOT NULL | e.g. an LLM model identifier. Corrected from a previously-documented `text`: `migrations/000_baseline_schema.sql` declares `model varchar(64) NOT NULL`, and migration `004_fix_settings_schema.sql`'s own comment states the live column is `varchar(64) NOT NULL` and was deliberately left untouched |
| `temperature` | numeric NOT NULL | validated `0..2` at the route layer; `saveAISettings`'s upsert always supplies a value, so no default is needed |
| `max_tokens` | integer NOT NULL | validated as a positive integer at the route layer; always supplied by `saveAISettings`'s upsert |
| `system_prompt` | text, nullable | |
| `updated_at` | timestamp (no time zone) | set to `NOW()` on upsert |

## Queries

- `getAISettings(userId)` — `SELECT * ... WHERE user_id = $1`, returns `null` if unset.
- `saveAISettings(userId, input)` — full-replacement upsert on `user_id`, `RETURNING *`.

## Consumers

[LingOnSettings.ts](../../../src/route/LingOnSettings.ts) — `GET`/`PUT /v1/settings/ai`.

---

# Change Log

- **2026-09-14 (TASK-007, DevDocs Update Required)** — corrected `model` from
  `text` to `varchar(64) NOT NULL`, added explicit `NOT NULL` on
  `temperature`/`max_tokens`, and removed the stale "(inferred — no
  migration file)" title, all per `lingon/migrations/000_baseline_schema.sql`
  (uncommitted) and migration `004_fix_settings_schema.sql`'s comment. See
  also the docs-internal `updated_at` type-inconsistency note in
  [README.md](README.md).
