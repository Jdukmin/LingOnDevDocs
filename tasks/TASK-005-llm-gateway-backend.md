# TASK-005 — Backend LLM Gateway (SYS-010)
Status: Validated
Priority: P1
Category: Autonomous
Release relevance: Required for chat to exist as a product feature at all.

## Objective
Implement the provider-agnostic backend LLM Gateway that the frozen system-0.2.0
contract specifies, so chat traffic stops going client→provider.

## Evidence / Background
- `docs/version/system.json` — system `0.2.0` froze the AI Platform contract on
  2026-08-01 and explicitly states the implementation *fills* that contract
  (no further system bump during this phase).
- `docs/requirements/domain_icd/llm.md` — LLM Domain, `Status: Proposed, 0%`.
- Backend has no LLM gateway: `lingon/src/gateway/` is OpenWeather + Google only;
  `package.json` has no LLM provider SDK.
- `lingon/src/db/apiKeyRepository.ts` — BYOK store is fully built and encrypted
  (AES-256-GCM), but `useApiKey` has **zero call sites**: keys are stored and
  never consumed.
- The 2026-08-01 review recorded three blockers the implementation must respect:
  - **H5** — `BaseGateway.getApiKey()` calls `GatewayKeyRepo.getActiveKey(provider)`,
    which is provider-scoped with no `userId`; BYOK is user-scoped. The existing
    adapter base cannot carry a per-user key without a change.
  - **M3** — `BaseGateway`'s only HTTP helper is GET (`httpGetJson` hardcodes
    `method:'GET'`). Chat completion needs POST.
  - **M4** — the provider list is hardcoded in three frontend places.

## Authoritative Documents
- **Implementation spec, already written — follow it, do not re-derive**:
  `docs/docs/ai_platform/backend_prompt_ai_gateway.md`
- `docs/requirements/domain_icd/llm.md`
- `docs/requirements/llm_gateway_requirements.md` (LLM-001…007)
- `docs/docs/icd/action_layer_api.md` (Action Type + error-code table)
- `docs/docs/policies/security_policy.md`

## Scope
As bounded by `backend_prompt_ai_gateway.md` — provider adapter abstraction,
credential resolution (`byok` → `platform` → stable failure, LLM-006), the
documented API surface, error normalization, and its tests.

## Out of Scope
- Intent, Memory/RAG, Planner, Workflow (Phases 6–11, not beta scope).
- Frontend rewiring — TASK-009.
- Any change that promotes LLM above the Action Layer (forbidden by DEC-004).

## Affected Components
`lingon/src/gateway/`, `lingon/src/core/base/` (H5/M3 contract changes),
`lingon/src/route/`, `lingon/src/db/apiKeyRepository.ts` (consumer side),
`lingon/package.json`, backend tests.

## Dependencies
- TASK-006 (test harness) should land first so this ships with real tests.
- D-001 sets the *default* credential policy value, not the implementation.

## Acceptance Criteria
1. Adapter contract satisfies LLM-007: adding a provider touches only an adapter —
   no change to Action Type, envelope, DB schema, or frontend.
2. Credential resolution implements LLM-006 including the stable
   "no credential" error.
3. H5 resolved: a per-user BYOK key can reach the adapter. The contract change is
   documented, not improvised.
4. M3 resolved: a POST-capable helper exists without breaking existing GET callers.
5. Provider wire formats and raw provider errors never escape the adapter.
6. No key material in any log.
7. `tsc --noEmit` clean; new tests pass.

## Validation Plan
```
cd lingon
./node_modules/.bin/tsc -p tsconfig.json --noEmit
npm run build
npm test
```
Plus a real request through the gateway with a test credential, and a negative
test for the no-credential path. Mock-only results are not acceptable as evidence
of the provider call working.

## Owner Decisions
D-001 (platform vs BYOK-only default) — does not block implementation.

## Execution Log / Evidence

Executed 2026-09-14. Implemented to the frozen spec in
`docs/docs/ai_platform/backend_prompt_ai_gateway.md`; no contract was re-derived.
Backend-only — no frontend file was touched (M4 remains TASK-009's).

### What changed

**Base class — the two blockers (`lingon/src/core/base/BaseGateway.ts`, 470 → 681 lines)**
- `:88` `RequestScopedGatewayDeps` — new exported deps type for an adapter whose
  credential is resolved per request. `keyRepo?: never; crypto?: never`
  structurally forbids wiring the platform-scoped key repository into a
  per-user path. Assignable to `BaseGatewayDeps` with no cast.
- `:109` `ProviderHttpError extends AppError` — carries `providerStatus` and
  `providerBody` as instance fields. Its `meta` deliberately holds only
  `{...meta, status}`: `AppError.plugin` serialises `err.meta` straight into
  the client envelope, so a body in `meta` would leak the provider wire format
  (LLM-007 invariant 2/3).
- `:192` `getApiKey()` — **resolution precedence reversed** (H5, below).
- `:470` `postJson()` / `:515` `httpPostJson()` — the POST helper (M3, below).
- `:573-596` error logging projects the caught error to a fixed shape instead of
  logging it whole (defect found and fixed during validation, below).

**LLM domain (`lingon/src/gateway/llm/`, new, 1 437 lines)**
- `types.ts` — `LlmMessage`, `LlmCompletion`, `LlmInvocation`, `CredentialSource`,
  `IAIProvider`, `LLM_PROVIDER_IDS`.
- `LlmErrors.ts:39` — `LLM_ERROR_STATUS`, the 8 frozen codes with their exact
  documented statuses (incl. `LLM_AUTH_FAILED` = **502, not 401**), the
  retryable set, and `mapProviderStatusToLlmCode()`, which inspects a provider
  body only to choose a code and then discards it.
- `OpenAIProvider.ts` / `GeminiProvider.ts` — adapters extending `BaseGateway`
  and implementing `IAIProvider`, dispatching on `input.route` exactly like
  `OpenWeatherAPI`. Each normalizes its own wire shape to `LlmCompletion`;
  neither knows which Action called it.
- `LlmGatewayService.ts:161` `PROVIDER_REGISTRY` — `Map<provider, {label,
  defaultModel, create}>`; `:398` `resolveCredential()`; `:317`
  `listProviders()`; fallback and usage recording in `chatComplete()`.

**Action surface (`lingon/src/route/LingOnActions.ts`, new, 335 lines)**
- `:200` `GET /v1/actions/types` — provider catalog, sourced *only* from
  `listProviders(userId)`; no provider list is hardcoded anywhere in the route.
- `POST /v1/actions/execute` — `type`/`input`/`source` envelope (the field is
  `input`, not `payload`), returning the ICD v0.0 envelope with the normalized
  `LlmCompletion` under `data.result`.
- `:168` unknown `type` → `ACTION_TYPE_UNKNOWN` (404); `:250` `stream:true` →
  `NOT_IMPLEMENTED` (501).

**Config (additive only)** — 8 `LLM_*` keys added to `src/app.ts` `schema.properties`,
`src/config/FastifyDefinition.ts`, and `src/config/env.ts`. `schema.required`
is unchanged (`['PORT','HOST']`) so the server still starts without LLM config
and fails per request instead. `CORS_ALLOWED_ORIGINS` (TASK-004) and the
load-bearing plugin registration order were preserved; the diff is insertions only.

### H5 — key scoping mismatch: resolved, with a documented contract change

`GatewayKeyRepo.getActiveKey(provider)` has no `userId`, so the base class could
not carry a per-user BYOK key. Seam **(a) service-layer resolution** was chosen
(the spec's recommended option): `LlmGatewayService` resolves the key and injects
the plaintext into a short-lived adapter constructed for that one request.

The contract change this required, in `BaseGateway`:
1. **`getApiKey()` precedence is reversed** — an injected `apiKey` now wins over
   `keyRepo + crypto` (`BaseGateway.ts:192`). Previously the provider-scoped
   repository won, so a per-user credential injected for one request could be
   silently replaced by the platform-wide key for the same provider — the exact
   H5 failure. Behaviour-preserving for every existing caller: `OpenWeatherAPI`
   is the only `BaseGateway` subclass and passes `apiKey` only; an empty-string
   `apiKey` still falls through to the repo path. Proven by
   `BaseGateway.getApiKey precedence (H5)` (3 tests).
2. **`GatewayKeyRepo` is now documented as platform-scoped** and must not be used
   for user-scoped credentials.
3. **`RequestScopedGatewayDeps`** makes that enforceable at the type level rather
   than by convention.

`apiKeyRepository.useApiKey(userId, provider)` — previously 0 call sites — gets its
first consumer at `LlmGatewayService.ts:403`. It is called per user, per request;
the key is never cached, never stored on a field outliving the call, never logged.

LLM-006 order implemented at `LlmGatewayService.ts:398`: `byok` → `platform`
(only when `LLM_PLATFORM_ENABLED`) → `LLM_KEY_MISSING` (403).

### M3 — no POST helper: resolved without touching the GET path

`httpPostJson` (`BaseGateway.ts:515`) is a **separate method**; `httpGetJson` is
byte-for-byte unchanged. Duplication was chosen over a shared private helper
specifically so the GET path used by `OpenWeatherAPI` could not regress. POST adds
what GET does not have: a JSON body, `AbortSignal.timeout` → `PROVIDER_TIMEOUT`
(504), and `ProviderHttpError` instead of a plain `AppError`. It mirrors GET's
logging stages, `sanitizeUrl` redaction, `safeJson` parsing, and raw-log events.
The key travels in an `Authorization` header (OpenAI) or `x-goog-api-key`
(Gemini) — **never** a query parameter. The request body is never logged.
GET's unchanged behaviour is pinned by `BaseGateway.httpGetJson (unchanged GET path)`
(3 tests asserting the envelope, the error contract incl. body in `meta`, and
`method:'GET'` with no body).

### Defect found and fixed during validation (not in the original brief)

The `LlmGatewayService` leak-guard test failed. Investigated directly rather than
accepting the worker's first explanation. Reproduced independently: when a provider
returns a non-2xx whose body echoes the caller's prompt, `httpPostJson`'s catch
branch logged the caught error whole, and `ProviderHttpError.providerBody` is an
own enumerable property — so **the provider response body, including echoed user
chat content, reached the log sink**. The API key never leaked (it lives in a
request header, not in the error) and the client-facing envelope was always clean;
the leak was logs-only, and specific to the new POST path.

Fixed at `BaseGateway.ts:573-596`: the error is projected to a fixed shape
(`{name, code, statusCode, providerStatus}`) before logging. `providerBody` is
retained on the error object because adapters need it to choose a normalized code.
`httpGetJson` was left unchanged (no request body, pre-existing, out of scope) —
recorded below as residual risk. The test fixture that had been softened to dodge
this was restored to echo the sentinel, so the guarantee is now actually enforced,
and a dedicated test was added at `tests/core/base/BaseGateway.test.ts:315`.

### Validation (literal output, 2026-09-14, `cd lingon`)

```
$ ./node_modules/.bin/tsc -p tsconfig.json --noEmit
exit=0

$ npm run test:types
> tsc -p tsconfig.test.json --noEmit
(no output)

$ npm run build
> tsc -p tsconfig.json
(no output)

$ npm test
# tests 147
# suites 42
# pass 147
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 60920.8063

$ npm audit
found 0 vulnerabilities
```

Baseline was 29 passing / 5 suites; **+118 tests, 0 failures, no regression**.
No dependency was added — the adapters use Node 22 `fetch` through the base class,
so `npm audit` is unchanged at 0 vulnerabilities.

New suites: `BaseGateway.httpGetJson (unchanged GET path)`,
`BaseGateway.httpPostJson (new POST helper)`, `BaseGateway.getApiKey precedence (H5)`,
`gateway/llm/LlmErrors`, `OpenAIProvider.*` (7 suites), `GeminiProvider.*` (7 suites),
`LlmGatewayService.*` (11 suites incl. `per-user isolation`, `platform credential
precedence`, `corrupt stored key`, `parameter precedence`, `fallback`,
`usage recording`, `listProviders`, `leak guard`),
`POST /v1/actions/execute — *` (6 suites), `GET /v1/actions/types`, `leak guard`.

Evidence standard: the full path service → real adapter → HTTP is exercised with a
stubbed `fetch` (adapters are never mocked). The mandated negative test is
`LlmGatewayService.chatComplete — per-user isolation`: user A has a stored key,
user B does not, platform disabled → A succeeds, **B gets `LLM_KEY_MISSING` (403)**,
`fetch` is never called for B, and B's error contains no part of A's key.

### Could NOT be verified (no real provider credential)

No live call was made to OpenAI or Gemini, and no live Postgres or running server
was exercised. Therefore **unverified**: that a real key authenticates; that the
real wire formats match the shapes the adapters parse; real rate-limit/timeout
behaviour; real provider error-body shapes beyond those `mapProviderStatusToLlmCode`
handles; and the real `apiKeyRepository`/`settingsRepository` round-trip (both are
injected fakes in every test, wired to the real functions only in the route plugin).
The spec's Real-Execution verification and the `verification/backend/` report remain
outstanding and are still gated on the provider key and the privacy/legal sign-off
recorded in the 2026-08-01 review.

### Contract gaps / ICD additions required (reported, not improvised)

1. **No code for "streaming not implemented."** `stream:true` reuses the existing
   registry code `NOT_IMPLEMENTED` (501). CHAT-002 stays at **0%** — no SSE path
   was built, per the spec's allowance to ship non-streaming first.
2. **No code for "stored credential exists but is unusable."** A `user_api_keys`
   row that fails AES-256-GCM authentication throws a raw `Error` from
   `encrypt.ts`. The gateway does **not** fall through to the platform key (that
   would silently substitute a different credential owner) and does not forward
   the underlying message; it throws `LLM_KEY_MISSING`. This masks "broken key" as
   "no key" — an information loss the 8 frozen codes cannot express.
3. **`ai_settings` has no `provider` column** (`user_id, model, temperature,
   max_tokens, system_prompt, updated_at`). The spec says provider selection is
   driven by "request metadata and `ai_settings`", which the schema cannot support.
   Implemented as `input.provider` → `LLM_DEFAULT_PROVIDER` → `LLM_PROVIDER_UNSUPPORTED`.
   No column was invented.
4. **`usage_logs` does not exist** — no table, no migration, no Domain ICD entry.
   LLM-004 is delivered as the `LlmUsageRecorder` interface plus `NoopUsageRecorder`
   (debug-log only, never messages or keys). No row shape was invented.
5. **`GET /v1/actions/:id`, `/history`, `/suggestions`, `/stream` are not
   implemented.** They need an Action execution store that does not exist and is
   outside this task. `action_id` is generated for response correlation only and
   nothing is persisted, so the documented 202/polling path cannot be honoured.
6. **Gemini uses `x-goog-api-key`, not `Authorization`.** The spec's hard rule is
   "never as a query parameter", which is honoured; Gemini simply has no
   `Authorization` scheme. Recorded so the ICD can absorb the distinction.
7. **`Repositories.ts`'s `providerKeys` seed was deliberately not used** (H6). It
   Base64-encodes `OPENAI_API_KEY` via `cryptoUtil`, which `security_policy.md`
   declares "NOT secure encryption". Platform keys come from `app.config` env vars
   instead — the same precedent as `OPENWEATHER_API_KEY`. `Repositories.ts` and
   `OPENAI_API_KEY` were left untouched; only a comment records the reason.

### Residual risk

`httpGetJson` still logs its caught error whole, so an OpenWeather/Google error
body would reach logs the way the POST path used to. Left unchanged deliberately:
it is pre-existing, carries no request body, and is outside this task's scope.
Flagged for a follow-up decision under `logging_policy.md`.

### Routing note (Route.md §5)

Route.md was sufficient. The one file the route did not name but the work required
is `lingon/src/config/FastifyDefinition.ts`, where `FastifyInstance.config` is
hand-typed — any new env var must be declared there or `app.config.X` will not
typecheck. Worth adding to Route.md's BACKEND PLATFORM entry.

## Completion Result

**Validated.** The backend LLM Gateway (SYS-010) is implemented, typechecked,
built, and covered by 118 new hermetic tests with the suite at 147/147 passing and
0 vulnerabilities. Acceptance criteria 1–7 are met: the adapter contract satisfies
LLM-007 (a new provider is one adapter file plus one registry row — no change to
the Action Type, envelope, DB schema, or frontend); credential resolution
implements LLM-006 including the stable `LLM_KEY_MISSING`; H5 is resolved by a
documented base-class contract change rather than a cast; M3 is resolved without
altering the GET path; provider wire formats and raw provider errors do not escape
the adapter; and no key material appears in any log — a genuine logs-only leak of
provider-echoed user content was found during validation and fixed.

Per `prompt_playbook.md` §4 the claimable progress is capped at **25%** until the
frontend integrates (TASK-009) and integration is verified. LLM-001 stays at 25%;
LLM-002/003/006/007 are implemented but remain unverified against a real provider;
LLM-004 is interface-only pending a `usage_logs` schema; LLM-005 and CHAT-002
(streaming) remain 0% and out of scope. `version/*.json` and `changelog/*.md` were
**not** touched: `system.json` froze this contract at 0.2.0 and states the
implementation fills it, and no contract changed. The `verification/backend/`
Real-Execution report remains outstanding, gated on a real provider key and the
privacy/legal sign-off. No commit, branch, or push was made.
