# Tool Domain

> **Status**: Proposed · **Progress**: 25% · **Last Updated**: 2026-07-21 · **Owner**: Integrations/Connectors · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다 — 구현 수단(REST, Flutter State, DB Schema)은
[docs/icd/action_layer_api.md](../../docs/icd/action_layer_api.md),
[requirements/connector_requirements.md](../connector_requirements.md)를 본다.

**Progress 근거**: `Tool`이라는 이름의 도메인은 아직 없지만, 백엔드의
`BaseGateway`/`BaseProvider` 어댑터 패턴(`OpenWeatherAPI`, `GoogleAuthAPI`,
`GoogleCalendarAPI`)이 이미 이 Domain이 요구하는 계약과 상당히 유사하게
구현되어 있다 — 근거: [backend/docs/services/README.md](../../backend/docs/services/README.md).
다만 통합 카탈로그(어떤 Tool이 있는지 조회하는 창구)는 없고, Home
Assistant/NAS/Notion/Todo Tool은 전혀 없어 25%로 평가했다.

---

# Purpose

Tool은 "실제로 무언가를 실행하는" 유일한 계층이다. Action이 "무엇을 할지"
결정한다면, Tool은 "그것을 어떻게 외부 시스템에 실제로 요청할지"를 안다.
이 분리가 없으면 새 연동을 추가할 때마다 Action Domain 전체를 건드려야
한다 — Tool Domain은 확장성([docs/strategy/positioning.md](../../docs/strategy/positioning.md)의
"AI Operating Layer" 목표)의 핵심 전제조건이다.

# Domain Model

| Entity | 설명 |
|---|---|
| **Tool** | 하나의 외부 시스템에 대한 어댑터 정의(예: Google Calendar, Home Assistant, NAS, Prometheus, Notion, Todo). |
| **ToolCapability** | Tool이 지원하는 개별 동작(예: Google Calendar Tool의 `list_events`, `create_event`). |
| **ToolConnection** | 특정 User가 특정 Tool에 대해 맺은 연결/인증 상태(연결됨/안 됨/만료됨). |
| **ToolInvocation** | Action Domain이 Tool에게 보내는 1회 실행 요청. |
| **ToolResponse** | ToolInvocation에 대한 원시 응답(정규화 이전). |

# Responsibilities

**한다**
- 외부 시스템과의 실제 통신(인증, 요청, 응답 파싱)을 캡슐화한다.
- 자신이 지원하는 `ToolCapability` 목록을 선언한다(Action Domain이 조회 가능하도록).
- 사용자별 `ToolConnection` 상태를 관리한다(연결/해제/재인증).
- `ToolInvocation`을 받아 `ToolResponse`를 반환한다.

**하지 않는다**
- 어떤 Action이 자신을 호출했는지, 왜 호출되었는지 알지 못한다(Action → Tool
  단방향 의존 — Tool은 Action을 모른다).
- 여러 Tool에 걸친 실행 순서를 조율하지 않는다 — 이는 Workflow Domain의 책임이다.
- 사용자에게 직접 결과를 알리지 않는다 — Action Domain을 거쳐 Notification
  Domain으로 전달된다.
- Intent를 해석하지 않는다.

# State

`ToolConnection` 기준(개별 `ToolInvocation`은 Action Domain의 Execution State를 따름 — [action.md](action.md)).

> **정정 2026-07-22**: [action.md](action.md)/[workflow.md](workflow.md) State를
> 소문자 snake_case로 통일한 것과 동일하게, 이 표도 통일한다 — API 응답
> 예시([docs/icd/action_layer_api.md](../../docs/icd/action_layer_api.md)의
> `GET /v1/actions/types` `connection_status`)가 이 값을 그대로 쓴다.

| State | 의미 |
|---|---|
| `not_connected` | 사용자가 이 Tool을 연결하지 않음 |
| `connecting` | 인증/연결 절차 진행 중 |
| `connected` | 정상 연결됨, 실행 가능 |
| `expired` | 인증이 만료됨(재인증 필요) |
| `revoked` | 사용자 또는 외부 시스템에 의해 연결 해제됨 |

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `ToolConnected` | 사용자가 Tool 연결을 완료함 | User Domain(권한 갱신), Notification |
| `ToolConnectionExpired` | 인증 만료 감지 | Notification Domain(재인증 유도), Action Domain(해당 Tool 의존 Action 차단) |
| `ToolInvoked` | Action이 실행을 요청함 | (내부 로깅) |
| `ToolResponded` | 외부 시스템 응답 수신 | Action Domain(ExecutionResult 생성) |
| `ToolInvocationFailed` | 외부 시스템 오류/타임아웃 | Action Domain |

# Inputs

- Action Domain의 `ToolInvocation`(capability + 파라미터)
- 사용자의 연결/인증 절차 입력(OAuth 등 — 구현 수단은 [backend/docs/plugins/google-oauth.md](../../backend/docs/plugins/google-oauth.md) 참조)

# Outputs

- `ToolResponse`(Action Domain이 정규화해 `ExecutionResult`로 변환)
- `ToolCapability` 카탈로그(Action Domain의 Action Selection이 조회)
- `ToolConnection` 상태(User Domain, Notification Domain이 조회)

# Relationships

```
Action → Tool → External Service
```

- **Action Domain**: Tool의 유일한 호출자. Action은 Tool을 알지만 Tool은
  Action을 모른다(단방향)([action.md](action.md)).
- **User Domain**: `ToolConnection`은 항상 특정 User에 귀속된다([user.md](user.md)).
- **HomeAssistant / NAS Domain**: 둘 다 Tool의 구체적인 사례다 — Tool Domain은
  이들의 공통 계약(연결 상태, Capability 선언, Invocation/Response)을 정의하고,
  [homeassistant.md](homeassistant.md)/[nas.md](nas.md)는 그 계약을 채우는
  도메인별 세부사항을 정의한다.
- **Calendar / Reminder Domain**: 이 둘의 실행도 결국 Tool(Google Calendar 등)을
  통해 이루어진다([calendar.md](calendar.md), [reminder.md](reminder.md)).

# Future Extensions

- Tool Capability의 동적 등록(런타임에 신규 Tool 추가)
- Tool별 Rate Limit/Quota 정책 표준화
- ~~LLM Provider(OpenAI/Anthropic/Gemini/OpenRouter)도 Tool의 한 사례로 편입할지 검토~~
  → **결론(2026-08-01): 편입하지 않는다.** LLM Provider는 별도 Domain으로
  분리했다 — [llm.md](llm.md). 사유: (1) Tool의 `ToolConnection` 5-state는 OAuth
  연결 수명주기를 표현하는데 LLM은 API 키 유무만 있으면 되고, (2) Intent/Planner가
  Action을 거치지 않고 LLM을 직접 소비하며, (3) Provider 라우팅·폴백·비용·구조화
  출력이 범용 Tool 계약보다 풍부하다. 두 Domain은 **형제 관계**다(상하 아님).

# References

- Backend: [backend/docs/services/README.md](../../backend/docs/services/README.md)(`BaseGateway`/`BaseProvider`), [backend/docs/plugins/google-oauth.md](../../backend/docs/plugins/google-oauth.md)
- Frontend: (직접 대응 없음 — Tool은 Backend 개념)
- Strategy: [docs/strategy/positioning.md](../../docs/strategy/positioning.md), [docs/strategy/architecture.md](../../docs/strategy/architecture.md) (Layer 4)
- Requirement: [requirements/connector_requirements.md](../connector_requirements.md)
- API 구현(수단): [docs/icd/action_layer_api.md](../../docs/icd/action_layer_api.md) (`GET /v1/actions/types`)
