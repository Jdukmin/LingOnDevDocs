# Flutter Development Guide

> Flutter 구현 전용 가이드입니다.  
> 시스템 아키텍처·API 명세·DB 스키마 등 공통 설계는 `./docs/` (Git Submodule)를 참조합니다.
>
> **⚠ 2026-07-21 전략 검토**: 이 미러 저장소에서 위 `./docs/`는 실제로 저장소 루트
> [../../docs/](../../docs/)에 있다. Personal Action OS 전략 전환 및 Action Layer
> ICD 제안은 [../../docs/icd/](../../docs/icd/) 참조 — 이 문서(Flutter 구현 컨벤션)
> 자체는 변경되지 않았다.

---

## 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [Widget 규칙](#widget-규칙)
3. [State Management 규칙](#state-management-규칙)
4. [Navigation 규칙](#navigation-규칙)
5. [Theme 규칙](#theme-규칙)
6. [Asset 관리](#asset-관리)
7. [Localization](#localization)
8. [API 호출 방식](#api-호출-방식)
9. [Error Handling](#error-handling)
10. [Coding Convention](#coding-convention)

---

## 프로젝트 구조

```
lib/
├── auth/
│   ├── data/auth_api.dart            # AuthApi, AuthTokens
│   ├── domain/
│   │   ├── auth_repository.dart      # 토큰 저장, 세션 관리, 프리로드
│   │   ├── user_model.dart           # UserModel
│   │   └── llm_provider.dart         # LlmProvider enum (선언만)
│   └── presentation/auth_controller.dart  # ChangeNotifier, Google Sign-In
│
├── core/
│   ├── base/
│   │   ├── base_gateway.dart         # 싱글턴 레지스트리
│   │   ├── base_module.dart          # ChangeNotifier + runGuarded + gw<T>()
│   │   ├── base_route.dart           # HTTP 기반 (get / post / URI 빌더)
│   │   ├── base_screen.dart          # Scaffold 래퍼 (Stateless / Stateful)
│   │   └── base_widget.dart          # BaseModuleWidget (선택 사용)
│   ├── modules/
│   │   ├── weather_icon_module.dart  # SVG → Uint8List 변환
│   │   └── weather_metrics_module.dart  # WeatherModule 어댑터
│   ├── network/
│   │   └── api_client.dart           # ResponseEnvelope<T>, Bearer 토큰, 401 콜백
│   └── utils/
│       ├── aod_colors.dart           # AodColors ThemeExtension
│       └── error_handler.dart        # RouteException, ErrorHandler
│
├── gateway/
│   ├── geolocator_gateway.dart
│   ├── googlefont_gateway.dart
│   ├── meteocons_gateway.dart
│   └── llm/
│       ├── llm_gateway.dart          # abstract + LlmException 계층
│       └── openai_gateway.dart
│
├── layout/
│   └── aod_tablet_layout.dart        # 3컬럼 AOD (좌28% / 중44% / 우28%)
│
├── modules/
│   ├── analytics_module.dart
│   ├── brief_module.dart
│   ├── calendar_module.dart
│   ├── chat_module.dart
│   ├── clock_module.dart
│   ├── sidebar_module.dart
│   └── weather_module.dart
│
├── route/
│   └── lingon_weather.dart           # 날씨 API 라우트
│
├── screen/
│   ├── aod_display.dart              # 메인 화면 — 모든 모듈 소유
│   ├── bootstrap_screen.dart         # 아이콘·폰트 프리로드
│   └── dev_screen.dart              # 개발자 도구
│
├── widget/                           # → frontend/docs/widgets/ 참조
│
└── main.dart
```

---

## Widget 규칙

### `build()` 첫 줄 필수

```dart
final c = context.aodColors;
```

`AodTheme.xxx` 상수는 `_BootstrapScreen`의 `const` 컨텍스트 전용입니다. **위젯에서 직접 사용 금지.**

### 카드 컨테이너

```dart
Container(decoration: c.cardDecor, ...)        // 일반 카드
Container(decoration: c.cardElevatedDecor, ...) // 선택/호버 카드
```

### 섹션 레이블

```dart
TextStyle(
  fontFamily: 'Inter',
  fontSize: 9,
  fontWeight: FontWeight.w700,
  letterSpacing: 1.2,
  color: c.textSub,
)
```

### 아이콘

- 크기: `12~16`
- 인터랙티브: `c.accent`
- 장식: `c.textDim`

### 카드 테두리 반경

```dart
BorderRadius.circular(14)   // 일반
BorderRadius.circular(20)   // 강조
```

### 위젯에서 금지 사항

- `BaseGateway.resolve<T>()` 직접 호출 금지 → 모듈을 통해 접근
- HTTP 직접 호출 금지 → 모듈/서비스를 통해 호출
- `AodTheme.xxx` 상수 직접 사용 금지

---

## State Management 규칙

앱 전체에서 `ChangeNotifier` 기반의 커스텀 `BaseModule` 패턴을 사용합니다.  
`Provider`, `Riverpod`, `Bloc` 등 외부 상태 패키지를 도입하지 않습니다.

### 표준 리스너 패턴

```dart
@override
void initState() {
  super.initState();
  widget.module.addListener(_rebuild);
}

@override
void dispose() {
  widget.module.removeListener(_rebuild);
  super.dispose();
}

void _rebuild() {
  if (mounted) setState(() {});
}
```

### runGuarded 패턴

비동기 작업은 반드시 `runGuarded`로 감쌉니다.

```dart
await runGuarded(() async {
  // isBusy 자동 관리, 예외 자동 캡처
  final data = await gw<SomeGateway>().fetch();
  _result = data;
});
```

### 모듈 소유 원칙

- 모든 모듈은 `AodDisplay._AodDisplayState`가 `late final`로 생성·소유합니다.
- 위젯은 모듈을 생성하지 않습니다. 생성자 파라미터로 받습니다.
- `AuthController`는 예외적으로 `ApiClient`를 내부에서 생성합니다.

---

## Navigation 규칙

```
앱 시작
  └─ BootstrapScreen (아이콘·폰트 로드)
       └─ AodDisplay (완료 후 단방향 전환)
            ├─ DevScreen   (Navigator.push — Modal)
            └─ SidebarWidget (AnimatedPositioned — Route 없음)
```

- Router/Navigator 2.0 미사용. `Navigator.push` / `Navigator.pop` 만 사용합니다.
- Google Sign-In 창은 OS 시스템 창(`google_sign_in` 플러그인)으로 처리됩니다.

---

## Theme 규칙

→ 색상 토큰 전체 목록: [frontend/docs/theme/ThemeGuide.md](theme/ThemeGuide.md)

- `AodColors.dark` / `AodColors.light` 두 가지 테마 제공
- 테마 상태: `_LingonAppState._themeMode`
- 변경 경로: `SidebarWidget` 외관 섹션 → `onSetTheme` 콜백 → `_LingonAppState`

---

## Asset 관리

```yaml
# pubspec.yaml
flutter:
  assets:
    - assets/icons/    # Meteocons SVG
```

- SVG 아이콘: `MeteoconsGateway.bootstrap()` 이 앱 시작 시 사전 로드합니다.
- 위젯에서 아이콘을 사용할 때는 `WeatherIconModule`을 통해 간접 접근합니다.
- **폰트는 `pubspec.yaml`에 선언하지 않습니다.** `GoogleFontGateway`가 런타임에 다운로드합니다.

---

## Localization

현재 **단일 언어(한국어)** 로 운영됩니다.  
`flutter_localizations` 미도입. 문자열을 코드에 하드코딩합니다.  
다국어 지원 시 `ARB` + `gen_l10n` 도입 예정입니다.

---

## API 호출 방식

### 날씨 API

```dart
// WeatherModule 내부에서만 호출합니다.
final data = await gw<LingonWeatherRoute>().getCurrentWeather(location: ...);
```

### 백엔드 API (인증 필요)

```dart
// AuthController가 ApiClient를 소유합니다.
// 위젯·모듈에서 직접 ApiClient를 생성하지 않습니다.
final env = await _client.postEnvelope<T>('/v1/some-endpoint', body: {...});
```

### 요청·응답 봉투

```jsonc
// 성공
{ "success": true, "data": { ... }, "error": null }

// 실패
{ "success": false, "data": null, "error": { "code": "...", "message": "..." } }
```

API 상세 명세는 `./docs/api/` (공통 ICD)를 참조합니다.

---

## Error Handling

### HTTP 오류 매핑

| HTTP 상태 | `AuthErrorKind` | 처리 방식 |
|-----------|-----------------|-----------|
| 401 | `unauthorized` | 자동 로그아웃 (`onUnauthorized` 콜백) |
| 400 | `validation` | 필드 오류 메시지 표시 |
| 404 | `notFound` | 빈 상태 UI 표시 |
| 5xx | `serverError` | 재시도 안내 |
| 네트워크 | `network` | 오프라인 배너 |

### 모듈 레벨 오류

```dart
// BaseModule.runGuarded가 자동으로 캡처합니다.
if (module.hasError) {
  // module.errorMessage 표시
}
```

### LLM 오류

`LlmException` 계층 사용 (→ `frontend/docs/services/LlmService.md`)

---

## Coding Convention

| 항목 | 규칙 |
|------|------|
| 색상 접근 | `context.aodColors` 필수, build() 첫 줄 |
| 본문 폰트 | `NotoSansKR` |
| 숫자·레이블 폰트 | `Inter` |
| 아이콘 크기 | `12~16` |
| 카드 반경 | `BorderRadius.circular(14~20)` |
| HTTP 클라이언트 | `http ^1.6.0` 전용 (`Dio` 금지) |
| 인증 | Google Sign-In + 자체 백엔드 (`Firebase Auth` 금지) |
| 주석 | 영어 `///` doc comment, 인라인 한국어 허용 |
| 새 패키지 | 팀 리뷰 후 추가 |
