# Backend ChangeLog

Format: `## [x.y.z] - YYYY-MM-DD` followed by bullet points. Newest first.
Governed by [../CLAUDE.md](../CLAUDE.md) — every `version/backend.json` bump
must have a matching entry here.

## [0.1.1] - 2026-09-14

- **Database reproducible from `migrations/` alone.** `000_baseline_schema.sql`
  creates all 7 documented tables; `001`/`004`/`005` gained existence guards so
  the sequence is idempotent. Verified on a throwaway PostgreSQL 18.6 cluster:
  applies clean twice, the app boots against the result, and the legacy
  pre-migration shape still upgrades correctly. `users.id` gets
  `DEFAULT gen_random_uuid()` — the documented schema without it would fail
  every login (TASK-003).
- **CORS locked down.** `origin: true` replaced by an exact-match allowlist from
  `CORS_ALLOWED_ORIGINS` (default `https://www.ling-on.com`). No-`Origin`
  requests still pass. Verified against a booted server; plugin registration
  order preserved (TASK-004).
- **LLM Gateway (SYS-010).** Provider registry, OpenAI + Gemini adapters,
  credential resolution (`byok` → `platform` → stable failure, LLM-006), error
  normalization, `POST /v1/actions/execute`, `GET /v1/actions/types`. Fills the
  contract frozen at system 0.2.0 — no contract changed. `apiKeyRepository.useApiKey`
  gets its first consumer after having zero call sites. Resolves **H5**
  (`getApiKey()` precedence reversed so a per-user key beats the platform-scoped
  repo; the old order could silently serve the wrong credential) and **M3**
  (`httpPostJson` added; `httpGetJson` byte-for-byte unchanged and pinned by
  tests). No dependency added — Node 22 `fetch`. Streaming returns
  `NOT_IMPLEMENTED` (501) (TASK-005).
- **Test harness.** `node:test` via the already-installed `tsx`; `npm test` and
  `npm run test:types` added. 163 tests / 47 suites (TASK-006).
- **Dependency advisories cleared 7 → 0**, all in-range, no major jump, no
  `--force`; `package.json` ranges byte-identical (TASK-008).
- **Per-user BYOK isolation proven by test** — 16 tests through the real route,
  gateway and adapter, verified by mutation. No defect found (TASK-015).
- Known: provider errors are logged as a fixed projection because
  `ProviderHttpError.providerBody` can echo user chat content; `httpGetJson`
  still logs its error whole (pre-existing, pending a logging-policy decision).

## [0.1.0] - 2026-07-29

- **V_0.1.0 Baseline.** Reconciled against `jdukmin/lingon` real commit
  history (V_0.0.4 → V_0.0.17) plus `BACKEND_VERIFICATION_REPORT.md`
  (2026-07-24: fixed Calendar response field names to match SSOT, removed
  undocumented query params, fixed live `user_api_keys` DB schema drift,
  corrected a stale auth comment, fixed `.env.example`) and
  `BACKEND_SCHEMA_VERIFICATION_REPORT.md` (2026-07-23: confirmed all 19
  documented endpoints live; found DB migration coverage incomplete for 5/7
  tables, CORS fully open, HTTPS/HSTS unenforced). Full per-version detail:
  [status/backend/](../status/backend/) (10 documents, V0.0.4 through
  V0.1.0).
- No API contract, DB schema, or route was added/removed by this DevDocs
  pass — this entry documents the backend's own history, it does not
  change it.

## [0.1.0] - 2026-07-23 (seed note, superseded by the entry above)

- Introduces the `version/`/`changelog/`/`verification/` SSOT system in
  this repository (see [../CLAUDE.md](../CLAUDE.md)). Did not describe a
  real backend release at the time it was written.
