# System ChangeLog

Format: `## [x.y.z] - YYYY-MM-DD` followed by bullet points. Newest first.
Governed by [../CLAUDE.md](../CLAUDE.md). Use this file for changes that
span both Backend and Frontend, or that change the ICD/Domain contract
layer itself (`requirements/domain_icd/`, `docs/icd/`) rather than one
component's implementation.

## [0.2.0] - 2026-08-01

- **AI Platform Domain 계약 확정 (Minor — Domain Contract + Architecture change).**
  LLM API 기능 착수를 위한 Domain / Requirement / ICD 재정의. 구현은 포함하지
  않는다 — 계약 정의만 수행했고 소스 코드는 변경하지 않았다. 따라서
  `backend`/`frontend` component version은 `0.1.0` / `0.1.2`로 유지한다.
- **신규 Domain ICD: [requirements/domain_icd/llm.md](../requirements/domain_icd/llm.md).**
  LLM Provider 추상화의 Domain 계약이 존재하지 않아
  [../CLAUDE.md](../CLAUDE.md) ICD Rule("Domain ICD가 없는 기능은 구현을
  진행하지 않는다")상 구현이 차단되어 있던 상태를 해소한다. Purpose / Domain
  Model / Responsibilities / State / Events / Inputs / Outputs / Relationships /
  Future Extensions 9개 섹션 형식을 따른다.
- **LLM은 Tool Domain에 편입하지 않고 별도 Domain으로 분리** (CTO 결정
  2026-08-01, [docs/decisions/architecture_decisions.md](../docs/decisions/architecture_decisions.md)
  DEC-004). 사유: Tool의 `ToolConnection` 5-state(OAuth 수명주기)가 LLM에
  적용되지 않고, Intent/Planner가 Action을 거치지 않고 LLM을 직접 소비하며,
  Provider 라우팅·폴백·비용·구조화 출력이 범용 Tool 계약보다 풍부하다. 두
  Domain은 **형제 관계**다. [requirements/domain_icd/tool.md](../requirements/domain_icd/tool.md)
  Future Extensions의 미결 항목("LLM Provider도 Tool의 한 사례로 편입할지 검토")을
  이 결론으로 종결했다.
- **Product Philosophy 불변**: LLM은 Product Domain이 **아니다**. DEC-001/002
  ("Action Layer가 제품이다")를 그대로 유지하며, `User → LLM → Dashboard` 구조를
  llm.md에 명시적 금지로 못박았다. 실행 모델은
  `User → Intent/Action → Action Layer → LLM Gateway → Provider`다.
- **신규 Requirement 2건** —
  [requirements/llm_gateway_requirements.md](../requirements/llm_gateway_requirements.md):
  **LLM-006 Credential Source Resolution**(`byok`/`platform` 2종 최소 계약,
  해석 순서 `byok` 우선 → `platform` → 실패), **LLM-007 Provider Adapter
  Contract**(신규 Provider 추가 시 Action Type·응답 봉투·DB Schema·Frontend
  무변경). 둘 다 Planned / 0%. Gateway 책임 범위표(하는 것 5 / 하면 안 되는 것 5)와
  Provider Adapter 불변조건 5항을 함께 정의했다.
- **의도적으로 도입하지 않은 것**: `CredentialResolver` 독립 Domain, KMS,
  Secret Manager, Credential Service 분리. 요청에 따라 **최소 계약만** 정의했다 —
  필요성 판단은 [docs/policies/security_policy.md](../docs/policies/security_policy.md)
  "Secret 관리"에서 별도로 한다.
- **API Contract 변경: `llm.chat_complete` 정식화** —
  [docs/icd/action_layer_api.md](../docs/icd/action_layer_api.md). 이전에는 Event
  표의 *예시*로만 존재해 입출력 스키마가 없었다(Backend/Frontend가 계약을
  지어낼 수밖에 없는 상태). 추가된 것: 입력 스키마(`messages`/`provider`/`model`/
  `temperature`/`max_tokens`/`stream`), 파라미터 우선순위(`input` > `ai_settings` >
  Provider 기본값), 정규화 응답 `LlmCompletion`, 스트리밍 경로(202 + 기존 SSE
  이벤트 재사용), **LLM 전용 에러 코드 8종**, `GET /v1/actions/types`의 Provider
  카탈로그. 기존 `{success,data,error}` 봉투와 Action 공통 필드(`type`/`input`/
  `source`)를 그대로 사용하며 새 봉투를 도입하지 않는다 — 하위 호환 유지.
- **Frontend Provider 하드코딩 금지가 계약이 되었다**(LLM-007). Provider 목록의
  단일 출처는 Backend(`GET /v1/actions/types`)다. 현재 프론트엔드는 Provider를
  3곳에 하드코딩하고 있고 `ApiKeyStatus.fromJson`이 신규 Provider를 조용히
  누락시킨다 — 계약 위반 상태이며 구현 프롬프트에 수정 대상으로 포함했다.
- [requirements/requirements_traceability.md](../requirements/requirements_traceability.md)에
  LLM-006/007 행 추가, [requirements/domain_icd/README.md](../requirements/domain_icd/README.md)
  문서 목록에 LLM Domain 행 추가.
- 근거 리뷰: [docs/ai_platform/2026-08-01-ai-platform-review.md](../docs/ai_platform/2026-08-01-ai-platform-review.md)
  (양 소스 저장소 `letmeknow @ 011b9c2` / `lingon @ dd38b22` 직접 대조).
  구현 지시는 [backend_prompt_ai_gateway.md](../docs/ai_platform/backend_prompt_ai_gateway.md),
  [frontend_prompt_ai_chat_gateway.md](../docs/ai_platform/frontend_prompt_ai_chat_gateway.md).
- **Versioning 판단 근거**: [../CLAUDE.md](../CLAUDE.md) Version 관리의 Minor
  조건("Domain Contract change / Architecture change")에 해당한다. 2026-07-30
  `0.1.1` 항목의 "끝자리만 증가" 관행은 그 항목 자체가 밝혔듯 2026-07-30 정책
  갱신으로 대체되었으므로, 이번에는 Minor로 `0.2.0`을 부여한다(CTO 결정
  2026-08-01).
- **이번 Phase 구현 중 추가 승격 없음** (CTO 결정 2026-08-01): 이 계약을
  구현하는 AI Platform Phase 동안에는 `system` version을 추가로 올리지 않는다 —
  계약이 이미 `0.2.0`으로 고정되었고 구현은 그 계약을 채우는 작업이기
  때문이다. Component version(`backend`/`frontend`)은 각자의 구현 진척에 따라
  독립적으로 움직인다. Phase 종료 후 계약이 다시 바뀌면 그때 재판단한다.

## [0.1.1] - 2026-07-30

- **Versioning convention changed**: from this entry on, every version bump
  increments only the last digit (`V_0.1.0` → `V_0.1.1` → `V_0.1.2` ...),
  per user instruction — see [../CLAUDE.md](../CLAUDE.md) Version 관리.
  This entry itself was originally drafted as `0.1.2` and renumbered to
  `0.1.1` to follow the new rule.
- **Dashboard Domain ICD extended for LLM Adaptive Dashboard UI structure.**
  Added `WidgetVariant` (Vertical/Square/Horizontal), `WidgetMetadata`, and
  `LayoutConstraint` entities to
  [requirements/domain_icd/dashboard.md](../requirements/domain_icd/dashboard.md),
  plus three new Requirements
  ([requirements/dashboard_requirements.md](../requirements/dashboard_requirements.md)
  DSH-009/DSH-010/DSH-011). Purely additive — DSH-005 (current fixed tablet
  layout) is unchanged, and no Status/Progress values were altered since
  nothing was implemented (Planned/0% throughout).
- **New Planner Requirement PLN-006 (Layout Preference Generation)** —
  [requirements/planner_requirements.md](../requirements/planner_requirements.md).
  Natural-language → Layout Preference interpretation is assigned to the
  Planner (AI Decision Layer), not Dashboard, to keep
  [dashboard.md](../requirements/domain_icd/dashboard.md)'s "no Business
  Logic" boundary intact — Dashboard only subscribes to the resulting
  `LayoutDirective`.
- **Conflict resolved, not silently overridden**: the source request
  proposed "Dashboard is the Product" as a philosophy addition. This
  directly contradicts the Adopted
  [docs/strategy/product.md](../docs/strategy/product.md) Core Philosophy
  ("Dashboard는 제품이 아니다. Action Layer가 제품이다.") and
  [docs/decisions/architecture_decisions.md](../docs/decisions/architecture_decisions.md)
  DEC-001 ("Dashboard는 MVP가 아니다", Adopted). Per user decision
  (2026-07-30), the existing SSOT was kept; the phrase was not added
  anywhere in DevDocs. Only the UI/UX technical structure (WidgetVariant,
  WidgetMetadata, LayoutConstraint, `LayoutDirective`) was adopted, inside
  Layer 3's existing boundary.
- [docs/roadmap/roadmap.md](../docs/roadmap/roadmap.md) Phase 5 Next
  Milestone updated to reflect that the "AI Layout Update 정의" milestone is
  now complete (definition only, no implementation).
- No source code was changed by this pass — `backend`/`frontend` component
  versions stay at `0.1.0`.

## [0.1.0] - 2026-07-29 (confirmed Baseline; supersedes the 2026-07-23 seed note below)

- **V_0.1.0 Baseline Release.** Backend, Frontend, and DevDocs are all
  promoted to `V_0.1.0` as the project's first official baseline, built on
  two independent verification/schema-verification passes each for Backend
  (`jdukmin/lingon`) and Frontend (`jdukmin/letmeknow`). No source code was
  changed by this DevDocs pass. Full narrative:
  [status/backend/V0.1.0.md](../status/backend/V0.1.0.md),
  [status/frontend/V0.1.0.md](../status/frontend/V0.1.0.md).
- `status/` rebuilt against real source-repository commit history (22
  version documents total — 10 backend, 12 frontend) instead of this docs
  mirror's own commit history, which does not track actual product
  development. See [status/README.md](../status/README.md) §2.
- Known open items carried into `V_0.1.x`: Frontend Weather module leaks
  raw exception text to users (P0); Backend DB schema is not fully
  reproducible from `migrations/` (High); CORS is fully open and HTTPS/HSTS
  is unenforced in-repo (Medium). Full list:
  [status/current_status.md](../status/current_status.md).
- 2026-07-23 seed note (original entry, kept for history): `CLAUDE.md`
  created — this repository began operating under a formal Context Loading
  Rule, ICD Rule, Verification Report Rule, Version policy, ChangeLog
  policy, and Commit convention (see [../CLAUDE.md](../CLAUDE.md)), and
  introduced `version/`, `changelog/`, `verification/` as new top-level
  directories. No existing documentation structure was reorganized.
