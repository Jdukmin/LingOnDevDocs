# LLM Domain

> **Status**: Proposed · **Progress**: 0% · **Last Updated**: 2026-08-01 · **Owner**: Action Layer (Core) / Platform · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다 — 구현 수단(REST, Fastify Route, Flutter State, DB
Schema)은 [docs/icd/action_layer_api.md](../../docs/icd/action_layer_api.md),
[requirements/llm_gateway_requirements.md](../llm_gateway_requirements.md)를 본다.

**Progress 근거**: 백엔드에 LLM Gateway가 존재하지 않는다 — `src/gateway/`는
OpenWeather/Google 어댑터뿐이고, `package.json`에 LLM Provider SDK가 없으며,
`/v1/actions/*`·`/v1/llm/*` 라우트가 없다. 프론트엔드의 `OpenAiGateway`는
클라이언트가 OpenAI를 직접 호출하는 **임시 구현**이며 이 Domain이 정의하는
백엔드 Gateway가 아니다. 근거: [2026-08-01-ai-platform-review.md](../../docs/ai_platform/2026-08-01-ai-platform-review.md) §3.
따라서 0%.

> **⚠️ 이 Domain은 Product Domain이 아니다.** LLM은 **Engine/Tool 계층**이며,
> 제품 인터페이스는 Action Layer다(DEC-001/002,
> [docs/strategy/product.md](../../docs/strategy/product.md)). 아래 구조는 금지된다:
>
> ```
> User → LLM → Dashboard        ❌ 금지
> User → Intent/Action → Action Layer → LLM Gateway → Provider   ✅
> ```
>
> 이 문서에 LLM을 상위 계층으로 승격시키는 계약을 추가하지 않는다.

---

# Purpose

LLM Domain은 "**어떤 벤더의 언어 모델을 쓰는지를 시스템의 나머지 전부로부터
숨기는**" 유일한 계층이다.

이 분리가 없으면 Provider 하나를 바꿀 때마다 Chat·Intent·Planner·Frontend를
전부 건드려야 한다. 실제로 그 실패가 이미 일어났다 — 현재 Flutter 클라이언트가
OpenAI 요청 본문을 직접 만들고 API 키를 내장한 채 배포된다
([llm_gateway_requirements.md](../llm_gateway_requirements.md) LLM-001 근거).
LLM Domain의 존재 이유는 그 결합을 **한 곳으로 되돌리는 것**이다.

Tool Domain([tool.md](tool.md))이 "외부 *서비스*를 실행하는 법"을 안다면, LLM
Domain은 "외부 *모델*에게 생성을 요청하는 법"을 안다. 둘은 형제 관계이며
상하 관계가 아니다(§Relationships).

# Domain Model

| Entity | 설명 |
|---|---|
| **LlmProvider** | 하나의 모델 제공자에 대한 어댑터 정의(OpenAI, Gemini, 향후 Anthropic/OpenRouter/Local/Enterprise). 식별자는 안정적인 소문자 문자열(`openai`, `gemini`). |
| **LlmModel** | 특정 Provider가 제공하는 모델 식별자(`gpt-4o`, `gemini-1.5-pro`). Provider에 종속되며 시스템은 이를 **불투명한 문자열**로 다룬다. |
| **LlmCredential** | 특정 Provider 호출에 사용할 인증 수단. 소유 주체에 따라 `CredentialSource` 두 종류로 나뉜다(아래). |
| **CredentialSource** | `byok`(Owner: User) 또는 `platform`(Owner: Platform). 이 Domain이 정의하는 **최소 계약**이며, 별도 Credential Domain을 만들지 않는다. |
| **LlmInvocation** | Action Domain이 LLM에게 보내는 1회 생성 요청(대화 메시지 + 생성 파라미터). |
| **LlmCompletion** | LlmInvocation에 대한 **정규화된** 응답. Provider별 wire shape 차이는 이 경계를 넘지 못한다. |
| **LlmUsage** | 1회 호출의 토큰 사용량/추정 비용 기록(LLM-004). |

## CredentialSource — 최소 계약

| | `byok` | `platform` |
|---|---|---|
| Owner | **User** | **Platform** |
| Storage | `user_api_keys` (user_id, provider) | Backend Secret(현재 환경변수) |
| Encryption | **AES-256-GCM** (`MASTER_ENCRYPTION_KEY`) | 이 Domain은 규정하지 않음 — [security_policy.md](../../docs/policies/security_policy.md)를 따른다 |
| 사용자 가시성 | 등록/삭제/등록여부 조회 가능. **평문은 어떤 응답에도 노출되지 않는다** | 사용자에게 노출되지 않음 |
| 선례 | (신규) | OpenWeather API 키와 동일한 성격 |

**해석 순서(Resolution Order)**: 요청된 Provider에 대해 `byok`가 존재하면
`byok`를 사용한다. 없으면 정책이 허용하는 경우에만 `platform`으로 내려간다.
둘 다 없으면 실행하지 않고 실패한다(`LLM_KEY_MISSING`).

> **BYOK 우선 원칙**: BYOK는 제거되거나 우회될 수 없다. 사용자가 자신의 키를
> 등록할 수 있는 경로는 항상 유지된다.

> **의도적으로 정의하지 않는 것**: `CredentialResolver`를 독립 Domain으로
> 분리하지 않는다. KMS/Secret Manager/Credential Service 도입도 이 문서의
> 범위가 아니다 — 위 2종 Source와 해석 순서라는 **최소 계약만** 정의한다.
> 도입 필요성이 생기면 [security_policy.md](../../docs/policies/security_policy.md)의
> "Secret 관리" 항목에서 별도로 결정한다.

# Responsibilities

**한다**
- **Provider Abstraction** — 여러 LlmProvider를 교체 가능한 하나의 계약 뒤에 숨긴다.
- **Authentication Handling** — 요청마다 CredentialSource를 해석해 올바른
  주체(해당 User 또는 Platform)의 자격증명을 사용한다.
- **Request Routing** — 요청 메타데이터와 사용자 설정에 따라 Provider/Model을
  선택하고, 실패 시 폴백 대상으로 재시도한다(LLM-002/003).
- **Error Normalization** — Provider별 오류를 안정된 오류 코드 집합으로 변환한다.
  Provider의 원문 오류를 호출자에게 그대로 전달하지 않는다.
- **Usage Tracking** — 호출당 토큰 사용량/추정 비용을 기록한다(LLM-004).
- **Response Normalization** — 모든 Provider 응답을 하나의 `LlmCompletion`으로 정규화한다.

**하지 않는다**
- **Business Logic을 수행하지 않는다** — 무엇을 할지는 Action Domain이 정한다.
- **User Intent를 판단하지 않는다** — 자연어 해석 결과의 *소비자*이지 판단자가 아니다
  ([intent.md](intent.md)). Intent Domain이 LLM을 **도구로 사용**하는 것이지,
  LLM이 Intent를 소유하는 것이 아니다.
- **Dashboard/UI를 생성하지 않는다** ([dashboard.md](dashboard.md)).
- **Memory/RAG를 관리하지 않는다** — 검색·랭킹·컨텍스트 구성은 Memory Layer의
  책임이며(SYS-005), LLM Domain은 **이미 조립된** 메시지를 받는다.
- **대화 세션을 저장하지 않는다** — 대화 이력의 소유자가 아니다.
- **어떤 Action이 자신을 호출했는지 알지 못한다**(Action → LLM 단방향 의존).
- **사용자에게 직접 결과를 알리지 않는다** — Action Domain을 거친다.

# State

LLM Domain은 **자체 장기 상태 머신을 갖지 않는다.** 1회 호출의 실행 상태는
Action Domain의 Execution State를 그대로 따른다([action.md](action.md)) — 별도
상태값을 만들지 않는다.

이 Domain이 소유하는 유일한 지속 상태는 **User별 BYOK 등록 여부**다.

| State | 의미 |
|---|---|
| `not_registered` | 해당 User가 해당 Provider에 대한 키를 등록하지 않음 |
| `registered` | 등록됨(존재 여부만 조회 가능 — 평문은 조회 불가) |

> `platform` Source는 User별 상태를 갖지 않는다(Platform 전역).

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `LlmInvoked` | Action이 생성 요청을 보냄 | (내부 로깅) |
| `LlmCompleted` | 정규화된 `LlmCompletion` 생성 완료 | Action Domain(ExecutionResult 생성) |
| `LlmFailed` | 모든 Provider 시도가 실패 | Action Domain |
| `LlmFellBack` | 폴백 Provider로 재시도함(LLM-003) | (내부 로깅 / 운영 관측) |
| `LlmUsageRecorded` | 토큰 사용량/비용 기록됨(LLM-004) | 운영/비용 모니터링 |
| `LlmCredentialRegistered` / `LlmCredentialRemoved` | 사용자가 BYOK 키를 등록/삭제 | User Domain, Notification |

# Inputs

- Action Domain의 `LlmInvocation` — 정렬된 대화 메시지(`system|user|assistant`),
  선택적 Provider/Model/생성 파라미터, 스트리밍 여부.
- 사용자 AI 설정(기본 Model·temperature·max_tokens·system_prompt) —
  [settings.md](settings.md).
- 사용자 BYOK 자격증명 등록/삭제 입력 — [user.md](user.md)에 귀속.

# Outputs

- `LlmCompletion` — 정규화된 생성 결과(본문, 사용된 Provider/Model, 사용량,
  종료 사유). Action Domain이 ExecutionResult로 변환한다.
- 스트리밍 중간 출력 — Action Domain의 진행 이벤트로 전달된다
  ([action_layer_api.md](../../docs/icd/action_layer_api.md) `action.progress`).
- 정규화된 오류 — 안정된 코드 집합(구현 수단의 코드 표는 action_layer_api.md).
- `LlmUsage` 기록.
- **사용 가능한 Provider 목록** — Frontend가 Provider를 하드코딩하지 않도록
  **Backend가 제공한다**(§Relationships, LLM-007).

# Relationships

```
Action → LLM → LLM Provider
   │
   └→ Tool → External Service      (형제 관계 — 상하 아님)
```

- **Action Domain**: LLM Domain의 유일한 호출자. LLM은 Action을 모른다(단방향)
  ([action.md](action.md)). Chat·Intent·Planner·Briefing은 **Action을 거쳐서만**
  LLM에 도달한다.
- **Tool Domain**([tool.md](tool.md)): **형제**다. 둘 다 "외부에 나가는 어댑터"라는
  점에서 같은 성격이지만, Tool은 *부작용이 있는 실행*(캘린더 생성, 기기 토글)을,
  LLM은 *생성*을 담당한다. tool.md의 `ToolConnection` 5-state(OAuth 연결/만료/해지)는
  LLM에 적용되지 않는다 — LLM은 API 키 유무만 있으면 된다. 이 차이 때문에 LLM을
  Tool Domain에 흡수하지 않고 별도 문서로 분리했다.
- **User Domain**([user.md](user.md)): 모든 `byok` 자격증명은 특정 User에 귀속된다.
  **다른 User의 자격증명에 접근할 수 없다**(Data Isolation).
- **Settings Domain**([settings.md](settings.md)): 기본 Model/생성 파라미터의 출처.
- **Intent Domain**([intent.md](intent.md)): Intent가 LLM을 **사용**한다. 역방향
  의존은 없다.
- **Memory Layer**(SYS-005, 미구현): 향후 Memory가 조립한 컨텍스트를 Action이
  `LlmInvocation`의 메시지에 포함시킨다. **LLM Domain은 Memory를 직접 호출하지
  않는다.**

# Future Extensions

- **Provider 확장** — Anthropic / OpenRouter / Local LLM / Enterprise Model 추가.
  이는 새 `LlmProvider` 어댑터 추가만으로 가능해야 하며, Action Type·응답 계약·
  DB Schema·Frontend 변경을 요구하지 않는다(LLM-007).
- **Structured Output**(LLM-005) — schema 제약 JSON 생성. Intent/Planner가 소비할
  예정이며 Chat MVP 범위가 아니다.
- **Embedding / Reranking** — Memory Layer(SYS-005) 착수 시 이 Domain에 포함할지
  별도 Domain으로 분리할지 결정한다. **현재 문서는 생성(completion)만 다룬다.**
- **비용 상한 / Circuit Breaker**(LLM-004) — `usage_logs` 스키마와 함께 정의 필요.
  현재 해당 테이블은 존재하지 않는다.
- **Credential Source 확장** — KMS/Secret Manager 도입 시 `platform` Source의
  내부 구현만 바뀌고 이 계약은 유지되어야 한다.

# References

- Requirement: [llm_gateway_requirements.md](../llm_gateway_requirements.md) (LLM-001~007), [system_requirements.md](../system_requirements.md) SYS-010, [chat_requirements.md](../chat_requirements.md)
- API 구현(수단): [docs/icd/action_layer_api.md](../../docs/icd/action_layer_api.md) (`llm.chat_complete`)
- 형제 Domain: [tool.md](tool.md) · 호출자: [action.md](action.md) · 소비자: [intent.md](intent.md)
- Backend: [api/apikey.md](../../backend/docs/api/apikey.md), [database/user_api_keys.md](../../backend/docs/database/user_api_keys.md), [database/ai_settings.md](../../backend/docs/database/ai_settings.md), [services/README.md](../../backend/docs/services/README.md)(`BaseProvider`/`BaseGateway`)
- Frontend: [services/LlmService.md](../../frontend/docs/services/LlmService.md)(현재 임시 구현 — Deprecated), [widgets/ChatWidget.md](../../frontend/docs/widgets/ChatWidget.md)
- Policy: [security_policy.md](../../docs/policies/security_policy.md), [logging_policy.md](../../docs/policies/logging_policy.md), [privacy_policy.md](../../docs/policies/privacy_policy.md)
- Strategy/Decision: [product.md](../../docs/strategy/product.md), [architecture.md](../../docs/strategy/architecture.md), [architecture_decisions.md](../../docs/decisions/architecture_decisions.md) — **DEC-004**(LLM을 별도 Domain으로 분리), DEC-001/002(LLM은 제품이 아니다)
- Review: [docs/ai_platform/2026-08-01-ai-platform-review.md](../../docs/ai_platform/2026-08-01-ai-platform-review.md)

---

# Change Log

- **2026-08-01** — 최초 작성. AI Platform Domain 정의 요청에 따라 LLM Provider
  추상화의 Domain 계약 부재(2026-08-01 리뷰 H1/U1 — 구현 차단 사유)를 해소한다.
  Tool Domain 흡수 대신 별도 Domain으로 분리했다(사유: §Relationships).
