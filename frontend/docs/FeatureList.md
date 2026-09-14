# Feature List

> 구현 상태를 단일 출처로 관리합니다. 기능 추가·변경 시 코드와 함께 이 파일을 업데이트합니다.

---

## ✅ 구현 완료

### 인증

> **정정 2026-07-29(DevDocs V_0.1.0 반영)**: 아래 파일 경로는
> `lib/modules/auth/*`(V0.0.10부터, 구 경로 `auth/{data,domain,presentation}/*`는
> 폐기됨)로 갱신했다 — 근거: `FRONTEND_VERSION_HISTORY_REPORT.md`(Frontend
> 저장소 루트) V0.0.10, `FRONTEND_SCHEMA_VERIFICATION_REPORT.md` Finding D-3.

| 기능 | 파일 | 비고 |
|------|------|------|
| Google Sign-In (ID Token, native) | `modules/auth/auth_module.dart` | idToken → `POST /v1/auth/google` → JWT 교환 |
| Google Sign-In (Redirect, Web) | `modules/auth/auth_module.dart`, `screen/oauth_callback_screen.dart` | `GET /v1/auth/google` → 동의 화면 → `WEB_CALLBACK_URL#token=...` (fragment) |
| 토큰 영속성 | `modules/auth/auth_repository.dart` | `flutter_secure_storage` |
| 세션 복원 | `AuthModule.restoreSession()` | 앱 시작 시 자동 실행, 필요 시 refresh |
| 로그아웃 | `AuthModule.signOut()` | `POST /v1/auth/logout` (서버 revoke) + Google + 로컬 토큰 삭제 |
| Refresh Token 갱신 | `AuthRepository.refreshToken()` | `POST /v1/auth/refresh` — rotation (tokenVersion+1) |
| **401 자동 재시도 인터셉터** | `core/network/api_client.dart` (`ApiClient._withRetry`) | 완료됨(V0.0.11) — 아래 "🔧 스텁"/"📅 예정 기능"의 동일 항목은 오기이므로 제거함 |
| 현재 사용자 프로필 / 편집 | `modules/auth/user_model.dart`, `widget/user/user_info_dialog.dart`, `widget/user/city_selection_dialog.dart` | `GET /v1/auth/me` — city 포함, provider_id 제외. 닉네임/도시 편집 UI 포함(V0.0.11) |
| 로그인 후 프리로드 | `AuthRepository._preloadUserData()` | /users/me, /settings/ai, /settings/ui, /apikey/status 병렬 |

### AOD 대시보드

> **각주 2026-07-31(Design System v2 반영 확인 — Working Tree 기준, 미커밋)**:
> 대시보드 7개 위젯(Clock/Status/WeatherNow/WeatherForecast/Calendar/Chat/
> BriefCard) 전부가 `core/design/app_card.dart`(`SmallCard`/`MediumCard`/
> `LargeCard`), `app_typography.dart`(`AppTypography`), `app_spacing.dart`
> (`AppSpacing`/`AppRadius`)를 쓰도록 수정된 코드가 로컬 uncommitted
> working tree에 존재함을 확인했다 — `jdukmin/letmeknow`에는 아직
> 커밋되지 않았다(커밋 `ad0e0f4`에는 컴포넌트 정의만 있고 위젯 채택은
> 없음). 근거: [frontend/docs/theme/ThemeGuide.md](theme/ThemeGuide.md),
> [frontend/docs/theme/CardComponent.md](theme/CardComponent.md). `AodColors`
> Green Theme(Primary `#61CE70`, 이건 `ad0e0f4`에 커밋되어 있음)와 병행 적용.

| 기능 | 파일 | 비고 |
|------|------|------|
| 3컬럼 태블릿 레이아웃 | `layout/aod_tablet_layout.dart` | 좌28% / 중44% / 우28% |
| 사이드바 슬라이드인 | `layout/aod_tablet_layout.dart` | `AnimatedPositioned` 300px |
| 다크/라이트/시스템 테마 | `main.dart` + `SidebarWidget` | `AodColors` ThemeExtension(Green Theme v2) |
| Design System v2 (Card/Typography/Spacing) | `core/design/{app_card,app_typography,app_spacing}.dart` | 7개 대시보드 위젯 전부 적용 확인(uncommitted) — Tier 매핑은 `theme/CardComponent.md` 참고 |

### 시계

| 기능 | 파일 |
|------|------|
| 1초 갱신 실시간 시계 | `modules/clock_module.dart`, `widget/clock_widget.dart` |

### 날씨

> **✅ 정정 2026-09-14(TASK-002, 미커밋)**: 위 P0 결함(2026-07-29 기록)은
> 수정되었다. `letmeknow/lib/modules/weather/weather_error_mapper.dart`와
> `letmeknow/lib/modules/brief/brief_error_mapper.dart`가 신설되어
> `error.code`→한국어 사용자 메시지 매핑을 제공한다(존재 확인:
> `ls letmeknow/lib/modules/weather/weather_error_mapper.dart
> letmeknow/lib/modules/brief/brief_error_mapper.dart`, 2026-09-14).
> Calendar의 `GoogleCalendarDataSource._codeToMessage`(V0.0.17)와 동일한
> 패턴을 재사용했다. **이 수정은 `letmeknow` 작업 트리에 UNCOMMITTED 상태다**
> (`git status --porcelain`에 `?? lib/modules/weather/weather_error_mapper.dart`,
> `?? lib/modules/brief/brief_error_mapper.dart`로 표시됨) — 아직 릴리즈된
> 것이 아니다. 근거: `FRONTEND_SCHEMA_VERIFICATION_REPORT.md` Issue #1,
> `FRONTEND_VERSION_HISTORY_REPORT.md` Known Issue #1(원 결함 기록), 상세:
> [status/current_status.md](../../status/current_status.md).

| 기능 | 파일 | 비고 |
|------|------|------|
| 현재 날씨 표시 | `widget/weather_now_widget.dart` | 기온, 아이콘, 체감온도 등 |
| 5일 예보 | `widget/weather_forecast_widget.dart` | 수직 레이아웃 |
| Meteocons SVG 아이콘 | `widget/weather_icon_widget.dart` | 런타임 프리로드 |
| 날씨 API 연동 | `route/lingon_weather.dart` | Fastify 백엔드 프록시 |

### 캘린더

> **정정 2026-07-29(DevDocs V_0.1.0 반영)**: "로컬 캘린더"는 V0.0.12(2026-07-21)부터
> **Google Calendar 연동으로 완전히 대체**되었다 — 로컬 기기 캘린더 코드는
> 더 이상 존재하지 않는다. 근거: `FRONTEND_VERIFICATION_REPORT.md`,
> `FRONTEND_SCHEMA_VERIFICATION_REPORT.md` §3("Google Calendar가 유일한
> 데이터 경로"), `FRONTEND_VERSION_HISTORY_REPORT.md` V0.0.12/15/17.
> 아래 "📅 예정 기능"의 "캘린더 Google 동기화" 항목은 이미 완료되었으므로
> 제거함.

| 기능 | 파일 | 비고 |
|------|------|------|
| Google Calendar 이벤트 표시 | `modules/calendar/calendar_module.dart`, `modules/calendar/google_calendar_data_source.dart`, `widget/calendar_widget.dart`, `route/lingon_calendar.dart` | `GET /v1/calendar/events` 연동. 6-상태 UI(loading/permission-denied/not-connected/error/empty/populated), `error.code`→한국어 메시지 매핑(`_codeToMessage`) 포함 |

### AI

| 기능 | 파일 | 비고 |
|------|------|------|
| AI 브리핑 카드 | `widget/brief_card_widget.dart` | 날씨 + 캘린더 기반 |
| AI 채팅 | `widget/chat_widget.dart`, `modules/chat_module.dart` | `LlmGateway` 연동 |
| OpenAI 게이트웨이 | `gateway/llm/openai_gateway.dart` | `--dart-define` 키 주입 |
| LlmGateway 추상 인터페이스 | `gateway/llm/llm_gateway.dart` | 프로바이더 교체 지원 |

### 설정 / 사이드바

| 기능 | 파일 | 비고 |
|------|------|------|
| 테마 토글 | `widget/sidebar_widget.dart` | 실시간 반영 |
| 표시 이름 편집 | `widget/sidebar_widget.dart` | 다이얼로그 |
| Google 로그인 UI (4상태) | `widget/sidebar_widget.dart` | 로그아웃/로딩/로그인/오류 |
| 볼륨·밝기 슬라이더 | `widget/sidebar_widget.dart` | 저장만, 기기 연동 미구현 |
| 온도 단위 / 갱신 주기 | `widget/sidebar_widget.dart` | 저장만, 반영 미구현 |

---

## 🔧 스텁 (선언됨 / 미구현)

| 기능 | 위치 | 필요 작업 |
|------|------|-----------|
| LLM 백엔드 연결 | `ChatModule.send()` | `runGuarded` 래퍼 완성됨, 엔드포인트 연결 필요 |
| 기기 볼륨 제어 | `SidebarModule.volume` | `volume_controller` 플러그인 필요 |
| 화면 밝기 제어 | `SidebarModule.brightness` | `screen_brightness` 플러그인 필요 |
| 온도 단위 적용 | `SidebarModule.temperatureUnit` | `WeatherModule` 연동 필요 |
| 날씨 갱신 주기 | `SidebarModule.weatherRefreshMinutes` | WeatherModule 스케줄러 필요 |
| 계정 연동 (Home Assistant) | `SidebarWidget._buildAccountsSection` | HA REST API |
| 상태 영속성 | 모든 모듈 | `shared_preferences` 패키지 추가됨, 미연결 |
| LlmProvider 선택 UI | `modules/auth/llm_provider.dart` | enum 선언 완료, UI 미구현 |
| Settings(AI/UI) 저장 UI | `route/lingon_settings.dart` | `PUT` 라우트는 구현되어 있으나 호출하는 화면이 없음(Dead Code) — Settings 화면 신설 또는 post-V0.1.0으로 명시 필요 |
| BYOK API Key 관리 UI | `route/lingon_api_key.dart` | `PUT`/`DELETE` 라우트는 구현되어 있으나 호출하는 화면이 없음(Dead Code) |

---

## 📅 예정 기능

| 기능 | 예상 레이어 | 우선순위 |
|------|------------|---------|
| 푸시 알림 | Gateway | Medium |
| Home Assistant 위젯 | Module + Widget | Medium |
| 날씨 도시 검색 | SidebarWidget | High — `geoDirect`/`geoReverse` 라우트는 이미 존재(호출부 없음) |
| AI 스트리밍 응답 | ChatModule + LlmGateway | High (`stream()` 이미 선언됨) |
| LLM 프로바이더 전환 UI | SidebarWidget | Medium |
| 다국어 지원 | — | Low |

> `캘린더 Google 동기화`, `Refresh Token 자동 갱신(인터셉터)`는 각각
> V0.0.12/V0.0.11에서 이미 완료되어 이 표에서 제거함(2026-07-29 정정 —
> 위 "✅ 구현 완료" 절 참고).

---

## ❌ Deprecated (삭제 예정)

| 파일 | 사유 |
|------|------|
| `widget/brief_button.dart` | 미사용 |
| `widget/weather_metrics_widget.dart` | `WeatherMetricsModule`으로 대체됨 |
| `layout/aod_compact_layout.dart` | 미사용 레이아웃 |
| `layout/aod_dashboard_layout.dart` | 미사용 레이아웃 |
| `layout/aod_focus_layout.dart` | 미사용 레이아웃 |
| `layout/aod_slot.dart` | 미사용 슬롯 |

---

## ⚠️ 문서화 공백 — Client-emitted `RouteException` 코드 (2026-09-14, TASK-007)

클라이언트(`letmeknow`)가 자체적으로 만들어내는 `RouteException.code` 값들이
**SSOT 어느 문서에도 등재되어 있지 않다.** 이 코드들은 서버가 내려주는
`error.code`(`docs/docs/policies/error_policy.md` 대상)와는 **출처가 다르다**
— 서버 응답을 받기 전(타임아웃/네트워크 단절/파싱 실패 등) 클라이언트가
스스로 만들어 붙이는 코드이므로, 두 코드 체계를 혼동하지 않아야 한다.

**출처 1 — `letmeknow/lib/core/utils/error_handler.dart`** (`ErrorHandler`):
- `normalize()` (일반 예외 → `RouteException` 변환, 서버 응답 이전 단계):
  `TIMEOUT`(38행), `NETWORK_ERROR`(45행), `HTTP_EXCEPTION`(52행),
  `FORMAT_ERROR`(59행), `UNKNOWN_ERROR`(65행, 위 4가지에 해당하지 않는 모든
  예외의 기본값)
- `fromHttpResponse()` (HTTP 응답은 받았으나 2xx가 아닌 경우): 서버가
  응답 바디에 `error.code`를 실었다면 그 값을 그대로 통과시키고(82행),
  그렇지 않으면 `HTTP_<statusCode>` 형태로 대체한다(96행, 예: `HTTP_502`).

**출처 2 — `letmeknow/lib/core/base/base_route.dart`** (`BaseRoute`, `get`/
`post`/`put`/`patch`/`delete` 5개 메서드 각각에 동일 패턴 반복):
`TIMEOUT`(각 메서드의 `on TimeoutException` catch, 예: 74행), `CLIENT_EXCEPTION`
(각 메서드의 `on http.ClientException` catch, 예: 76행), `INVALID_JSON_OBJECT`
(HTTP 응답 바디가 JSON object가 아닐 때, 216행).

**전체 코드 집합**: `TIMEOUT`, `CLIENT_EXCEPTION`, `NETWORK_ERROR`,
`HTTP_EXCEPTION`, `FORMAT_ERROR`, `INVALID_JSON_OBJECT`, `HTTP_<status>`,
`UNKNOWN_ERROR`.

**영향**: `weather_error_mapper.dart`/`brief_error_mapper.dart`/
`GoogleCalendarDataSource._codeToMessage` 등 모든 에러 매퍼가 서버
`error.code`뿐 아니라 이 클라이언트 코드도 함께 처리해야 사용자에게 원시
예외 텍스트가 노출되지 않는다(실제로 `weather_error_mapper.dart`는
`TIMEOUT`/`NETWORK_ERROR`/`CLIENT_EXCEPTION`을 매핑 테이블에 포함하고
있음 — `weatherCodeToMessage()` 참고). **TODO**: 이 코드 집합을
`docs/docs/policies/error_policy.md` 또는 별도 문서에 정식으로 등재할지
결정 필요(현재는 이 파일에만 기록됨).

---

## 📝 TODO

- [ ] Deprecated 파일 삭제 및 영향 확인
- [ ] `shared_preferences`로 SidebarModule 상태 영속화
- [x] **[P0]** `WeatherModule` `error.code`→메시지 매핑 추가(Calendar 패턴 재사용) — **완료(2026-09-14, TASK-002, 미커밋)**: `lib/modules/weather/weather_error_mapper.dart`, `lib/modules/brief/brief_error_mapper.dart` 신설. 위 "날씨" 절 정정 노트 참고.
- [ ] Release APK 서명 키 설정
- [ ] iOS `GoogleService-Info.plist` 등록
- [x] `flutter analyze` CI 통합 관련 실행 결과 — **정정 2026-09-14**: "Flutter SDK 미설치"는 더 이상 사실이 아니다. `flutter doctor`가 Flutter 3.41.2 / Dart 3.11.0으로 clean(`[✓] Flutter`, `[✓] Chrome`, `[✓] Visual Studio`, `[✓] Connected device`, `No issues found!`, 2026-09-14 실행). `flutter analyze` 결과 "No issues found! (ran in 1.8s)"(2026-09-14). CI 파이프라인 자체 통합 여부는 `docs/ops/deployment_sop.md` 참고(현재 CI는 미구성 — 로컬 실행만 확인됨). 근거는 여전히 `FRONTEND_SCHEMA_VERIFICATION_REPORT.md` §7 참고(과거 미실행 기록).
- [~] `CalendarEvent`/`WeatherCurrentModel`/`UserModel`의 `fromJson` 회귀 테스트 추가 — **부분 진행(2026-09-14)**: `fromJson` 파싱 자체를 겨냥한 회귀 테스트는 아직 추가되지 않았다. 대신 TASK-002로 `error.code`→메시지 매핑 회귀 테스트 3개 파일이 신설되었다(모두 미커밋 — `git status --porcelain`에 `?? test/core/modules/`, `?? test/modules/`): `test/core/modules/weather_icon_error_mapping_test.dart`, `test/modules/brief/brief_error_mapping_test.dart`, `test/modules/weather/weather_error_mapping_test.dart`. 실행 결과(`flutter test`, 2026-09-14): **134 passing, 0 failing**(commit `ad08414` 기준 트래킹된 테스트 파일 98개 통과분 + 위 신규 미커밋 3개 파일에서 36개 통과분 = 134 — 신규 3개 파일만 단독 실행 시 `+36: All tests passed!`로 확인). 이 항목의 원래 범위(`fromJson` 파싱 테스트)는 여전히 미착수 상태이므로 체크를 완료로 바꾸지 않는다.
- [ ] Settings/BYOK API Key 쓰기 경로 UI 연결 여부 결정(구현 또는 post-V0.1.0 명시)
