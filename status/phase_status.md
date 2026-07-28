# Phase Status

> Status/Progress 값은 [roadmap.md](roadmap.md)에 옮겨 적은 것과 동일하며,
> 원본은 [docs/roadmap/roadmap.md](../docs/roadmap/roadmap.md)와
> [docs/roadmap/mvp.md](../docs/roadmap/mvp.md)다. 이 문서는 그 값에 "관련
> Version"(실제 Commit 이력)을 추가로 연결한 것이다. Status/Progress 값
> 정의는 [../requirements/README.md](../requirements/README.md)를 따른다
> ([status/README.md](README.md) §3.2 참고).

| Phase | Name | Status | Progress | 관련 Requirement | 관련 Version |
|---|---|---|---|---|---|
| 1 | Action Pipeline & Core Integrations (Calendar/Todo/Reminder) | In Progress | 25% | INT-001~005, CON-001, DSH-003/004 | [backend/V0.0.12](backend/V0.0.12.md)(Calendar 백엔드), [backend/V0.0.16](backend/V0.0.16.md)·[frontend/V0.0.16](frontend/V0.0.16.md)(Todo/Weather/Calendar Domain ICD, Calendar MVP 범위 축소) |
| 2 | Home Assistant (IoT) | Planned | 0% | CON-002 | 없음 — 착수 전 |
| 3 | NAS / Server Monitoring (Infrastructure) | Planned | 0% | CON-004, CON-005 | 없음 — 착수 전 |
| 4 | Workflow / Multi-Action (Automation) | Planned | 0% | PLN-001~005 | 없음 — 착수 전(Domain ICD만 [backend/V0.0.14](backend/V0.0.14.md) 시점에 정의됨) |
| 5 | Always-On Dashboard (UI Polish) | In Progress | 25%(신규 투자 기준, 개별 위젯은 다수 75%) | DSH-004~008 | [backend/V0.0.7](backend/V0.0.7.md)·[frontend/V0.0.7](frontend/V0.0.7.md)(최초 위젯 세트 전체) |
| 6 | V1.0 Release Readiness | Not Started | 0% | 없음(체크리스트 관리) | [backend/V0.0.16](backend/V0.0.16.md)(Policies/Ops SOP 최초 작성 — 체크리스트 자체의 기반 문서) |

## Cross-Phase / Foundational Version 연결

아래 버전들은 특정 Phase 하나에 속하지 않는 **기반(Platform) 작업**이거나,
Phase 1~6 자체를 정의한 **거버넌스 작업**이다 — 위 표에서 억지로 하나의
Phase에 배정하지 않고 별도로 기록한다.

| Version | 성격 | 근거 |
|---|---|---|
| [backend/V0.0.9](backend/V0.0.9.md), [backend/V0.0.11](backend/V0.0.11.md) + 대응 [frontend/V0.0.9](frontend/V0.0.9.md), [frontend/V0.0.11](frontend/V0.0.11.md) | User Domain(인증/세션) — 모든 Phase가 의존하는 기반. 특정 Phase의 "완료 조건"이 아니라 전제 조건 | [requirements/system_requirements.md](../requirements/system_requirements.md) SYS-008 |
| [backend/V0.0.14](backend/V0.0.14.md) + [frontend/V0.0.14](frontend/V0.0.14.md) | Personal Action OS 전략 전환 — `docs/strategy/`, `docs/roadmap/`, `requirements/domain_icd/`(11개 Domain), `docs/icd/`(Action Layer API 제안) 최초 작성. **이 로드맵(Phase 1~6) 자체가 이 버전에서 만들어진 문서를 근거로 한다** | [docs/decisions/architecture_decisions.md](../docs/decisions/architecture_decisions.md) DEC-001~003 |

## 관련 문서

- [roadmap.md](roadmap.md) — Phase별 목표/완료 조건 상세
- [current_status.md](current_status.md) — Requirement 단위 상세 현황
- [backend/](backend/), [frontend/](frontend/) — 버전별 상세 변경 이력
