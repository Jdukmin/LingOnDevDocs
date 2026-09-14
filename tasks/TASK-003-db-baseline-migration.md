# TASK-003 — Database not reproducible from `migrations/`
Status: Validated
Priority: P0
Category: Autonomous
Release relevance: Blocks staging, disaster recovery, and new-developer setup.

## Objective
Make a fresh, empty PostgreSQL database reach the current production schema by
running `migrations/` in order.

## Evidence / Background
- `lingon/migrations/` holds `001`–`005`. Grep for `CREATE TABLE` matches
  **only** `002_users_city_and_refresh_tokens.sql`, and only for `refresh_tokens`.
- Tables the code reads/writes but which no migration creates: `users`,
  `ai_settings`, `ui_settings`, `user_api_keys` (from `src/db/*.ts` queries),
  plus the google-token and request/raw log tables documented under
  `docs/backend/docs/database/`.
- `001`, `004`, `005` are ALTER/fix migrations that presuppose tables created by
  hand on the live server.
- Documented per-table contracts already exist in `docs/backend/docs/database/` —
  the schema is specified, only unreproducible.
- `psql` 18.6 is available locally, so this is verifiable end to end.

## Authoritative Documents
`docs/backend/docs/database/` — `users.md`, `refresh_tokens.md`, `ai_settings.md`,
`ui_settings.md`, `user_api_keys.md`, `request_logs.md`, `raw_logs.md`, `README.md`.
These are the SSOT for column names, types, and constraints.

## Scope
- Add `000_baseline_schema.sql` creating every documented table with the
  documented columns/types/constraints/indexes, idempotently
  (`CREATE TABLE IF NOT EXISTS`).
- Reconcile so existing `001`/`004`/`005` still apply cleanly **after** it on a
  fresh database.
- Record the intended run order.
- Reconcile documented schema against what `src/db/*.ts` actually queries; report
  divergence rather than silently choosing one side.

## Out of Scope
- Touching the live production database.
- A migration-runner tool or framework.
- `usage_logs` (exists in the live DB, written by no code — record as a finding
  for TASK-007; do not enshrine it in the baseline without a decision).

## Affected Components
`lingon/migrations/`. Read-only: `lingon/src/db/*.ts`.

## Dependencies
None.

## Acceptance Criteria
1. On a brand-new empty database, applying `000`→`005` in order succeeds with no error.
2. The resulting schema satisfies every column and constraint documented in
   `docs/backend/docs/database/`.
3. Every table queried anywhere in `src/db/` exists after migration.
4. Re-running the full sequence on the already-migrated database is a no-op.
5. Any doc↔code schema divergence found is written up, classified
   (DevDocs Update Required vs Implementation Correction Required), and reported.

## Validation Plan
```
psql -c "CREATE DATABASE lingon_migrate_test;"
for f in migrations/*.sql; do psql -d lingon_migrate_test -v ON_ERROR_STOP=1 -f "$f"; done
psql -d lingon_migrate_test -c "\dt"
psql -c "DROP DATABASE lingon_migrate_test;"
```
Run the sequence twice to prove idempotency. Capture table listing and per-table
description output as evidence.

If no local PostgreSQL server is reachable, report that as a blocker with the
exact connection error — do **not** mark this task validated by inspection alone.

## Owner Decisions
None.

## Execution Log / Evidence

**Executed 2026-09-14 by ORCH-BE.** Implementation by a Sonnet worker; every
validation result below was produced by the orchestrator running the commands,
not taken from the worker's claims.

### Changes

| File | Change |
|---|---|
| `lingon/migrations/000_baseline_schema.sql` (new, 192 lines) | Creates all 7 documented tables in their final (post-001/004/005) shape. Every statement is `CREATE TABLE/INDEX IF NOT EXISTS` or an inline constraint, wrapped in `BEGIN;`/`COMMIT;`. |
| `lingon/migrations/README.md` (new) | Records the intended run order (`000`→`005`) and the apply command. |
| `lingon/migrations/001_rename_provider_sub_to_provider_id.sql:14-28` | `ALTER TABLE users RENAME COLUMN provider_sub TO provider_id` wrapped in a `DO $$` block guarded on `information_schema.columns`. |
| `lingon/migrations/004_fix_settings_schema.sql:22-40` | `ADD CONSTRAINT chk_ui_settings_theme` wrapped in a `DO $$` block guarded on `pg_constraint`. |
| `lingon/migrations/005_fix_user_api_keys_schema.sql:19-37` | `ALTER COLUMN encrypted_key TYPE text USING encode(...)` wrapped in a `DO $$` block guarded on `data_type = 'bytea'`. |

Design decision: the baseline creates the **final** schema, so `001`/`004`/`005`
had to become conditional. That was required for AC 4 regardless of the choice —
`001`'s `RENAME`, `004`'s unguarded `ADD CONSTRAINT`, and `005`'s `encode()`
(which rejects a non-`bytea` input) each fail on a second run. The guards skip
only work that is already done; on a legacy database they still perform their
original work (proven below). `002`/`003` were already idempotent and were not
touched. `usage_logs` was deliberately not created (out of scope, TASK-007).

### How a database was obtained

The local PostgreSQL service on `localhost:5432` is running but rejected every
connection:

```
psql: error: connection to server at "localhost" (::1), port 5432 failed:
      FATAL:  password authentication failed for user "ykyk1"
psql: error: connection to server at "localhost" (::1), port 5432 failed:
      FATAL:  password authentication failed for user "postgres"
```

No credentials exist in the repo (`lingon/.env` does not exist). Rather than
guess passwords or fake the result, a **throwaway PostgreSQL 18.6 cluster** was
created with the installed `initdb` in the session scratchpad (trust auth, port
55432), used for all validation below, then dropped and stopped. The user's own
service on 5432 was never touched or modified.

### AC 1 + AC 4 — fresh database, full sequence run TWICE (literal output, `NOTICE` lines elided)

```
CREATE DATABASE
################ PASS 1 ################
OK: 000_baseline_schema.sql
OK: 001_rename_provider_sub_to_provider_id.sql
OK: 002_users_city_and_refresh_tokens.sql
OK: 003_google_calendar_tokens.sql
OK: 004_fix_settings_schema.sql
OK: 005_fix_user_api_keys_schema.sql
################ PASS 2 ################
OK: 000_baseline_schema.sql
OK: 001_rename_provider_sub_to_provider_id.sql
OK: 002_users_city_and_refresh_tokens.sql
OK: 003_google_calendar_tokens.sql
OK: 004_fix_settings_schema.sql
OK: 005_fix_user_api_keys_schema.sql
################ TABLES ################
 public | ai_settings    | table | postgres
 public | raw_logs       | table | postgres
 public | refresh_tokens | table | postgres
 public | request_logs   | table | postgres
 public | ui_settings    | table | postgres
 public | user_api_keys  | table | postgres
 public | users          | table | postgres
(7 rows)

OVERALL_FAIL=0
```

Every file ran under `-v ON_ERROR_STOP=1`. Pass 2 emitted only
`NOTICE: ... already exists, skipping` — no errors. **AC 1 and AC 4 met.**

### AC 2 — resulting schema

`information_schema.columns`, `pg_constraint` and `pg_indexes` were dumped and
compared against `docs/backend/docs/database/`. All documented columns, types and
nullability are present, along with the `users_provider_provider_id_key` UNIQUE
constraint, the `chk_ui_settings_theme` CHECK, and all three `refresh_tokens`
indexes including the partial
`idx_refresh_tokens_active ... WHERE (revoked_at IS NULL)`. The only deviations
from the documents are the four classified divergences below.

### AC 3 — every table the code queries exists, and the real query shapes work

The actual SQL shapes taken from `src/db/*.ts` and `src/core/utils/Logger.ts`
were executed against the migrated database:

```
INSERT INTO users (provider, provider_id, email, nickname, profile_image)
  ... ON CONFLICT (provider, provider_id) DO UPDATE
                                       -> id 2ae2cdfd-c46b-49bf-a7ba-69aa3235fdc7
  (re-run exercises the ON CONFLICT branch -> nickname Nick2)
INSERT INTO refresh_tokens (user_id, token_hash, token_version, expires_at)
                                       -> INSERT 0 1 ; active-token SELECT -> 1
INSERT INTO ai_settings ... ON CONFLICT (user_id) DO UPDATE ... RETURNING *
                                       -> u1 | gpt-4 | 0.7 | 2048 | hi
INSERT INTO ui_settings ... ON CONFLICT (user_id) DO UPDATE ... RETURNING *
                                       -> u1 | dark | ko
INSERT INTO user_api_keys ... ON CONFLICT (user_id, provider) DO UPDATE
                                       -> u1 | openai
INSERT INTO request_logs (10 cols, provider/operation NULL, query_params '{}')
                                       -> INSERT 0 1
INSERT INTO raw_logs (log, level, event, source), incl. level/source NULL
                                       -> INSERT 0 1  (x2)
NOTICE:  PASS: invalid theme rejected by chk_ui_settings_theme
ALL SMOKE QUERIES PASSED
```

Note the `users` INSERTs supply **no** `id` — they depend on the
`DEFAULT gen_random_uuid()` the baseline adds. See divergence D1.

### End-to-end — the real application booted against the migrated schema

`node dist/app.js` was started with `DB_NAME` pointing at the migrated database.
It started clean (0 `ERROR`/`FATAL` lines) and wrote its own rows through the
migrated schema:

```
raw_logs:      server_starting | info | app
               server_ready    | info | app
request_logs:  GET     | /v1/status | 200 | 3 | 127.0.0.1
               OPTIONS | *          | 204 | 0 | 127.0.0.1
               OPTIONS | /v1/status | 404 | 1 | 127.0.0.1
```

### Legacy (live-server) upgrade path — re-verified, not assumed

A second database was seeded with the hand-created pre-migration shape that the
`001`/`004`/`005` headers describe (`users.provider_sub`, no `city` or google
columns, no `refresh_tokens`, `ui_settings.settings jsonb`,
`ai_settings.provider` + `options jsonb`, `user_api_keys.encrypted_key bytea` +
`iv bytea NOT NULL`). `000`→`005` was then applied twice:

```
OK(2nd): 000_baseline_schema.sql ... OK(2nd): 005_fix_user_api_keys_schema.sql
users.provider_id : character varying            (rename still performed)
users.city / google_access_token / google_refresh_token / google_token_expire
                                                 (added by 002/003)
ui_settings.theme / .language : character varying  (settings jsonb dropped)
ai_settings.temperature / .max_tokens / .system_prompt
                                                 (provider/options dropped)
user_api_keys.encrypted_key : text               (bytea converted, iv dropped)
users_provider_provider_id_key
chk_ui_settings_theme
LEGACY_FAIL=0
```

`000` is a correct no-op there (`CREATE TABLE IF NOT EXISTS`), and the guards
still do their real work on the legacy shape. Idempotency did not come at the
cost of the live-server upgrade path.

### AC 5 — doc ↔ code divergences

| # | Object | Doc says | Code does | Classification | Baseline chose |
|---|---|---|---|---|---|
| D1 | `users.id` default | `uuid PK`, no default recorded (`users.md`) | `userRepository.create` / `upsertByProvider` (`src/db/userRepository.ts:72,138`) INSERT **without** `id`, so a DB-side default is mandatory or every login fails | **DevDocs Update Required** | `uuid PK DEFAULT gen_random_uuid()`; proven required by the smoke test above |
| D2 | `ai_settings.model` | `text` (`ai_settings.md`) | `migrations/004:47` records the live column as `varchar(64) NOT NULL`; the code never enforces a length | **DevDocs Update Required** | `varchar(64) NOT NULL` (matches the live DB) |
| D3 | `ui_settings.theme`, `.language` | `text` (`ui_settings.md`) | `migrations/004:16-17` create them `varchar(20) NOT NULL` | **DevDocs Update Required** | `varchar(20) NOT NULL` (matches 004) |
| D4 | `request_logs.provider`, `.operation`; `raw_logs.level`, `.source` | no nullability stated (unlike `request_logs.user_id`, which is explicitly documented nullable) | `RequestLog.ts` passes `req.ctx.provider ?? null` / `operation ?? null`; `Logger.ts:250,253` insert `level ?? null` / `source ?? null` (`RawLogPayload` marks both optional) | **DevDocs Update Required** | nullable — `NOT NULL` here would make every non-gateway request's log INSERT fail |

Non-divergences deliberately recorded:

- `ai_settings`/`ui_settings`/`user_api_keys.updated_at` are `timestamp` (no time
  zone) per the docs, while `users`, `refresh_tokens` and the log tables use
  `timestamptz`. The code only ever writes inline `NOW()`, which behaves
  identically either way, so nothing in the code contradicts the docs. The
  baseline followed the docs literally. **This `timestamp`/`timestamptz`
  inconsistency is a docs-side inconsistency, not a code defect** — flagged for
  TASK-007, not resolved here.
- `users.id uuid` vs `refresh_tokens.user_id text` is deliberate per `002`'s own
  header comment. No FK was added.

### Cross-document inconsistency found (outside this task's scope)

`lingon/CLAUDE.md`'s DB-schema section describes `user_api_keys` with an
`id bigserial` PK and an `FK → users.id`, and `ai_settings`/`ui_settings.user_id`
as `FK → users.id`. The designated SSOT (`docs/backend/docs/database/`) documents
no such `id` column and no FKs, and states that the absence of an FK on
`refresh_tokens.user_id` is deliberate. The SSOT was followed — `user_api_keys`
uses a composite `PRIMARY KEY (user_id, provider)`.
**Classification: DevDocs Update Required** (`lingon/CLAUDE.md` is the stale
side). Not corrected here; routed to TASK-007.

### Routing note (Route.md §5)

`Route.md`'s DATABASE/MIGRATIONS entry lists the source as `lingon/src/db/`, but
`request_logs` and `raw_logs` have **no repository** — they are written directly
by `src/core/utils/Logger.ts` and
`src/plugins/LingOnDataManage/RequestLog.ts`. Deriving those two tables required
reading outside the stated route. Route.md's DATABASE entry should also name
`src/core/utils/Logger.ts` as a schema source.

## Completion Result

**Validated.** A fresh, empty PostgreSQL 18.6 database reaches the full
documented schema by applying `migrations/000`→`005` in order with zero errors;
the whole sequence is a proven no-op on a second run; the real application boots
against the result and writes to it; and the legacy live-server upgrade path
still works. All 5 acceptance criteria are met.

Four doc↔code divergences (all **DevDocs Update Required**), one
`lingon/CLAUDE.md` inconsistency, and one `timestamp`/`timestamptz` docs
inconsistency are recorded above for TASK-007. No production database was
touched, no migration-runner framework was added, and `usage_logs` was not
created.
