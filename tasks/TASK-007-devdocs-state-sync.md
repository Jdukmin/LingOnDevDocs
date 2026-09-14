# TASK-007 — SSOT status contradicts verified reality
Status: Validated
Priority: P2
Category: Autonomous (DevDocs Update Required — intent already known)
Release relevance: Non-blocking, but stale status misdirects every future task.

## Objective
Correct the `docs/` status layer where it is now demonstrably wrong, and record
the newly established validation baseline.

## Evidence / Background
Verified by execution on 2026-09-14:

| SSOT claim | Verified reality | Source of claim |
|---|---|---|
| "Flutter SDK not installed — analyze/test/build not run" | `flutter 3.41.2`, `dart 3.11.0`, `flutter doctor` clean | `current_status.md` §5, BETA report |
| "automated tests 0 in both repos" | Frontend: **98 tests pass**; 12 test files. Backend: genuinely 0 | `BETA_RELEASE_STATUS_REPORT.md` Remaining Development |
| Frontend static analysis unverified | `flutter analyze` → **No issues found** | Frontend Schema Verification Report §7 |
| Backend build state unverified | `tsc --noEmit` → **clean** (after full `npm install`) | — |
| Card Component System "adopted by no widget" (uncommitted) | Now committed at `ad08414`; widget tests assert variants | `version/frontend.json` known_discrepancy |

Newly discovered, not present anywhere in the SSOT:
- `letmeknow/compile_release.sh` is **broken** (undefined `FLUTTER_DEFINE_ARGS`
  under `set -u`) → TASK-001.
- Frontend deploys as **Flutter Web served by Apache**, making any `--dart-define`
  secret publicly readable. No status/ops document states this consequence.
- `npm audit` on `lingon`: **3 high**, 2 moderate, 2 low → TASK-008.

Classification: **DevDocs Update Required** — implementation moved ahead and the
environment changed; the documents lag. No contract is being reinterpreted.

## Authoritative Documents
`docs/CLAUDE.md` (Version/ChangeLog rule), `docs/docs/workflow.md` Step 6.

## Scope
- Update `docs/status/current_status.md` and
  `docs/status/BETA_RELEASE_STATUS_REPORT.md` on the points above.
- Create `docs/status/release_state.md` — the release-state record this system
  maintains (stage, evidence, blockers, exit criteria).
- Record the validation baseline (commands + results) so future passes compare
  against a real number.
- Fix the previously-known-but-unfixed doc defects that remain true:
  `frontend/docs/FeatureList.md` Calendar status (Finding D-1),
  `docs/docs/policies/error_policy.md` 401-interceptor status (Finding D-2),
  `frontend/docs/DevelopmentGuide.md` `lib/auth/` vs `lib/modules/auth/` (D-3).
- Add the missing `error.code` table to `docs/backend/docs/api/weather.md` if the
  codes are determinable from `lingon/src/route/LingOnWeather.ts`; otherwise
  report it as still-open.

## Out of Scope
- **No source code changes** (`docs/CLAUDE.md` forbids them from this repo).
- No version bump unless a *contract* changed — status corrections alone do not
  bump versions per `docs/CLAUDE.md`.
- Restructuring directories.

## Affected Components
`docs/status/`, `docs/frontend/docs/`, `docs/docs/policies/`,
`docs/backend/docs/api/weather.md`, possibly `docs/changelog/`.

## Dependencies
Best run after TASK-001…004 land, so the corrections are made once.

## Acceptance Criteria
1. No remaining status claim that the Flutter toolchain is unavailable.
2. Test counts stated per-repository, not as one blanket "0".
3. `release_state.md` exists with stage, evidence, blockers, exit criteria.
4. Findings D-1, D-2, D-3 corrected at the source documents, not just in `status/`.
5. Newly discovered risks (broken release script, web-served secret exposure,
   dependency advisories) appear in the status layer.
6. Every claim added is traceable to a command output or a `file:line`.

## Validation Plan
No build. Evidence is a diff review plus a link check: every new claim must cite
its source, and no cited file may be missing. Re-read each edited document after
the edit to confirm no contradiction remains.

## Owner Decisions
None.

## Execution Log / Evidence

**Executed 2026-09-14 by ORCH-DOCS. Documentation-only pass — no file outside
`docs/` was modified.** Classification for every item below: **DevDocs Update
Required** — the implementation and environment moved; the documents lagged. No
contract was reinterpreted.

### 1. Validation baseline — commands actually run (not inferred)

| Command | Result |
|---|---|
| `cd letmeknow && flutter doctor` | **No issues found!** — Flutter 3.41.2 (stable), Dart 3.11.0; Android SDK, Chrome, Visual Studio, devices, network all `[✓]` |
| `cd letmeknow && flutter analyze` | **No issues found! (ran in 1.8s)** |
| `cd letmeknow && flutter test` | **`00:02 +134: All tests passed!`** — exit 0, 0 failures, 15 test files |
| `cd lingon && ./node_modules/.bin/tsc -p tsconfig.json --noEmit` | exit 0, no output — clean |
| `cd lingon && npm audit` | **7 vulnerabilities (2 low, 2 moderate, 3 high)**. high: `brace-expansion`, `fast-uri`, `find-my-way` (Fastify's own router, HTTP/2 DDoS). moderate: `fastify`, `qs` |
| Backend automated tests | **0** at the verified baseline (`dd38b22`) — `package.json` had no `test` script |

**Test-count correction — important.** A figure of "113 passing (98 + 15)" was in
circulation during this pass. It is a stale mid-day intermediate count and is
**withdrawn**. The re-executed value is **134**, confirmed independently three
times (orchestrator + two workers, one of which also ran the three new files in
isolation to confirm the 36-test delta). Composition: **98** at commit `ad08414`
+ **36** added 2026-09-14 (uncommitted, in `test/core/modules/`,
`test/modules/brief/`, `test/modules/weather/`). 98 + 36 = 134. No document may
cite 113.

`flutter analyze` also reported `55 packages have newer versions incompatible
with dependency constraints`, matching `status/release_state.md` §5 (P4).

### 2. Documents corrected

| File | Correction |
|---|---|
| `status/current_status.md` | Execution baseline §5.5 added; "Flutter SDK unavailable" removed; per-repo test counts; Known Issues refreshed; 3 new risks; pending-version-bump note |
| `status/BETA_RELEASE_STATUS_REPORT.md` | 2026-09-14 갱신 이력; every blanket "자동 테스트 0건(양쪽 모두)" split per repository; analyze/test rows marked DONE; 3 new risks/blockers; `release_state.md` pointer |
| `status/frontend/V0.1.0.md` | Superseded-notice header (historical record kept intact, not rewritten) |
| `status/roadmap.md` | Phase 12 "자동 테스트 도입(현재 0)" → Frontend already done (134), Backend remains 0 |
| `status/required_human_resource.md` | "Testing 카테고리 전체가 Not Started" → Flutter widget/integration tests exist; Backend tests + CI remain |
| `backend/docs/database/users.md` | **`id` → `uuid PK, DEFAULT gen_random_uuid()`**; `created_at`/`updated_at` `NOT NULL DEFAULT NOW()`; constraint name `users_provider_provider_id_key` |
| `backend/docs/database/ai_settings.md` | `model` `text` → `varchar(64) NOT NULL`; `temperature`/`max_tokens` `NOT NULL`; "(inferred — no migration file)" removed |
| `backend/docs/database/ui_settings.md` | `theme`/`language` `text` → `varchar(20) NOT NULL`; `chk_ui_settings_theme` CHECK added; "(inferred)" removed |
| `backend/docs/database/request_logs.md` | `provider`/`operation`/`user_id` marked nullable; other columns `NOT NULL` |
| `backend/docs/database/raw_logs.md` | `level`/`source` nullable; `event` `NOT NULL` |
| `backend/docs/database/user_api_keys.md` | "(inferred — no migration file)" title removed; `NOT NULL`/default/composite-PK shape stated; **`lingon/CLAUDE.md:325-333` conflict recorded as a 5-row comparison table** |
| `backend/docs/database/README.md` | "no migration files exist" premise corrected; "where each table is actually written"; `usage_logs` corrected; `updated_at` type inconsistency recorded |
| `backend/docs/api/weather.md` | **`## Errors` — 11-row `error.code` table added** (SSOT first); rate-limit description corrected |
| `docs/policies/error_policy.md` | 429 row "envelope 미문서화 — 확인 필요" corrected; **client `RouteException` code table added** (SSOT first) |
| `docs/ops/deployment_sop.md` | "no deployment pipeline (0%)" corrected → real pipeline, web-secret exposure, symlink rollback |
| `frontend/docs/DevelopmentGuide.md` | **Finding D-3** — `lib/` tree rewritten against measured reality |
| `frontend/docs/FeatureList.md` | Weather P0 marked fixed (uncommitted); executed analyze/test results; client error-code gap recorded |
| `verification/backend/2026-09-14-ssot-state-sync.md` | New — Verification Report Rule, 5 required sections |
| `verification/frontend/2026-09-14-ssot-state-sync.md` | New — same, cross-linked |

`status/release_state.md` is Supervisor-owned: **read and referenced, never
rewritten.** No file under `docs/tasks/` other than this one was touched
(other orchestrators are editing that directory concurrently).

### 3. The substantive database finding

`backend/docs/database/users.md` documented `users.id` as `uuid PK` with **no
default**, while `lingon/src/db/userRepository.ts:72` (`create()`) and `:138`
(`upsertByProvider()`) both `INSERT INTO users (provider, provider_id, email,
nickname, profile_image)` — no `id` column. **A database built from the document
as written would fail every login INSERT on a NOT NULL violation.**
`lingon/migrations/000_baseline_schema.sql` declares
`id uuid PRIMARY KEY DEFAULT gen_random_uuid()` (built-in since PostgreSQL 13).
The document was the wrong side; corrected.

### 4. Findings D-1 / D-2 / D-3 — only one was actually open

Contrary to the task's premise, **D-1 and D-2 were already corrected at their
source documents on 2026-07-29** — verified at `frontend/docs/FeatureList.md:24`
and `:74-79`, and `docs/policies/error_policy.md:41`. They were **not**
re-applied. What was stale was `current_status.md` §5's claim that "이번 패스는
`status/`만 갱신했고 원본은 아직 수정하지 않음" — that sentence was corrected.
**D-3 was genuinely open** and is now fixed; the `lib/` tree was stale well
beyond the `lib/auth/` item (flat `modules/*.dart` entries that are really
directories, missing `core/dashboard/`, `core/design/`, `core/registry/`, and
more), so the whole tree was rewritten against `find lib -type d` / `ls`.

### 5. Newly recorded in the SSOT for the first time

1. **Flutter Web + Apache static serving ⇒ every `--dart-define` value is
   publicly readable** in the served JS. The frontend rsyncs `build/web/` to
   `/var/www/lingon/releases/<timestamp>/`; Apache serves via the `current`
   symlink. This is why `assert_no_secret_defines()` exists.
2. **A real rollback mechanism exists** — repoint `current` at a previous
   `releases/<timestamp>` and reload Apache. Previous releases stay on disk.
3. **Client-emitted `RouteException` codes** (`TIMEOUT`, `CLIENT_EXCEPTION`,
   `NETWORK_ERROR`, `HTTP_EXCEPTION`, `FORMAT_ERROR`, `INVALID_JSON_OBJECT`,
   `HTTP_<status>`, `UNKNOWN_ERROR`) — `error_handler.dart:38/45/52/59/65/93-96`,
   `base_route.dart:74/76/214-216` (+4 more pairs). Not server codes.
4. **`/v1/weather/*` `error.code` table** — 11 codes, all derived from source.
5. **`run_release.sh` has two real defects**: the TLS key path ends `.pe`, not
   `.pem`; and it is `flutter run` (a dev server) bypassing the Apache
   `current`-symlink path entirely. Recorded as open gaps — **not fixed**
   (source edits are outside this repository's authority).
6. **Backend "deploy" is a build only** — `server_deploy.sh` runs `npm install`
   + `npm run build` and nothing else. `server_init.sh` installs PM2 but no
   script ever invokes it; process start/reload is an undocumented manual step.
7. **`lingon/CLAUDE.md:325-333` conflict** — five divergences, not one:
   `id bigserial PK` (SSOT: no `id` column), `user_id FK → users.id` (SSOT:
   `text`, no FK), `provider varchar` (SSOT: `text`), PK on `id` (SSOT:
   composite `(user_id, provider)`), `updated_at timestamptz` (SSOT:
   `timestamp`). The composite key is what `apiKeyRepository.ts` actually
   needs — `saveApiKey`'s `ON CONFLICT (user_id, provider)` requires exactly
   that unique key, and no query ever selects or orders by an `id`. That file
   is in the **backend** repository, so this pass could not fix it. Recorded
   as an open finding in `backend/docs/database/user_api_keys.md`; per
   `Route.md` §1 the SSOT wins.

### 6. Version / ChangeLog — deliberately NOT touched

`version/*.json` and `changelog/*.md` were **not modified**. Two independent
reasons:

- Every code change these corrections describe is **uncommitted working-tree
  state**. `version/frontend.json`'s own `known_discrepancy` sets the precedent:
  "Version 관리 rule requires actual committed implementation, and uncommitted
  working-tree code doesn't qualify."
- Per `docs/CLAUDE.md` "Version 관리", documentation corrections that change no
  contract do not bump a version either.

No ChangeLog entry was written for unreleased, uncommitted work.

**Pending bumps, valid only after the corresponding commits land:**

| Component | Bump | Will cover |
|---|---|---|
| backend | Patch `0.1.0` → `0.1.1` | `migrations/000_baseline_schema.sql` (TASK-003) + the conditional guards added to migrations 001/004/005 |
| frontend | Patch `0.1.2` → `0.1.3` | `compile_release.sh` fix + `assert_no_secret_defines()` (TASK-001); `weather_error_mapper.dart` + `brief_error_mapper.dart` (TASK-002); 36 new tests |

Recorded in `status/current_status.md` §6 and in both verification reports.

### 7. Validation evidence (there is no build)

- **Every citation checked individually** with `sed -n '<line>p'`. Two were
  wrong and were corrected before publication: the rate-limit `max` expression
  is `src/app.ts:182`, not `:183` (`:183` is `keyGenerator`); the
  `HTTP_<statusCode>` fallback is `error_handler.dart:93-96`, not `93-95`.
- **Link check**: a script resolved every relative markdown link added by this
  pass — **15 of 22 resolve**. The 7 that do not are all the pre-existing
  `../../../src/...` mirror convention used throughout `backend/docs/` (those
  documents are mirrored into the backend repository, where the path resolves;
  see `backend/docs/database/README.md`'s own note). The new lines follow the
  same convention as the untouched lines around them — no new breakage.
- **Every edited document re-read end to end.** Residual contradictions found
  and fixed during review: a duplicated `Backend 처리` row in the 429 table of
  `error_policy.md`; preambles in `ai_settings.md`/`ui_settings.md` still saying
  "inferred — no migration file" while the body cited the migration; and three
  status documents outside the workers' assignments
  (`status/frontend/V0.1.0.md`, `status/roadmap.md`,
  `status/required_human_resource.md`) still asserting the toolchain/test gap.
- `grep -rn "113"` across `status/`, `frontend/docs/`, `backend/docs/` and
  `docs/` returns only genuine line-number citations — no stale test count
  remains.

### 8. Source repositories untouched — proof

Snapshots were taken at the start of this pass and compared at the end.

```
$ git -C letmeknow status --porcelain
 M compile_release.sh
 M lib/core/modules/weather_icon_module.dart
 M lib/modules/brief/brief_module.dart
 M lib/modules/weather/weather_module.dart
 M linux/flutter/generated_plugin_registrant.cc
 M linux/flutter/generated_plugin_registrant.h
 M linux/flutter/generated_plugins.cmake
 M windows/flutter/generated_plugin_registrant.cc
 M windows/flutter/generated_plugin_registrant.h
 M windows/flutter/generated_plugins.cmake
?? lib/modules/brief/brief_error_mapper.dart
?? lib/modules/weather/weather_error_mapper.dart
?? test/core/modules/
?? test/modules/
```

Identical to the opening snapshot — `diff` confirmed, including after
`flutter test` and `flutter analyze` were run (build output is covered by
`.gitignore`'s `.dart_tool/` and `build/`).

```
$ git -C lingon status --porcelain | grep -v node_modules
 M CLAUDE.md
 M migrations/001_rename_provider_sub_to_provider_id.sql
 M migrations/004_fix_settings_schema.sql
 M migrations/005_fix_user_api_keys_schema.sql
 M package-lock.json     <- NOT this pass: concurrent (dependency upgrade)
 M package.json          <- NOT this pass: TASK-006, concurrent
 M src/app.ts
 M src/config/FastifyDefinition.ts
 M src/config/env.ts
 M tsconfig.json         <- NOT this pass: TASK-006, concurrent
?? migrations/000_baseline_schema.sql
?? migrations/README.md
?? tests/                <- NOT this pass: TASK-006, concurrent
?? tsconfig.test.json    <- NOT this pass: TASK-006, concurrent
```

Five entries appeared during the pass — `package.json`, `package-lock.json`,
`tsconfig.json`, `tests/`, `tsconfig.test.json`. Four are **TASK-006's backend
test harness**, landed concurrently by another orchestrator (`git diff
package.json` shows an added `test` script running `node --import tsx --test`).
`package-lock.json` is a **dependency upgrade** (`git diff` shows version bumps
such as esbuild `0.27.3` → `0.28.2`), i.e. the result of an `npm install` /
`npm audit fix` run by a concurrent orchestrator — most likely TASK-008.

This pass performed **read-only** access to `lingon/`: `cat` / `sed` / `grep`,
`tsc -p tsconfig.json --noEmit`, and `npm audit`. None of those rewrites a
lockfile or upgrades a dependency (`npm audit` reports; only `npm audit fix` /
`npm install` would write). All other entries pre-date the pass.

**Consequence for the audit figure**: the `npm audit` result recorded above
(3 high / 2 moderate / 2 low) is accurate **as of the moment it was run** during
this pass. If TASK-008's upgrade lands, that figure changes and this baseline
must be re-run rather than quoted.

### 9. Routing

`Route.md` was sufficient — no routing failure. One consequence to hand back to
its owner: `Route.md` §RELEASE/DEPLOY names **itself** the interim authority for
deploy shape "until `deployment_sop.md` is rewritten". That condition is now
met, so authority returns to `docs/docs/ops/deployment_sop.md`. `Route.md` lives
at the repository root, outside `docs/`, so it was **not edited** — flagged for
its owner. `Route.md` §4's frontend-test baseline ("98 passing") should likewise
be refreshed to 134.

## Completion Result

**Validated.** All six Acceptance Criteria met:

1. ✅ No status claim that the Flutter toolchain is unavailable. `status/` was
   swept; `status/frontend/V0.1.0.md` is kept as a dated historical record with
   an explicit superseded notice rather than being rewritten.
2. ✅ Test counts stated per repository everywhere: **Frontend 134** /
   **Backend 0 at the verified baseline** (with TASK-006's uncommitted harness
   noted but not counted).
3. ✅ `release_state.md` exists with stage, evidence, blockers and exit criteria.
   Supervisor-owned — referenced, not rewritten.
4. ✅ D-1/D-2 confirmed already corrected at source (2026-07-29); **D-3 corrected
   at source** in `frontend/docs/DevelopmentGuide.md`, along with the rest of the
   stale `lib/` tree.
5. ✅ Newly discovered risks are in the status layer: broken release script
   (fixed, uncommitted), web-served secret exposure, dependency advisories.
6. ✅ Every added claim traces to a command output or a `file:line`; all
   citations were individually verified and two were corrected before
   publication.

Beyond the stated scope, also delivered: the weather `error.code` table
(11 rows, fully derivable — **added**, not left open), the client
`RouteException` code table, the `deployment_sop.md` rewrite, and two
Verification Reports under `verification/` per `docs/CLAUDE.md`'s Verification
Report Rule.

**Not done, deliberately**: no `version/*.json` bump, no `changelog/*.md` entry,
no commit, no branch, no source-code change. Two pending Patch bumps are
recorded and blocked on their commits.

**Open items handed onward**: `usage_logs` (exists, written by nothing —
decide); the `updated_at` `timestamp`/`timestamptz` split; the `lingon/CLAUDE.md`
`user_api_keys` conflict (backend-repo fix); `run_release.sh`'s `.pe` cert path
and dev-server deploy path; backend deploy has no process start/reload; nothing
prunes old `releases/*`; `Route.md` §4 and §RELEASE/DEPLOY need a refresh.
