# DevScreen

`lib/screen/dev_screen.dart`

---

## 목적

개발 중 상태 확인 및 설정 변경을 위한 개발자 전용 화면입니다. `StatusWidget` 롱프레스로 진입하며, 일반 사용자에게 노출되지 않습니다.

---

## 진입 방법

`StatusWidget` → 롱프레스 → `Navigator.push(DevScreen)`

---

## 주요 기능

- `AnalyticsModule` 데이터 표시 (날씨 새로고침 횟수, 캘린더 사용 추적 등)
- 테마 모드 토글 (다크 / 라이트)
- 앱 버전 및 빌드 정보

---

## 상태 (State)

`DevScreen`은 `BaseScreen(StatelessWidget)`을 상속합니다.  
상태는 파라미터로 주입됩니다.

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `analytics` | `AnalyticsModule` | 추적 데이터 읽기 전용 |
| `onSetTheme` | `ValueChanged<ThemeMode>` | 테마 변경 콜백 |
| `currentThemeMode` | `ThemeMode` | 현재 테마 |

---

## 사용자 흐름

```
AodDisplay → (StatusWidget 롱프레스) → DevScreen → (back 버튼) → AodDisplay
```

---

## 호출 API

없음.

---

## 관련 모델

없음.
