# `ui_settings`

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
| `theme` | varchar(20) NOT NULL | required, non-empty. Corrected from a previously-documented `text`: migration `004_fix_settings_schema.sql` created it as `varchar(20) NOT NULL` and `migrations/000_baseline_schema.sql` matches that live shape |
| `language` | varchar(20) NOT NULL | required, non-empty. Same correction as `theme` above |
| `updated_at` | timestamp (no time zone) | set to `NOW()` on upsert |

## Constraints

- `CONSTRAINT chk_ui_settings_theme CHECK (theme IN ('system', 'light', 'dark'))`
  — declared in `lingon/migrations/000_baseline_schema.sql` (uncommitted);
  migration `004_fix_settings_schema.sql` checks for this exact constraint
  name before deciding whether to add it. Enforces the Settings Domain ICD
  rule that `theme` be one of `system`/`light`/`dark`, in addition to the
  route-level check in `LingOnSettings.ts`.

## Queries

- `getUISettings(userId)` — `SELECT * ... WHERE user_id = $1`, returns `null` if unset.
- `saveUISettings(userId, input)` — full-replacement upsert on `user_id`, `RETURNING *`.

## Consumers

[LingOnSettings.ts](../../../src/route/LingOnSettings.ts) — `GET`/`PUT /v1/settings/ui`.

---

# Change Log

- **2026-09-14 (TASK-007, DevDocs Update Required)** — corrected `theme` and
  `language` from `text` to `varchar(20) NOT NULL`, added the
  `chk_ui_settings_theme` CHECK constraint, and removed the stale
  "(inferred — no migration file)" title, all per
  `lingon/migrations/000_baseline_schema.sql` (uncommitted) and migration
  `004_fix_settings_schema.sql`. See also the docs-internal `updated_at`
  type-inconsistency note in [README.md](README.md).
