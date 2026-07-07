# Theme Guide

`lib/core/utils/aod_colors.dart`

---

## 색상 접근 규칙

```dart
// 모든 build() 첫 줄에 반드시 작성합니다.
final c = context.aodColors;
```

`AodTheme.xxx` 상수는 `_BootstrapScreen`의 `const` 컨텍스트 전용입니다.  
일반 위젯에서는 **절대 사용하지 않습니다.**

---

## AodColors 토큰

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `c.bg` | `#F5F5F5` | `#0D0D0D` | 캔버스 배경 (~62% 면적) |
| `c.surface` | `#EBEBEB` | `#161616` | 컬럼 여백, 섹션 존 |
| `c.card` | `#FFFFFF` | `#1E1E1E` | 카드 배경 (~28% 면적) |
| `c.cardElevated` | `#F0F0F0` | `#252525` | 선택/호버 카드 |
| `c.text` | `#0A0A0A` | `#F0F0F0` | 주요 수치, 제목 |
| `c.textSub` | `#4A4A4A` | `#A0A0A0` | 레이블, 보조 정보 |
| `c.textDim` | `#9A9A9A` | `#505050` | 섹션 레이블(≥10px w700), 장식 아이콘 |
| `c.accent` | `#2563EB` | `#3B82F6` | 인터랙티브 요소, 아이콘 |
| `c.accentBright` | `#1D4ED8` | `#60A5FA` | 호버/강조 |
| `c.accentDim` | `#DBEAFE` | `#1E3A5F` | 배지/버튼 배경 |
| `c.success` | `#16A34A` | `#22C55E` | 상태 점(6px) 전용 |
| `c.warning` | `#D97706` | `#F59E0B` | 상태 점(6px) 전용 |
| `c.error` | `#DC2626` | `#EF4444` | 상태 점(6px) 전용 |
| `c.aiGold` | `#B45309` | `#F59E0B` | AI Brief ✦ 아이콘, 섹션 바 전용 |
| `c.divider` | `#E0E0E0` | `#2A2A2A` | 구분선 |
| `c.border` | `#D4D4D4` | `#333333` | 카드 테두리 |

> 실제 hex 값은 `aod_colors.dart` 코드가 최종 출처입니다. 이 표는 참고용입니다.

---

## 팩토리 게터

```dart
// 카드 컨테이너에 바로 사용합니다.
c.cardDecor         // BoxDecoration (card 색상 + border)
c.cardElevatedDecor // BoxDecoration (cardElevated 색상 + border)
```

---

## 테마 모드 전환

| 단계 | 위치 |
|------|------|
| 상태 저장 | `_LingonAppState._themeMode` |
| 변경 요청 | `SidebarWidget.onSetTheme(mode)` |
| MaterialApp 적용 | `theme: _buildTheme(AodColors.light)`, `darkTheme: _buildTheme(AodColors.dark)` |
| 대안 진입 | `DevScreen` 외관 섹션 (StatusWidget 롱프레스) |

---

## 타이포그래피 규칙

| 용도 | 폰트 | 크기 | Weight |
|------|------|------|--------|
| 본문, 한국어 | `NotoSansKR` | 12~14 | 400~600 |
| 숫자, 레이블 | `Inter` | 9~14 | 600~700 |
| 섹션 레이블 | `Inter` | 9~10 | 700 |
| 섹션 레이블 자간 | — | `letterSpacing: 1.2~1.4` | — |

---

## 아이콘 규칙

| 항목 | 값 |
|------|-----|
| 소형 아이콘 크기 | `12~16` |
| 인터랙티브 색상 | `c.accent` |
| 장식 색상 | `c.textDim` |
| AI 전용 색상 | `c.aiGold` |
