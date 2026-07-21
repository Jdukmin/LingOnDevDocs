# Reminder Domain

> **Status**: Proposed · **Progress**: 0% · **Last Updated**: 2026-07-21 · **Owner**: Integrations/Productivity · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다. 이 Domain은 `backend/docs`, `frontend/docs`
어디에도 아직 대응 구현이 없다([docs/roadmap/roadmap.md](../../docs/roadmap/roadmap.md) Phase 1
근거 노트에서 이미 "Requirement 미정의" 상태로 지적됨) — 이 문서가 Reminder의
**최초 정의**다.

---

# Purpose

Reminder는 "특정 시점에 사용자에게 알려야 할 사용자 정의 항목"이다.
Calendar와 달리 외부 캘린더 시스템에 근거하지 않는, LetMeKnow 자체가 소유하는
가장 단순한 형태의 능동적 알림 단위다 — Action Layer가 "명령 실행"뿐 아니라
"시간 기반 자동 실행"까지 다룬다는 것을 보여주는 첫 사례.

# Domain Model

| Entity | 설명 |
|---|---|
| **Reminder** | 사용자가 등록한 알림 항목(제목, 알림 시각, 반복 여부). |
| **ReminderTrigger** | Reminder가 실제로 발화되는 시점 계산 규칙(1회성 또는 반복). |

# Responsibilities

**한다**
- Reminder의 생성/수정/삭제/완료 처리 규칙을 정의한다.
- `ReminderTrigger` 도달 시점을 판단해 Notification Domain에 발화를 요청한다.
- 반복 Reminder의 다음 발화 시점을 계산한다.

**하지 않는다**
- 알림을 직접 사용자에게 전달하지 않는다 — Notification Domain에 위임한다([notification.md](notification.md)).
- 외부 캘린더와 동기화하지 않는다 — 필요하다면 Calendar Domain과 별개로 연동을
  검토하되, Reminder 자체는 LetMeKnow 내부 개념이다.
- UI를 그리지 않는다 — Dashboard Domain의 책임이다.

# State

```
Scheduled → Triggered → (Acknowledged | Snoozed | Dismissed)
```

| State | 의미 |
|---|---|
| `Scheduled` | 등록됨, 발화 대기 |
| `Triggered` | 알림 시점 도달, Notification Domain에 전달됨 |
| `Acknowledged` | 사용자가 확인함 |
| `Snoozed` | 사용자가 나중에 다시 알림을 요청함(재스케줄) |
| `Dismissed` | 사용자가 취소/삭제함 |

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `ReminderScheduled` | Reminder가 생성됨 | Dashboard(예정 항목 표시) |
| `ReminderTriggered` | 알림 시점 도달 | Notification Domain |
| `ReminderSnoozed` | 사용자가 연기함 | (내부 재스케줄) |
| `ReminderDismissed` | 사용자가 취소/완료 처리함 | History |

# Inputs

- Action Domain의 `reminder.create` / `reminder.update` / `reminder.dismiss` 등 실행 요청
- 시간 경과(스케줄러 — 구현 수단, 이 문서 범위 밖)

# Outputs

- `Reminder` 목록(Dashboard/Action Domain이 조회)
- `ReminderTriggered` 이벤트(Notification Domain 소비)

# Relationships

```
Action → Reminder Domain → Notification
```

- **Action Domain**: `reminder.*` Action Type의 비즈니스 규칙 출처([action.md](action.md)).
- **Notification Domain**: 실제 발화 전달은 전적으로 Notification Domain에 위임([notification.md](notification.md)).
- **Calendar Domain**: 개념적으로 유사하지만 독립적 — 향후 "일정 10분 전
  Reminder 자동 생성" 같은 연계는 Workflow Domain을 통해 구성한다([calendar.md](calendar.md), [workflow.md](workflow.md)).

# Future Extensions

- 위치 기반 Reminder("집에 도착하면 알림")
- 일정 연동 자동 Reminder 생성
- 우선순위/카테고리 태깅

# References

- Backend: (구현 없음 — 착수 시 문서화 필요)
- Frontend: (구현 없음 — [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-004(Todo)와 유사하게 미구현)
- Strategy: [docs/roadmap/roadmap.md](../../docs/roadmap/roadmap.md) (Phase 1), [docs/roadmap/mvp.md](../../docs/roadmap/mvp.md) (Tier 1)
- Requirement: 아직 없음 — 이 Domain 정의를 근거로
  `requirements/dashboard_requirements.md` 또는 신규 Requirement 문서 작성이
  선행되어야 한다([requirements/README.md](../README.md) RDD 절차).
