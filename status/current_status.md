# Current Status

> **자동 생성 기준**: `FRONTEND_VERIFICATION_REPORT.md`,
> `BACKEND_VERIFICATION_REPORT.md`(2026-07-24),
> `FRONTEND_SCHEMA_VERIFICATION_REPORT.md`,
> `BACKEND_SCHEMA_VERIFICATION_REPORT.md`(2026-07-23, 각 소스 저장소 루트)
> + `requirements/system_requirements.md` + 양쪽 `FeatureList.md`. 이
> 문서는 새 판단을 하지 않는다 — 근거 보고서를 요약·연결할 뿐이다.
>
> **Last synced**: 2026-07-29 (`V_0.1.0` Baseline 선언 시점)

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
| Weather 에러 메시지 매핑 | **Blocked(P0)** | `WeatherModule`에 `error.code`→메시지 매핑 없음 — 원시 예외 노출 |
| DB 마이그레이션 재현성 | **Blocked(High)** | 7개 테이블 중 5개(`users` 기본 테이블 포함)에 `CREATE TABLE` 마이그레이션 없음 |
| CORS 정책 | **Blocked(Medium)** | `origin: true` — 전체 Origin 반사, allow-list 없음 |
| HTTPS/HSTS | **Blocked(Medium)** | 코드 레벨 강제 없음, 문서화되지 않은 리버스 프록시에 전적으로 의존 |
| Settings/API Key 관리 UI | Not Started | Route/모델은 완성되었으나 호출하는 화면이 없음(Dead Code) |
| Todo Widget(DSH-004), Widget Visibility(DSH-006) | Not Started | 두 저장소 어디에도 근거 없음 |
| Intent/Memory/Planner/Action Router/Automation(확장 Connector 포함) | Not Started(설계만) | Phase 6~11, [roadmap.md](roadmap.md) |

## 3. Blocker

1. **[P0]** Weather 에러 발생 시 사용자에게 원시 Dart 예외 문자열이 노출됨
   — `docs/policies/error_policy.md` 직접 위반. `V_0.1.x`에서 최우선 수정 대상.
2. **[High]** DB 스키마가 `migrations/`만으로 재현 불가능 — 새 환경(스테이징,
   재해 복구, 신규 개발자)을 표준 절차로 구성할 수 없음.

## 4. Known Issues

| Issue | Priority | 출처 |
|---|---|---|
| `LingonUsersRoute.patchMe`의 `city`가 명시적 `null`을 보낼 수 없음(clear 불가) | P2 | Frontend Verification/Schema Report(2건 모두, 반복 확인됨) |
| `LingonSettingsRoute`/`LingonApiKeyRoute` 쓰기 경로가 Dead Code | P2 | Frontend Schema Verification Report Issue #6 |
| CORS 전체 개방 | P2(Medium) | Backend Schema Verification Report Issue #2 |
| HTTPS/HSTS 미확정 | P2(Medium) | Backend Schema Verification Report Issue #3 |
| `backend/docs/api/users.md`가 `provider_id` 포함을 잘못 문서화(실제로는 제외됨 — 코드가 문서보다 안전한 방향으로 다름) | P3 | Backend Schema Verification Report Issue(Low) |
| `backend/docs/api/weather.md`에 error.code 표 없음 | P3 | Backend Schema Verification Report Issue(Low), [docs/icd/gap_analysis.md](../docs/icd/gap_analysis.md) §5와 동일 항목 |
| `frontend/docs/FeatureList.md`가 Calendar를 "로컬 캘린더(완료)/Google 동기화(예정)"로 오기 — 실제로는 V0.0.12부터 Google 전용으로 완전 전환됨 | P1 | Frontend Schema Verification Report Finding D-1 |
| `docs/policies/error_policy.md` 401 행 + `frontend/docs/FeatureList.md`가 401 자동 재시도 인터셉터를 "미연결"로 오기 — 실제로는 V0.0.11부터 구현됨 | P1 | Frontend Schema Verification Report Finding D-2 |
| `frontend/docs/DevelopmentGuide.md`의 `lib/auth/` 트리 문서가 실제 `lib/modules/auth/` 구조와 다름 | P3 | Frontend Schema Verification Report Finding D-3 |
| 루트 `ICD.md`(Frontend 저장소, v2.0)가 SSOT(`backend/docs/api/weather.md`)와 다른 Weather 스키마를 문서화 — orphaned, 코드는 SSOT를 정확히 따름 | P3 | Frontend Schema Verification Report Finding D-4 |
| `usage_logs` 테이블이 라이브 DB에 존재하나 어떤 코드도 쓰지 않음 | P3 | Backend Verification Report §12 |

## 5. 다음 작업 (Priority 순)

1. **(P0)** `WeatherModule`에 `error.code`→사용자 메시지 매퍼 추가(Calendar/Auth와 동일 패턴).
2. **(P1)** Flutter SDK가 설치된 환경에서 `flutter analyze`/`test`/`build`를
   실행해 Frontend Schema Verification Report §7의 공백을 메운다.
3. **(P1)** 사람이 실제 Google 계정으로 로그인 → Calendar 연결 → 이벤트
   렌더링까지 1회 수동 확인(양쪽 Verification Report 공통 권고).
4. **(P1)** `FeatureList.md`(Calendar 상태), `error_policy.md`(401
   인터셉터 상태) 문서 정정(Finding D-1, D-2 — 이번 패스는 `status/`만
   갱신했고 `frontend/docs/`/`docs/policies/` 원본은 아직 수정하지 않음).
5. **(High)** DB 베이스라인 마이그레이션(`000_baseline_schema.sql`) 작성.
6. **(Medium)** CORS allow-list 확정, HTTPS/HSTS 리버스 프록시 설정 문서화.
7. Phase 6(Intent Engine) 착수 — `V_0.1.2` 목표.

## 6. Release Readiness — `V_0.1.0` Baseline

| 카테고리 | 판정 | 근거 |
|---|---|---|
| A. Documentation Compliance | Good(90%) | Backend Schema Verification Report §9 |
| B. API Contract Stability | Excellent(95%) | 동일 §9 — 19개 API 전수 실서버 검증 |
| C. Database Reliability | **Needs Work(65%)** | 마이그레이션 재현성 부족 |
| D. Security Readiness | Fair(75%) | CORS/HTTPS 미확정, 그 외(암호화/redaction/쿠키)는 전부 Strong |
| E. Production Deployment Readiness | **Needs Work(65%)** | 자동 테스트 0건, 마이그레이션 이슈와 동일 원인 |
| Frontend Release Readiness | **Not Ready** | Weather P0 결함이 blocking(Frontend Schema Verification Report §9) |

**결론**: `V_0.1.0`은 "Baseline"이지 "Release Candidate"가 아니다 — 위 P0/High
항목이 해소되기 전까지 `V_1.0.0`으로 진행하지 않는다.

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
