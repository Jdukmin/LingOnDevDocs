# TASK-002 — Weather exposes raw exception text to users
Status: Validated
Priority: P0
Category: Autonomous
Release relevance: Blocks closed alpha. Named the single P0 code defect by the SSOT.

## Objective
Make weather failures show a policy-compliant user message instead of a raw Dart
exception string.

## Evidence / Background
- `letmeknow/lib/core/base/base_module.dart:69-73` — `runGuarded` catches any
  error and calls `setErrorMessage(e.toString())`. That raw text is what the
  widget renders.
- `letmeknow/lib/modules/weather/weather_module.dart` — both `refresh()` and
  `loadByCoordinates()` wrap their fetches in `runGuarded` with **no**
  `error.code` → message mapping. Verified: no `catch`, `setError`, or
  `_codeToMessage` anywhere in the file.
- The canonical pattern already exists for Calendar:
  `letmeknow/lib/modules/calendar/google_calendar_data_source.dart:29`
  `String _codeToMessage(String? code, int? statusCode)`, thrown as a
  `CalendarErrorException` at lines 76 and 87.
- `docs/docs/policies/error_policy.md` forbids surfacing raw internal errors.

Classification: **Implementation Correction Required**.

## Authoritative Documents
- `docs/docs/policies/error_policy.md` — user-facing message rule + code table
- `docs/backend/docs/api/weather.md` — the `error.code` values the backend emits
- `docs/requirements/domain_icd/weather.md`

## Scope
- Add a weather `error.code` → user message mapper following the Calendar shape.
- Apply it on both `WeatherModule` fetch paths so `errorMessage` is always a
  human message, never `e.toString()`.
- Cover the non-API failure modes the weather path actually has — location
  permission denied / location unavailable — which Calendar has no equivalent of.
- Add tests asserting no raw exception text reaches `errorMessage`.

## Out of Scope
- Changing `BaseModule.runGuarded` globally (would alter every module's error
  behaviour — out of proportion to this defect and not requested by the SSOT).
- Backend weather changes.
- `docs/backend/docs/api/weather.md` missing its `error.code` table — a P3
  documentation gap tracked in TASK-007, not fixed here.

## Affected Components
`letmeknow/lib/modules/weather/weather_module.dart`, its error-mapping helper,
`letmeknow/test/` additions. Reference only: `google_calendar_data_source.dart`.

## Dependencies
None.

## Acceptance Criteria
1. Every failure path of `refresh()` and `loadByCoordinates()` produces a mapped
   message; `e.toString()` can no longer reach `errorMessage`.
2. Codes documented in `weather.md` each map to a distinct user message.
3. An unknown/unmapped code yields a safe generic fallback, not raw text.
4. Location-permission failure yields its own message.
5. New tests cover mapped, unmapped, and location-failure cases.
6. Message style and language match the Calendar mapper.

## Validation Plan
```
cd letmeknow
flutter analyze
flutter test
```
`flutter analyze` must stay clean and all 98 existing tests must still pass,
plus the new ones. Paste the new test names and the pass count into the
Execution Log.

## Owner Decisions
None.

## Execution Log / Evidence

**Executed 2026-09-14 by ORCH-FE.** Implementation by a Sonnet worker; `flutter
analyze` and `flutter test` were re-run independently by the orchestrator —
worker claims were not accepted as evidence.

### What changed

**NEW `letmeknow/lib/modules/weather/weather_error_mapper.dart` (77 lines)** —
copies the Calendar shape from `google_calendar_data_source.dart:17-48`:

| Line(s) | Symbol |
|---|---|
| `weather_error_mapper.dart:7-14` | `class WeatherErrorException implements Exception` with `String toString() => message;` — no `Exception:` prefix, so `runGuarded`'s `setErrorMessage(e.toString())` yields clean UI text. Mirrors `CalendarErrorException`. |
| `weather_error_mapper.dart:18` | `_locationPermissionMessage` = '위치 권한이 필요합니다. 설정에서 위치 권한을 허용해주세요' |
| `weather_error_mapper.dart:22` | `_locationUnavailableMessage` = '위치 정보를 가져올 수 없습니다' |
| `weather_error_mapper.dart:29-51` | `String weatherCodeToMessage(String? code, int? statusCode)` — public (unit-testable) counterpart of Calendar's private `_codeToMessage`. Distinct messages for `PROVIDER_HTTP_ERROR`/`PROVIDER_NETWORK_ERROR`, `BAD_REQUEST`, `UNAUTHORIZED`, `RATE_LIMITED`, `INTERNAL`, `TIMEOUT`, `NETWORK_ERROR`/`CLIENT_EXCEPTION`; `default` -> the 502-specific message or the generic fallback '날씨 정보를 불러오는 중 오류가 발생했습니다'. |
| `weather_error_mapper.dart:57-63` | `mapWeatherError(Object error)` — fetch/parse phase. Passes a `WeatherErrorException` through, maps `RouteException` by `code`/`statusCode`, everything else -> generic fallback. Never copies any part of the original text. |
| `weather_error_mapper.dart:70-77` | `mapWeatherLocationError(Object error)` — location phase. Case-insensitive `'permission'` match -> permission message; anything else (service disabled, position failure, unregistered gateway) -> location-unavailable. Never echoes the original text. |

**MODIFIED `letmeknow/lib/modules/weather/weather_module.dart`**:

| Line(s) | Change |
|---|---|
| `weather_module.dart:6` | `import 'weather_error_mapper.dart';` |
| `weather_module.dart:71-76` | `refresh()` doc comment now states `errorMessage` is always a mapped, policy-compliant message. |
| `weather_module.dart:84-90` | `refresh()` location phase: `_geo.captureLocation()` (and the `_geo` getter's `requireGw` throw) wrapped in `try { } on WeatherErrorException { rethrow; } catch (e) { throw mapWeatherLocationError(e); }`. |
| `weather_module.dart:93-108` | `refresh()` fetch+parse phase wrapped in `try { } on WeatherErrorException { rethrow; } catch (e) { throw mapWeatherError(e); }`. |
| `weather_module.dart:122-126` | `loadByCoordinates()` doc comment updated the same way. |
| `weather_module.dart:141-156` | `loadByCoordinates()` fetch+parse phase wrapped identically. It takes explicit coordinates, so it has no location phase. |

The `_refreshing` concurrency guard, `notifyListeners()`, and the three model
classes (`WeatherCurrentModel`, `WeatherForecastModel`, `WeatherForecastItemModel`)
are untouched. `BaseModule.runGuarded` was **not** modified (Out of Scope honoured).

**NEW `letmeknow/test/modules/weather/weather_error_mapping_test.dart` (157 lines,
15 tests)** — uses `MockClient` from `package:http/testing.dart`, which ships with
the existing `http` dependency; no pubspec change.

### New test names (all passing)

```
weatherCodeToMessage maps each documented error.code to a distinct message
  > PROVIDER_HTTP_ERROR
  > PROVIDER_NETWORK_ERROR
  > BAD_REQUEST
  > UNAUTHORIZED
  > RATE_LIMITED
  > INTERNAL
  > TIMEOUT
  > NETWORK_ERROR
  > documented codes each yield a distinct message from one another
weatherCodeToMessage falls back safely for unmapped codes
  > unknown code with no statusCode yields the generic fallback
  > unmapped code with a 502 statusCode yields the 502-specific message
mapWeatherError never leaks raw exception text
  > an arbitrary Exception is mapped to a safe message with no raw text
  > a RouteException is mapped via its code, not its message text
WeatherModule.loadByCoordinates maps HTTP failures end-to-end
  > a 502 PROVIDER_HTTP_ERROR response yields the mapped Korean message on errorMessage
WeatherModule.refresh maps location-phase failures end-to-end
  > with no GeoLocatorGateway registered, refresh throws and sets the location error message
```

### Literal validation output (orchestrator-run)

```
$ cd letmeknow && flutter analyze
Analyzing letmeknow...
No issues found! (ran in 2.3s)

$ flutter test
00:02 +112: .../test/widget/chat_widget_test.dart: ChatWidget never overflows at its Minimum Safe Size WidgetVariant.horizontal at 200x180 renders with no overflow
00:02 +113: All tests passed!
```

**113 passing = 98 baseline + 15 new. Zero failures, zero regressions.**

### Doc/code divergence found

1. **Confirmed, not fixed here (TASK-007)** — `docs/backend/docs/api/weather.md`
   documents all four weather endpoints but contains **no `error.code` table**;
   only `BAD_REQUEST` appears, in prose under "Validation". The mapped code set
   was therefore derived from `docs/docs/policies/error_policy.md` (the authority
   for the code table) plus the client-side `RouteException` codes actually
   emitted by `lib/core/utils/error_handler.dart:27-67` and
   `lib/core/base/base_route.dart:73-79` (`TIMEOUT`, `CLIENT_EXCEPTION`,
   `NETWORK_ERROR`, `HTTP_EXCEPTION`, `FORMAT_ERROR`, `INVALID_JSON_OBJECT`,
   `HTTP_<status>`, `UNKNOWN_ERROR`). Those client-side codes are documented
   nowhere in the SSOT; the unmapped ones are covered by the generic fallback.
   Classification: **DevDocs Update Required** (already tracked as TASK-007).
2. **Implementation Correction Required — discharged.** The defect named by the
   SSOT (`base_module.dart:69-73` leaking `e.toString()` on the weather path) is
   fixed at the call sites, per the Out of Scope rule that `runGuarded` itself
   must not change globally. Note that every *other* module using `runGuarded`
   without a mapper still leaks raw text; that is a latent instance of the same
   class of defect and is **not** covered by any existing task.

### Route.md adherence

The TASK-002 route was sufficient. One extra file was read by the worker outside
the routed list: `letmeknow/lib/core/base/base_gateway.dart`, needed to confirm
`BaseGateway.clearAll()` / `isRegistered<T>()` exist so the "no GeoLocatorGateway
registered" test could isolate itself from other test files' gateway
registrations. Reference-only, unmodified. `/Route.md` §CALENDAR correctly named
`google_calendar_data_source.dart:29` as the canonical pattern — that pointer was
accurate and sufficient.

## Completion Result

**Validated.** All six acceptance criteria met:

1. Both `refresh()` and `loadByCoordinates()` map every failure path; the only
   object that can now reach `setErrorMessage` is a `WeatherErrorException` whose
   `toString()` is the user message. Verified end-to-end by the last two tests,
   which assert `errorMessage` contains none of 'Exception', 'RouteException',
   'GeoLocatorGateway', or the raw backend `error.message` text ('openweather').
2. Each code documented in `error_policy.md` maps to a distinct message; a
   dedicated test asserts pairwise distinctness.
3. Unknown code -> '날씨 정보를 불러오는 중 오류가 발생했습니다'; unknown code with
   HTTP 502 -> '외부 서비스 연결에 실패했습니다'.
4. Location-permission failure yields '위치 권한이 필요합니다. 설정에서 위치 권한을
   허용해주세요', distinct from the location-unavailable message.
5. 15 new tests cover mapped, unmapped, raw-text-leak, end-to-end HTTP, and
   location-failure cases.
6. Korean, no trailing period, no `Exception:` prefix — same register as
   `google_calendar_data_source.dart:29-48`; three strings are reused verbatim
   from the Calendar mapper where the meaning is identical.

`flutter analyze` clean, `flutter test` 113 passing.
