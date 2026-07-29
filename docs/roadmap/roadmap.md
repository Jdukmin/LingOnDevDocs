# Roadmap

> **Status**: In Progress · **Last Updated**: 2026-07-21

우선순위 근거는 [../strategy/architecture.md](../strategy/architecture.md)의 Layer
우선순위, [../decisions/architecture_decisions.md](../decisions/architecture_decisions.md)의
"Integrations가 UI보다 우선이다" 결정을 따른다. Tier 단위 우선순위는
[mvp.md](mvp.md), 성공 지표는 [kpi.md](kpi.md)를 본다.

---

## 2026 목표 — Product Market Fit 검증

**최우선 목표**: 사용자가 자연어로 반복적으로 Action을 실행하는가.
**수익보다 PMF가 우선이다.**

PMF 판단 기준은 [kpi.md](kpi.md)의 Primary KPI(Daily Action Count)를 따른다.

---

## Phase 별 로드맵

Status/Progress는 대응하는 [requirements/](../../requirements/) 문서의 근거를
그대로 인용한 값이다 — 로드맵 문서에서 별도로 추측하지 않는다. Progress가
바뀌면 해당 Requirement 문서를 먼저 갱신하고, 이 표는 그 값을 따라 갱신한다.

| Phase | Features | Status | Progress | Last Updated | Next Milestone |
|---|---|---|---|---|---|
| Phase 1 | Calendar, Todo, Reminder | In Progress | 25% | 2026-07-21 | Reminder Requirement 정의 + Todo Requirement 착수(DSH-004) |
| Phase 2 | Home Assistant | Planned | 0% | 2026-07-21 | Home Assistant 커넥터 Requirement/설계 착수(CON-002) |
| Phase 3 | NAS, Server Monitoring | Planned | 0% | 2026-07-21 | 커넥터 프로토콜 설계(CON-004/CON-005) |
| Phase 4 | Workflow, Multi Action | Planned | 0% | 2026-07-21 | Planner Layer 최초 설계(PLN-001) |
| Phase 5 | Always-On Dashboard | In Progress | 25% | 2026-07-21 | (이미 가장 앞서 있음) Widget Visibility, AI Layout Update 정의 |

### Phase 1 — Calendar / Todo / Reminder

- Calendar: 위젯 자체는 이미 동작하지만 로컬 캘린더 기준이며, 전략 목표인
  "Google Calendar 연동"은 백엔드만 완료된 상태. 근거:
  [requirements/dashboard_requirements.md](../../requirements/dashboard_requirements.md) DSH-003,
  [requirements/connector_requirements.md](../../requirements/connector_requirements.md) CON-001.
- Todo: Requirement는 정의되어 있으나(DSH-004) 구현 근거 없음(0%).
- Reminder: 아직 전용 Requirement 문서가 없다 — Phase 1을 시작하려면
  [requirements/dashboard_requirements.md](../../requirements/dashboard_requirements.md) 또는
  Action Layer 쪽에 Reminder Requirement를 먼저 추가해야 한다([../../requirements/README.md](../../requirements/README.md)의 RDD 규칙).

### Phase 2 — Home Assistant

프론트엔드에 UI 진입점(스텁)만 있고 실제 HA REST API 연동은 없다. 근거:
[requirements/connector_requirements.md](../../requirements/connector_requirements.md) CON-002.

### Phase 3 — NAS / Server Monitoring

코드/문서 근거 없음. 근거: [requirements/connector_requirements.md](../../requirements/connector_requirements.md) CON-004, CON-005.

### Phase 4 — Workflow / Multi Action

Planner Layer 전체가 아직 없다. 근거: [requirements/planner_requirements.md](../../requirements/planner_requirements.md).

### Phase 5 — Always-On Dashboard

역설적으로 5개 Phase 중 **실제 구현이 가장 앞서 있는 Phase**다(위젯 다수 75%).
전략상 우선순위는 가장 낮지만, 이미 만들어진 것을 버리자는 뜻은 아니다 —
**신규 투자**를 이 Phase에 넣지 않는다는 의미다. 근거:
[requirements/dashboard_requirements.md](../../requirements/dashboard_requirements.md),
[../decisions/architecture_decisions.md](../decisions/architecture_decisions.md).

## 관련 문서

- [mvp.md](mvp.md) — Tier별 세부 우선순위
- [kpi.md](kpi.md) — 성공 지표
- [../../requirements/README.md](../../requirements/README.md) — Progress/Status 갱신 규칙(추측 금지)
