# Beta Release Status Report

> **자동 생성 기준**: 이 문서는 새 판단을 하지 않는다 — `status/current_status.md`,
> `status/phase_status.md`, `status/roadmap.md`, `status/backend/*.md`,
> `status/frontend/*.md`와 그 근거 보고서(`FRONTEND_VERIFICATION_REPORT.md`,
> `FRONTEND_SCHEMA_VERIFICATION_REPORT.md`, `FRONTEND_VERSION_HISTORY_REPORT.md`,
> `BACKEND_VERIFICATION_REPORT.md`, `BACKEND_SCHEMA_VERIFICATION_REPORT.md` —
> 각 소스 저장소 루트)를 종합·연결한다.
> **Beta Release 용어 정의**: 이 저장소의 버전 정책(`status/README.md` §2.1)은
> `V_0.1.0`을 "Baseline"(Release가 아닌 공식 기준점)으로 정의한다. 이
> 문서에서 "Beta Release"는 그 `V_0.1.0` Baseline이 §7(Release Blockers)의
> 항목을 해소하고 공개 배포 가능한 상태(`V_0.1.x`)에 도달하는 시점을
> 가리킨다 — 새 버전 번호를 만들지 않는다.
>
> **작성일**: 2026-07-29 · **커버 범위**: Backend(`jdukmin/lingon`),
> Frontend(`jdukmin/letmeknow`), DevDocs(`LingOnDevDocs`, 이 저장소)
>
> **2026-07-29 갱신 이력**: Frontend 저장소에 새로 추가된
> `FRONTEND_VERSION_HISTORY_REPORT.md`(V0.0.0~V0.0.18 재구성)를 반영해
> `status/frontend/*.md`를 보강하고(Android 패키지명 변경, Calendar의
> `_codeToMessage` 참조 구현 정확한 출처 등), `frontend/docs/FeatureList.md`·
> `docs/policies/error_policy.md`·`docs/icd/gap_analysis.md`의 오래된
> Calendar/401-인터셉터 기술을 정정했다. Backend 쪽은 이번 라운드에 새
> 보고서가 없어 기존 `BACKEND_VERIFICATION_REPORT.md`/
> `BACKEND_SCHEMA_VERIFICATION_REPORT.md` 반영 상태를 그대로 유지한다.
> Required Human Resource에 Legal/Monitoring 카테고리를 신설했고, Release
> Blocker를 P0/P1/P2로 재분류했다.
>
> **2026-09-14 갱신 이력**: TASK-007(execution-verified 패스). 이전
> 판정은 Flutter 툴체인을 실제로 실행하지 않은 정적 코드 대조였다. 이번
> 갱신에서 처음으로 `flutter doctor`/`flutter analyze`/`flutter test`/
> `tsc --noEmit`/`npm audit`를 실제로 실행했다: Flutter 3.41.2/Dart 3.11.0
> 정상 설치 확인, `flutter analyze` "No issues found!", `flutter test`
> **134건 통과**(Frontend), Backend `tsc --noEmit` clean, **Backend
> 자동 테스트는 검증된 베이스라인(커밋 `dd38b22`) 기준 0건**(당시
> `package.json`에 `test` 스크립트 없음). TASK-006이 `node --test`
> 하네스(`npm test`/`npm run test:types`)를 추가 중이나 작업 트리에
> UNCOMMITTED 상태라 아직 통과 건수를 인용할 수 없다 — 커밋 전까지 이
> 공백은 열려 있는 것으로 본다. 저장소별
> 테스트 건수는 Frontend 134 / Backend 0(베이스라인 기준)으로 분리해 기록한다 — 기존
> "자동 테스트 0건(양쪽 모두)" 서술은 절반만 맞았다. 새로 발견된 리스크
> 3건도 이번 갱신에서 추가한다: 릴리스 빌드 스크립트 파손(TASK-001,
> 수정본은 작업 트리에 있으나 미커밋), Flutter Web을 Apache로 서빙하는
> 배포 구조에서 `--dart-define` 값이 공개 JS로 노출되는 문제(TASK-001
> 범위), `npm audit` high 3건(TASK-008). 가장 최신·실행 근거 기반의
> 릴리스 단계 기록은 [release_state.md](release_state.md)다(Stage:
> Internal alpha) — 이 문서는 그 파일의 내용을 재서술하거나 상충하지
> 않는다.

---

# Executive Summary

LetMeKnow는 `V_0.1.0` Baseline에 도달했다 — Foundation, Authentication,
Dashboard(핵심 위젯), Calendar, Weather 5개 Phase가 실제 서버 실행(Backend)
또는 정적 코드 대조(Frontend, 2026-07-29 시점)로 검증되었다.
**갱신(2026-09-14)**: Flutter SDK는 이미 설치되어 있으며(`flutter doctor`
clean, 3.41.2/Dart 3.11.0), `flutter analyze`/`flutter test`를 실제로
실행해 "No issues found!" / 134건 통과를 확인했다 — "Flutter SDK
미설치" 서술은 이제 OBSOLETE다(§Remaining Development, Checklist 참고).
이는 **"검증된 기준점"이지 "출시 가능한 Beta"가 아니다** —
아래 세 가지가 그 차이를 만든다:

1. **코드 결함 1건(P0)**: Frontend `WeatherModule`이 API 실패 시 사용자에게
   원시 예외 문자열을 노출한다(Error Policy 직접 위반). **갱신(2026-09-14,
   TASK-002)**: `weather_error_mapper.dart`/`brief_error_mapper.dart`가
   작업 트리에 실제로 작성되었으나 아직 커밋되지 않았다 — 커밋 전까지는
   여전히 P0 Blocker로 취급한다.
2. **Operational 공백(High/Medium)**: Backend DB 마이그레이션이 7개 테이블 중
   5개(`users` 기본 테이블 포함)를 재현하지 못하고, CORS는 전체 개방
   상태이며, HTTPS 강제가 코드 레벨에 없다.
3. **AI가 대신할 수 없는 작업 다수**: Play/App Store 등록, Google OAuth
   Verification, Privacy Policy/Terms 법률 문서, 실서버·실기기·실계정
   검증 — [required_human_resource.md](required_human_resource.md)에 Critical
   10건을 포함해 정리했다.

Phase 6~11(Intent/Memory/Planner/Action Router/Connector 확장/Automation)은
`Status: Planned, Progress: 0%`로, 설계 문서(Domain ICD, Requirement)만
존재하고 코드는 전혀 없다 — 이는 결함이 아니라 **의도된 범위 밖**이다(SSOT가
이 6개 Domain을 MVP 이후로 명시). Beta Release는 이 6개 Phase를 요구하지
않는다.

---

# Current Progress

## Repository별 버전 상태

| 컴포넌트 | 버전 | 근거 커밋 | 상태 |
|---|---|---|---|
| Backend(`jdukmin/lingon`) | `0.1.0` | `0e6928b` | Baseline 확정, Application 계층 Release-ready, Operational 계층 미해결([backend/V0.1.0.md](backend/V0.1.0.md)) |
| Frontend(`jdukmin/letmeknow`) | `0.1.0` | `28f8bb2` | Baseline 확정, P0 Weather 결함으로 "Not Release-ready"([frontend/V0.1.0.md](frontend/V0.1.0.md)) |
| DevDocs(`LingOnDevDocs`, 이 저장소) | `0.1.0` | `c1646bd`(이번 패스가 pull) | `status/` 체계 도입 완료, 이번 패스로 `required_human_resource.md` + 이 보고서 추가 |

`version/system.json`이 세 컴포넌트를 `0.1.0`으로 정렬한 기계 판독용
단일 출처다. **알려진 불일치**(`version/backend.json`/`version/frontend.json`의
`known_discrepancy` 필드에 이미 기록됨): `jdukmin/lingon`의 `package.json`은
여전히 `0.0.1`, `jdukmin/letmeknow`의 `pubspec.yaml`은 `1.0.0+1`(Flutter
기본값)로, 두 소스 저장소 모두 이 DevDocs 기준 버전을 아직 반영하지
않았다 — 코드 수정은 각 소스 저장소의 몫이라 이 패스에서 처리하지 않는다.

## Requirements 진행률 요약

`requirements/*_requirements.md`(RDD)와 `requirements/domain_icd/*.md`
기준, [phase_status.md](phase_status.md)/[roadmap.md](roadmap.md)가
Phase 단위로 이미 추적 중이다:

| Requirement 그룹 | 관련 Phase | Progress |
|---|---|---|
| SYS-008(Auth), CON-006(OAuth Management) | Phase 2 | 75% |
| DSH-001~008(Dashboard) | Phase 3 | 75%(DSH-004/006은 0%) |
| CON-001(Calendar) | Phase 4 | 75% |
| DSH-002(Weather) | Phase 5 | 75%(P0 결함 포함) |
| INT-001~005, MEM-001~005, PLN-001~005, ACT-001~005, CON-002~005 | Phase 6~10 | 0%(설계만) |
| Privacy/Terms/Security 정책 요구사항 | Phase 12 | 요구사항 정리 100%, 실제 법률 문서화 0% |

## Architecture 반영 여부

- **반영 완료**: `BaseModule`/`BaseRoute`/`BaseGateway` 패턴(Frontend
  V0.0.1), `AodColors`/3컬럼 태블릿 레이아웃(Frontend V0.0.4), `ApiClient`
  401 자동 재시도(Frontend V0.0.11), Google Calendar 정규화 스키마(Domain
  ICD `calendar.md` → 코드 일치, Frontend V0.0.17), ICD v0.0 공통 응답
  envelope(Backend/Frontend 전 API).
- **의도적으로 미반영**: Action Layer/Intent/Memory/Planner/Workflow 아키텍처
  제안(`docs/icd/action_layer_api.md`)은 설계만 있고 어떤 저장소에도 구현이
  없음 — Phase 6~11 범위, Beta 대상 아님.
- **문서만 뒤처짐**(코드는 이미 앞서 있음): `frontend/docs/FeatureList.md`의
  Calendar 로컬/Google 기술, `docs/docs/policies/error_policy.md`의 401
  인터셉터 기술(Frontend Schema Verification Report Finding D-1/D-2) — 코드
  수정 없이 문서만 정정하면 되는 항목.

---

# Phase Status

> 형식: Phase 이름 / 목표 / 주요 기능 / 관련 Requirement / 현재 Progress /
> Status / 완료 조건 / 예상 Risk. Progress·Status 값은
> [phase_status.md](phase_status.md)·[roadmap.md](roadmap.md)를 그대로
> 인용하며, "주요 기능"과 "예상 Risk"는 이 보고서에서 처음 명시적으로
> 정리한다(근거는 각 Phase의 관련 Version 문서).

## Phase 1 — Foundation
- **목표**: Backend(Fastify)/Frontend(Flutter) 스캐폴드, 공통 베이스 클래스, ICD v0.0 envelope 확립
- **주요 기능**: `BaseModule`/`BaseRoute`/`BaseGateway`(Frontend), Fastify 플러그인 구조 + ICD v0.0 envelope(Backend)
- **관련 Requirement**: 없음(RDD 이전 시기)
- **Progress**: 100% — **Status**: Done
- **완료 조건**: 양쪽 앱 부팅 + 최소 1개 기능(Weather) 종단 동작 — 충족
- **예상 Risk**: 없음(재작업 필요 없는 안정적 기반)

## Phase 2 — Authentication
- **목표**: Google OAuth(ID Token + Redirect), JWT 세션, Refresh rotation, 401 자동 재시도 완성
- **주요 기능**: `POST /v1/auth/google`, Redirect 흐름, `AuthModule`/`AuthRepository`, `ApiClient._withRetry`
- **관련 Requirement**: SYS-008, CON-006
- **Progress**: 75% — **Status**: Done
- **완료 조건**: 로그인/세션 복원/rotation/로그아웃/401 인터셉터 실서버 검증 — 대부분 충족
- **예상 Risk**: Redirect 흐름의 대화형 Google 동의 화면은 자동화 환경에서 검증 불가 — 사람이 실제 계정으로 1회 미확인 시 프로덕션에서 첫 발견될 위험(Medium)

## Phase 3 — Dashboard
- **목표**: AOD 3컬럼 태블릿 레이아웃과 7개 핵심 위젯 완성
- **주요 기능**: Clock/Weather/Calendar/Brief/Chat/Sidebar/Status 위젯, `AodColors` 테마
- **관련 Requirement**: DSH-001~008
- **Progress**: 75%(DSH-004/006은 0%) — **Status**: In Progress
- **완료 조건**: 7개 핵심 위젯 렌더링(충족) + Todo Widget(DSH-004) + Widget Visibility 토글(DSH-006) — 두 항목 미착수
- **예상 Risk**: 낮음 — 미착수 항목이 Beta 핵심 경로가 아니므로 지연되어도 Beta 자체를 막지 않음

## Phase 4 — Calendar
- **목표**: Google Calendar 연동(OAuth 동의, 조회 API, Frontend UI) 완성
- **주요 기능**: `GoogleCalendarDataSource`, `GET /v1/calendar/events`, 6-상태 `CalendarWidget`
- **관련 Requirement**: CON-001
- **Progress**: 75% — **Status**: Done
- **완료 조건**: Backend API + Frontend UI + 에러 경로 실서버 검증 — 충족
- **예상 Risk**: 실제 Google 계정으로 이벤트 데이터가 정확히 렌더링되는 happy-path 미확인(자동화 환경 한계) — 사람 확인 전까지 Low~Medium

## Phase 5 — Weather
- **목표**: OpenWeather 연동(현재 날씨, 5일 예보) 완성
- **주요 기능**: `GET /v1/weather/{current,forecast5,geo/direct,geo/reverse}`, `WeatherModule`
- **관련 Requirement**: DSH-002
- **Progress**: 75% — **Status**: Done(단, P0 결함 있음)
- **완료 조건**: API 연동 + 실데이터 렌더링(충족) — 단 에러 처리 경로 미충족
- **예상 Risk**: **High(현재화됨, Blocker)** — `WeatherModule` 에러 메시지 매핑 누락이 실제 사용자에게 노출될 확정적 결함(§7 참고)

## Phase 6 — Intent Engine
- **목표**: 자연어 → Intent 분류 + 슬롯 추출 최소 파이프라인
- **주요 기능**: 없음(미구현)
- **관련 Requirement**: INT-001~005
- **Progress**: 0% — **Status**: Planned
- **완료 조건**: INT-001 최소 구현 + 실제 메시지 1건 변환 확인
- **예상 Risk**: Beta 범위 밖 — 리스크 평가 대상 아님

## Phase 7 — Memory (RAG)
- **목표**: 사용자 컨텍스트 임베딩 검색
- **주요 기능**: 없음(미구현)
- **관련 Requirement**: MEM-001~005
- **Progress**: 0% — **Status**: Planned
- **완료 조건**: 벡터 스토어 연동 + Calendar Retrieval 동작 확인
- **예상 Risk**: Beta 범위 밖

## Phase 8 — Planner
- **목표**: Intent → Action 순서 계획(의존성/조건/재시도/롤백)
- **주요 기능**: 없음(미구현)
- **관련 Requirement**: PLN-001~005
- **Progress**: 0% — **Status**: Planned
- **완료 조건**: PLN-001 최소 구현
- **예상 Risk**: Beta 범위 밖

## Phase 9 — Action Router
- **목표**: 공용 Action Dispatcher로 실행/검증/기록
- **주요 기능**: 없음(미구현 — 라우트 단위 부분 구현만 존재)
- **관련 Requirement**: ACT-001~005
- **Progress**: 0% — **Status**: Planned
- **완료 조건**: `POST /v1/actions/execute` 최소 스캐폴딩
- **예상 Risk**: Beta 범위 밖

## Phase 10 — Connector (확장)
- **목표**: Home Assistant, NAS, Notion 등 Calendar 외 커넥터 추가
- **주요 기능**: 없음(미구현)
- **관련 Requirement**: CON-002/003/004/005
- **Progress**: 0%(Calendar 제외) — **Status**: Planned
- **완료 조건**: 최소 1개 신규 커넥터(Home Assistant) 실기기 제어 성공
- **예상 Risk**: Beta 범위 밖. 착수 시 Home Assistant 실기기 테스트가 Required Human Resource로 필요(이미 정리됨)

## Phase 11 — Automation (Workflow)
- **목표**: 다단계 Workflow 엔진("퇴근 모드" 등)
- **주요 기능**: 없음(미구현)
- **관련 Requirement**: 없음(`domain_icd/workflow.md`)
- **Progress**: 0% — **Status**: Planned
- **완료 조건**: Phase 4·10 선행 완료 후 최소 1개 Workflow 다단계 실행 성공
- **예상 Risk**: Beta 범위 밖

## Phase 12 — V1.0 Release Readiness
- **목표**: `V_1.0.0` 출시 전 비-기능 요구사항(DB 재현성, CORS/HTTPS, 테스트, 법률 검토) 완료
- **주요 기능**: 마이그레이션 정비, 보안 강화, 자동 테스트 도입, Privacy/Terms 법률 문서
- **관련 Requirement**: 없음(체크리스트 관리, `docs/workflow.md`)
- **Progress**: 25% — **Status**: In Progress
- **완료 조건**: DB 마이그레이션 전체 재현(현재 7개 중 2개), CORS allow-list, HTTPS/HSTS 문서화, 자동 테스트 도입(현재 Frontend 134건/Backend 0건(검증된 베이스라인 기준) — Backend 테스트 러너는 TASK-006으로 작업 트리에 추가 중이나 UNCOMMITTED, 커밋·검증 전까지 공백으로 간주), Privacy Policy/Terms 법률 검토 — **Beta Release는 이 Phase 전체 완료를 요구하지 않는다**, §8 체크리스트가 Beta에 필요한 부분집합을 정의한다
- **예상 Risk**: **High** — 이 Phase가 사실상 Beta Release Blocker의 본체([required_human_resource.md](required_human_resource.md) Critical 10건 대부분이 여기 귀속)

---

# Remaining Development

Claude가 코드/문서로 직접 수행 가능한 남은 작업(사람 전용 작업은 §5로 분리):

| 우선순위 | 작업 | 담당 Phase | 근거 |
|---|---|---|---|
| P0(코드 작성 완료 2026-09-14, UNCOMMITTED) | `WeatherModule`에 `error.code`→사용자 메시지 매퍼 추가(Calendar/Auth와 동일 패턴) — `weather_error_mapper.dart`/`brief_error_mapper.dart`(TASK-002)로 작업 트리에 이미 작성됨, 남은 일은 커밋 | Phase 5 | Frontend Schema Verification Report Issue #1 |
| **DONE(2026-09-14)** | Flutter SDK 설치 환경에서 `flutter analyze`/`test` 실행 — `flutter doctor` clean(3.41.2/Dart 3.11.0), `flutter analyze` "No issues found!", `flutter test` 134건 통과(기존 98건 + 신규 36건, 신규분은 작업 트리 UNCOMMITTED). `flutter build`(release build)는 `compile_release.sh`의 `FLUTTER_DEFINE_ARGS` 미정의 결함으로 이전엔 실패했으나 TASK-001로 수정(마찬가지로 UNCOMMITTED) | Phase 12 | Frontend Schema Verification Report §7 → TASK-007 실행 결과로 해소 |
| P1 | `frontend/docs/FeatureList.md`(Calendar 상태), `docs/docs/policies/error_policy.md`(401 인터셉터 상태) 문서 정정 | Phase 4, 2 | Finding D-1, D-2 |
| High(초안 작성 완료 2026-09-14, UNCOMMITTED) | Backend DB 베이스라인 마이그레이션(`000_baseline_schema.sql`) 작성 — 7개 테이블 중 5개 미커버. TASK-003으로 작업 트리에 초안 작성됨, 남은 일은 검증·커밋 | Phase 12 | Backend Schema Verification Report |
| Medium | CORS allow-list 확정 및 코드 적용 | Phase 12 | Backend Schema Verification Report Issue #2 |
| Medium | HTTPS/HSTS 리버스 프록시 설정 문서화(설정 자체는 사람이 수행, 문서화는 가능) | Phase 12 | Backend Schema Verification Report Issue #3 |
| P2 | `LingonUsersRoute.patchMe`의 `city` 명시적 null-clear 미지원 수정 | Phase 4 | Frontend Verification/Schema Report(반복 확인) |
| P2 | `LingonSettingsRoute`/`LingonApiKeyRoute` 쓰기 경로 UI 연결 여부 결정(구현 또는 명시적 Not-MVP 표기) | Phase 3 | Frontend Schema Verification Report Issue #6 |
| Low | 루트 `ICD.md`(Frontend 저장소) 정리 — SSOT와 충돌하는 오래된 Weather 스키마 | Phase 5 | Finding D-4 |
| Low(Backend만 잔존) | Backend 자동 테스트 도입 착수(테스트 러너부터, TASK-006) — **Frontend는 2026-09-14 기준 134건 통과로 이미 도입 완료**(`flutter test`), 남은 공백은 Backend(검증된 베이스라인 기준 0건)뿐. TASK-006이 `node --test` 하네스를 작업 트리에 추가 중이나 UNCOMMITTED — 커밋·검증 전까지 이 항목은 미해결로 유지 | Phase 12 | Backend: 베이스라인 커밋 `dd38b22` 기준 `package.json`에 `test` 스크립트 없음, 이후 TASK-006으로 추가된 스크립트는 작업 트리에 있으나 미커밋. Frontend: `cd letmeknow && flutter test` → 134 passing |

---

# Required Human Resource

**2026-07-29 갱신** — 전체 10개 카테고리(Release/Legal/Cloud/OAuth/External
Service/Security/Monitoring/QA/Design/Business), 35개 항목의 상세 표는
[required_human_resource.md](required_human_resource.md)에 있다(Legal·Monitoring은
이번 패스에서 신설 — Legal은 기존 Release 카테고리에 있던 Privacy
Policy/Terms 항목을 이동·확장한 것이고, Monitoring은
`docs/ops/monitoring.md`를 근거로 신규 작성했다). 요약:

| 카테고리 | Critical | High | Medium | Low |
|---|---|---|---|---|
| Release | 2 | 0 | 0 | 0 |
| Legal | 2 | 1 | 3 | 0 |
| Cloud | 2 | 2 | 0 | 0 |
| OAuth | 3 | 0 | 0 | 0 |
| External Service | 1 | 1 | 0 | 1 |
| Security | 1 | 1 | 1 | 0 |
| Monitoring | 0 | 2 | 2 | 1 |
| QA | 1 | 2 | 0 | 0 |
| Design | 0 | 0 | 2 | 1 |
| Business | 0 | 2 | 1 | 0 |
| **합계** | **12** | **11** | **9** | **3** |

Beta(제한된 내부 테스트) 배포만 목표라면 Critical 12건 중 상당수(Store
등록, Privacy/Terms, OAuth Verification)는 유예 가능하다 — 서버/도메인/SSL,
Redirect URI/Credential, 태블릿 실기기 테스트만 선행하면 시작할 수
있다(상세 유예 조건은 `required_human_resource.md` "우선순위 요약" 참고).

---

# Risks

| Risk | 등급 | 영향 | 완화 방법 |
|---|---|---|---|
| Weather 에러 메시지 노출 | **P0/Critical**(수정 코드 작성 완료 2026-09-14, UNCOMMITTED) | 사용자가 API 실패 시 원시 Dart 예외를 직접 봄 — 신뢰도 직결 | 코드 수정(Claude 가능, TASK-002로 작업 트리에 이미 작성됨) — 커밋 필요, 위 Remaining Development P0 |
| DB 마이그레이션 재현 불가 | **High**(초안 작성 완료 2026-09-14, UNCOMMITTED) | 새 환경(스테이징/재해복구/신규개발자) 구성이 표준 절차로 불가능 | 베이스라인 마이그레이션 작성(TASK-003, 작업 트리에 있으나 미커밋) — 검증·커밋 필요 |
| CORS 전체 개방 | Medium | 임의 Origin에서 API 호출 가능 | allow-list 전환 |
| HTTPS 미강제 | Medium | 토큰이 평문 전송될 잠재 경로 존재(리버스 프록시 설정에 전적으로 의존) | 프록시 레벨 HTTPS/HSTS 확정(사람) |
| 자동 테스트: Frontend 134건 / **Backend 0건(검증된 베이스라인 기준)** | Backend는 High(장기), Frontend는 완화됨(2026-09-14) | Backend는 이미 한 번(V0.0.17) 발생한 계약 드리프트 회귀가 재발해도 CI가 못 잡음(베이스라인 커밋 `dd38b22` 기준 테스트 러너 없음; TASK-006이 `node --test` 하네스를 작업 트리에 추가 중이나 UNCOMMITTED이라 아직 이 리스크를 닫지 못함). Frontend는 `flutter test` 134건 통과로 최소한의 회귀 방지망 확보(`cd letmeknow && flutter test`, 2026-09-14) | Backend: 테스트 러너 도입·커밋(TASK-006). Frontend: 이미 도입됨, 유지·확장 |
| Google OAuth Verification 미착수 | Critical(공개 배포 시) | `calendar.readonly` 민감 스코프 — 테스트 사용자 목록을 벗어나면 로그인 자체가 막힘 | 사람이 Google 심사 신청(§5) |
| Redirect 흐름 실계정 미검증 | Medium | 동의 화면 UX가 자동화 환경에서 검증 불가 — 프로덕션에서 첫 발견 위험 | 사람이 1회 수동 확인 |
| Privacy Policy/Terms 부재 | Critical(공개 배포 시) | Play/App Store 제출 불가, 법적 노출 | 사람이 법률 검토 진행(§5) |
| Backend/Frontend 버전 파일 SSOT와 불일치 | Low | `package.json`(0.0.1), `pubspec.yaml`(1.0.0+1)이 DevDocs 기준(0.1.0)과 다름 — 혼선 가능 | 각 소스 저장소에서 후속 커밋으로 정합 |
| 릴리스 빌드 스크립트 파손(신규 발견, 2026-09-14) | **High(TASK-001)** | `letmeknow/compile_release.sh`가 `set -euo pipefail` 하에서 정의되지 않은 `FLUTTER_DEFINE_ARGS`를 참조해 release 빌드가 중단됨 — 배포 자체가 불가능했던 결함. 수정본이 작업 트리에 있으나 UNCOMMITTED | `PROJECT_DIR`를 `BASH_SOURCE` 기반으로 변경, `assert_no_secret_defines()` 가드 추가, `SKIP_DEPLOY=1` 로컬 검증 옵션 추가 후 커밋(TASK-001) |
| Web 배포 시 `--dart-define` 값이 공개 노출됨(신규 발견, 2026-09-14) | **High(TASK-001/deploy)** | Frontend는 Flutter Web을 빌드해 Apache가 서빙하는 구조(`compile_release.sh` → `build/web/` → rsync → `/var/www/lingon/releases/<timestamp>/` → `current` 심볼릭 링크, `letmeknow/run_release.sh`/`lingon/server_deploy.sh` 참고) — `--dart-define`으로 전달한 값은 배포된 JavaScript 번들 안에 그대로 남아 누구나 읽을 수 있다. 어떤 status/ops 문서도 이 사실을 이전에 명시하지 않았다 | Secret을 `--dart-define`으로 주입하지 않는다 — 서버 사이드 프록시/게이트웨이로 전환(TASK-001 범위) |
| 의존성 취약점(신규 발견, 2026-09-14) | **Medium~High(TASK-008)** | `npm audit`(lingon) 결과 **3 high, 2 moderate, 2 low** — high 3건은 `find-my-way`(Fastify 자체 라우터), `fast-uri`, `brace-expansion` | 버전 업그레이드 검토 및 적용(TASK-008) |

---

# Release Blockers

Backend(`BACKEND_VERIFICATION_REPORT.md`, `BACKEND_SCHEMA_VERIFICATION_REPORT.md`)와
Frontend(`FRONTEND_VERIFICATION_REPORT.md`, `FRONTEND_SCHEMA_VERIFICATION_REPORT.md`,
`FRONTEND_VERSION_HISTORY_REPORT.md`)에서 전달된 Blocker를 통합해 **P0/P1/P2**로
분류한다(이전 버전이 쓰던 Critical/High 혼용 표기를 이 표준으로 통일 —
2026-07-29 정정).

| Priority | Blocker | 출처 | 담당 |
|---|---|---|---|
| **P0**(수정 코드 작성 완료 2026-09-14, UNCOMMITTED) | Weather 에러 메시지 노출(`WeatherModule`에 `error.code`→메시지 매핑 없음, 원시 예외 노출) — `weather_error_mapper.dart`/`brief_error_mapper.dart`(TASK-002)가 작업 트리에 있으나 아직 커밋되지 않아 Blocker 유지 | Frontend Schema Verification Report Issue #1, Frontend Version History Report Known Issue #1 | 코드(Claude 가능) — 커밋 필요 |
| **P0** | 프로덕션 서버·도메인·SSL 가동 상태 미확인(코드 기본값 `https://www.ling-on.com`은 설정되어 있으나 실제 가동 여부는 저장소 밖) | required_human_resource.md Cloud | 사람 |
| **P0** | 태블릿 실기기 테스트 0건 — 제품의 실제 타겟 폼팩터("AOD Tablet")가 한 번도 실물로 검증되지 않음 | required_human_resource.md QA | 사람 |
| **P0**(초안 작성 완료 2026-09-14, UNCOMMITTED) | Backend DB 마이그레이션 재현 불가(7개 테이블 중 5개 `CREATE TABLE` 없음) — 신규 환경을 표준 절차로 구성 불가. `migrations/000_baseline_schema.sql`(TASK-003)이 작업 트리에 작성되었으나 아직 커밋·검증되지 않아 Blocker 유지 | Backend Schema Verification Report Issue #1(High) | 코드(Claude 가능, 사람이 적용) — 커밋·검증 필요 |
| **P0(신규, 2026-09-14)** | 릴리스 빌드 스크립트 파손 — `compile_release.sh`가 미정의 `FLUTTER_DEFINE_ARGS` 참조로 `set -euo pipefail` 하에서 중단됨. 수정본 작업 트리 존재, UNCOMMITTED | 직접 실행·코드 읽기로 확인(TASK-001) | 코드(Claude 가능) — 커밋 필요 |
| **P0(신규, 2026-09-14)** | Web 배포 시 `--dart-define` 값이 공개 JS 번들에 그대로 노출(Apache가 `build/web/`을 서빙) | `compile_release.sh`/`run_release.sh`/`server_deploy.sh` 직접 확인(TASK-001/deploy) | 코드+운영(Claude+사람) |
| **P2(신규, 2026-09-14)** | 의존성 취약점 — `npm audit` high 3건(`find-my-way`, `fast-uri`, `brace-expansion`) | `npm audit` 실행 결과(TASK-008) | 코드(Claude 가능) |
| **P1** | Privacy Policy·Terms of Service 실제 법률 문서 부재 — **공개** 배포(Store 심사) 시에만 필수, 내부 테스트 트랙은 유예 가능 | required_human_resource.md Legal | 사람 |
| **P1** | Google OAuth Verification(`calendar.readonly` 민감 스코프) 미착수 — 테스트 사용자 목록을 벗어난 **공개** 배포 시에만 기술적으로 막힘 | required_human_resource.md OAuth | 사람 |
| **P1** | Google Play Console / Apple Developer 계정·앱 등록 미완료 — **공개** 배포 시에만 필수 | required_human_resource.md Release | 사람 |
| **P1** | CORS 전체 개방(`origin: true`) — allow-list 미적용 | Backend Schema Verification Report Issue #2(Medium) | 코드(Claude 가능) |
| **P1** | HTTPS/HSTS 코드 레벨 미강제 — 리버스 프록시 설정에 전적으로 의존 | Backend Schema Verification Report Issue #3(Medium) | 사람(프록시 설정) |
| **P2** | 자동 테스트: **Frontend 134건 통과**(`cd letmeknow && flutter test`, 2026-09-14), **Backend 0건**(검증된 베이스라인 커밋 `dd38b22` 기준 테스트 러너 없음; TASK-006이 `node --test` 하네스를 작업 트리에 추가 중이나 UNCOMMITTED이므로 아직 해결로 인정하지 않음) — Backend 쪽은 계약 드리프트 회귀(V0.0.17 사례)를 CI가 잡지 못하는 실질적 공백으로 남음 | 양쪽 Verification/Schema Report 공통, 2026-09-14 실행 결과(TASK-007) | Backend: 코드(Claude 가능, TASK-006 — 커밋·검증 대기). Frontend: 완료, 유지 과제만 남음 |
| **P2** | Redirect OAuth 흐름의 실계정 동의 화면 미검증(자동화 환경 한계) | Backend/Frontend Verification Report 공통 권고 | 사람(1회 수동 확인) |
| **P2** | Backend/Frontend 소스 저장소의 `package.json`(0.0.1)/`pubspec.yaml`(1.0.0+1)이 DevDocs 기준 버전(0.1.0)과 불일치 | `version/backend.json`/`version/frontend.json`의 `known_discrepancy` | 각 소스 저장소(코드) |

**내부 테스트 트랙**(제한된 사용자, Store 공개 심사 불필요) 기준으로는
**P0 6건이 실질적 Blocker**다(원래 4건 + 2026-09-14 신규 발견 2건: 릴리스
빌드 스크립트 파손, Web 배포 시 secret 노출) — P1 항목(Privacy/Terms,
OAuth Verification, Store 등록, CORS, HTTPS)은 공개 전환 시점까지 유예
가능하나, CORS/HTTPS는 내부 테스트라도 실제 사용자 데이터가 오간다면
조기 해결을 권장한다.

가장 최신·실행 근거 기반의 릴리스 단계 기록은
[release_state.md](release_state.md)다(Stage: **Internal alpha** — 이
문서(§7 Release Blockers)가 그리는 "Baseline이지만 Release Candidate는
아님"이라는 그림과 방향은 같되, `release_state.md`가 실행 근거를 추가로
반영한 더 최신 판정이다. 이 문서는 그 파일의 내용을 재서술하거나
상충하지 않는다).

---

# Beta Release Checklist

```
--- P0 (내부 테스트 트랙 포함, 전부 필수) ---
[ ] P0 Weather 에러 메시지 매핑 수정(코드) — 매퍼(`weather_error_mapper.dart`/`brief_error_mapper.dart`, TASK-002)는 작업 트리에 작성 완료, UNCOMMITTED — 커밋 남음
[ ] P0 프로덕션 서버 가동 확인 + 도메인(www.ling-on.com) 연결 확인 + SSL 인증서 확인
[ ] P0 태블릿 실기기 1대 이상에서 전체 대시보드 동작 확인
[ ] P0 DB 베이스라인 마이그레이션 작성 및 신규 환경 재현 테스트 — 초안(`migrations/000_baseline_schema.sql`, TASK-003)은 작업 트리에 있으나 UNCOMMITTED, 재현 테스트·커밋 남음
[ ] P0(신규, 2026-09-14) 릴리스 빌드 스크립트 수정 커밋(`compile_release.sh`의 `FLUTTER_DEFINE_ARGS` 미정의 결함, TASK-001) — 수정본은 작업 트리에 있으나 아직 미커밋
[ ] P0(신규, 2026-09-14) Web 배포(`--dart-define` → Apache 서빙 JS 번들)로 secret이 노출되지 않도록 배포 경로 점검(TASK-001 범위)
--- P1 (공개 배포 시 필수, 내부 테스트 트랙은 유예 가능 — CORS/HTTPS 제외) ---
[ ] P1 Privacy Policy 법률 검토 및 게시
[ ] P1 Terms of Service 법률 검토 및 게시
[ ] P1 Google OAuth Verification 신청 및 통과
[ ] P1 Google Play Console / Apple Developer 계정·앱 등록
[ ] P1 CORS allow-list 적용(현재 전체 개방) — 내부 테스트도 조기 권장
[ ] P1 HTTPS/HSTS 리버스 프록시 설정 확정 및 문서화 — 내부 테스트도 조기 권장
--- P2 (권장, 미해결 시에도 Beta 착수는 가능) ---
[x] P2 Flutter SDK 환경에서 flutter analyze/test 1회 실행 및 결과 기록 — 완료 2026-09-14: `flutter doctor` clean(3.41.2/Dart 3.11.0), `flutter analyze` "No issues found!", `flutter test` 134건 통과(TASK-007). `flutter build`(release)는 TASK-001 수정 후 로컬 검증 대상(수정 자체는 UNCOMMITTED)
[ ] P2 사람 1회 수동 확인 — 실계정 Google 로그인 → Calendar 연결 → 이벤트 렌더링
[ ] P2 사람 1회 수동 확인 — Redirect OAuth 흐름 실계정 동의 화면
[ ] P2 GOOGLE_CALLBACK_URL / GOOGLE_CALENDAR_CALLBACK_URL 프로덕션 값 등록 확인
[ ] P2(신규, 2026-09-14) `npm audit` high 3건(`find-my-way`/`fast-uri`/`brace-expansion`) 해소 또는 명시적 accepted-risk 기록(TASK-008)
[ ] P2 에러 트래킹(Sentry) 계정 개설 및 연동
[ ] P2 Alert 채널·에스컬레이션 정책 수립
[ ] 앱 아이콘·스크린샷·스토어 이미지 확정
```

---

# Recommended Next Steps

1. **(즉시, Claude 가능)** `WeatherModule` P0 수정 — 이 저장소 밖(Frontend
   소스 저장소)에서 진행. Calendar의 `_codeToMessage` 패턴을 그대로 재사용
   가능(Frontend Version History Report V0.0.16 참고).
2. **(즉시, Claude 가능)** `frontend/docs/FeatureList.md`/`docs/docs/policies/error_policy.md`의
   Finding D-1/D-2 오기 정정 — 코드가 이미 앞서 있는 상태를 문서에 반영.
3. **(1주 내, 사람)** 서버/도메인/SSL 상태 확인 — 이미 코드 기본값에 도메인이
   박혀 있어 이 확인만으로 여러 Blocker가 동시에 해소될 가능성이 높음.
4. **(1주 내, 사람)** 태블릿 실기기 1대 확보 후 전체 대시보드 수동 검증.
5. **(2주 내, Claude+사람 협업)** Backend DB 베이스라인 마이그레이션 작성
   (Claude가 스키마 문서 기준 SQL 초안 작성 가능, 사람이 실제 DB에 적용·검증).
6. **(공개 배포 결정 시, 사람)** Privacy Policy/Terms 법률 검토 착수 —
   가장 리드타임이 긴 항목이므로 다른 작업과 병행 시작 권장.
7. **(V_0.1.2 착수 조건)** 위 Beta Release Checklist가 모두 체크된 이후에만
   Phase 6(Intent Engine) 착수 — `docs/development_rules.md`의 Action
   Layer 우선순위 원칙과 별개로, 이미 열린 P0/High 결함을 먼저 닫는 것이
   우선이다.

## 관련 문서

- [current_status.md](current_status.md), [phase_status.md](phase_status.md), [roadmap.md](roadmap.md)
- [required_human_resource.md](required_human_resource.md)
- [backend/V0.1.0.md](backend/V0.1.0.md), [frontend/V0.1.0.md](frontend/V0.1.0.md)
- [README.md](README.md) — `status/` 폴더 자체의 관리 규칙
