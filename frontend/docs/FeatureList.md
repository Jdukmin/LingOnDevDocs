# Feature List

> 구현 상태를 단일 출처로 관리합니다. 기능 추가·변경 시 코드와 함께 이 파일을 업데이트합니다.

---

## ✅ 구현 완료

### 인증

| 기능 | 파일 | 비고 |
|------|------|------|
| Google Sign-In (OAuth) | `auth/presentation/auth_controller.dart` | idToken → Fastify 백엔드 교환 |
| 토큰 영속성 | `auth/domain/auth_repository.dart` | `flutter_secure_storage` |
| 세션 복원 | `AuthController.restoreSession()` | 앱 시작 시 자동 실행 |
| 로그아웃 | `AuthController.signOut()` | Google + 로컬 토큰 삭제 |
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

| 기능 | 파일 | 비고 |
|------|------|------|
| 현재 날씨 표시 | `widget/weather_now_widget.dart` | 기온, 아이콘, 체감온도 등 |
| 5일 예보 | `widget/weather_forecast_widget.dart` | 수직 레이아웃 |
| Meteocons SVG 아이콘 | `widget/weather_icon_widget.dart` | 런타임 프리로드 |
| 날씨 API 연동 | `route/lingon_weather.dart` | Fastify 백엔드 프록시 |

### 캘린더

| 기능 | 파일 |
|------|------|
| 로컬 캘린더 이벤트 표시 | `modules/calendar_module.dart`, `widget/calendar_widget.dart` |

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
| 계정 연동 (Calendar) | `SidebarWidget._buildAccountsSection` | Google Calendar API scope 필요 |
| 계정 연동 (Home Assistant) | `SidebarWidget._buildAccountsSection` | HA REST API |
| 상태 영속성 | 모든 모듈 | `shared_preferences` 패키지 추가됨, 미연결 |
| LlmProvider 선택 UI | `auth/domain/llm_provider.dart` | enum 선언 완료, UI 미구현 |
| Refresh Token 재발급 | `AuthRepository` | refresh_token 저장됨, 재발급 로직 없음 |

---

## 📅 예정 기능

| 기능 | 예상 레이어 | 우선순위 |
|------|------------|---------|
| 푸시 알림 | Gateway | Medium |
| Home Assistant 위젯 | Module + Widget | Medium |
| 날씨 도시 검색 | SidebarWidget | High |
| 캘린더 Google 동기화 | CalendarModule | High |
| AI 스트리밍 응답 | ChatModule + LlmGateway | High (`stream()` 이미 선언됨) |
| LLM 프로바이더 전환 UI | SidebarWidget | Medium |
| Refresh Token 갱신 로직 | AuthRepository | High |
| 다국어 지원 | — | Low |

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
- [ ] Refresh Token 재발급 로직 구현
- [ ] Release APK 서명 키 설정
- [ ] iOS `GoogleService-Info.plist` 등록
- [ ] `flutter analyze` CI 통합
