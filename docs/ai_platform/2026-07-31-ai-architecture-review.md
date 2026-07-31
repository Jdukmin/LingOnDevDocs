# AI Architecture Review Report — LLM Gateway / AI Platform Domain

> **Status**: Review (preparation, pre-implementation) · **Progress**: n/a (review artifact — 구현 대상 아님) · **Date**: 2026-07-31 · **Author**: DevDocs Architect · **Scope**: Architecture / Requirements / ICD review for the AI Platform Domain (LLM Gateway + Chat integration). **No source code and no contract was changed by this pass.**

> **역할 경계**: 이 문서는 분석·검토·지시 생성만 한다. Frontend/Backend 구현은
> 하지 않는다. 구현 지시는 [frontend_prompt_ai_chat_gateway.md](frontend_prompt_ai_chat_gateway.md),
> [backend_prompt_ai_gateway.md](backend_prompt_ai_gateway.md) 두 프롬프트로 분리한다.

---

## 0. Executive Summary

The AI Platform architecture the task asks to "prepare" is **already specified**
in the SSOT — this review's job is **alignment, not invention**. The
provider-agnostic backend gateway you describe is `SYS-010 LLM Gateway`
([requirements/system_requirements.md](../../requirements/system_requirements.md),
[requirements/llm_gateway_requirements.md](../../requirements/llm_gateway_requirements.md)),
and the Frontend→Backend→Provider contract is the Action Layer's
`llm.chat_complete` Action Type
([docs/icd/action_layer_api.md](../icd/action_layer_api.md)). Both are
**Planned / 0%**.

The single largest finding: **there is a fully-built BYOK key-storage path and a
fully-built provider-adapter base class, but nothing connects them, and the
actual chat traffic bypasses the backend entirely** — the Flutter client calls
`https://api.openai.com/v1/chat/completions` directly with a build-time
(`--dart-define`) key. That is simultaneously an architecture conflict, a
security exposure, and a migration risk (§4 Critical).

Before any implementation prompt is executed, **one Domain-Freeze decision is
mandatory** per [CLAUDE.md](../../CLAUDE.md) ICD Rule ("Domain ICD가 없는 기능은
구현을 진행하지 않는다"): the LLM-provider abstraction has **no Domain ICD** —
only a "future extension" note in [tool.md](../../requirements/domain_icd/tool.md).
See §4 High H1 and §CTO Decision Required.

---

## 1. Current Phase Status

| Item | State |
|---|---|
| Completed domain (per task) | Dashboard Architecture — Widget Variant / Layout Constraint / Design System (DSH-009~011, Planner PLN-006) |
| Now starting (per task) | **AI Platform Domain** (LLM Gateway + Chat integration) |
| System Version | `0.1.1` ([version/system.json](../../version/system.json)) |
| Backend Version | `0.1.0` ([version/backend.json](../../version/backend.json), source `jdukmin/lingon`) |
| Frontend Version | `0.2.0` ([version/frontend.json](../../version/frontend.json), source `jdukmin/letmeknow`) |
| Governing philosophy | **"Action Layer is the product; Dashboard/LLM are means, not the product"** ([docs/strategy/product.md], DEC-001/002). *Not* "LLM First" — see §6. |
| Verified against | `jdukmin/letmeknow @ 011b9c2`, `jdukmin/lingon @ dd38b22` (fresh clones, 2026-07-31) |

Relevant SYS requirements and their current status
([requirements/system_requirements.md](../../requirements/system_requirements.md)):

| ID | Requirement | Status | Progress |
|---|---|---|---|
| SYS-002 | Natural Language Interaction (Chat) | In Progress | 25% |
| SYS-003 | AI Briefing | In Progress | 25% |
| SYS-004 | Intent Processing | Planned | 0% |
| SYS-005 | Memory Management (RAG) | Planned | 0% |
| SYS-009 | Automation Workflow (Planner) | Planned | 0% |
| **SYS-010** | **LLM Gateway** (provider-agnostic, backend) | **Planned** | **0%** |

---

## 2. DevDocs Checked

| Layer | Documents read | Key finding for AI Platform |
|---|---|---|
| **Architecture** | [docs/strategy/architecture.md](../strategy/architecture.md) | 4 product layers; LLM lives in Layer 2 (AI Decision) as an engine, not a top layer. No provider coupling anywhere. |
| **Requirements** | [system_requirements.md](../../requirements/system_requirements.md), [llm_gateway_requirements.md](../../requirements/llm_gateway_requirements.md), [chat_requirements.md](../../requirements/chat_requirements.md), [intent_requirements.md](../../requirements/intent_requirements.md), [planner_requirements.md](../../requirements/planner_requirements.md), [memory_requirements.md](../../requirements/memory_requirements.md) | SYS-010 already defines the exact provider-agnostic gateway requested. LLM-001…005 spec multi-provider / routing / fallback / cost / structured output. |
| **ICD (Domain)** | [domain_icd/README.md](../../requirements/domain_icd/README.md), [intent.md](../../requirements/domain_icd/intent.md), [tool.md](../../requirements/domain_icd/tool.md), [action.md](../../requirements/domain_icd/action.md) | Execution model `User→Intent→Action→(Workflow)→Tool→Execution`. **LLM provider has no Domain ICD** — only tool.md "Future Extension" note. |
| **ICD (API/Action)** | [icd/README.md](../icd/README.md), [action_layer_api.md](../icd/action_layer_api.md), [frontend_interaction_flow.md](../icd/frontend_interaction_flow.md), [api_comparison.md](../icd/api_comparison.md) | LLM invoked as Action Type `llm.chat_complete` via `POST /v1/actions/execute`; streamable via `GET /v1/actions/:id/stream` (SSE). Envelope `{success,data,error}`. Status: Proposed / 0%. |
| **Status** | [status/current_status.md](../../status/current_status.md), [status/required_human_resource.md](../../status/required_human_resource.md) | BYOK responsibility clause is already flagged as a Legal/human task. |
| **Roadmap** | [roadmap/roadmap.md](../roadmap/roadmap.md), [roadmap/mvp.md](../roadmap/mvp.md) | Intent Engine = Phase 3; AI Decision precedes Dashboard in dev priority. |
| **Version** | [version/system.json](../../version/system.json), [backend.json](../../version/backend.json), [frontend.json](../../version/frontend.json) | See §1. |
| **Decision Log** | [docs/decisions/architecture_decisions.md](../decisions/architecture_decisions.md) | DEC-001/002/003. No LLM/provider decision recorded — this is a gap the CTO decisions below fill. |
| **Policy** | [policies/security_policy.md](../policies/security_policy.md), [logging_policy.md](../policies/logging_policy.md), [privacy_policy.md](../policies/privacy_policy.md) | AES-256-GCM for BYOK, JWT_SECRET ≠ MASTER_ENCRYPTION_KEY, keys never logged. |
| **Workflow / Ops** | [docs/workflow.md](../workflow.md), [icd/prompt_playbook.md](../icd/prompt_playbook.md) | Step 0 Domain Freeze precedes implementation; separated Front/Back prompt matrix; "Real Execution Only". |

### Where the AI Module belongs (roadmap placement)

The AI Platform Domain is the **enabling engine for Layer 1 (Action) and Layer 2
(AI Decision)**, consumed by Chat (SYS-002), Intent (SYS-004), Planner (SYS-009),
and Briefing (SYS-003). It is **not** a new product layer and must not become
one (§6). It sits *beneath* the Action Layer as the `llm.chat_complete` Tool
implementation and as the shared LLM client for Intent/Planner.

---

## 3. Current Implementation Alignment

### Frontend — `jdukmin/letmeknow @ 011b9c2`

| Aspect | Reality (verified in code) | Doc alignment |
|---|---|---|
| Chat path | `ChatModule.send()` → `gw<LlmGateway>().complete(history)` → `OpenAiGateway` → **`https://api.openai.com/v1/chat/completions` directly**. No backend hop. | Matches [LlmService.md](../../frontend/docs/services/LlmService.md) "Deprecated" banner. |
| API key | `String.fromEnvironment('OPENAI_API_KEY')` (compile-time `--dart-define`), ships in the client. | Doc says `.env` in several comments — **inaccurate** (see §DevDocs Update). |
| Provider abstraction | `abstract LlmGateway { complete(); stream(); }` + `OpenAiGateway`. `enum LlmProvider {openai,anthropic,gemini,openrouter}` **declared, zero references**. | Abstraction exists; multi-provider not wired. |
| Streaming | `stream()` is a **single-chunk stub** (`yield await complete()`), not token streaming and not `UnimplementedError`. `ChatWidget` renders plain `Text` (no markdown), animated typing indicator on `isBusy`. | CHAT-002 (streaming) / CHAT-005 (markdown) correctly at 0%. |
| BYOK to backend | `LingonApiKeyRoute` (`GET /apikey/status`, `PUT/DELETE /apikey/:provider`) exists **but is never instantiated — no UI calls it**. | Contract present, dead-ended. |
| Backend base URL | `ApiClient.baseUrl = https://www.ling-on.com`, Bearer JWT, 401→refresh-retry. No `/v1/actions/*`, `/v1/chat/*`, `/v1/llm/*` calls. | Confirmed absent. |

### Backend — `jdukmin/lingon @ dd38b22`

| Aspect | Reality (verified in code) | Doc alignment |
|---|---|---|
| LLM gateway | **None.** `src/gateway/` = `OpenWeatherAPI` (BaseGateway), `GoogleAuthAPI`, `GoogleCalendarAPI` (BaseProvider), `GoogleTokenService`. No OpenAI/Gemini SDK in `package.json`; no outbound LLM URL anywhere in `src/`. | SYS-010 correctly 0%. |
| Provider adapter base | `BaseProvider.execute(input: ProviderRequest{gateway,route,payload})`; `BaseGateway extends BaseProvider` with `getApiKey()`, `getJson*()`, `httpGetJson()`, `sanitizeUrl()`. New provider = new subclass, switch on `input.route`, throw `AppError('OP_NOT_SUPPORTED',400)`. | This **is** the `IAIProvider` pattern the task wants — reuse it. |
| Encrypted-key path | `BaseGateway.getApiKey()` supports `keyRepo + crypto` (decrypt) **but no gateway is constructed with them** — `OpenWeatherAPI` gets only `apiKey`/`baseUrl`/`logger`. Branch never runs. | Dead wiring. |
| BYOK storage | `apiKeyRepository`: `saveApiKey`/`deleteApiKey`/`hasApiKey`/`useApiKey`. AES-256-GCM (`encrypt.ts`, `base64(IV|tag|ct)`, `MASTER_ENCRYPTION_KEY`). Table `user_api_keys (user_id,provider,encrypted_key)`. Allow-list `openai/anthropic/gemini/openrouter` at route layer. **`useApiKey` has ZERO call sites** — keys stored, never consumed. | Storage matches [user_api_keys.md](../../backend/docs/database/user_api_keys.md); consumption doc is misleading (see §DevDocs Update). |
| AI settings | `ai_settings (user_id, model, temperature[0-2], max_tokens, system_prompt, updated_at)` via `GET/PUT /v1/settings/ai`. | Matches [ai_settings.md](../../backend/docs/database/ai_settings.md). |
| `openai` env seed | `Repositories.ts` seeds an **in-memory Map** from `process.env.OPENAI_API_KEY` (server-owned, not per-user BYOK) via `app.repos.providerKeys.getActiveKey`. **No gateway consumes it.** | Docs describe it as a live mechanism — **inaccurate** (§DevDocs Update). |
| Streaming / queue | **No SSE, no WebSocket, no worker queue.** Only `fetch` GET in `BaseGateway`. | action_layer_api.md itself flags SSE as net-new. |
| Envelope / errors | `{success,data,error}` confirmed, centralized in `AppError.plugin`. **No error-code registry** — codes are free-form strings. | Registry gap relevant to fallback/routing (§4 High). |
| Action/Chat/Intent routes | **None** (`/v1/actions/*`, `/v1/chat/*`, `/v1/llm/*`, `/v1/intent/*` all absent). | Action Layer 0%. |

### Alignment verdict

DevDocs and code are **broadly consistent**: everything the docs mark
Planned/0% is genuinely absent, and everything marked implemented exists. The
divergences are (a) the direct-to-OpenAI client path (documented-but-Deprecated),
(b) built-but-unwired BYOK on both sides, and (c) a handful of doc-accuracy drift
items (§DevDocs Update Required). No silent contract drift was found.

---

## 4. Risk Classification

### 🔴 Critical — report only, do NOT modify

| # | Finding | Why Critical |
|---|---|---|
| **C1** | **Frontend calls the LLM provider directly with a build-time API key.** `OpenAiGateway` posts to `api.openai.com` using `--dart-define=OPENAI_API_KEY`, which is embedded in the shipped client binary and never transits the backend. | **Security** (extractable API key in client), **Architecture conflict** (violates SYS-010 "LLM Gateway is a backend responsibility" and the "no Frontend→OpenAI" rule), **Migration risk** (every day this grows, more client code binds to the provider shape). |
| **C2** | **BYOK is a disconnected dead-end.** Backend stores encrypted per-user keys (`user_api_keys`) but `useApiKey` is never called; frontend `LingonApiKeyRoute` is never instantiated; chat uses a *different* key mechanism entirely. Two key systems, zero of them wired to real traffic. | **Data-contract conflict** — the documented BYOK model is not the model actually in use. Building the gateway on top of the assumption "keys come from `user_api_keys`" without first wiring it will silently fail. |
| **C3** | **No provider-response normalization / error-code contract for LLM.** `AppError.code` is a free-form string with no registry; there is no defined mapping from provider errors (OpenAI 429 vs Gemini quota vs auth) to a stable envelope error. | Fallback (LLM-003) and client error handling **cannot be built reliably** without a stable error contract; ad-hoc strings will fork per provider. |

### 🟠 High — requires an architecture decision, report only

| # | Finding | Decision needed |
|---|---|---|
| **H1** | **No Domain ICD for the LLM-provider abstraction.** Only [tool.md](../../requirements/domain_icd/tool.md) "Future Extension" mentions folding LLM providers into the Tool Domain. Per [CLAUDE.md](../../CLAUDE.md) ICD Rule, implementation **must not proceed** without one. | Fold LLM into **Tool Domain** (extend `tool.md`) *or* create **`requirements/domain_icd/llm.md`**. This gates both prompts. |
| **H2** | **Gateway exposure path.** SSOT says the LLM is reached via the Action Layer (`POST /v1/actions/execute {type:"llm.chat_complete"}`), but the entire Action Layer is 0% and unbuilt. | Build the LLM Gateway **inside** a minimal Action Layer scaffold (documented path), or ship an **interim dedicated endpoint** and migrate later. Do not invent an undocumented `/v1/chat` without recording it in `action_layer_api.md` first. |
| **H3** | **Streaming transport absent.** CHAT-002 (token streaming) needs SSE, which the backend does not have. | Approve adding SSE (`GET /v1/actions/:id/stream`) now, or ship non-streaming MVP and defer CHAT-002. |
| **H4** | **Cost monitoring has no home.** LLM-004 requires per-request token/cost recording; the referenced `usage_logs` table does not exist, and there is no Domain ICD/schema for it. Workflow pre-launch checklist lists a "Circuit Breaker" for LLM cost runaway as Not Started. | Define `usage_logs` schema + cost/circuit-breaker policy as part of the LLM Domain ICD. |

### 🟡 Medium — safe improvement, implement if documentation permits

| # | Finding | Action |
|---|---|---|
| **M1** | Backend service/plugin docs describe the `Repositories.ts` `openai` seed and `useApiKey` as live, consumed mechanisms. They are dead wiring. | Correct the docs (§DevDocs Update). *Doc-only; deferred to a dedicated sync pass to preserve commit-reconciliation discipline — see §7.* |
| **M2** | `docs/policies/privacy_policy.md` states conversation content is sent to LLM providers; today only the **frontend** does this, and the planned design routes it through the backend. | Update privacy policy to reflect current reality + planned backend-mediated flow. Requires Legal sign-off (Human Resource). |

### 🟢 Low — documentation cleanup, implement if safe

| # | Finding | Action |
|---|---|---|
| **L1** | `frontend/docs/services/LlmService.md` path drift: `lib/modules/chat_module.dart` → `lib/modules/chat/chat_module.dart`; `lib/auth/domain/llm_provider.dart` → `lib/modules/auth/llm_provider.dart`; `stream()` is a single-chunk stub, not "(미구현)". | Correct paths/notes (§DevDocs Update). |
| **L2** | `llm_gateway_requirements.md` LLM-001 evidence conflates the **frontend** `OpenAiGateway` with a backend gateway; the 25% credit is BYOK-storage + FE temp impl, backend gateway = 0%. | Clarify FE vs BE split in the evidence note. |

> **Note on scope:** per the task, Critical/High are **report-only**; Medium/Low
> would normally be applied immediately. This pass deliberately consolidates all
> doc-accuracy fixes into §DevDocs Update Required rather than editing scattered
> files, because this repo reconciles doc changes against **specific verified
> source commits** with a versioned note (see [version/frontend.json](../../version/frontend.json)
> `known_discrepancy`). Applying those edits correctly is a dedicated
> documentation-sync pass; doing it as a side effect here would violate the SSOT
> discipline. The three deliverables (this report + two prompts) are the agreed
> output.

---

## 5. Target AI Gateway Architecture (aligned to SSOT)

**Forbidden** (task + SSOT): `Frontend → OpenAI API`, `Backend → OpenAI SDK` (direct coupling).

**Required** contract — this is SYS-010 + Action Layer, drawn concretely:

```
Frontend Chat Window (ChatWidget / ChatModule)
        │  Authorization: Bearer <JWT>
        ▼
POST /v1/actions/execute
     { type: "llm.chat_complete",
       input: { messages:[…], model?, temperature?, max_tokens? },
       source: "chat" }
   (streaming: GET /v1/actions/:id/stream  → SSE  action.progress / action.completed)
        ▼
Backend AI Gateway  =  Action Dispatcher (minimal)  →  LLM Gateway Service (SYS-010)
        │   • resolves per-user key: apiKeyRepository.useApiKey(userId, provider)
        │   • loads model params: settingsRepository.getAISettings(userId)
        │   • routes/falls back (LLM-002/003); records cost (LLM-004)
        ▼
IAIProvider  (reuse existing BaseProvider/BaseGateway pattern)
        ├── OpenAIProvider    extends BaseGateway   → api.openai.com/v1/chat/completions
        ├── GeminiProvider    extends BaseProvider  → generativelanguage.googleapis.com
        └── FutureProvider    (Anthropic · OpenRouter · Local · Enterprise)   ← add-only
        ▼
Provider API  →  normalize  →  { success, data, error }  envelope  →  Frontend
```

### Design principles (Step 4 + Step 5)

1. **Provider abstraction = the existing `BaseProvider` contract.** A provider is
   a class under `src/gateway/llm/` implementing `execute({route, payload})`,
   switching on route (`chat.complete`, `chat.stream`), throwing
   `AppError('OP_NOT_SUPPORTED',400)` for unknown routes. The `LLM Gateway
   Service` selects the provider from request metadata / `ai_settings` (LLM-002)
   and holds fallback logic (LLM-003). **No provider name appears above this
   layer** — Chat/Intent/Planner only ever speak `llm.chat_complete`.
2. **New provider = new class only.** Adding Anthropic / OpenRouter / Local /
   Enterprise / Custom requires **no frontend change, no DB migration, no API
   breaking change** (Step 5) — the Action Type and envelope are stable; the
   provider allow-list and `user_api_keys.provider` already accept the four
   initial names; new providers extend the allow-list additively.
3. **Keys never leave the backend.** Per-user keys come from `user_api_keys` via
   `useApiKey(userId, provider)` (already built, currently unused) — this is the
   wire C2 is missing. Server-owned fallback keys may come from env via the
   existing `providerKeys` repo. The `--dart-define=OPENAI_API_KEY` client path
   is **removed**.
4. **Structured output (LLM-005)** is a gateway capability (JSON-schema-constrained
   response) reserved for Intent/Planner, not required for the Chat MVP.
5. **Streaming (H3)** rides the documented SSE action-progress events; the
   frontend `stream()` stub is upgraded to consume them. Non-streaming
   `complete()` remains the fallback.

Initial providers: **OpenAI GPT + Google Gemini** (both in the existing
allow-list). Anthropic + OpenRouter are already allow-listed for later with zero
architecture change.

---

## 6. On the "LLM First" framing (philosophy guardrail)

The task's Step 1 asks to check an "LLM First philosophy." **The SSOT has no such
philosophy.** Its Adopted philosophy is *"Dashboard는 제품이 아니다. Action
Layer가 제품이다"* — the LLM is the **engine**, the Action Layer is the
**product** ([docs/strategy/product.md], DEC-001/002).

There is direct precedent: on 2026-07-30 a proposed *"Dashboard is the Product"*
philosophy addition was **rejected** for conflicting with the Adopted SSOT, and
only its non-conflicting technical parts were adopted
([changelog/system.md](../../changelog/system.md)). The same rule applies here.

**Therefore this review treats "LLM First" only as an *engineering* principle** —
"the AI capability is a first-class, provider-agnostic backend service that
nothing may bypass or hard-couple to a single vendor." It does **not** adopt
"LLM First" as a product philosophy. Confirming or overriding this is a CTO
decision (below), not something to encode silently.

---

## 7. DevDocs Update Required

None are applied in this pass (see §4 scope note). Each is a recommendation with
Document / Section / Reason, to be executed in a dedicated documentation-sync
pass **after** the Domain-Freeze decision (H1), since several depend on it.

| # | Document | Section | Reason |
|---|---|---|---|
| U1 | **`requirements/domain_icd/` (new `llm.md` OR `tool.md` extension)** | new file / Future Extensions | **Blocker.** No Domain ICD exists for LLM providers; [CLAUDE.md](../../CLAUDE.md) forbids implementing without one. Must define Purpose, Model (Provider/Model/Completion/Usage), Responsibilities, State, Events, I/O, Relationships. |
| U2 | `requirements/llm_gateway_requirements.md` | Evidence (LLM-001) | Clarify that the only `OpenAiGateway` is **frontend** and temporary; backend gateway = 0%. Split FE/BE progress so the 25% isn't read as "backend partially built". |
| U3 | `docs/icd/action_layer_api.md` | `llm.chat_complete` Action Type + Events | Promote `llm.chat_complete` from example to a fully-specified Action Type (input/result schema, error codes, streaming events) once H2 is decided. |
| U4 | `docs/icd/prompt_playbook.md` | §2 필수 동반 문서 matrix | Add a row for "LLM / Chat Action" listing companion docs, per the playbook's own "표에 없으면 먼저 행을 추가" rule. |
| U5 | `backend/docs/services/README.md`, `backend/docs/plugins/repositories.md` | `providerKeys` / `openai` seed | Correct the description: the seed is an **in-memory Map, consumed by no gateway** (M1). |
| U6 | `backend/docs/database/user_api_keys.md` | `useApiKey` | Note it currently has **zero call sites** — stored but unused (M1). |
| U7 | `frontend/docs/services/LlmService.md` | paths / `stream()` | Fix path drift and the single-chunk-stub nuance (L1); note BYOK route is unwired. |
| U8 | `docs/policies/privacy_policy.md` | LLM data flow | Reflect that content transits **frontend→provider** today and will transit **backend→provider** post-gateway; requires Legal review (M2). |
| U9 | `version/*.json` + `changelog/*.md` | — | When the gateway lands: **Minor** bump (Domain Contract / Architecture change) on `system` + `backend` (and `frontend` when the client is repointed), with matching changelog entries per [CLAUDE.md](../../CLAUDE.md) Version 관리. No bump for *this* review pass (docs-only, no contract change). |

---

## 8. Human Resource Required

> Only tasks a human must do — account/console/billing/legal/UX/policy. No coding
> tasks. Overlaps with [status/required_human_resource.md](../../status/required_human_resource.md)
> are noted; new AI-specific items should be merged there in the sync pass.

| Task | Category | Priority | Notes |
|---|---|---|---|
| Create/obtain **OpenAI** API account + production key (org, billing, usage tier) | External Service | High | Needed for platform-funded mode; not needed if pure BYOK. |
| Create **Google AI (Gemini)** access — Google AI Studio API key *or* GCP Vertex AI project + billing + enable Generative Language API | Cloud / External Service | High | Console + billing task; cannot be done from code. |
| Decide & set **cost/budget caps and alerting** per provider (ties to LLM-004 circuit breaker) | Business / Cloud | High | Product/finance decision; console configuration. |
| **BYOK vs platform-funded** key model decision (who pays for tokens) | Business (Product policy) | Critical | Drives the whole key-resolution design; see CTO Decision. |
| **Legal review — BYOK responsibility clause** (user bears their own provider cost/usage) | Legal | High | Already tracked in [required_human_resource.md](../../status/required_human_resource.md) Legal; still open. |
| **Legal/privacy sign-off — sending user chat content to third-party LLMs** (data-processing terms with OpenAI/Google, retention, region) | Legal | Critical | Must precede any real user traffic through the gateway; updates privacy_policy (U8). |
| **UX decision** — streaming vs non-streaming default; model-picker UI; which providers users can choose | UX | Medium | Shapes CHAT-002/CHAT-005 scope. |
| **Product policy** — default provider + default model at launch; per-user rate/quota | Product policy | Medium | Feeds `ai_settings` defaults and rate-limit config. |

---

## CTO Decision Required

Only decisions needing human approval before implementation prompts run:

1. **Domain ICD placement (H1 — blocking).** Fold LLM providers into the **Tool
   Domain** (extend `tool.md`), or create a dedicated **`requirements/domain_icd/llm.md`**?
   *Recommendation: dedicated `llm.md`* — provider routing, fallback, cost, and
   structured output are richer than the generic Tool contract, and Intent/Planner
   consume the LLM directly (not only via Action→Tool).
2. **Gateway exposure & sequencing (H2).** Build the LLM Gateway behind a minimal
   Action Layer scaffold (`POST /v1/actions/execute {type:"llm.chat_complete"}`,
   the documented path), or ship an interim dedicated endpoint first?
   *Recommendation: minimal Action Layer scaffold* — avoids creating an
   undocumented API and matches `frontend_interaction_flow.md`.
3. **Key model (Human Resource dependency).** BYOK-only, platform-funded-only, or
   hybrid (platform default + optional BYOK)? This determines whether
   `useApiKey(userId,provider)` or the env `providerKeys` path (or both) is the
   key source.
4. **Launch provider set.** Confirm OpenAI + Gemini for launch, Anthropic +
   OpenRouter deferred (all four already allow-listed). Any Local/Enterprise
   target for the initial abstraction test?
5. **Streaming (H3).** Approve adding SSE transport now for CHAT-002, or ship a
   non-streaming MVP and defer?
6. **Philosophy (§6).** Confirm "LLM First" is adopted **only** as an engineering
   principle (provider-agnostic, no-bypass), **not** as a product philosophy that
   would displace "Action Layer is the product."
7. **Privacy gate.** Approve that no user chat content flows through the new
   backend gateway to any third-party provider until the privacy/legal sign-off
   (Human Resource) is complete.

---

## References

- Requirements: [system_requirements.md](../../requirements/system_requirements.md) SYS-010, [llm_gateway_requirements.md](../../requirements/llm_gateway_requirements.md), [chat_requirements.md](../../requirements/chat_requirements.md)
- ICD: [action_layer_api.md](../icd/action_layer_api.md), [frontend_interaction_flow.md](../icd/frontend_interaction_flow.md), [domain_icd/tool.md](../../requirements/domain_icd/tool.md), [domain_icd/action.md](../../requirements/domain_icd/action.md)
- Implementation docs: [frontend/docs/services/LlmService.md](../../frontend/docs/services/LlmService.md), [backend/docs/services/README.md](../../backend/docs/services/README.md), [backend/docs/api/apikey.md](../../backend/docs/api/apikey.md), [backend/docs/database/ai_settings.md](../../backend/docs/database/ai_settings.md)
- Policy/Workflow: [security_policy.md](../policies/security_policy.md), [workflow.md](../workflow.md), [prompt_playbook.md](../icd/prompt_playbook.md)
- Verified source: `jdukmin/letmeknow @ 011b9c2`, `jdukmin/lingon @ dd38b22`
- Companion deliverables: [frontend_prompt_ai_chat_gateway.md](frontend_prompt_ai_chat_gateway.md), [backend_prompt_ai_gateway.md](backend_prompt_ai_gateway.md)
