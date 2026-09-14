# LLM Gateway Requirements

Parent Feature: [SYS-010 LLM Gateway](system_requirements.md). Architecture 상
LLM Gateway는 **백엔드**가 Intent/Planner/Chat에 제공하는 provider-agnostic 게이트웨이를
의미한다.

**현황(2026-09-14 갱신)**: 이 게이트웨이는 TASK-005에서 백엔드에 실제로
구축되었다 — `lingon/src/gateway/llm/`(`LlmGatewayService.ts`,
`OpenAIProvider.ts`, `GeminiProvider.ts`), 진입점은
`POST /v1/actions/execute`. 프론트엔드의 클라이언트-직접-호출 임시
구현(`OpenAiGateway`)은 TASK-009에서 **삭제**되었고 백엔드 Action Layer를
경유하는 `LingonLlmGateway`로 대체되었다. 이전 판의 "백엔드에 게이트웨이가
없다"는 서술은 폐기한다. 다만 구현은 **mocked transport로만** 검증되었고
실제 provider 자격증명을 가진 실서버 대상 Integration Verification은 아직
이루어지지 않았다 — 아래 Progress 값은 그 제약을 반영한 것이다.

| ID | Parent Feature | Requirement | Description | Verification | Status | Progress |
|---|---|---|---|---|---|---|
| LLM-001 | SYS-010 | Multi Provider Support | The LLM Gateway shall support at least OpenAI, Anthropic, Gemini, and OpenRouter as interchangeable providers. | Integration Test | In Progress | 25% |
| LLM-002 | SYS-010 | Model Routing | The LLM Gateway shall route a request to a specific model/provider based on request metadata or configuration. | Test | Planned | 0% |
| LLM-003 | SYS-010 | Fallback Strategy | The LLM Gateway shall automatically retry a failed request against a fallback provider/model. | Test | Planned | 0% |
| LLM-004 | SYS-010 | Cost Monitoring | The LLM Gateway shall record token usage and estimated cost per request. | Analysis | Planned | 0% |
| LLM-005 | SYS-010 | Structured Output | The LLM Gateway shall support requesting and validating structured (schema-constrained) JSON output from a provider. | Test | Planned | 0% |
| LLM-006 | SYS-010 | Credential Source Resolution | The LLM Gateway shall resolve the credential for a request from one of two sources — `byok` (user-owned, stored encrypted per user) or `platform` (platform-owned backend secret) — preferring `byok`, and shall fail with a stable error when neither is available. | Integration Test | Planned | 0% |
| LLM-007 | SYS-010 | Provider Adapter Contract | Adding a new provider shall require only a new provider adapter — no change to the Action Type, response envelope, database schema, or frontend. | Review | Planned | 0% |

> **⚠ LLM-001은 Owner 결정 D-005(2026-09-14)에 의해 *부분 이행* 상태다 —
> 폐기되거나 상위 규정된 것이 아니다.** 이 구분이 중요하다:
>
> - **Requirement는 그대로 유효하다.** 위 표의 "at least OpenAI, Anthropic,
>   Gemini, and OpenRouter"는 여전히 LLM-001의 목표 문구이며 개정되지 않았다.
> - **D-005가 한정한 것은 Closed Alpha의 *릴리스 범위*다.** 이번 릴리스에서
>   실제 지원되는 provider는 **OpenAI, Gemini 2개**이고, Anthropic/OpenRouter
>   어댑터 추가는 이번 릴리스 범위 밖으로 *연기*됐다(취소가 아니다).
> - 따라서 Progress는 25%로 유지된다 — 4개 중 2개가 동작하고, 나머지 둘은
>   미착수다. 100%로 올리기 위해 Requirement 문구를 줄이지 않는다.
> - 연기 비용이 낮은 이유는 **LLM-007**(Provider Adapter Contract) 때문이다:
>   provider 추가는 어댑터 하나만 요구하고 Action Type·응답 envelope·DB
>   스키마·프론트엔드를 건드리지 않는다. 실제로 `PROVIDER_REGISTRY`에 행을
>   추가하면 BYOK 계약이 자동으로 넓어진다(아래 "지원 대상" 절).
>
> 요약: 지금 allow-list에 Anthropic/OpenRouter가 **없는 것은 결함이 아니라
> 의도된 릴리스 범위**다. Requirement 문구 개정은 필요하지 않으므로 Domain
> Contract 변경도, 그에 따른 version bump도 발생하지 않는다.

---

## Gateway 책임 범위 (2026-08-01 정의)

Domain 계약은 [requirements/domain_icd/llm.md](domain_icd/llm.md)가 정의한다.
이 절은 그 계약 중 **Gateway 구현체의 책임 경계**만 요약한다.

| Gateway가 **하는** 것 | Gateway가 **하면 안 되는** 것 |
|---|---|
| Provider abstraction | Business Logic |
| Authentication handling (Credential 해석) | User Intent 판단 |
| Request routing (Provider/Model 선택, 폴백) | Dashboard 생성 |
| Error normalization | Memory 관리 (RAG 검색·랭킹·컨텍스트 조립) |
| Usage tracking | 대화 세션 저장 |

Gateway는 **이미 조립된** 메시지를 받아 생성 결과를 정규화해 돌려주는 것까지가
범위다. 이 경계를 넘는 요구가 생기면 Requirement를 추가하기 전에
[domain_icd/llm.md](domain_icd/llm.md) Responsibilities를 먼저 갱신한다.

## Credential Source (LLM-006) — 최소 계약

정식 계약은 [domain_icd/llm.md](domain_icd/llm.md) §CredentialSource다. 요약:

| | `byok` | `platform` |
|---|---|---|
| Owner | User | Platform |
| Storage | `user_api_keys` | Backend Secret(현재 환경변수) |
| Encryption | AES-256-GCM (`MASTER_ENCRYPTION_KEY`) | [security_policy.md](../docs/policies/security_policy.md)를 따름 |
| 선례 | (신규) | OpenWeather API 키 |

**해석 순서**: `byok` 우선 → (정책 허용 시) `platform` → 둘 다 없으면 실패.

**BYOK는 제거·우회될 수 없다.** 사용자가 자신의 키를 등록하는 경로는 항상 유지된다.

> **이 단계에서 도입하지 않는 것**: `CredentialResolver` 독립 Domain, KMS,
> Secret Manager, Credential Service 분리. 위 2종 Source와 해석 순서라는 최소
> 계약만 정의한다 — 도입 필요성은 [security_policy.md](../docs/policies/security_policy.md)
> "Secret 관리"에서 별도로 결정한다.

## Provider Adapter Contract (LLM-007)

Provider 어댑터는 **생성 능력 2개**를 노출한다. 명칭·시그니처의 구현 수단은
백엔드 구현 문서가 정하며, 이 문서는 **계약**만 고정한다.

| Capability | 의미 | 대응 Action |
|---|---|---|
| `chatComplete` | 대화 메시지 → 완성된 응답 1건 | `llm.chat_complete` (비스트리밍) |
| `streamComplete` | 대화 메시지 → 증분 출력 스트림 | `llm.chat_complete` (`stream: true`) |

**불변 조건**:

1. 어댑터는 자신이 어떤 Action/Intent를 위해 호출됐는지 **알지 못한다**.
2. 모든 어댑터는 응답을 공통 `LlmCompletion` 형태로 **정규화한 뒤** 반환한다 —
   Provider별 wire shape은 어댑터 밖으로 나가지 못한다.
3. 모든 Provider 오류는 안정된 오류 코드 집합으로 **변환된 뒤** 반환한다 —
   Provider 원문 오류를 그대로 올리지 않는다(에러 코드 표는
   [docs/icd/action_layer_api.md](../docs/icd/action_layer_api.md)).
4. **Provider 이름은 Gateway 위로 새지 않는다.** Action Dispatcher·Route·
   Intent·Planner·Frontend는 Provider를 알지 못한 채 동작할 수 있어야 한다.
   (사용자가 Provider를 *선택*하는 것은 허용된다 — 선택값은 Backend가 제공한
   목록에서 온 불투명한 식별자이며, Frontend가 Provider별 로직을 갖는 것과 다르다.)
5. **확장 시 변경 범위**: 신규 Provider 추가는 어댑터 1개 추가 + Provider
   allow-list 1행 추가로 끝나야 한다. Action Type·응답 봉투·DB Schema·Frontend는
   변경되지 않는다.

지원 대상은 **OpenAI, Gemini 2개뿐이다**(Owner 결정 D-005). Anthropic/OpenRouter는
**어떤 allow-list에도 존재하지 않는다** — 예약된 슬롯이 아니다. 단일 진실
소스는 `PROVIDER_REGISTRY`(`lingon/src/gateway/llm/LlmGatewayService.ts:161`,
정확히 2행: `openai`→`gpt-4o`, `gemini`→`gemini-1.5-pro`)이며, BYOK
allow-list(`SUPPORTED_PROVIDER_IDS`, 같은 파일 188행)도 이 레지스트리에서
파생된다. 신규 Provider 추가는 `IAIProvider`를 구현하는 어댑터 1개 +
`PROVIDER_REGISTRY` 1행 추가로 끝나야 하지만, 이는 이미 예약된 슬롯을 채우는
것이 아니라 **새로운 Owner 결정**을 필요로 한다. Local LLM/Enterprise
Model도 같은 계약으로 추가 가능해야 한다는 원칙은 유지된다.

---

## 근거 노트 (Evidence)

- **LLM-001**(2026-09-14 갱신 — D-005 반영, 25% 유지): 이전 버전의 이 항목은
  백엔드가 `openai`/`anthropic`/`gemini`/`openrouter` 4개 provider를 allow-list로
  두고 프론트엔드가 `enum LlmProvider`를 선언한다고 기술했으나 이는 더 이상
  사실이 아니다. 현재 상태:
  - BYOK allow-list는 하드코딩이 아니라 `PROVIDER_REGISTRY`
    (`lingon/src/gateway/llm/LlmGatewayService.ts:161`)에서 파생된
    `SUPPORTED_PROVIDER_IDS`(같은 파일 188행)이며, `src/route/LingOnApiKey.ts:5`가
    이를 import해 쓴다 — `openai`/`gemini` 2개만 존재한다.
  - 프론트엔드의 `enum LlmProvider`(`letmeknow/lib/auth/domain/llm_provider.dart`)는
    TASK-009에서 **삭제**되었다(해당 디렉터리 자체가 더 이상 없음). Provider
    목록은 클라이언트에 하드코딩되지 않고 `GET /v1/actions/types` 응답에서
    온다.
  - `OpenAIProvider.ts`, `GeminiProvider.ts` 두 어댑터가 실재하며
    `PROVIDER_REGISTRY`에 연결되어 있다(스토리지 선언뿐이던 이전 상태에서
    진전).
  근거: [backend/docs/api/apikey.md](../backend/docs/api/apikey.md),
  [frontend/docs/services/LlmService.md](../frontend/docs/services/LlmService.md),
  `lingon/src/gateway/llm/LlmGatewayService.ts:161,188`.
  **25%를 그대로 유지한다** — 위 구현은 코드 수준에서 완결되었으나
  `docs/status/release_state.md`가 명시하듯 실제 서버·실제 provider
  자격증명을 통한 Integration Verification이 아직 이루어지지 않았다(현재까지
  mocked transport로만 검증됨). 이 미검증 상태가 25%를 넘기지 못하게 하는
  유일한 남은 제약이다 — "일부만 구현됨"이 아니라 "구현은 끝났고 검증만
  남음"으로 읽는다.
  **정정 2026-08-01(FE/BE 분리, 이력 보존)**: 이 25%는 원래 **BYOK
  저장소(Backend) + 임시 클라이언트 구현(Frontend)**의 몫으로 기록되었다.
  그 임시 클라이언트 구현(`OpenAiGateway`)은 TASK-009에서 삭제되고
  `LingonLlmGateway`(백엔드 Action Layer 경유)로 대체되었으므로, 이 정정
  문단이 가리키던 "임시 구현"은 더 이상 존재하지 않는다 — 위 2026-09-14 갱신
  내용이 현재 상태를 대체한다.
- **LLM-002 / LLM-003**: 프로바이더 간 라우팅이나 실패 시 자동 폴백 로직에 대한
  코드·문서 근거가 없다(클라이언트의 `LlmAuthException`/`LlmRateLimitException`
  등은 에러를 사용자에게 표시할 뿐 다른 provider로 자동 전환하지 않음). 근거:
  [frontend/docs/services/LlmService.md](../frontend/docs/services/LlmService.md).
- **LLM-004**: 백엔드 FeatureList가 `usage_logs` 테이블(토큰/비용 추적)을
  "Planned (not started)"으로 명시. 근거: [backend/docs/FeatureList.md](../backend/docs/FeatureList.md).
- **LLM-005**: 구조화 출력(JSON mode/schema 강제)에 대한 코드·문서 근거가 없음.
- **LLM-006**(2026-08-01 추가): 두 Source의 **저장 측**은 이미 존재한다 —
  `byok`는 `user_api_keys`(AES-256-GCM, `PUT/DELETE /v1/apikey/:provider`),
  `platform`은 OpenWeather 키와 동일한 환경변수 방식. 그러나 **해석·소비 측은
  전무하다**: `useApiKey(userId, provider)`는 호출부가 0개이고,
  `Repositories.ts`의 `openai` 시드는 어떤 게이트웨이도 소비하지 않는다.
  또한 어댑터 기반 클래스의 키 조회 계약(`getActiveKey(provider)`)에는 `userId`가
  없어 현 상태로는 `byok`를 실어 나를 수 없다. 근거:
  [2026-08-01-ai-platform-review.md](../docs/ai_platform/2026-08-01-ai-platform-review.md) §3·§6(H5).
  저장만 있고 해석이 없어 **0%**.
- **LLM-007**(2026-08-01 추가): 백엔드 `BaseProvider`/`BaseGateway` 어댑터 패턴이
  이 계약과 유사한 형태로 이미 존재하나, LLM 어댑터는 하나도 없고 어댑터를
  선택하는 Gateway 계층 자체가 없다. 확장성 추적 결과 Action Type·응답 봉투·
  DB Schema는 Provider 추가에 영향받지 않으나, **프론트엔드가 Provider 목록을
  3곳에 하드코딩**하고 있어 계약 위반 상태다(신규 Provider가 조용히 누락됨).
  근거: 위 리뷰 §5 확장성 추적표(M4). **0%**.
