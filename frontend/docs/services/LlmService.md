# LLM Service

`lib/gateway/llm/` + `lib/modules/chat_module.dart`

---

## 역할

AI 채팅 응답을 생성합니다. `LlmGateway` 추상 인터페이스를 통해 프로바이더를 교체 가능하게 설계되어 있습니다.

---

## 레이어 구조

```
ChatModule (BaseModule)
  └─ LlmGateway (abstract BaseGateway)
       └─ OpenAiGateway (현재 구현체)
            └─ OpenAI API
```

---

## LlmGateway 인터페이스

```dart
abstract class LlmGateway extends BaseGateway {
  Future<String> complete(List<ChatMessage> messages);  // one-shot
  Stream<String> stream(List<ChatMessage> messages);    // streaming (미구현)
}
```

프로바이더 교체 시 `main()`에서 다른 `XxxGateway.init()`을 호출합니다. `ChatModule`은 변경 없이 동작합니다.

---

## 호출 대상 (Route)

| 프로바이더 | 엔드포인트 |
|-----------|-----------|
| OpenAI | `https://api.openai.com/v1/chat/completions` |
| (예정) Anthropic | `https://api.anthropic.com/v1/messages` |
| (예정) OpenRouter | `https://openrouter.ai/api/v1/chat/completions` |

---

## API 키 주입

```bash
flutter run --dart-define=OPENAI_API_KEY=sk-...
```

키가 없으면 `LlmGateway`가 등록되지 않습니다. `ChatModule`은 안내 메시지를 표시합니다.

---

## LlmProvider enum (선언만)

```dart
// lib/auth/domain/llm_provider.dart
enum LlmProvider { openai, anthropic, gemini, openrouter }
```

UI 연동 및 동적 프로바이더 전환 로직은 미구현입니다.

---

## Error 처리

| 예외 클래스 | 원인 | ChatModule 처리 |
|-------------|------|-----------------|
| `LlmAuthException` | API 키 오류 | 인증 실패 메시지 버블 |
| `LlmRateLimitException` | 429 | 한도 초과 메시지 버블 |
| `LlmTimeoutException` | 타임아웃 | 타임아웃 메시지 버블 |
| `LlmNetworkException` | 네트워크 오류 | 오프라인 메시지 버블 |
| `LlmServerException` | 5xx | 서버 오류 메시지 버블 |

---

## 관련 화면·위젯

- `ChatWidget`
- `BriefCardWidget` (브리핑 생성 — `BriefModule`이 별도 호출)
