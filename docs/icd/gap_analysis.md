# Frontend ↔ Backend Gap Analysis

> **Status**: Complete (분석 완료, 대응 구현은 미착수) · **Progress**: 0% (구현 기준) · **Last Updated**: 2026-07-21 · **Next Milestone**: 아래 "우선순위" 순서로 착수

`backend/docs`, `frontend/docs`, `requirements/` 전체를 검토해 찾은 Frontend ↔
Backend 사이의 누락 항목이다. 여기 적힌 것은 전부 **현재 문서 기준 근거가
없다는 뜻**이며(코드 부재 추정), 실제 소스 저장소 확인 전까지는 "확정된 결함"이
아니라 "확인이 필요한 후보"로 다룬다([requirements/README.md](../../requirements/README.md)의
검증 원칙을 그대로 따름).

---

## 1. 누락된 Interface

| 항목 | 설명 | 근거 |
|---|---|---|
| Action / Workflow 추상화 | 백엔드는 라우트별 REST만 있고 공용 Action Dispatcher가 없다 | [requirements/action_requirements.md](../../requirements/action_requirements.md) ACT-001, [backend/docs/routes/README.md](../../backend/docs/routes/README.md) |
| Intent 처리 인터페이스 | Chat이 원문 메시지를 그대로 LLM에 전달 — 분류/슬롯 추출 단계 없음 | [requirements/intent_requirements.md](../../requirements/intent_requirements.md) |
| Refresh Token 자동 갱신 인터셉터 | 백엔드 `POST /v1/auth/refresh`는 구현 완료, 프론트 `ApiClient`의 401 인터셉터+retry는 미연결 | [frontend/docs/FeatureList.md](../../frontend/docs/FeatureList.md) 스텁 섹션, [requirements/system_requirements.md](../../requirements/system_requirements.md) SYS-008 근거 노트 |
| Google Calendar 연동 인터페이스 | 백엔드 `GET /v1/calendar/events`는 완성, 프론트 `CalendarModule`은 로컬 캘린더만 호출 — 연결 코드가 없음 | [requirements/connector_requirements.md](../../requirements/connector_requirements.md) CON-001 |

## 2. 누락된 API

| 항목 | 설명 |
|---|---|
| `/v1/actions/*` 전체 | 실행/이력/제안/타입 카탈로그 — [action_layer_api.md](action_layer_api.md) |
| `/v1/workflow/*` 전체 | Workflow 정의/실행 — [action_layer_api.md](action_layer_api.md) |
| Todo API | `requirements/dashboard_requirements.md` DSH-004 — 백엔드에 Todo 관련 라우트/테이블이 전혀 없음 |
| Reminder API | 어떤 계층 문서에도 아직 정의되지 않음 — [../roadmap/roadmap.md](../roadmap/roadmap.md) Phase 1에서 Requirement 선행 필요 항목으로 지적됨 |
| Home Assistant / NAS / Server 커넥터 API | [requirements/connector_requirements.md](../../requirements/connector_requirements.md) CON-002/004/005 — 전부 0% |

## 3. 누락된 Event

| 항목 | 설명 |
|---|---|
| 스트리밍 전송 수단 전체 | 백엔드 문서 어디에도 SSE/WebSocket 언급이 없다 — Chat 스트리밍(CHAT-002)이 막혀 있는 근본 원인 |
| Push Notification | 프론트 `frontend/docs/FeatureList.md` 예정 기능에 "푸시 알림"이 있으나 백엔드에는 관련 인프라(FCM 연동 등) 문서가 전혀 없다 |
| Action 실행 진행률 이벤트 | `action.progress`/`action.completed` 등 — 신규([action_layer_api.md](action_layer_api.md) Event 모델) |

## 4. 누락된 State

| 항목 | 설명 |
|---|---|
| `ActionExecution` / `WorkflowExecution` (Backend DB) | 신규 테이블 필요 — `action_executions`, `workflows`, `workflow_executions` (스키마는 [action_layer_api.md](action_layer_api.md) State 섹션 참고, 정식 DB 문서는 구현 착수 시 `backend/docs/database/`에 추가) |
| `ActionModule` / `ActionHistoryModule` / `SuggestionModule` (Frontend) | [action_layer_api.md](action_layer_api.md), [frontend_interaction_flow.md](frontend_interaction_flow.md) |
| Widget Visibility 상태 | [requirements/dashboard_requirements.md](../../requirements/dashboard_requirements.md) DSH-006 — 위젯 표시/숨김을 저장할 상태가 없음 |
| SidebarModule 영속성 | `frontend/docs/state/Overview.md`에 "❌ 앱 재시작 시 초기화됨"으로 이미 기록된 기존 gap — Action Layer와 무관하지만 함께 정리 권장 |

## 5. 누락된 Error Code

| 항목 | 설명 |
|---|---|
| 통합 에러 코드 레지스트리 부재 | 코드가 `backend/docs/api/*.md` 각 파일에 개별 기술되어 있고, 한곳에 모아둔 문서가 없었다 — 이번에 [action_layer_api.md](action_layer_api.md) 에러 코드 레지스트리로 최초 통합 |
| `weather.md`에 에러 코드 표 없음 | 다른 API 문서(`auth.md`, `calendar.md`)는 `error.code` 표가 있지만 `weather.md`는 없다 — 문서 누락 가능성(코드 확인 필요) |
| Action 전용 코드 부재(당연히) | `ACTION_TYPE_UNKNOWN` 등 — 신규, [action_layer_api.md](action_layer_api.md) |

## 문서 일관성 관련 부가 발견 (참고)

이번 검토 중 Action Layer와 직접 관련은 없지만 눈에 띈 기존 문서 불일치:

- [backend/docs/api/apikey.md](../../backend/docs/api/apikey.md)의 "인증이 구현되지 않음(401 unconditionally)" 안내는
  [backend/docs/api/auth.md](../../backend/docs/api/auth.md)(JWT 미들웨어 구현 완료)와 모순되는 **오래된 문구**로 보인다.
  기존 문서라 이번에도 수정하지 않았다 — 별도 확인/갱신 필요.

---

## 우선순위 (착수 순서 제안)

[../roadmap/mvp.md](../roadmap/mvp.md) Tier를 따른다:

1. `POST /v1/actions/execute` 최소 스캐폴딩 (Tier 0) — Action Type 1개(`weather.get_current`)만 Wrap해서 파이프라인 검증
2. Refresh Token 자동 갱신 인터셉터 연결 (이미 backend 완료, frontend만 필요 — 비용 대비 가치 높음)
3. Google Calendar 연동 인터페이스 연결 (backend 완료, frontend만 필요)
4. Todo/Reminder Requirement 정의 후 API 설계 (Tier 1)
5. 스트리밍 전송 수단(SSE) 도입 — Chat 스트리밍 + Action progress 이벤트 공용 기반

## 관련 문서

- [README.md](README.md), [action_layer_api.md](action_layer_api.md), [api_comparison.md](api_comparison.md)

---

# Change Log

- **2026-07-21** — Action Layer 전략에 따라 신규 작성(Created according to Action Layer Strategy).
