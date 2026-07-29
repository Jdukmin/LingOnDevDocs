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

| 기능 | 파일 | 비고 |
|------|------|------|
| 3컬럼 태블릿 레이아웃 | `layout/aod_tablet_layout.dart` | 좌28% / 중44% / 우28% |
| 사이드바 슬라이드인 | `layout/aod_tablet_layout.dart` | `AnimatedPositioned` 300px |
| 다크/라이트/시스템 테마 | `main.dart` + `SidebarWidget` | `AodColors` ThemeExtension |

### 시계

| 기능 | 파일 |
|------|------|
| 1초 갱신 실시간 시계 | `modules/clock_module.dart`, `widget/clock_widget.dart` |

### 날씨

> **⚠ P0 결함(2026-07-29 기록, 미수정)**: `modules/weather/weather_module.dart`에
> `error.code`→사용자 메시지 매핑이 없어, API 실패 시 `RouteException.toString()`
> 원시 문자열이 `WeatherNowWidget`/`WeatherForecastWidget`에 그대로
> 노출된다(`docs/policies/error_policy.md` 위반). Calendar의
> `GoogleCalendarDataSource._codeToMessage`(V0.0.17)와 동일한 패턴으로
> 수정 필요 — 근거: `FRONTEND_SCHEMA_VERIFICATION_REPORT.md` Issue #1,
> `FRONTEND_VERSION_HISTORY_REPORT.md` Known Issue #1. 상세:
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

## 📝 TODO

- [ ] Deprecated 파일 삭제 및 영향 확인
- [ ] `shared_preferences`로 SidebarModule 상태 영속화
- [ ] **[P0]** `WeatherModule` `error.code`→메시지 매핑 추가(Calendar 패턴 재사용)
- [ ] Release APK 서명 키 설정
- [ ] iOS `GoogleService-Info.plist` 등록
- [ ] `flutter analyze` CI 통합(Flutter SDK 미설치 환경이라 2회 연속 미실행 — `FRONTEND_SCHEMA_VERIFICATION_REPORT.md` §7, `FRONTEND_VERSION_HISTORY_REPORT.md`)
- [ ] `CalendarEvent`/`WeatherCurrentModel`/`UserModel`의 `fromJson` 회귀 테스트 추가
- [ ] Settings/BYOK API Key 쓰기 경로 UI 연결 여부 결정(구현 또는 post-V0.1.0 명시)
