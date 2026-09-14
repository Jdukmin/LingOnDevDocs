# TASK-010 — BYOK / Settings write paths are dead code
Status: Validated
Priority: P2
Category: Owner Decision Dependent
Release relevance: Becomes P0-for-chat if D-001 resolves to BYOK-only.

## Objective
Decide and then execute: either build the minimal BYOK key-entry UI, or mark the
routes explicitly Not-MVP so they stop re-surfacing as audit findings.

## Evidence / Background
- `letmeknow/lib/route/lingon_api_key.dart` implements
  `GET /apikey/status`, `PUT/DELETE /apikey/:provider` — line 60 is the **sole
  occurrence** of the class in the whole frontend. Nothing constructs it.
- `LingonSettingsRoute` write path (`PUT`) is likewise unreferenced; the SSOT
  records settings as "GET works, PUT is Dead Code".
- Backend side is complete and encrypted: `apiKeyRepository` does
  save/delete/has/use with AES-256-GCM.
- The SSOT records this as an open question ("implement or explicitly mark
  Not-MVP"), not as a defect — so the product owner, not the implementer, chooses.

## Authoritative Documents
- `docs/backend/docs/api/apikey.md`, `docs/backend/docs/api/settings.md`
- `docs/docs/policies/security_policy.md` (key handling, masking, no logging)
- `docs/requirements/domain_icd/settings.md`

## Scope (if D-002 = A)
Minimal settings surface: per-provider key entry, masked display, clear/delete,
and current status — reusing the existing route classes unchanged.

## Out of Scope
- Model/temperature/system-prompt tuning UI.
- Any change to the backend API contract.
- Storing the key anywhere on the client.

## Affected Components
`letmeknow/lib/widget/user/` or a new settings screen, `lib/route/lingon_api_key.dart`
(wiring only), frontend tests.

## Dependencies
- **D-002** (ship the UI at all) — and D-002's recommended answer is itself
  conditional on **D-001**.
- Practically follows TASK-009 so the entered key is actually consumed.

## Acceptance Criteria (if built)
1. A user can add, view status of, and remove a provider key.
2. The key is never rendered in full after entry and never logged.
3. The key is sent only to the backend BYOK endpoint, never to a provider directly.
4. Failures show mapped messages.
5. `flutter analyze` clean; `flutter test` passes with new coverage.

## Acceptance Criteria (if deferred)
1. `docs/backend/docs/api/apikey.md` and the frontend FeatureList state
   explicitly that the write path is intentionally unused at this stage.
2. `status/` stops listing it as an unresolved defect.

## Validation Plan
```
cd letmeknow
flutter analyze
flutter test
```
Plus a manual check that no log line or widget ever contains full key material.

## Owner Decisions
**D-002** — blocking. See `docs/tasks/owner_decisions.md`.

## Execution Log / Evidence

**Executed 2026-09-14 by ORCH-UX.** D-002 resolved to Option A (ship it) and
D-001 to Option A (BYOK primary), so the "if built" branch of this task applies.

### What was built
| File | Role |
|---|---|
| `letmeknow/lib/modules/apikey/api_key_module.dart` | `ApiKeyProviderEntry` (:13) + `ApiKeyModule` (:67) — `load`/`loadIfNeeded`, `saveKey` (:147), `removeKey` (:179), merge logic `_fetchAndMerge` (:216) |
| `letmeknow/lib/modules/apikey/api_key_error_mapper.dart` | `ApiKeyErrorException` + `mapApiKeyError` — Korean messages, never echoes backend `error.message` |
| `letmeknow/lib/widget/user/api_key_settings_dialog.dart` | `ApiKeySettingsDialog` + `showApiKeySettingsDialog(context, {module}) -> Future<bool>` |
| `letmeknow/lib/widget/sidebar_widget.dart:1014` | `_buildLlmApiAccountRow` — the previously dead static `'LLM API'` stub is now live; opens the dialog at :1085, auth-gated `loadIfNeeded()` at :67/:101 |
| `letmeknow/lib/screen/aod_display.dart:73,107,227,284` | owns/disposes the `ApiKeyModule` and passes it to the sidebar |

### Entry-point choice
`showDialog` from the sidebar's existing 계정 section, not a `MaterialPageRoute`
push. Rationale: every other settings-detail surface already opens this way
(`sidebar_widget.dart:406` -> `UserInfoDialog`, `city_selection_dialog.dart`);
the AOD dashboard is an always-on surface that should not be blanked by a
full-screen push; and a dialog returns a result, which TASK-014 needs when it
opens the same surface from a chat failure notice.

### Provider list is backend-driven (no re-hardcoding)
`_fetchAndMerge` (`api_key_module.dart:216`) takes the BYOK allow-list from
`GET /v1/apikey/status` (`ApiKeyStatus.asMap`) and the usable-provider catalog
from `GET /v1/actions/types` (`LingonActionsRoute.listProviders()`). Listed set =
catalog ids UNION any already-configured status id (so a stored key is always
removable). `supported` = "id is in the catalog". Catalog fetch failure or an
absent actions route falls back to every status key with `supported: true`.
Provider ids are opaque, so `putKey`/`deleteKey` are called with
`allowUnknownProvider: true`. Gate: `grep -rniE "'(openai|anthropic|gemini|openrouter)'" lib/modules/apikey lib/widget/user/api_key_settings_dialog.dart`
returns empty — `enum LlmProvider` was not reintroduced.

### Implementation Correction Required (found and fixed in-flight)
The first implementation pass disabled a provider row whenever the backend's
`LlmProviderInfo.available` was false. Reading `lingon/src/gateway/llm/LlmGatewayService.ts:317-345`
(read-only) showed `available` is computed as `hasByok || platformKeyConfigured` —
it means *"a credential is already on file"*, **not** *"usable"*. The effect was
inverted and self-defeating: for a brand-new user with no keys every `등록`
button rendered disabled, while `anthropic`/`openrouter` (absent from the adapter
registry, so they fell through to a `true` default) rendered enabled even though
a key there can never work (`PROVIDER_REGISTRY` holds only `openai`/`gemini`;
the others return `LLM_PROVIDER_UNSUPPORTED`). Corrected: the backend
`available` flag is no longer surfaced at all, `supported` is derived from
catalog membership, and `disabled = busy` only. Pinned by
`test/widget/api_key_settings_dialog_test.dart` ("등록 stays enabled for an
unconfigured provider").

### Security properties verified
- Key material is never stored on any field: `saveKey` trims into a local and
  passes it straight to `putKey` (`api_key_module.dart:147-172`).
- The key is never rendered back — the backend returns only booleans; the entry
  field is `obscureText: true` and its controller is cleared after every save
  attempt. Test asserts a sentinel key appears in no `Text` widget post-save.
- `grep -rn "debugPrint\|print(" lib/modules/apikey lib/widget/user/api_key_settings_dialog.dart` -> empty.
- Errors never echo backend `error.message` (sentinel-leak test).
- No client-side provider call: `grep -rn "api.openai.com\|fromEnvironment('OPENAI" lib/` -> empty.

### Validation (run by ORCH-UX, not taken from worker claims)
```
flutter analyze   -> No issues found!
flutter test      -> +283: All tests passed!   (206 baseline + 77 added across TASK-010/013/014)
                     this task's share: api_key_module_test +20, api_key_settings_dialog_test +7
grep -rn "setErrorMessage(e.toString())" lib/ | grep -v ":[0-9]*:///"
                  -> lib/core/base/base_module.dart:73   (exactly 1)
grep -rn "api.openai.com\|fromEnvironment('OPENAI" lib/  -> empty
SKIP_DEPLOY=1 bash ./compile_release.sh                  -> exit 0
grep -raoE "sk-[A-Za-z0-9_-]{20,}" build/web             -> empty
```

### Not verified
No live backend and no real provider key were available. Every assertion is
against a mocked `http.Client`. The dialog has **not** been exercised against a
real `PUT /v1/apikey/:provider`, so round-trip encryption/persistence is unproven
from the frontend side. Chat is not proven working end-to-end.

## Completion Result

Built. A signed-in user can open 설정 -> 계정 -> LLM API, see per-provider
등록됨/미등록 status sourced from the backend, add or replace a key, remove a
key, and read mapped Korean success/failure text. All five "if built"
acceptance criteria are met. The route class `lingon_api_key.dart` is no longer
dead code.
