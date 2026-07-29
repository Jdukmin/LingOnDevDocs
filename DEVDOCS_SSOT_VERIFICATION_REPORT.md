# DevDocs SSOT Verification Report

> **Purpose**: Confirm that the entire DevDocs tree (`requirements/`, `docs/`,
> `backend/docs/`, `frontend/docs/`, `README.md`) is a single, internally
> consistent Source of Truth (SSOT). **No source code was read or modified in
> this pass** — this repository (`LingOnDevDocs`) is a documentation-only
> mirror and contains no `src/` tree to modify.
>
> **Format note for AI/automated readers**: every finding below has a stable
> `ID` (`F-01`, `F-02`, ...). Cross-reference by ID, not by prose description,
> when wiring this report into other tooling (CI doc-lint, follow-up prompts,
> etc.).

- **Date**: 2026-07-23
- **Branch**: `claude/devdocs-ssot-consolidation-f0dqqq` (base: `V_0.0`)
- **Scope reviewed**: 99 Markdown files (~8,720 lines) across
  `requirements/*` (26 files incl. `domain_icd/`), `docs/*` (22 files),
  `backend/docs/*` (30 files), `frontend/docs/*` (19 files), plus root
  `README.md` — every file in the four directories named in the task, no
  sampling.
- **Prior state**: A previous consolidation pass (dated 2026-07-21 and
  2026-07-22, visible in each file's "Change Log" / "정정" banners) already
  resolved the majority of cross-document conflicts (State-name drift in
  `action.md`/`workflow.md`/`tool.md`, the Weather response-format mismatch,
  the `google-auth.md` `avatar_url` typo, the `apikey.md`/`settings.md` stale
  "auth not implemented" notices, etc.). This pass audited the **entire**
  tree against that established SSOT baseline and fixed the residual
  inconsistencies that baseline missed, listed below.

---

## 1. Modified Documents

| # | File | Change type |
|---|---|---|
| 1 | `README.md` | Removed dead/contradictory section, fixed dead links, added repo-layout summary |
| 2 | `backend/docs/database/request_logs.md` | Fixed stale factual claim + added Change Log |
| 3 | `backend/docs/database/README.md` | De-linked dead `CLAUDE.md` references (×2) |
| 4 | `backend/docs/database/refresh_tokens.md` | De-linked dead `CLAUDE.md` reference |
| 5 | `backend/docs/FeatureList.md` | De-linked dead `CLAUDE.md` reference |
| 6 | `backend/docs/DevelopmentGuide.md` | De-linked dead `CLAUDE.md` reference |
| 7 | `backend/docs/services/README.md` | De-linked dead `CLAUDE.md` reference |
| 8 | `frontend/docs/services/AuthService.md` | Fixed broken relative link depth |
| 9 | `docs/icd/gap_analysis.md` | Updated stale "unresolved" note to reflect actual resolution |
| 10 | `requirements/domain_icd/domain_analysis.md` | Fixed duplicate section numbering (`## 2.` used twice) |
| 11 | `requirements/domain_icd/intent.md` | State table unified to snake_case |
| 12 | `requirements/domain_icd/dashboard.md` | State table unified to snake_case |
| 13 | `requirements/domain_icd/reminder.md` | State table unified to snake_case |
| 14 | `requirements/domain_icd/nas.md` | State table unified to snake_case + `BackupJob` state names aligned to Action Domain's actual canonical values |
| 15 | `requirements/domain_icd/homeassistant.md` | State table unified to snake_case |
| 16 | `requirements/domain_icd/notification.md` | State table unified to snake_case |
| 17 | `requirements/domain_icd/user.md` | State table unified to snake_case (Event names intentionally left PascalCase — see F-02) |

No files were deleted (no true "Dead Document" — an entire orphaned file with
no incoming references — was found; the dead *content* found was partial,
inside otherwise-live files, and is listed as findings below).

---

## 2. Findings — Reason, Duplicate Removed, Conflict Resolved

### F-01 — Stale "auth not implemented" claim (Logging / Database SSOT)
- **File**: `backend/docs/database/request_logs.md`
- **Conflict**: The `user_id` column doc said `req.ctx.userId` is "currently
  always `null` — auth not implemented." This directly contradicts
  `backend/docs/DevelopmentGuide.md` ("Authentication" section — implemented
  end-to-end), `backend/docs/plugins/policy.md`, `backend/docs/api/auth.md`,
  and `backend/docs/FeatureList.md` ("Current (implemented)"). It was the
  **last surviving instance** of a claim already corrected in three sibling
  files (`api/apikey.md`, `api/settings.md`, `DevelopmentGuide.md`) during the
  2026-07-22 pass — that pass missed this one file.
- **Resolution**: Corrected to state `user_id` is populated for authenticated
  routes and `null` only for routes that don't require auth (with concrete
  examples: `GET /v1/status`, `GET /v1/weather/*`, `POST /v1/auth/google`).
  Added a Change Log entry cross-referencing the three already-fixed
  siblings so a future auditor sees the full pattern in one place.
- **SSOT after fix**: `backend/docs/DevelopmentGuide.md` "Authentication" is
  the canonical description of the auth implementation; all other docs must
  agree with it, not restate it independently.

### F-02 — Domain ICD State-name casing drift (7 of 14 domains)
- **Files**: `requirements/domain_icd/{intent,dashboard,reminder,nas,homeassistant,notification,user}.md`
- **Conflict**: `action.md`, `workflow.md`, `tool.md`, and `calendar.md`
  already carry explicit "정정" (correction) banners establishing **lowercase
  snake_case** as the single canonical State-naming convention for the
  entire Domain ICD set (this was the whole point of the 2026-07-21/22
  audit — see `docs/workflow.md` "부록 — 최근 발견 사례"). That convention was
  never propagated to the other 7 domain files, which still used PascalCase
  (`Created`, `Idle`, `Scheduled`, `Unknown`, `Synced`, `Pending`,
  `Anonymous`, etc.). Since Backend/Frontend implementation is explicitly
  instructed to treat Domain ICD as authoritative
  (`requirements/domain_icd/README.md`), an implementer picking up Intent,
  Dashboard, Reminder, NAS, Home Assistant, Notification, or User next would
  have inherited the exact inconsistency the SOP was written to prevent.
- **Resolution**: All 7 State tables converted to lowercase snake_case, each
  with a `정정 2026-07-23 (DevDocs SSOT 정리)` banner pointing back at
  `action.md` as the precedent. **Event names were intentionally left in
  PascalCase** everywhere (`IntentCreated`, `ReminderScheduled`,
  `UserAuthenticated`, ...) — that convention is applied consistently across
  *all* 14 domains including `action.md`/`workflow.md`/`tool.md` themselves,
  so Event-name casing was never in conflict; only State-value casing was.
- **Additional fix bundled in `nas.md`**: `BackupJob` previously said its
  states follow Action Domain's Execution State but then listed
  `Pending/Running/Success/Failed` — `Success` does not exist in
  `action.md`'s canonical set (`succeeded`). Corrected to reference the
  actual values verbatim.
- **SSOT after fix**: `requirements/domain_icd/action.md` §State remains the
  single canonical reference for State-naming *convention* (snake_case);
  each domain's own table is now internally consistent with it.

### F-03 — Dead `CLAUDE.md` references (7 occurrences, 6 files)
- **Files**: `README.md` (×2 plain-text mentions), `backend/docs/FeatureList.md`,
  `backend/docs/DevelopmentGuide.md`, `backend/docs/database/README.md` (×2),
  `backend/docs/database/refresh_tokens.md`, `backend/docs/services/README.md`
- **Conflict**: These 6 files linked to (or named) `CLAUDE.md` at the
  repository root or under `docs/`. **No `CLAUDE.md` exists anywhere in this
  repository** (`LingOnDevDocs`) — confirmed via `find . -iname CLAUDE.md`.
  Unlike `src/*.ts` references (which are *expected* to be unresolvable in
  this docs-only mirror and are already disclosed as such in
  `requirements/README.md`), `CLAUDE.md` is itself a documentation/convention
  file, so its complete absence from the SSOT — while still being cited as
  authoritative in 6 places — reads as a broken link, not an acknowledged gap.
- **Resolution**: De-linked all 7 occurrences (removed the markdown
  hyperlink syntax so nothing 404s) and added a one-line clarification that
  `CLAUDE.md` lives in the actual backend/frontend source repositories, not
  in this docs mirror. Did **not** fabricate a `CLAUDE.md` — inventing its
  content would exceed "consolidate existing docs" and risk asserting rules
  that were never actually written down anywhere in this SSOT.
- **Follow-up recommendation**: See §9 Remaining TODO — if the real backend
  repo's `CLAUDE.md` should be part of this SSOT, it needs to be mirrored in
  by whoever maintains the mirror sync, not authored fresh here.

### F-04 — Broken relative link (Frontend ↔ Backend cross-reference)
- **File**: `frontend/docs/services/AuthService.md`
- **Conflict**: `[../../backend/docs/api/auth.md](../../backend/docs/api/auth.md)`
  from `frontend/docs/services/AuthService.md` resolves to
  `frontend/backend/docs/api/auth.md`, which doesn't exist — off by one
  directory level. This is the **only** doc-to-doc (not doc-to-source) broken
  link found in the entire tree; every other backend↔frontend cross-reference
  checked out correctly.
- **Resolution**: Corrected to `../../../backend/docs/api/auth.md` (verified
  programmatically to resolve).

### F-05 — Stale "unresolved" note that had already been resolved
- **File**: `docs/icd/gap_analysis.md`
- **Conflict**: The "문서 일관성 관련 부가 발견" section flagged
  `backend/docs/api/apikey.md`'s outdated auth notice as unresolved
  ("이번에도 수정하지 않았다 — 별도 확인/갱신 필요"), but `apikey.md` was in fact
  corrected the same day (its own "정정 2026-07-21" banner). The note in
  `gap_analysis.md` had gone stale relative to the fix it was describing.
- **Resolution**: Struck through the outdated claim and added a note
  confirming the fix (in `apikey.md`, `settings.md`, `DevelopmentGuide.md`)
  plus a pointer to F-01 above as the final remaining instance of the same
  pattern.

### F-06 — Duplicate section numbering
- **File**: `requirements/domain_icd/domain_analysis.md`
- **Conflict**: Two sections were both numbered `## 2.` ("여전히 미작성인
  제안" and "검토했지만 신규 Domain으로 제안하지 않는 것"), with `## 3.`/`## 4.`
  following the second one — a simple off-by-one from a prior edit.
- **Resolution**: Renumbered sections 2–6 sequentially. Verified no other
  document anchor-links into this file by section number (`grep` for
  `domain_analysis.md#` returned no matches), so this was a safe,
  non-breaking renumber.

### F-07 — Dead/contradictory content inside root `README.md`
- **File**: `README.md`
- **Conflict**: The file's first 61 lines are an accurate, specific
  description of *this* repository's actual layout (portal, `docs/workflow.md`,
  `requirements/`, `docs/icd/`). Lines 62–113 were leftover generic
  boilerplate — apparently an unedited template — describing a top-level
  `devdocs/` directory that **does not exist** in this repository (the real
  directories are `backend/docs/`, `frontend/docs/`, `requirements/`, `docs/`),
  and asserting `docs/` is a "Git Submodule: LetMeKnow-Docs," which is false
  in this consolidated repo (it's a plain directory, read and audited in this
  same pass). The "Claude Code 규칙" section pointed at
  `devdocs/FeatureList.md` / `devdocs/DevelopmentGuide.md`, files that don't
  exist anywhere in the tree (the real files are namespaced under
  `backend/docs/` and `frontend/docs/`).
- **Resolution**: Removed the stale template block entirely; replaced the
  "Claude Code 규칙" reading order with the actual files
  (`docs/workflow.md` → `requirements/README.md` →
  `{backend,frontend}/docs/FeatureList.md` → `{backend,frontend}/docs/DevelopmentGuide.md`),
  and added a concise, accurate "저장소 구조" section so the root README no
  longer contradicts itself about the repository's own shape.

---

## 3. SSOT Changes Summary

| Topic | Single Source of Truth (unchanged by this pass) | What changed |
|---|---|---|
| Domain State naming convention | `requirements/domain_icd/action.md` §State (lowercase snake_case) | Propagated to `intent.md`, `dashboard.md`, `reminder.md`, `nas.md`, `homeassistant.md`, `notification.md`, `user.md` — now 14/14 domains consistent (was 7/14) |
| Auth implementation status | `backend/docs/DevelopmentGuide.md` §Authentication | `request_logs.md` brought into agreement (was the last holdout) |
| Repository layout / reading order | `requirements/README.md`, `docs/workflow.md` | Root `README.md` no longer asserts a contradictory, non-existent layout |
| Source-file cross-references | N/A (out of scope — see §9) | `CLAUDE.md` mentions de-linked pending real resolution; all other `src/*` links left untouched as intentionally-disclosed mirror gaps |

No Domain definitions, API contracts, Workflow, Error Codes, Logging Policy,
Security Policy, Privacy Policy, Deployment procedure, or Monitoring procedure
required changes beyond the above — the 2026-07-21/22 pass had already
unified those, and this audit found them internally consistent across all 99
files (verified by direct cross-reading, not sampling).

---

## 4. Backend Impact

- **No backend code changes required or implied.**
- `request_logs.user_id` semantics (F-01) are now documented correctly —
  backend team should treat this as documentation catching up to already-shipped
  behavior, not a spec change.
- Domain ICD State-name casing (F-02) affects **future** implementation of
  Intent, Reminder, NAS, Home Assistant, Notification, and User Domains
  (all currently 0%–75%, no state-machine code exists yet for the ones at
  0%). Any backend work starting on these domains should use the corrected
  snake_case values directly — there is no existing code to migrate for the
  0% domains (Intent, Reminder, NAS, Home Assistant, Notification). **User
  Domain is the one exception worth double-checking**: it's 75% implemented
  (auth/session). If any backend code already emits a `SessionExpired`-style
  string as a *state value* (as opposed to the `SessionExpired` *event*,
  which stays PascalCase and is unaffected), reconcile against
  `session_expired` before treating this doc as ground truth. This report
  does not have source-code access to verify this itself (docs-only mirror).

## 5. Frontend Impact

- **No frontend code changes required or implied.**
- Same State-casing note applies symmetrically to any Frontend module state
  that might mirror these Domain ICD values (e.g., a future
  `ReminderModule`/`NotificationModule`) — none currently exist per
  `frontend/docs/FeatureList.md`, so no migration is implied today.
- `AuthService.md`'s corrected link (F-04) is documentation-navigation only;
  no behavior described in that file changed.

## 6. Breaking Change?

**No.** Every change in this pass is either:
1. A documentation-only correction of a factual claim to match already-shipped
   behavior (F-01, F-05), or
2. A naming-convention unification across **unimplemented** (0% progress)
   Domain ICD sections plus one 75%-implemented domain flagged for a
   backend-side double-check (F-02 — no source code was touched, and per
   `requirements/README.md`'s own Progress rules, 0%-progress Domains have no
   implementation to break), or
3. Dead-link/dead-content removal with no semantic content change (F-03, F-04,
   F-06, F-07).

No API contract, request/response shape, error code, DB schema, or Action
Type was added, removed, or renamed.

---

## 7. Documents That MUST Be Fixed Before Release (Pre-existing, Not New)

These are pre-existing gaps this audit re-confirmed while reading every file
— **not new findings**, already tracked in `docs/workflow.md` "출시 전 필수
체크리스트" and cross-domain docs. Listed here because the user's Verification
Report template requires them, prioritized P0–P3 (see §10 for the priority
legend):

| Priority | Item | Doc of record |
|---|---|---|
| P0 | HTTPS / CORS / Cookie `Secure`/`SameSite` — undocumented, security-relevant | `docs/policies/security_policy.md` |
| P0 | Google OAuth Verification (sensitive scope `calendar.readonly`) not started | `docs/policies/privacy_policy.md` |
| P0 | No DB migration files exist in the actual source repo (schema is inferred from code) | `backend/docs/database/README.md`, `docs/ops/data_sop.md` |
| P1 | Refresh-token cleanup job not implemented (rows never pruned) | `backend/docs/database/refresh_tokens.md`, `docs/ops/data_sop.md` |
| P1 | Backend automated tests: none exist in the repository | `docs/workflow.md` 출시 전 체크리스트 "Testing" |
| P1 | Privacy Policy / Terms: requirements-only, no actual legal text | `docs/policies/privacy_policy.md` |
| P2 | Deployment/Rollback SOP: skeleton only, no real CI/CD | `docs/ops/deployment_sop.md` |
| P2 | Monitoring/Alerting: no Sentry/Prometheus, no Alert defined | `docs/ops/monitoring.md` |
| P3 | Secret management: `.env`-only, no KMS/rotation | `docs/policies/security_policy.md` |

## 8. Rules Backend MUST Follow Going Forward

1. **Domain ICD is upstream of API ICD.** Any new Backend work on Intent,
   Reminder, NAS, Home Assistant, Notification, or User must use the
   corrected snake_case State values from `requirements/domain_icd/<domain>.md`
   as-is — do not re-derive or invent new casing.
2. **Do not silently fix ICD-vs-code drift.** Per `docs/workflow.md` Step 6:
   if implementation must diverge from an ICD, request an ICD change first;
   do not edit the ICD to match code after the fact.
3. **`request_logs.user_id` is `null` only for genuinely unauthenticated
   routes** (see F-01's corrected list) — if a route that requires auth ever
   logs `null` here, that's a code bug against the corrected doc, not a doc
   update.
4. Do not re-introduce `CLAUDE.md` links pointing into this mirror repo — if
   backend conventions need to be citable from here, the actual file must be
   mirrored in (a repo-sync/tooling change, out of scope for this docs pass).

## 9. Rules Frontend MUST Follow Going Forward

1. Same Domain ICD State-casing rule as Backend (§8.1) — any future
   `ReminderModule`/`NotificationModule`/etc. must consume snake_case state
   values.
2. `frontend/docs/services/AuthService.md` → `backend/docs/api/auth.md` is
   now a valid link; keep using it as the auth API reference rather than
   restating request/response shapes independently (avoids future drift like
   F-05's class of bug).
3. Do not re-introduce the removed root-`README.md` `devdocs/` structure
   assumption in any new Frontend doc — the real doc root for this project is
   `frontend/docs/`, referenced from the root `README.md`'s "저장소 구조"
   section.

---

## 10. Remaining Documentation TODO (Not Fixed in This Pass — Out of Scope or Needs Human/Code Access)

| Priority | TODO | Why not fixed now |
|---|---|---|
| P1 | Decide whether `CLAUDE.md` should be mirrored into this repo from the real backend/frontend source repos | Requires repo-sync tooling decision, not a docs-content fix |
| P1 | Re-verify Feature Status (Progress %) for User Domain (75%) against actual backend source, specifically whether any code path treats `SessionExpired` as a literal state string vs. an event name | Requires source-code access this mirror doesn't have (flagged explicitly in `requirements/README.md`'s own methodology note) |
| P2 | Confirm Fastify's default request logger doesn't log the `Authorization` header by default (flagged as "확인 필요" in `docs/policies/logging_policy.md`) | Requires reading actual `app.ts` logger config, not available in this mirror |
| P2 | Confirm `429` response envelope shape (plugin default vs. ICD v0.0 wrap) | Same — requires source access (`docs/policies/error_policy.md` "확인 필요") |
| P3 | If/when Home Assistant, NAS, Notion connectors are built, add their `backend/docs/api/*.md` and keep `requirements/domain_icd/*.md` as the upstream contract (process already defined in `docs/workflow.md`, nothing to fix today) | Future work, not a current inconsistency |

## 11. Priority Legend (P0–P3)

- **P0** — Must resolve before any production release; security/legal/data-loss risk.
- **P1** — Should resolve before release; high operational risk if skipped.
- **P2** — Should resolve soon after release; moderate risk, workaround exists.
- **P3** — Backlog; low risk, no immediate release blocker.

---

## 12. Methodology Note (for reproducibility)

1. Read all 99 files in `requirements/`, `docs/`, `backend/docs/`,
   `frontend/docs/`, plus root `README.md`, in full (no truncation, no
   sampling).
2. Cross-referenced: Domain definitions, State tables, Event names, API
   contracts, Error codes, Logging/Security/Privacy policy, Deployment/
   Monitoring procedure, Feature Status claims, and every relative Markdown
   link (`[text](path)`) via an automated resolver script (verifies the
   linked file actually exists relative to the linking file).
3. Distinguished **intentional, disclosed gaps** (this repo is a docs-only
   mirror; ~96 links to `src/*.ts`, `migrations/*.sql`, `server_*.sh`,
   `.env.example` are expected to 404 here and are explicitly disclosed in
   `requirements/README.md`) from **genuine defects** (dead `CLAUDE.md`
   links, one mis-depth relative link, stale factual claims, casing drift,
   numbering bugs) — only the latter were treated as findings requiring a fix.
4. No source code was read, executed, or modified. No new Domain, API, or
   feature was proposed. No Backend/Frontend implementation file was touched.
