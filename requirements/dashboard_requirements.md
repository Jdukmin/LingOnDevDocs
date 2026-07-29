# Dashboard Layer Requirements

Parent Feature: [SYS-001 Dashboard Management](system_requirements.md). 구현 세부는
[frontend/docs/ui/AodDisplay.md](../frontend/docs/ui/AodDisplay.md)와
`frontend/docs/widgets/*`를 참조한다.

| ID | Parent Feature | Requirement | Description | Verification | Status | Progress |
|---|---|---|---|---|---|---|
| DSH-001 | SYS-001 | Time Display | Time shall be displayed and refreshed every second in HH:mm:ss format. | Demo | Done | 75% |
| DSH-002 | SYS-001 | Weather Widget | Dashboard shall display current weather and a 5-day forecast, sourced from the backend weather proxy. | Integration Test | Done | 75% |
| DSH-003 | SYS-001 | Calendar Widget | Dashboard shall display the user's upcoming calendar events in chronological order. | Demo | Done | 75% |
| DSH-004 | SYS-001 | Todo Widget | Dashboard shall display the user's outstanding to-do items. | Review | Planned | 0% |
| DSH-005 | SYS-001 | Widget Layout | Dashboard shall arrange widgets in a fixed 3-column tablet layout (28% / 44% / 28%). | Demo | Done | 75% |
| DSH-006 | SYS-001 | Widget Visibility | User shall be able to show/hide individual dashboard widgets. | Review | Planned | 0% |
| DSH-007 | SYS-001 | AI Layout Update | Dashboard layout shall be adjustable by the AI/Planner based on inferred user context or priority. | Analysis | Planned | 0% |
| DSH-008 | SYS-001 | Real-time Refresh | Dashboard widgets shall refresh their data automatically on a schedule (or push) without a manual reload. | Demo | In Progress | 25% |

---

## 근거 노트 (Evidence)

- **DSH-001**: `ClockModule`이 1초마다 갱신, `ClockWidget`이 표시. 근거:
  [frontend/docs/widgets/ClockWidget.md](../frontend/docs/widgets/ClockWidget.md),
  [frontend/docs/FeatureList.md](../frontend/docs/FeatureList.md)("1초 갱신 실시간 시계").
  백엔드 요소가 필요 없는 순수 프론트 기능이라 75%(FE 완료, 테스트/실행 확인 없음)로 표기.
- **DSH-002**: FE `WeatherNowWidget`/`WeatherForecastWidget`/`WeatherIconWidget` +
  BE `GET /v1/weather/current`, `GET /v1/weather/forecast5`가 실제로 연동된다고
  양쪽 FeatureList에 모두 명시("날씨 API 연동: Fastify 백엔드 프록시"). 근거:
  [backend/docs/api/weather.md](../backend/docs/api/weather.md),
  [frontend/docs/FeatureList.md](../frontend/docs/FeatureList.md). 실제 실행/테스트 확인은
  없어 75%로 제한.
- **DSH-003**: `CalendarWidget`/`CalendarModule`이 이벤트를 표시하지만, **로컬
  기기 캘린더** 기준이며 아직 백엔드 `GET /v1/calendar/events`(Google Calendar)를
  호출하지 않는다 — "캘린더 Google 동기화"가 `frontend/docs/FeatureList.md` 예정
  기능(High)으로 남아 있다. 위젯 자체(어떤 캘린더든 목록 표시)는 동작하므로 DSH
  요구사항은 75%로 보되, Google 연동은 [connector_requirements.md](connector_requirements.md)
  CON-001에서 별도로 낮게(25%) 추적한다.
- **DSH-004**: `backend/docs`, `frontend/docs` 어디에도 Todo/할일 관련 위젯,
  모듈, 엔드포인트가 없다.
- **DSH-005**: 3컬럼 태블릿 레이아웃이 `AodTabletLayout`으로 구현·문서화됨.
  근거: [frontend/docs/ui/AodDisplay.md](../frontend/docs/ui/AodDisplay.md).
- **DSH-006**: 위젯 단위 표시/숨김 토글에 대한 코드·문서 근거 없음. `SidebarWidget`은
  테마/볼륨/밝기 등 값을 저장하지만 위젯 가시성 제어는 아니다. 근거:
  [frontend/docs/widgets/SidebarWidget.md](../frontend/docs/widgets/SidebarWidget.md).
- **DSH-007**: Architecture가 지향하는 Planner 기반 레이아웃 조정은 Planner
  Layer 자체가 없어(PLN-xxx 전부 0%) 불가능한 상태.
- **DSH-008**: Clock만 실시간(1초) 갱신이 실제로 구현되어 있고, 날씨 자동
  갱신 주기는 설정값(`SidebarModule.weatherRefreshMinutes`)만 저장될 뿐 실제
  스케줄러가 없다 — "WeatherModule 스케줄러 필요"로 스텁 처리됨. 근거:
  [frontend/docs/FeatureList.md](../frontend/docs/FeatureList.md) 스텁 섹션.
