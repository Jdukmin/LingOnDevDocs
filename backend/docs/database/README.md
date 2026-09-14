# Database — implementation status

> **⚠ 2026-07-21 전략 검토 (Action Layer)**: 아래 테이블은 변경되지 않는다. Action
> Layer 도입 시 `action_executions`, `workflows`, `workflow_executions` 테이블이
> 신규로 필요할 것으로 제안된다(스키마 초안: [../../../docs/icd/action_layer_api.md](../../../docs/icd/action_layer_api.md) State 섹션,
> 갭 분석: [../../../docs/icd/gap_analysis.md](../../../docs/icd/gap_analysis.md)).

> **DevDocs Update Required (2026-09-14, TASK-007)** — this paragraph
> previously said "No migration files or `.sql` schema definitions exist in
> this repository — every table below is inferred from the columns
> referenced in `src/db/*.ts`." That is no longer true. `lingon/migrations/`
> now contains `000_baseline_schema.sql` through `005_*.sql` plus a
> `migrations/README.md` giving the run order — as of 2026-09-14 the
> baseline migration (`000_baseline_schema.sql`) is the schema of record
> for a fresh database, and the tables below are verified against it rather
> than purely inferred from `src/db/*.ts`. **`000_baseline_schema.sql` is
> currently uncommitted in the lingon working tree** — treat it as the
> intended/documented shape, not yet a merged artifact. This section
> otherwise keeps its original intent: this file is an **implementation
> status** snapshot, not a schema authority. If `../../../docs/`
> (LetMeKnow-Docs, mirrored at the repository root here) defines a
> canonical schema that differs from what's below, **do not edit either
> side** — flag it per the Documentation Rule in the backend source
> repository's `CLAUDE.md` ("LetMeKnow-Docs Repository 수정 필요") — that
> file is not mirrored into this docs-only repository.

All access goes through the single `pool` singleton in
[src/db/pool.ts](../../../src/db/pool.ts) (`pg.Pool`, max 10 connections,
30s idle timeout, 5s connection timeout). No ORM is in use — every query is
hand-written SQL via `pool.query(...)`.

## Tables

| Table | Repository | Defined in source repo's `CLAUDE.md` | Doc |
|---|---|---|---|
| `request_logs` | none (written directly by `AppLogger.saveRequestLog`) | yes | [request_logs.md](request_logs.md) |
| `raw_logs` | none (written directly by `AppLogger.saveRawLog`) | yes | [raw_logs.md](raw_logs.md) |
| `users` | [userRepository.ts](../../../src/db/userRepository.ts) | yes | [users.md](users.md) |
| `refresh_tokens` | [refreshTokenRepository.ts](../../../src/db/refreshTokenRepository.ts) | yes | [refresh_tokens.md](refresh_tokens.md) |
| `user_api_keys` | [apiKeyRepository.ts](../../../src/db/apiKeyRepository.ts) | **yes — but it CONFLICTS with this SSOT** (see [user_api_keys.md](user_api_keys.md)) | [user_api_keys.md](user_api_keys.md) |
| `ai_settings` | [settingsRepository.ts](../../../src/db/settingsRepository.ts) | no — inferred from code | [ai_settings.md](ai_settings.md) |
| `ui_settings` | [settingsRepository.ts](../../../src/db/settingsRepository.ts) | no — inferred from code | [ui_settings.md](ui_settings.md) |

### Where each table is actually written

`request_logs` and `raw_logs` have **no repository** in `lingon/src/db/`.
They are written directly by
[`AppLogger.saveRequestLog`](../../../src/core/utils/Logger.ts) /
[`AppLogger.saveRawLog`](../../../src/core/utils/Logger.ts), both driven
from the `onResponse` hook in
[`RequestLog.ts`](../../../src/plugins/LingOnDataManage/RequestLog.ts). A
reader looking for how these two tables are populated should open
`Logger.ts` / `RequestLog.ts` directly rather than searching `src/db/` for
a repository — none exists for either table. All other tables above go
through a dedicated repository file in `src/db/`.

## Not yet implemented / open findings

- `usage_logs` — **DevDocs Update Required (2026-09-14, TASK-007)**: this
  entry previously said the table was "planned ... No repository, table, or
  route exists yet." That is now half-wrong. **Open finding**: the
  `usage_logs` table already exists in the live database, but **no code
  writes to it** — no repository, and no call site inserts into it (only
  TODO comments in `Logger.ts` and `RequestLog.ts` reference it, for future
  LLM token/cost tracking). `lingon/migrations/000_baseline_schema.sql`
  (currently uncommitted in the lingon working tree) deliberately does
  **not** create `usage_logs` — see that file's header comment, which
  excludes it explicitly pending TASK-007. No `usage_logs.md` schema
  document exists in this SSOT and none should be added until a repository
  and route land.

## Known docs-internal inconsistency — `updated_at` type

**Open finding, not yet decided** — `ai_settings.updated_at`,
`ui_settings.updated_at`, and `user_api_keys.updated_at` are documented (and
implemented, per `lingon/migrations/000_baseline_schema.sql`, currently
uncommitted) as `timestamp` **without** time zone, while `users`,
`refresh_tokens`, `request_logs`, and `raw_logs` use `timestamptz`. The
baseline migration deliberately matches each table's existing documented
type rather than unifying them — both forms work today only because the
application code writes an inline SQL `NOW()` rather than binding a JS
`Date` value at the column. This split is recorded here for a future
decision (standardize on `timestamptz` everywhere, or leave as-is) — it is
not resolved by this note, and no column type has been changed as part of
recording it.
