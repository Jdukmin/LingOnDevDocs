# Current Status

> **자동 생성 기준**: 이 문서는 [requirements/system_requirements.md](../requirements/system_requirements.md)의
> SYS-001~SYS-010 Status/Progress와 각 Layer Requirement의 근거 노트,
> `backend/docs/FeatureList.md`/`frontend/docs/FeatureList.md`, `docs/workflow.md`
> 출시 전 체크리스트를 근거로 작성됐다 — 이 문서 자체가 새로운 판단을 하지
> 않는다. 최신 상태 문서이므로 Requirement가 갱신되면 이 문서도 함께
> 덮어쓴다([status/README.md](README.md) §3.4).
>
> **Last synced**: 2026-07-28 (`requirements/` 기준 최신 근거 노트 반영)

---

## 1. 현재 구현된 기능 (Done / 75%+)

| Requirement | 기능 | Progress | 근거 |
|---|---|---|---|
| SYS-008 (User Authentication) | Google Sign-In(ID Token + Redirect), JWT 발급/회전, 로그아웃, 세션 복원 | 75% (Done) | [requirements/system_requirements.md](../requirements/system_requirements.md), [backend/docs/api/auth.md](../backend/docs/api/auth.md), [frontend/docs/FeatureList.md](../frontend/docs/FeatureList.md) "✅ 구현 완료 > 인증" |
| CON-006 (OAuth Management) | Google OAuth 동의/콜백/토큰 저장·갱신(로그인 + Calendar 별도 client) | 75% | [connector_requirements.md](../requirements/connector_requirements.md) |
| DSH-001 (Time Display) | 1초 갱신 실시간 시계 | 75% | [dashboard_requirements.md](../requirements/dashboard_requirements.md) |
| DSH-002 (Weather Widget) | 현재 날씨 + 5일 예보, Backend 프록시 연동 완료 | 75% | [dashboard_requirements.md](../requirements/dashboard_requirements.md), [weather.md](../requirements/domain_icd/weather.md) |
| DSH-003 (Calendar Widget) | 위젯 자체는 동작(단, 로컬 캘린더 — Google 연동 아님, 아래 "진행 중" 참고) | 75%(위젯) / 25%(Google 연동은 CON-001) | [dashboard_requirements.md](../requirements/dashboard_requirements.md) |
| DSH-005 (Widget Layout) | 3컬럼 태블릿 레이아웃 | 75% | [dashboard_requirements.md](../requirements/dashboard_requirements.md) |
| ACT-004 (Execution Logging) | `request_logs`/`raw_logs` 전역 로깅 | 75% | [action_requirements.md](../requirements/action_requirements.md) |
| ACT-005 (Execution Result) | ICD v0.0 공통 응답 envelope | 75% | [action_requirements.md](../requirements/action_requirements.md) |

## 2. 현재 진행 중 (In Progress, 25%~50%)

| Requirement | 상태 | 근거 |
|---|---|---|
| SYS-001 (Dashboard Management) | 25% — 위젯 대부분 구현되었으나 Todo Widget/Widget Visibility/AI 레이아웃 없음 | [system_requirements.md](../requirements/system_requirements.md) |
| SYS-002 (Natural Language Interaction) | 25% — Chat UI 동작하나 백엔드 미경유(클라이언트가 OpenAI 직접 호출), 스트리밍/음성/마크다운 없음 | [chat_requirements.md](../requirements/chat_requirements.md) |
| SYS-003 (AI Briefing) | 25% — `BriefCardWidget`이 날씨+캘린더로 브리핑 생성하나 서버측 Briefing 서비스 없음 | [system_requirements.md](../requirements/system_requirements.md) |
| SYS-006 (Action Execution) | 25% — 라우트 단위 CRUD/검증/로깅은 있으나 공용 Action Dispatcher 없음 | [action_requirements.md](../requirements/action_requirements.md) |
| SYS-007 (Connector Management) | 25% — Google Calendar는 Backend만 완료, Frontend 미연동. HA는 UI 스텁만 | [connector_requirements.md](../requirements/connector_requirements.md) |
| CON-001 (Google Calendar Connector) | 25% — Backend 완료, Frontend는 로컬 캘린더만 표시 | [connector_requirements.md](../requirements/connector_requirements.md) |
| LLM-001 (Multi Provider Support) | 25% — BYOK 키 저장소는 4개 provider 지원하나 실제 호출은 OpenAI 단일 | [llm_gateway_requirements.md](../requirements/llm_gateway_requirements.md) |
| Settings Domain | 50% — API 완전 구현, Frontend 프리로드까지 확인, 실제 변경 화면 연동은 미확인 | [settings.md](../requirements/domain_icd/settings.md) |

## 3. 다음 작업 (Next — Phase 1 우선순위, [roadmap.md](roadmap.md) 기준)

1. **Intent Tier 0**: `INT-001` Intent Classification 최초 설계 착수 —
   Phase 1의 선행 조건([roadmap.md](roadmap.md) Phase 1).
2. **Google Calendar Frontend 연동**: `CalendarModule`이 `GET /v1/calendar/events`를
   호출하도록 전환(Backend는 이미 완료, Frontend 단독 착수 가능 —
   [docs/icd/prompt_playbook.md](../docs/icd/prompt_playbook.md) 착수 순서 3번).
3. **Refresh Token 자동 갱신 인터셉터**(Frontend 단독, Backend 완료) —
   [docs/icd/prompt_playbook.md](../docs/icd/prompt_playbook.md) 착수 순서 1번,
   가장 비용 대비 가치가 높은 항목으로 지목됨.
4. **Todo/Reminder Requirement 구체화 및 최초 구현** —
   [requirements/domain_icd/todo.md](../requirements/domain_icd/todo.md),
   [reminder.md](../requirements/domain_icd/reminder.md)는 정의됐으나 대응
   구현이 전혀 없음(0%).

## 4. Risk

| Risk | 심각도 | 근거 |
|---|---|---|
| HTTPS/CORS/Cookie `Secure`/`SameSite` 속성 미문서화 — 토큰이 URL fragment/Bearer 헤더로 오가는 구조상 HTTPS는 사실상 필수 전제인데 정책 문서가 없음 | P0 | [docs/policies/security_policy.md](../docs/policies/security_policy.md) |
| DB Migration 파일이 실제 코드 저장소에 없음(스키마가 코드에서 역추론됨) — 스키마 변경 시 회귀 위험 | P0 | [backend/docs/database/README.md](../backend/docs/database/README.md), [docs/ops/data_sop.md](../docs/ops/data_sop.md) |
| Google OAuth Verification(민감 스코프 `calendar.readonly`) 미착수 — 일반 공개 전 Google 심사 필요 | P0 | [docs/policies/privacy_policy.md](../docs/policies/privacy_policy.md) |
| Backend/Flutter 자동 테스트 전무 — 모든 Progress 판단이 "실제 실행 확인"을 요구하는데 회귀를 자동으로 잡을 수단이 없음 | P1 | [docs/workflow.md](../docs/workflow.md) 출시 전 체크리스트 "Testing" |
| Refresh Token 정리 Job 없음 — 만료 행이 영구 누적 | P1 | [backend/docs/database/refresh_tokens.md](../backend/docs/database/refresh_tokens.md) |
| Secret 관리가 `.env` 전용 — KMS/rotation 없음 | P3 | [docs/policies/security_policy.md](../docs/policies/security_policy.md) |

## 5. TODO

출처별로 정리(중복 제거, 각 출처 문서가 여전히 단일 출처):

**Backend** ([backend/docs/FeatureList.md](../backend/docs/FeatureList.md) TODO 절)
- [ ] `usage_logs` 테이블(LLM 토큰/비용 추적) 추가
- [ ] `app.providers` 레지스트리 실제 구현(현재 타입만 존재)
- [ ] Provider Key Admin API 이후 `ConfigHandler` DB 연동
- [ ] Refresh Token 정리 Job

**Frontend** ([frontend/docs/FeatureList.md](../frontend/docs/FeatureList.md) TODO 절)
- [ ] Deprecated 파일 삭제 및 영향 확인
- [ ] `shared_preferences`로 `SidebarModule` 상태 영속화
- [ ] Refresh Token 재발급 로직 구현(§3 "다음 작업" 2번과 동일 항목)
- [ ] Release APK 서명 키 설정, iOS `GoogleService-Info.plist` 등록
- [ ] `flutter analyze` CI 통합

**출시 전 필수** ([docs/workflow.md](../docs/workflow.md) 출시 전 체크리스트 — 전체 목록은 [roadmap.md](roadmap.md) Phase 6 참고)
- [ ] Infrastructure: Home Network 접근 구조, VPN/Tunnel, Worker Queue, Background Job, Circuit Breaker
- [ ] Database: Migration, Backup, Restore, Rollback
- [ ] Security: Privacy Policy/Terms 법률 검토, Google Verification, OAuth Scope 재검토
- [ ] Testing: Backend/Flutter 자동 테스트, Integration/Regression Test
- [ ] Reliability: Offline Mode, Retry/Timeout/Recovery 실제 구현, Notification 정책

## 관련 문서

- [roadmap.md](roadmap.md), [phase_status.md](phase_status.md)
- [../requirements/system_requirements.md](../requirements/system_requirements.md) — 이 문서의 1차 근거
- [../requirements/requirements_traceability.md](../requirements/requirements_traceability.md) — Business Goal → System → Layer → 구현 파일 전체 추적
