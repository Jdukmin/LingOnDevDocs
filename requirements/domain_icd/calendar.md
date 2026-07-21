# Calendar Domain

> **Status**: Proposed · **Progress**: 25% · **Last Updated**: 2026-07-21 · **Owner**: Integrations/Productivity · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다 — Google Calendar OAuth/REST 세부사항은 Tool
구현이며 [backend/docs/api/calendar.md](../../backend/docs/api/calendar.md)에
있다. 이 문서는 "일정"이라는 비즈니스 개념 자체를 정의한다.

**Progress 근거**: 백엔드는 Google Calendar 조회(Tool 구현)를 완료했지만
([requirements/connector_requirements.md](../connector_requirements.md) CON-001),
프론트는 로컬 캘린더만 표시하고 이 Tool을 호출하지 않는다
([requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-003) — 25%.

---

# Purpose

Calendar Domain은 "사용자의 시간 약속"이라는 비즈니스 개념을 정의한다. 이
개념이 없으면 Action Domain은 "Google Calendar API가 뭘 리턴하는지"만 알 뿐,
"일정"이 사용자에게 어떤 의미인지 알 수 없다 — 예를 들어 브리핑(SYS-003)이나
Workflow("퇴근 모드")가 "다가오는 일정"을 참조하려면, 그 개념이 특정 Tool
구현으로부터 독립적으로 정의되어 있어야 한다.

# Domain Model

| Entity | 설명 |
|---|---|
| **CalendarEvent** | 하나의 일정(제목, 시작/종료 시각, 종일 여부, 위치, 설명). |
| **CalendarSource** | 이 이벤트가 어느 캘린더(로컬 기기 캘린더, Google Calendar 등)에서 왔는지. |
| **CalendarQuery** | "다가오는 일정", "오늘 일정" 같은 조회 조건. |

# Responsibilities

**한다**
- "일정"이라는 개념의 정규 스키마(제목/시간/종일여부/위치)를 정의한다 —
  어떤 `CalendarSource`(로컬/Google/향후 다른 캘린더)든 이 스키마로 정규화된다.
- 조회 조건(`CalendarQuery`)의 의미를 정의한다(예: "다가오는" = 현재 시각 이후).
- 일정 생성/수정/삭제 요청의 유효성 기준을 정의한다(예: 종료 시각이 시작 시각보다 빨라선 안 됨).

**하지 않는다**
- Google Calendar OAuth/토큰 갱신을 다루지 않는다 — Tool Domain(Google Calendar
  Tool)의 책임이다([tool.md](tool.md)).
- 캘린더 UI를 그리지 않는다 — Dashboard Domain의 책임이다([dashboard.md](dashboard.md)).
- 알림 발송 시점을 결정하지 않는다 — Reminder/Notification Domain의 책임이다.

# State

`CalendarEvent` 자체는 상태 머신이 없다(외부 캘린더의 상태를 그대로 반영).
다만 이 Domain에 대한 **동기화 상태**는 아래를 갖는다:

| State | 의미 |
|---|---|
| `NotConnected` | 사용자가 외부 캘린더(Google 등)를 연결하지 않음 — 로컬 이벤트만 사용 |
| `Synced` | 외부 캘린더와 정상 동기화됨 |
| `SyncFailed` | 동기화 실패(Tool Domain의 `ToolConnection` 상태 참조) |

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `CalendarEventCreated` / `Updated` / `Deleted` | 일정 변경 | Dashboard(갱신), Notification(변경 알림 필요 시) |
| `CalendarSyncFailed` | 외부 캘린더 동기화 실패 | Notification Domain(재연결 유도) |

# Inputs

- Action Domain의 `calendar.list_events` / `calendar.create_event` 등 실행 요청
- Tool Domain으로부터의 원시 캘린더 데이터(Google Calendar API 등)

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
- **Dashboard Domain**: `CalendarWidget`이 이 Domain의 데이터를 시각화([dashboard.md](dashboard.md)).

# Future Extensions

- 다중 캘린더 소스 병합(Google + 로컬 + 향후 Outlook 등)
- 반복 일정(recurring event) 정규화 규칙
- 일정 충돌 감지

# References

- Backend: [backend/docs/api/calendar.md](../../backend/docs/api/calendar.md), [backend/docs/services/google-calendar.md](../../backend/docs/services/google-calendar.md)
- Frontend: [frontend/docs/widgets/CalendarWidget.md](../../frontend/docs/widgets/CalendarWidget.md)
- Strategy: [docs/roadmap/mvp.md](../../docs/roadmap/mvp.md) (Tier 1)
- Requirement: [requirements/connector_requirements.md](../connector_requirements.md) CON-001, [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-003
