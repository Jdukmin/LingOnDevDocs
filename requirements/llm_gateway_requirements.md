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
| LLM-006 | SYS-010 | Credential Source Resolution | The LLM Gateway shall resolve the credential for a request from one of two sources — `byok` (user-owned, stored encrypted per user) or `platform` (platform-owned backend secret) — preferring `byok`, and shall fail with a stable error when neither is available. | Integration Test | Planned | 0% |
| LLM-007 | SYS-010 | Provider Adapter Contract | Adding a new provider shall require only a new provider adapter — no change to the Action Type, response envelope, database schema, or frontend. | Review | Planned | 0% |

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

초기 대상은 **OpenAI, Gemini**다. Anthropic/OpenRouter는 이미 allow-list에
있으며, Local LLM/Enterprise Model은 같은 계약으로 추가 가능해야 한다.

---

## 근거 노트 (Evidence)

- **LLM-001**: 백엔드는 BYOK API 키 저장(`/v1/apikey/*`)에서 `openai`/`anthropic`/`gemini`/`openrouter`
  4개 provider를 allow-list로 두고 있고, 프론트엔드도 `enum LlmProvider`를
  선언해 두었다. 그러나 실제로 호출 가능한 구현체는 `OpenAiGateway` 하나뿐이며,
  "UI 연동 및 동적 프로바이더 전환 로직은 미구현"이라고 명시되어 있다. 근거:
  [backend/docs/api/apikey.md](../backend/docs/api/apikey.md),
  [frontend/docs/services/LlmService.md](../frontend/docs/services/LlmService.md).
  스토리지/선언은 있으나 실동작은 단일 provider뿐이라 25%.
  **정정 2026-08-01(FE/BE 분리)**: 이 25%는 전부 **BYOK 저장소(Backend) + 임시
  클라이언트 구현(Frontend)**의 몫이다. 이 Requirement가 목표로 하는 **백엔드
  LLM Gateway는 0%**다 — `OpenAiGateway`는 프론트엔드 클래스이며 백엔드
  게이트웨이가 아니다. 25%를 "백엔드가 일부 구현됨"으로 읽지 않는다.
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
