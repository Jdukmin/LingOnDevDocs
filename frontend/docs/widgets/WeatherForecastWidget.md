# WeatherForecastWidget

`lib/widget/weather_forecast_widget.dart`

---

## 역할

5일 날씨 예보를 수직 또는 수평 레이아웃으로 표시합니다.

---

## 입력 (Props)

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `module` | `WeatherModule` | ✅ | — | 예보 데이터 소스 |
| `vertical` | `bool` | — | `false` | `true`이면 수직 나열 |

---

## 출력 (Callbacks)

없음.

---

## 사용 위치

- `AodDisplay` → `AodTabletLayout.forecast` (`vertical: true`)

---

## 의존성

| 대상 | 타입 |
|------|------|
| `WeatherModule` | `BaseModule` |
| `WeatherIconWidget` | 내부 사용 |
