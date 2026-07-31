# Dashboard Domain

> **Status**: Proposed · **Progress**: 25% · **Last Updated**: 2026-07-30 · **Owner**: Frontend/UX · **Version**: 0.3.0-draft

비즈니스 계약만 정의한다. Flutter Widget 구현은
[frontend/docs/ui/AodDisplay.md](../../frontend/docs/ui/AodDisplay.md) 등에
있다. **Progress는 "이 Domain의 경계 정의를 코드가 실제로 지키고 있는가"가
아니라 "시각화 기능 자체의 구현도"를 뜻한다** — 근거:
[requirements/system_requirements.md](../system_requirements.md) SYS-001(25%,
개별 위젯은 다수 75%).

> **확장 2026-07-30 (LLM Adaptive Dashboard UI 구조 반영)**: Widget Variant /
> Widget Metadata / Layout Constraint 개념을 Domain Model에 추가한다(아래
> 근거: [dashboard_requirements.md](../dashboard_requirements.md) DSH-009~011).
> "Dashboard is the Product"(Dashboard가 제품이다) 문구는 **반영하지 않았다** —
> [docs/strategy/product.md](../../docs/strategy/product.md) Core Philosophy("Dashboard는
> 제품이 아니다. Action Layer가 제품이다.")와
> [docs/decisions/architecture_decisions.md](../../docs/decisions/architecture_decisions.md)
> DEC-001(Adopted, "Dashboard는 MVP가 아니다")이 이미 정반대 결론을 Adopted
> 상태로 채택하고 있어, 사용자 확인 결과 기존 SSOT를 유지하기로 결정했다.
> 이번 확장은 그 경계 안에서 Layer 3(Always-On Dashboard)의 다중 Device 대응
> 기술 구조만 정의한다.

---

# Purpose

Dashboard는 사용자가 **묻지 않아도** 현재 상태를 볼 수 있게 하는 창이다.
[docs/strategy/product.md](../../docs/strategy/product.md) Core Philosophy —
"Dashboard는 제품이 아니다. Action Layer가 제품이다. Dashboard는 Action
Layer를 시각화하는 인터페이스일 뿐이다" — 를 그대로 이 Domain의 존재
이유로 삼는다. 이 문서의 가장 중요한 역할은 **기능 정의보다 경계 설정**이다.

# Domain Model

| Entity | 설명 |
|---|---|
| **DashboardView** | 하나의 화면 구성(현재는 3컬럼 태블릿 레이아웃 1종. 향후 LayoutConstraint별 복수 구성). |
| **Widget** | DashboardView를 구성하는 개별 시각화 단위(Clock, Weather, Calendar, Brief, Chat, Status 등). |
| **WidgetVariant** | 동일 Widget이 화면 비율/정보량에 따라 갖는 표시 형태(Vertical / Square / Horizontal). Business Logic이 아니라 순수 표시 형태 선택이다. |
| **WidgetMetadata** | WidgetVariant를 선택하기 위해 각 Widget이 노출하는 서술 가능한 속성 집합(아래 표). |
| **LayoutConstraint** | 특정 Device 이름이 아니라 화면 제약 조건(컬럼 수, Widget 수용량, 정보 밀도 등)으로 정의되는 레이아웃 규칙 집합. |
| **LayoutDirective** | AI Decision Layer(Planner)가 발행하는 Layout 조정 지시(Module 우선순위, Widget 밀도/크기). Dashboard는 이를 **구독**할 뿐 직접 생성하지 않는다. |
| **WidgetState** | 특정 Widget이 구독하는, 다른 Domain이 발행한 "최신 상태" 스냅샷. |

### WidgetVariant 정의

| Variant | 대상 | 특징 |
|---|---|---|
| **Vertical** | 긴 세로형 Mobile | 적은 정보량, 빠른 확인, 좁은 width 대응 |
| **Square** | Tablet, Dashboard Grid | 균형 정보량, 일반 Dashboard 카드 |
| **Horizontal** | Desktop, Wide Display | 많은 정보량, 상세 정보 표시 |

> 초기 검토안에서 쓰인 "Compact/Standard/Expanded" 3단계 명칭은 이 표의
> Vertical/Square/Horizontal로 통일한다 — 아래 `WidgetMetadata.aspect_ratio`
> 필드와 1:1로 대응시키기 위함이며, 두 명칭 체계를 동시에 쓰지 않는다.

### WidgetMetadata 필드

| 필드 | 설명 |
|---|---|
| `widget_id` | Widget 고유 식별자 |
| `module_id` | 데이터를 공급하는 Module(BaseModule) 식별자 |
| `aspect_ratio` | 지원 WidgetVariant(Vertical/Square/Horizontal) |
| `information_density` | 표시 정보량 수준(low/medium/high) |
| `supported_device` | 지원 Device 분류(Mobile Portrait/Square Display/Tablet/Desktop) |
| `min_size` / `max_size` | 축소/확대 가능 범위 |
| `priority` | 동일 화면 내 배치 우선순위 |
| `interaction_level` | 사용자 상호작용 정도(read-only/tap/expand 등) |

이 Metadata는 LLM/Planner가 자연어 요청(예: "일정과 날씨를 크게 보여줘")을
Widget 선택 파라미터로 변환할 수 있도록 존재한다 — Metadata를 해석해 실제
선택을 "판단"하는 주체는 Dashboard가 아니라 Planner다(아래 Responsibilities
참고).

### LayoutConstraint 정의

Device 이름이 아니라 제약 조건(Constraint Set)으로 정의한다. **책임 범위**:
LayoutConstraint는 "어떤 레이아웃 제약이 존재하는가"만 정의한다 — "어떻게
렌더링할 것인가"는 정의하지 않는다(그건 WidgetVariant의 책임).

| Constraint Set | 대상 | 파라미터 |
|---|---|---|
| **Mobile Portrait** | 세로형 Mobile | `max_columns`, `widget_count`, `preferred_ratio`, `information_density`, `spacing`, `supported_widget_variant` |
| **Square Display** | 정사각 Display | `max_columns`, `widget_count`, `preferred_ratio`, `information_density`, `spacing`, `supported_widget_variant` |
| **Tablet** | Tablet(현재 유일하게 구현된 대상, [dashboard_requirements.md](../dashboard_requirements.md) DSH-005) | `column_count`, `widget_capacity`, `preferred_widget_ratio`, `supported_widget_variant` |
| **Desktop** | Desktop/Wide Display | `grid_size`, `widget_capacity`, `expanded_information`, `supported_widget_variant` |

`supported_widget_variant`(신규, 2026-07-30 Phase 5.3 준비): 해당 Constraint
Set이 수용 가능한 WidgetVariant 목록. WidgetVariant 정의의 대상 매핑을
그대로 기본값으로 쓴다:

| Constraint Set | supported_widget_variant 기본값 |
|---|---|
| Mobile Portrait | `[Vertical]` |
| Square Display | `[Square]` |
| Tablet | `[Square]` |
| Desktop | `[Horizontal]` |

이 필드가 없으면 WidgetMetadata가 선호하는 Variant와 실제 화면이 수용
가능한 Variant를 대조할 방법이 없었다 — 아래 Widget Placement Rule이 이
필드를 전제로 한다.

### Widget Placement Rule

WidgetMetadata(Widget이 선호하는 표시 형태)와 LayoutConstraint(화면이 수용
가능한 형태) 사이의 결정 규칙. 예: WidgetMetadata가 "horizontal 선호"인데
현재 LayoutConstraint(Mobile Portrait)의 `supported_widget_variant`가
`[Vertical]`뿐이면 어떻게 할지 정의해야 한다.

```
selected_variant = WidgetMetadata.aspect_ratio ∩ LayoutConstraint.supported_widget_variant

if selected_variant is non-empty:
    가장 우선순위 높은 교집합 Variant로 렌더링
else if WidgetMetadata가 차선 Variant(priority/min_size 기준)를 지원:
    차선 Variant로 대체 렌더링
else:
    Widget을 배치하지 않음(에러 아님 — DSH-006 Widget Visibility와 동일하게
    "숨김" 취급)
```

이 규칙 자체는 Business Logic이 아니라 **표시 형태 선택 로직**이다 —
"이 데이터를 보여줘도 되는가" 같은 판단(Business Logic)과는 다르다. 상세
Requirement: [requirements/dashboard_requirements.md](../dashboard_requirements.md)
DSH-012.

# Responsibilities

**한다**
- 다른 Domain(Action, Calendar, Notification 등)이 발행한 상태를 구독해
  화면에 표시한다.
- Widget의 배치/레이아웃/표시 여부를 관리한다.
- 사용자 입력(탭, 롱프레스 등)을 받아 **화면 전환**만 수행한다(예: 사이드바
  열기, DevScreen 이동).

**절대 하지 않는다**
- **Business Logic**을 포함하지 않는다 — "이 데이터가 유효한가", "이 작업을
  해도 되는가" 같은 판단은 전부 다른 Domain의 몫이다.
- **Intent**를 생성하거나 해석하지 않는다 — 자연어 처리는 Chat UI를 통해
  Intent Domain으로 직접 전달되고, Dashboard는 그 결과만 반영한다.
- **Execution**을 수행하거나 트리거하지 않는다 — Dashboard의 어떤 조작도
  직접 Tool을 호출하거나 Action을 실행하지 않는다(예외적으로 "다시 시도"
  버튼조차, 실제로는 Action Domain에 새 ActionRequest를 보내는 것이지
  Dashboard가 실행 로직을 갖는 것이 아니다).
- 데이터를 가공/집계하지 않는다(단순 표시만) — 집계가 필요하면 그 로직은
  발행하는 Domain(Action History 등)에 있어야 한다.
- **자연어 요청을 Layout Preference로 해석하지 않는다** — "출장 중에는 일정과
  날씨를 크게 보여줘" 같은 자연어를 구조화된 Layout 조정값으로 바꾸는 판단은
  AI Decision Layer(Planner, [planner_requirements.md](../planner_requirements.md)
  PLN-006)의 책임이다. Dashboard는 Planner가 발행한 `LayoutDirective`를
  구독해 WidgetVariant/LayoutConstraint 선택에 반영할 뿐, 스스로 자연어를
  해석하거나 LLM을 직접 호출하지 않는다.

# State

Dashboard 자체는 비즈니스 State를 갖지 않는다. 오직 **UI 상태**만 갖는다:

> **정정 2026-07-23 (DevDocs SSOT 정리)**: [action.md](action.md) 등이 정한
> 소문자 snake_case 표기로 통일한다(이전 버전은 PascalCase).

| State | 의미 |
|---|---|
| `idle` | 기본 표시 상태 |
| `loading` | 구독 중인 Domain의 데이터를 기다리는 중(예: 날씨 API 호출 중) |
| `stale` | 마지막으로 받은 데이터가 오래됨(갱신 실패 등) |

# Events

Dashboard는 이벤트를 **발행하지 않는다**(순수 소비자). 구독하는 이벤트:

| 구독 Event | 발행 Domain |
|---|---|
| `ExecutionStarted` / `ExecutionCompleted` / `ExecutionFailed` | Action |
| `CalendarEventCreated/Updated/Deleted` | Calendar |
| `ReminderScheduled` | Reminder |
| `NotificationDelivered` | Notification |
| `ToolConnectionExpired` | Tool |
| `LayoutDirectiveIssued` | Planner(AI Decision Layer) — Future Extension, [planner_requirements.md](../planner_requirements.md) PLN-006 |

# Inputs

- 다른 모든 Domain이 발행하는 "최신 상태" 스냅샷(읽기 전용 구독)
- 사용자의 화면 조작(탭/롱프레스 — 화면 전환 목적에 한함)

# Outputs

- 렌더링된 UI(그 자체로는 다른 Domain에 아무것도 반환하지 않음)
- 화면 전환 신호(다른 화면으로 이동)

# Relationships

```
Action / Calendar / Reminder / Notification / Tool / Planner(LayoutDirective, Future Extension)
              ↓ (읽기 전용 구독)
          Dashboard
```

Dashboard는 이 Domain ICD 안에서 **유일하게 다른 Domain에 아무것도 발행하지
않는** Domain이다 — 모든 화살표가 Dashboard로 들어오기만 한다. 이것이 이
Domain의 경계를 지키는 핵심 규칙이다.

# Future Extensions

- Widget Visibility(표시/숨김) — [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-006
- Widget Variant / WidgetMetadata Schema(Vertical/Square/Horizontal 표시 형태 분리) —
  [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-009, DSH-010
- LayoutConstraint 기반 다중 Device 대응(Mobile Portrait/Square Display/Tablet/Desktop) —
  [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-011
- Widget Placement Rule(WidgetMetadata ↔ LayoutConstraint 충돌 해소) —
  [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-012
- AI 기반 레이아웃 조정 — 단, 조정 "판단"은 AI Decision Layer(Planner)가
  [planner_requirements.md](../planner_requirements.md) PLN-006(Layout Preference
  Generation)을 통해 수행하고, Dashboard는 그 결과(`LayoutDirective`)를 구독해
  표시만 한다(경계 유지) — [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-007

# References

- Backend: (직접 대응 없음 — Dashboard는 순수 Frontend 개념). 2026-07-30
  WidgetVariant/WidgetMetadata/LayoutConstraint 확장이 Backend 계약(API
  ICD/DB Schema)에 영향 없음을 실제 Backend 소스 검토로 확인함 —
  [verification/backend/2026-07-30-dashboard-widget-layout-icd-impact-review.md](../../verification/backend/2026-07-30-dashboard-widget-layout-icd-impact-review.md)
- Frontend: [frontend/docs/ui/AodDisplay.md](../../frontend/docs/ui/AodDisplay.md), [frontend/docs/state/Overview.md](../../frontend/docs/state/Overview.md), `frontend/docs/widgets/*`
- Strategy: [docs/strategy/product.md](../../docs/strategy/product.md) (Core Philosophy), [docs/strategy/architecture.md](../../docs/strategy/architecture.md) (Layer 3)
- Requirement: [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-009~012, [requirements/planner_requirements.md](../planner_requirements.md) PLN-006
- Testing: [docs/testing/dashboard_integration_verification.md](../../docs/testing/dashboard_integration_verification.md)
