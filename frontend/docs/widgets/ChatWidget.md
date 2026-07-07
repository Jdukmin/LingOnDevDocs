# ChatWidget

`lib/widget/chat_widget.dart`

---

## 역할

AI와의 대화를 버블 형태로 표시하고 사용자 입력을 처리합니다.  
`ChatModule.isBusy`가 `true`일 때 `_TypingIndicator`를 표시합니다.

---

## 입력 (Props)

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `module` | `ChatModule` | ✅ | 채팅 스레드 상태 소스 |

---

## 출력 (Callbacks)

없음. 사용자 입력은 위젯 내부에서 `module.send()`로 직접 처리합니다.

---

## 내부 상태

| 항목 | 설명 |
|------|------|
| `_TypingIndicator` | `isBusy == true`일 때 하단에 표시되는 내부 위젯 |
| `TextEditingController` | 입력 필드 제어 |
| `ScrollController` | 최신 메시지로 자동 스크롤 |

---

## 사용 위치

- `AodDisplay` → `AodTabletLayout.chat`

---

## 의존성

| 대상 | 타입 |
|------|------|
| `ChatModule` | `BaseModule` |
| `ChatMessage` | 데이터 모델 (`modules/chat_module.dart`) |
