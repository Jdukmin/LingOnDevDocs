# Calendar Domain

> **Status**: Proposed · **Progress**: 25% · **Last Updated**: 2026-07-22 · **Owner**: Integrations/Productivity · **Version**: 0.1.2-draft

비즈니스 계약만 정의한다 — Google Calendar OAuth/REST 세부사항은 Tool
구현이며 [backend/docs/api/calendar.md](../../backend/docs/api/calendar.md)에
있다. 이 문서는 "일정"이라는 비즈니스 개념 자체를 정의한다.

**Progress 근거**: 백엔드는 Google Calendar 조회(Tool 구현)를 완료했지만
([requirements/connector_requirements.md](../connector_requirements.md) CON-001),
프론트는 아직 로컬 캘린더만 표시하고 이 Tool을 호출하지 않는다
([requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-003) — 25%.

> **2026-07-22 정정 — MVP 범위 축소**: 이전 버전은 로컬 캘린더와 Google
> Calendar를 "병합해야 할 두 소스"로 다뤘다. **MVP는 Google Calendar만
> 지원한다.** 로컬 캘린더는 구현 대상이 아니며, 현재 화면에 보이는 로컬
> 캘린더 표시는 Google Calendar 연동(Phase 2)이 완료되면 **병합이 아니라
> 교체**된다. 이 Domain은 `provider=google`만 정의하고, 다른 provider는
> Future Extension으로만 기록한다.

---

# Purpose

Calendar Domain은 "사용자의 시간 약속"이라는 비즈니스 개념을 정의한다. 이
개념이 없으면 Action Domain은 "Google Calendar API가 뭘 리턴하는지"만 알 뿐,
"일정"이 사용자에게 어떤 의미인지 알 수 없다 — 예를 들어 브리핑(SYS-003)이나
Workflow("퇴근 모드")가 "다가오는 일정"을 참조하려면, 그 개념이 Google
Calendar API 응답 형태로부터 독립적으로 정의되어 있어야 한다.

# Domain Model

| Entity | 설명 |
|---|---|
| **CalendarEvent** | 하나의 일정(제목, 시작/종료 시각, 종일 여부, 위치, 설명). MVP에서는 `provider = "google"`만 존재한다. |
| **CalendarQuery** | "다가오는 일정", "오늘 일정" 같은 조회 조건. |

`CalendarSource`(다중 소스 개념)는 MVP 범위에서 제거했다 — 아래 Future
Extensions 참고.

### CalendarEvent 정규 스키마

Backend `GET /v1/calendar/events`(`backend/docs/api/calendar.md`)가 유일한
데이터 소스다. 이 Domain의 정규 스키마는 그 응답을 그대로 따르되, 필드명만
프로젝트 전체 명명 규칙(snake_case)에 맞춘다 — `allDay`/`htmlLink`(camelCase)는
[API Contract Verification 2026-07-22]에서 지적된 기존 API의 명명 불일치이며,
이 Domain의 정규 스키마에서는 아래처럼 snake_case로 통일해 노출한다(Backend
원본 API 자체를 바꾸는 것은 아니다 — 정규화는 Calendar Domain 경계에서 이뤄진다).

| 정규 필드(CalendarEvent) | 타입 | Backend 원본(`GET /v1/calendar/events`) |
|---|---|---|
| `id` | string | `id` |
| `title` | string | `summary` |
| `description` | string \| null | `description` |
| `location` | string \| null | `location` |
| `start` | ISO8601(원본 타임존 오프셋 유지) | `start` |
| `end` | ISO8601(원본 타임존 오프셋 유지) | `end` |
| `all_day` | boolean | `allDay` |
| `source_url` | string \| null | `htmlLink` |
| `provider` | `"google"`(MVP 고정값) | (Backend 응답에는 없음 — 이 Domain이 추가) |

# Responsibilities

**한다**
- "일정"이라는 개념의 정규 스키마(제목/시간/종일여부/위치)를 정의한다.
- 조회 조건(`CalendarQuery`)의 의미를 정의한다(예: "다가오는" = 현재 시각 이후).
- 일정 생성/수정/삭제 요청의 유효성 기준을 정의한다(예: 종료 시각이 시작 시각보다 빨라선 안 됨).

**하지 않는다**
- Google Calendar OAuth/토큰 갱신을 다루지 않는다 — Tool Domain(Google Calendar
  Tool)의 책임이다([tool.md](tool.md)).
- 캘린더 UI를 그리지 않는다 — Dashboard Domain의 책임이다([dashboard.md](dashboard.md)).
- 알림 발송 시점을 결정하지 않는다 — Reminder/Notification Domain의 책임이다.
- (MVP 한정) 로컬 기기 캘린더, Outlook, Exchange 등 다른 provider를 지원하지
  않는다 — Future Extensions 참고.

# State

`CalendarEvent` 자체는 상태 머신이 없다(Google Calendar의 상태를 그대로
반영). 이 Domain에 대한 **동기화 상태**는 아래를 갖는다(값은
[tool.md](tool.md) `ToolConnection` 5-state와 동일한 명명을 따른다):

| State | 의미 |
|---|---|
| `not_connected` | 사용자가 Google Calendar를 연결하지 않음 |
| `connected` | 정상 연결·동기화됨 |
| `sync_failed` | 동기화 실패([tool.md](tool.md) `ToolConnection` 상태 참조) |

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `CalendarEventCreated` / `Updated` / `Deleted` | 일정 변경 | Dashboard(갱신), Notification(변경 알림 필요 시) |
| `CalendarSyncFailed` | Google Calendar 동기화 실패 | Notification Domain(재연결 유도) |

# Inputs

- Action Domain의 `calendar.list_events` / `calendar.create_event` 등 실행 요청
- Tool Domain으로부터의 원시 Google Calendar 데이터

# Outputs

- 정규화된 `CalendarEvent[]`(Action Domain의 ExecutionResult로 반환)
- Dashboard가 구독하는 "다가오는 일정" 요약

# Relationships

```
Action → Calendar Domain → Tool(Google Calendar) → CalendarEvent
```

- **Action Domain**: `calendar.*` Action Type의 비즈니스 규칙 출처([action.md](action.md)).
- **Tool Domain**: 실제 Google Calendar 통신은 Tool Domain에 위임([tool.md](tool.md)).
- **Reminder Domain**: Reminder는 특정 시각에 알림을 발생시키는 개념으로,
  CalendarEvent와 유사하지만 별개다 — Reminder가 CalendarEvent를 참조할 수는
  있다([reminder.md](reminder.md)).
- **Workflow Domain**: "내일 일정 브리핑" 같은 Workflow step에서 참조된다([workflow.md](workflow.md)).
- **Dashboard Domain**: `CalendarWidget`이 이 Domain의 데이터를 시각화([dashboard.md](dashboard.md)) —
  단, 현재 `CalendarWidget`은 이 Domain(Google Calendar)이 아니라 로컬 캘린더를
  표시하고 있다([frontend/docs/widgets/CalendarWidget.md](../../frontend/docs/widgets/CalendarWidget.md)
  참고, Phase 2에서 교체 예정).

# Future Extensions

MVP 이후에만 검토한다 — 지금은 설계하지 않는다.

- 다른 provider 지원: Android/iOS 로컬 캘린더, Exchange, Outlook
- 다중 provider 동시 지원 시의 병합/충돌 처리 규칙(현재는 provider 전환만
  가정하고, 병합은 설계하지 않는다)
- 반복 일정(recurring event) 정규화 규칙
- 일정 충돌 감지

# References

- Backend: [backend/docs/api/calendar.md](../../backend/docs/api/calendar.md), [backend/docs/services/google-calendar.md](../../backend/docs/services/google-calendar.md)
- Frontend: [frontend/docs/widgets/CalendarWidget.md](../../frontend/docs/widgets/CalendarWidget.md)(현재 로컬 캘린더 — 교체 대상)
- Strategy: [docs/roadmap/mvp.md](../../docs/roadmap/mvp.md) (Tier 1)
- Requirement: [requirements/connector_requirements.md](../connector_requirements.md) CON-001, [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-003
