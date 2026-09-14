# Task Backlog

Controlled unit of work for the LetMeKnow autonomous development system.
**No substantial implementation happens without a task file here.**

Entry point for context routing is `docs/docs/route_index.md` — the canonical,
version-controlled routing index. The former workspace-root `/Route.md` is now
only an untracked pointer stub (the workspace root is not a git repo, so that
file cannot be versioned or authoritative).

## Format

One file per task: `TASK-<nnn>-<slug>.md`.

```
# TASK-nnn — Title
Status: Open | In Progress | Blocked | Validated | Closed
Priority: P0..P5
Category: Autonomous | Owner Decision Dependent | Research
Release relevance: <blocks stage X / non-blocking>

## Objective
## Evidence / Background      (verified facts + file:line, not assumptions)
## Authoritative Documents
## Scope
## Out of Scope
## Affected Components
## Dependencies
## Acceptance Criteria
## Validation Plan            (exact commands; output is the evidence)
## Owner Decisions            (D-nnn refs, or "none")
## Execution Log / Evidence
## Completion Result
```

Keep the task smaller than the work it governs. Group by
**independently verifiable outcome**, not by file touched.

## Priority

| | Meaning |
|---|---|
| P0 | Release blocker / data loss / auth / security / broken critical flow |
| P1 | Required next-stage functionality |
| P2 | Integration & reliability gaps |
| P3 | Test / observability / operational readiness |
| P4 | UX, cleanup, optimization |
| P5 | Future-stage |

## Registry

| ID | Title | P | Category | Status |
|---|---|---|---|---|
| [TASK-001](TASK-001-release-build-secret-path.md) | Web release build is broken and secret-unsafe | P0 | Autonomous | Validated |
| [TASK-002](TASK-002-weather-error-mapping.md) | Weather exposes raw exception text to users | P0 | Autonomous | Validated |
| [TASK-003](TASK-003-db-baseline-migration.md) | Database not reproducible from `migrations/` | P0 | Autonomous | Validated |
| [TASK-004](TASK-004-cors-allowlist.md) | CORS reflects every origin | P1 | Autonomous | Validated |
| [TASK-005](TASK-005-llm-gateway-backend.md) | Backend LLM Gateway (SYS-010) | P1 | Autonomous | Validated |
| [TASK-006](TASK-006-backend-test-harness.md) | Backend has no test runner | P2 | Autonomous | Validated |
| [TASK-007](TASK-007-devdocs-state-sync.md) | SSOT status contradicts verified reality | P2 | Autonomous | Validated |
| [TASK-008](TASK-008-dependency-vulnerabilities.md) | 3 high-severity backend dependency advisories | P2 | Autonomous | Validated |
| [TASK-009](TASK-009-chat-backend-migration.md) | Frontend chat must route through backend | P1 | Autonomous | Validated |
| [TASK-010](TASK-010-byok-settings-ui.md) | BYOK/Settings write paths are dead code | P2 | Owner Decision Dependent | Validated |
| [TASK-011](TASK-011-runguarded-error-leak-class.md) | Remaining modules leak raw exception text via `runGuarded` | P2 | Autonomous | Validated |
| [TASK-012](TASK-012-run-release-script-defects.md) | `run_release.sh` broken TLS key path and unclear role | P2 | Mixed | Validated |
| [TASK-013](TASK-013-chat-history-error-pollution.md) | Chat replays rendered error bubbles back to the model | P3 | Autonomous | Validated |
| [TASK-014](TASK-014-chat-credential-user-flow.md) | Chat has no usable path for a user without a credential | P1 | Autonomous | Validated |
| [TASK-015](TASK-015-per-user-key-isolation.md) | Prove per-user BYOK credential isolation | P0 | Autonomous | Validated |

**Integration verification (INT-V) is outstanding for TASK-005 + TASK-009.** Both
are validated against mocked transports only. Neither has been exercised against a
live server with a real provider credential, so chat is **not** proven working
end-to-end. See `docs/status/release_state.md` §4.

Status values are authoritative here and in the task file; keep them equal.
