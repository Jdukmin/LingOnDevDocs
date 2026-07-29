# Action Layer Requirements

Parent Feature: [SYS-006 Action Execution](system_requirements.md). 구현 세부는
`backend/docs/routes`, `backend/docs/plugins`, `backend/docs/database`를 참조한다.

| ID | Parent Feature | Requirement | Description | Verification | Status | Progress |
|---|---|---|---|---|---|---|
| ACT-001 | SYS-006 | Action Dispatch | The system shall route an Action request (from the Planner or a direct API call) to the correct handler through a common Action dispatcher. | Review | Planned | 0% |
| ACT-002 | SYS-006 | CRUD Support | The system shall support Create/Read/Update/Delete operations for user-owned resources (settings, API keys, profile). | Integration Test | In Progress | 25% |
| ACT-003 | SYS-006 | Action Validation | The system shall validate an Action's input parameters before execution and reject invalid requests with a structured error. | Integration Test | In Progress | 25% |
| ACT-004 | SYS-006 | Execution Logging | Every Action execution shall be logged (request/response for HTTP actions; lifecycle/exceptions server-side). | Review | Done | 75% |
| ACT-005 | SYS-006 | Execution Result | Every Action shall return its result through a single, consistent response envelope (success/data/error). | Review | Done | 75% |

---

## 근거 노트 (Evidence)

- **ACT-001**: 백엔드는 Fastify 라우트를 기능별로 개별 등록하는 구조이며, Planner가
  호출할 수 있는 범용 Action Dispatcher/Router 추상화는 존재하지 않는다.
  근거: [backend/docs/routes/README.md](../backend/docs/routes/README.md).
- **ACT-002**: `PUT/GET /v1/settings/ai`, `/v1/settings/ui`, `PUT/DELETE /v1/apikey/:provider`,
  `PATCH /v1/users/me` 등 라우트별 CRUD는 구현되어 있으나, 이는 Architecture가
  의도하는 공통 Action Layer를 통한 것이 아니라 라우트마다 개별 구현된 것이라
  "부분 구현"으로 25%. 근거: [backend/docs/api/settings.md](../backend/docs/api/settings.md),
  [backend/docs/api/apikey.md](../backend/docs/api/apikey.md), [backend/docs/api/users.md](../backend/docs/api/users.md).
- **ACT-003**: 라우트별로 `AppError('BAD_REQUEST', 400, ...)` 검증이 개별
  구현되어 있으나 공통 Action Validation 계층은 없어 25%. 근거: 위와 동일.
- **ACT-004**: `request_logs`(응답당 1행), `raw_logs`(서버 lifecycle/예외)가
  전역 훅으로 구현되어 있어 모든 요청이 실제로 로깅된다. 백엔드 자체 FeatureList가
  "Current (implemented)"로 명시. 근거: [backend/docs/database/README.md](../backend/docs/database/README.md),
  [backend/docs/database/request_logs.md](../backend/docs/database/request_logs.md),
  [backend/docs/database/raw_logs.md](../backend/docs/database/raw_logs.md). 테스트 실행
  근거는 없어 100%가 아닌 75%.
- **ACT-005**: `AppError.plugin`을 통한 ICD v0.0 `{success, data, error}` 공통
  응답 envelope이 전역 적용되어 있음을 다수의 API 문서가 일관되게 보여준다.
  근거: [backend/docs/DevelopmentGuide.md](../backend/docs/DevelopmentGuide.md). 테스트
  실행 근거는 없어 75%.
