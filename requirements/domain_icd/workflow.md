# Workflow Domain

> **Status**: Proposed · **Progress**: 0% · **Last Updated**: 2026-07-21 · **Owner**: Action Layer (Core) · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다 — 구현 수단은 [docs/icd/action_layer_api.md](../../docs/icd/action_layer_api.md)(Workflow
API), Requirement는 [requirements/planner_requirements.md](../planner_requirements.md)를 본다.

---

# Purpose

Workflow는 하나의 Intent가 여러 Action의 조합으로만 달성될 수 있을 때
필요하다(예: "퇴근 모드"). Workflow Domain이 없으면 LetMeKnow는 "한 번에
하나씩 시키는" 도구에 머무르고, [docs/strategy/positioning.md](../../docs/strategy/positioning.md)가
목표로 하는 "AI Operating Layer"로 확장할 수 없다.

# Domain Model

| Entity | 설명 |
|---|---|
| **Workflow** | 재사용 가능한 다단계 실행 계획 정의(이름 + step 목록). |
| **WorkflowStep** | Workflow를 구성하는 개별 단위 — 하나의 Action(또는 다른 Workflow)을 가리킨다. |
| **Trigger** | Workflow를 시작시키는 조건(사용자 명시적 요청, 시간, 이벤트 등). |
| **Condition** | 특정 Step 실행 여부를 좌우하는 조건식. |
| **WorkflowExecution** | Workflow 정의가 실제로 실행된 1회 인스턴스. |
| **RetryPolicy** | 실패한 Step을 재시도하는 규칙(횟수, 백오프). |
| **TimeoutPolicy** | Step 또는 전체 Workflow의 최대 허용 시간. |

# Responsibilities

**한다**
- 여러 `WorkflowStep`(Action 참조)의 실행 순서를 정의한다(Sequential/Parallel).
- Step 간 `Condition`(조건부 분기), `Trigger`(시작 조건)를 정의한다.
- Step 실패 시 `RetryPolicy`/`TimeoutPolicy`에 따라 재시도 또는 포기를 판단한다.
- 하나 이상의 Step이 되돌릴 수 없이 실패했을 때 이미 완료된 Step의 보상(rollback)을
  시도할지 결정한다.
- `WorkflowExecution`의 전체 진행 상태를 추적한다.

**하지 않는다**
- 개별 Action이 무엇을 하는지의 세부 로직을 알지 못한다 — Action Domain에
  위임한다(Workflow는 Action을 "블랙박스"로 다룬다).
- Tool을 직접 호출하지 않는다 — 항상 Action Domain을 경유한다.
- 자연어를 해석하지 않는다 — Intent Domain이 "여러 단계가 필요하다"고
  판단한 결과만 받는다.

# State

```
Pending → Running → (Succeeded | PartiallyFailed | Failed) → (RolledBack)?
```

| State | 의미 |
|---|---|
| `Pending` | 실행 대기 |
| `Running` | 하나 이상의 Step이 진행 중 |
| `Succeeded` | 모든 필수 Step 성공 |
| `PartiallyFailed` | 일부 Step 실패했지만 `on_failure: skip` 정책으로 계속 진행되어 종료됨 |
| `Failed` | 필수 Step 실패로 전체 중단 |
| `RolledBack` | 실패 후 완료된 Step들을 보상 처리함 |

개별 Step은 Action Domain의 Execution State([action.md](action.md))를 그대로 따른다.

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `WorkflowTriggered` | Trigger 조건 충족 | Action Domain(첫 Step 실행 요청) |
| `WorkflowStepStarted` / `WorkflowStepCompleted` / `WorkflowStepFailed` | 개별 Step 상태 전이 | Dashboard, History |
| `WorkflowCompleted` | 전체 종료(성공/부분실패) | Notification, History |
| `WorkflowRolledBack` | 보상 처리 완료 | Notification |

# Inputs

- Intent Domain이 다단계로 판단한 Intent(주 경로)
- 사용자가 명시적으로 저장/실행을 요청한 Workflow 정의
- 시간/이벤트 기반 Trigger(향후 확장)

# Outputs

- `WorkflowExecution` 상태 및 각 Step의 `ExecutionResult` 모음
- History Domain(Action Domain 경유)에 남는 Workflow 실행 기록

# Relationships

```
Intent → Workflow → Action(×N) → Tool → Execution → Notification
```

예시:

```
퇴근 모드 (Workflow)
  ├─ 에어컨 OFF     → Action → HomeAssistant Tool
  ├─ 조명 OFF       → Action → HomeAssistant Tool
  ├─ NAS Backup     → Action → NAS Tool
  └─ 내일 일정 브리핑 → Action → Calendar Tool
```

- **Action Domain**: Workflow는 Action을 재사용한다 — Action은 자신이
  Workflow의 일부인지 알 필요가 없다([action.md](action.md)).
- **Intent Domain**: 다단계가 필요하다는 판단은 Intent Domain에서 넘어온다([intent.md](intent.md)).
- **HomeAssistant / NAS / Calendar Domain**: Workflow의 대표 활용 사례(위 예시)이지만,
  Workflow 자체는 어떤 도메인의 Action이 포함되는지 알 필요가 없다.

# Future Extensions

- Workflow 템플릿 공유/마켓플레이스
- 조건식 DSL의 표준화(현재는 개념만 정의)
- 시간/이벤트 기반 자동 Trigger(현재는 사용자 명시적 실행만 고려)

# References

- Backend: (아직 구현 없음 — 착수 시 문서화)
- Frontend: (아직 구현 없음)
- Strategy: [docs/strategy/architecture.md](../../docs/strategy/architecture.md), [docs/roadmap/roadmap.md](../../docs/roadmap/roadmap.md) (Phase 4)
- Requirement: [requirements/planner_requirements.md](../planner_requirements.md)
- API 구현(수단): [docs/icd/action_layer_api.md](../../docs/icd/action_layer_api.md) (Workflow API)
