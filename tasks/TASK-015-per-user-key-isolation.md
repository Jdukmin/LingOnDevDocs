# TASK-015 — Prove per-user BYOK credential isolation
Status: Validated
Priority: P0 (security verification)
Category: Autonomous
Release relevance: Closed Alpha acceptance criterion E. Must be proven, not assumed.

## Objective
Prove by test that user B can never consume user A's provider credential, and that
the authenticated identity is the only thing that selects a key.

## Evidence / Background
The code path looks correct, but correctness here is asserted rather than tested —
and this is the highest-consequence property in the system.

Verified by inspection 2026-09-14:
- `src/route/LingOnActions.ts:201,239` — `const userId = req.ctx.userId;` then a
  401 when absent. The identity is **JWT-derived**; it is never read from the body.
- `src/gateway/llm/LlmGatewayService.ts:398` — `resolveCredential(userId, provider)`
  calls `this.deps.useApiKey(userId, provider)`.
- `src/core/base/BaseGateway.ts:192` — TASK-005 reversed `getApiKey()` precedence so
  an injected per-request key beats the platform-scoped repo. The **old** order was
  the H5 defect: a provider-scoped platform key could silently replace a user's own.

That reversal is exactly the kind of property that regresses silently under a later
refactor, and no test currently pins it end-to-end through the route.

## Authoritative Documents
- `docs/requirements/llm_gateway_requirements.md` (LLM-006)
- `docs/requirements/domain_icd/llm.md` (§CredentialSource)
- `docs/docs/policies/security_policy.md`

## Scope
Backend tests, hermetic (no live DB, no network), in the existing
`node:test`/`tsx` harness:
1. Two users with different stored keys → each request resolves its **own** key.
2. User B with no stored key does **not** receive user A's key; it falls through to
   platform (when enabled) or fails `LLM_KEY_MISSING`.
3. A `userId` supplied in the request body is ignored — only `req.ctx.userId` selects.
4. `getApiKey()` precedence: an injected per-request key wins over the repo (pins H5).
5. No key material reaches any log sink on success or failure.

## Out of Scope
- New architecture, KMS, or any change to the credential contract.
- Frontend.
- Live-provider verification.
- Changing production behaviour at all — **this task adds tests**. If a test reveals
  a real defect, report it as CRITICAL and fix only the defect.

## Affected Components
`lingon/tests/` (new). Production source only if a genuine defect is found.

## Dependencies
None.

## Acceptance Criteria
1. All five properties above are covered by passing tests.
2. Tests fail if `getApiKey()` precedence is reversed back — verify by temporarily
   inverting it, observing red, then restoring. Report that you did this.
3. Hermetic: no live DB, no network.
4. `npm test` ≥ 147 plus new tests; `tsc --noEmit`, `test:types`, `build` all clean.
5. Any real isolation defect found is reported as **CRITICAL** before being fixed.

## Validation Plan
```
cd lingon
npm test
./node_modules/.bin/tsc -p tsconfig.json --noEmit
npm run test:types
npm run build
```

## Owner Decisions
None.

## Execution Log / Evidence

Executed 2026-09-14. **Tests only — no production file was changed.**
`src/core/base/BaseGateway.ts` blob hash is `291524eccf48c81461e7a2e611d1924ffa6c0b1a`
before and after (see Mutation Check); `git status --porcelain -- src` is unchanged
from the pre-task state.

### Added
`lingon/tests/security/byokIsolation.test.ts` (643 lines, 16 tests, 5 suites).

End-to-end and hermetic: the REAL `LingOnActions` route -> the REAL
`LlmGatewayService` -> the REAL `OpenAIProvider`. Only `globalThis.fetch`, the
injected `useApiKey`/`hasApiKey`/`getAISettings` functions, and
`appLogger.saveRawLog` are substituted; all are restored in `afterEach`. No live
DB, no network, no `process.env` read or write.

The observation point for "whose credential was actually used" is the outbound
`Authorization` header captured off the stubbed `fetch` — that is the literal
plaintext value `OpenAIProvider.chatComplete` sends, so the assertion covers the
real resolution path rather than a mocked shortcut.

### The five properties

| # | Property | Tests | Result |
|---|---|---|---|
| 1 | Two users, different stored keys -> each resolves its OWN key | `sequential requests: each user resolves only their own key end-to-end through the route`; `concurrent requests on the SAME LlmGatewayService instance: no credential is cached or shared`; `neither response body contains either raw key string` | PASS |
| 2 | User B with no key never receives A's key | `P2a platform disabled: ... -> 403 LLM_KEY_MISSING, fetch not called again`; `P2b platform enabled: user-b succeeds via the PLATFORM credential, never A's key`; `P2c platform enabled: user-a still uses BYOK` | PASS |
| 3 | A body-supplied `userId` is ignored; only `req.ctx.userId` selects | `P3a` (auth b, forge a -> B's key); `P3b` (auth a, forge b -> A's key); `P3c` (auth c with no key, forge a -> 403, fetch NEVER called); `P3d` (`useApiKey` spy recorded only ctx ids) | PASS |
| 4 | `getApiKey()` precedence: injected per-request key beats the repo (H5) | `an injected BYOK apiKey wins over keyRepo/crypto, and the repo is NEVER consulted`; `with apiKey undefined, the SAME keyRepo/crypto still resolves the platform key` | PASS |
| 5 | No key material reaches any log sink, success or failure | `P5a` success; `P5b` upstream 401 whose body echoes the key back; `P5c` credential-missing; `P5d` platform key | PASS |

Property 3 forges the id in **both** places at once (top-level `userId` and
`input.userId`) in every request of that block. Property 4 also asserts
`keyRepo.getActiveKey` is never *called*, not merely that its value loses.
Property 5 asserts across **both** log sinks — the real pino instance at level
`trace` (in-memory `Writable`) and the `raw_logs` sink written directly from
`BaseGateway` via `appLogger.saveRawLog` — plus the HTTP response payload. Each
P5 test carries a non-vacuity guard (`logLines.length > 0`) so an empty sink
cannot make the leak assertions pass for the wrong reason.

### Mutation check (acceptance criterion 2)

`BaseGateway.getApiKey()` was temporarily reverted to the pre-TASK-005,
H5-defective order: the `keyRepo && crypto` branch moved **above** the
`if (this.apiKey)` branch, so the platform-scoped repository would win over an
injected per-user credential.

Result under mutation: `# tests 163 / # pass 161 / # fail 2`.

- `not ok - BYOK isolation P4 ... an injected BYOK apiKey wins over keyRepo/crypto, and the repo is NEVER consulted` (new, `byokIsolation.test.ts:540`)
- `not ok - BaseGateway.getApiKey precedence (H5) > an injected apiKey wins over a keyRepo that would return a different key` (pre-existing, `BaseGateway.test.ts:359`)

The file was then restored from a byte-level copy taken before the edit. `cmp`
reports byte-identical, the git blob hash matches the pre-mutation value, and
`grep -c MUTATION-CHECK` returns 0. Full suite green again afterwards.

### Validation (run by the orchestrator, not reported by a worker)

| Command | Result |
|---|---|
| `npm test` | `# tests 163  # suites 47  # pass 163  # fail 0` (baseline 147/42 + 16 new) |
| `./node_modules/.bin/tsc -p tsconfig.json --noEmit` | exit 0, no output |
| `npm run test:types` | exit 0, no output |
| `npm run build` | exit 0 |
| `npm audit` | `found 0 vulnerabilities` |

### Findings

**No isolation defect was found.** All five properties held on the first green
run; no assertion was weakened and no fixture loosened to obtain a pass.

Residual observations (recorded, not defects, not fixed here):

1. `AppError.plugin`'s truly-unhandled branch logs via `appLogger.log.fatal({ err })`
   — a third sink, the `appLogger`-owned pino instance, which is not the app's
   request logger and is therefore not captured by the P5 stream. Unreachable from
   these paths (every LLM error is an `AppError`), so it is untested rather than
   unsafe.
2. `src/plugins/LingOnDataManage/RequestLog.ts` (`request_logs`) is not registered
   in the bare test app, so that sink is out of this suite's reach. It records
   request metadata, not provider credentials.
3. `Route.md` already records the known residual that `httpGetJson` logs its error
   whole. The BYOK path uses `httpPostJson`, which logs the fixed projection, so
   this suite is unaffected by it.

## Completion Result

**Validated.** Closed Alpha acceptance criterion E ("User B can never consume
User A's provider credential") is now proven by test rather than asserted by
inspection. 16 tests across 5 suites pin the property end-to-end through the
route; the H5 precedence reversal is pinned by a test that was demonstrated to
fail when the precedence is inverted and to pass when it is restored.

**Not verifiable without a live DB / live provider** (unchanged by this task,
still owned by the outstanding INT-V for TASK-005 + TASK-009):

- That `user_api_keys` actually enforces uniqueness on `(user_id, provider)` and
  that `useApiKey`'s `WHERE user_id = $1` returns the right row against real
  PostgreSQL. This suite injects `useApiKey`; it proves the gateway asks for the
  right user, not that the SQL answers correctly.
- That AES-256-GCM decryption under a real `MASTER_ENCRYPTION_KEY` returns the
  registered key (covered separately and hermetically by `tests/db/encrypt.test.ts`).
- That a real provider accepts the forwarded key and that a real upstream error
  body does not carry key material in a shape this suite did not model.
