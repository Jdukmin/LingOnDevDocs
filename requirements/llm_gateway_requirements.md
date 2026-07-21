# LLM Gateway Requirements

Parent Feature: [SYS-010 LLM Gateway](system_requirements.md). Architecture 상
LLM Gateway는 **백엔드**가 Intent/Planner/Chat에 제공하는 provider-agnostic 게이트웨이를
의미한다. 현재 백엔드에는 이 게이트웨이가 없고(`backend/docs/services`에는
OpenWeather 게이트웨이만 존재), 프론트엔드에는 클라이언트에서 직접 OpenAI를
호출하는 임시 구현(`LlmGateway`/`OpenAiGateway`)만 있다 — 이는 이 Requirement가
목표로 하는 백엔드 게이트웨이가 아니다.

| ID | Parent Feature | Requirement | Description | Verification | Status | Progress |
|---|---|---|---|---|---|---|
| LLM-001 | SYS-010 | Multi Provider Support | The LLM Gateway shall support at least OpenAI, Anthropic, Gemini, and OpenRouter as interchangeable providers. | Integration Test | In Progress | 25% |
| LLM-002 | SYS-010 | Model Routing | The LLM Gateway shall route a request to a specific model/provider based on request metadata or configuration. | Test | Planned | 0% |
| LLM-003 | SYS-010 | Fallback Strategy | The LLM Gateway shall automatically retry a failed request against a fallback provider/model. | Test | Planned | 0% |
| LLM-004 | SYS-010 | Cost Monitoring | The LLM Gateway shall record token usage and estimated cost per request. | Analysis | Planned | 0% |
| LLM-005 | SYS-010 | Structured Output | The LLM Gateway shall support requesting and validating structured (schema-constrained) JSON output from a provider. | Test | Planned | 0% |

---

## 근거 노트 (Evidence)

- **LLM-001**: 백엔드는 BYOK API 키 저장(`/v1/apikey/*`)에서 `openai`/`anthropic`/`gemini`/`openrouter`
  4개 provider를 allow-list로 두고 있고, 프론트엔드도 `enum LlmProvider`를
  선언해 두었다. 그러나 실제로 호출 가능한 구현체는 `OpenAiGateway` 하나뿐이며,
  "UI 연동 및 동적 프로바이더 전환 로직은 미구현"이라고 명시되어 있다. 근거:
  [backend/docs/api/apikey.md](../backend/docs/api/apikey.md),
  [frontend/docs/services/LlmService.md](../frontend/docs/services/LlmService.md).
  스토리지/선언은 있으나 실동작은 단일 provider뿐이라 25%.
- **LLM-002 / LLM-003**: 프로바이더 간 라우팅이나 실패 시 자동 폴백 로직에 대한
  코드·문서 근거가 없다(클라이언트의 `LlmAuthException`/`LlmRateLimitException`
  등은 에러를 사용자에게 표시할 뿐 다른 provider로 자동 전환하지 않음). 근거:
  [frontend/docs/services/LlmService.md](../frontend/docs/services/LlmService.md).
- **LLM-004**: 백엔드 FeatureList가 `usage_logs` 테이블(토큰/비용 추적)을
  "Planned (not started)"으로 명시. 근거: [backend/docs/FeatureList.md](../backend/docs/FeatureList.md).
- **LLM-005**: 구조화 출력(JSON mode/schema 강제)에 대한 코드·문서 근거가 없음.
