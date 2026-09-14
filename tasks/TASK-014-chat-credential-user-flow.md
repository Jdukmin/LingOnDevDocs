# TASK-014 — Chat has no usable path for a user without a credential
Status: Validated
Priority: P1
Category: Autonomous (D-001/D-002 decided 2026-09-14)
Release relevance: Blocks Closed Alpha — acceptance path B is currently a dead end.

## Objective
Make the missing-credential case a self-service flow: the user understands what is
required, reaches the BYOK screen, registers a key, and returns to a working Chat —
without developer knowledge.

## Evidence / Background
After TASK-009, chat failures surface as mapped Korean text in an assistant bubble.
For the single most likely first-run failure — **no LLM credential** — that is a
dead end: `LLM_KEY_MISSING` (403) renders as a sentence with no action attached.
Nothing in the UI navigates to key registration, and until TASK-010 lands there is
no screen to navigate to.

Verified in code:
- `chat_module.dart:150` — the only failure handling is
  `_messages.add(ChatMessage.assistant(mapChatError(e).toString()))`.
- `chat_widget.dart:124` — the empty state keys off `messages.isEmpty && !module.isBusy`
  and knows nothing about credential state.
- `lib/route/lingon_api_key.dart` exposes `getStatus()` returning a map-backed
  `ApiKeyStatus` — the credential state is already queryable; nothing queries it.
- Navigation precedent exists: `MaterialPageRoute` push (`aod_display.dart:199`,
  `main.dart:126`) and `showDialog` (`sidebar_widget.dart:406`).

Owner ruling 2026-09-14: BYOK is the primary LLM path for Closed Alpha, so this
flow is not an edge case — it is the **default first-run experience**.

## Authoritative Documents
- `docs/requirements/chat_requirements.md`
- `docs/backend/docs/api/apikey.md`
- `docs/docs/policies/error_policy.md`
- `docs/requirements/domain_icd/llm.md`

## Scope
- Chat surfaces a distinct **credential-required** state, visually separate from a
  generic error, carrying an action that opens the BYOK screen (TASK-010).
- After a key is registered, returning to Chat works with no app restart —
  re-check credential state on return rather than caching a stale "missing" verdict.
- Retry: a failed turn can be retried without retyping the message.
- Distinct, human-readable states for: loading, missing credential, provider error,
  rate limit (429), backend unreachable, and auth/session failure.
- Reuse the existing design system — `AppCard`, `AppTypography`, `AppSpacing`,
  theme tokens. No second design system.

## Out of Scope
- The BYOK screen itself (TASK-010).
- Excluding error bubbles from outbound LLM context (TASK-013).
- Streaming (server returns 501 — do not fabricate).
- Any backend change.
- Provider *selection* UI unless the ICD already specifies it — do not invent one.

## Affected Components
`letmeknow/lib/modules/chat/chat_module.dart`, `lib/widget/chat_widget.dart`,
possibly `lib/route/lingon_actions.dart` (read-only), tests.

## Dependencies
TASK-010 must land first — there is no destination to navigate to until it does.

## Acceptance Criteria
1. With no credential configured, Chat states that plainly and offers an action
   that opens the BYOK screen. It does **not** look like a generic failure.
2. After registering a key and returning, sending a message works with no restart.
3. A failed message can be retried without retyping.
4. Rate limit, provider error, backend-unreachable and auth failure each read
   differently and suggest what to do.
5. No raw exception text anywhere (`grep` gate from TASK-011 still holds).
6. Credential state is read from the backend (`getStatus()`), never inferred from a
   hardcoded provider list.
7. `flutter analyze` clean; `flutter test` ≥ 206 plus new tests.

## Validation Plan
```
cd letmeknow
flutter analyze
flutter test
grep -rn "setErrorMessage(e.toString())" lib/ | grep -v ":[0-9]*:///"   # exactly 1
```
Widget tests drive the states with a mocked `http.Client`. **No live backend** —
state explicitly that end-to-end is unproven.

## Owner Decisions
D-001 and D-002 both decided 2026-09-14. None outstanding.

## Execution Log / Evidence

**Executed 2026-09-14 by ORCH-UX**, after TASK-010 landed the destination screen.

### What was built
| File | Change |
|---|---|
| `letmeknow/lib/modules/chat/chat_error_mapper.dart:6` | `enum ChatFailureKind { credentialRequired, credentialRejected, rateLimited, providerError, unreachable, sessionExpired, generic }`; `ChatErrorException` gains `kind` (named, defaults to `generic`, so every existing call site still compiles); `chatCodeToKind` (:179); `mapChatError` now sets `.kind` (:250) |
| `letmeknow/lib/modules/chat/chat_module.dart:73` | `ChatMessage.failure(content, kind)` + `failureKind` field (:103) / `isFailureNotice` (:111) |
| `letmeknow/lib/modules/chat/chat_module.dart:204` | `retryLast()` — resend without retyping |
| `letmeknow/lib/modules/chat/chat_module.dart:245` | `refreshCredentialState()` — reads `GET /v1/apikey/status` |
| `letmeknow/lib/modules/chat/chat_module.dart:273` | `handleCredentialSettingsClosed({required changed})` |
| `letmeknow/lib/widget/chat_widget.dart:373` | `_FailureNotice` — per-kind icon/title/actions |
| `letmeknow/lib/widget/chat_widget.dart:244` | credential-aware empty state |
| `letmeknow/lib/screen/aod_display.dart:104,265` | `ChatModule(apiKeyRoute: ...)` and `onOpenCredentialSettings: () => showApiKeySettingsDialog(context, module: _apiKey)` |

### The credential-required state is distinct, not a generic error
`chat_module.dart:150`'s old `ChatMessage.assistant(mapChatError(e).toString())`
is replaced by `ChatMessage.failure(mapped.toString(), mapped.kind)`. The widget
branches on `isFailureNotice` and renders `_FailureNotice` instead of
`_MessageBubble`. The mapped Korean sentence is still shown verbatim
(`chat_widget.dart:489`) — only the surrounding affordance changes.

| kind | backend trigger | icon | title | actions |
|---|---|---|---|---|
| `credentialRequired` | `LLM_KEY_MISSING` 403 | `key_off` / accent | API 키가 필요합니다 | **API 키 등록** |
| `credentialRejected` | `LLM_AUTH_FAILED` 502 | `key_off` / warning | API 키가 거부되었습니다 | API 키 다시 등록, 재시도 |
| `rateLimited` | `LLM_RATE_LIMITED` 429 | `hourglass` / warning | 요청이 많습니다 | 재시도 |
| `providerError` | `LLM_PROVIDER_ERROR`, `LLM_TIMEOUT` | `cloud_off` / warning | AI 서비스 오류 | 재시도 |
| `unreachable` | `NETWORK_ERROR` / `CLIENT_EXCEPTION` / `TIMEOUT` | `wifi_off` / error | 연결할 수 없습니다 | 재시도 |
| `sessionExpired` | `UNAUTHORIZED` 401 | `lock` / error | 로그인이 필요합니다 | (none) |
| `generic` | anything else | `error_outline` | (none) | 재시도 |

Actions render only on the last entry and only while `!isBusy`, so older notices
do not accumulate live buttons. This follows the pattern
`docs/docs/policies/error_policy.md` line 49 already sanctions for a
not-connected resource: *"재시도 대신 '연결하기' CTA로 유도"*.

### No stale "missing" verdict is cached
`handleCredentialSettingsClosed` (`chat_module.dart:273`) **always** re-probes
`GET /v1/apikey/status` via `refreshCredentialState()` before deciding. If a key
now exists (or the dialog reported a change), the credential notice is dropped
and the retained user turn is resent — no app restart, no new `ChatModule`.
`credentialKnownPresent` is documented as a **display hint only** and never gates
`send()`; a failed probe leaves it untouched, returns `false`, and does not set
`errorMessage`. Pinned by `chat_credential_flow_test.dart` items 5, 6, 9.

### Acceptance criteria
1. Distinct credential-required state with an action opening the BYOK dialog — met.
2. Works on return with no restart — met (test 5 proves it without reconstructing the module).
3. Retry without retyping — met (`retryLast()`, test 4: no message text is re-supplied by the caller).
4. Rate limit / provider error / unreachable / auth failure read differently — met (table above; tests assert the six kinds and their six Korean messages are mutually distinct).
5. No raw exception text — `grep` gate still exactly 1 line.
6. Credential state read from `getStatus()`, never a hardcoded provider list — met.
7. `flutter analyze` clean, `flutter test` 283 — met.

### Validation (run by ORCH-UX)
```
flutter analyze  -> No issues found!
flutter test     -> +283: All tests passed!   (this task's share: chat_credential_flow_test +9,
                    plus additions to chat_error_mapping_test and chat_widget_test)
grep -rn "setErrorMessage(e.toString())" lib/ | grep -v ":[0-9]*:///"
                 -> lib/core/base/base_module.dart:73   (exactly 1)
grep -rn "api.openai.com|fromEnvironment('OPENAI" lib/  -> empty
SKIP_DEPLOY=1 bash ./compile_release.sh                 -> exit 0
grep -raoE "sk-[A-Za-z0-9_-]{20,}" build/web            -> empty
```

### Not verified
No live backend and no provider credential exist. Every state is driven by a
mocked `http.Client`; the flow has **not** been exercised against a real 403 from
`POST /v1/actions/execute` nor a real key registration. Chat remains unproven
end-to-end (INT-V still outstanding). Streaming was not touched — the server
returns 501.

## Completion Result

The missing-credential case is now a self-service flow rather than a dead end.
A keyless user sends a message, receives a distinct "API 키가 필요합니다" card
with an **API 키 등록** action, registers a key in the TASK-010 dialog, and on
return the notice clears and the original message is resent automatically — no
restart, no retyping. Five other failure classes read distinctly and suggest
what to do.
