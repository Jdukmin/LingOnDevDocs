# Planner Layer Requirements

Parent Feature: [SYS-009 Automation Workflow](system_requirements.md). 이 Layer는
Architecture에서만 정의되어 있으며, 대응하는 구현 코드나 문서가 아직 존재하지 않는다.

| ID | Parent Feature | Requirement | Description | Verification | Status | Progress |
|---|---|---|---|---|---|---|
| PLN-001 | SYS-009 | Task Planning | The Planner shall convert a validated Intent into an ordered sequence of Actions. | Analysis | Planned | 0% |
| PLN-002 | SYS-009 | Dependency Analysis | The Planner shall determine execution order constraints (dependencies) between Actions in a plan. | Analysis | Planned | 0% |
| PLN-003 | SYS-009 | Conditional Workflow | The Planner shall support branching plans based on the result of a prior Action. | Test | Planned | 0% |
| PLN-004 | SYS-009 | Retry Strategy | The Planner shall retry a failed Action according to a configurable retry policy before failing the plan. | Test | Planned | 0% |
| PLN-005 | SYS-009 | Rollback Strategy | The Planner shall be able to undo/compensate completed Actions in a plan when a later Action fails irrecoverably. | Test | Planned | 0% |

---

## 근거 노트 (Evidence)

- **PLN-001 ~ PLN-005**: `backend/docs`, `frontend/docs` 어디에도 planner, workflow,
  plan, retry/rollback 오케스트레이션에 대한 코드·문서가 없다. 현재 백엔드는
  라우트별 단일 요청-응답 처리만 하며([action_requirements.md](action_requirements.md)
  참조), 다단계 계획 실행 개념 자체가 아직 없다. 전체 Planned/0%.
