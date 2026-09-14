# TASK-013 — Chat replays rendered error bubbles back to the model
Status: Validated
Priority: P3
Category: Autonomous
Release relevance: Non-blocking, but degrades every chat turn after the first failure.

## Objective
Stop sending previously-rendered error messages to the model as if they were
assistant turns.

## Evidence / Background
Found by ORCH-FE3 while completing TASK-009, and reported rather than quietly
fixed (correctly — it was outside that task's scope).

`ChatModule.send()` posts the whole message list to
`POST /v1/actions/execute`. After TASK-009, a failed turn renders the mapped
error as an **assistant bubble** in that same list. So once any request fails,
every subsequent turn ships the Korean error text to the model as prior
assistant output.

Consequences: wasted tokens, degraded answers (the model treats an apology
string as its own prior reasoning), and on a provider that echoes context, the
error text can round-trip. The defect predates TASK-009 in shape — `_friendlyError`
also rendered into history — but TASK-009's catch-all mapping makes it reliable
rather than occasional.

Classification: **Implementation Correction Required**.

## Authoritative Documents
- `docs/requirements/chat_requirements.md`
- `docs/requirements/domain_icd/llm.md` (the Gateway receives *already-assembled*
  messages — what goes into that list is the caller's responsibility)
- `docs/docs/policies/error_policy.md`

## Scope
- Distinguish *displayed* chat entries from *model-visible* history, so an error
  bubble renders to the user but is not replayed to the provider.
- Preserve current UI behaviour — the user must still see what failed.
- Tests pinning that a failed turn contributes nothing to the next request body.

## Out of Scope
- Conversation persistence or server-side session storage (no such contract exists).
- Trimming/windowing long histories — a real concern, but a separate decision:
  `LLM_CONTEXT_TOO_LONG` is already a defined code.
- `BaseModule.runGuarded`.
- Any backend change.

## Affected Components
`letmeknow/lib/modules/chat/chat_module.dart`, its model/state for chat entries,
`letmeknow/test/modules/chat/`.

## Dependencies
None. TASK-009 has landed.

## Acceptance Criteria
1. An error bubble is visible in the UI but absent from the next request's
   `input.messages`.
2. A test drives: successful turn → failed turn → successful turn, and asserts
   the third request body contains only genuine user/assistant content.
3. No change to the rendered conversation as the user sees it.
4. `flutter analyze` clean; `flutter test` ≥ 206 passing plus new tests.

## Validation Plan
```
cd letmeknow
flutter analyze
flutter test
```
Transport assertions use a mocked `http.Client`, as in
`test/gateway/llm/lingon_llm_gateway_test.dart`.

## Owner Decisions
None.

## Execution Log / Evidence

**Executed 2026-09-14 by ORCH-UX**, after TASK-014 introduced the display-only
failure-notice entry that makes the distinction expressible.

### The separation
`letmeknow/lib/modules/chat/chat_module.dart`:
- `messages` (:149) is the **displayed** list — unchanged, every entry in its
  original order, failure notices included. The user still sees exactly what
  failed, exactly as before.
- `modelVisibleMessages` (:167) is new and is the **only** thing sent to the
  model:
  ```dart
  List<ChatMessage> get modelVisibleMessages =>
      List.unmodifiable(_messages.where((m) => !m.isFailureNotice));
  ```
- The call site (:323-325) now passes `modelVisibleMessages` instead of
  `List.unmodifiable(_messages)`.

That is the entire production change — three lines plus a getter.

### Why not `ChatRole.system`
`ChatRole.system` exists and was considered, per this task's brief. It was
rejected and the reason is recorded in the getter's doc comment: `system` is a
legal wire role, so a `system`-roled error entry would still be serialized into
`input.messages` by `LingonLlmGateway.complete`
(`lingon_llm_gateway.dart:45-48`) and would still reach the model — relabelling
the problem rather than removing it. It would also flip the `isAssistant` getter
that the widget layer and existing tests depend on. An explicit display-only
discriminator (`ChatMessage.failureKind` / `isFailureNotice`, added by TASK-014)
drops the entry from the payload outright while leaving `role: ChatRole.assistant`
intact for rendering.

### The regression test the Owner asked for
`letmeknow/test/modules/chat/chat_history_isolation_test.dart` — 7 tests, driving
a real `ChatModule` through a real `LingonLlmGateway` over a `MockClient`,
capturing every outbound request body.

Test 1 is the requested sequence: **successful turn -> failed turn -> successful
turn**, asserting the third request's `input.messages` carries only genuine
user/assistant content and none of the rendered failure text (asserted against
the actual Korean string taken from `module.messages`, not a hardcoded copy, so
the test cannot drift from the mapper).

Observed real role/content sequence for the third request:
`[user(t1), assistant(r1), user(t2), user(t3)]` — 4 entries. Note `user(t2)` is
**correctly present**: the failed turn's own *user* message is genuine content
and must still be sent; only the failure notice is dropped. My spec's
parenthetical had guessed a 3-entry sequence; the worker traced the real
semantics and asserted those instead of bending the code to match the guess.

Other coverage: displayed list provably unchanged (test 2); a failed turn
contributes nothing but its user turn (test 3); **every** `ChatFailureKind` is
excluded, not just one (test 4); `modelVisibleMessages` is unmodifiable (test 5);
the gateway-unavailable notice is excluded too (test 6); several consecutive
failures then a success leak none of their sentences (test 7). Plus one addition
to `chat_credential_flow_test.dart` pinning that the credential-recovery resend
replays no error text.

### Acceptance criteria
1. Error bubble visible in UI, absent from the next request's `input.messages` — met (tests 1, 2).
2. success -> fail -> success regression test asserting the third body — met (test 1).
3. No change to the rendered conversation — met (test 2 asserts the exact displayed sequence).
4. `flutter analyze` clean; `flutter test` >= 206 plus new — met (283).

### Validation (run by ORCH-UX)
```
flutter analyze  -> No issues found!
flutter test     -> +283: All tests passed!   (this task's share: chat_history_isolation_test +7)
grep -rn "setErrorMessage(e.toString())" lib/ | grep -v ":[0-9]*:///"
                 -> lib/core/base/base_module.dart:73   (exactly 1)
SKIP_DEPLOY=1 bash ./compile_release.sh                 -> exit 0
grep -raoE "sk-[A-Za-z0-9_-]{20,}" build/web            -> empty
```

### Not verified
Transport assertions are against a mocked `http.Client`. No live backend and no
provider credential exist, so the token/quality benefit is proven only at the
request-body level, not observed against a real provider. Out of scope and
untouched, as specified: conversation persistence, history trimming/windowing
(`LLM_CONTEXT_TOO_LONG`), and `BaseModule.runGuarded`.

## Completion Result

Fixed. Displayed entries and model-visible history are now separate. A rendered
error is shown to the user but never replayed to the provider as its own prior
assistant output, so conversations no longer degrade after the first failure.
