# AI Architecture Review Report — AI Platform (LLM Gateway + Chat Integration)

> **Status**: Review (pre-implementation) · **Progress**: n/a (review artifact — 구현 대상 아님) · **Date**: 2026-08-01 · **Author**: DevDocs Architect · **Scope**: Architecture / Requirements / ICD / BYOK review for the AI Platform Domain. **No source code and no contract was changed by this pass.**
>
> **Supersedes** [2026-07-31-ai-architecture-review.md](2026-07-31-ai-architecture-review.md)
> — that report's findings are re-verified here and remain valid; this pass adds
> three newly-classified findings (H5, M3, M4) and adds the explicit Target
> Architecture Validation (§5) and BYOK Validation (§6) sections. The 07-31
> report is retained as history and is **not** deleted.
>
> **역할 경계**: 이 문서는 분석·검토·지시 생성만 한다. Frontend/Backend 구현은
> 하지 않는다. 구현 지시는 [frontend_prompt_ai_chat_gateway.md](frontend_prompt_ai_chat_gateway.md),
> [backend_prompt_ai_gateway.md](backend_prompt_ai_gateway.md)로 분리한다.

---

## 0. Executive Summary

The AI Platform architecture is **already specified in the SSOT** — this review's
job is alignment, not invention. The provider-agnostic backend gateway is
`SYS-010 LLM Gateway`; the Frontend→Backend→Provider contract is the Action
Layer's `llm.chat_complete` Action Type. Both are **Planned / 0%**.

Three conclusions from this pass:

1. **Zero drift since 2026-07-31.** Both source repos are at the *same commits*
   re-verified today (`letmeknow @ 011b9c2`, `lingon @ dd38b22`). Every claim in
   the prior report was independently re-checked against code; all hold.
2. **The core defect is unchanged and still Critical**: chat traffic bypasses the
   backend entirely (Flutter → `api.openai.com` with a build-time key), while a
   fully-built BYOK store and a fully-built provider-adapter base sit unwired at
   opposite ends of the system.
3. **Implementation is still gated.** The LLM-provider abstraction has **no
   Domain ICD**; [CLAUDE.md](../../CLAUDE.md) ICD Rule forbids implementing
   without one. → **DevDocs Update Required** (U1), not an invented contract.

**New in this pass** — three findings the 07-31 classification did not carry:

| New | Summary | Why it matters |
|---|---|---|
| **H5** | The provider-adapter base **cannot carry a per-user key**. `GatewayKeyRepo.getActiveKey(provider)` is provider-scoped; BYOK's `useApiKey(userId, provider)` is user-scoped. `BaseGateway.getApiKey()` calls `getActiveKey(this.name)`. | BYOK cannot flow through the existing adapter path without a contract change. Assuming "just reuse `BaseGateway`" produces a gateway that serves **the wrong user's key** or none at all. |
| **M3** | `BaseGateway`'s only HTTP helper is **GET** (`httpGetJson` hardcodes `method:'GET'`). Chat completion requires **POST**. | The 07-31 backend prompt instructed "route every outbound call through `httpGetJson`" — **not executable** for an LLM call. Corrected in this pass's prompt. |
| **M4** | The frontend hardcodes the provider list in **three** places (`enum LlmProvider`, `_validProviders`, `ApiKeyStatus`'s four fixed bool fields). | Contradicts the Task 4 goal. Adding a 5th provider forces a frontend edit, and `ApiKeyStatus.fromJson` **silently drops** any provider the backend adds. |

---

## 1. Current Phase

| Item | State |
|---|---|
| Now starting | **AI Platform Domain** (LLM Gateway + Chat integration) |
| System Version | `0.1.1` ([version/system.json](../../version/system.json)) |
| Backend Version | `0.1.0` ([version/backend.json](../../version/backend.json), source `jdukmin/lingon`) |
| Frontend Version | `0.1.2` ([version/frontend.json](../../version/frontend.json), source `jdukmin/letmeknow`) |
| Governing philosophy | **"Action Layer가 제품이다; Dashboard/LLM은 수단이다"** (DEC-001/002) — the LLM is the **engine**, not the product |
| Verified against | `jdukmin/letmeknow @ 011b9c2`, `jdukmin/lingon @ dd38b22` (fresh clones, 2026-08-01 — unchanged since 07-31) |

Relevant SYS requirements ([system_requirements.md](../../requirements/system_requirements.md)):

| ID | Requirement | Status | Progress |
|---|---|---|---|
| SYS-002 | Natural Language Interaction (Chat) | In Progress | 25% |
| SYS-003 | AI Briefing | In Progress | 25% |
| SYS-004 | Intent Processing | Planned | 0% |
| SYS-005 | Memory Management (RAG) | Planned | 0% |
| SYS-009 | Automation Workflow (Planner) | Planned | 0% |
| **SYS-010** | **LLM Gateway** (provider-agnostic, backend) | **Planned** | **0%** |

---

## 2. DevDocs Reviewed

| Layer | Documents read | Key finding for the AI Platform |
|---|---|---|
| **Architecture** | [strategy/architecture.md](../strategy/architecture.md) | LLM lives in Layer 2 (AI Decision) as an **engine**, not a top layer. No provider coupling anywhere in the contract. |
| **Requirements** | [system_requirements.md](../../requirements/system_requirements.md), [llm_gateway_requirements.md](../../requirements/llm_gateway_requirements.md), [chat_requirements.md](../../requirements/chat_requirements.md), [action_requirements.md](../../requirements/action_requirements.md), [intent_requirements.md](../../requirements/intent_requirements.md), [memory_requirements.md](../../requirements/memory_requirements.md), [planner_requirements.md](../../requirements/planner_requirements.md) | SYS-010 already defines the exact provider-agnostic gateway requested. LLM-001…005 spec multi-provider / routing / fallback / cost / structured output. |
| **ICD (Domain)** | [domain_icd/README.md](../../requirements/domain_icd/README.md), [tool.md](../../requirements/domain_icd/tool.md), [action.md](../../requirements/domain_icd/action.md), [intent.md](../../requirements/domain_icd/intent.md) | Execution model `User→Intent→Action→(Workflow)→Tool→Execution`. **LLM provider has no Domain ICD** — only tool.md "Future Extensions" line. → U1. |
| **ICD (API/Action)** | [icd/README.md](../icd/README.md), [action_layer_api.md](../icd/action_layer_api.md), [frontend_interaction_flow.md](../icd/frontend_interaction_flow.md), [api_comparison.md](../icd/api_comparison.md), [gap_analysis.md](../icd/gap_analysis.md) | LLM reached via `POST /v1/actions/execute`; streaming via `GET /v1/actions/:id/stream` (SSE). Envelope `{success,data,error}`. **`llm.chat_complete` appears only as an *example*** in the Event table — it is **not** a specified Action Type (no input/result schema). → U3. |
| **Status** | [status/current_status.md](../../status/current_status.md), [required_human_resource.md](../../status/required_human_resource.md) | BYOK responsibility clause already tracked as an open Legal task. |
| **Roadmap** | [roadmap/roadmap.md](../roadmap/roadmap.md), [mvp.md](../roadmap/mvp.md), [kpi.md](../roadmap/kpi.md) | Intent Engine = Phase 3; AI Decision precedes Dashboard in dev priority. |
| **Version** | [system.json](../../version/system.json), [backend.json](../../version/backend.json), [frontend.json](../../version/frontend.json) | See §1. |
| **Decision Log** | [decisions/architecture_decisions.md](../decisions/architecture_decisions.md) | DEC-001/002/003 only. **No LLM/provider decision recorded** — the CTO decisions in §9 are what fill this gap. |
| **Traceability** | [requirements_traceability.md](../../requirements/requirements_traceability.md) | SYS-010 row: LLM-001 evidence = "저장소만" (BE) + "단일 provider 구현" (FE); LLM-002…005 = 없음. Consistent with code. |
| **Policy** | [security_policy.md](../policies/security_policy.md), [logging_policy.md](../policies/logging_policy.md), [privacy_policy.md](../policies/privacy_policy.md) | AES-256-GCM for BYOK; `MASTER_ENCRYPTION_KEY` ≠ `JWT_SECRET`; `cryptoUtil` explicitly flagged **"암호화 아님"**; keys never logged. |
| **Workflow / Ops** | [workflow.md](../workflow.md), [prompt_playbook.md](../icd/prompt_playbook.md) | Step 0 Domain Freeze precedes implementation; Backend→Frontend prompt order mandatory; "Real Execution Only"; Progress capped at 25% per isolated session. |

### Where the AI Platform belongs

It is the **enabling engine for Layer 1 (Action) and Layer 2 (AI Decision)**,
consumed by Chat (SYS-002), Intent (SYS-004), Planner (SYS-009), and Briefing
(SYS-003). It is **not** a new product layer and must not become one. It sits
*beneath* the Action Layer as the `llm.chat_complete` implementation and as the
shared LLM client for Intent/Planner.

---

## 3. Current Implementation

### Frontend — `jdukmin/letmeknow @ 011b9c2` (re-verified 2026-08-01)

| Aspect | Reality (verified in code) | Evidence |
|---|---|---|
| Chat path | `ChatModule.send()` → `gw<LlmGateway>().complete(history)` → `OpenAiGateway` → **`https://api.openai.com/v1` directly**. No backend hop. | `lib/modules/chat/chat_module.dart`, `lib/gateway/llm/openai_gateway.dart:20` |
| API key | `String.fromEnvironment('OPENAI_API_KEY')` — compile-time `--dart-define`, **ships inside the client binary**. | `lib/main.dart:32,37` |
| Provider abstraction | `abstract LlmGateway { complete(); stream(); }` + single `OpenAiGateway`. `enum LlmProvider {openai,anthropic,gemini,openrouter}` declared, **zero references**. | `lib/gateway/llm/llm_gateway.dart`, `lib/modules/auth/llm_provider.dart` |
| Streaming | `stream()` is a **single-chunk stub** (`yield await complete(messages)`) — not token streaming, and not an `UnimplementedError`. | `openai_gateway.dart:132-133` |
| BYOK → backend | `LingonApiKeyRoute` (`GET /apikey/status`, `PUT/DELETE /apikey/:provider`) fully implemented but **never instantiated — no UI calls it**. | `lib/route/lingon_api_key.dart:60` (sole occurrence) |
| Provider list coupling | Hardcoded in **3 places**: `enum LlmProvider`, `_validProviders`, and `ApiKeyStatus`'s 4 fixed bool fields + `fromJson` + `isSet` switch. | `llm_provider.dart`, `lingon_api_key.dart` → **M4** |
| Backend base URL | `ApiClient.baseUrl = https://www.ling-on.com`, Bearer JWT, 401→refresh-retry. **No `/v1/actions/*`, `/v1/chat/*`, `/v1/llm/*` calls.** | `lib/core/network/api_client.dart:57` |

### Backend — `jdukmin/lingon @ dd38b22` (re-verified 2026-08-01)

| Aspect | Reality (verified in code) | Evidence |
|---|---|---|
| LLM gateway | **None.** `src/gateway/` = `OpenWeatherAPI`, `GoogleAuthAPI`, `GoogleCalendarAPI`, `GoogleTokenService`. **No OpenAI/Gemini SDK in `package.json`**; no outbound LLM URL in `src/`. | `package.json`, `find src -name '*.ts'` |
| Provider adapter base | `BaseProvider.execute(input: ProviderRequest{gateway,route,payload})`; `BaseGateway extends BaseProvider` adds key resolution, URL building, logging, `sanitizeUrl`, `AppError` wrapping. New provider = new subclass switching on `input.route`. | `src/core/base/BaseProvider.ts`, `BaseGateway.ts` |
| **HTTP verbs** | `BaseGateway` exposes **GET only** — `httpGetJson` hardcodes `fetch(url, { method: 'GET' })`; `getJson`/`getJsonWithApiKey` wrap it. **No POST helper.** | `BaseGateway.ts:280,288` → **M3** |
| **Key-repo scoping** | `GatewayKeyRepo.getActiveKey(provider)` — **provider-scoped, no `userId`**. `getApiKey()` calls `getActiveKey(this.name)`. | `BaseGateway.ts:27,110` → **H5** |
| BYOK storage | `apiKeyRepository`: `saveApiKey`/`deleteApiKey`/`hasApiKey`/`useApiKey`, AES-256-GCM (`encrypt.ts`, base64 `IV|tag|ct`, `MASTER_ENCRYPTION_KEY`). Table `user_api_keys(user_id,provider,encrypted_key,updated_at)`. **`useApiKey` has ZERO call sites** — keys stored, never consumed. | `src/db/apiKeyRepository.ts:64` (sole occurrence) |
| AI settings | `ai_settings(user_id,model,temperature[0-2],max_tokens,system_prompt,updated_at)` via `GET/PUT /v1/settings/ai`. | `src/db/settingsRepository.ts` |
| `openai` env seed | `Repositories.ts` seeds an **in-memory `Map`** from `process.env.OPENAI_API_KEY` using `cryptoUtil.encrypt` — **Base64, explicitly "NOT secure encryption"**. **No gateway consumes it.** | `Repositories.ts:14,31-38`, `Crypto.ts` → **H6** |
| Streaming / queue | **No SSE, no WebSocket, no worker queue.** Grep for `text/event-stream`/`EventSource`/`websocket` → no hits in `src/`. | — |
| Envelope / errors | `{success,data,error}` confirmed, centralized in `AppError.plugin`. **No error-code registry** — codes are free-form strings. | `src/core/utils/AppError.ts` → **C3** |
| Action/Chat/LLM/Intent routes | **None.** `/v1/actions/*`, `/v1/chat/*`, `/v1/llm/*`, `/v1/intent/*` all absent. | grep → no hits |

### Alignment verdict

DevDocs and code are **broadly consistent**: everything marked Planned/0% is
genuinely absent, everything marked implemented exists. **No silent contract
drift.** The divergences are (a) the direct-to-OpenAI client path
(documented, but only as "Deprecated"), (b) built-but-unwired BYOK on *both*
sides, and (c) doc-accuracy drift (§7).

---

## 4. Mismatch Classification

> Per task rules: **Critical / High → report only.** **Medium / Low →
> recommend implementation** (carried into the two prompts).

### 🔴 Critical — report only, do NOT modify

| # | Finding | Why Critical |
|---|---|---|
| **C1** | **Frontend calls the LLM provider directly with a build-time API key.** `OpenAiGateway` posts to `api.openai.com` using `--dart-define=OPENAI_API_KEY`, embedded in the shipped binary, never transiting the backend. | **Security** (extractable key in a distributed client), **Architecture conflict** (violates SYS-010 "gateway is a backend responsibility" and the no-Frontend→Provider rule), **Migration risk** (client code keeps binding to the provider's wire shape). |
| **C2** | **BYOK is a disconnected dead-end.** Backend stores encrypted per-user keys but `useApiKey` has zero call sites; frontend `LingonApiKeyRoute` is never instantiated; chat uses a *different* key mechanism entirely. Two key systems, neither wired to real traffic. | **Contract mismatch** — the documented BYOK model is not the model in use. Building the gateway on "keys come from `user_api_keys`" without first wiring it will silently fail at runtime. |
| **C3** | **No LLM error-code contract.** `AppError.code` is a free-form string with no registry; no defined mapping from provider errors (OpenAI 429 vs Gemini quota vs auth failure) to a stable envelope error. | Fallback (LLM-003) and client error handling **cannot be built reliably**; error strings will fork per provider and leak provider identity to the client. |

### 🟠 High — requires an architecture decision, report only

| # | Finding | Decision needed |
|---|---|---|
| **H1** | **No Domain ICD for the LLM-provider abstraction** — only a tool.md "Future Extensions" line. [CLAUDE.md](../../CLAUDE.md) ICD Rule: implementation **must not proceed**. | Fold LLM into **Tool Domain** (extend `tool.md`) *or* create **`requirements/domain_icd/llm.md`**. **This gates both prompts.** |
| **H2** | **Gateway exposure path.** SSOT routes the LLM via the Action Layer, but the entire Action Layer is 0% and unbuilt. `llm.chat_complete` is an *example* in the ICD, not a specified type. | Build the gateway behind a **minimal Action Layer scaffold** (documented path), or ship an **interim dedicated endpoint** and migrate. Do not invent `/v1/chat` without recording it in `action_layer_api.md` first. |
| **H3** | **Streaming transport absent.** CHAT-002 needs SSE; the backend has none. | Approve adding SSE (`GET /v1/actions/:id/stream`) now, or ship a non-streaming MVP and defer CHAT-002. |
| **H4** | **Cost monitoring has no home.** LLM-004 requires per-request token/cost recording; the referenced `usage_logs` table does not exist and has no Domain ICD/schema. The pre-launch "Circuit Breaker for LLM cost runaway" is Not Started. | Define `usage_logs` schema + cost/circuit-breaker policy as part of the LLM Domain ICD. |
| **H5** | **🆕 The provider-adapter base cannot carry a per-user key.** `GatewayKeyRepo.getActiveKey(provider)` is provider-scoped; BYOK is user-scoped (`useApiKey(userId, provider)`). `BaseGateway.getApiKey()` resolves by `this.name` only. | Decide the key-resolution seam: (a) extend `GatewayKeyRepo` to carry `userId`, or (b) resolve plaintext in the **service** layer and inject it per-request into a short-lived provider instance. *Recommendation: (b)* — keeps the key's lifetime to one request and avoids changing a base class shared with OpenWeather/Google. |
| **H6** | **🆕 The platform-funded key path uses Base64, not encryption.** `Repositories.ts` seeds the server OpenAI key via `cryptoUtil.encrypt` — which `security_policy.md` and its own source comment declare **"NOT secure encryption"**. Nothing consumes it today, so it is latent. | If the CTO selects platform-funded or hybrid mode, this path **must not** be the key source as-is. Either route server keys through `encrypt.ts` (AES-256-GCM) / a real secret store, or drop the seed. Report-only until the key-model decision (§9.3) is made. |

### 🟡 Medium — safe implementation, carried into the prompts

| # | Finding | Action |
|---|---|---|
| **M1** | Backend docs describe the `Repositories.ts` `openai` seed and `useApiKey` as live, consumed mechanisms. Both are dead wiring. | Correct the docs — §7 U5/U6. *Doc-only; deferred to the dedicated sync pass (see scope note below).* |
| **M2** | [privacy_policy.md](../policies/privacy_policy.md) states conversation content is sent to LLM providers; today only the **frontend** does this, and the planned design routes it through the backend. | Update to reflect current reality + planned backend-mediated flow. Requires Legal sign-off → §8. |
| **M3** | **🆕 `BaseGateway` has no POST helper** (`httpGetJson` is GET-hardcoded). Chat completion is POST-with-JSON-body. The 07-31 backend prompt's "route outbound through `httpGetJson`" is not executable. | **Backend prompt corrected in this pass**: add a `httpPostJson`/`postJson` helper to `BaseGateway` mirroring the existing logging, `sanitizeUrl`, timeout, and `AppError` handling — do **not** bypass the base class with a bare `fetch`. |
| **M4** | **🆕 Frontend hardcodes the provider list in 3 places**; `ApiKeyStatus` has 4 fixed bool fields, so a 5th backend provider is **silently dropped** by `fromJson`. | **Frontend prompt updated in this pass**: make `ApiKeyStatus` map-backed (`Map<String,bool>` from the response keys) and derive the BYOK UI's provider list from `GET /v1/apikey/status` rather than a client-side enum. |

### 🟢 Low — cleanup

| # | Finding | Action |
|---|---|---|
| **L1** | [LlmService.md](../../frontend/docs/services/LlmService.md) path drift: `lib/modules/chat_module.dart` → `lib/modules/chat/chat_module.dart`; `lib/auth/domain/llm_provider.dart` → `lib/modules/auth/llm_provider.dart`. `stream()` is a single-chunk stub, not "(미구현)". Doc says key comes from `.env`; it is `--dart-define`. | Correct paths/notes — §7 U7. |
| **L2** | [llm_gateway_requirements.md](../../requirements/llm_gateway_requirements.md) LLM-001 evidence conflates the **frontend** `OpenAiGateway` with a backend gateway; the 25% is BYOK-storage + FE temp impl, backend gateway = 0%. | Split FE/BE progress in the evidence note — §7 U2. |
| **L3** | **🆕 In-code user message is wrong**: `ChatModule` tells the user to "add `OPENAI_API_KEY` to the `.env` file", but the code reads `String.fromEnvironment` (`--dart-define`). A user following it cannot make chat work. | Resolved as a side effect of the frontend prompt (that whole branch is removed). No separate action. |

> **Scope note.** Per the task, Critical/High are report-only. Medium/Low doc
> fixes are consolidated into §7 rather than applied piecemeal, because this repo
> reconciles doc changes against **specific verified source commits** with a
> versioned note ([version/frontend.json](../../version/frontend.json)
> `known_discrepancy`). Applying them correctly is a dedicated documentation-sync
> pass; doing it as a side effect here would violate SSOT discipline. **M3 and M4
> are code-level Medium findings and *are* actioned** — via the two prompts,
> which is the correct channel (DevDocs does not modify source).

---

## 5. Target Architecture Validation

**Forbidden** (task + SSOT): `Frontend → Provider API`, and any coupling of the
dispatcher/route/Intent/Planner layers to a provider SDK.

**Required contract** — SYS-010 + Action Layer, drawn concretely:

```
Flutter Chat (ChatWidget / ChatModule)
        │  Authorization: Bearer <JWT>          ← no provider key, ever
        ▼
POST /v1/actions/execute
     { type:"llm.chat_complete",
       input:{ messages:[{role,content}], model?, temperature?, max_tokens? },
       source:"chat" }
   (streaming: GET /v1/actions/:id/stream → SSE action.progress / action.completed)
        ▼
Backend Action Dispatcher (minimal — one Action Type is sufficient)
        ▼
LlmGatewayService        ← provider selection (LLM-002), fallback (LLM-003),
        │                  cost recording (LLM-004), key resolution (BYOK)
        │  Map<provider, IAIProvider>
        ▼
IAIProvider  (= existing BaseProvider/BaseGateway contract)
        ├── OpenAIProvider   → api.openai.com/v1/chat/completions
        ├── GeminiProvider   → generativelanguage.googleapis.com
        └── Future: Anthropic · OpenRouter · Local · Enterprise   ← add-only
        ▼
normalize → LlmCompletion{content,model,usage,finish_reason} → {success,data,error}
```

### Extension test — "what breaks when we add provider #5?"

The task requires proving **no architecture rewrite** is needed for a new
provider. Traced against the actual contract and code:

| Layer | Change required to add e.g. Anthropic / Local LLM | Verdict |
|---|---|---|
| Action Type / API contract | None — `llm.chat_complete` and the envelope are provider-agnostic | ✅ |
| Frontend chat path | None — client never names a provider | ✅ |
| Dispatcher / route handler | None — provider chosen inside `LlmGatewayService` | ✅ |
| DB schema | None — `user_api_keys.provider` is `text`; `ai_settings.model` is `text` | ✅ |
| Backend provider allow-list | 1-line additive edit (`assertProvider`) | ✅ additive |
| New provider class | 1 new class under `src/gateway/llm/` | ✅ by design |
| **Frontend provider list** | **3 edits** (`enum LlmProvider`, `_validProviders`, `ApiKeyStatus` fields) — and `ApiKeyStatus.fromJson` **silently drops** unknown providers | ❌ **M4** |
| Intent / Planner / Chat callers | None — they speak `llm.chat_complete` only | ✅ |

**Verdict: the architecture is sufficient and needs no rewrite — with one
exception.** M4 is the only place where adding a provider forces a change
outside the backend. It is a *code* defect, not an architecture defect, and it is
fixed in the frontend prompt (map-backed status + backend-derived provider list).

**Structural conditions that must hold** (carried as non-negotiables into the
backend prompt):

1. **Provider abstraction = the existing `BaseProvider` contract.** Providers live
   under `src/gateway/llm/`, implement `execute({route,payload})`, switch on route
   (`chat.complete`, `chat.stream`), and throw `AppError('OP_NOT_SUPPORTED',400)`
   otherwise — exactly like `OpenWeatherAPI`. Do not create a parallel base class.
   *Caveat H5/M3: the base needs a POST helper and cannot supply a per-user key —
   both must be resolved explicitly, not assumed.*
2. **No provider name may appear above `LlmGatewayService`.** Chat/Intent/Planner
   speak only `llm.chat_complete` / `LlmCompletion`.
3. **Every provider response is normalized** to one internal `LlmCompletion`
   before leaving the gateway. Wire-shape differences must not reach callers.
4. **Structured output (LLM-005)** is a gateway capability reserved for
   Intent/Planner — not required for the Chat MVP.
5. **Streaming (H3)** rides the documented SSE action-progress events; the FE
   `stream()` stub upgrades to consume them. Non-streaming `complete()` remains
   the fallback.

Launch providers **OpenAI + Gemini**; Anthropic + OpenRouter are already
allow-listed for later with zero architecture change.

---

## 6. BYOK Validation

BYOK **must remain supported** and no architecture here removes or bypasses it.
Audited against code, not docs:

| Check | Status | Evidence |
|---|---|---|
| BYOK requirement exists in SSOT | ✅ | LLM-001 (4-provider interchangeability); `security_policy.md` names BYOK as a `MASTER_ENCRYPTION_KEY` use case; Legal task tracked in `required_human_resource.md` |
| Users can register their own keys | ⚠️ **API yes, UI no** | `PUT /v1/apikey/:provider` fully implemented and authenticated; the frontend client for it exists but is **never instantiated** → C2 |
| Key storage encrypted at rest | ✅ | AES-256-GCM, fresh random IV per call, packed `IV|tag|ct` base64 — `src/db/encrypt.ts` |
| Encryption key separated from auth secret | ✅ | `MASTER_ENCRYPTION_KEY` (64-hex) ≠ `JWT_SECRET`; policy states "절대 혼용하지 않는다" |
| Keys never returned in responses | ✅ | `hasApiKey` is an existence check; `useApiKey` is documented internal-only; `/apikey/status` returns booleans |
| Keys never logged | ✅ *by contract* | Documented rule + `sanitizeUrl` redaction in `BaseGateway`. **Unverifiable at runtime until the gateway exists** — must be re-checked in the backend verification report |
| **Keys actually consumed by an LLM call** | ❌ **No** | `useApiKey` has **zero call sites** → C2 |
| **Per-user key reaches the provider adapter** | ❌ **Blocked** | `getActiveKey(provider)` has no `userId` → H5 |
| Provider mapping (key → provider → adapter) | ⚠️ Partial | `user_api_keys.provider` allow-list matches the FE enum and the intended adapter set, but nothing maps a stored key to a provider *instance* — that is the missing `LlmGatewayService` |
| Frontend owns **no** provider logic | ❌ **Violated today** | `OpenAiGateway` builds OpenAI request bodies and holds the key → C1 |
| Provider selection belongs to Backend | ❌ **Violated today** | Selection is a compile-time `main()` decision in the client → C1 |
| Platform-funded key path is secure | ⚠️ **Latent risk** | Base64 `cryptoUtil`, in-memory only, unconsumed → H6 |

**Conclusion.** BYOK is **architecturally intact and must be preserved** — the
storage half is real, encrypted, and per-user. What is missing is the
**consumption** half, and the one structural blocker to building it is H5
(per-user key cannot reach the adapter). Neither prompt is permitted to weaken
or bypass BYOK; the backend prompt makes `useApiKey(userId, provider)` the
first-class key source and requires the chosen key-resolution seam to be
recorded in the verification report.

---

## 7. DevDocs Update Required

None applied in this pass (§4 scope note). Each is a recommendation with
Document / Section / Reason, to be executed in a dedicated documentation-sync
pass **after** the Domain-Freeze decision (H1), since several depend on it.

| # | Document | Section | Reason |
|---|---|---|---|
| **U1** | **`requirements/domain_icd/llm.md` (new) OR `tool.md` extension** | new file / Future Extensions | **🔒 Blocker.** No Domain ICD exists for LLM providers; [CLAUDE.md](../../CLAUDE.md) forbids implementing without one. Must define Purpose, Domain Model (Provider/Model/Completion/Usage), Responsibilities, State, Events, Inputs/Outputs, Relationships. |
| U2 | [llm_gateway_requirements.md](../../requirements/llm_gateway_requirements.md) | Evidence (LLM-001) | Clarify the only `OpenAiGateway` is **frontend** and temporary; backend gateway = 0%. Split FE/BE progress so 25% isn't read as "backend partially built" (L2). |
| U3 | [action_layer_api.md](../icd/action_layer_api.md) | `llm.chat_complete` Action Type + Events + Error registry | Promote `llm.chat_complete` from an *example* to a fully-specified Action Type (input/result schema, error codes, streaming events) once H2 is decided. Add the LLM error codes (C3) to the registry. |
| U4 | [prompt_playbook.md](../icd/prompt_playbook.md) | §2 필수 동반 문서 matrix | Add an "LLM / Chat Action" row per the playbook's own "표에 없으면 먼저 행을 추가" rule. |
| U5 | [services/README.md](../../backend/docs/services/README.md), [plugins/repositories.md](../../backend/docs/plugins/repositories.md) | `providerKeys` / `openai` seed | Correct: the seed is an **in-memory Map, Base64-encoded, consumed by no gateway** (M1, H6). |
| U6 | [user_api_keys.md](../../backend/docs/database/user_api_keys.md) | `useApiKey` / Consumers | Note it currently has **zero call sites** — stored but never consumed (M1). |
| U7 | [LlmService.md](../../frontend/docs/services/LlmService.md) | paths / `stream()` / key injection | Fix path drift, the single-chunk-stub nuance, and the `.env`-vs-`--dart-define` error; note the BYOK route is unwired (L1). |
| **U8** | **🆕 [BaseGateway docs](../../backend/docs/services/README.md)** | HTTP helpers | Document that `BaseGateway` is **GET-only** today and that POST support is a prerequisite for any LLM provider (M3) — so the next implementer isn't sent into the same contradiction. |
| U9 | [privacy_policy.md](../policies/privacy_policy.md) | LLM data flow | Reflect that content transits **frontend→provider** today and will transit **backend→provider** post-gateway; requires Legal review (M2). |
| U10 | [version/*.json](../../version/) + [changelog/*.md](../../changelog/) | — | When the gateway lands: **Minor** bump (Domain Contract / Architecture change) on `system` + `backend` (and `frontend` when the client is repointed), with matching changelog entries per [CLAUDE.md](../../CLAUDE.md) Version 관리. **No bump for this review pass** — docs-only, no contract changed. |

---

## 8. Human Resource Required

> Only work a human must do — account / console / billing / legal / policy / UX.
> **No coding tasks.** Overlaps with
> [required_human_resource.md](../../status/required_human_resource.md) are noted;
> new AI-specific items should be merged there in the sync pass.

| Task | Category | Priority | Notes |
|---|---|---|---|
| **BYOK vs platform-funded key model decision** (who pays for tokens) | Business (Product policy) | **Critical** | Drives the entire key-resolution design and whether H6 must be fixed. See §9.3. |
| **Legal/privacy sign-off — sending user chat content to third-party LLMs** (data-processing terms with OpenAI/Google, retention, region) | Legal | **Critical** | Must precede any real user traffic through the gateway; updates privacy_policy (U9). |
| Create/obtain **OpenAI** API account + production key (org, billing, usage tier) | External Service | High | Needed only for platform-funded mode; not needed for pure BYOK. |
| Create **Google AI (Gemini)** access — AI Studio API key *or* GCP Vertex AI project + billing + enable the Generative Language API | Cloud / External Service | High | Console + billing task; cannot be done from code. |
| Decide & set **cost/budget caps and alerting** per provider (ties to LLM-004 circuit breaker) | Business / Cloud | High | Product/finance decision + console configuration. |
| **Legal review — BYOK responsibility clause** (user bears their own provider cost/usage) | Legal | High | Already tracked in [required_human_resource.md](../../status/required_human_resource.md) §Legal — still open. |
| Obtain a **test provider key** for the backend's Real-Execution verification | External Service | High | The backend prompt forbids mock-only verification; a real key must exist to run it. |
| **UX decision** — streaming vs non-streaming default; model-picker UI; which providers users may choose | UX | Medium | Shapes CHAT-002 / CHAT-005 scope and the BYOK settings surface. |
| **Product policy** — default provider + default model at launch; per-user rate/quota | Product policy | Medium | Feeds `ai_settings` defaults and rate-limit configuration. |

---

## 9. CTO Decision Required

> **결정 반영 (2026-08-01, 같은 날 후속 패스)** — 아래 항목 중 대부분이 해소되어
> 계약이 확정되었다. 잔여 항목만 미결이다.
>
> | # | 결정 | 반영 위치 |
> |---|---|---|
> | 1 | **별도 `llm.md`로 분리** (Tool 편입 안 함) | [domain_icd/llm.md](../../requirements/domain_icd/llm.md), [DEC-004](../decisions/architecture_decisions.md) |
> | 2 | **Action Layer 경유** — `llm.chat_complete` 정식화 | [action_layer_api.md](../icd/action_layer_api.md) |
> | 3 | **BYOK 우선 + platform 폴백** (2종 최소 계약, KMS/Credential Domain 미도입) | LLM-006 |
> | 4 | **Service-layer 키 해석** 권고 유지 (구현 시 선택·기록) | backend prompt |
> | 5 | **OpenAI + Gemini** 착수, 나머지 add-only | LLM-007 |
> | 6 | **스트리밍 계약 정의**(`input.stream` + 기존 SSE 이벤트 재사용); 백엔드 미구현 시 CHAT-002는 0% 유지 | action_layer_api.md |
> | 7 | **엔지니어링 원칙으로만 채택** — LLM은 Product Domain이 아님 | llm.md 상단 금지 구조 |
> | 8 | **미결** — privacy/legal 승인 전 실사용자 트래픽 금지 | §8 Human Resource |
>
> **Version**: `system` 0.1.1 → **0.2.0** (Minor — Domain Contract + Architecture
> change). 이번 AI Platform Phase 구현 중에는 추가 승격하지 않는다(CTO 결정).
> `backend` 0.1.0 / `frontend` 0.1.2는 구현이 없으므로 불변.

Decisions needing human approval **before** the implementation prompts may run:

1. **Domain ICD placement (H1 — blocking).** Fold LLM providers into the **Tool
   Domain** (extend `tool.md`), or create a dedicated
   **`requirements/domain_icd/llm.md`**?
   *Recommendation: dedicated `llm.md`* — provider routing, fallback, cost, and
   structured output are richer than the generic Tool contract, and
   Intent/Planner consume the LLM directly, not only via Action→Tool.
2. **Gateway exposure & sequencing (H2).** Build the gateway behind a minimal
   Action Layer scaffold (`POST /v1/actions/execute {type:"llm.chat_complete"}`),
   or ship an interim dedicated endpoint first?
   *Recommendation: minimal Action Layer scaffold* — avoids creating an
   undocumented API and matches `frontend_interaction_flow.md`.
3. **Key model.** BYOK-only, platform-funded-only, or hybrid (platform default +
   optional BYOK)? Determines whether `useApiKey(userId,provider)`, the env
   `providerKeys` path, or both is the key source — **and whether H6 must be
   fixed before launch**.
   *Recommendation: BYOK-first, hybrid-ready* — the encrypted per-user store is
   already built and needs no new infrastructure or billing relationship.
4. **Key-resolution seam (H5).** Extend `GatewayKeyRepo` to carry `userId`, or
   resolve the plaintext key in `LlmGatewayService` and inject it per-request?
   *Recommendation: service-layer resolution* — shortest key lifetime, and does
   not change a base class shared with the OpenWeather/Google gateways.
5. **Launch provider set.** Confirm **OpenAI + Gemini** at launch, Anthropic +
   OpenRouter deferred (all four already allow-listed). Any Local/Enterprise
   target for the initial abstraction test?
6. **Streaming (H3).** Approve adding SSE transport now for CHAT-002, or ship a
   non-streaming MVP and defer?
7. **Philosophy guardrail.** Confirm that "LLM Gateway first" is adopted **only
   as an engineering principle** (provider-agnostic, no-bypass) and does **not**
   displace the Adopted product philosophy *"Action Layer가 제품이다"*
   (DEC-001/002). Precedent: on 2026-07-30 a proposed *"Dashboard is the
   Product"* philosophy was **rejected** for conflicting with the Adopted SSOT
   ([changelog/system.md](../../changelog/system.md)) — the same rule applies here.
8. **Privacy gate.** Approve that **no user chat content flows through the new
   backend gateway to any third-party provider** until the privacy/legal
   sign-off (§8) is complete.

---

## References

- Requirements: [system_requirements.md](../../requirements/system_requirements.md) SYS-010, [llm_gateway_requirements.md](../../requirements/llm_gateway_requirements.md), [chat_requirements.md](../../requirements/chat_requirements.md), [action_requirements.md](../../requirements/action_requirements.md)
- ICD: [action_layer_api.md](../icd/action_layer_api.md), [frontend_interaction_flow.md](../icd/frontend_interaction_flow.md), [domain_icd/tool.md](../../requirements/domain_icd/tool.md), [domain_icd/action.md](../../requirements/domain_icd/action.md)
- Implementation docs: [LlmService.md](../../frontend/docs/services/LlmService.md), [backend/docs/services/README.md](../../backend/docs/services/README.md), [api/apikey.md](../../backend/docs/api/apikey.md), [database/user_api_keys.md](../../backend/docs/database/user_api_keys.md), [database/ai_settings.md](../../backend/docs/database/ai_settings.md)
- Policy/Workflow: [security_policy.md](../policies/security_policy.md), [workflow.md](../workflow.md), [prompt_playbook.md](../icd/prompt_playbook.md)
- Verified source: `jdukmin/letmeknow @ 011b9c2`, `jdukmin/lingon @ dd38b22` (2026-08-01)
- Prior pass: [2026-07-31-ai-architecture-review.md](2026-07-31-ai-architecture-review.md)
- Companion deliverables: [frontend_prompt_ai_chat_gateway.md](frontend_prompt_ai_chat_gateway.md), [backend_prompt_ai_gateway.md](backend_prompt_ai_gateway.md)
