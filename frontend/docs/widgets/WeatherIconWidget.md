# WeatherIconWidget

`lib/widget/weather_icon_widget.dart`

---

## 역할

`iconCode` 문자열을 받아 해당 Meteocons SVG 아이콘을 렌더링합니다.  
내부적으로 `WeatherIconModule`을 생성·소유하여 아이콘 바이트를 비동기로 로드합니다.

---

## 입력 (Props)

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `iconCode` | `String?` | — | Meteocons 아이콘 코드 (없으면 빈 공간) |
| `size` | `double` | — | 아이콘 크기 (기본 48.0) |

---

## 출력 (Callbacks)

없음.

---

## 사용 위치

- `WeatherNowWidget` 내부
- `WeatherForecastWidget` 내부

---

## 의존성

| 대상 | 타입 | 비고 |
|------|------|------|
| `WeatherIconModule` | `BaseModule` | 위젯 내부에서 생성·소유 |
| `MeteoconsGateway` | `BaseGateway` | `WeatherIconModule`이 `gw<>()` 로 접근 |
| `flutter_svg` | 패키지 | SVG 렌더링 |

---

## 주의

`iconCode`가 변경되면 `didUpdateWidget`에서 `WeatherIconModule`을 재생성합니다.
