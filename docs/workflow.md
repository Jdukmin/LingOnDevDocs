# LingOn AI Development Workflow (MVP)

> **Status**: Adopted · **Progress**: 0% (운영 절차 문서 — 구현 대상 아님) · **Last Updated**: 2026-07-22 · **Next Milestone**: Phase 0(Refresh Token 인터셉터) 프롬프트에 이 문서의 Step 0~6을 그대로 적용

## 목적

본 문서는 LingOn의 **모든 기능 개발 시 AI 조직이 따라야 하는 표준 개발
프로세스(SOP)**를 정의한다. "개발 계획"이 아니라 **운영체계**다 — 특정
기능 하나의 일정표가 아니라, 앞으로 만들어질 모든 기능이 예외 없이 통과해야
하는 절차를 정의한다.

모든 신규 기능은 동일한 Workflow(§3)를 따르며, AI는 각 단계 종료 후 반드시
검증 리포트를 생성해야 한다. 이 문서 하나만 보고도 전략부 → 기획부 →
Backend/Frontend 개발부 → QA → 문서관리부 순서로 프롬프트를 생성할 수 있는
것을 목표로 한다.

---

## ICD 용어 정리

이 문서와 하위 프롬프트 전체에서 "ICD"는 아래 3가지를 가리킨다 — 셋 다 이미
이 저장소에 존재하며, 새로 만들 필요는 없다.

| 용어 | 정의 | 실제 위치 |
|---|---|---|
| **Domain ICD** | 비즈니스 도메인 간 계약(REST/State/DB를 정의하지 않음) | [requirements/domain_icd/](../requirements/domain_icd/) |
| **API ICD** | 이미 구현되어 있는 기존 REST API의 계약 | [backend/docs/api/](../backend/docs/api/) (status/auth/calendar/weather/settings/apikey/users) |
| **Action ICD** | 신규 Action Layer(Action/Workflow) API 제안 | [docs/icd/action_layer_api.md](icd/action_layer_api.md) |

```
Domain ICD  → 무엇의 계약을 지켜야 하는가 (비즈니스)
API ICD     → 이미 있는 것들을 어떻게 부르는가 (기존 REST)
Action ICD  → 새로 만드는 것을 어떻게 부르는가 (신규 REST)
```

세 문서 모두 **개발 중 임의로 변경할 수 없다** — 변경이 필요하면 Step 0(Domain
Freeze)에서 먼저 문서를 갱신하고, 그 이후에만 구현을 시작한다.

---

## 개발 원칙

### 1. Domain First

새 기능은 [Domain ICD](../requirements/domain_icd/)가 먼저 존재해야 한다.
Domain ICD가 없는 기능은 구현하지 않는다 — 없으면 Step 0에서 먼저 작성한다
([requirements/domain_icd/README.md](../requirements/domain_icd/README.md)의
형식을 따른다).

### 2. API Contract First

Frontend와 Backend는 **API ICD / Action ICD / Domain ICD** 세 문서를
기준으로만 개발한다. 개발 중 임의로 Contract를 변경할 수 없다 — 이번
[API Contract Verification](#부록--최근-발견-사례)에서 실제로 두 ICD 문서가
서로 다른 상태값을 쓰고 있던 사례가 나왔다. 이런 드리프트를 막는 것이 이
원칙의 존재 이유다.

### 3. Backend First

Backend가 API를 구현하고 **실제 실행 검증**(curl, DB 확인, 로그 확인)까지
끝난 후에만 Frontend 작업을 시작한다. (`docs/icd/prompt_playbook.md`의
"Backend → Frontend" 기본 순서와 동일 — Frontend 단독으로 끝나는 예외는
[§4 Phase 0/2/10](#4-mvp-development-order) 참고.)

### 4. Real Execution Only

**Mock 성공은 성공으로 인정하지 않는다.** 아래가 모두 성공해야 완료다:

- 실제 서버 실행
- 실제 DB 저장
- 실제 API 응답
- 실제 Flutter 동작

([requirements/README.md](../requirements/README.md)의 Progress 규칙 —
"테스트 코드 실행이나 실제 동작 확인 없이는 100%로 표기하지 않는다"—와
동일한 원칙이다.)

### 5. Every Step Must Produce Report

각 단계 종료 시 반드시 보고한다: 구현 내용 / 테스트 결과 / 실패 항목 /
다음 팀 인계사항. 형식은 §3의 각 Step 및
[requirements/README.md](../requirements/README.md) "작업 종료 시 보고"를
따른다.

---

## 공통 개발 Workflow

모든 기능은 아래 7단계(Step 0~6)를 반복한다.

```
Step 0 Domain Freeze
   ↓
Step 1 Backend Development
   ↓
Step 2 Backend Verification
   ↓
Step 3 Frontend Development
   ↓
Step 4 Frontend Verification
   ↓
Step 5 Integration Verification
   ↓
Step 6 Documentation Update
   ↓
완료
```

### Step 0 — Domain Freeze

**목적**: 개발 전에 Contract 변경 여부를 확인한다.

**확인 대상 (ICD 항목)**

| ICD | 확인 내용 |
|---|---|
| Domain ICD | 이 기능에 대응하는 `requirements/domain_icd/<domain>.md`가 있는가? 없으면 먼저 작성(Domain First 원칙) |
| API ICD | 재사용할 기존 엔드포인트가 있는가(`backend/docs/api/`)? Wrap 대상인지 [docs/icd/api_comparison.md](icd/api_comparison.md)에서 확인 |
| Action ICD | 신규 Action Type/Workflow가 필요한가([docs/icd/action_layer_api.md](icd/action_layer_api.md))? |
| DB Schema | `backend/docs/database/`에 필요한 테이블이 있는가, 없으면 무엇이 필요한가 |

**완료 조건**: Contract 변경 없음, 또는 변경 후 위 4개 문서 중 해당 문서에
반영 완료.

### Step 1 — Backend Development

Backend는 API, Business Logic, DB, Google API, 외부 Tool 등을 구현한다.

**필수 사항**: Migration 작성 · Logging · Error Handling · Validation

**관련 ICD**: Step 0에서 확정된 API ICD/Action ICD를 **그대로** 구현 대상으로
삼는다(필드명, 상태값, 에러 코드 임의 변경 금지). Domain ICD의
"하지 않는다" 절(예: [dashboard.md](../requirements/domain_icd/dashboard.md)의
Business Logic 금지)을 위반하지 않는지 자체 점검한다.

**완료 조건**: API 구현 완료.

### Step 2 — Backend Verification

**반드시 실제 실행한다. Mock 금지.**

**검증 항목**: curl · 실제 DB 확인 · 로그 확인 · OAuth · 외부 API · Token
저장 여부

**관련 ICD**: 검증 항목이 API ICD/Action ICD에 정의된 Request/Response/State/Error
Code와 **정확히** 일치하는지 하나씩 대조한다 — 이번 API Contract
Verification과 동일한 방식(§부록 참고). 여기서 걸러지지 않으면 Frontend
개발이 잘못된 계약 위에서 시작된다.

**보고서**: Backend Verification Report

### Step 3 — Frontend Development

**Backend Contract 그대로 사용, 수정 금지.**

**구현 대상**: UI · API 연결 · Loading · Error 처리 · Retry · Refresh Token

**관련 ICD**: Step 1~2에서 확정된 API ICD/Action ICD를 그대로 소비한다.
Domain ICD의 경계도 함께 지킨다(예: Dashboard는 Business Logic/Intent/Execution을
포함하지 않는다).

**완료 조건**: Flutter 실행 성공.

### Step 4 — Frontend Verification

실제 앱에서 확인: 로그인 · API 호출 · UI 반영 · Error 처리 · Retry ·
새로고침 · 재접속

**관련 ICD**: 실제 파싱 결과가 API ICD/Action ICD와 일치하는지 확인한다 —
**이번 감사에서 Weather/Calendar가 걸린 지점이 바로 여기다.** 이 Step을
건너뛰면 같은 문제가 반복된다.

**보고서**: Frontend Verification Report

### Step 5 — Integration Verification

Backend + Frontend **동시** 검증.

**필수**: 실제 서버 · 실제 Flutter · 실제 DB · 실제 Google API(해당 시)

**관련 ICD**: Domain ICD 관점에서 전체 Lifecycle
(`User → Intent → Action → Workflow → Tool → Execution → Notification →
Dashboard → History`, [requirements/domain_icd/README.md](../requirements/domain_icd/README.md)
"핵심 실행 모델")이 실제로 끝까지 관통하는지 확인한다. "Backend만 되고
Frontend는 다른 데이터 소스를 쓰고 있다"(Calendar에서 실제로 발견된 패턴)
같은 부분 성공은 여기서 반드시 걸러야 한다.

**보고서**: Integration Report

**Progress 상한**: [requirements/README.md](../requirements/README.md) 및
[docs/icd/prompt_playbook.md](icd/prompt_playbook.md) §4 규칙을 따른다 —
이 Step 완료 전까지는 Progress 75%를 부여하지 않는다.

### Step 6 — Documentation Update

**항상 마지막에 수행한다.**

**업데이트 대상**: `requirements/` (Status/Progress/Traceability) ·
`backend/docs/`, `frontend/docs/` (FeatureList) · ChangeLog

**관련 ICD — ICD 변경 관리 규칙**: 구현 중 불가피하게 ICD와 다르게 만들어야
했던 부분이 있다면, **구현에 맞춰 ICD를 조용히 고치지 않는다.** 별도로
"ICD 변경 요청"을 만들어 기획부(Domain/API/Action ICD 소유자) 승인을 받은
뒤에만 ICD 문서를 갱신한다. 이 순서를 지키지 않으면 이번 감사에서 발견된
것과 같은 문서-코드 드리프트가 반복된다.

**완료 조건**: 문서 최신화.

---

## MVP Development Order

Phase 순서와 선행조건은 [docs/icd/prompt_playbook.md](icd/prompt_playbook.md) §3과
동일하며, 이 문서가 정식 명칭(Phase 0~10)을 부여한 canonical 버전이다.

| Phase | 기능 | 담당 | 목적 / 선행 조건 |
|---|---|---|---|
| **Phase 0** | Refresh Token | Frontend Only | 재로그인 없는 인증 유지 |
| **Phase 1** | Weather Action | Backend → Frontend | Action Pipeline 최소 검증 — ⚠ 착수 전 API Contract Verification P0(Weather 응답 포맷) 확인 필요 |
| **Phase 2** | Google Calendar | Frontend Only(Backend 완료) | Google Action 최초 완성 — ⚠ 착수 전 P0(CalendarEvent 필드명) 확인 필요 |
| **Phase 3** | Intent Engine | Backend → Frontend | 자연어 → Action |
| **Phase 4** | Todo | Backend → Frontend | — |
| **Phase 5** | Reminder | Backend → Frontend | — |
| **Phase 6** | Notification | Backend → Frontend | — |
| **Phase 7** | Home Assistant | Backend → Frontend | 선행 조건: Home Network 연결 방식 결정 |
| **Phase 8** | NAS | Backend → Frontend | 선행 조건: Home Network 연결 방식 결정 |
| **Phase 9** | Workflow Engine | Backend → Frontend | 선행 조건: 2개 이상의 Tool 완료 |
| **Phase 10** | Dashboard UX | Frontend Only | 최종 단계 |

---

## 출시 전 필수 체크리스트

모든 항목이 아직 "Not Started" 또는 "Partial"이다 — 순서상 Phase 진행과
병행해 채워야 한다(자세한 배경은 이전 대화의 프로덕션 준비도 검토 참고).

### Infrastructure

| 항목 | 상태 | 비고 |
|---|---|---|
| Home Network 접근 구조 | Not Started | [homeassistant.md](../requirements/domain_icd/homeassistant.md)/[nas.md](../requirements/domain_icd/nas.md) 착수 전 필수 결정 |
| VPN / Tunnel 구조 | Not Started | 위와 동일 이슈 |
| Worker Queue | Not Started | `action_layer_api.md`의 202 비동기 응답이 이를 전제하지만 기술 미정 |
| Background Job | Not Started | `refresh_tokens` 정리 Job이 backend FeatureList에 "Planned"로만 존재 — [ops/data_sop.md](ops/data_sop.md) |
| Circuit Breaker | Not Started | LLM 비용 폭주 방지 — [requirements/llm_gateway_requirements.md](../requirements/llm_gateway_requirements.md) LLM-004 |

세부 절차: [ops/deployment_sop.md](ops/deployment_sop.md), [ops/monitoring.md](ops/monitoring.md)

### Database

| 항목 | 상태 | 비고 |
|---|---|---|
| Migration | Not Started | `backend/docs/database/README.md`에 마이그레이션 파일 자체가 없다고 명시됨 |
| Backup | Not Started | NAS Domain은 사용자 백업을 다루지만, 서비스 자체 DB 백업 계획은 없음 |
| Restore | Not Started | — |
| Rollback | Not Started | — |

세부 절차: [ops/data_sop.md](ops/data_sop.md)

### Security

| 항목 | 상태 | 비고 |
|---|---|---|
| Privacy Policy | Not Started | 요구사항 정리는 완료 — [policies/privacy_policy.md](policies/privacy_policy.md) |
| Terms | Not Started | 요구사항 정리는 완료 — [policies/privacy_policy.md](policies/privacy_policy.md) |
| Google Verification | Not Started | `calendar.readonly` 스코프는 프로덕션 단계에서 Google 보안 심사 대상 — [policies/privacy_policy.md](policies/privacy_policy.md) |
| OAuth Scope 검토 | Not Started | Home Assistant/NAS 추가 시 가정 내부망 접근까지 포함되어 민감도 상승 |
| Secret 관리 | Partial | AES-256-GCM 암호화는 있음(`MASTER_ENCRYPTION_KEY`) — KMS/rotation 정책 없음. 상세: [policies/security_policy.md](policies/security_policy.md) |
| HTTPS / CORS / Cookie 속성 | 확인 필요 | 문서화 자체가 없음 — [policies/security_policy.md](policies/security_policy.md) "확인 필요" 항목 |

세부 정책: [policies/error_policy.md](policies/error_policy.md), [policies/logging_policy.md](policies/logging_policy.md), [policies/security_policy.md](policies/security_policy.md), [policies/privacy_policy.md](policies/privacy_policy.md)

### Testing

| 항목 | 상태 | 비고 |
|---|---|---|
| Backend 자동 테스트 | Not Started | 저장소 전체에 테스트 파일 없음 |
| Flutter Widget Test | Not Started | — |
| Integration Test | Not Started | Step 5(Integration Verification)를 자동화하는 첫 단계로 검토 |
| Regression Test | Not Started | — |

### Reliability

| 항목 | 상태 | 비고 |
|---|---|---|
| Offline Mode | Not Started | "Always-On Dashboard"라는 이름과 달리 미정의 |
| Retry 정책 | Partial | [workflow.md](../requirements/domain_icd/workflow.md)에 개념(`on_failure: retry`)만 정의, 구현 없음 |
| Timeout | Partial | [action.md](../requirements/domain_icd/action.md)에 `timed_out` State 정의, 구현 없음 |
| Recovery | Partial | `rolled_back` 개념 정의, 구현 없음 |
| Notification 정책 | Not Started | [notification.md](../requirements/domain_icd/notification.md) 자체가 0% |

---

## AI 조직 운영 구조

| 조직 | 역할 | 주요 산출물 | 현재 실제 산출물 |
|---|---|---|---|
| **전략부** | 시장성 분석, 우선순위 결정, 기능 제안 | 전략 보고서, 기능 승인안 | [docs/strategy/](strategy/), [docs/roadmap/](roadmap/), [docs/decisions/](decisions/) |
| **기획부** | Domain 정의, ICD 작성, 요구사항 관리, 정책 요구사항 정리 | Domain ICD, API ICD, Action ICD, Error/Logging/Security/Privacy 요구사항 | [requirements/domain_icd/](../requirements/domain_icd/), [docs/icd/](icd/), `backend/docs/api/`(기존 API ICD), [docs/policies/](policies/) |
| **Backend 개발부** | API, DB, 비즈니스 로직 구현 | Backend Verification Report | `backend/docs/`(구현 문서) — Verification Report 양식은 이 문서로 신규 도입 |
| **Frontend 개발부** | UI/UX 및 API 연동 | Frontend Verification Report | `frontend/docs/` — Verification Report 양식은 이 문서로 신규 도입 |
| **통합 검증부(QA)** | End-to-End 검증, 회귀 테스트 | Integration Report, Bug Report | 이번 API Contract Verification/Docs Revision Report가 최초 QA 산출물 사례 |
| **문서관리부** | FeatureList, ChangeLog, 진행률 관리 | 최신 문서, 릴리즈 노트 | `requirements/*_requirements.md`(Status/Progress), FeatureList.md — ChangeLog는 `docs/` 하위만 존재, 전체 확장 필요 |
| **DevOps/배포부** | CI/CD, 서버, 모니터링, 운영 | 배포 보고서, 운영 상태 | [docs/ops/](ops/)(SOP 뼈대는 있음, 실제 운영 산출물은 아직 없음) — 위 "출시 전 체크리스트 Infrastructure"와 직결된 공백 |
| **사용자 승인(본인)** | 제품 방향, 사업 판단, 최종 승인 | 승인/보류/반려 결정 | 이 대화 자체 |

---

## 부록 — 최근 발견 사례

이 SOP가 실제로 막아야 하는 문제의 구체적 예시(2026-07-22 API Contract
Verification에서 발견, 같은 날 정정 완료):

- `requirements/domain_icd/action.md` ↔ `docs/icd/action_layer_api.md`
  State 표기 불일치(PascalCase vs snake_case) — Step 0(Domain Freeze)에서
  이런 것부터 확인했어야 함.
- `frontend/docs/services/WeatherService.md`가 Backend `weather.md`와 다른
  응답 포맷을 서술 — Step 4(Frontend Verification)가 없었기 때문에 발견이
  늦어짐.
- `backend/docs/services/google-auth.md`의 `avatar_url` 오기 — Step 6
  (Documentation Update)이 누락되면 이런 오래된 문서가 계속 남는다.

## 관련 문서

- [icd/prompt_playbook.md](icd/prompt_playbook.md) — Front/Back 분리 프롬프트 운영 세부 규칙(필수 동반 문서 매트릭스 등)
- [development_rules.md](development_rules.md) — 제품 우선순위 원칙
- [../requirements/README.md](../requirements/README.md) — Requirement Status/Progress 규칙
- [../requirements/domain_icd/README.md](../requirements/domain_icd/README.md) — Domain ICD 목록/핵심 실행 모델
- [policies/](policies/) — Error/Logging/Security/Privacy 정책
- [ops/](ops/) — Deployment/Data SOP, Monitoring

---

# Change Log

- **2026-07-22** — API Contract Verification 결과를 반영해 SOP 형태로 최초 작성
  (Step 0~6에 ICD 항목 추가, Phase 0~10 확정, 출시 전 체크리스트, AI 조직
  운영 구조 포함).
- **2026-07-22** — Docs Revision(SSOT 정리)에서 출시 전 체크리스트/AI 조직
  운영 구조에 신규 정책 문서(`docs/policies/`)·Ops SOP(`docs/ops/`) 링크 추가.
