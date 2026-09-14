# TASK-009 — Frontend chat must route through the backend
Status: Validated
Priority: P1
Category: Autonomous
Release relevance: Closes the client-holds-provider-key security hole permanently.

## Objective
Move chat traffic from client→OpenAI to client→backend LLM Gateway→provider, per
the frozen contract.

## Evidence / Background
- `letmeknow/lib/modules/chat/chat_module.dart:138` calls
  `gw<LlmGateway>().complete(...)`; `OpenAiGateway` targets
  `https://api.openai.com/v1` directly (`openai_gateway.dart:20`).
- `letmeknow/lib/main.dart:39` supplies the key via
  `String.fromEnvironment('OPENAI_API_KEY')` — compile-time, and the web build is
  publicly served (see TASK-001).
- `openai_gateway.dart:132-133` — `stream()` is a single-chunk stub
  (`yield await complete(messages)`), not token streaming and not an explicit
  `UnimplementedError`.
- Finding **M4**: the provider list is hardcoded in three places
  (`enum LlmProvider`, `_validProviders`, and `ApiKeyStatus`'s four fixed bool
  fields), and `ApiKeyStatus.fromJson` silently drops unknown providers.
- `letmeknow/lib/core/network/api_client.dart` already implements Bearer JWT plus
  401→refresh→retry — the correct transport already exists and should be reused.

## Authoritative Documents
- **Implementation spec, already written**:
  `docs/docs/ai_platform/frontend_prompt_ai_chat_gateway.md`
- `docs/docs/icd/action_layer_api.md`, `docs/requirements/domain_icd/llm.md`
- `docs/requirements/chat_requirements.md`

## Scope
As bounded by `frontend_prompt_ai_chat_gateway.md`: route chat through
`ApiClient` to the backend Action surface, remove the client-side provider key
path, and address M4's provider-list duplication.

## Out of Scope
- Backend gateway implementation (TASK-005).
- BYOK entry UI (TASK-010, gated on D-002).
- Intent/Memory/Planner.

## Affected Components
`letmeknow/lib/gateway/llm/`, `lib/modules/chat/chat_module.dart`,
`lib/main.dart`, `lib/modules/auth/llm_provider.dart`, frontend tests.

## Dependencies
**TASK-005 must land first** — there is no backend endpoint to call until it does.
Cleared: TASK-005 landed and was validated 2026-09-14.

## Acceptance Criteria
1. No client code path reads a provider API key, and no direct
   `api.openai.com` call remains.
2. Chat requests go through `ApiClient`, inheriting auth and 401 retry.
3. Streaming is either implemented per contract or fails explicitly — no silent
   single-chunk stub pretending to stream.
4. Provider list is no longer triplicated; an unknown provider from the backend is
   not silently dropped.
5. Errors reaching the user are mapped messages, not raw text (same rule as TASK-002).
6. `flutter analyze` clean; `flutter test` passes including new chat tests.

## Validation Plan
```
cd letmeknow
flutter analyze
flutter test
grep -rn "api.openai.com\|fromEnvironment('OPENAI" lib/    # must return nothing
SKIP_DEPLOY=1 bash ./compile_release.sh
grep -raoE "sk-[A-Za-z0-9_-]{20,}" build/web               # must return nothing
```
Note: the original plan's `grep -ril "sk-" build/web` is unusable as a secret
check — CanvasKit/Skia embeds the `sk-SK` Slovak locale tag, so it always
matches. The key-shaped regex above replaces it (Route.md §4).

## Owner Decisions
D-001 affects first-run behaviour (whether chat works before a user adds a key),
not this task's structure.

## Execution Log / Evidence

**Executed**: 2026-09-14 by ORCH-FE3 with three Sonnet implementation workers
(transport wiring / provider-list de-duplication / error mapping). All validation
below was run by the orchestrator, not taken from worker claims.

### What changed (frontend, `letmeknow@master`, uncommitted working tree)

| File | Change |
|---|---|
| `lib/route/lingon_actions.dart` | **NEW.** `LingonActionsRoute(ApiClient)` — `executeChatComplete()` to `POST /v1/actions/execute`, `getTypes()`/`listProviders()` to `GET /v1/actions/types`. Models `LlmCompletionResult`, `LlmUsage`, `LlmProviderInfo`, `ActionTypeInfo`. |
| `lib/gateway/llm/lingon_llm_gateway.dart` | **NEW.** `LingonLlmGateway extends LlmGateway` — backend-backed implementation registered under the existing `LlmGateway` seam. Maps `RouteException` to typed `LlmException`. |
| `lib/gateway/llm/openai_gateway.dart` | **DELETED.** |
| `lib/gateway/llm/llm_gateway.dart` | `LlmException` gained `code`/`statusCode`; added `LlmContextTooLongException`, `LlmProviderUnsupportedException`, `LlmStreamingUnsupportedException`; the `stream()` doc contract was rewritten to forbid the fake-single-chunk pattern. |
| `lib/main.dart` | `String.fromEnvironment('OPENAI_API_KEY')` + `OpenAiGateway.init(...)` block removed. `LingonLlmGateway.init(client: _authModule!.apiClient)` registered in `_bootstrap` Phase 3. |
| `lib/modules/chat/chat_error_mapper.dart` | **NEW.** `ChatErrorException` / `chatCodeToMessage` / `mapChatError`, same shape as `weather_error_mapper.dart`. |
| `lib/modules/chat/chat_module.dart` | `_friendlyError` deleted; `send()` is now catch-**all**, rendering `mapChatError(e).toString()` as an assistant bubble. Stale `.env`/`OPENAI_API_KEY` message (finding L3) replaced. |
| `lib/route/lingon_api_key.dart` | `ApiKeyStatus` is map-backed; `_validProviders` demoted to `_knownProviderHints` (typo guard) with an `allowUnknownProvider` escape hatch. |
| `lib/modules/auth/llm_provider.dart` | **DELETED** — `enum LlmProvider` was referenced nowhere in `lib/` or `test/`. |
| tests | **NEW**: `test/route/lingon_actions_test.dart` (12), `test/gateway/llm/lingon_llm_gateway_test.dart` (14), `test/route/lingon_api_key_test.dart` (9), `test/modules/chat/chat_error_mapping_test.dart` (38). |

### How chat now reaches the backend

`ChatWidget` → `ChatModule.send()` → `gw<LlmGateway>()` → `LingonLlmGateway.complete()`
→ `LingonActionsRoute` → `ApiClient.postEnvelope('/v1/actions/execute')` → `BaseRoute.post`.

Bearer JWT and 401→refresh→retry are inherited from `ApiClient` — not reimplemented.
The request envelope is `{type:"llm.chat_complete", source:"chat", input:{messages:[...]}}`;
the per-type field is **`input`**, pinned by test. `model` / `temperature` /
`max_tokens` / `stream` are deliberately **never sent** — the server's `ai_settings`
owns those defaults, per the contract's parameter-precedence rule. The reply is read
from `data.result.content`. A `result.provider` / `result.model` that differs from the
request (server-side fallback) is accepted as success, and `usage: null` parses without
branching.

### M4 (provider-list triplication) — resolved

All three copies are gone as sources of truth:

1. `enum LlmProvider` — file deleted; it was dead code.
2. `_validProviders` — renamed `_knownProviderHints` and documented as a local typo
   guard for the `PUT/DELETE /v1/apikey/:provider` path segment only, bypassable via
   `allowUnknownProvider: true`. It no longer decides which providers exist.
3. `ApiKeyStatus`'s four fixed `bool` fields — replaced by an unmodifiable
   `Map<String,bool>` built from the response's own keys. `isSet()` reads that map; the
   typed getters survive only as thin conveniences. **`fromJson` no longer drops unknown
   providers** — pinned by a regression test using an invented `acme_llm` provider.

The authoritative catalog is `GET /v1/actions/types` → `LingonActionsRoute.listProviders()`,
returning opaque `{id,label,credential_source,available}` rows with no client-side
filtering and no per-provider branching anywhere in the client (LLM-007).

### Streaming (server returns 501)

`OpenAiGateway.stream()` was `yield await complete(messages)` — one chunk pretending to
stream. It is gone. `LingonLlmGateway.stream()` is `async*` and throws
`LlmStreamingUnsupportedException(code:'NOT_IMPLEMENTED', statusCode:501)` when the
stream is **listened to**, so a caller that renders incrementally fails loudly instead of
silently receiving one fabricated chunk. The `LlmGateway.stream()` doc contract was
rewritten to make the old behaviour explicitly forbidden. A `NOT_IMPLEMENTED` code
arriving from `POST /v1/actions/execute` maps to the same exception.
**CHAT-002 remains at 0%** — no SSE consumption was written, because the backend shipped
no SSE endpoint.

### Error mapping (the rule from TASK-002/011)

`chat_module.dart` was the last unmapped module. It now catches **everything** inside
`runGuarded` and renders `mapChatError(e).toString()`. Mapping keys off `error.code`,
never off `error.message` — the backend message field is attacker-influenceable and can
echo user chat content. A test pins that a sentinel string placed in an exception message
never reaches the mapped output.

All 8 frozen LLM codes are handled plus the envelope/common codes, with a safe default.
`LLM_KEY_MISSING` (403, "register a key"), `LLM_AUTH_FAILED` (502, "stored key was
rejected") and `UNAUTHORIZED` (401, "sign in again") produce three distinct messages — a
502 `LLM_AUTH_FAILED` must not read to the user as a session problem. A regression test
pins that a 502 `LLM_AUTH_FAILED` does **not** trigger `ApiClient`'s 401→refresh→retry
(exactly one request issued; the refresh callback never fires).

`BaseModule.runGuarded` was **not** modified.

### Validation (run by ORCH-FE3)

```
$ flutter analyze
Analyzing letmeknow...
No issues found! (ran in 2.5s)

$ flutter test
00:04 +206: All tests passed!          # baseline 134 + 72 new, 0 failures

$ grep -rn "api.openai.com" lib/
(no output, exit 1)

$ grep -rn "fromEnvironment('OPENAI" lib/
(no output, exit 1)

$ grep -rn "setErrorMessage(e.toString())" lib/ | grep -v ":[0-9]*:///"
lib/core/base/base_module.dart:73:      setErrorMessage(e.toString());

$ SKIP_DEPLOY=1 bash ./compile_release.sh
Compiling lib\main.dart for the Web...                             35.3s
Built build\web
[DEPLOY] SKIP_DEPLOY=1 set; skipping deploy steps (rsync/chown/chmod/symlink/apache reload)
COMPILE_EXIT=0

$ grep -raoE "sk-[A-Za-z0-9_-]{20,}" build/web
(no output, exit 1)

$ grep -ra "api.openai.com" build/web
(no output, exit 1)
```

Build freshness confirmed: `find lib -name '*.dart' -newer build/web/main.dart.js`
returned nothing, so the scanned bundle contains every change listed above.

### What could NOT be verified

There is no running backend and no provider key in this environment, so:

- **No live round-trip was performed. Chat has not been shown to work end-to-end.**
  Transport is verified against a mocked `http.Client` (`MockClient`) only.
- The real server's `error.code` values and exact `data.result` shape were read from
  `lingon/src/route/LingOnActions.ts` and the ICD, not observed on the wire.
- The `GET /v1/actions/types` catalog was never fetched from a live server;
  `listProviders()` is exercised only against fixture JSON.
- BYOK credential resolution (`byok` → `platform` → `LLM_KEY_MISSING`) is entirely
  server-side and untested from here.
- `frontend_prompt_ai_chat_gateway.md` demands "Real Execution Only" against a live
  backend plus a verification report under `verification/frontend/`. That requirement is
  **unmet**; per `prompt_playbook.md` §4, claimable progress stays capped at **25%**
  until backend and frontend integration are jointly verified.

### Deviations from the written spec (declared, not papered over)

1. **`OpenAiGateway` was deleted, not kept as "deprecated".**
   `frontend_prompt_ai_chat_gateway.md` §1 says "Do not delete `OpenAiGateway`; mark it
   clearly as the deprecated direct path." That conflicts with Acceptance Criterion 1 and
   with the mandatory gate `grep -rn "api.openai.com" lib/` returning nothing — a file
   whose entire purpose is the direct provider base URL cannot both remain and satisfy
   the gate. Resolved in favour of the gate. **DevDocs Update Required**: that sentence
   of the frontend prompt is now stale.
2. **§3 (BYOK settings UI) was not built.** It is TASK-010, gated on D-002, and
   explicitly out of scope here. Consequence: `LingonActionsRoute.listProviders()` and
   `ApiKeyStatus.providers` are correct but have no UI caller yet, so the spec's "show a
   backend-only provider rendering in the BYOK UI" M4 demonstration cannot be performed
   until TASK-010 lands. The M4 guarantee is instead pinned at the parsing layer by test.
3. **No client-side system prompt.** `OpenAiConfig.systemPrompt` injected one; the new
   path does not, because the server owns defaults via `ai_settings`. If a product system
   prompt is wanted, it is now a backend concern.

### Residual findings (not fixed here)

- `ChatModule.send()` sends the **entire** `_messages` list, which now includes
  previously rendered Korean *error bubbles*, back to the model as `assistant` turns.
  Pre-existing behaviour (the old `_friendlyError` bubbles did the same), but it pollutes
  model context and deserves its own task.
- `ApiClient._withRetry` sleeps a real 3 s and retries once on HTTP 429.
  `LLM_RATE_LIMITED` is 429, so every rate-limit hit costs a silent 3 s retry inside a
  chat turn. Correct per the Error Policy backoff rule, but it interacts with chat
  latency, and it was deliberately left out of transport tests (it would add 3 s of real
  sleep to the suite).
- `ACTION_TYPE_UNKNOWN` / `ACTION_VALIDATION_FAILED` are mapped, but the backend
  currently accepts only `llm.chat_complete`, so those paths are unreachable from this
  client today.

## Completion Result

**Validated (frontend-side, against a mocked transport).**

| # | Acceptance criterion | Result |
|---|---|---|
| 1 | No provider key path; no `api.openai.com` | **Met** — both greps clean in `lib/` and in the built `build/web` bundle; `openai_gateway.dart` and the `--dart-define` path deleted |
| 2 | Chat goes through `ApiClient` with auth + 401 retry | **Met** — `LingonActionsRoute` uses `postEnvelope`; Authorization header pinned by test |
| 3 | Streaming explicit, not a silent stub | **Met** — `LlmStreamingUnsupportedException`; test asserts no chunk is emitted |
| 4 | Provider list not triplicated; unknown provider not dropped | **Met** — enum deleted, `ApiKeyStatus` map-backed, `acme_llm` regression test |
| 5 | Errors mapped, never raw | **Met** — `chat_error_mapper.dart`; `setErrorMessage(e.toString())` grep returns exactly `base_module.dart:73` |
| 6 | `flutter analyze` clean, `flutter test` green | **Met** — 0 issues; 206 passing, up from the 134 baseline |

**The hole this task existed to close — a provider API key compiled into a publicly
served web bundle — is closed.** What is *not* established is that chat works: no live
backend was reachable, so no end-to-end round-trip, no real error path and no BYOK
round-trip were observed. Those remain for joint backend+frontend integration
verification, which is also what would lift the 25% progress cap and produce
`verification/frontend/<date>-chat-backend-gateway.md`.
