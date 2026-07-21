# HomeAssistant Domain

> **Status**: Proposed · **Progress**: 0% · **Last Updated**: 2026-07-21 · **Owner**: Integrations/IoT · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다. 이 Domain은 Tool Domain의 구체적 사례([tool.md](tool.md))다.
현재 프론트엔드에 UI 진입점 스텁만 있고 실제 연동은 없다 —
[requirements/connector_requirements.md](../connector_requirements.md) CON-002.

---

# Purpose

HomeAssistant Domain은 사용자의 물리적 공간(조명, 온도, 가전 등)을 Action
Layer가 제어할 수 있게 하는 IoT 접점이다. [docs/strategy/positioning.md](../../docs/strategy/positioning.md)의
"IoT" 영역을 담당하며, "퇴근 모드" 같은 대표 Workflow 사례([workflow.md](workflow.md))의
핵심 축이다.

# Domain Model

| Entity | 설명 |
|---|---|
| **Entity(HA)** | Home Assistant의 개별 제어 대상(조명, 스위치, 센서 등). 표준 HA 용어를 그대로 사용한다. |
| **Device** | 하나 이상의 Entity를 포함하는 물리적 장치. |
| **Scene** | 여러 Entity의 상태 조합을 미리 정의한 프리셋(예: "영화 모드"). |
| **Automation** | Home Assistant 자체에 정의된 자동화 규칙(LetMeKnow의 Workflow와는 별개 — 참조만 가능). |
| **Service(HA)** | Entity에 대해 호출 가능한 동작(예: `light.turn_on`). Home Assistant 용어이며, LetMeKnow의 Tool `ToolCapability`에 매핑된다. |
| **Trigger(HA)** | Home Assistant 쪽 상태 변화 감지 조건(향후 LetMeKnow가 구독할 수 있는 대상). |

# Responsibilities

**한다**
- Home Assistant의 Entity/Device/Scene 목록을 조회하고, LetMeKnow의
  `ToolCapability` 형태로 매핑한다.
- Entity 제어 요청(`Service` 호출)을 Home Assistant에 전달한다.
- Home Assistant 연결(로컬 네트워크 접근, 인증 토큰)의 상태를 `ToolConnection`
  형태로 관리한다([tool.md](tool.md)).

**하지 않는다**
- 어떤 Action/Intent가 자신을 호출했는지 알지 못한다(Tool Domain의 일반
  원칙을 그대로 따름).
- Home Assistant 자체의 `Automation`을 생성/수정하지 않는다(1단계 범위 —
  LetMeKnow의 Workflow가 이를 대체하는 것을 목표로 하되, 기존 HA Automation은
  읽기/참조 대상일 뿐).
- UI를 그리지 않는다 — Dashboard Domain의 책임이다.

# State

`ToolConnection` 상태([tool.md](tool.md))를 그대로 따르며, 추가로 개별
Entity 상태 캐시를 가질 수 있다:

| State | 의미 |
|---|---|
| `Unknown` | 아직 상태를 조회하지 않음 |
| `Synced` | 최근 상태를 성공적으로 조회함 |
| `Stale` | 마지막 조회 이후 갱신 실패 |

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `HomeAssistantConnected` / `Disconnected` | 연결 상태 변화 | Tool Domain, Notification |
| `EntityStateChanged` | HA 쪽 상태 변화 감지(향후) | Action Domain(조건부 Workflow Trigger 후보) |
| `ServiceCallSucceeded` / `Failed` | 제어 요청 결과 | Action Domain(ExecutionResult 생성) |

# Inputs

- Action Domain의 `home_assistant.*` ToolInvocation(예: `toggle_entity`, `get_state`)
- 사용자의 Home Assistant 연결 설정(URL, 토큰)

# Outputs

- 정규화된 Entity/Device/Scene 목록
- `ServiceCallResult`(Action Domain의 ExecutionResult로 변환)

# Relationships

```
Action → Tool → HomeAssistant Domain → Home Assistant 서버
```

- **Tool Domain**: HomeAssistant는 Tool의 한 구현 사례([tool.md](tool.md)).
- **Workflow Domain**: "퇴근 모드" 등 대표 Workflow의 구성 요소([workflow.md](workflow.md)).
- **Notification Domain**: 연결 끊김/센서 이상 등은 Notification으로 전달될 수 있다.

# Future Extensions

- Matter/MQTT 지원([docs/strategy/architecture.md](../../docs/strategy/architecture.md) Layer 4)
- SmartThings, Apple Home, Google Home 지원
- HA `Automation`/`Trigger` 구독을 통한 이벤트 기반 Workflow 시작

# References

- Backend: (구현 없음)
- Frontend: [frontend/docs/widgets/SidebarWidget.md](../../frontend/docs/widgets/SidebarWidget.md) (계정 연동 UI 스텁)
- Strategy: [docs/strategy/positioning.md](../../docs/strategy/positioning.md), [docs/roadmap/mvp.md](../../docs/roadmap/mvp.md) (Tier 2)
- Requirement: [requirements/connector_requirements.md](../connector_requirements.md) CON-002
