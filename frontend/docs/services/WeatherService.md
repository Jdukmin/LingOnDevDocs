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

> **정정 2026-07-22**: 이전 버전은 "ResponseEnvelope 미사용, OpenWeatherMap
> 원본 포맷을 직접 파싱"이라고 서술했으나, `backend/docs/api/weather.md`와
> `frontend/docs/FeatureList.md`("날씨 API 연동: Fastify 백엔드 프록시")는
> 다른 모든 API와 동일하게 **ICD v0.0 envelope + 정규화된 응답**을 문서화하고
> 있어 두 문서가 서로 달랐다. Backend 문서가 더 상세하고 다른 API 전체와
> 일관되므로 이를 기준으로 정정한다 — 단, 이 저장소에는 실제 Flutter 소스가
> 없어 `weather_module.dart`가 실제로 어떤 JSON 키를 읽는지는 코드로 직접
> 재확인이 필요하다(API Contract Verification 결과 P0 항목 — 실제 코드 확인
> 전까지는 이 정정도 잠정적이다).

```jsonc
// 성공 — backend/docs/api/weather.md 기준 (ICD v0.0 envelope)
{
  "success": true,
  "data": {
    "location": { "city": "Seoul", "country": "KR", "lat": 37.5665, "lon": 126.978 },
    "weather": { "main": "Clear", "description": "clear sky", "icon": "01d" },
    "temperature": { "temp": 22.5, "feels_like": 21.0, "temp_min": 20.0, "temp_max": 24.0, "humidity": 55, "pressure": 1013 },
    "wind": { "speed": 2.1, "deg": 180 },
    "clouds": 0,
    "visibility": 10000,
    "sunrise": 0,
    "sunset": 0,
    "observed_at": 0
  },
  "error": null
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
