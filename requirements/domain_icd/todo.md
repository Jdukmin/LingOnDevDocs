# Todo Domain

> **Status**: Proposed · **Progress**: 0% · **Last Updated**: 2026-07-22 · **Owner**: Integrations/Productivity · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다. `backend/docs`, `frontend/docs` 어디에도 대응
구현이 없다 — [domain_analysis.md](domain_analysis.md)에서 "로드맵 Tier
1(Calendar/Todo/Reminder)에 있는데 최초 11개 Domain 목록엔 빠져 있었다"고
지적된 항목이며, 이 문서가 최초 정의다.

---

# Purpose

Todo Domain은 "완료 여부가 있는 할 일"이라는 비즈니스 개념을 정의한다.
Reminder(특정 시각에 알림)와 달리 Todo는 **시간과 무관하게 완료 상태를
추적**하는 것이 핵심이다 — 이 둘을 하나로 합치면 "언제 할지 모르는 할 일"과
"정해진 시각에 알림만 필요한 것"을 구분할 수 없게 된다.

# Domain Model

| Entity | 설명 |
|---|---|
| **TodoItem** | 할 일 항목(제목, 완료 여부, 선택적 마감일, 우선순위). |
| **TodoList** | TodoItem을 묶는 선택적 그룹(예: "장보기", "업무") — MVP에서는 단일 기본 리스트만 지원할 수 있다(아래 Responsibilities 참고). |

# Responsibilities

**한다**
- "할 일"이라는 개념의 정규 스키마(제목/완료여부/마감일/우선순위)를 정의한다.
- 완료/미완료 전환 규칙을 정의한다.
- (MVP 이후) 여러 `TodoList`로 그룹화하는 방식을 정의한다 — MVP는 단일
  리스트만 다룬다(범위 최소화).

**하지 않는다**
- Reminder처럼 특정 시각에 알림을 발생시키지 않는다 — 마감일이 있어도
  자동 알림은 Reminder/Notification Domain의 책임이다([reminder.md](reminder.md)).
- 외부 Todo 서비스(Notion 등)와 동기화하지 않는다 — 필요해지면 Tool Domain에
  별도 연동을 추가한다([tool.md](tool.md) Future Extensions 참고).
- UI를 그리지 않는다 — Dashboard Domain의 책임이다.

# State

```
open → completed
open → cancelled
completed → open  (재오픈)
```

| State | 의미 |
|---|---|
| `open` | 미완료 |
| `completed` | 완료됨 |
| `cancelled` | 취소/삭제됨(이력은 남기되 목록에는 표시하지 않음) |

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `TodoCreated` | 항목 생성 | Dashboard(목록 갱신) |
| `TodoCompleted` | 완료 처리 | History, Dashboard |
| `TodoReopened` | 재오픈 | Dashboard |
| `TodoCancelled` | 취소/삭제 | History |

# Inputs

- Action Domain의 `todo.create` / `todo.complete` / `todo.reopen` / `todo.cancel` 등 실행 요청

# Outputs

- `TodoItem[]`(Action Domain의 ExecutionResult로 반환)
- Dashboard가 구독하는 "미완료 할 일" 요약

# Relationships

```
Action → Todo Domain
```

- **Action Domain**: `todo.*` Action Type의 비즈니스 규칙 출처([action.md](action.md)).
- **Reminder Domain**: 개념적으로 유사하지만 독립적 — 향후 "마감일 임박 Todo에
  자동 Reminder 생성" 같은 연계는 Workflow Domain을 통해 구성한다([reminder.md](reminder.md), [workflow.md](workflow.md)).
- **Dashboard Domain**: Todo 위젯(현재 미구현)이 이 Domain의 데이터를 시각화할 예정.

# Future Extensions

- 다중 `TodoList`(카테고리/프로젝트별 분류)
- 외부 Todo 서비스 연동(Notion 등, [tool.md](tool.md) 참고)
- 반복 Todo(매주/매일 등)
- 우선순위 기반 정렬/추천(AI Decision Layer 연계)

# References

- Backend: (구현 없음 — 착수 시 문서화 필요)
- Frontend: (구현 없음 — [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-004와 동일 상태)
- Strategy: [docs/roadmap/roadmap.md](../../docs/roadmap/roadmap.md) (Phase 1), [docs/roadmap/mvp.md](../../docs/roadmap/mvp.md) (Tier 1)
- Requirement: [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-004 — 이 Domain 정의를 근거로 전용 Requirement 문서 작성이 선행되어야 한다([requirements/README.md](../README.md) RDD 절차)
