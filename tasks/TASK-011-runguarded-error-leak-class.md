# TASK-011 — Remaining modules leak raw exception text via `runGuarded`
Status: Validated
Priority: P2
Category: Autonomous
Release relevance: Same Error Policy violation class as TASK-002, on non-critical flows.

## Objective
Close the remaining instances of the defect class TASK-002 fixed for Weather, so
no module surfaces `e.toString()` to a user.

## Evidence / Background
- `letmeknow/lib/core/base/base_module.dart:69-73` — `runGuarded` catches
  everything and calls `setErrorMessage(e.toString())`. Any module that does not
  map its errors first therefore renders raw exception text.
- Discovered by ORCH-FE while completing TASK-002 and reported as "an unowned
  defect that no task covers" — correct: TASK-002's scope was deliberately
  limited to the Weather call sites.
- Modules calling `runGuarded`, verified 2026-09-14:

| Module | Mapped? |
|---|---|
| `modules/weather/weather_module.dart` | ✅ TASK-002 (`weather_error_mapper.dart`) |
| `modules/calendar/calendar_module.dart` | ✅ via `google_calendar_data_source.dart:29` |
| `modules/brief/brief_module.dart` | ❌ **unmapped** |
| `core/modules/weather_icon_module.dart` | ❌ **unmapped** |
| `modules/chat/chat_module.dart` | ❌ unmapped — **owned by TASK-009**, not this task |

Classification: **Implementation Correction Required**.

## Authoritative Documents
- `docs/docs/policies/error_policy.md`
- Established pattern: `letmeknow/lib/modules/weather/weather_error_mapper.dart`
  (TASK-002) and `lib/modules/calendar/google_calendar_data_source.dart:17-48`

## Scope
- `modules/brief/brief_module.dart` and `core/modules/weather_icon_module.dart`:
  map failures to user messages before they can reach `setErrorMessage`.
- Reuse existing mappers where the failure genuinely is the same
  (`weather_icon_module` is a weather-domain consumer — prefer
  `weather_error_mapper.dart` over a near-duplicate).
- Tests asserting no raw exception text reaches `errorMessage`.

## Out of Scope
- `chat_module.dart` — TASK-009 owns it; touching it here would collide.
- Changing `runGuarded` itself. This has now been considered twice and
  deliberately rejected both times: it would alter error behaviour for every
  module at once, and a generic fallback inside `runGuarded` would mask which
  modules still lack real mapping. **If a worker proposes changing it, escalate
  to the Supervisor rather than deciding locally** — it is a base-class contract
  change, not a bug fix.
- New user-facing copy beyond what `error_policy.md` and the existing mappers
  already establish.

## Affected Components
`letmeknow/lib/modules/brief/brief_module.dart`,
`letmeknow/lib/core/modules/weather_icon_module.dart`, tests.

## Dependencies
None. Must not run concurrently with TASK-009 (shared error-mapping surface).

## Acceptance Criteria
1. Neither module can put `e.toString()` output into `errorMessage`.
2. `weather_icon_module` reuses the weather mapper rather than duplicating it,
   unless its failure modes genuinely differ — justify in the Execution Log.
3. Tests assert `errorMessage` contains no `Exception`, `RouteException`, or raw
   backend text for each module's failure paths.
4. `runGuarded` is unchanged.
5. `chat_module.dart` is untouched.
6. Message style matches the Weather/Calendar mappers.

## Validation Plan
```
cd letmeknow
flutter analyze          # must be clean
flutter test             # baseline 113 passing; must stay green plus new tests
grep -rn "setErrorMessage(e.toString())" lib/    # only base_module.dart may match
```

## Owner Decisions
None.

## Execution Log / Evidence

Executed 2026-09-14 by ORCH-FE2. Decomposed into two independent Sonnet
workers (one per module); no file was shared between them except an
append-only addition to `weather_error_mapper.dart`. The orchestrator re-ran
all validation itself — worker claims were not accepted as evidence.

### What changed

| File | Change |
|---|---|
| `letmeknow/lib/modules/brief/brief_error_mapper.dart` | **new**, 55 lines — `BriefErrorException` (`toString()` returns the user message, no `Exception:` prefix), `briefCodeToMessage(String? code, int? statusCode)`, `mapBriefError(Object)` |
| `letmeknow/lib/modules/brief/brief_module.dart:5` | added `import 'brief_error_mapper.dart';` |
| `letmeknow/lib/modules/brief/brief_module.dart:117-148` | `generate()` doc comment added; the `runGuarded` closure body wrapped in `try { ... } on BriefErrorException { rethrow; } catch (e) { throw mapBriefError(e); }` |
| `letmeknow/lib/modules/weather/weather_error_mapper.dart:78-91` | **append only** — `_iconUnavailableMessage` const and `mapWeatherIconError(Object)`. No existing declaration or message altered. |
| `letmeknow/lib/core/modules/weather_icon_module.dart:1-5` | added `dart:async` and `../../modules/weather/weather_error_mapper.dart` imports |
| `letmeknow/lib/core/modules/weather_icon_module.dart:12-20` | class doc comment states `errorMessage` is always a mapped Korean message; constructor changed from bare `load();` to `unawaited(load().catchError((Object _) {}));` |
| `letmeknow/lib/core/modules/weather_icon_module.dart:29-39` | `load()` closure body wrapped in `try { ... } on WeatherErrorException { rethrow; } catch (e) { throw mapWeatherIconError(e); }` |
| `letmeknow/test/modules/brief/brief_error_mapping_test.dart` | **new**, 156 lines, 16 tests |
| `letmeknow/test/core/modules/weather_icon_error_mapping_test.dart` | **new**, 73 lines, 5 tests |

Both new test files call `BaseGateway.clearAll()` in `setUp`, so they are
isolated from other test files' gateway registrations
(`lib/core/base/base_gateway.dart`, per Route.md §4).

### Reuse-vs-new-mapper decision for `weather_icon_module` (AC#2)

**Decision: partial reuse — reuse the mapper file and the exception type; add
one icon-specific mapping function; do not reuse the existing mapping
functions.**

`WeatherIconModule` is a weather-domain consumer, so it now imports
`lib/modules/weather/weather_error_mapper.dart` and throws the *same*
`WeatherErrorException` type as `WeatherModule`. No second mapper file was
created and no message table was duplicated. The core→modules import direction
is established precedent — `lib/core/modules/weather_metrics_module.dart:2`
already imports `lib/modules/weather/weather_module.dart`.

Its failure modes genuinely differ from the existing mapping functions, so
reusing those directly would have been wrong, not merely redundant:

| Existing function | Maps | Applies to icon loading? |
|---|---|---|
| `weatherCodeToMessage` / `mapWeatherError` | backend Weather API `RouteException.code` / `statusCode` | **No** — `WeatherIconModule` makes no backend call. It resolves a file from the local Meteocons cache via `MeteoconsGateway`; a `RouteException` can never reach it. |
| `mapWeatherLocationError` | device GPS / location-permission failures | **No** — no location is involved. |

The real icon failure modes are (a) `MeteoconsGateway` not registered —
`BaseModule.requireGw` / `BaseGateway.resolve` throws text containing the
gateway class name and "is not initialized"; and (b) a local file-cache read
failure from `file.readAsBytes()` (`FileSystemException` /
`PathNotFoundException`, carrying a filesystem path). Note that
`MeteoconsGateway.resolveIcon` already swallows its own errors and returns
`null`, so a merely-missing icon is not an error path at all.

Reusing `mapWeatherError` would have rendered
"날씨 정보를 불러오는 중 오류가 발생했습니다" — telling the user the weather
data failed when the weather data is fine and only the decorative icon is
missing. `mapWeatherIconError` therefore returns the distinct, accurate
"날씨 아이콘을 불러올 수 없습니다", in the same style as the existing
Weather/Calendar messages (AC#6). A test asserts the two messages differ, so
the distinction cannot silently regress.

### Secondary defect found and fixed (in scope)

`WeatherIconModule`'s constructor called `load()` fire-and-forget. Because
`runGuarded` **rethrows** after setting `errorMessage`, that unawaited future
always completed with an error nobody handled — an unhandled async error that
would surface the raw exception through `FlutterError.onError` even once
`errorMessage` was correctly mapped, and that fails any test which merely
constructs the module. Fixed at the module level only
(`unawaited(load().catchError((Object _) {}))`). `errorMessage` / `hasError`
still record the failure for the UI, and callers needing the error can
`await load()`. `runGuarded` was **not** touched.

### Out-of-scope items confirmed untouched (AC#4, AC#5)

```
$ git diff --stat -- lib/core/base/base_module.dart
(no output — unchanged)
$ git diff --stat -- lib/modules/chat/chat_module.dart
(no output — unchanged)
```

Neither worker proposed changing `runGuarded`; both independently reported
that the catch-and-rethrow-domain-exception pattern fully contains the leak at
the module boundary. No escalation to the Supervisor was required on that
point.

### Validation output (run by ORCH-FE2, not by workers)

```
$ cd C:/Users/ykyk1/source/repos/LingOn/letmeknow
$ flutter analyze
Analyzing letmeknow...
No issues found! (ran in 1.9s)

$ flutter test
00:03 +134: All tests passed!

$ grep -rn "setErrorMessage(e.toString())" lib/
lib/core/base/base_module.dart:73:      setErrorMessage(e.toString());
lib/modules/brief/brief_error_mapper.dart:6:/// so [BaseModule.runGuarded]'s `setErrorMessage(e.toString())` yields clean UI text.
lib/modules/calendar/google_calendar_data_source.dart:16:/// so [BaseModule.runGuarded]'s `setErrorMessage(e.toString())` yields clean UI text.
lib/modules/weather/weather_error_mapper.dart:6:/// so [BaseModule.runGuarded]'s `setErrorMessage(e.toString())` yields clean UI text.
```

The three non-`base_module.dart` matches are **doc-comment prose, not call
sites** — the sentence each mapper carries explaining why its `toString()`
returns a clean message. That sentence originates in
`google_calendar_data_source.dart:16` and predates this task. Restricted to
real code, exactly one match remains, as required:

```
$ grep -rn "setErrorMessage(e.toString())" lib/ | grep -v ":[0-9]*:///"
lib/core/base/base_module.dart:73:      setErrorMessage(e.toString());
```

**Test count: 134 passing, up from the 113 baseline (+21 new).** No
pre-existing test regressed.

### New test names

`test/modules/brief/brief_error_mapping_test.dart` (16):
- group `briefCodeToMessage maps documented error codes` — `PROVIDER_HTTP_ERROR`,
  `PROVIDER_NETWORK_ERROR`, `BAD_REQUEST`, `UNAUTHORIZED`, `RATE_LIMITED`,
  `INTERNAL`, `TIMEOUT`, `NETWORK_ERROR`, `CLIENT_EXCEPTION`,
  `documented codes each yield a distinct message from one another`
- group `briefCodeToMessage falls back safely` —
  `unknown code with no statusCode yields the generic fallback`,
  `unmapped code with a 502 statusCode yields the 502-specific message`
- group `mapBriefError never leaks raw exception text` —
  `an arbitrary Exception is mapped to a safe message with no raw text`,
  `a RouteException is mapped via its code, not its message text`
- group `BriefModule.generate never leaks raw exception text to errorMessage` —
  `a plain Exception thrown by the generator is mapped to the generic fallback message`,
  `a RouteException with RATE_LIMITED code thrown by the generator maps to the rate-limit message`

`test/core/modules/weather_icon_error_mapping_test.dart` (5):
- group `mapWeatherIconError never leaks raw exception text` —
  `an arbitrary Exception with a file path is mapped to a safe message`,
  `an existing WeatherErrorException passes through unchanged`,
  `icon failure message differs from weather-data failure message`
- group `WeatherIconModule.load never leaks raw exception text to errorMessage` —
  `with no MeteoconsGateway registered, load throws a mapped WeatherErrorException`,
  `constructor fire-and-forget load() does not produce an unhandled async error`

### Routing / doc divergence (Route.md §1, §5)

**DevDocs Update Required** — `Route.md §4` records the frontend-test baseline
as **98 passing** ("Verified baseline 2026-09-14"). The actual pre-task
baseline was **113** (as the Supervisor stated and this task's Validation Plan
records), and it is **134** after this task. `Route.md §4` is stale; the code is
not defective. No Implementation Correction is required. `Route.md §4` should be
updated to 134.

No routing failure otherwise: the WEATHER and DASHBOARD sections, §4, and the
two named reference files were sufficient. The one fact the work needed that
Route.md does not carry — that `lib/core/modules/` → `lib/modules/` imports are
already established (`weather_metrics_module.dart:2`) — was cheap to verify
locally and does not warrant a Route.md entry.

## Completion Result

**Validated.** Both remaining unmapped modules now map every failure to a
user-ready Korean message before it can reach `setErrorMessage`.

- AC#1 — met. Neither `BriefModule.generate` nor `WeatherIconModule.load` can
  put `e.toString()` output into `errorMessage`; each guarded closure converts
  every non-domain throwable into `BriefErrorException` /
  `WeatherErrorException`, whose `toString()` is the user message.
- AC#2 — met. `weather_icon_module` reuses `weather_error_mapper.dart` and
  `WeatherErrorException`; no duplicate mapper file or message table exists.
  The single added function is justified above by genuinely different failure
  modes.
- AC#3 — met. 21 new tests assert `errorMessage` contains no `Exception`,
  `RouteException`, raw backend text, gateway class names, or filesystem paths.
- AC#4 — met. `runGuarded` / `base_module.dart` unchanged.
- AC#5 — met. `chat_module.dart` unchanged; TASK-009 is unaffected.
- AC#6 — met. Shared codes reuse the exact Korean strings already present in
  the Weather/Calendar mappers; new strings follow the same style.

Evidence: `flutter analyze` → **No issues found!**; `flutter test` → **134
passing** (113 baseline + 21 new, no regressions); `grep` → exactly one real
call site, `lib/core/base/base_module.dart:73`.

Changes left uncommitted in the `letmeknow/` working tree, as instructed.
