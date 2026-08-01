# Backend Claude Prompt — AI Gateway (LLM Gateway Service)

> **Status**: Prepared implementation prompt · **Target repo**: `jdukmin/lingon`
> (Fastify/TypeScript backend) · **Author**: DevDocs Architect · **Date**: 2026-07-31
>
> ⛔ **GATED — do not execute until CTO Decisions 1–3 & 5 in
> [2026-07-31-ai-architecture-review.md](2026-07-31-ai-architecture-review.md)
> are resolved.** In particular, [CLAUDE.md](../../CLAUDE.md) ICD Rule forbids
> implementation before an LLM **Domain ICD** exists (H1). This prompt assumes
> the recommended resolutions; adjust if the CTO decides otherwise.

Copy everything below the line into the backend implementation session.

---

## Role

You are implementing the **backend LLM Gateway** for LingOn (SYS-010). You add a
**provider-agnostic** AI gateway that Chat (and later Intent/Planner) invoke. You
do **not** touch the frontend. You do **not** modify any DevDocs.

## Authoritative contracts (read these first — do not invent contracts)

Read, in order:
1. `requirements/system_requirements.md` — SYS-010 (LLM Gateway).
2. `requirements/llm_gateway_requirements.md` — LLM-001…005 (multi-provider,
   routing, fallback, cost, structured output).
3. `requirements/domain_icd/llm.md` **(or `tool.md` if the CTO folded LLM into
   Tool Domain)** — the Domain contract you implement. **If this file does not
   exist, STOP and report — do not proceed** (CLAUDE.md ICD Rule).
4. `docs/icd/action_layer_api.md` — the `llm.chat_complete` Action Type, the
   `{success,data,error}` envelope, and streaming events.
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

- Resolve the API key **per-user, per-request** from the encrypted BYOK store:
  `apiKeyRepository.useApiKey(userId, provider)` (already implemented, currently
  **unused** — this prompt is where it gets its first call site). Fall back to a
  server-owned env key only if the CTO chose platform-funded/hybrid mode.
- The existing `BaseGateway.getApiKey()` `keyRepo+crypto` path is **not
  user-scoped** — do not assume `getActiveKey(provider)` returns the right user's
  key. Either extend the key-resolution to carry `userId`, or resolve the
  plaintext in the route/service layer and inject it into the provider for that
  request. Document which you chose in the verification report.
- The `--dart-define`/client key path is being removed on the frontend; the
  backend is the **only** place a provider key is ever held.

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

- `POST /v1/actions/execute` with `type:"llm.chat_complete"`,
  `input:{ messages:[{role,content}], model?, temperature?, max_tokens? }`,
  `source:"chat"`. Auth required (`req.ctx.userId`; throw
  `AppError('UNAUTHORIZED',401)` if absent). Return the ICD v0.0 envelope
  `{success,data,error}` — `data` carries the normalized `LlmCompletion`.
- Follow the `BaseRoutes` pattern: `class … extends BaseRoutes { readonly name;
  registerRoutes(app){…} }` + default-export `FastifyPluginAsync`. Do not
  hardcode `/v1`. Register static before dynamic routes.
- **Streaming** (only if CTO Decision 5 approves): `GET /v1/actions/:id/stream`
  as SSE (`text/event-stream`) emitting `action.progress`/`action.completed` per
  `action_layer_api.md`. The backend has no SSE today — add it minimally; do not
  add a worker queue unless required.
- **Do not create any endpoint not described in `action_layer_api.md`.** If you
  need one, stop and report it as a required ICD addition.

## Security rules (hard requirements)

- Provider API keys **never** appear in a response body, a log, `raw_logs`,
  `request_logs`, or Pino output. Route every outbound URL through
  `BaseGateway`'s `sanitizeUrl`/`httpGetJson`; never `fetch` a provider directly
  with the key in a loggable place.
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
- Produce a verification report at
  `verification/backend/<YYYY-MM-DD>-llm-gateway.md` with the required sections
  (변경 목적 / 변경 파일 / 영향 분석 / 테스트 결과 / 남은 문제). Record the exact
  error-code set and the key-resolution approach you chose.

## Hard constraints

- ❌ Do **not** modify any DevDocs / `.md` contract files. Report needed doc
  changes in your verification report instead.
- ❌ Do **not** commit. Leave the working tree for review.
- ❌ Do **not** create OpenAI-only architecture, import a provider SDK in a way
  that couples the dispatcher to it, or expose provider names above the gateway.
- ❌ Do **not** add undocumented endpoints.
- ✅ Backend-only. Progress you may claim is capped at **25%** until the frontend
  integrates and integration is verified ([prompt_playbook.md](../icd/prompt_playbook.md) §4).

## Companion documents to keep open

`requirements/domain_icd/llm.md` (or `tool.md`), `docs/icd/action_layer_api.md`,
`docs/icd/api_comparison.md`, `backend/docs/DevelopmentGuide.md`,
`backend/docs/api/apikey.md`, `backend/docs/database/{ai_settings,user_api_keys}.md`,
`docs/policies/security_policy.md`.
