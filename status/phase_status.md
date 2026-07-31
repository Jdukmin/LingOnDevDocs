# Phase Status

> Status/Progress 값 산정 근거는 [roadmap.md](roadmap.md)의 각 Phase
> "완료 조건" 절과, 실제 저장소의 `FRONTEND_VERIFICATION_REPORT.md`,
> `BACKEND_VERIFICATION_REPORT.md`, `FRONTEND_SCHEMA_VERIFICATION_REPORT.md`,
> `BACKEND_SCHEMA_VERIFICATION_REPORT.md`(각 저장소 루트)다. 값 정의는
> [../requirements/README.md](../requirements/README.md)를 따른다.

| Phase | Name | Status | Progress | 관련 Requirement | 관련 Version |
|---|---|---|---|---|---|
| 1 | Foundation | Done | 100% | (RDD 이전) | [backend/V0.0.4](backend/V0.0.4.md), [frontend/V0.0.4](frontend/V0.0.4.md) |
| 2 | Authentication | Done | 75% | SYS-008, CON-006 | [backend/V0.0.{7~11}](backend/), [frontend/V0.0.{7,8,10,11}](frontend/) |
| 3 | Dashboard | In Progress | 75%(DSH-004/006은 0%) | DSH-001~008 | [backend/V0.0.4](backend/V0.0.4.md), [frontend/V0.0.{4,5}](frontend/) |
| 4 | Calendar | Done | 75% | CON-001 | [backend/V0.0.{13,15,17}](backend/), [frontend/V0.0.{12,13,15,17}](frontend/) |
| 5 | Weather | Done*(P0 결함) | 75% | DSH-002 | [backend/V0.0.4](backend/V0.0.4.md), [frontend/V0.0.6](frontend/V0.0.6.md) |
| 6 | Intent Engine | Planned | 0% | INT-001~005 | 없음 |
| 7 | Memory (RAG) | Planned | 0% | MEM-001~005 | 없음 |
| 8 | Planner | Planned | 0% | PLN-001~005 | 없음 |
| 9 | Action Router | Planned | 0%(공용 Dispatcher 기준) | ACT-001~005 | 없음 |
| 10 | Connector (확장) | Planned | 0% | CON-002/003/004/005 | 없음 |
| 11 | Automation (Workflow) | Planned | 0% | 없음(domain_icd/workflow.md) | 없음 |
| 12 | V1.0 Release | In Progress | 25% | 없음(체크리스트) | [backend/V0.1.0](backend/V0.1.0.md), [frontend/V0.1.0](frontend/V0.1.0.md) |

\* Phase 5(Weather)의 "Done"은 정상 조회 경로에 한한다 — 에러 처리 경로에
사용자에게 원시 예외를 노출하는 P0 결함이 열려 있다
([current_status.md](current_status.md) §Risks 참고).

## Baseline 이후(V_0.1.0) 남은 Phase 간 의존 관계

```
Phase 1(Foundation) → Phase 2(Auth) → Phase 4(Calendar), Phase 5(Weather) → [V_0.1.0 Baseline, 현재]
                                                                                    ↓
                                                                        Phase 6(Intent Engine) → V_0.1.2
                                                                                    ↓
                                                Phase 7(Memory), Phase 8(Planner), Phase 9(Action Router), Phase 10(Connector) → V_0.5.0
                                                                                    ↓
                                                                        Phase 11(Automation) → V_1.0.0
                                                                                    ↓
                                                              Phase 12(V1.0 Release Readiness, Phase 1~11과 병행 진행 가능)
```

Phase 3(Dashboard)은 신규 투자 우선순위상 후순위이나 완전히 멈춘 것은
아니다 — DSH-004(Todo)/DSH-006(Visibility)는 여유가 있을 때 채운다
([docs/development_rules.md](../docs/development_rules.md) 규칙 9,
Action Layer 우선순위).

## 관련 문서

- [roadmap.md](roadmap.md) — Phase별 목표/완료 조건 상세
- [current_status.md](current_status.md) — Requirement 단위 상세 현황, Risk, TODO
- [backend/](backend/), [frontend/](frontend/) — 버전별 상세 변경 이력
- [BETA_RELEASE_STATUS_REPORT.md](BETA_RELEASE_STATUS_REPORT.md) — 이 표를
  "주요 기능"·"예상 Risk" 열을 추가해 Beta Release 관점으로 재정리한 종합 보고서
- [required_human_resource.md](required_human_resource.md) — Phase 10(Connector),
  Phase 12(V1.0 Release)와 연결된, AI가 대신할 수 없는 작업 목록
