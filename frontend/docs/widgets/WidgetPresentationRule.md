# Widget Presentation Rule

`lib/core/dashboard/widget_variant.dart` · `lib/core/dashboard/widget_metadata.dart` ·
`lib/core/dashboard/layout_constraint.dart` · `lib/core/dashboard/layout_resolver.dart` ·
`lib/core/dashboard/dashboard_widget_catalog.dart` (2026-07-30 UI Redesign)

> **DevDocs Update Required**: 이 문서가 다루는 `WidgetVariant`/
> `WidgetMetadata`/`LayoutConstraint`/`LayoutResolver` 개념은 코드
> (`lib/core/dashboard/*`, jdukmin/letmeknow 커밋 `ad0e0f4`)에는 이미
> 존재하지만, `requirements/domain_icd/dashboard.md`(현재 v0.1.0-draft)와
> `requirements/dashboard_requirements.md`(현재 DSH-001~008까지만 존재)에는
> 아직 반영되어 있지 않다. 이 문서는 **Frontend 구현 문서**로서 코드를
> 있는 그대로 설명할 뿐이며, Domain ICD/Requirement 정식 계약을 대신하지
> 않는다 — WidgetVariant를 Domain 차원의 정식 개념으로 다루려면
> `dashboard.md`/`dashboard_requirements.md`에 DSH-009~011급 항목을 추가하는
> 별도의 Domain ICD 패스가 먼저 필요하다.

---

## 원칙

> Widget = Module Data + Widget Variant + Card Component

Widget은 단순 Feature UI가 아니라, **Design System 기반 Presentation
Component**다 — 세 요소의 조합으로 정의된다:

| 요소 | 정의 | 관련 문서 |
|---|---|---|
| **Module Data** | `BaseModule`이 들고 있는 실제 상태/데이터 | `docs/frontend/docs/state/Overview.md` |
| **Widget Variant** | 이 Widget이 지금 어떤 화면 형태로 렌더링되는가 | 아래 |
| **Card Component** | 이 Widget을 감싸는 Surface(Small/Medium/Large) | [../theme/CardComponent.md](../theme/CardComponent.md) |

> **현재 코드 상태(2026-07-31 코드 대조로 갱신) — Working Tree 기준, 미커밋**:
> Module Data + Widget Variant 결합은 커밋 `ad0e0f4` 기준으로도 사실이다.
> **Card Component 결합은 로컬 uncommitted working tree에서만 확인된다** —
> 7개 위젯 전부가 `SmallCard`/`MediumCard`/`LargeCard`를 쓰도록 수정된 코드가
> 존재하지만(Tier 매핑은 [CardComponent.md](../theme/CardComponent.md) 참고),
> 이 변경은 아직 `jdukmin/letmeknow`에 커밋되지 않았다. 따라서 이 문서 상단의
> 원칙("Widget = Module Data + Widget Variant + Card Component")은
> **커밋된 실제 코드 기준으로는 여전히 두 요소까지만** 사실이고, Card
> Component 결합은 로컬에만 존재하는 미확정 변경이다 — frontend 저장소에
> 커밋되는 시점에 이 구분을 다시 갱신해야 한다.

---

## Widget Variant

`enum WidgetVariant { vertical, square, horizontal }` — 화면 비율/정보 용량에
따라 선택되는 표시 형태. 순수 표시-형태 어휘이며 **Business Logic이 아니다**
— 어떤 Variant를 고를지 결정하는 주체는 항상 호출자다(현재: 하드코딩,
미래: `LayoutDirective`를 구독하는 `LayoutResolver`).

| Variant | 형태 | 대응 Device(코드 주석 기준) |
|---|---|---|
| `vertical` | 좁고 긴 형태 — 정보량 낮음, 빠른 훑어보기 | Mobile |
| `square` | 균형 잡힌 정보량 — **현재 유일하게 실사용되는 형태** | Tablet, Dashboard Grid |
| `horizontal` | 높은 정보량, 상세 표시 | Desktop, Wide Display |

그 외 관련 열거형(`lib/core/dashboard/widget_variant.dart`):

- `InformationDensity { low, medium, high }`
- `DeviceClass { mobilePortrait, squareDisplay, tablet, desktop }`
- `InteractionLevel { readOnly, tap, expand }`

## Widget별 실제 구현 상태

`AodDisplay`(`lib/screen/aod_display.dart`)가 `dashboard_widget_catalog.dart`의
`WidgetMetadata` + `LayoutConstraint.tablet()` + `LayoutResolver.resolve()`를
통해 각 위젯에 `variant`를 넘긴다(하드코딩된 Variant 선택을 대체). 7개 위젯
모두 `variant`를 실제로 받아 다르게 렌더링한다:

| Widget | vertical | square | horizontal |
|---|---|---|---|
| `ClockWidget` | 전용 레이아웃 | 전용 레이아웃(기본) | 전용 레이아웃 |
| `WeatherNowWidget` | 전용 레이아웃 | 전용 레이아웃(기본) | 전용 레이아웃 |
| `WeatherForecastWidget` | 세로 스택 | horizontal로 대체(전용 레이아웃 없음) | 가로 스크롤 스트립(기본) |
| `CalendarWidget` | 컴팩트 스크롤 카드 | 스크롤 카드(기본) | 가로 스크롤 카드 |
| `ChatWidget` | 기본 헤더 숨김 | 헤더 표시(기본) | 컴팩트 입력창 |
| `StatusWidget` | 전용 레이아웃 | 전용 레이아웃(기본) | 전용 레이아웃 |
| `BriefCardWidget` | `_BriefSummary` | `_BriefContent`(기본) | `_BriefBanner` |

> 모든 위젯의 기본값은 `WidgetVariant.square`다 — 이 태블릿 앱의 유일한
> 실제 배치가 3컬럼 Square Grid(`AodTabletLayout`)이기 때문이다.
>
> **참고(2026-07-31)**: 위 표는 커밋 `ad0e0f4` 기준 Variant 매핑이다.
> 로컬 uncommitted working tree에는 이보다 더 진행된 변경(각 위젯에
> Information Density 자동 조정, `BriefCardWidget`의 Density 기반 세부
> 분기 등)이 있으나, 이 문서가 다루는 범위(Widget Variant)를 벗어나는
> 별도 작업이라 이 표에는 반영하지 않았다 — 커밋 시점에 별도 패스로
> 갱신 필요.

## Layout 파이프라인

```
LayoutDirective → Layout Resolver → WidgetVariant Renderer → Flutter Widget
```

- **`LayoutDirective`(Planner가 발행)는 아직 존재하지 않는다** — 위
  DevDocs Update Required 참고, 대응 Requirement(`PLN-006`류)가 아직
  `requirements/`에 없다.
- **`LayoutConstraint`**(`layout_constraint.dart`): 디바이스별 화면 제약
  세트. 오늘 실제 값이 있는 건 `LayoutConstraint.tablet()` 하나뿐 —
  `mobilePortrait`/`squareDisplay`/`desktop`은 `DeviceClass` 열거형
  멤버로만 존재하고 구체 파라미터(컬럼 수, 위젯 수용량 등)는 정의되어
  있지 않다.
- **`LayoutResolver.resolve()`**(`layout_resolver.dart`): `LayoutConstraint` +
  `WidgetMetadata`를 받아 `LayoutDecision(variant, isSupported)`를 반환한다.
  비즈니스 판단 없이, 제약이 선호하는 Variant를 위젯이 지원하면 그것을,
  아니면 위젯 자신의 1순위 Variant를 반환한다. `isSupported`는 참고 정보일
  뿐 렌더링을 막지 않는다 — Dashboard는 "표시해도 되는가"를 판단하지
  않는다(`domain_icd/dashboard.md` Responsibilities).
- **`WidgetMetadata`**(`widget_metadata.dart`): 각 위젯이 자기 자신에 대해
  선언하는 정적 정보(`widgetId`, `moduleId`, 지원 `aspectRatio`,
  `informationDensity`, `supportedDevice`, `minSize`/`maxSize`, `priority`,
  `interactionLevel`). `dashboard_widget_catalog.dart`에 7개 위젯 전부의
  인스턴스가 정의되어 있다(`sidebar`는 제외 — Domain Model상 콘텐츠
  위젯이 아니라 설정 오버레이).

## 관련 문서

- Card Component 정의: [../theme/CardComponent.md](../theme/CardComponent.md)
- Color/Shape/Typography: [../theme/ThemeGuide.md](../theme/ThemeGuide.md)
- Dashboard Domain 경계: `requirements/domain_icd/dashboard.md`
