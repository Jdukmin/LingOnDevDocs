# Front/Back 분리 프롬프트 운영 Playbook

> **Status**: Proposed · **Progress**: 0% (운영 절차 문서 — 구현 대상 아님) · **Last Updated**: 2026-07-21 · **Next Milestone**: Phase 0(Refresh Token 인터셉터) 프롬프트 착수 시 이 문서 기준으로 진행

Backend와 Frontend를 **서로 다른 프롬프트 세션(예: 별도 Claude Code 세션)**에
순차적으로 넣어 구현을 맡길 때 지켜야 할 절차다. [README.md](README.md),
[action_layer_api.md](action_layer_api.md), [requirements/domain_icd/](../../requirements/domain_icd/)를
만든 뒤, 실제로 이 문서들을 "프롬프트로 운영"하는 단계에서 드러난 위험
(상태값 불일치 등)을 반영해 작성했다.

---

## 1. 왜 이 문서가 필요한가

Domain ICD([requirements/domain_icd/](../../requirements/domain_icd/))와 API
ICD([action_layer_api.md](action_layer_api.md))는 원래 같은 대화 세션 안에서
서로 참조하며 작성됐다. 하지만 실제 구현은 Backend 세션과 Frontend 세션이
분리되어 순차적으로 진행된다 — 이 경우 두 문서를 서로 대조할 사람이 없으면
계약이 조용히 어긋난다. 실제로 최초 작성 시 `action.md`(State: `Cancelled`
있음, `Timed_out` 없음)와 `action_layer_api.md`(State: `timed_out` 있음,
`cancelled` 없음)가 서로 달랐던 사례가 있었다(2026-07-21 수정, 두 문서 모두
참조). 이 Playbook은 그런 드리프트를 프롬프트 운영 단계에서 미리 막기 위한
것이다.

## 2. 프롬프트에 반드시 함께 넣을 문서 (필수 동반 문서)

Domain ICD 문서 **단독으로는 구현할 수 없다** — REST/State/DB를 의도적으로
정의하지 않기 때문이다. 아래 매트릭스 없이 Domain ICD만 프롬프트에 넣으면
Backend/Frontend가 계약을 임의로 지어낸다.

| 대상 기능 | Backend 프롬프트 필수 동반 문서 | Frontend 프롬프트 필수 동반 문서 |
|---|---|---|
| Action 파이프라인 전반 | [requirements/domain_icd/action.md](../../requirements/domain_icd/action.md), [action_layer_api.md](action_layer_api.md), [api_comparison.md](api_comparison.md) | [requirements/domain_icd/action.md](../../requirements/domain_icd/action.md), [action_layer_api.md](action_layer_api.md), [frontend_interaction_flow.md](frontend_interaction_flow.md) |
| Tool 개별 연동(Calendar/HA/NAS 등) | 해당 `requirements/domain_icd/<domain>.md` + [tool.md](../../requirements/domain_icd/tool.md) + [action_layer_api.md](action_layer_api.md) `GET /v1/actions/types` 절 | 해당 `requirements/domain_icd/<domain>.md` + [action_layer_api.md](action_layer_api.md) |
| Workflow | [requirements/domain_icd/workflow.md](../../requirements/domain_icd/workflow.md), [action_layer_api.md](action_layer_api.md) (Workflow API 절), [requirements/planner_requirements.md](../../requirements/planner_requirements.md) | 동일 + [frontend_interaction_flow.md](frontend_interaction_flow.md) |
| Dashboard 진입 흐름 변경 | (Backend 변경 없음) | [frontend_interaction_flow.md](frontend_interaction_flow.md), [requirements/domain_icd/dashboard.md](../../requirements/domain_icd/dashboard.md) |
| 공통(모든 기능) | [backend/docs/DevelopmentGuide.md](../../backend/docs/DevelopmentGuide.md)(ICD v0.0 envelope, 에러 처리 컨벤션) | [frontend/docs/state/Overview.md](../../frontend/docs/state/Overview.md)(`BaseModule` 패턴) |

**규칙**: 새 기능을 프롬프트로 만들 때, 위 표에 없는 조합이면 먼저 이 표에
행을 추가한 뒤 진행한다(표에 없다는 것은 아직 계약이 정리되지 않았다는
신호다).

## 3. 실행 순서 / 세션 간 Hand-off 체크리스트

기능 단위 공통 루프:

```
0) Domain ICD ↔ API ICD 불일치 여부 확인(사람이 확인 — 프롬프트 아님)
1) Backend 세션: API/DB 구현 → curl 등으로 실제 응답 확인
2) Frontend 세션: 해당 API 연동 → 앱 실행으로 실제 동작 확인
3) 통합 확인: 두 결과를 한 자리에서 대조(사람 또는 통합 확인 전용 세션)
4) requirements/*, FeatureList.md, Change Log 갱신 (§4 규칙 적용)
```

Backend → Frontend 순서가 기본이다(Frontend가 계약을 소비하는 쪽이므로).
예외: Frontend 단독으로 끝나는 작업(예: Refresh Token 인터셉터 — Backend는
이미 완료됨)은 Backend 프롬프트 없이 바로 2번부터 시작한다.

**MVP 우선순위를 반영한 착수 순서**(상세 근거는 이전 보고서 참고, 여기서는
운영 순서만 고정):

1. Refresh Token 자동 갱신 인터셉터(Frontend 단독)
2. Action 파이프라인 최소 골격 — `weather.get_current` 1개만 Wrap(Backend→Frontend)
3. Google Calendar Action 연동(Frontend 단독 — Backend 기완료)
4. Intent 최소 스텁(Backend→Frontend)
5. Todo Domain(Backend→Frontend)
6. Reminder Domain(Backend→Frontend)
7. Notification 최소 버전(Backend→Frontend)
8. Home Assistant Tool(Backend→Frontend) — 홈 네트워크 도달성 해결 후
9. NAS Tool(Backend→Frontend) — 홈 네트워크 도달성 해결 후
10. Workflow 엔진(Backend→Frontend)
11. Dashboard 진입 흐름 재배치(Frontend 단독, 가장 마지막)

## 4. Progress/Status 갱신 규칙 (분리 세션 전용)

한쪽 세션은 **자신이 실제로 확인한 절반만** Progress에 반영한다 — 상대편이
연동했는지 알 수 없기 때문이다.

| 상황 | 허용 Progress 상한 | 비고 |
|---|---|---|
| Backend 세션만 완료·자체 검증(curl 등) | 25% | "한쪽만 구현" 규칙 그대로 |
| Frontend 세션만 완료·자체 검증(로컬 mock 등) | 25% | 동일 |
| Backend + Frontend 각자 완료, 서로 연동 여부 미확인 | 50% | 이 상태에서 임의로 75%를 적지 않는다 |
| 통합 확인(§3의 3번 단계)까지 마침 | 75% | 실제 테스트 코드 실행까지는 아직 아님 |
| 자동/수동 테스트로 실제 동작까지 확인 | 100% | [requirements/README.md](../../requirements/README.md) Progress 규칙과 동일 |

이 표는 [requirements/README.md](../../requirements/README.md)의 기존
Progress 규칙("확인이 되지 않으면 변경하지 않는다")을 분리-세션 상황에
맞게 구체화한 것이며, 상충하지 않는다.

## 5. 버전/호환성 정책 요약

자세한 내용은 [action_layer_api.md](action_layer_api.md) "버전/호환성"
절 참고. 요약: ICD v0.0 봉투 유지, Action Type 스키마는 추가만 허용(하위
호환 깨는 변경은 새 Action Type으로), State 이름은
[requirements/domain_icd/action.md](../../requirements/domain_icd/action.md)가
단일 기준.

## 관련 문서

- [README.md](README.md), [action_layer_api.md](action_layer_api.md)
- [../../requirements/domain_icd/README.md](../../requirements/domain_icd/README.md)
- [../../requirements/README.md](../../requirements/README.md)

---

# Change Log

- **2026-07-21** — Front/Back 분리 프롬프트 운영 검토 결과를 반영해 최초 작성
  (상태값 불일치 수정, 필수 동반 문서 매트릭스, 실행 순서, Progress 갱신 규칙,
  버전 정책 포함).
