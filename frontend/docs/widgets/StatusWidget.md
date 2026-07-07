# StatusWidget

`lib/widget/status_widget.dart`

---

## 역할

AOD 우측 하단에 상주하는 미니멀 상태 표시 위젯입니다. 롱프레스로 `DevScreen`에 진입하는 숨겨진 진입점 역할도 합니다.

---

## 입력 (Props)

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `onLongPress` | `VoidCallback?` | — | 롱프레스 시 DevScreen 진입 콜백 |

---

## 출력 (Callbacks)

| 콜백 | 시점 |
|------|------|
| `onLongPress()` | 위젯 롱프레스 |

---

## 사용 위치

- `AodDisplay` → `AodTabletLayout.status`

---

## 의존성

없음.
