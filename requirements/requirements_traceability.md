# Requirements Traceability

Business Goal → System Requirement → Layer Requirement → Implementation File →
Verification 전체 추적 매트릭스. "Implementation File"은 이 저장소(`LingOnDevDocs`)에
미러링된 문서 기준이며, 실제 소스 코드 저장소의 파일이 아니다(문서가 소스 파일
경로를 인용하는 경우 그 경로를 함께 표기했다).

Business Goal: **LetMeKnow — AI 기반 Personal Action OS**
("Dashboard는 단순한 UI이며, 사용자는 자연어로 의도를 전달하고 LLM이 Intent를
생성한 뒤 Planner와 Action Router가 실제 서비스를 실행한다" — [README.md](README.md))

| System Requirement | Layer Requirement | Implementation File(s) | Verification |
|---|---|---|---|
| SYS-001 Dashboard Management | DSH-001 Time Display | `frontend/docs/widgets/ClockWidget.md` (`lib/widget/clock_widget.dart`) | Demo |
| SYS-001 | DSH-002 Weather Widget | `frontend/docs/widgets/WeatherNowWidget.md`, `WeatherForecastWidget.md`, `WeatherIconWidget.md` · `backend/docs/api/weather.md` | Integration Test |
| SYS-001 | DSH-003 Calendar Widget | `frontend/docs/widgets/CalendarWidget.md` (로컬 캘린더만; Google 연동은 CON-001) | Demo |
| SYS-001 | DSH-004 Todo Widget | 없음 | Review |
| SYS-001 | DSH-005 Widget Layout | `frontend/docs/ui/AodDisplay.md` (`lib/screen/aod_display.dart`) | Demo |
| SYS-001 | DSH-006 Widget Visibility | 없음 | Review |
| SYS-001 | DSH-007 AI Layout Update | 없음 (Planner Layer 선행 필요) | Analysis |
| SYS-001 | DSH-008 Real-time Refresh | `frontend/docs/widgets/ClockWidget.md`(구현) · 날씨 스케줄러(미구현, `frontend/docs/FeatureList.md`) | Demo |
| SYS-001 | DSH-009 Widget Variant System | 없음 — [domain_icd/dashboard.md](domain_icd/dashboard.md) Domain Model(WidgetVariant)만 정의됨 | Analysis |
| SYS-001 | DSH-010 Widget Metadata Schema | 없음 — [domain_icd/dashboard.md](domain_icd/dashboard.md) Domain Model(WidgetMetadata)만 정의됨 | Review |
| SYS-001 | DSH-011 Layout Constraint System | 없음 (Planner Layer 선행 불필요, Dashboard 단독 구현 가능하나 미착수) | Analysis |
| SYS-001 | DSH-012 Widget Placement Resolution Rule | 없음 — [domain_icd/dashboard.md](domain_icd/dashboard.md) Widget Placement Rule만 정의됨 | Analysis |
| SYS-002 Natural Language Interaction | CHAT-001 Chat Interface | `frontend/docs/widgets/ChatWidget.md`, `frontend/docs/services/LlmService.md` | Demo |
| SYS-002 | CHAT-002 Streaming Response | 선언만 존재(`LlmGateway.stream()`), 미구현 | Test |
| SYS-002 | CHAT-003 Voice Input | 없음 | Demo |
| SYS-002 | CHAT-004 Context Awareness | `frontend/docs/services/LlmService.md` (세션 내 `List<ChatMessage>` 전달) | Review |
| SYS-002 | CHAT-005 Markdown Rendering | 없음 | Demo |
| SYS-003 AI Briefing | *(전용 Layer 문서 없음)* | `frontend/docs/widgets/BriefCardWidget.md` (`lib/widget/brief_card_widget.dart`) | Demo |
| SYS-004 Intent Processing | INT-001 Intent Classification | 없음 | Analysis |
| SYS-004 | INT-002 Slot Extraction | 없음 | Analysis |
| SYS-004 | INT-003 Entity Recognition | 없음 | Analysis |
| SYS-004 | INT-004 Intent Validation | 없음 | Test |
| SYS-004 | INT-005 JSON Generation | 없음 | Test |
| SYS-005 Memory Management | MEM-001 Calendar Retrieval | 없음 (`BriefCardWidget`의 직접 모듈 참조는 RAG 아님) | Analysis |
| SYS-005 | MEM-002 Note Retrieval | 없음 | Analysis |
| SYS-005 | MEM-003 Semantic Search | 없음 | Test |
| SYS-005 | MEM-004 Hybrid Search | 없음 | Test |
| SYS-005 | MEM-005 Context Ranking | 없음 | Analysis |
| SYS-006 Action Execution | ACT-001 Action Dispatch | 없음 (`backend/docs/routes/README.md`는 라우트별 등록만 설명) | Review |
| SYS-006 | ACT-002 CRUD Support | `backend/docs/api/settings.md`, `api/apikey.md`, `api/users.md` | Integration Test |
| SYS-006 | ACT-003 Action Validation | 위 API 문서들의 `AppError('BAD_REQUEST', ...)` 검증 | Integration Test |
| SYS-006 | ACT-004 Execution Logging | `backend/docs/database/request_logs.md`, `database/raw_logs.md` | Review |
| SYS-006 | ACT-005 Execution Result | `backend/docs/DevelopmentGuide.md` (ICD v0.0 envelope, `AppError.plugin`) | Review |
| SYS-007 Connector Management | CON-001 Google Calendar Connector | `backend/docs/api/calendar.md`, `api/auth.md`(Flow 3), `services/google-calendar.md` (FE 미연동) | Integration Test |
| SYS-007 | CON-002 Home Assistant Connector | `frontend/docs/FeatureList.md` 스텁 UI만 | Integration Test |
| SYS-007 | CON-003 Notion Connector | 없음 | Integration Test |
| SYS-007 | CON-004 NAS Connector | 없음 | Integration Test |
| SYS-007 | CON-005 Server Connector | 없음 | Integration Test |
| SYS-007 | CON-006 OAuth Management | `backend/docs/plugins/google-oauth.md`, `api/auth.md` · `frontend/docs/FeatureList.md`(인증 섹션) | Integration Test |
| SYS-008 User Authentication | *(전용 Layer 문서 없음 — CON-006과 근거 공유)* | `backend/docs/api/auth.md`, `database/refresh_tokens.md` · `frontend/docs/FeatureList.md`(인증) | Integration Test |
| SYS-009 Automation Workflow | PLN-001 Task Planning | 없음 | Analysis |
| SYS-009 | PLN-002 Dependency Analysis | 없음 | Analysis |
| SYS-009 | PLN-003 Conditional Workflow | 없음 | Test |
| SYS-009 | PLN-004 Retry Strategy | 없음 | Test |
| SYS-009 | PLN-005 Rollback Strategy | 없음 | Test |
| SYS-009 | PLN-006 Layout Preference Generation | 없음 — [domain_icd/dashboard.md](domain_icd/dashboard.md) Future Extensions에서 `LayoutDirective` 구독 측만 정의됨 | Analysis |
| SYS-010 LLM Gateway | LLM-001 Multi Provider Support | `backend/docs/api/apikey.md`(저장소만) · `frontend/docs/services/LlmService.md`(단일 provider 구현) | Integration Test |
| SYS-010 | LLM-002 Model Routing | 없음 | Test |
| SYS-010 | LLM-003 Fallback Strategy | 없음 | Test |
| SYS-010 | LLM-004 Cost Monitoring | 없음 (`backend/docs/FeatureList.md` Planned: `usage_logs`) | Analysis |
| SYS-010 | LLM-005 Structured Output | 없음 | Test |

---

## 갱신 규칙

이 표는 각 Layer Requirement 문서의 Status/Progress가 바뀔 때마다 함께
갱신한다([README.md](README.md)의 "향후 개발 규칙" 7단계 참조). 새 Layer
Requirement가 추가되면 이 표에도 행을 추가한다. Implementation File 열은
실제 코드가 추가되는 즉시(문서가 아니라 코드 기준으로) 갱신해야 하며, 문서만
보고 임의로 "구현됨"이라 적지 않는다.
