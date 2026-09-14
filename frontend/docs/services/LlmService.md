# LLM Service

`lib/gateway/llm/` + `lib/modules/chat_module.dart`

---

> **✅ 완료 (TASK-009, 2026-09-14 갱신)**: 아래 문서가 과거에 기술했던 "클라이언트가
> Provider를 직접 호출" 구조는 **더 이상 존재하지 않는다** — TASK-009에서 제거됐다
> (`Validated`; `letmeknow` 소스에 `openai_gateway.dart`, `lib/auth/domain/llm_provider.dart`
> 없음을 확인함). Architecture상 LLM Gateway는 **백엔드** 책임이라는 원칙
> ([requirements/system_requirements.md](../../../requirements/system_requirements.md) SYS-010)이
> 이제 실제 코드로도 성립한다. 클라이언트는 `LingonLlmGateway`를 통해
> `POST /v1/actions/execute { type: "llm.chat_complete" }`만 호출하고 Provider
> 이름을 알지 못한다 — 비교: [../../../docs/icd/api_comparison.md](../../../docs/icd/api_comparison.md),
> API: [../../../docs/icd/action_layer_api.md](../../../docs/icd/action_layer_api.md).
> **다만 실제 서버·실제 provider 자격증명을 통한 Integration Verification은 아직
> 완료되지 않았다** — 지금까지는 mocked transport로만 검증됐다
> (`docs/status/release_state.md` 참고). 아래 내용은 이 현재 상태를 반영해
> 갱신했다.

---

## 역할

AI 채팅 응답을 생성합니다. `LlmGateway` 추상 인터페이스를 통해 프로바이더를 교체 가능하게 설계되어 있습니다.

---

## 레이어 구조

```
ChatModule (BaseModule)
  └─ LlmGateway (abstract BaseGateway)
       └─ LingonLlmGateway (현재 구현체, TASK-009)
            └─ POST /v1/actions/execute (백엔드 Action Layer)
                 └─ 백엔드 LLM Gateway → PROVIDER_REGISTRY(openai | gemini) → Provider API
```

`OpenAiGateway`(클라이언트가 OpenAI를 직접 호출하던 구현체)는 TASK-009에서
삭제되었다 — `letmeknow/lib/gateway/llm/openai_gateway.dart`는 더 이상 없다.

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

TASK-009 이후 클라이언트는 Provider 엔드포인트를 **직접 호출하지 않는다**.
유일한 호출 대상은 백엔드 Action Layer뿐이다:

| 호출 대상 | 설명 |
|-----------|------|
| `POST /v1/actions/execute` | `{ type: "llm.chat_complete" }` — 실제 완성 요청 |
| `GET /v1/actions/types` | Provider 카탈로그 조회(현재 `openai`, `gemini` — D-005) |

실제 Provider 엔드포인트(OpenAI/Gemini API)는 백엔드 `PROVIDER_REGISTRY`
(`lingon/src/gateway/llm/LlmGatewayService.ts:161`) 뒤에 있으며 클라이언트는
이를 알지 못한다. Anthropic·OpenRouter는 어댑터가 없어 애초에 호출 대상이
아니다 — 과거 이 표에 "(예정)"으로 적혀 있던 것은 예약된 슬롯이 아니었다
(Owner 결정 D-005).

---

## API 키 주입

TASK-009 이후 클라이언트 쪽 Provider API 키 주입 경로는 **존재하지 않는다**.
`flutter run --dart-define=OPENAI_API_KEY=...`로 클라이언트에 Provider 키를
주입하던 방식은 삭제되었다 — `letmeknow/lib/main.dart`는 이제
`LingonLlmGateway.init(client: authModule.apiClient)`만 호출하며, 필요한 것은
인증된 `ApiClient`(Bearer JWT)뿐이고 Provider 키는 필요 없다. (참고:
`letmeknow/README.md`에는 이 옛 실행 커맨드가 여전히 남아 있을 수 있으니 그대로
따라 하지 말 것 — 확인/정리는 이 문서의 편집 범위 밖이라 미해결로 남긴다.)

사용자의 BYOK 키 등록 여부는 `ChatModule`이 `LingonApiKeyRoute`
(`GET/PUT/DELETE /v1/apikey/:provider`)로 별도 확인하며, 자격증명 해석 순서
(`byok` 우선 → `platform` → 둘 다 없으면 실패)는
[requirements/llm_gateway_requirements.md](../../../requirements/llm_gateway_requirements.md)
LLM-006이 정의한다.

---

## Provider 목록 (하드코딩 금지 — D-005)

**`enum LlmProvider`는 더 이상 존재하지 않는다.** 이를 선언했던
`lib/auth/domain/llm_provider.dart`는 TASK-009에서 **삭제**되었다 — 확인:
`letmeknow/lib/auth/domain/` 디렉터리 자체가 더 이상 없다. 클라이언트에는
Provider를 나열하는 하드코딩된 타입이 전혀 없다.

Provider 목록은 **백엔드에서만** 온다 — `GET /v1/actions/types` 응답의
Provider 카탈로그(`letmeknow/lib/route/lingon_actions.dart`의
`LlmProviderInfo`)가 유일한 소스다. 백엔드 쪽 단일 진실 소스는
`PROVIDER_REGISTRY`(`lingon/src/gateway/llm/LlmGatewayService.ts:161`)이며,
현재 정확히 두 행(`openai` → `gpt-4o`, `gemini` → `gemini-1.5-pro`)만 있다
(Owner 결정 D-005). BYOK allow-list(`SUPPORTED_PROVIDER_IDS`, 같은 파일
188행)도 이 레지스트리에서 파생되므로 백엔드에도 별도의 Provider 목록이 두
곳에 존재하지 않는다.

**클라이언트 쪽에 Provider enum·상수 목록을 다시 만들지 않는다.** 신규
Provider는 백엔드 어댑터 1개 + `PROVIDER_REGISTRY` 1행 추가만으로 카탈로그에
나타나야 하며 프론트엔드 변경은 없어야 한다(LLM-007). UI가 동적으로
Provider 목록을 전환하는 로직은 여전히 미구현이다 — 카탈로그를 어디서
가져오는지(백엔드, 하드코딩 없음)만 이 절에서 고정한다.

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
