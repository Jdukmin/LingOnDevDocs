# Frontend Claude Prompt — Chat Window ↔ Backend AI Gateway

> **Status**: Prepared implementation prompt · **Target repo**: `jdukmin/letmeknow`
> (Flutter frontend) · **Author**: DevDocs Architect · **Date**: 2026-07-31
> · **Last updated**: 2026-08-01 (contracts frozen; re-verified against `letmeknow @ 011b9c2`)
>
> ✅ **Contracts are frozen (2026-08-01).** You now consume a fully specified
> API — do **not** re-derive or guess any of it:
> - **API**: [action_layer_api.md](../icd/action_layer_api.md) §`llm.chat_complete`
>   — request/response schema, streaming events, 8 error codes, provider catalog
> - **Domain**: [requirements/domain_icd/llm.md](../../requirements/domain_icd/llm.md)
> - **Requirement**: [llm_gateway_requirements.md](../../requirements/llm_gateway_requirements.md) LLM-006 (Credential Source), LLM-007 (Provider Adapter Contract)
>
> ⛔ **STILL GATED — do not execute until the Backend AI Gateway
> ([backend_prompt_ai_gateway.md](backend_prompt_ai_gateway.md)) is implemented
> and verified.** Backend→Frontend order is mandatory
> ([prompt_playbook.md](../icd/prompt_playbook.md) §3) — the frontend consumes a
> contract the backend must own first.
>
> **2026-08-01 addition** — §3a below is new (finding **M4**): the provider list
> is hardcoded in three places in the client, and `ApiKeyStatus.fromJson`
> **silently drops** any provider the backend adds. LLM-007 now makes
> backend-driven provider lists a **contract requirement**, so this is in scope.

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
- Call the **documented** contract exactly as specified in
  [action_layer_api.md](../icd/action_layer_api.md) §`llm.chat_complete`:
  `POST /v1/actions/execute { type:"llm.chat_complete", source:"chat",
  input:{ messages:[{role,content}], provider?, model?, temperature?,
  max_tokens?, stream? } }`.
  - The top-level field is **`input`, not `payload`** — every Action Type shares
    one envelope.
  - `messages` roles are `system|user|assistant`, oldest first. Send the full
    session history (the current code already passes history — preserve that),
    and keep excluding in-progress streaming turns.
  - **Do not send `temperature`/`max_tokens`/`model` unless the user explicitly
    set them in this app** — omitted fields fall back to the server's
    `ai_settings`, which is the intended source of defaults. The client is not
    the owner of model parameters.
- Parse the `{success,data,error}` envelope. `data.result` is the normalized
  completion: `{content, provider, model, credential_source, finish_reason,
  usage}`. Append `data.result.content` as the assistant bubble.
  - `usage` may be `null` (provider omitted it) — the field is always present, so
    never branch on its existence, only on its nullity.
  - `provider`/`model` report what the backend **actually used** and may differ
    from what you requested (server-side fallback). Never treat a mismatch as an
    error.
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
- While you are there, fix the stale fallback message in `ChatModule.send()`
  (finding **L3**): it currently tells the user to *"`.env` 파일에
  `OPENAI_API_KEY`를 추가"*, which is wrong twice over — the key was read from
  `--dart-define`, not `.env`, and after this change the user supplies a key
  through the **BYOK settings UI** instead. Replace it with a message that points
  at that UI (or at sign-in, depending on the key model in CTO Decision 3).

### 3. Wire the BYOK key-management UI (fixes the dead `LingonApiKeyRoute`)

- `lib/route/lingon_api_key.dart` (`getStatus` / `putKey` / `deleteKey` over
  `GET /apikey/status`, `PUT|DELETE /apikey/:provider`) is fully implemented but
  **never instantiated**. Add a Settings surface (a `BaseModule` + a screen/dialog)
  that lets a user store/remove their provider key server-side. This is how a
  user supplies a key now that the client no longer holds one. (Include only if
  CTO Decision 3 selects BYOK/hybrid; if platform-funded-only, skip and report.)

### 3a. Stop hardcoding the provider list (M4 — extensibility)

Verified: the provider set is duplicated in **three** places in the client —
`enum LlmProvider` (`lib/modules/auth/llm_provider.dart`), `_validProviders`
(`lib/route/lingon_api_key.dart`), and `ApiKeyStatus`'s four fixed `bool` fields
with their `fromJson` and `isSet` switch. Consequences: adding a 5th provider
(Anthropic, OpenRouter, Local, Enterprise) forces a **frontend** edit, and
`ApiKeyStatus.fromJson` **silently drops** any provider the backend starts
returning.

This is now a **contract requirement**, not just a cleanup — LLM-007 states that
adding a provider must require **no frontend change**, and
[action_layer_api.md](../icd/action_layer_api.md) defines the backend-owned
provider catalog that replaces the client's list.

- Make `ApiKeyStatus` **map-backed** — parse `GET /v1/apikey/status` into a
  `Map<String, bool>` built from the response's own keys, with `isSet(provider)`
  reading that map. Keep the existing typed getters (`openai`, `gemini`, …) as
  thin conveniences if useful, but they must not be the source of truth.
- Drive the BYOK settings UI's provider list from the **backend response**, not
  from a client-side enum, so a new backend provider appears with no client change.
- The **provider-selection UI** (if you build one) sources its options from
  `GET /v1/actions/types` → the `llm.chat_complete` entry's
  `providers:[{id,label,credential_source,available}]`. Render `label`, send
  `id` back as an **opaque string** in `input.provider`, and use `available` to
  disable options the user has no credential for. The client must contain **no
  provider-specific branching** — no per-provider request shapes, endpoints,
  headers, or model lists.
- Keep `_validProviders` only as a **fail-fast guard** for the caller's benefit,
  and derive it from the status response where practical. Do not delete the
  client-side validation entirely — but it must not be the thing that decides
  which providers exist.
- Goal to verify: **adding a provider server-side requires zero frontend edits.**

### 4. Error, loading, and streaming states

- Map the envelope `error.code` to the existing user-facing bubble strings.
  Preserve the `LlmException` hierarchy semantics by translating the **8 codes
  fixed in the ICD** — handle every one, with a safe default for anything
  unrecognized:

  | Backend code | HTTP | Map to | User-facing intent |
  |---|---|---|---|
  | `LLM_KEY_MISSING` | 403 | `LlmAuthException` | "register a key" → **link to the BYOK settings UI** |
  | `LLM_AUTH_FAILED` | 502 | `LlmAuthException` | stored key is invalid/revoked → prompt to re-register |
  | `LLM_RATE_LIMITED` | 429 | `LlmRateLimitException` | back off and retry later |
  | `LLM_TIMEOUT` | 504 | `LlmTimeoutException` | timed out |
  | `LLM_PROVIDER_ERROR` | 502 | `LlmServerException` | upstream failure |
  | `LLM_BAD_REQUEST` | 400 | `LlmInvalidResponseException` | bad params |
  | `LLM_CONTEXT_TOO_LONG` | 400 | new subtype | conversation too long → suggest `clear()` |
  | `LLM_PROVIDER_UNSUPPORTED` | 400 | new subtype | provider unavailable → refresh the catalog |

  ⚠️ `LLM_AUTH_FAILED` is **502, not 401**. Do **not** let it trigger
  `ApiClient`'s 401→refresh-token retry — that path is for LingOn session auth
  only. Verify the two cannot be confused.
  Never show a raw provider error string.
- Loading: keep `ChatModule.isBusy` driving `ChatWidget`'s `_TypingIndicator`.
- Streaming (CHAT-002) — **only if the backend shipped the SSE endpoint**: send
  `input.stream:true`, take the `202 {action_id}`, then consume
  `GET /v1/actions/:id/stream` and render incrementally from
  `action.progress {partial:{content_delta}}`, finishing on `action.completed`
  and surfacing `action.failed` through the table above. `ChatMessage` already
  has `isStreaming` + `copyWith` for exactly this — accumulate in place by `id`.
  Upgrade the `stream()` stub (currently `yield await complete()`, a single
  chunk) to do this. **If the backend did not ship SSE, keep the non-streaming
  path and leave CHAT-002 at 0%** — do not fake incremental rendering by
  chunking a completed response.
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
- Confirm by source grep that no provider API key remains reachable from the
  client: no `String.fromEnvironment('OPENAI_API_KEY')`, no key in any build
  config, no provider `Authorization` header constructed client-side.
- **BYOK round-trip (if CTO Decision 3 keeps BYOK):** store a key through the new
  settings UI, confirm `GET /v1/apikey/status` flips to `true`, run a real chat
  turn that the backend serves with that key, then delete the key and show the
  mapped "key missing" bubble. All against the real backend.
- **M4 check:** show that a provider present in the `/v1/apikey/status` response
  but absent from any client-side enum still renders in the BYOK UI.
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

`docs/icd/action_layer_api.md` (**§`llm.chat_complete` — primary**),
`requirements/domain_icd/llm.md`, `requirements/llm_gateway_requirements.md`
(LLM-006/007), `docs/icd/frontend_interaction_flow.md`,
`frontend/docs/services/LlmService.md`, `frontend/docs/state/Overview.md`,
`frontend/docs/widgets/ChatWidget.md`, `frontend/docs/services/AuthService.md`.
