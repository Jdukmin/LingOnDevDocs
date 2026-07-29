# Architecture Decisions

전략적으로 중요한 설계 결정을 날짜와 함께 기록한다. 새 결정은 표 아래에
**추가만** 한다 — 기존 결정은 삭제하지 않고, 상태가 바뀌면 Status를
`Superseded`로 바꾸고 대체 결정을 링크한다.

"Progress"는 이 결정이 **실제 개발 우선순위에 얼마나 반영되었는지**를 뜻한다
(결정 자체의 완료율이 아니다) — 근거는 [requirements/](../../requirements/)의
Status/Progress를 인용한다.

---

| ID | Date | Decision | Reason | Status | Progress | Next Milestone |
|---|---|---|---|---|---|---|
| DEC-001 | 2026-07-21 | Dashboard는 MVP가 아니다 | 차별성이 없다 — DAKboard 등 순수 Dashboard 제품과 구분되지 않는다([../strategy/competitors.md](../strategy/competitors.md)) | Adopted | 0% | 신규 기능 제안 시 Dashboard 관련 항목을 후순위로 배치하는지 검토([../development_rules.md](../development_rules.md) 규칙 9) |
| DEC-002 | 2026-07-21 | Action Layer가 MVP이다 | PMF를 가장 빠르게 검증할 수 있다 — [../roadmap/kpi.md](../roadmap/kpi.md)의 Primary KPI(Daily Action Count)를 만들 수 있는 유일한 계층 | Adopted | 0% | Tier 0(Natural Language → Action) 착수 — [../../requirements/intent_requirements.md](../../requirements/intent_requirements.md) INT-001 |
| DEC-003 | 2026-07-21 | Integrations가 UI보다 우선이다 | Priority: Calendar → Todo → Reminder → Home Assistant → NAS → Workflow → Dashboard | Adopted | 25% | Reminder Requirement 정의, Todo(DSH-004) 착수 — [../roadmap/roadmap.md](../roadmap/roadmap.md) Phase 1 |

---

## 근거 노트

- **DEC-001 / DEC-002**: [requirements/system_requirements.md](../../requirements/system_requirements.md)
  기준 SYS-001(Dashboard)은 25%(개별 위젯은 다수 75%)로 가장 진도가 빠르고,
  SYS-004(Intent)·SYS-006(Action)은 0%다. 즉 지금까지의 실제 개발은 이
  두 결정과 반대 방향으로 진행되어 왔다 — 그래서 Progress를 0%(결정이 아직
  실행에 반영되지 않음)로 정직하게 표기했다. 이 결정 이후의 기능 개발부터
  반영 여부를 추적한다.
- **DEC-003**: Calendar는 백엔드 Google Calendar 연동이 부분적으로 존재하므로([requirements/connector_requirements.md](../../requirements/connector_requirements.md) CON-001)
  Priority 리스트의 첫 항목에 한해 약간의 진행이 있어 25%로 표기. 나머지
  항목(Todo/Reminder/Home Assistant/NAS/Workflow)은 0%.

## 결정 추가 방법

새 결정은 위 표에 새 행(`DEC-004`, ...)으로 추가하고, 이 섹션에 근거를
덧붙인다. 결정이 뒤집히면 해당 행의 Status를 `Superseded`로 바꾸고, 대체
결정 ID를 Reason 열 끝에 `(supersedes DEC-XXX)`로 표기한다.

## 관련 문서

- [../strategy/product.md](../strategy/product.md), [../strategy/architecture.md](../strategy/architecture.md)
- [../roadmap/roadmap.md](../roadmap/roadmap.md), [../roadmap/mvp.md](../roadmap/mvp.md)
- [../development_rules.md](../development_rules.md)
