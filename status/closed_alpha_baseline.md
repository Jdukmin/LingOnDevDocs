# Closed Alpha Baseline — CA-001

> **Owner**: Supervisor (autonomous release-closure system).
> **Established**: 2026-09-14 · **Branch**: `V_0.1` on all three repositories.
> Hashes below were read back from the remote with `git ls-remote` after the
> push — they are not local values assumed to have arrived.

---

## 1. Baseline

| Component | Repository | Remote commit (`refs/heads/V_0.1`) |
|---|---|---|
| Backend | `Jdukmin/LingOn` | `b5fad88b645b9951d24cf4de6710bcb2a039869f` |
| Frontend | `Jdukmin/LetMeKnow` | `48bc6656852284018153d4f71fd439d89faea11c` |
| DevDocs | `Jdukmin/LingOnDevDocs` | `6409ed7ac6cc33888b7092d0594191cfbbb663e3` |

Branches were unified to `V_0.1` by Owner decision. `letmeknow`'s local branch
was `master` while the remote had no such branch; it was renamed, and the push
was a fast-forward onto the existing remote `V_0.1` — no history was rewritten
and no new remote branch was created.

| Component | Version | Source of truth |
|---|---|---|
| Backend | **0.1.2** | `version/backend.json` |
| Frontend | **0.1.3** | `version/frontend.json` |
| System | **0.2.0** (unchanged) | `version/system.json` |

System stays at 0.2.0: the AI Platform contract was frozen there on 2026-08-01
and this work *fills* that contract rather than changing it.

## 2. Validation at this baseline

Executed against the committed state, not the working tree.

| Check | Command | Result |
|---|---|---|
| Backend tests | `cd lingon && npm test` | **230 passing / 68 suites**, 0 fail |
| Backend types | `tsc -p tsconfig.json --noEmit` | exit 0 |
| Backend test types | `npm run test:types` | exit 0 |
| Backend build | `npm run build` | exit 0 |
| Dependency risk | `npm audit` | **0 vulnerabilities** |
| Frontend analysis | `cd letmeknow && flutter analyze` | **No issues found** |
| Frontend tests | `flutter test` | **283 passing**, 0 fail |
| Client provider path | `grep -rn "api.openai.com\|fromEnvironment('OPENAI" lib/` | **no matches** |
| Raw-error leak guard | `grep -rn "setErrorMessage(e.toString())" lib/` (code only) | exactly 1 — the base class |
| DB reproducibility | `migrations/000`→`005` on a fresh PostgreSQL 18.6 | applies twice, idempotent |

## 3. What this baseline is not

**Chat has never run end-to-end.** Every transport assertion is against a mocked
HTTP layer. No live backend, no real PostgreSQL round-trip, no real provider
credential has been exercised. `TASK-005` (backend gateway) and `TASK-009`
(frontend rewiring) are code-complete and unit-verified; they are **not**
integration-verified.

Also unverified at this baseline: that `user_api_keys` enforces uniqueness on
`(user_id, provider)` against real PostgreSQL; that a real provider accepts a
forwarded BYOK key; real upstream error-body shapes; and any manual
click-through of the BYOK dialog inside the running app.

## 4. Security posture at this baseline

Five credential leaks into log sinks were found by sweeping **all 91 log call
sites** in `lingon/src` and fixed before this baseline:

| Leak | Credential exposed | Trigger |
|---|---|---|
| `request_logs.query_params` stored `req.query` verbatim | live JWT, Google OAuth code | every `?access_token=` calendar-init call |
| raw `GaxiosError` logged ×2 | `client_secret`, `refresh_token`, live Bearer | token refresh / calendar failure — routine events |
| raw Boom error logged ×2 | OAuth `client_secret` (`Authorization: Basic`) | every failed OAuth callback |
| raw `req.query` in weather routes ×4 | any client-supplied parameter | `LOG_LEVEL=debug` |
| unsanitized URL → `raw_logs`, `{ reason }` | callback query string | unhandled exception |

Each fix is mutation-verified: reverting it turns its tests red, restoring
returns them green, with byte-identical restoration confirmed by blob hash.

**Standing rule established**: pino's `redact.paths` `*` is a *single-level*
wildcard, so `*.headers.authorization` does **not** protect
`err.config.headers.authorization`. Configuring `redact.paths` is not sufficient
on its own — a raw provider/SDK error object must never be logged. Use
`projectErrorForLog` / `redactQueryParams` / `sanitizeRequestUrl`, which share a
single `REDACTED_QUERY_PARAMS` list. There are **three** log sinks — pino,
`raw_logs`, `request_logs` — and a leak-guard test must cover all three.

Per-user BYOK credential isolation is proven by 16 tests through the real route,
gateway and provider adapter, mutation-verified against the H5 precedence reversal.

## 5. Open Owner decisions at this baseline

Recorded in `docs/policies/logging_policy.md`, none blocking:

1. `httpGetJson` logs the caught error whole and puts the raw upstream body in
   `AppError.meta` (reaching the log via two sites). Three tests pin that error
   contract, so changing it is a contract change, not a leak fix.
2. The two catch-all fatal sinks log raw errors; projecting them would drop
   `stack`, which is their diagnostic value.
3. `BaseGateway.sanitizeUrl` keeps a second, divergent 7-param redaction list
   against `REDACTED_QUERY_PARAMS`' 11 — a DRY hazard, not currently exploitable.
4. A fourth inline projection shape exists at `BaseGateway.httpPostJson`.

## 6. Verdict

**Closed Alpha Candidate: NO** — on one gate only.

Live integration verification has not been performed and cannot be self-served:
it requires a running backend, a real PostgreSQL, and a real OpenAI or Gemini
BYOK key. The checklist is in the closure report and in
`docs/status/release_state.md`.

Everything reachable without those inputs is done and pushed.
