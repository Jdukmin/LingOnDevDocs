# BriefCardWidget

`lib/widget/brief_card_widget.dart`

---

## 역할

날씨 + 캘린더 데이터를 기반으로 AI가 생성한 브리핑 텍스트를 `aiGold` 색상으로 강조하여 카드 형태로 표시합니다.

---

## 입력 (Props)

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `briefModule` | `BriefModule` | ✅ | AI 브리핑 텍스트 소스 |
| `weatherModule` | `WeatherModule` | ✅ | 날씨 컨텍스트 |
| `calendarModule` | `CalendarModule` | ✅ | 일정 컨텍스트 |
| `onGenerated` | `VoidCallback?` | — | 브리핑 생성 완료 시 콜백 |

---

## 출력 (Callbacks)

| 콜백 | 시점 |
|------|------|
| `onGenerated` | AI 브리핑 생성 완료 후 |

---

## 사용 위치

- `AodDisplay` → `AodTabletLayout.briefCard`

---

## 의존성

| 대상 | 타입 |
|------|------|
| `BriefModule` | `BaseModule` |
| `WeatherModule` | `BaseModule` |
| `CalendarModule` | `BaseModule` |

---

## 색상

`c.aiGold` — AI Brief ✦ 아이콘과 섹션 바에만 사용하는 온기 있는 유일한 액센트 색상입니다.
