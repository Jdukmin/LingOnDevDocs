# Release State

> **Owner**: Supervisor (autonomous development system). This document states the
> *actual* stage backed by executed evidence — not the desired stage.
> Superseded claims elsewhere in `status/` are corrected by TASK-007.
>
> **Assessed**: 2026-09-14 against `docs@36cd588`, `letmeknow@ad08414`, `lingon@dd38b22`.
> **Method**: repository inspection + commands actually executed on this machine.

---

## 1. Stage

| | |
|---|---|
| **Current stage** | **Internal alpha** |
| **Target next stage** | **Closed-alpha candidate** |
| Previous SSOT position | `V_0.1.0` "Baseline — verified reference point, not a release" |

The prior assessment (2026-07-29) called the application layer "release-candidate
quality" with operational gaps. That remains directionally right, but it was made
without ever running the frontend toolchain, and it did not know the release
build script is broken. With execution evidence the honest stage is **internal
alpha**: the product runs and its core flows are implemented, but **no correct
distributable build exists today**.

### Evidence for this stage

**Executed 2026-09-14** (the first time any of this has been run for this repo):

| Check | Command | Result |
|---|---|---|
| Flutter toolchain | `flutter doctor` | ✅ 3.41.2, **no issues** |
| Frontend static analysis | `flutter analyze` | ✅ **No issues found** |
| Frontend tests | `flutter test` | ✅ **98 passing**, 12 test files (now 206 — see §7) |
| Backend typecheck | `tsc -p tsconfig.json --noEmit` | ✅ clean (after full `npm install`) |
| Backend tests | — | ❌ **none exist**; `package.json` has no `test` script |
| Dependency risk | `npm audit` (lingon) | ⚠️ **3 high**, 2 moderate, 2 low |
| Release build script | read `compile_release.sh` | ❌ **broken** — `FLUTTER_DEFINE_ARGS` used but never defined, under `set -euo pipefail` |
| DB reproducibility | `grep -c 'CREATE TABLE' migrations/*` | ❌ 1 of ~7 tables |
| CORS | `app.ts:135` | ❌ `origin: true` |

The first four rows are **better** than the SSOT claimed (it recorded the Flutter
SDK as unavailable and automated tests as zero across both repos). The last five
are release blockers, two of which were not previously recorded anywhere.

## 2. Capability assessment — **as found at kickoff (2026-09-14, before any work)**

> This table is the *entry* snapshot and is deliberately not rewritten — it is the
> baseline the day's work was measured against. For the current state see §3
> (blockers, all cleared in code) and §7 (validation baseline). Rows since changed:
> Weather, Chat/LLM, Database migrations, CORS, Backend testing, and
> Release/deployment are all now addressed; `useApiKey` now has a consumer.

| Area | Verdict | Basis |
|---|---|---|
| Authentication (Google OAuth, JWT, refresh rotation, 401 retry) | **DONE** | Backend live-server verification; `ApiClient._withRetry` present |
| Dashboard (7 widgets, 3-column AOD layout, variants, cards) | **DONE** | 98 tests incl. overflow/variant coverage; analyze clean |
| Calendar (Google, OAuth consent + fetch + 6-state widget) | **DONE** | Both repos verified; error mapping present |
| Weather (current + 5-day) | **BROKEN** | Works on happy path; raw exception text reaches the user on failure (TASK-002) |
| Chat / LLM | **BROKEN** | Client calls `api.openai.com` directly with a compile-time key; backend gateway does not exist |
| BYOK key storage | **PARTIAL** | Backend complete + encrypted; `useApiKey` has 0 call sites; no UI |
| Settings (AI/UI) | **PARTIAL** | GET works; PUT path is dead code |
| API contract / envelope / rate limiting / logging | **DONE** | 19 APIs previously verified against a live server |
| Database migrations | **BROKEN** | Schema not reproducible from `migrations/` |
| CORS / HTTPS | **BROKEN / UNVERIFIED** | Origin reflection open; HTTPS not enforced in code |
| Frontend testing | **DONE** | 98 tests — materially better than documented |
| Backend testing | **MISSING** | No runner, no tests |
| Release / deployment | **BROKEN** | Build script aborts; web bundle would expose any injected secret |
| Observability | **PARTIAL** | `request_logs`/`raw_logs` implemented; no monitoring stack |
| Onboarding | **OWNER DECISION REQUIRED** | Depends on D-001 (BYOK-only vs platform key) |
| Intent / Memory / Planner / Action Router / Workflow | **MISSING (intended)** | Phases 6–11, design only, explicitly out of beta scope |

## 3. Release blockers

| # | Blocker | Task | Status (2026-09-14) |
|---|---|---|---|
| 1 | Web release build aborts; web-served bundle would publish any injected provider key | TASK-001 | ✅ **cleared** — build exits 0, secret-define guard added |
| 2 | Weather shows raw exception text to users (Error Policy violation) | TASK-002 | ✅ **cleared** — mapper + 15 tests |
| 3 | Database not reproducible — no staging, no disaster recovery, no clean dev setup | TASK-003 | ✅ **cleared** — `000`→`005` reproducible + idempotent on a real cluster |
| 4 | CORS reflects every origin while auth uses cookies | TASK-004 | ✅ **cleared** — allowlist verified against a booted server |
| 5 | Chat has no backend gateway; provider key would live on the client | TASK-005 → TASK-009 | ✅ **cleared in code** — gateway built, client path deleted; **integration-unverified** |
| 6 | Backend has no tests — no evidence path beyond "it compiles" | TASK-006 | ✅ **cleared** — 29 tests / 5 suites |
| 7 | 3 high-severity dependency advisories, incl. Fastify's router | TASK-008 | ✅ **cleared** — `npm audit` 7 → 0 |

None of the seven required an Owner decision to begin. **All seven are now cleared in code.**

Two gates remain before this is a closed-alpha candidate, and neither is a code task:
1. **Integration verification** — TASK-005 and TASK-009 are validated against mocked
   transports only. No live server, no real provider credential, no real database
   round-trip. Chat has never actually run end-to-end.
2. **Commit** — everything below is uncommitted working tree.

**All of this work is uncommitted.** Nothing above is released until it is
committed — which is why no `version/*.json` has been bumped (see §7).

**Human-only blockers** (unchanged, tracked in `required_human_resource.md`):
Play/App Store registration, Google OAuth verification, Privacy Policy and Terms
legal review, real-account and real-device validation, production TLS/reverse-proxy
configuration.

## 4. Exit criteria — closed-alpha candidate

1. TASK-001 … TASK-004 validated with executed evidence.
2. `flutter analyze` clean and `flutter test` ≥ 98 passing maintained.
3. `npm test` exists and passes (TASK-006); `tsc --noEmit` clean.
4. `npm audit` reports 0 high, or each is a written accepted risk (TASK-008).
5. A fresh database reaches current schema from `migrations/` alone, twice (idempotent).
6. No provider API key present in any client build artifact.
7. Chat either routes through the backend gateway (TASK-005 + TASK-009) or is
   explicitly disabled for the alpha — an in-between state does not ship.
8. `status/` carries no claim contradicted by an executed command (TASK-007).

Not required for this stage: Phases 6–11, Todo widget (DSH-004), widget
visibility (DSH-006), monitoring stack, token streaming.

## 5. Non-blocking improvements

`LingonUsersRoute.patchMe` cannot send an explicit `city: null` (P2) · orphaned
root `ICD.md` in the frontend repo conflicting with the weather SSOT (P3) ·
`usage_logs` table written by no code (P3) · `provider_id` documented as included
in `users.md` but excluded in code — code is the safer side (P3) · 55
version-constrained Flutter packages (P4).

## 6. Owner decisions outstanding

D-001 (LLM credential policy: BYOK-only vs platform key) ·
D-002 (ship BYOK/Settings UI in the alpha) ·
D-003 (production CORS origin list) ·
D-004 (which serving strategy is production: Apache static vs `flutter run`).

Full text, options, and consequences: `docs/tasks/owner_decisions.md`.
None of them blocks the current work queue.

## 7. Validation baseline — 2026-09-14, end of autonomous pass

| Check | Result |
|---|---|
| `cd letmeknow && flutter analyze` | clean |
| `cd letmeknow && flutter test` | **206 passing** (98 committed + 108 added today) |
| `cd letmeknow && SKIP_DEPLOY=1 bash ./compile_release.sh` | exit 0 |
| `grep -raoE "sk-[A-Za-z0-9_-]{20,}" letmeknow/build/web` | no matches |
| `cd lingon && tsc -p tsconfig.json --noEmit` | exit 0 |
| `cd lingon && npm run test:types` | exit 0 |
| `cd lingon && npm run build` | exit 0 |
| `cd lingon && npm test` | **147 passing / 42 suites** |
| `cd lingon && npm audit` | **found 0 vulnerabilities** |
| `migrations/000`→`005` on a fresh PostgreSQL 18.6 DB | applies twice, idempotent |

**Version bumps deliberately NOT taken.** `version/frontend.json`'s own
`known_discrepancy` establishes that a bump requires committed implementation and
that "uncommitted working-tree code doesn't qualify". Pending on commit:
backend `0.1.0 → 0.1.1` (baseline migration, CORS allowlist, test harness,
dependency upgrade) and frontend `0.1.2 → 0.1.3` (release-script fix, error
mappers, 36 tests).

## 8. Open items with no owning task

`usage_logs` exists but nothing writes it · `updated_at` is `timestamp` on three
tables and `timestamptz` elsewhere · `lingon/CLAUDE.md` documents a
`user_api_keys` shape the SSOT does not (5 divergences; backend-repo fix) ·
backend deploy never starts or reloads a process despite PM2 being installed ·
nothing prunes old `releases/*` · no shared success-envelope helper — the
`{success,data,error}` literal is duplicated across all nine `src/route/*.ts` ·
`lingon` tracks `node_modules/` in git (~2,948 files), so every dependency change
produces an enormous diff.
