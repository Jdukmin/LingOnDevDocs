# System ChangeLog

Format: `## [x.y.z] - YYYY-MM-DD` followed by bullet points. Newest first.
Governed by [../CLAUDE.md](../CLAUDE.md). Use this file for changes that
span both Backend and Frontend, or that change the ICD/Domain contract
layer itself (`requirements/domain_icd/`, `docs/icd/`) rather than one
component's implementation.

## [0.1.0] - 2026-07-23

- Seed entry. `CLAUDE.md` created — this repository now operates under a
  formal Context Loading Rule, ICD Rule, Verification Report Rule, Version
  policy, ChangeLog policy, and Commit convention. See [../CLAUDE.md](../CLAUDE.md).
- Introduces `version/`, `changelog/`, `verification/` as new top-level
  directories. No existing documentation structure was reorganized.
