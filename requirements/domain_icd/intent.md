# Intent Domain

> **Status**: Proposed · **Progress**: 0% · **Last Updated**: 2026-07-21 · **Owner**: Action Layer (Core) · **Version**: 0.1.0-draft

이 문서는 **비즈니스 계약(Contract)만** 정의한다. REST API, Flutter State, DB
Schema는 여기 적지 않는다 — 그런 것들은 이 Domain의 *구현 수단*일 뿐이다
(API 구현: [docs/icd/action_layer_api.md](../../docs/icd/action_layer_api.md),
Requirement 추적: [requirements/intent_requirements.md](../intent_requirements.md)).

---

# Purpose

Intent는 사용자의 자연어를 **실행 가능한 요청**으로 바꾸는 첫 관문이다. Intent
Domain이 없으면 자연어는 그저 텍스트일 뿐, 어떤 Action도 시작될 수 없다 —
[docs/strategy/product.md](../../docs/strategy/product.md)가 정의한 "사용자는
의도를 말하고, AI가 실행한다"는 미션은 이 Domain에서 시작된다.

# Domain Model

| Entity | 설명 |
|---|---|
| **Intent** | 사용자 메시지 1건에 대해 생성되는 구조화된 의도. 이 Domain의 핵심 산출물. |
| **Entity(개체)** | Intent 내부에서 추출된 개별 정보 조각(날짜, 장소, 대상 서비스 등). "Entity"라는 이름이 Domain Model의 Entity(개념)와 겹치므로, 이 문서에서는 소문자로 구분해 지칭한다. |
| **Parameter** | Action 실행에 필요한, 정규화된 키-값 형태의 입력 후보. |
| **Confidence** | Intent 분류/추출 결과에 대한 신뢰도(0.0~1.0). |
| **TargetServiceRef** | 이 Intent가 가리키는 것으로 추정되는 Tool/서비스 식별자(예: `calendar`, `home_assistant`). 실제 Tool 존재 여부는 Tool Domain이 판단한다. |
| **RequiredPermission** | 이 Intent를 실행하려면 사용자가 사전에 부여해야 하는 권한/연결 상태(예: "Google Calendar 연결 필요"). |

# Responsibilities

**한다**
- 자연어 메시지를 분류하고, Entity/Parameter를 추출한다.
- Confidence를 산출한다(모호하거나 정보가 부족하면 낮은 Confidence를 반환한다).
- 어떤 Tool/서비스가 이 Intent를 처리할 수 있는지 후보를 제시한다(`TargetServiceRef`).
- 이 Intent를 실행하기 위해 필요한 권한/연결 상태를 명시한다(`RequiredPermission`).

**하지 않는다**
- Action을 직접 실행하지 않는다 — 실행은 Action Domain의 책임이다.
- Tool을 직접 호출하지 않는다 — Tool 존재 여부/연결 상태 확인은 Tool Domain의 책임이다.
- 여러 Action의 순서/조건을 계획하지 않는다 — 이는 Workflow Domain의 책임이다(다수
  Action이 필요하다고 판단되면, 그 판단 자체까지만 하고 계획 수립은 넘긴다).
- 사용자에게 직접 응답하지 않는다 — 확인/피드백 UI는 Dashboard/Chat(Frontend)의 몫이다.

# State

Intent 자체는 실행 상태를 갖지 않는다(순간적인 산출물). 다만 하류(Action) 처리
결과에 따라 아래처럼 재분류될 수 있다.

> **정정 2026-07-23 (DevDocs SSOT 정리)**: 이전 버전은 PascalCase(`Created`
> 등)를 썼다 — [action.md](action.md)/[workflow.md](workflow.md)/[tool.md](tool.md)가
> 이미 소문자 snake_case로 통일한 것과 어긋났다. 아래처럼 소문자로 통일한다.

| State | 의미 |
|---|---|
| `created` | Intent가 생성된 직후 |
| `validated` | Action Domain이 실행 가능하다고 확인함 |
| `rejected` | Confidence 부족, 또는 필요한 권한 없음 등으로 실행 불가 판정 |
| `superseded` | 사용자가 후속 메시지로 의도를 정정/취소함 |

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `IntentCreated` | Intent가 생성됨 | Action Domain |
| `IntentRejected` | Confidence 미달 또는 권한 부족으로 반려됨 | Notification Domain(사용자에게 알림), Dashboard |
| `IntentSuperseded` | 사용자가 의도를 정정함 | Action Domain(진행 중이던 처리 취소) |

# Inputs

- 사용자 자연어 메시지(텍스트, 향후 음성 인식 결과 포함 가능)
- 대화 맥락(직전 메시지들 — Chat Domain/Frontend가 제공)
- 사용자의 현재 연결된 Tool 목록(Tool Domain 조회 결과, 후보 판단에 사용)

# Outputs

- `Intent` 객체: `{ entities[], parameters{}, confidence, target_service_ref, required_permission? }`
- Confidence가 임계값 미만이거나 필수 정보가 없을 경우: 명확화 질문(clarification)
  후보 — 사용자에게 무엇을 더 물어야 하는지에 대한 신호(전달 방식은 Frontend/Notification의 몫)

# Relationships

```
Natural Language → Intent → Action
```

- **Action Domain**: Intent는 Action의 유일한 시작점이다([action.md](action.md)).
- **Tool Domain**: Intent는 Tool의 존재/연결 여부를 참조만 하고 직접 호출하지 않는다([tool.md](tool.md)).
- **User Domain**: `RequiredPermission` 판단은 User Domain이 보유한 권한/연결 정보를 참조한다([user.md](user.md)).
- **Workflow Domain**: 여러 단계가 필요하다고 판단되면 Workflow Domain에 위임한다([workflow.md](workflow.md)).

# Future Extensions

- 다국어 Intent 분류
- 음성 입력 기반 Intent 생성(대응 Requirement: [requirements/chat_requirements.md](../chat_requirements.md) CHAT-003)
- 사용자별 Intent 학습(반복 패턴 기반 Confidence 보정) — [docs/strategy/architecture.md](../../docs/strategy/architecture.md) Layer 2(AI Decision)와 연계

# References

- Backend: (아직 구현 없음 — 착수 시 `backend/docs/plugins` 또는 신규 `backend/docs/intent/`에 문서화)
- Frontend: [frontend/docs/widgets/ChatWidget.md](../../frontend/docs/widgets/ChatWidget.md), [frontend/docs/services/LlmService.md](../../frontend/docs/services/LlmService.md)
- Strategy: [docs/strategy/architecture.md](../../docs/strategy/architecture.md) (Layer 1), [docs/strategy/product.md](../../docs/strategy/product.md)
- Requirement: [requirements/intent_requirements.md](../intent_requirements.md)
- API 구현(수단): [docs/icd/action_layer_api.md](../../docs/icd/action_layer_api.md)
