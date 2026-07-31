# Theme Guide

`lib/core/utils/aod_colors.dart`

---

> **정정 2026-07-31 (AodColors v2 재설계 — 실제 소스 기준 반영)**: 사용자가
> `aod_colors.dart` 전체 소스를 직접 제공해 검증했다. 클래스명은 여전히
> **`AodColors`**다 — `AppCard`/`AppTypography`/`AppSpacing`/`AppRadius`로
> 이름이 바뀌었다는 이전 세션의 주장은 **이 파일로는 확인되지 않는다**.
> Card Tier System(Small/Medium/Large), `WidgetPresentationRule` 등도
> 이 파일에 근거가 없어 문서화하지 않았다. 아래 내용은 오직 이 파일이
> 실제로 보여주는 것(색상 토큰 재설계)만 반영한다. Version:
> [version/frontend.json](../../../version/frontend.json) 0.1.0 → 0.1.1(Patch —
> Implementation change, 실제 소스로 검증됨).

## 색상 접근 규칙

```dart
// 모든 build() 첫 줄에 반드시 작성합니다.
final c = context.aodColors;
```

`AodTheme.xxx` 상수는 `_BootstrapScreen`의 `const` 컨텍스트 전용입니다.  
일반 위젯에서는 **절대 사용하지 않습니다.**

---

## Accent 철학 (2026-07-31 확인)

`aod_colors.dart` 클래스 doc comment 원문:

> Accent philosophy: Green appears at ≤8% of interface area.
> When green is seen, it means: active / AI / important / success.

Dark는 Charcoal-neutral 팔레트 + Green accent axis, Light는 Warm paper
팔레트(Apple/Notion 스타일) + Green brand로 명시되어 있다.

---

## AodColors 토큰 (실제 소스 기준, 2026-07-31 검증)

### Background depth layers

| 토큰 | Dark | Light | 용도 / 비고 |
|---|---|---|---|
| `bg` | `#101214` | `#F7F8FA` | 메인 캔버스(~62%). Dark는 재설계 스펙(이전 `#131618`), Light도 재설계 스펙(이전 `#F5F5F3`) |
| `surface` | `#17191C` | `#EFEEEC` | 사이드바/패널 여백. Dark는 재설계 스펙(이전 `#191C20`), Light는 변경 없음 |
| `bgElevated` | `#1E2227` | `#FAFAF8` | 모달/드롭다운/floating layer. 재설계 대상 아님(변경 없음) |
| `bgGlass` | `#101214` (75% opacity) | `#F7F8FA` (82% opacity) | Glass morphism 오버레이, `BackdropFilter`와 함께 사용 |

### Surface (card / widget)

| 토큰 | Dark | Light | 용도 / 비고 |
|---|---|---|---|
| `card` | `#1E2125` | `#FFFFFF` | 카드 배경(~28%). Dark는 재설계 스펙(이전 `#1D2329`), Light는 기존 값과 동일 |
| `cardElevated` | `#262A2F` | `#F8F7F5` | 호버/active 카드. Dark는 새 card 대비 +6 luma(이전과 동일한 델타) 유지, Light는 변경 없음 |
| `surfaceHover` | `#2A3440` | `#EEECEA` | 포인터 hover fill. 변경 없음 |
| `surfaceSelected` | `#61CE70` 10% opacity | `#1A7A40` 12% opacity | 선택/active 상태, 새 accent 기준 재계산 |

### Typography

| 토큰 | Dark | Light | 대비(WCAG) |
|---|---|---|---|
| `text` | `#FFFFFF` | `#191F28` | Dark 18.77:1 / Light 15.57:1 — 둘 다 AAA |
| `textSub` | `#A7ADB5` | `#6B7684` | Dark 8.31:1 AAA / Light 4.34:1 — **AA 기준 미달**(소스 주석: "marginal, fine for ≥18sp/large or bold only") |
| `textDim` | `#5E7268` | `#8A8E88` | Dark 3.7:1(≥18sp 또는 ≥14sp bold 전용) — 재설계 대상 아님(변경 없음) |

폰트 종류/크기(NotoSansKR/Inter 등)는 이 소스 파일에 없는 정보라 아래
"타이포그래피 규칙" 섹션(기존 내용, 미검증 유지)을 그대로 둔다 — 이번
검증 범위 밖.

### Accent (green family)

| 토큰 | Dark | Light | 용도 / 비고 |
|---|---|---|---|
| `accent` | **`#61CE70`** | `#1A7A40` | Primary. Dark는 재설계 스펙 그대로 적용(9.46:1 AAA). Light는 `#61CE70`을 직접 쓰면 대비 ≈1.87:1로 실패해 기존 어두운 그린을 유지(5.1:1 AA) — **Light는 여전히 Primary 원색이 아니다** |
| `accentBright` | `#7AE890` | `#28C460` | 호버/강조. 변경 없음(새 accent와 이미 조화) |
| `accentDim` | `#1C3A24` | `#DDF7E2` | 버튼/배지 배경. Dark는 변경 없음, Light는 재설계 스펙(연한 민트) |
| `accentLime` | `#8AE06A` | `#3AAA52` | 차트/그라디언트. 변경 없음 |
| `accentHighlight` | `#50EE80` | `#28C460` | AI sparkle 아이콘 등 최고 밝기. 변경 없음 |
| `accentGlow` | `#61CE70` 14% opacity | `#1A7A40` 14% opacity | AI 카드 테두리/active 위젯 표시. 새 accent 기준 재계산(Dark만) |

### Semantic status (아이콘/점 전용, 큰 면적 채우기 금지)

| 토큰 | Dark | Light | 비고 |
|---|---|---|---|
| `success` | `#3FA956` | `#18823A` | Dark는 재설계 스펙("Secondary"가 success로 재배치, 6.27:1 AA). Light는 `#61CE70`류 적용 시 ≈2.82:1로 3:1 미달이라 기존 값(5.0:1) 유지 |
| `warning` | `#F0A020` | `#C87600` | 변경 없음 — **ThemeGuide 이전 판(`#F59E0B`/`#D97706`)과 실제 값이 이미 달랐다**(재설계 이전부터의 문서 drift, 이번에 정정) |
| `error` | `#FF5050` | `#CC2424` | 변경 없음 — 마찬가지로 이전 판(`#EF4444`/`#DC2626`)과 실제 값이 달랐다(정정) |
| `semanticInfo` | `#5B9CF6` | `#1A6EC8` | 신규 필드(2026-07-31 이전 ThemeGuide엔 없었음). 보편적 신호 친숙성 위해 Blue 유지 |
| `semanticNeutral` | `#6A7870` | `#686E68` | 신규 필드. 중립/대기 상태 |

### AI signature

| 토큰 | Dark | Light | 비고 |
|---|---|---|---|
| `aiAccent` | `#50EE80` | `#28C460` | AI Brief 카드 sparkle. Primary accent와 구분되는 값 유지 |
| `aiGold`(deprecated) | → `aiAccent`로 위임 | → `aiAccent`로 위임 | `@deprecated` — 위젯 호환성 위해서만 남김. **신규 코드에서 쓰지 않는다** |

### Structure

| 토큰 | Dark | Light | 비고 |
|---|---|---|---|
| `divider` | `#30343A`(opaque) | `#E5E8EB`(opaque) | 재설계 스펙 — **이전엔 투명도 기반(alpha) 값이었으나 이제 불투명 solid**. Glass/gradient 위에서는 이전과 시각적으로 다르게 보일 수 있음 |
| `border` | `#FFFFFF` 8% opacity | `#000000` 8% opacity | 변경 없음 |
| `borderMed` | `#FFFFFF` 12% opacity | `#000000` 12% opacity | 신규 필드 — 모달 등 elevated border 전용 |

> 실제 hex/opacity 값은 `aod_colors.dart` 코드가 최종 출처다. 이 표는
> 2026-07-31 제공된 소스 스냅샷 기준이며, 이후 변경 시 재검증이 필요하다.

---

## Decoration Factories (실제 소스 기준)

| 팩토리 | 용도 | 비고 |
|---|---|---|
| `cardDecor` | Level 1 표준 정보 카드 | `card` 색상 + `border`, radius 20 |
| `cardElevatedDecor` | Level 2 호버/active 카드 | `cardElevated` 색상 + `borderMed`, 그림자 포함 |
| `aiCardDecor` | AI/active 위젯 카드 | **신규(2026-07-31)** — Level 1 + `accentGlow` 테두리(1.5px) |
| `floatingDecor` | Level 3 floating(모달/오버레이/사이드바) | **신규(2026-07-31)** — 이중 그림자(32px+8px blur) |

---

## 테마 모드 전환

| 단계 | 위치 |
|------|------|
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
