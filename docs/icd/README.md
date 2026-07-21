# ICD — Action Layer 전환

> **Status**: Proposed (미구현, 설계 확정 대기) · **Progress**: 0% · **Last Updated**: 2026-07-21 · **Next Milestone**: Tier 0 백엔드 스캐폴딩 — `POST /v1/actions/execute` 최소 구현([action_layer_api.md](action_layer_api.md))

## 왜 이 폴더가 필요한가

전략이 바뀌었다: LetMeKnow는 Dashboard 제품이 아니라 **Personal Action OS**다
([../strategy/product.md](../strategy/product.md)). 지금까지 `backend/docs`,
`frontend/docs`의 ICD/인터페이스 문서는 전부 **Dashboard가 API의 중심**이라는
전제로 쓰여 있다(라우트별 REST — 날씨/캘린더/설정/인증을 프론트가 각각 직접
호출). 이 폴더는 **Action이 API의 중심**이 되는 새 ICD를 제안한다.

> **중요**: 이 폴더는 기존 API를 수정하지 않는다. `backend/docs/api/*.md`에
> 문서화된 엔드포인트는 지금도 유효하며 계속 동작한다. 이 폴더는 그 위에
> Action Layer라는 새 계층을 어떻게 씌울지에 대한 **제안(Proposal)**이다 —
> 구현은 [requirements/action_requirements.md](../../requirements/action_requirements.md) ACT-001(Action Dispatch)
> 착수 시점부터 시작된다.

> **2026-07-21 갱신**: 이 폴더보다 상위 계층으로 [requirements/domain_icd/](../../requirements/domain_icd/)가
> 새로 정의되었다 — 도메인 간 계약(Contract)은 그쪽이 기준이고, 이 폴더
> (`docs/icd/`)의 API 제안은 그 계약을 구현하는 **수단**으로 재해석된다. 예:
> `POST /v1/actions/execute`는 [requirements/domain_icd/action.md](../../requirements/domain_icd/action.md)의
> Action Lifecycle을 구현하는 한 가지 방법일 뿐이다. 이 폴더 자체는 변경하지
> 않았다.

## 문서 구성

| 문서 | 내용 |
|---|---|
| [action_layer_api.md](action_layer_api.md) | 신규 Action/Workflow API — Request/Response/Event/State/Error Code |
| [frontend_interaction_flow.md](frontend_interaction_flow.md) | Chat → Intent Parsing → Action Result → History → Dashboard 화면 흐름 |
| [api_comparison.md](api_comparison.md) | 기존 API 대비 추가 / 변경 / Deprecated 비교표 |
| [gap_analysis.md](gap_analysis.md) | Frontend ↔ Backend 누락 Interface/API/Event/State/Error Code 분석 |

## 검토 대상과 매핑

이번 검토([development_rules.md](../development_rules.md), 사용자 요청)가 요구한
8개 항목과 위 문서의 대응:

| 검토 대상 | 대응 문서 |
|---|---|
| 1. Frontend ↔ Backend ICD | [action_layer_api.md](action_layer_api.md), [api_comparison.md](api_comparison.md) |
| 2. Backend Route 문서 | [api_comparison.md](api_comparison.md) (기존 `backend/docs/routes`, `api/*` 검토) |
| 3. Frontend Service 문서 | [frontend_interaction_flow.md](frontend_interaction_flow.md) (기존 `frontend/docs/services/*` 검토) |
| 4. API Request/Response | [action_layer_api.md](action_layer_api.md) |
| 5. State 구조 | [action_layer_api.md](action_layer_api.md) State 섹션, [frontend_interaction_flow.md](frontend_interaction_flow.md) |
| 6. Screen Flow | [frontend_interaction_flow.md](frontend_interaction_flow.md) |
| 7. Plugin 구조 | [gap_analysis.md](gap_analysis.md) (Action Dispatcher를 Fastify plugin으로 추가하는 안) |
| 8. Service Layer | [gap_analysis.md](gap_analysis.md), [api_comparison.md](api_comparison.md) |

## 원칙

```
Dashboard 중심 API (기존)          Action 중심 API (신규 제안)
─────────────────────             ─────────────────────
FE → /v1/weather/*     직접 호출    FE → /v1/actions/execute { type: "weather.get_current" }
FE → /v1/calendar/*    직접 호출         → 내부에서 weather/calendar/... 호출
FE → /v1/settings/*    직접 호출
```

Action Layer가 자리잡아도 `/v1/weather/*`, `/v1/calendar/*` 같은 기존 엔드포인트가
사라지는 것이 아니다 — Action Layer 내부 구현이 이들을 호출하는 **Tool**이 된다
(자세한 매핑은 [api_comparison.md](api_comparison.md)). 프론트가 이 엔드포인트를
직접 호출하던 습관만 Action Layer 경유로 옮겨간다.

## 우선순위 (MVP 반영)

모든 신규 API는 [../roadmap/mvp.md](../roadmap/mvp.md) Tier를 따른다:

```
Tier 0  Natural Language → Action        (actions/execute 최소 스캐폴딩)
Tier 1  Calendar / Todo / Reminder       (calendar.*, todo.*, reminder.* Action Type)
Tier 2  Home Assistant                   (home_assistant.* Action Type)
Tier 3  NAS / Server Monitoring          (nas.*, server.* Action Type)
Tier 4  Workflow                         (/v1/workflow/*)
Tier 5  Dashboard                        (변경 없음 — 시각화 레이어만)
```

## 관련 문서

- [../strategy/architecture.md](../strategy/architecture.md), [../strategy/product.md](../strategy/product.md)
- [../roadmap/mvp.md](../roadmap/mvp.md), [../decisions/architecture_decisions.md](../decisions/architecture_decisions.md)
- [../../requirements/action_requirements.md](../../requirements/action_requirements.md), [../../requirements/planner_requirements.md](../../requirements/planner_requirements.md)
- [../../backend/docs/routes/README.md](../../backend/docs/routes/README.md), [../../frontend/docs/ui/AodDisplay.md](../../frontend/docs/ui/AodDisplay.md)

---

# Change Log

- **2026-07-21** — Action Layer 전략에 따라 신규 작성(Created according to Action Layer Strategy).
