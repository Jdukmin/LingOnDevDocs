# Backend ChangeLog

Format: `## [x.y.z] - YYYY-MM-DD` followed by bullet points. Newest first.
Governed by [../CLAUDE.md](../CLAUDE.md) — every `version/backend.json` bump
must have a matching entry here.

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
