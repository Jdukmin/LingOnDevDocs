# System Requirements

최상위 System Requirement 목록. 각 SYS는 Business Goal("LetMeKnow: AI 기반
Personal Action OS")의 하위 항목이며, 대부분 [README.md](README.md)에서 정의한
Layer(Dashboard → Chat → Intent → Memory → Planner → Action → Connector)의
하위 Layer Requirement 문서로 세분화된다. Progress는 하위 Layer Requirement의
근거를 종합한 값이며, 세부 근거는 각 Layer 문서의 "근거 노트"를 참조한다.

| ID | Parent Feature | Requirement | Description | Verification | Status | Progress |
|---|---|---|---|---|---|---|
| SYS-001 | LetMeKnow | Dashboard Management | Dashboard shall present the user's current context (time, weather, calendar, AI briefing) as a read-only, always-on display. | Demo | In Progress | 25% |
| SYS-002 | LetMeKnow | Natural Language Interaction | The system shall let the user express intent to LetMeKnow via free-form natural language chat. | Demo | In Progress | 25% |
| SYS-003 | LetMeKnow | AI Briefing | The system shall generate a natural-language summary ("brief") from the user's current weather and calendar context. | Demo | In Progress | 25% |
| SYS-004 | LetMeKnow | Intent Processing | The system shall convert a user's natural-language message into a structured Intent (classification + slots + entities) usable by the Planner. | Analysis | Planned | 0% |
| SYS-005 | LetMeKnow | Memory Management | The system shall retrieve relevant user context (calendar, notes) via semantic/hybrid search (RAG) to ground Intent and Planner decisions. | Analysis | Planned | 0% |
| SYS-006 | LetMeKnow | Action Execution | The system shall dispatch, validate, execute, and log discrete Actions requested by the Planner or a direct API call. | Review | In Progress | 25% |
| SYS-007 | LetMeKnow | Connector Management | The system shall integrate with external services (Google Calendar, Home Assistant, Notion, NAS, generic servers) through a common connector + OAuth pattern. | Integration Test | In Progress | 25% |
| SYS-008 | LetMeKnow | User Authentication | The system shall authenticate users via Google Sign-In (native ID Token and web redirect flows) and maintain their session via rotating JWT access/refresh tokens. | Integration Test | Done | 75% |
| SYS-009 | LetMeKnow | Automation Workflow | The Planner shall turn a validated Intent into an ordered, dependency-aware plan of Actions, with conditional branching, retry, and rollback strategies. | Analysis | Planned | 0% |
| SYS-010 | LetMeKnow | LLM Gateway | The backend shall provide a provider-agnostic LLM gateway with routing, fallback, cost monitoring, and structured-output support, usable by Intent/Planner/Chat. | Review | Planned | 0% |

---

## 근거 노트 (Evidence)

- **SYS-001**: Dashboard 레이아웃과 6개 핵심 위젯(Clock/Weather/Calendar/Brief/Chat/Status)이
  Flutter로 구현되어 있으나, Todo Widget · Widget Visibility 토글 · AI 기반 레이아웃
  변경은 존재하지 않는다. 근거: [frontend/docs/ui/AodDisplay.md](../frontend/docs/ui/AodDisplay.md),
  [frontend/docs/FeatureList.md](../frontend/docs/FeatureList.md). 세부: [dashboard_requirements.md](dashboard_requirements.md).
- **SYS-002**: `ChatWidget` + `ChatModule` + client-side `OpenAiGateway`가 동작하지만
  스트리밍/음성입력/마크다운 렌더링은 없고, LingOn 백엔드를 거치지 않고 OpenAI를
  직접 호출한다(Architecture의 Chat→Intent 경로 미구현). 근거:
  [frontend/docs/widgets/ChatWidget.md](../frontend/docs/widgets/ChatWidget.md),
  [frontend/docs/services/LlmService.md](../frontend/docs/services/LlmService.md).
  세부: [chat_requirements.md](chat_requirements.md).
- **SYS-003**: `BriefCardWidget`이 날씨+캘린더 컨텍스트로 브리핑 텍스트를 표시하지만,
  생성 로직은 SYS-002와 동일하게 백엔드 AI Briefing 서비스 없이 클라이언트에서
  처리된다. 근거: [frontend/docs/widgets/BriefCardWidget.md](../frontend/docs/widgets/BriefCardWidget.md).
  전용 Layer Requirement 문서는 아직 없다(필요 시 `brief_requirements.md`로 분리 검토).
- **SYS-004 / SYS-005 / SYS-009**: `backend/docs`, `frontend/docs` 전체에서 Intent,
  Memory/RAG, Planner에 해당하는 코드·문서가 전혀 발견되지 않았다(폴더/파일 없음).
  Architecture 상 정의만 된 상태. 세부: [intent_requirements.md](intent_requirements.md),
  [memory_requirements.md](memory_requirements.md), [planner_requirements.md](planner_requirements.md).
- **SYS-006**: 범용 Action Dispatch/Router는 없지만, HTTP 라우트 단위의 CRUD,
  요청 검증, 요청/예외 로깅(`request_logs`/`raw_logs`), ICD v0.0 공통 응답 envelope은
  구현되어 있다. 근거: [backend/docs/database/README.md](../backend/docs/database/README.md),
  [backend/docs/DevelopmentGuide.md](../backend/docs/DevelopmentGuide.md). 세부: [action_requirements.md](action_requirements.md).
- **SYS-007**: Google OAuth(로그인) + Google Calendar 연결은 백엔드가 완전히
  구현했으나 프론트엔드는 아직 로컬 캘린더만 표시하고 Google Calendar API를
  호출하지 않는다(`frontend/docs/FeatureList.md` 예정 기능: "캘린더 Google 동기화").
  Home Assistant/Notion/NAS/Server 커넥터는 존재하지 않는다. 세부: [connector_requirements.md](connector_requirements.md).
- **SYS-008**: 백엔드(`backend/docs/api/auth.md`)와 프론트엔드(`frontend/docs/FeatureList.md`
  "✅ 구현 완료 > 인증")가 로그인/세션복원/로그아웃/토큰 회전을 모두 문서화하고
  있으며 서로 정확히 대응한다. 다만 401 발생 시 프론트의 자동 재발급(인터셉터)은
  아직 연결되지 않았다(`frontend/docs/FeatureList.md` 스텁: "Refresh Token 재발급 UI 연동").
  이 저장소에는 테스트 코드/실행 로그가 없어 100%는 부여하지 않았다.
- **SYS-010**: 백엔드 `src/gateway/`에는 OpenWeather 게이트웨이만 존재하고 LLM
  게이트웨이는 없다(`backend/docs/FeatureList.md` Planned: "Additional LLM providers... none exist"). 프론트엔드는
  `LlmGateway`/`OpenAiGateway`로 OpenAI를 직접 호출하는 임시 구현을 갖고 있으나
  이는 Architecture가 의도하는 백엔드 LLM Gateway가 아니다. 세부: [llm_gateway_requirements.md](llm_gateway_requirements.md).
