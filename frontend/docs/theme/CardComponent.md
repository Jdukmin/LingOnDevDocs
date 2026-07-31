# Card Component System

`lib/core/design/app_card.dart` (2026-07-30 UI Redesign)

> **구현 상태(2026-07-31 코드 대조로 갱신) — Working Tree 기준, 미커밋**:
> `jdukmin/letmeknow` 저장소를 직접 대조한 결과, 대시보드 7개 위젯 전부가
> `SmallCard`/`MediumCard`/`LargeCard`를 쓰도록 마이그레이션된 코드가
> **로컬 작업 트리(uncommitted working tree)에 존재**한다 — `git diff HEAD`
> 기준 7개 위젯 파일 전부가 커밋 `ad0e0f4` 대비 대규모로 수정되어 있고,
> `grep`으로 각 파일의 `return SmallCard(...)` / `MediumCard(...)` /
> `LargeCard(...)` 호출을 확인했다. **단, 이 변경은 아직 `jdukmin/letmeknow`
> 저장소에 커밋되지 않았다** — `git log`상 `app_card.dart` 자체(컴포넌트
> 정의)는 `ad0e0f4`에 포함되어 있지만, 위젯들의 실제 채택은 그 이후의
> 미커밋 작업이다. 아래 매핑은 그 uncommitted 상태 기준이며, 커밋되어
> `jdukmin/letmeknow`의 "실제 코드"가 되기 전까지는 잠정 정보로 취급한다:
>
> | Tier | 위젯 |
> |---|---|
> | `SmallCard` | `ClockWidget`, `StatusWidget`, `WeatherNowWidget` |
> | `MediumCard` | `WeatherForecastWidget`, `CalendarWidget`, `ChatWidget` |
> | `LargeCard` | `BriefCardWidget` |
>
> `AodColors.cardDecor`/`cardElevatedDecor`(20px 고정 radius, [ThemeGuide.md](ThemeGuide.md))는
> 폐기되지 않았다 — 이 Card 컴포넌트들이 내부적으로 `AodColors`를 그대로
> 참조하므로 공존한다.

---

## 3단계 Tier

| Tier | 컴포넌트 | 용도 | 정보량 | 예시 |
|---|---|---|---|---|
| Small | `SmallCard` | Quick Status — 빠른 훑어보기 | Low | Weather, Battery, 단일 상태 행 |
| Medium | `MediumCard` | Dashboard Main Widget | Medium | Calendar, Reminder, AI Summary |
| Large | `LargeCard` | Primary Experience — 화면의 주 경험 | High | Daily Briefing, Timeline, AI Insight |

## Tier별 정의

| 속성 | Small | Medium | Large |
|---|---|---|---|
| Radius | `AppRadius.md` — 12dp | `AppRadius.lg` — 16dp (spec 범위 16–20dp) | `AppRadius.xxl` — 28dp (spec 범위 24–32dp) |
| Padding(기본) | `AppSpacing.cardPaddingTight` (16/12) | `AppSpacing.cardPadding` (24/20) | `EdgeInsets.all(AppSpacing.xxl)` — 24 전방향 |
| Information Density | Low | Medium | High |
| Usage Rule | 한눈에 읽히는 단일 값/상태 전용. 스크롤·탭 인터랙션을 넣지 않는다. | 위젯의 기본 형태. 카드 안에서 스크롤/탭 가능. | 화면당 1개 이내 권장 — 여러 개를 쓰면 "주 경험"이라는 의미가 희석된다. |

## 공통 동작

- 모든 tier는 `context.aodColors`를 직접 참조한다(`AodTheme` 상수 사용
  금지) — light/dark와 WCAG 대비 토큰([ThemeGuide.md](ThemeGuide.md))을
  자동으로 물려받는다.
- `elevated: true`를 넘기면 `card`/`border` 대신 `cardElevated`/`borderMed`
  조합을 쓴다(호버/활성 상태).
- Dark 모드에서는 그림자를 그리지 않는다(`AppElevation.none`) — border만으로
  depth를 표현한다. Light 모드는 tier별 `AppElevation` 프리셋(`card` /
  `widget` / `floating`)을 사용한다.
- `onTap`/`onLongPress`를 넘기면 `GestureDetector`로 감싸진다. 둘 다 없으면
  순수 `Container`.

```dart
// 사용 예 — 실제 위젯 코드와 동일한 패턴(예: ClockWidget)
SmallCard(
  child: WeatherSummaryRow(...),
)

MediumCard(
  elevated: isSelected,
  onTap: () => ...,
  child: CalendarEventList(...),
)
```

## 관련 문서

- Color/Radius 토큰 정의: [ThemeGuide.md](ThemeGuide.md)
- Widget이 Card를 조합하는 규칙: [../widgets/WidgetPresentationRule.md](../widgets/WidgetPresentationRule.md)
