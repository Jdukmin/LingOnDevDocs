# System ChangeLog

Format: `## [x.y.z] - YYYY-MM-DD` followed by bullet points. Newest first.
Governed by [../CLAUDE.md](../CLAUDE.md). Use this file for changes that
span both Backend and Frontend, or that change the ICD/Domain contract
layer itself (`requirements/domain_icd/`, `docs/icd/`) rather than one
component's implementation.

## [0.1.0] - 2026-07-29 (confirmed Baseline; supersedes the 2026-07-23 seed note below)

- **V_0.1.0 Baseline Release.** Backend, Frontend, and DevDocs are all
  promoted to `V_0.1.0` as the project's first official baseline, built on
  two independent verification/schema-verification passes each for Backend
  (`jdukmin/lingon`) and Frontend (`jdukmin/letmeknow`). No source code was
  changed by this DevDocs pass. Full narrative:
  [status/backend/V0.1.0.md](../status/backend/V0.1.0.md),
  [status/frontend/V0.1.0.md](../status/frontend/V0.1.0.md).
- `status/` rebuilt against real source-repository commit history (22
  version documents total — 10 backend, 12 frontend) instead of this docs
  mirror's own commit history, which does not track actual product
  development. See [status/README.md](../status/README.md) §2.
- Known open items carried into `V_0.1.x`: Frontend Weather module leaks
  raw exception text to users (P0); Backend DB schema is not fully
  reproducible from `migrations/` (High); CORS is fully open and HTTPS/HSTS
  is unenforced in-repo (Medium). Full list:
  [status/current_status.md](../status/current_status.md).
- 2026-07-23 seed note (original entry, kept for history): `CLAUDE.md`
  created — this repository began operating under a formal Context Loading
  Rule, ICD Rule, Verification Report Rule, Version policy, ChangeLog
  policy, and Commit convention (see [../CLAUDE.md](../CLAUDE.md)), and
  introduced `version/`, `changelog/`, `verification/` as new top-level
  directories. No existing documentation structure was reorganized.
