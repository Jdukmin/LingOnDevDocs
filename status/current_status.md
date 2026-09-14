# Current Status

> **자동 생성 기준**: `FRONTEND_VERIFICATION_REPORT.md`,
> `BACKEND_VERIFICATION_REPORT.md`(2026-07-24),
> `FRONTEND_SCHEMA_VERIFICATION_REPORT.md`,
> `BACKEND_SCHEMA_VERIFICATION_REPORT.md`(2026-07-23, 각 소스 저장소 루트)
> + `requirements/system_requirements.md` + 양쪽 `FeatureList.md`. 이
> 문서는 새 판단을 하지 않는다 — 근거 보고서를 요약·연결할 뿐이다.
>
> **Last synced**: 2026-07-29 (`V_0.1.0` Baseline 선언 시점)
>
> **Last synced**: 2026-09-14 (TASK-007 — execution-verified). 2026-07-29
> 자동 생성 기준은 정적 코드 대조(static comparison)만 수행했고 Flutter
> 툴체인을 실제로 실행하지 않았다. 2026-09-14 갱신은 `flutter
> doctor`/`flutter analyze`/`flutter test`/`tsc --noEmit`/`npm audit`를
> 실제로 실행(command-executed)한 결과를 반영한다 — §5.5 표 참고. 현재
> 가장 최신·권위있는 릴리스 단계 기록은 [release_state.md](release_state.md)이며
> (Stage: Internal alpha), 이 문서와 상충하지 않는다.

---

## Executive Summary

Backend/Frontend 모두 **Application 계층은 Release 후보 수준으로 검증됨**:
19개 문서화 API 전부(Backend) + 7개 도메인(Frontend) 계약이 실제 서버
실행/정적 코드 대조로 확인됐다. 이번 감사에서 **P0 결함 2건**이
발견·수정(Backend: Calendar 필드명/DB drift) 또는 **미수정 발견**
(Frontend: Weather 에러 메시지 노출)됐다. **Operational 계층**(DB
마이그레이션 재현성, CORS, HTTPS)은 Medium~High 리스크로 확인되어
`V_1.0.0` 이전 반드시 해결이 필요하다. Intent/Memory/Planner/Action
Router/Workflow(Phase 6~11)는 설계 문서만 있고 코드가 전혀 없다 — 이는
결함이 아니라 **의도된 범위 밖**(SSOT가 이 6개 Domain을 `Status: Proposed,
Progress: 0%`로 명시).

## 1. 현재 구현 완료 기능

| 기능 | Progress | 근거 |
|---|---|---|
| User Auth(ID Token + Redirect, Session, Refresh rotation, Logout) | 75% | Backend Schema Verification Report §3, §7(실서버 검증) — Redirect의 대화형 동의 완료만 사람 확인 필요 |
| Google Calendar 연동(OAuth 동의 + 조회) | 75% | Backend/Frontend 양쪽 Verification Report — 실계정 happy-path만 미검증 |
| Weather(현재/예보) | 75%(P0 결함 있음) | Backend: 실 OpenWeather API로 검증. Frontend: 모델 파싱 일치하나 에러 UX 결함 |
| Dashboard 핵심 위젯(Clock/Weather/Calendar/Brief/Chat/Sidebar/Status) | 75% | Frontend Schema Verification Report §6 |
| Settings(AI/UI) GET | 75%(PUT은 Dead Code) | Frontend Schema Verification Report §3, Issue #6 |
| BYOK API Key 저장(암호화) | 75%(Frontend UI 없음) | Backend: DB drift 수정 후 실동작 확인. Frontend: Route는 있으나 UI 미연결 |
| ICD v0.0 공통 응답 envelope, Rate Limiting(30/120), 로깅(`request_logs`/`raw_logs`) | 100% | Backend Schema Verification Report §4, §7 — 실 429/로그 확인 |

## 2. 현재 개발 중 / 미완결

| 기능 | 상태 | 근거 |
|---|---|---|
| Weather 에러 메시지 매핑 | **해결·커밋 완료(2026-09-14, TASK-002/011)** | `weather_error_mapper.dart`/`brief_error_mapper.dart` 커밋(letmeknow `502388f`, `95f7770`). `runGuarded`의 `e.toString()` 호출 지점은 base class 1곳만 남음 |
| DB 마이그레이션 재현성 | **해결·커밋 완료(2026-09-14, TASK-003)** | `migrations/000_baseline_schema.sql` 커밋(lingon `39d0178`). 실제 PostgreSQL 18.6 클러스터에서 `000`→`005` 2회 연속 적용 성공(멱등). **단, 신규 환경 재현 테스트의 운영 실적용은 미검증** |
| CORS 정책 | **Blocked(Medium)** | `origin: true` — 전체 Origin 반사, allow-list 없음 |
| HTTPS/HSTS | **Blocked(Medium)** | 코드 레벨 강제 없음, 문서화되지 않은 리버스 프록시에 전적으로 의존 |
| Settings/API Key 관리 UI | Not Started | Route/모델은 완성되었으나 호출하는 화면이 없음(Dead Code) |
| Todo Widget(DSH-004), Widget Visibility(DSH-006) | Not Started | 두 저장소 어디에도 근거 없음 |
| Intent/Memory/Planner/Action Router/Automation(확장 Connector 포함) | Not Started(설계만) | Phase 6~11, [roadmap.md](roadmap.md) |

## 3. Blocker

1. **[P0]** Weather 에러 발생 시 사용자에게 원시 Dart 예외 문자열이 노출됨
   — `docs/policies/error_policy.md` 직접 위반. `V_0.1.x`에서 최우선 수정 대상.
   **갱신(2026-09-14, TASK-002)**: 매퍼 코드가 작업 트리에 작성되었으나
   아직 커밋되지 않음 — 커밋 전까지 블로커 유지.
2. **[High]** DB 스키마가 `migrations/`만으로 재현 불가능 — 새 환경(스테이징,
   재해 복구, 신규 개발자)을 표준 절차로 구성할 수 없음.
   **갱신(2026-09-14, TASK-003)**: `migrations/000_baseline_schema.sql` 초안이
   작업 트리에 작성되었으나 아직 커밋되지 않음 — 커밋 전까지 블로커 유지.

## 4. Known Issues

| Issue | Priority | 출처 |
|---|---|---|
| `LingonUsersRoute.patchMe`의 `city`가 명시적 `null`을 보낼 수 없음(clear 불가) | P2 | Frontend Verification/Schema Report(2건 모두, 반복 확인됨) |
| `LingonSettingsRoute`/`LingonApiKeyRoute` 쓰기 경로가 Dead Code | P2 | Frontend Schema Verification Report Issue #6 |
| CORS 전체 개방 | P2(Medium) | Backend Schema Verification Report Issue #2 |
| HTTPS/HSTS 미확정 | P2(Medium) | Backend Schema Verification Report Issue #3 |
| `backend/docs/api/users.md`가 `provider_id` 포함을 잘못 문서화(실제로는 제외됨 — 코드가 문서보다 안전한 방향으로 다름) | P3 | Backend Schema Verification Report Issue(Low) |
| `backend/docs/api/weather.md`에 error.code 표 없음 | **RESOLVED(2026-09-14)** | Backend Schema Verification Report Issue(Low), [docs/icd/gap_analysis.md](../docs/icd/gap_analysis.md) §5와 동일 항목 — 이번 패스에서 `backend/docs/api/weather.md`에 error.code 표가 추가됨(다른 작업자 담당) |
| `frontend/docs/FeatureList.md`가 Calendar를 "로컬 캘린더(완료)/Google 동기화(예정)"로 오기 — 실제로는 V0.0.12부터 Google 전용으로 완전 전환됨 | **RESOLVED(2026-07-29)** | Frontend Schema Verification Report Finding D-1 — `frontend/docs/FeatureList.md:74-79`에 정정 노트로 이미 반영됨(확인됨, 원본 문서 정정 완료 상태) |
| `docs/policies/error_policy.md` 401 행 + `frontend/docs/FeatureList.md`가 401 자동 재시도 인터셉터를 "미연결"로 오기 — 실제로는 V0.0.11부터 구현됨 | **RESOLVED(2026-07-29)** | Frontend Schema Verification Report Finding D-2 — `docs/policies/error_policy.md:41`, `frontend/docs/FeatureList.md:24`에 정정 노트로 이미 반영됨(확인됨, 원본 문서 정정 완료 상태) |
| `frontend/docs/DevelopmentGuide.md`의 `lib/auth/` 트리 문서가 실제 `lib/modules/auth/` 구조와 다름 | **corrected 2026-09-14 by TASK-007** | Frontend Schema Verification Report Finding D-3 — 실제 트리는 `letmeknow/lib/modules/{analytics,auth,brief,calendar,chat,clock,sidebar,weather}`(디렉터리 목록으로 확인, `lib/auth`는 존재하지 않음). 다른 작업자가 `DevelopmentGuide.md` 원본을 이번 패스에서 정정 중 |
| 루트 `ICD.md`(Frontend 저장소, v2.0)가 SSOT(`backend/docs/api/weather.md`)와 다른 Weather 스키마를 문서화 — orphaned, 코드는 SSOT를 정확히 따름 | P3 | Frontend Schema Verification Report Finding D-4 |
| `usage_logs` 테이블이 라이브 DB에 존재하나 어떤 코드도 쓰지 않음 | P3 | Backend Verification Report §12 |
| Client가 실제로 던지는 `RouteException` 코드(`TIMEOUT`, `CLIENT_EXCEPTION`, `NETWORK_ERROR`, `HTTP_EXCEPTION`, `FORMAT_ERROR`, `INVALID_JSON_OBJECT`, `HTTP_<status>`, `UNKNOWN_ERROR`)가 SSOT 어디에도 문서화되어 있지 않음 | P3(신규, 2026-09-14) | `letmeknow/lib/core/utils/error_handler.dart:36-67`, `letmeknow/lib/core/base/base_route.dart:74,76,214-216` |
| `lingon/CLAUDE.md`(Backend 소스 저장소)가 `user_api_keys`에 `id bigserial` PK + `users.id` FK가 있다고 기술 — SSOT(`backend/docs/database/`)는 이런 PK/FK 없이 복합 PK `(user_id, provider)`로만 문서화함 | P3(신규, 2026-09-14) | `lingon/CLAUDE.md` — Backend 소스 저장소 파일이라 이 패스에서 직접 수정 불가. 이 저장소(`docs/CLAUDE.md` "## 역할": "Backend and Frontend source repositories reference this repository. They do not own these contracts.")가 SSOT이므로 이 문서가 우선한다 |

## 5. 다음 작업 (Priority 순)

1. **(P0)** `WeatherModule`에 `error.code`→사용자 메시지 매퍼 추가(Calendar/Auth와
   동일 패턴). **갱신(2026-09-14)**: `weather_error_mapper.dart`/
   `brief_error_mapper.dart`로 작업 트리에 이미 작성됨(TASK-002) — 남은 일은
   커밋뿐.
2. **(P1)** 사람이 실제 Google 계정으로 로그인 → Calendar 연결 → 이벤트
   렌더링까지 1회 수동 확인(양쪽 Verification Report 공통 권고).
3. **(P1)** `FeatureList.md`(Calendar 상태), `error_policy.md`(401 인터셉터
   상태) 문서 정정(Finding D-1, D-2). **갱신(2026-09-14)**: 이 항목은 이미
   완료된 상태다 — `frontend/docs/FeatureList.md:24`, `:74-79`와
   `docs/policies/error_policy.md:41`에 2026-07-29자 정정 노트가 원본에
   직접 반영되어 있음(확인됨). §4 Known Issues D-1/D-2 행도 RESOLVED로
   갱신함.
4. **(High)** DB 베이스라인 마이그레이션(`000_baseline_schema.sql`) 작성.
   **갱신(2026-09-14)**: 작업 트리에 초안 작성 완료(TASK-003) — 남은 일은
   검증 및 커밋.
5. **(Medium)** CORS allow-list 확정, HTTPS/HSTS 리버스 프록시 설정 문서화.
6. Phase 6(Intent Engine) 착수 — `V_0.1.2` 목표.

## 5.5 검증 베이스라인 (2026-09-14 실행)

2026-07-29 이전 판정은 정적 코드 대조에 근거했다. 아래는 2026-09-14에
실제로 실행한 명령과 결과다(TASK-007). 상세 배경은
[release_state.md](release_state.md) §1 참고(이 문서와 상충하지 않음, 그
문서는 수정하지 않음).

| 검증 항목 | 명령 | 결과 |
|---|---|---|
| Flutter 툴체인 | `flutter doctor` | **CLEAN** — Flutter 3.41.2, Dart 3.11.0 설치 확인. 기존 "Flutter SDK 미설치" 서술은 전부 OBSOLETE |
| Frontend 정적 분석 | `cd letmeknow && flutter analyze` | **"No issues found!"** |
| Frontend 테스트 | `cd letmeknow && flutter test` | **283건 통과**(letmeknow `48bc665`) — 커밋 `ad08414` 기준 98건 + 2026-09-14 신규 185건. 모두 커밋 완료 |
| Backend 타입체크 | `cd lingon && ./node_modules/.bin/tsc -p tsconfig.json --noEmit` | **clean**(전체 `npm install` 후) |
| Backend 테스트 | `cd lingon && npm test` | **230건 통과 / 68 suites**(lingon `b5fad88`) — `node:test`+`tsx` 하네스 도입·커밋 완료(TASK-006). 이전 베이스라인 `dd38b22`에서는 0건이었다 |
| 의존성 감사 | `cd lingon && npm audit` | **3 high, 2 moderate, 2 low** — high는 `find-my-way`(Fastify 자체 라우터), `fast-uri`, `brace-expansion`(TASK-008) |

### 신규 리스크(2026-09-14 발견)

| Risk | 등급 | 내용 | 근거 |
|---|---|---|---|
| 릴리스 빌드 스크립트 파손 | **해결·커밋 완료** | `letmeknow/compile_release.sh`가 `set -euo pipefail` 하에서 정의되지 않은 `FLUTTER_DEFINE_ARGS`를 참조해 release 빌드가 중단되던 결함. TASK-001로 수정(`PROJECT_DIR`를 `BASH_SOURCE` 기반으로 변경, `assert_no_secret_defines()` 가드 추가, `SKIP_DEPLOY=1` 로컬 검증 옵션) — letmeknow `adab5f0`에 커밋 | `letmeknow/compile_release.sh`(TASK-001) |
| Web 배포 시 `--dart-define` 값이 공개 노출됨 | High(신규 발견, 문서화되지 않았던 구조적 리스크) | Frontend는 **Flutter Web을 Apache로 서빙**하는 구조다 — `compile_release.sh`가 `build/web/`을 빌드해 `/var/www/lingon/releases/<timestamp>/`로 rsync하고 Apache가 `current` 심볼릭 링크로 서빙(`letmeknow/run_release.sh`, `lingon/server_deploy.sh` 참고). 따라서 `--dart-define`으로 전달한 값은 배포된 JavaScript 안에 그대로 노출되어 누구나 읽을 수 있다 — 어떤 status/ops 문서도 이전에 이 사실을 명시하지 않았다. Secret을 이 경로로 주입하면 안 된다 | `letmeknow/compile_release.sh`, `letmeknow/run_release.sh`, `lingon/server_deploy.sh`(TASK-001 범위) |
| 의존성 취약점(high 3건) | Medium~High | `npm audit` 결과 high 3건(`find-my-way`, `fast-uri`, `brace-expansion`) — `find-my-way`는 Fastify 자체 라우터라 우회가 어려움, 버전 업그레이드 검토 필요 | `npm audit`(TASK-008) |

배포 파이프라인 자체 서술(`docs/ops/deployment_sop.md`)은 현재 "배포
파이프라인 없음(0%)"으로 기술되어 있으나, 위 스크립트들이 실제 rsync +
Apache 심볼릭 링크 배포를 구현하고 있어 그 문서 쪽이 stale하다 — 다른
작업자가 `deployment_sop.md`를 이번 패스에서 정정 중이므로 이 문서는 그
파일을 직접 수정하지 않는다.

## 6. Release Readiness — `V_0.1.0` Baseline

| 카테고리 | 판정 | 근거 |
|---|---|---|
| A. Documentation Compliance | Good(90%) | Backend Schema Verification Report §9 |
| B. API Contract Stability | Excellent(95%) | 동일 §9 — 19개 API 전수 실서버 검증 |
| C. Database Reliability | **Needs Work(65%)** | 마이그레이션 재현성 부족 |
| D. Security Readiness | Fair(75%) | CORS/HTTPS 미확정, 그 외(암호화/redaction/쿠키)는 전부 Strong |
| E. Production Deployment Readiness | **Improved / Live-unverified** | 자동 테스트: **Frontend 283건**(`flutter test`), **Backend 230건 / 68 suites**(`npm test`) — 양쪽 모두 커밋 완료. 마이그레이션 재현성(TASK-003)과 CORS allow-list(TASK-004)도 커밋 완료. 남은 공백은 **CI 파이프라인 부재**와 **실서버 통합 검증 미실행** |
| Frontend Release Readiness | **Code Complete / Live-unverified** | Weather P0 결함 해소·커밋 완료(TASK-002). `flutter analyze` clean, `flutter test` **283 passing**. 남은 것은 실서버·실자격증명 통합 검증뿐 |

**결론**: `V_0.1.0`은 "Baseline"이지 "Release Candidate"가 아니다 — 위 P0/High
항목이 해소되기 전까지 `V_1.0.0`으로 진행하지 않는다.

### Pending version bumps (미확정 — 커밋 전까지 보류)

> 근거: `version/frontend.json`의 `known_discrepancy` 두 번째 항목 —
> "Version 관리 rule requires actual committed implementation, and
> uncommitted working-tree code doesn't qualify." 동일 원칙을 이번 패스의
> 모든 변경에도 적용한다. 아래 두 bump는 **아직 실행하지 않았다** — 이
> 문서는 예정만 기록한다. `docs/CLAUDE.md` "Version 관리": 문서만 바뀌고
> 계약이 바뀌지 않았다면 version을 올리지 않는다는 규칙에 따라, 이번
> current_status.md/BETA 보고서 정정 자체도 별도 version bump 대상이 아니다.

| 컴포넌트 | 예정 Bump | 커버 범위 | 전제 조건 |
|---|---|---|---|
| Backend | `0.1.0` → **`0.1.2`(Patch, 적용 완료)** | 베이스라인 마이그레이션·CORS allow-list·테스트 하네스·의존성·D-005 provider 정합화·로그 자격증명 유출 5건 수정 | lingon `b5fad88`에 커밋 완료 |
| Frontend | `0.1.2` → **`0.1.3`(Patch, 적용 완료)** | 릴리스 빌드 수정+시크릿 가드, 에러 매퍼, 백엔드 경유 채팅, BYOK UI, 자격증명 플로우, 테스트 185건 추가 | letmeknow `48bc665`에 커밋 완료 |

커밋되지 않은 작업에는 어느 쪽도 bump하지 않으며, 미출시(unreleased)
uncommitted 작업에 대한 changelog 항목도 작성하지 않는다. **2026-09-14 기준 이 원칙은 충족되었다** — 구현이 먼저 커밋된 뒤 version/changelog가 갱신되었다(backend `0.1.2`, frontend `0.1.3`).

## 7. Beta Release 종합 보고서

이 문서(Requirement 단위 상세)와 [phase_status.md](phase_status.md)(Phase
단위), [roadmap.md](roadmap.md)(장기 계획)를 하나로 엮어 Beta Release
관점(Remaining Development, Required Human Resource, Risks, Release
Blockers, Checklist)으로 재정리한 문서: [BETA_RELEASE_STATUS_REPORT.md](BETA_RELEASE_STATUS_REPORT.md).
AI가 수행할 수 없는 작업(Store 등록, OAuth Verification, 법률 문서, 실기기
테스트 등)만 별도로: [required_human_resource.md](required_human_resource.md).

## 관련 문서

- [roadmap.md](roadmap.md), [phase_status.md](phase_status.md)
- [BETA_RELEASE_STATUS_REPORT.md](BETA_RELEASE_STATUS_REPORT.md), [required_human_resource.md](required_human_resource.md)
- [../requirements/system_requirements.md](../requirements/system_requirements.md)
- [../requirements/requirements_traceability.md](../requirements/requirements_traceability.md)
