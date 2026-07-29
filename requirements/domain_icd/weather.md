# Weather Domain

> **Status**: Proposed · **Progress**: 75% · **Last Updated**: 2026-07-22 · **Owner**: Integrations/Productivity · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다 — OpenWeather REST 세부사항은 Tool 구현이며
[backend/docs/api/weather.md](../../backend/docs/api/weather.md)에 있다.

**신규 작성 배경**: [domain_analysis.md](domain_analysis.md)에서 "이미 완전히
구현된 기능인데 Domain ICD가 없다"고 지적된 항목이다.

**Progress 근거**: FE(`WeatherNowWidget`/`WeatherForecastWidget`) + BE(`GET
/v1/weather/*`, OpenWeather 프록시)가 실제로 연동되어 있다고 양쪽 FeatureList가
확인한다([requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-002).
다만 API Contract Verification(2026-07-22)에서 Frontend 문서가 응답 포맷을
다르게 서술하고 있던 점이 발견·정정되어(`frontend/docs/services/WeatherService.md`),
실제 코드 재확인 전까지는 75%로 유지한다.

---

# Purpose

Weather Domain은 "현재 날씨/예보"라는 비즈니스 개념을 정의한다. AI
Briefing(SYS-003)과 Workflow("퇴근 모드" 등)가 날씨를 참조하려면, 그 개념이
OpenWeather API 응답 형태로부터 독립적으로 정의되어 있어야 한다.

# Domain Model

| Entity | 설명 |
|---|---|
| **CurrentWeather** | 특정 위치의 현재 날씨(기온, 체감온도, 습도, 풍속, 상태 설명 등). |
| **WeatherForecast** | 향후 N일/구간의 예보 목록(`CurrentWeather`와 유사한 구조의 시계열). |
| **Location** | 위경도 또는 도시명으로 표현되는 조회 대상 지점. |

### CurrentWeather 정규 스키마

Backend `GET /v1/weather/current`(`backend/docs/api/weather.md`)를 그대로
정규 스키마로 채택한다(이미 snake_case로 일관되어 있어 추가 정규화가
필요 없다 — Calendar와 달리 명명 불일치가 없음, API Contract Verification
결과).

| 필드 | 타입 |
|---|---|
| `location.city` / `.country` / `.lat` / `.lon` | string / string / number / number |
| `weather.main` / `.description` / `.icon` | string |
| `temperature.temp` / `.feels_like` / `.temp_min` / `.temp_max` / `.humidity` / `.pressure` | number |
| `wind.speed` / `.deg` | number |
| `clouds` / `visibility` / `sunrise` / `sunset` / `observed_at` | number |

# Responsibilities

**한다**
- "현재 날씨"/"예보"라는 개념의 정규 스키마를 정의한다.
- 위치 조회 방식(좌표 vs 도시명, forward/reverse geocoding)의 의미를 정의한다.

**하지 않는다**
- OpenWeather API 키 관리/암호화를 다루지 않는다 — Tool Domain의 책임이다([tool.md](tool.md)).
- 날씨 위젯 UI를 그리지 않는다 — Dashboard Domain의 책임이다([dashboard.md](dashboard.md)).
- 날씨 기반 알림(우산 챙기기 등)을 직접 발생시키지 않는다 — 그런 판단은
  향후 AI Decision Layer/Notification Domain의 책임이다(현재 미구현,
  [memory_requirements.md](../memory_requirements.md) 참고).

# State

무상태(Stateless) — 조회할 때마다 최신 값을 반환하며, Domain 자체가 별도
State를 갖지 않는다. Tool 연결 상태만 [tool.md](tool.md)의 `ToolConnection`을
따른다(OpenWeather는 사용자별 연결이 아니라 서버 전역 API 키를 쓰므로
`connected`는 항상 서버 설정 여부에 달려 있다 — 사용자별 `not_connected`
개념은 해당 없음).

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `WeatherFetchFailed` | OpenWeather 호출 실패(`PROVIDER_HTTP_ERROR`/`PROVIDER_NETWORK_ERROR`) | Dashboard(에러 상태 표시) |

날씨는 사용자 행동을 유발하는 도메인이 아니므로(단순 조회), Action Domain의
`ExecutionCompleted` 이상의 별도 도메인 이벤트가 거의 필요 없다 — 다른
Domain(Notification 등)이 구독할 만한 이벤트가 현재는 실패 케이스뿐이다.

# Inputs

- Action Domain의 `weather.get_current` / `weather.get_forecast` 실행 요청
- `Location`(좌표 또는 도시명)

# Outputs

- 정규화된 `CurrentWeather` / `WeatherForecast`(Action Domain의 ExecutionResult로 반환)
- Dashboard/BriefCard가 구독하는 날씨 요약

# Relationships

```
Action → Weather Domain → Tool(OpenWeather) → CurrentWeather/WeatherForecast
```

- **Action Domain**: `weather.*` Action Type의 비즈니스 규칙 출처([action.md](action.md)).
- **Tool Domain**: 실제 OpenWeather 통신은 Tool Domain에 위임([tool.md](tool.md)).
- **Dashboard Domain**: `WeatherNowWidget`/`WeatherForecastWidget`이 이 Domain의 데이터를 시각화([dashboard.md](dashboard.md)).
- **Workflow Domain**: "출근 준비 브리핑" 같은 Workflow step에서 참조된다([workflow.md](workflow.md)).

# Future Extensions

- 날씨 기반 자동 알림(예: 강수 예보 시 우산 알림) — AI Decision Layer 도입 후
- 다중 provider 지원(현재 OpenWeather 단일 provider)
- 위치 자동 추적(현재는 매 요청마다 좌표 전달)

# References

- Backend: [backend/docs/api/weather.md](../../backend/docs/api/weather.md), [backend/docs/services/openweather.md](../../backend/docs/services/openweather.md)
- Frontend: [frontend/docs/services/WeatherService.md](../../frontend/docs/services/WeatherService.md), `frontend/docs/widgets/WeatherNowWidget.md`, `WeatherForecastWidget.md`, `WeatherIconWidget.md`
- Strategy: [docs/roadmap/mvp.md](../../docs/roadmap/mvp.md) (Phase 1 — Action Pipeline 최소 검증 대상)
- Requirement: [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-002
