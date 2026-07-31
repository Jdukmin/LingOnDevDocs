# Frontend Claude Prompt — Chat Window ↔ Backend AI Gateway

> **Status**: Prepared implementation prompt · **Target repo**: `jdukmin/letmeknow`
> (Flutter frontend) · **Author**: DevDocs Architect · **Date**: 2026-07-31
>
> ⛔ **GATED — do not execute until the Backend AI Gateway
> ([backend_prompt_ai_gateway.md](backend_prompt_ai_gateway.md)) is implemented
> and verified.** Backend→Frontend order is mandatory
> ([prompt_playbook.md](../icd/prompt_playbook.md) §3) — the frontend consumes a
> contract the backend must own first. Also gated on CTO Decisions 3 & 5 in
> [2026-07-31-ai-architecture-review.md](2026-07-31-ai-architecture-review.md).

Copy everything below the line into the frontend implementation session.

---

## Role

You are repointing LingOn's **Chat Window** from its temporary
**client-calls-OpenAI-directly** path onto the **backend AI Gateway**. You do
**not** touch the backend. You do **not** modify any DevDocs.

## Why (the mismatch you are fixing)

Today `ChatModule.send()` → `OpenAiGateway.complete()` posts **directly** to
`https://api.openai.com/v1/chat/completions` using a build-time
`--dart-define=OPENAI_API_KEY`. This violates the architecture
([LlmService.md](../../frontend/docs/services/LlmService.md) is marked
🔶 Deprecated for exactly this reason): the LLM Gateway is a **backend**
responsibility (SYS-010), and the API key must **never** ship in the client.

## Authoritative contracts (read first — do not invent)

1. `frontend/docs/services/LlmService.md` — current (Deprecated) LLM path.
2. `frontend/docs/widgets/ChatWidget.md`, `frontend/docs/state/Overview.md` —
   `ChatWidget`, `ChatModule`, and the `BaseModule extends ChangeNotifier`
   pattern you must follow.
3. `docs/icd/action_layer_api.md` — the `llm.chat_complete` Action Type, the
   `{success,data,error}` envelope, and (if enabled) streaming events.
4. `docs/icd/frontend_interaction_flow.md` — the Chat-first flow and the
   proposed `ActionModule`/`ActionHistoryModule` state modules.
5. `frontend/docs/services/AuthService.md` — how `ApiClient` attaches the Bearer
   JWT and handles 401→refresh.

## Required changes

### 1. Route chat through the backend (core)

- `ChatModule.send()` must call the backend, not OpenAI. Use the existing
  `ApiClient` (`lib/core/network/api_client.dart`, base
  `https://www.ling-on.com`, Bearer JWT already attached, 401→refresh built in).
- Call the **documented** contract:
  `POST /v1/actions/execute { type:"llm.chat_complete",
  input:{ messages:[{role,content}], model?, temperature?, max_tokens? },
  source:"chat" }`. Send the full session message history as `messages` (the
  current code already passes history — preserve that).
- Parse the `{success,data,error}` envelope: `data` is the normalized completion
  (`content`, `model`, `usage`, `finish_reason`). Append `data.content` as the
  assistant bubble.
- **Keep the `LlmGateway` abstraction as the seam.** Preferred: add a
  backend-backed implementation (e.g. `LingonLlmGateway`) that calls the Action
  route, and register it in `main()` in place of `OpenAiGateway`. `ChatModule`
  should change as little as possible — ideally only which gateway is registered.
  Do **not** delete `OpenAiGateway`; mark it clearly as the deprecated direct
  path.

### 2. Remove the client-side provider key (security)

- Delete the `--dart-define=OPENAI_API_KEY` runtime path from `main.dart` and the
  chat flow. The client must hold **no** provider API key. Model/params come from
  the server (`ai_settings`), not the client build.

### 3. Wire the BYOK key-management UI (fixes the dead `LingonApiKeyRoute`)

- `lib/route/lingon_api_key.dart` (`getStatus` / `putKey` / `deleteKey` over
  `GET /apikey/status`, `PUT|DELETE /apikey/:provider`) is fully implemented but
  **never instantiated**. Add a Settings surface (a `BaseModule` + a screen/dialog)
  that lets a user store/remove their provider key server-side. This is how a
  user supplies a key now that the client no longer holds one. (Include only if
  CTO Decision 3 selects BYOK/hybrid; if platform-funded-only, skip and report.)

### 4. Error, loading, and streaming states

- Map the envelope `error.code` to the existing user-facing bubble strings.
  Preserve the `LlmException` hierarchy semantics (`auth`, `rateLimit`,
  `timeout`, `network`, `server`) by translating backend codes
  (`LLM_AUTH_FAILED`, `LLM_RATE_LIMITED`, `LLM_TIMEOUT`, `LLM_PROVIDER_ERROR`, …)
  to them. Never show a raw provider error.
- Loading: keep `ChatModule.isBusy` driving `ChatWidget`'s `_TypingIndicator`.
- Streaming (CHAT-002) — **only if the backend SSE endpoint exists** (CTO
  Decision 5): upgrade the `stream()` stub (currently `yield await complete()`,
  a single chunk) to consume `GET /v1/actions/:id/stream` SSE
  `action.progress` events and render incrementally. If SSE is not shipped, keep
  the non-streaming path and leave CHAT-002 at 0%.
- Markdown (CHAT-005) is **out of scope** unless explicitly requested — note it
  as still-absent; do not silently add `flutter_markdown`.

## Testing requirements

- **Real Execution Only** ([docs/workflow.md](../workflow.md) principle 4) — run
  the app against the **real** backend and show an actual chat round-trip through
  `POST /v1/actions/execute` (not a mock). Demonstrate at least one real error
  path (e.g. no stored key → the mapped auth bubble).
- Confirm via network inspection that the client makes **no** direct call to any
  provider host (`api.openai.com`, `generativelanguage.googleapis.com`) and holds
  no provider key.
- Produce a verification report at
  `verification/frontend/<YYYY-MM-DD>-chat-backend-gateway.md` with the required
  sections (변경 목적 / 변경 파일 / 영향 분석 / 테스트 결과 / 남은 문제).

## Hard constraints

- ❌ Do **not** modify any DevDocs / `.md` contract files. Report needed doc
  changes in the verification report.
- ❌ Do **not** commit. Leave the working tree for review.
- ❌ Do **not** call any LLM provider directly from the client, and do **not**
  embed a provider key in the client.
- ❌ Do **not** couple `ChatWidget`/`ChatModule` to a specific provider — the UI
  speaks only to the `LlmGateway` seam / Action route.
- ❌ Do **not** invent backend endpoints — use only what
  `action_layer_api.md` documents and the backend has verified.
- ✅ Frontend-only. Progress you may claim is capped at **25%** until integration
  with the backend is jointly verified
  ([prompt_playbook.md](../icd/prompt_playbook.md) §4).

## Companion documents to keep open

`docs/icd/action_layer_api.md`, `docs/icd/frontend_interaction_flow.md`,
`frontend/docs/services/LlmService.md`, `frontend/docs/state/Overview.md`,
`frontend/docs/widgets/ChatWidget.md`, `frontend/docs/services/AuthService.md`.
