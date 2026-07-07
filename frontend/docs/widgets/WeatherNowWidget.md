# WeatherNowWidget

`lib/widget/weather_now_widget.dart`

---

## 역할

현재 날씨 정보(기온, 날씨 아이콘, 체감온도, 습도 등)를 카드 형태로 표시합니다.

---

## 입력 (Props)

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `module` | `WeatherModule` | ✅ | 현재 날씨 데이터 소스 |

---

## 출력 (Callbacks)

없음.

---

## 사용 위치

- `AodDisplay` → `AodTabletLayout.weatherNow`

---

## 의존성

| 대상 | 타입 |
|------|------|
| `WeatherModule` | `BaseModule` |
| `WeatherIconWidget` | 내부 사용 (날씨 아이콘 렌더링) |
