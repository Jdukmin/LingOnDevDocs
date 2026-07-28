# Roadmap

> **출처(SSOT)**: 이 문서는 새로운 계획을 만들지 않는다 — Phase 1~5는
> [docs/roadmap/roadmap.md](../docs/roadmap/roadmap.md)와
> [docs/roadmap/mvp.md](../docs/roadmap/mvp.md)에 이미 정의된 내용을 그대로
> 옮기고, `status/` 관점(완료 조건 명시, Version 연결)에서 재구성한 것이다.
> Phase 6은 기존 두 문서에 "Phase"로 명명되어 있지는 않았지만
> [docs/workflow.md](../docs/workflow.md)의 "출시 전 필수 체크리스트"와
> [status/README.md](README.md) §2.2 버전 정책(V1.0 전환)에 근거해 이 문서가
> 처음으로 Phase로 명명했다 — 아래 Phase 6 절에 그 사실을 명시했다.

전체 우선순위 원칙: **Action Layer > AI Decision > Integrations > Dashboard >
UI Polish** ([docs/development_rules.md](../docs/development_rules.md) 9번
규칙, [docs/strategy/architecture.md](../docs/strategy/architecture.md) Layer
우선순위). "Dashboard가 아니라 Action Layer가 제품이다"
([docs/strategy/product.md](../docs/strategy/product.md) Core Philosophy).

---

## Phase 1 — Action Pipeline & Core Integrations (Calendar / Todo / Reminder)

| 항목 | 내용 |
|---|---|
| **Status** | In Progress |
| **Progress** | 25% |
| **목표** | 자연어로 표현된 의도를 실제 Action으로 실행하는 최소 파이프라인(Tier 0)과, 가장 기본적인 생산성 커넥터(Calendar/Todo/Reminder, Tier 1)를 동시에 갖춘다. |
| **주요 기능** | Intent Classification(INT-001), `POST /v1/actions/execute` 최소 스캐폴딩, Google Calendar Action 연동(Frontend), Todo Domain 최초 구현, Reminder Domain 최초 구현 |
| **완료 조건** | (1) Tier 0: 자연어 1건이 Intent → Action 파이프라인을 실제로 통과, (2) Calendar: Frontend가 로컬 캘린더 대신 `GET /v1/calendar/events`를 호출, (3) Todo/Reminder: 각각 CRUD API + Domain ICD 계약을 만족하는 최소 구현 |
| **관련 Requirement** | [intent_requirements.md](../requirements/intent_requirements.md) INT-001~005, [connector_requirements.md](../requirements/connector_requirements.md) CON-001, [dashboard_requirements.md](../requirements/dashboard_requirements.md) DSH-003/004 |
| **관련 Domain ICD** | [calendar.md](../requirements/domain_icd/calendar.md), [todo.md](../requirements/domain_icd/todo.md), [reminder.md](../requirements/domain_icd/reminder.md), [intent.md](../requirements/domain_icd/intent.md), [action.md](../requirements/domain_icd/action.md) |
| **근거** | [docs/roadmap/roadmap.md](../docs/roadmap/roadmap.md) Phase 1, [docs/roadmap/mvp.md](../docs/roadmap/mvp.md) Tier 0/1 |

## Phase 2 — Home Assistant (IoT)

| 항목 | 내용 |
|---|---|
| **Status** | Planned |
| **Progress** | 0% |
| **목표** | 사용자의 물리적 공간(조명/온도/가전)을 Action Layer가 제어할 수 있게 한다. |
| **주요 기능** | Home Assistant Entity/Device/Scene 조회, `home_assistant.toggle_entity` 등 Action Type, HA Tool Connection 관리 |
| **완료 조건** | Home Network 접근 구조 결정(선행 조건) 이후, 최소 1개 Entity 제어가 Action Layer를 통해 실제로 동작 |
| **관련 Requirement** | [connector_requirements.md](../requirements/connector_requirements.md) CON-002 |
| **관련 Domain ICD** | [homeassistant.md](../requirements/domain_icd/homeassistant.md), [tool.md](../requirements/domain_icd/tool.md) |
| **근거** | [docs/roadmap/roadmap.md](../docs/roadmap/roadmap.md) Phase 2, [docs/roadmap/mvp.md](../docs/roadmap/mvp.md) Tier 2, [docs/workflow.md](../docs/workflow.md) 출시 전 체크리스트 "Home Network 접근 구조" |

## Phase 3 — NAS / Server Monitoring (Infrastructure)

| 항목 | 내용 |
|---|---|
| **Status** | Planned |
| **Progress** | 0% |
| **목표** | 사용자의 개인 인프라(파일 저장소, 백업, 서버 상태)를 Action Layer가 조회/제어할 수 있게 한다. |
| **주요 기능** | `nas.get_status`, `nas.run_backup` 등 Action Type, HealthStatus/StorageVolume 조회 |
| **완료 조건** | Home Network 접근 구조 결정(선행 조건, Phase 2와 공유) 이후, 최소 1개 NAS 상태 조회가 Action Layer를 통해 실제로 동작 |
| **관련 Requirement** | [connector_requirements.md](../requirements/connector_requirements.md) CON-004, CON-005 |
| **관련 Domain ICD** | [nas.md](../requirements/domain_icd/nas.md), [tool.md](../requirements/domain_icd/tool.md) |
| **근거** | [docs/roadmap/roadmap.md](../docs/roadmap/roadmap.md) Phase 3, [docs/roadmap/mvp.md](../docs/roadmap/mvp.md) Tier 3 |

## Phase 4 — Workflow / Multi-Action (Automation)

| 항목 | 내용 |
|---|---|
| **Status** | Planned |
| **Progress** | 0% |
| **목표** | 여러 Action을 의존성/조건/재시도/롤백과 함께 조합해 실행하는 Planner/Workflow 엔진을 갖춘다("퇴근 모드" 같은 다단계 자동화). |
| **주요 기능** | Task Planning(PLN-001), Dependency Analysis(PLN-002), Conditional Workflow(PLN-003), Retry(PLN-004), Rollback(PLN-005), `POST /v1/workflow/*` API |
| **완료 조건** | 2개 이상의 Tool(Domain)이 먼저 완료된 후 착수(선행 조건) — 최소 1개 Workflow 정의가 실제로 다단계 실행되고 실패 시 재시도/롤백 정책이 동작 |
| **관련 Requirement** | [planner_requirements.md](../requirements/planner_requirements.md) PLN-001~005 |
| **관련 Domain ICD** | [workflow.md](../requirements/domain_icd/workflow.md) |
| **근거** | [docs/roadmap/roadmap.md](../docs/roadmap/roadmap.md) Phase 4, [docs/roadmap/mvp.md](../docs/roadmap/mvp.md) Tier 4, [docs/icd/action_layer_api.md](../docs/icd/action_layer_api.md) Workflow API |

## Phase 5 — Always-On Dashboard (UI Polish)

| 항목 | 내용 |
|---|---|
| **Status** | In Progress |
| **Progress** | 25% (신규 투자 기준 — 개별 위젯 자체는 다수 75% 구현됨) |
| **목표** | 이미 구현된 Dashboard(Clock/Weather/Calendar/Brief/Chat/Status)를 유지·개선하되, **신규 투자는 다른 Phase보다 후순위**로 둔다([decisions/architecture_decisions.md](../docs/decisions/architecture_decisions.md) DEC-001). |
| **주요 기능** | Widget Visibility(DSH-006), AI 기반 레이아웃 조정(DSH-007, Planner Layer 선행 필요), Real-time Refresh(DSH-008) |
| **완료 조건** | Todo Widget(DSH-004), Widget Visibility(DSH-006) 구현 완료 — 단, Phase 1~4보다 낮은 우선순위로 진행 |
| **관련 Requirement** | [dashboard_requirements.md](../requirements/dashboard_requirements.md) DSH-004~008 |
| **관련 Domain ICD** | [dashboard.md](../requirements/domain_icd/dashboard.md) |
| **근거** | [docs/roadmap/roadmap.md](../docs/roadmap/roadmap.md) Phase 5, [docs/roadmap/mvp.md](../docs/roadmap/mvp.md) Tier 5, [docs/decisions/architecture_decisions.md](../docs/decisions/architecture_decisions.md) DEC-001 |

## Phase 6 — V1.0 Release Readiness

> **참고**: 이 Phase는 `docs/roadmap/roadmap.md`/`mvp.md`에는 "Phase"로
> 명명되어 있지 않다 — `docs/workflow.md`의 "출시 전 필수 체크리스트"
> (Infrastructure/Database/Security/Testing/Reliability)와
> [status/README.md](README.md) §2.2(V1.0 Semantic Versioning 전환 규칙)를
> 근거로 `status/roadmap.md`가 처음으로 Phase 6으로 구조화했다. 새로운
> 계획이 아니라 기존 체크리스트를 Phase 형태로 재배치한 것이다.

| 항목 | 내용 |
|---|---|
| **Status** | Not Started |
| **Progress** | 0% |
| **목표** | `V1.0.0` 출시 전 반드시 필요한 비-기능 요구사항(보안/인프라/DB/테스트/신뢰성)을 완료한다. |
| **주요 기능** | HTTPS/CORS/Cookie 속성 확정, DB Migration/Backup/Restore 절차 수립, Backend/Flutter 자동 테스트 도입, Privacy Policy/Terms 법률 검토, Deployment/Rollback SOP 확정 |
| **완료 조건** | `docs/workflow.md` 출시 전 체크리스트의 모든 항목이 "Done" 또는 "완료" 상태 |
| **관련 Requirement** | 없음(정책/운영 문서 — Requirement 형식이 아니라 체크리스트로 관리됨) |
| **관련 문서** | [docs/policies/](../docs/policies/)(Error/Logging/Security/Privacy), [docs/ops/](../docs/ops/)(Deployment/Data SOP, Monitoring) |
| **근거** | [docs/workflow.md](../docs/workflow.md) "출시 전 필수 체크리스트" |

---

## Phase 간 의존 관계

```
Phase 1 (Action Pipeline + Calendar/Todo/Reminder)
  ├─→ Phase 4 (Workflow — 2개 이상 Tool 완료 후)
  ├─→ Phase 2 (Home Assistant — Home Network 결정 후, Phase 1과 병행 가능)
  └─→ Phase 3 (NAS — Home Network 결정 후, Phase 1과 병행 가능)

Phase 2, Phase 3 → Phase 4 (Workflow는 완료된 Tool이 2개 이상 필요)

Phase 5 (Dashboard)는 다른 Phase와 독립적으로 유지보수만 진행(신규 투자 후순위)

Phase 6 (V1.0 Readiness)은 모든 Phase와 병행 가능 — 기능 완성도가 아니라
비-기능 요구사항이므로 특정 Phase 완료를 선행 조건으로 두지 않는다.
```

## 관련 문서

- [phase_status.md](phase_status.md) — 각 Phase의 현재 Status/Progress 표
- [current_status.md](current_status.md) — 프로젝트 전체 현재 상태
- [../docs/roadmap/roadmap.md](../docs/roadmap/roadmap.md), [../docs/roadmap/mvp.md](../docs/roadmap/mvp.md) — 이 문서의 원본 SSOT
- [../docs/roadmap/kpi.md](../docs/roadmap/kpi.md) — Phase 진행을 판단하는 성공 지표(Daily Action Count)
- [../requirements/domain_icd/domain_analysis.md](../requirements/domain_icd/domain_analysis.md) — Domain별 MVP/Phase2/Phase3 우선순위 분석(이 로드맵의 Domain-레벨 근거)
