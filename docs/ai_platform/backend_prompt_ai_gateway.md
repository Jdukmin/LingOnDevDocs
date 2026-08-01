# Backend Claude Prompt — AI Gateway (LLM Gateway Service)

> **Status**: Prepared implementation prompt · **Target repo**: `jdukmin/lingon`
> (Fastify/TypeScript backend) · **Author**: DevDocs Architect · **Date**: 2026-07-31
> · **Last updated**: 2026-08-01 (contracts frozen; re-verified against `lingon @ dd38b22`)
>
> ✅ **ICD GATE CLEARED (2026-08-01).** The blocker that held this prompt —
> "no LLM Domain ICD exists" ([CLAUDE.md](../../CLAUDE.md) ICD Rule) — is
> resolved. The contracts you implement now exist and are **frozen**:
> - **Domain**: [requirements/domain_icd/llm.md](../../requirements/domain_icd/llm.md) (new)
> - **Requirement**: [llm_gateway_requirements.md](../../requirements/llm_gateway_requirements.md) LLM-001…**007** (LLM-006 Credential Source, LLM-007 Provider Adapter Contract are new)
> - **API**: [action_layer_api.md](../icd/action_layer_api.md) → `llm.chat_complete` is now a **fully specified Action Type** (input/result schema, streaming path, 8 LLM error codes, provider catalog)
>
> ⛔ **Still gated on two non-technical items** — see §Human Resource in
> [2026-08-01-ai-platform-review.md](2026-08-01-ai-platform-review.md):
> (1) **privacy/legal sign-off** before real user chat content reaches any
> third-party provider; (2) a **real provider key** to run the mandated
> Real-Execution verification.
>
> **Two code-level facts verified 2026-08-01** that the 07-31 revision got wrong
> or left implicit: **(M3)** `BaseGateway` is **GET-only**, so "route every
> outbound call through `httpGetJson`" was not executable for a chat completion;
> **(H5)** the base class's key repo is **provider-scoped, not user-scoped**, so
> BYOK cannot flow through it unchanged. Both are first-class requirements below.

Copy everything below the line into the backend implementation session.

---

## Role

You are implementing the **backend LLM Gateway** for LingOn (SYS-010). You add a
**provider-agnostic** AI gateway that Chat (and later Intent/Planner) invoke. You
do **not** touch the frontend. You do **not** modify any DevDocs.

## Authoritative contracts (read these first — do not invent contracts)

Read, in order:
1. **`requirements/domain_icd/llm.md`** — the Domain contract you implement.
   Read this **first**; it is the single source of truth and outranks every other
   document here. Pay particular attention to §Responsibilities ("하지 않는다")
   and §CredentialSource.
2. `requirements/system_requirements.md` — SYS-010 (LLM Gateway).
3. `requirements/llm_gateway_requirements.md` — LLM-001…**007**, including the
   **Gateway 책임 범위** table, the **Credential Source** minimal contract
   (LLM-006), and the **Provider Adapter Contract** (LLM-007).
4. `docs/icd/action_layer_api.md` — **§Action Type `llm.chat_complete`**: the
   exact input/result schema, the streaming path, the 8 LLM error codes, and the
   provider catalog in `GET /v1/actions/types`. Implement it **exactly** as
   written; do not re-derive it.
5. `backend/docs/DevelopmentGuide.md` — route/plugin/service/repository/error
   conventions. Follow them exactly.
6. `backend/docs/api/apikey.md`, `backend/docs/database/user_api_keys.md`,
   `backend/docs/database/ai_settings.md` — existing BYOK + settings you build on.
7. `docs/policies/security_policy.md`, `docs/policies/logging_policy.md`.

## AI Gateway architecture (required)

```
POST /v1/actions/execute { type:"llm.chat_complete", input:{messages,model?,temperature?,max_tokens?}, source }
        ▼
Action Dispatcher (minimal — single Action Type ok)
        ▼
LlmGatewayService  (provider selection + fallback + cost recording)
        ▼
IAIProvider  (reuse BaseProvider/BaseGateway — do NOT create a parallel base)
   ├── OpenAIProvider  extends BaseGateway   → api.openai.com/v1/chat/completions
   └── GeminiProvider  extends BaseProvider  → generativelanguage.googleapis.com
```

### Provider abstraction rules (non-negotiable)

- **Reuse the existing `BaseProvider` contract**: each provider implements
  `execute(input: ProviderRequest)` and switches on `input.route`
  (`chat.complete`, `chat.stream`), throwing `AppError('OP_NOT_SUPPORTED', 400)`
  for unknown routes — exactly like `OpenWeatherAPI`. Put providers under
  `src/gateway/llm/`.
- **`BaseGateway` needs a POST helper before any of this works (M3).** Verified:
  its only outbound path is `httpGetJson`, which hardcodes
  `fetch(url, { method: 'GET' })` (`src/core/base/BaseGateway.ts:280,288`);
  `getJson`/`getJsonWithApiKey` both wrap it. A chat completion is
  **POST with a JSON body**. Add a `httpPostJson`/`postJson` helper to
  `BaseGateway` that **mirrors the existing behaviour** — same structured
  logging stages, same `sanitizeUrl` redaction, same timeout handling, same
  `AppError` wrapping, same `safeJson` parsing. **Do not** bypass the base class
  with a bare `fetch` in a provider, and **do not** fork a parallel base class.
  This is an additive change to a class shared with `OpenWeatherAPI` /
  `GoogleCalendarAPI` — do not alter the existing GET path's behaviour.
- **No provider name may leak above `LlmGatewayService`.** Route handlers,
  dispatcher, Intent, and Planner speak only `llm.chat_complete` /
  `LlmCompletion`. Selecting OpenAI vs Gemini is `LlmGatewayService`'s job,
  driven by request metadata and `ai_settings` (LLM-002).
- **Adding a provider must be a single new class** — no changes to the
  dispatcher, route, envelope, or DB. Prove this by structuring
  `LlmGatewayService` as a `Map<provider, IAIProvider>`.
- **Normalize every provider response** to one internal `LlmCompletion`
  `{ content, model, usage:{prompt_tokens,completion_tokens}, finish_reason }`
  before it leaves the gateway. Providers differ in wire shape; callers must not
  see that.

### Key resolution (fixes the review's Critical C2)

**The contract is LLM-006 / [domain_icd/llm.md](../../requirements/domain_icd/llm.md)
§CredentialSource.** Two sources only — `byok` (Owner: User, `user_api_keys`,
AES-256-GCM) and `platform` (Owner: Platform, backend secret). **Resolution
order: `byok` first → `platform` only if policy allows → otherwise fail with
`LLM_KEY_MISSING`.** Report the resolved source back in
`result.credential_source`.

> **Do NOT introduce** a `CredentialResolver` domain, KMS, Secret Manager, or a
> separate credential service. The minimal two-source contract above is the whole
> scope. If you believe more is needed, **report it — do not build it.**

- Resolve the API key **per-user, per-request** from the encrypted BYOK store:
  `apiKeyRepository.useApiKey(userId, provider)` (already implemented, currently
  **unused** — this prompt is where it gets its first call site). Fall back to a
  server-owned env key only if the CTO chose platform-funded/hybrid mode.
- **The existing `BaseGateway.getApiKey()` path cannot serve BYOK (H5).**
  Verified: `GatewayKeyRepo.getActiveKey(provider: string)` takes **no `userId`**,
  and `getApiKey()` calls `getActiveKey(this.name)`
  (`src/core/base/BaseGateway.ts:27,110`). Wiring BYOK through it unchanged
  returns **the wrong user's key or none at all**. Choose one seam explicitly:
  - **(a) Recommended — service-layer resolution.** `LlmGatewayService` calls
    `useApiKey(userId, provider)` and injects the plaintext into a short-lived
    provider instance for that single request. Shortest key lifetime; leaves the
    base class (shared with OpenWeather/Google) untouched.
  - **(b)** Extend `GatewayKeyRepo`/`getApiKey()` to carry `userId`. Heavier —
    it changes a contract two non-LLM gateways already depend on.

  **Record which you chose, and why, in the verification report.**
- ⚠️ **Do not use the `Repositories.ts` `providerKeys` seed as a key source
  without checking CTO Decision 3 (H6).** It Base64-encodes
  `process.env.OPENAI_API_KEY` via `cryptoUtil`, which its own source comment and
  [security_policy.md](../policies/security_policy.md) both declare
  **"NOT secure encryption"**. If platform-funded/hybrid mode is selected, the
  server key must come from `src/db/encrypt.ts` (AES-256-GCM) or a real secret
  store — **report this rather than silently building on the Base64 path.**
- The `--dart-define`/client key path is being removed on the frontend; the
  backend is the **only** place a provider key is ever held.
- **BYOK must not be weakened or bypassed.** A design where the user can no
  longer supply their own key is out of contract — stop and report instead.

### Error contract (fixes Critical C3)

- Define a small, stable set of LLM error codes and map every provider failure to
  them, e.g. `LLM_AUTH_FAILED` (401/invalid key), `LLM_RATE_LIMITED` (429),
  `LLM_TIMEOUT`, `LLM_PROVIDER_ERROR` (5xx/upstream), `LLM_BAD_REQUEST`,
  `LLM_KEY_MISSING`. Emit them via `AppError` so the client sees one stable shape
  regardless of provider. (Record these codes in the verification report so
  `action_layer_api.md` can absorb them later — do not edit the doc yourself.)
- Fallback (LLM-003): on a retryable code from provider A, retry against the
  configured fallback provider B; surface the final error only if all fail.

### Model params & cost

- Load `model`, `temperature`, `max_tokens`, `system_prompt` from
  `settingsRepository.getAISettings(userId)`; request `input` overrides these per
  call. Validate ranges (temperature 0–2, max_tokens positive int) as the
  existing settings route does.
- Cost monitoring (LLM-004): record token usage per request. If the
  `usage_logs` table / Domain ICD does not yet exist, implement the recording
  behind an interface and **report the missing schema** rather than inventing a
  table shape — flag it for the Domain ICD pass.

## API contract (implement exactly as documented)

**The contract is frozen in [action_layer_api.md](../icd/action_layer_api.md)
§`llm.chat_complete`. Implement that section literally.** Summary of the parts
implementers most often get wrong:

- Top-level fields are **`type` / `input` / `source`** — the field is **`input`,
  not `payload`**. Every Action Type shares one envelope; a per-type top-level
  field name would break the common dispatcher.
- `input`: `messages:[{role,content}]` (required, roles
  `system|user|assistant`), plus optional `provider`, `model`, `temperature`
  (0–2), `max_tokens` (positive int), `stream` (default `false`).
- Parameter precedence: **explicit `input` > `ai_settings` > provider default.**
- `data.result` is the normalized `LlmCompletion`:
  `{ content, provider, model, credential_source, finish_reason, usage:{prompt_tokens,completion_tokens,total_tokens} }`.
  `usage` may be `null` when a provider omits it — **the field must still be
  present** so callers never branch on its existence. `provider`/`model` report
  what was **actually used** (these differ from the request after a fallback).
- Auth required (`req.ctx.userId`; throw `AppError('UNAUTHORIZED',401)` if
  absent). Return the ICD v0.0 envelope `{success,data,error}`.
- **Error codes are fixed** — use exactly the 8 documented codes with their
  documented HTTP statuses. Note `LLM_AUTH_FAILED` is **502, not 401**: it means
  the *provider* rejected our credential, which must not be confused with the
  caller's own LingOn auth failure. Do not invent new codes; if you need one,
  stop and report it as a required ICD addition.
- `GET /v1/actions/types` must expose the **provider catalog**
  (`providers:[{id,label,credential_source,available}]`). This is the **only**
  source the frontend may use for its provider list (LLM-007) — `available`
  reflects whether *this user* can currently call that provider.
- Follow the `BaseRoutes` pattern: `class … extends BaseRoutes { readonly name;
  registerRoutes(app){…} }` + default-export `FastifyPluginAsync`. Do not
  hardcode `/v1`. Register static before dynamic routes.
- **Streaming**: `input.stream:true` → respond `202` with `action_id`, then serve
  the body over `GET /v1/actions/:id/stream` as SSE (`text/event-stream`) emitting
  `action.started` / `action.progress{partial:{content_delta}}` /
  `action.completed` / `action.failed`. **Reuse the existing Action event names —
  do not invent LLM-specific events.** The backend has no SSE today; add it
  minimally and do not add a worker queue unless required. Shipping
  non-streaming (`stream:false`) first is acceptable — if you do, leave
  CHAT-002 at 0% and say so rather than claiming partial streaming.
- **Do not create any endpoint not described in `action_layer_api.md`.** If you
  need one, stop and report it as a required ICD addition.

## Security rules (hard requirements)

- Provider API keys **never** appear in a response body, a log, `raw_logs`,
  `request_logs`, or Pino output. Route every outbound call through the
  `BaseGateway` helpers (`sanitizeUrl` + the existing `httpGetJson` and the new
  `httpPostJson` from M3 above) so redaction and error wrapping apply uniformly;
  never `fetch` a provider directly with the key in a loggable place. Send the
  key in an `Authorization` header, **never** as a query parameter.
- The chat `messages` payload is user content — ensure the new POST helper does
  **not** log request bodies (the existing GET path has no body to leak; the POST
  path introduces that risk for the first time). Cross-check
  [logging_policy.md](../policies/logging_policy.md) before logging anything new.
- BYOK keys stay AES-256-GCM at rest (`src/db/encrypt.ts`, `MASTER_ENCRYPTION_KEY`).
  `MASTER_ENCRYPTION_KEY` is **separate** from `JWT_SECRET` — never mix them.
- Enforce per-user isolation: a request may only use the authenticated user's own
  stored key (`req.ctx.userId`). Never read another user's row.
- Wrap every thrown error in `AppError` (never raise a raw `Error` from a
  handler/gateway). 5xx → Pino `error`; <500 → Pino `warn`; non-`AppError` →
  `raw_logs` `unhandled_exception`.
- Respect rate limiting (the `@fastify/rate-limit` plugin keyed on
  `req.ctx.userId`); consider a stricter per-user LLM budget/circuit breaker
  (LLM-004) — at minimum leave a clear hook for it.

## Testing requirements

- **Real Execution Only** ([docs/workflow.md](../workflow.md) principle 4) — a
  mock success is **not** a success. Verify with real `curl` against a running
  instance and a real provider key (a test BYOK key stored via
  `PUT /v1/apikey/:provider`), showing the actual normalized response and at
  least one real error path (e.g. bad key → `LLM_AUTH_FAILED`).
- Demonstrate the provider abstraction: switch the selected provider (OpenAI ↔
  Gemini) for the **same** request and show identical envelope shape.
- **Prove BYOK end-to-end**: store a real key via `PUT /v1/apikey/:provider`,
  run a completion that consumes it through `useApiKey(userId, provider)`, and
  show that a **second** user without a stored key gets `LLM_KEY_MISSING` — not
  the first user's key. Per-user isolation must be demonstrated, not asserted.
- **Prove no key leakage**: grep the response body, `request_logs`, `raw_logs`,
  and stdout of the verification run for the test key's value. Include the result.
- Produce a verification report at
  `verification/backend/<YYYY-MM-DD>-llm-gateway.md` with the required sections
  (변경 목적 / 변경 파일 / 영향 분석 / 테스트 결과 / 남은 문제). Record the exact
  error-code set, the key-resolution seam you chose (H5 option a or b), and
  whether the `BaseGateway` POST helper (M3) altered any existing GET behaviour.

## Hard constraints

- ❌ Do **not** modify any DevDocs / `.md` contract files. Report needed doc
  changes in your verification report instead.
- ❌ Do **not** commit. Leave the working tree for review.
- ❌ Do **not** create OpenAI-only architecture, import a provider SDK in a way
  that couples the dispatcher to it, or expose provider names above the gateway.
- ❌ Do **not** add undocumented endpoints.
- ✅ Backend-only. Progress you may claim is capped at **25%** until the frontend
  integrates and integration is verified ([prompt_playbook.md](../icd/prompt_playbook.md) §4).

## Scope boundary — what this task does NOT include

The Domain contract fixes the gateway's responsibilities narrowly. **Out of
scope; do not build, even if it seems convenient:**

| Out of scope | Why | Where it belongs |
|---|---|---|
| Intent classification / slot extraction | Gateway does not judge user intent | Intent Domain (SYS-004, 0%) |
| Planner / Workflow orchestration | Gateway executes one call, not a plan | Planner (SYS-009, 0%) |
| Memory / RAG retrieval, ranking, context assembly | Gateway receives **already-assembled** `messages` | Memory Layer (SYS-005, 0%) |
| Conversation/session persistence | Gateway does not own chat history | (undefined — report if needed) |
| Dashboard/UI generation | Gateway produces text, not layout | Dashboard Domain |
| Business logic of any kind | Gateway is an Engine/Tool layer | Action Domain |
| `llm.summarize` or other `llm.*` types | Not yet specified in the ICD | future ICD pass |
| Structured Output (LLM-005) | Deliberately deferred past the Chat MVP | future ICD pass |
| KMS / Secret Manager / CredentialResolver | Explicitly excluded (LLM-006) | `security_policy.md` decision |

**The architectural rule this enforces**: `User → Intent/Action → Action Layer →
LLM Gateway → Provider`. The gateway must never become a path by which the LLM
sits *above* the Action Layer (DEC-001/002 — LLM은 제품이 아니다).

## Companion documents to keep open

`requirements/domain_icd/llm.md` (**primary**), `requirements/llm_gateway_requirements.md`,
`docs/icd/action_layer_api.md` (§`llm.chat_complete`), `docs/icd/api_comparison.md`,
`backend/docs/DevelopmentGuide.md`, `backend/docs/api/apikey.md`,
`backend/docs/database/{ai_settings,user_api_keys}.md`,
`docs/policies/security_policy.md`, `docs/policies/logging_policy.md`.
