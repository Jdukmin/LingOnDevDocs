# ClockWidget

`lib/widget/clock_widget.dart`

---

## 역할

`ClockModule`의 현재 시각을 실시간으로 표시합니다. 1초마다 갱신됩니다.

---

## 입력 (Props)

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `module` | `ClockModule` | ✅ | 시각 데이터 소스 |

---

## 출력 (Callbacks)

없음.

---

## 사용 위치

- `AodDisplay` → `AodTabletLayout.clock`

---

## 의존성

| 대상 | 타입 |
|------|------|
| `ClockModule` | `BaseModule` |
