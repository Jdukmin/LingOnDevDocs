# Dashboard Domain

> **Status**: Proposed · **Progress**: 25% · **Last Updated**: 2026-07-21 · **Owner**: Frontend/UX · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다. Flutter Widget 구현은
[frontend/docs/ui/AodDisplay.md](../../frontend/docs/ui/AodDisplay.md) 등에
있다. **Progress는 "이 Domain의 경계 정의를 코드가 실제로 지키고 있는가"가
아니라 "시각화 기능 자체의 구현도"를 뜻한다** — 근거:
[requirements/system_requirements.md](../system_requirements.md) SYS-001(25%,
개별 위젯은 다수 75%).

---

# Purpose

Dashboard는 사용자가 **묻지 않아도** 현재 상태를 볼 수 있게 하는 창이다.
[docs/strategy/product.md](../../docs/strategy/product.md) Core Philosophy —
"Dashboard는 제품이 아니다. Action Layer가 제품이다. Dashboard는 Action
Layer를 시각화하는 인터페이스일 뿐이다" — 를 그대로 이 Domain의 존재
이유로 삼는다. 이 문서의 가장 중요한 역할은 **기능 정의보다 경계 설정**이다.

# Domain Model

| Entity | 설명 |
|---|---|
| **DashboardView** | 하나의 화면 구성(현재는 3컬럼 태블릿 레이아웃 1종). |
| **Widget** | DashboardView를 구성하는 개별 시각화 단위(Clock, Weather, Calendar, Brief, Chat, Status 등). |
| **WidgetState** | 특정 Widget이 구독하는, 다른 Domain이 발행한 "최신 상태" 스냅샷. |

# Responsibilities

**한다**
- 다른 Domain(Action, Calendar, Notification 등)이 발행한 상태를 구독해
  화면에 표시한다.
- Widget의 배치/레이아웃/표시 여부를 관리한다.
- 사용자 입력(탭, 롱프레스 등)을 받아 **화면 전환**만 수행한다(예: 사이드바
  열기, DevScreen 이동).

**절대 하지 않는다**
- **Business Logic**을 포함하지 않는다 — "이 데이터가 유효한가", "이 작업을
  해도 되는가" 같은 판단은 전부 다른 Domain의 몫이다.
- **Intent**를 생성하거나 해석하지 않는다 — 자연어 처리는 Chat UI를 통해
  Intent Domain으로 직접 전달되고, Dashboard는 그 결과만 반영한다.
- **Execution**을 수행하거나 트리거하지 않는다 — Dashboard의 어떤 조작도
  직접 Tool을 호출하거나 Action을 실행하지 않는다(예외적으로 "다시 시도"
  버튼조차, 실제로는 Action Domain에 새 ActionRequest를 보내는 것이지
  Dashboard가 실행 로직을 갖는 것이 아니다).
- 데이터를 가공/집계하지 않는다(단순 표시만) — 집계가 필요하면 그 로직은
  발행하는 Domain(Action History 등)에 있어야 한다.

# State

Dashboard 자체는 비즈니스 State를 갖지 않는다. 오직 **UI 상태**만 갖는다:

> **정정 2026-07-23 (DevDocs SSOT 정리)**: [action.md](action.md) 등이 정한
> 소문자 snake_case 표기로 통일한다(이전 버전은 PascalCase).

| State | 의미 |
|---|---|
| `idle` | 기본 표시 상태 |
| `loading` | 구독 중인 Domain의 데이터를 기다리는 중(예: 날씨 API 호출 중) |
| `stale` | 마지막으로 받은 데이터가 오래됨(갱신 실패 등) |

# Events

Dashboard는 이벤트를 **발행하지 않는다**(순수 소비자). 구독하는 이벤트:

| 구독 Event | 발행 Domain |
|---|---|
| `ExecutionStarted` / `ExecutionCompleted` / `ExecutionFailed` | Action |
| `CalendarEventCreated/Updated/Deleted` | Calendar |
| `ReminderScheduled` | Reminder |
| `NotificationDelivered` | Notification |
| `ToolConnectionExpired` | Tool |

# Inputs

- 다른 모든 Domain이 발행하는 "최신 상태" 스냅샷(읽기 전용 구독)
- 사용자의 화면 조작(탭/롱프레스 — 화면 전환 목적에 한함)

# Outputs

- 렌더링된 UI(그 자체로는 다른 Domain에 아무것도 반환하지 않음)
- 화면 전환 신호(다른 화면으로 이동)

# Relationships

```
Action / Calendar / Reminder / Notification / Tool
              ↓ (읽기 전용 구독)
          Dashboard
```

Dashboard는 이 Domain ICD 안에서 **유일하게 다른 Domain에 아무것도 발행하지
않는** Domain이다 — 모든 화살표가 Dashboard로 들어오기만 한다. 이것이 이
Domain의 경계를 지키는 핵심 규칙이다.

# Future Extensions

- Widget Visibility(표시/숨김) — [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-006
- AI 기반 레이아웃 조정 — 단, 조정 "판단"은 AI Decision Layer(Planner 등)가
  하고, Dashboard는 그 결과(레이아웃 지시)를 받아 표시만 한다(경계 유지) —
  [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-007

# References

- Backend: (직접 대응 없음 — Dashboard는 순수 Frontend 개념)
- Frontend: [frontend/docs/ui/AodDisplay.md](../../frontend/docs/ui/AodDisplay.md), [frontend/docs/state/Overview.md](../../frontend/docs/state/Overview.md), `frontend/docs/widgets/*`
- Strategy: [docs/strategy/product.md](../../docs/strategy/product.md) (Core Philosophy), [docs/strategy/architecture.md](../../docs/strategy/architecture.md) (Layer 3)
- Requirement: [requirements/dashboard_requirements.md](../dashboard_requirements.md)
