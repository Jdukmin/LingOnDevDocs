# System ChangeLog

Format: `## [x.y.z] - YYYY-MM-DD` followed by bullet points. Newest first.
Governed by [../CLAUDE.md](../CLAUDE.md). Use this file for changes that
span both Backend and Frontend, or that change the ICD/Domain contract
layer itself (`requirements/domain_icd/`, `docs/icd/`) rather than one
component's implementation.

## [0.1.1] - 2026-07-30

- **Versioning convention changed**: from this entry on, every version bump
  increments only the last digit (`V_0.1.0` → `V_0.1.1` → `V_0.1.2` ...),
  per user instruction — see [../CLAUDE.md](../CLAUDE.md) Version 관리.
  This entry itself was originally drafted as `0.2.0` and renumbered to
  `0.1.1` to follow the new rule.
- **Dashboard Domain ICD extended for LLM Adaptive Dashboard UI structure.**
  Added `WidgetVariant` (Vertical/Square/Horizontal), `WidgetMetadata`, and
  `LayoutConstraint` entities to
  [requirements/domain_icd/dashboard.md](../requirements/domain_icd/dashboard.md),
  plus three new Requirements
  ([requirements/dashboard_requirements.md](../requirements/dashboard_requirements.md)
  DSH-009/DSH-010/DSH-011). Purely additive — DSH-005 (current fixed tablet
  layout) is unchanged, and no Status/Progress values were altered since
  nothing was implemented (Planned/0% throughout).
- **New Planner Requirement PLN-006 (Layout Preference Generation)** —
  [requirements/planner_requirements.md](../requirements/planner_requirements.md).
  Natural-language → Layout Preference interpretation is assigned to the
  Planner (AI Decision Layer), not Dashboard, to keep
  [dashboard.md](../requirements/domain_icd/dashboard.md)'s "no Business
  Logic" boundary intact — Dashboard only subscribes to the resulting
  `LayoutDirective`.
- **Conflict resolved, not silently overridden**: the source request
  proposed "Dashboard is the Product" as a philosophy addition. This
  directly contradicts the Adopted
  [docs/strategy/product.md](../docs/strategy/product.md) Core Philosophy
  ("Dashboard는 제품이 아니다. Action Layer가 제품이다.") and
  [docs/decisions/architecture_decisions.md](../docs/decisions/architecture_decisions.md)
  DEC-001 ("Dashboard는 MVP가 아니다", Adopted). Per user decision
  (2026-07-30), the existing SSOT was kept; the phrase was not added
  anywhere in DevDocs. Only the UI/UX technical structure (WidgetVariant,
  WidgetMetadata, LayoutConstraint, `LayoutDirective`) was adopted, inside
  Layer 3's existing boundary.
- [docs/roadmap/roadmap.md](../docs/roadmap/roadmap.md) Phase 5 Next
  Milestone updated to reflect that the "AI Layout Update 정의" milestone is
  now complete (definition only, no implementation).
- No source code was changed by this pass — `backend`/`frontend` component
  versions stay at `0.1.0`.

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
