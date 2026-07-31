# Theme Guide

> **2026-07-30 UI Redesign 반영 — 전체 재작성.** 이전 버전(Blue Accent
> `#2563EB`/Gold AI `#B45309`)은 실제 코드와 완전히 어긋나 있었다 — 코드는
> 이미 Green 계열로 이행한 상태였다(이번 리디자인과 무관한, 그 이전부터의
> drift). 이 문서는 `lib/core/utils/aod_colors.dart`,
> `lib/core/utils/aod_theme.dart`, `lib/core/design/app_card.dart`,
> `lib/core/design/app_typography.dart`, `lib/core/design/app_spacing.dart`
> (jdukmin/letmeknow 커밋 `ad0e0f4` "updated UI modules") 코드를 직접
> 대조해 작성했다 — 값 불일치 시 코드가 최종 출처다.

`lib/core/utils/aod_colors.dart` · `lib/core/utils/aod_theme.dart` ·
`lib/core/design/app_card.dart` · `lib/core/design/app_typography.dart` ·
`lib/core/design/app_spacing.dart`

---

## Theme Philosophy

LetMeKnow는 **Always-On AI Dashboard**다 — 사용자가 직접 조작하지 않아도
켜져 있는 화면을 통해 현재 상태를 계속 보여준다. Theme은 이 목적에 종속된
디자인 언어다.

| 원칙 | 의미 |
|---|---|
| **Calm Computing** | 색은 정보를 전달할 때만 쓴다. Green Accent는 인터페이스 면적의 ≤8%로 제한 — "눈에 띄면 그 자체로 의미"(active / AI / important / success)가 되도록. |
| **Information First** | 장식보다 가독성. 50–150cm 시청 거리(벽/책상 거치 태블릿)를 기준으로 타이포·명암비를 정한다. |
| **Dashboard 중심 UI** | 화면의 기본 단위는 Card다. 모든 위젯은 Card 위에 얹힌 정보이지, 자유 배치된 그래픽 요소가 아니다. |
| **High Readability** | 모든 텍스트 토큰은 WCAG 대비 기준(AA/AAA)을 실측하고 근거를 doc comment에 남긴다 — "괜찮아 보인다"가 아니라 계산된 수치로 판단한다. |

---

## Color Token

### Brand 3색

| 토큰 | Hex | 용도 |
|---|---|---|
| **Primary** | `#61CE70` | Dark 테마의 실제 `accent`. 브랜드 메인 그린. |
| **Secondary** | `#3FA956` | Dark 테마의 `success`(상태 신호 — 브랜드 accent와는 구분된 색상 축). |
| **Accent(container)** | `#DDF7E2` | Light 테마 `accentDim` — 옅은 민트 배경(배지/버튼 채움용), 텍스트/아이콘 색이 아니다. |

> **Primary/Secondary를 Light 테마에 그대로 적용하지 않는다.** 실측 결과
> `#61CE70`는 Light 배경(`#F7F8FA`) 위에서 ≈1.87:1, `#3FA956`는 ≈2.82:1로
> 3:1 컴포넌트 최저 기준조차 통과하지 못한다. Light 테마의 실제
> `accent`(`#1A7A40`, 5.1:1 AA)와 `success`(`#18823A`, 5.0:1 AA)는 기존
> 감사값을 그대로 유지한다 — 브랜드 색을 억지로 새로 밝게 조정해도 동일
> hue를 어둡게 내리면 기존값과 1% 이내로 수렴해, 바꿔봤자 실질적 이득 없이
> 코드만 흔드는 변경(churn)이 된다.

### Dark Theme (`AodColors.dark`)

WCAG 대비는 배경(`bg`) 기준 실측치(수작업 sRGB relative-luminance 계산,
자동 검증 도구 아님).

| 토큰 | Hex | 비고 |
|---|---|---|
| `bg` | `#101214` | 메인 캔버스, 화면의 ~62% |
| `surface` | `#17191C` | 사이드바/패널 존 |
| `bgElevated` | `#1E2227` | 모달/드롭다운 |
| `bgGlass` | `#101214` @ 75% | BackdropFilter 전용 |
| `card` | `#1E2125` | 카드 배경, 화면의 ~28% |
| `cardElevated` | `#262A2F` | 호버/선택 카드 |
| `surfaceHover` | `#2A3440` | 포인터 호버 |
| `surfaceSelected` | `#61CE70` @ 10% | 선택 상태 |
| `text` | `#FFFFFF` | 18.77:1 ✓ AAA |
| `textSub` | `#A7ADB5` | 8.31:1 ✓ AAA |
| `textDim` | `#5E7268` | 3.7:1 — ≥18sp 또는 ≥14sp bold 전용 |
| `accent` (Primary) | `#61CE70` | 9.46:1 ✓ AAA — 인터페이스 면적 ≤8% |
| `accentBright` | `#7AE890` | 호버/피크 강조 |
| `accentDim` | `#1C3A24` | 채움 컨테이너(버튼 배경) |
| `accentLime` | `#8AE06A` | 차트/그라디언트 |
| `accentHighlight` | `#50EE80` | 피크 밝기 — AI 강조 |
| `accentGlow` | `#61CE70` @ 14% | AI 카드 테두리, 활성 표시 |
| `success` (Secondary) | `#3FA956` | 6.27:1 ✓ AA |
| `warning` | `#F0A020` | — |
| `error` | `#FF5050` | — |
| `semanticInfo` | `#5B9CF6` | 파랑 — 정보 신호의 보편적 관습 유지 |
| `semanticNeutral` | `#6A7870` | — |
| `aiAccent` | `#50EE80` | AI Brief 스파클 전용, accent와 구분 |
| `divider` | `#30343A` | **불투명 실색상** — 이전 반투명 alpha에서 변경(아래 참고) |
| `border` | `#FFFFFF` @ 8% | 카드 테두리 |
| `borderMed` | `#FFFFFF` @ 12% | 모달 테두리 |

### Light Theme (`AodColors.light`)

| 토큰 | Hex | 비고 |
|---|---|---|
| `bg` | `#F7F8FA` | 메인 캔버스 |
| `surface` | `#EFEEEC` | 패널 존 |
| `bgElevated` | `#FAFAF8` | 모달 |
| `bgGlass` | `#F7F8FA` @ 82% | BackdropFilter 전용 |
| `card` | `#FFFFFF` | 카드 배경 |
| `cardElevated` | `#F8F7F5` | 호버 카드 |
| `surfaceHover` | `#EEECEA` | 포인터 호버 |
| `surfaceSelected` | `#1A7A40` @ 7% | 선택 상태 |
| `text` | `#191F28` | 15.57:1 ✓ AAA |
| `textSub` | `#6B7684` | 4.34:1 — **AA 4.5:1 기준 살짝 미달**. ≥18sp 또는 bold 텍스트(3:1 기준)에서만 사용, 일반 본문 텍스트에는 쓰지 않는다. |
| `textDim` | `#8A8E88` | 3.9:1 — large text AA |
| `accent` | `#1A7A40` | 5.1:1 ✓ AA — Primary 그대로 적용 시 실패(위 Brand 3색 절 참고)로 유지된 값 |
| `accentBright` | `#28C460` | 호버/활성 |
| `accentDim`(Accent container) | `#DDF7E2` | 옅은 민트 컨테이너 |
| `accentLime` | `#3AAA52` | 보조 라임 |
| `accentHighlight` | `#28C460` | `accentBright`와 동일 |
| `accentGlow` | `#1A7A40` @ 8% | 활성 테두리 |
| `success` | `#18823A` | 5.0:1 ✓ AA — Secondary 그대로 적용 시 실패(≈2.82:1)로 유지된 값 |
| `warning` | `#C87600` | 4.8:1 ✓ AA |
| `error` | `#CC2424` | 5.1:1 ✓ AA |
| `semanticInfo` | `#1A6EC8` | 4.6:1 ✓ AA |
| `semanticNeutral` | `#686E68` | — |
| `aiAccent` | `#28C460` | Light 모드 AI 그린 |
| `divider` | `#E5E8EB` | **불투명 실색상** — 아래 참고 |
| `border` | `#000000` @ 8% | 카드 테두리 |
| `borderMed` | `#000000` @ 12% | 모달 테두리 |

> **Divider 변경 참고**: 이전에는 배경 위에 얹히는 반투명 alpha(`5% white/black`)였다.
> 불투명 실색상 위에서는 시각적으로 거의 동일하지만, glass/gradient 표면
> 위에 겹칠 때는 기존 alpha처럼 배경에 섞이지 않는다 — glass 표면 위에
> divider를 쓰는 신규 UI가 있다면 유의한다.

### 실제 코드 접근 규칙

```dart
// 모든 build() 첫 줄에 반드시 작성합니다.
final c = context.aodColors;
```

- `AodTheme.xxx` 상수는 `_BootstrapScreen`의 `const` 컨텍스트 전용입니다.
  일반 위젯에서는 **절대 사용하지 않습니다.**
- 실제 hex 값은 `aod_colors.dart` 코드가 최종 출처입니다. 위 표는 참고용입니다.
- `AodColors.aiGold`는 `aiAccent`의 `@deprecated` 별칭입니다(기존 위젯
  호환용, 신규 코드에서 사용 금지).

### Surface 데코레이션 팩토리

카드 컴포넌트는 직접 `BoxDecoration`을 조립하지 않고 아래 팩토리를 사용한다.

| 팩토리 | Level | 용도 |
|---|---|---|
| `c.cardDecor` | 1 | 표준 정보 카드. `card` + `border`, 20px 고정 radius. |
| `c.cardElevatedDecor` | 2 | 호버/선택 카드. `cardElevated` + `borderMed`. |
| `c.aiCardDecor` | 1 + glow | Level 1 + `accentGlow` 테두리(1.5px) — AI/활성 위젯 전용. |
| `c.floatingDecor` | 3 | 모달/오버레이/사이드바. `bgElevated`, 2단 그림자. |

> 이 4개 팩토리는 모두 **20px 고정 radius**를 쓴다(아래 Shape System의
> `AppRadius.xl`과 동일) — 신규 [Card Component System](CardComponent.md)의
> tier별 radius(12/16/28dp)와는 별개의, 기존 위젯이 그대로 쓰고 있는 값이다.

---

## Shape System

`lib/core/design/app_spacing.dart`의 `AppRadius`.

| 토큰 | 값 | 용도 |
|---|---|---|
| `AppRadius.xs` | 6dp | 배지, 칩, 작은 태그 |
| `AppRadius.sm` | 8dp | 소형 위젯, 내부 요소 |
| `AppRadius.md` | 12dp | 컴팩트 카드, 시트 핸들 — **Small Card** |
| `AppRadius.lg` | 16dp | 위젯 카드 — **Medium Card**(spec 범위 16–20dp) |
| `AppRadius.xl` | 20dp | 기존 위젯 표준 카드(`cardDecor` 등) |
| `AppRadius.xxl` | 28dp | **Large Card**(spec 범위 24–32dp) — 이번에 신설된 유일한 신규 값 |
| `AppRadius.full` | 999dp | 필, 완전 원형 |

원칙:

- **Sharp Corner 금지** — 모든 표면은 위 토큰 중 하나로 라운드 처리한다.
- **Soft Rounded** — 화면 전체가 하나의 부드러운 표면 체계로 읽히도록 radius 단계를 통일한다.
- **Card 중심 Surface** — 새 컴포넌트를 만들 때 임의 radius 값을 쓰지 않고, 위 tier 중 하나에 대응시킨다.

### Elevation (`AppElevation`)

| Level | 이름 | 그림자 | Dark 모드 |
|---|---|---|---|
| 0 | Canvas | 없음 | — |
| 1 | Card | 없음(테두리만) | 그림자 없음 — border만으로 depth 표현 |
| 2 | Widget | 16 blur / y+4 | 동일 |
| 3 | Floating | 32+8 blur 2단 | 동일 |

Dark 모드에서는 Level 1 카드에 그림자를 넣지 않는다 — 어두운 표면 위 soft
shadow는 탁하게 뭉개져 보이기 때문에, depth는 border 색상 차이로만 표현한다.

---

## Typography System

`lib/core/design/app_typography.dart`. **두 개의 공존하는 스케일**이 있다 —
헷갈리지 않도록 구분해서 쓴다.

### 1) Hero Scale — 원거리 열람용(50–150cm 벽/책상 거치 태블릿)

이 앱의 근본 전제(Always-On, 원거리 열람)에 종속된 오버사이즈 타이포다.
Card 내부 컨텐츠용 스케일로 대체하지 않는다.

| 토큰 | 크기/굵기 | 용도 |
|---|---|---|
| `displayXl` | 72sp / w700 | 시계 hero. 150cm 거리에서도 판독 |
| `display` | 52sp / w600 | 기온 hero, 주요 수치. 120cm |
| `widgetValue` | 40sp / w600 | 보조 수치(습도, 풍속, 배터리) |
| `heading` / `headingLatin` | 26sp / w600 | 섹션 헤더, 카드 그룹 제목 |
| `title` | 18sp / w500 | 카드 제목, 위젯 헤더, 시계 인사말 |
| `body` / `bodyMedium` | 15sp / w400·w500 | 캘린더 이벤트명, AI 브리핑 본문 |
| `caption` | 12sp / w400 | 타임스탬프, 메타데이터 |
| `statusLabel` | 10sp / w600 | 상태 태그, 섹션 카테고리 라벨(항상 uppercase + tracking) |
| `numericDisplay`/`numericValue`/`numericCaption` | `display`/`widgetValue`/`caption`과 동일 크기 | 표 형태 숫자 정렬(tabular figures) 전용 |

### 2) Card-Content Scale — 카드 내부 컨텐츠용(2026-07-30 신설)

리디자인 스펙이 요구한 Display/Title/Heading/Body/Caption 제네릭 스케일을
그대로 적용하면 기존 hero 타이포(원거리 열람 전제)가 후퇴한다고 판단해,
**카드 내부 전용**의 더 작은 스케일로 추가했다. `body`/`caption`은 스펙의
15–16sp/12–13sp 범위와 이미 일치하므로 별도 토큰을 만들지 않았다(수치가
근소하게만 다른 중복 토큰을 피하기 위함).

| 토큰 | 크기/굵기 | 용도 |
|---|---|---|
| `cardDisplay` | 32sp / w700 | 카드 내부 KPI/"Main Number" 콜아웃(배터리 %, 상태 카운트 등) — hero 수치(`display`/`widgetValue`)가 아님 |
| `cardTitleLarge` | 22sp / w700 | 카드의 주 제목 — 기존 `title`(18sp/w500, 컴팩트 위젯 헤더용)보다 크고 진함 |
| `cardHeading` | 18sp / w600 | 카드 섹션 헤딩 — `title`과 크기는 같지만 weight가 다름(`title`은 의도적으로 더 가벼운 w500) |

### 폰트 규칙

| 용도 | 폰트 |
|---|---|
| 본문, 한국어 | `NotoSansKR` |
| 숫자, 라틴 레이블 | `Inter` |

---

## Card Component System

Small/Medium/Large 3단계 Card와 각 tier의 정의는
[CardComponent.md](CardComponent.md)를 참조한다. `AodColors.cardDecor` 등
기존 4개 팩토리는 이 시스템과 무관하게 그대로 유지된다 — 순수 추가(additive).
위젯 채택 여부(2026-07-31 갱신: 로컬 uncommitted working tree에서 7개 위젯
전부 채택 확인, `jdukmin/letmeknow`에는 아직 커밋 안 됨)는
[CardComponent.md](CardComponent.md) 참고.

## Widget Variant / Presentation Rule

Widget이 화면 형태(Vertical/Square/Horizontal)에 따라 다르게 렌더링하는
규칙은 [../widgets/WidgetPresentationRule.md](../widgets/WidgetPresentationRule.md)를 참조한다.

---

## 테마 모드 전환

| 단계 | 위치 |
|---|---|
| 상태 저장 | `_LingonAppState._themeMode` |
| 변경 요청 | `SidebarWidget.onSetTheme(mode)` |
| MaterialApp 적용 | `theme: _buildTheme(AodColors.light)`, `darkTheme: _buildTheme(AodColors.dark)` |
| 대안 진입 | `DevScreen` 외관 섹션 (StatusWidget 롱프레스) |

---

## 타이포그래피 규칙 (2026-07-31 기준 미검증 — 기존 내용 유지)

> 이번에 제공된 `aod_colors.dart`는 색상 토큰만 다룬다. 아래는 이전부터
> 있던 내용으로, 이번 검증 대상이 아니다 — 실제 폰트/크기 소스가 확인되면
> 갱신한다.

| 용도 | 폰트 | 크기 | Weight |
|------|------|------|--------|
| 본문, 한국어 | `NotoSansKR` | 12~14 | 400~600 |
| 숫자, 레이블 | `Inter` | 9~14 | 600~700 |
| 섹션 레이블 | `Inter` | 9~10 | 700 |
| 섹션 레이블 자간 | — | `letterSpacing: 1.2~1.4` | — |

---

## 아이콘 규칙 (2026-07-31 기준 미검증 — 기존 내용 유지)

| 항목 | 값 |
|------|-----|
| 소형 아이콘 크기 | `12~16` |
| 인터랙티브 색상 | `c.accent` |
| 장식 색상 | `c.textDim` |
| AI 전용 색상 | `c.aiAccent`(구 `c.aiGold`, deprecated alias로 하위 호환) |
| 대안 진입 | `DevScreen` 외관 섹션(StatusWidget 롱프레스) |

---

## 문서 구조 결정

Color/Shape/Typography를 `ColorSystem.md`/`ShapeSystem.md`/`Typography.md`로
분리하지 않고 이 문서 한 곳에 유지했다 — 세 영역 모두 아직 분량이 크지
않고 서로 강하게 얽혀 있어(예: Card tier가 Shape와 Color 양쪽에 걸침)
분리가 탐색성을 높이기보다 참조를 늘리는 쪽에 가깝다고 판단했다. 각 영역이
독립적으로 커지면(예: Typography에 다국어/반응형 스케일이 추가되는 시점)
그때 분리를 재검토한다.
