# Weather Service

`lib/modules/weather_module.dart` + `lib/route/lingon_weather.dart`

---

## ��할

GPS 위치 기반으로 현재 날씨와 5일 예보를 Fastify 백엔드(날씨 API 프록시)에서 조회합니다.

---

## 레이어 구조

```
WeatherModule (BaseModule)
  └─ LingonWeatherRoute (BaseRoute)
       └─ Fastify Backend → OpenWeatherMap 프록시
```

---

## 호출 대상 (Route)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/v1/weather/current` | 현재 날씨 (위치 파라미터 필요) |
| GET | `/v1/weather/forecast5` | 5일 예보 |
| GET | `/v1/weather/geo/direct` | 도시명 → 좌표 검색 |
| GET | `/v1/weather/geo/reverse` | 좌표 → 도시명 역지오코딩 |

API 상세 명세: `./docs/api/` 참조

---

## Request 파라미터

```
lat=37.5665&lon=126.9780&units=metric&lang=kr
```

위치는 `GeoLocatorGateway`가 제공합니다.

---

## Response 요약

```jsonc
// 성공 (ResponseEnvelope 미사용 — 직접 JSON 파싱)
{
  "weather": [...],
  "main": { "temp": 22.5, "feels_like": 21.0, ... },
  "name": "Seoul"
}
```

---

## Error 처리

`BaseRoute`의 `RouteException` 캡처 → `BaseModule.runGuarded`가 `hasError = true`로 처리합니다.

---

## 관련 화면·위젯

- `WeatherNowWidget`
- `WeatherForecastWidget`
- `BriefCardWidget` (날씨 컨텍스트 읽기)
