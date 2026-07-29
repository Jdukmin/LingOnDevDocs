# Connector Layer Requirements

Parent Feature: [SYS-007 Connector Management](system_requirements.md). 구현 세부는
`backend/docs/plugins`, `backend/docs/services`, `backend/docs/api`(auth/calendar)를
참조한다.

| ID | Parent Feature | Requirement | Description | Verification | Status | Progress |
|---|---|---|---|---|---|---|
| CON-001 | SYS-007 | Google Calendar Connector | The system shall connect to a user's Google Calendar (via OAuth consent) and expose their upcoming events to the app. | Integration Test | In Progress | 25% |
| CON-002 | SYS-007 | Home Assistant Connector | The system shall connect to a user's Home Assistant instance and expose device state/control to the app. | Integration Test | Planned | 0% |
| CON-003 | SYS-007 | Notion Connector | The system shall connect to a user's Notion workspace for read/write access to pages or databases. | Integration Test | Planned | 0% |
| CON-004 | SYS-007 | NAS Connector | The system shall connect to a user's NAS for file access. | Integration Test | Planned | 0% |
| CON-005 | SYS-007 | Server Connector | The system shall connect to a generic user-owned server via a defined connector protocol. | Integration Test | Planned | 0% |
| CON-006 | SYS-007 | OAuth Management | The system shall manage OAuth authorization-code/consent flows (initiation, callback, token storage, refresh) per connector/provider. | Integration Test | Done | 75% |

---

## 근거 노트 (Evidence)

- **CON-001**: 백엔드는 Google Calendar OAuth 동의(`GET /v1/auth/google/calendar`
  + callback), 토큰 암호화 저장·자동 갱신, `GET /v1/calendar/events`까지 완전히
  구현되어 있다. 근거: [backend/docs/api/auth.md](../backend/docs/api/auth.md)(Flow 3),
  [backend/docs/api/calendar.md](../backend/docs/api/calendar.md),
  [backend/docs/services/google-calendar.md](../backend/docs/services/google-calendar.md).
  그러나 프론트엔드는 아직 이 엔드포인트를 호출하지 않고 로컬 캘린더만 표시하며,
  "캘린더 Google 동기화"가 `frontend/docs/FeatureList.md` 예정 기능(High)으로
  남아 있다. Backend만 구현된 상태로 25%.
- **CON-002**: 프론트 `SidebarWidget._buildAccountsSection`에 "계정 연동 (Home Assistant)"
  UI 자리만 스텁으로 선언되어 있고 HA REST API 연동은 없음. 백엔드에는 관련
  코드가 전혀 없다. 근거: [frontend/docs/FeatureList.md](../frontend/docs/FeatureList.md)
  스텁 섹션. 선언뿐이라 Requirement 존재 수준인 0%로 판단.
- **CON-003 / CON-004 / CON-005**: Notion, NAS, 일반 Server 커넥터에 대한 코드·문서
  근거가 전혀 없음.
- **CON-006**: Google 로그인 OAuth(ID Token + Redirect 양쪽 플로우), 상태 쿠키
  기반 CSRF 보호, 리프레시 토큰 회전/철회까지 백엔드·프론트엔드 양쪽에 문서화되어
  있고 서로 정확히 대응한다. 근거: [backend/docs/plugins/google-oauth.md](../backend/docs/plugins/google-oauth.md),
  [backend/docs/api/auth.md](../backend/docs/api/auth.md),
  [frontend/docs/FeatureList.md](../frontend/docs/FeatureList.md)("✅ 구현 완료 > 인증").
  다만 401 발생 시 프론트 자동 재발급 인터셉터는 "예정 기능"으로 남아 있어 완전
  자동화는 아직 아니다. 테스트 실행 근거가 없어 100%가 아닌 75%.
