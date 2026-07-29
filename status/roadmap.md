# Roadmap

> **기준**: 이 문서는 실제 Backend(`jdukmin/lingon`)/Frontend
> (`jdukmin/letmeknow`) 저장소의 현재 구현 상태(2026-07-29,
> Backend/Frontend Schema Verification Report 기준)와 DevDocs SSOT
> (`requirements/`, `requirements/domain_icd/`, `docs/`)를 근거로 재구성한
> 12-Phase 로드맵이다. 이전 버전(Action Layer 6-Phase 프레이밍)을 실제
> 구현 이력에 맞춰 대체한다 — Action Layer 중심 우선순위 원칙
> ([docs/development_rules.md](../docs/development_rules.md))은 유지되며,
> Phase 6~11이 그 우선순위(Intent → Action Router → Connector → Automation)를
> 그대로 반영한다.

**목표 버전 흐름**: `V_0.1.0`(Baseline, 현재) → `V_0.1.x` → `V_0.2.0` →
`V_0.5.0` → `V_1.0.0`

| 목표 버전 | 의미 |
|---|---|
| **V_0.1.0**(현재) | Baseline — Foundation/Auth/Dashboard/Calendar/Weather 검증 완료, Verification Report 2건씩(Backend/Frontend) 확보 |
| **V_0.1.x** | Baseline에서 발견된 P0/P1 수정(Weather 에러 노출, DB 마이그레이션 재현성, CORS/HTTPS) |
| **V_0.2.0** | Phase 6(Intent Engine) 착수 — 자연어 → 구조화 Intent 파이프라인 최초 구현 |
| **V_0.5.0** | Phase 7~10(Memory/Planner/Action Router/Connector 확장) 상당 부분 완료 — Action Layer 실사용 가능 |
| **V_1.0.0** | Phase 11(Automation/Workflow) 포함, Phase 12(Release Readiness) 체크리스트 전체 완료 — 정식 출시 |

---

## Phase 1 — Foundation

| 항목 | 내용 |
|---|---|
| **Status** | Done |
| **Progress** | 100% |
| **목표** | Backend(Fastify)/Frontend(Flutter) 프로젝트 스캐폴드, 공통 베이스 클래스 패턴, ICD v0.0 응답 envelope을 확립한다. |
| **관련 Requirement** | 없음(RDD 이전 시기 — 사후 대응 [action_requirements.md](../requirements/action_requirements.md) ACT-004/005) |
| **관련 Version** | [backend/V0.0.4](backend/V0.0.4.md), [frontend/V0.0.4](frontend/V0.0.4.md) |
| **완료 조건** | Fastify/Flutter 앱이 각각 부팅되고, 최소 1개 기능(Weather)이 종단으로 동작 — **충족됨**. |

## Phase 2 — Authentication

| 항목 | 내용 |
|---|---|
| **Status** | Done |
| **Progress** | 75% |
| **목표** | Google OAuth(ID Token + Redirect) 로그인, JWT 세션, Refresh Token rotation, 401 자동 재시도를 완성한다. |
| **관련 Requirement** | [system_requirements.md](../requirements/system_requirements.md) SYS-008, [connector_requirements.md](../requirements/connector_requirements.md) CON-006 |
| **관련 Version** | [backend/V0.0.{7,8,9,10,11}](backend/), [frontend/V0.0.{7,8,10,11}](frontend/) |
| **완료 조건** | ID Token/Redirect 로그인, 세션 복원, Refresh rotation, 로그아웃, 401 인터셉터 전부 실제 서버 실행으로 검증 — **대부분 충족**(Backend Schema Verification Report: Auth Compliant, 실서버 검증). 남은 것: Redirect 흐름의 대화형 Google 동의 화면 완료는 자동화 환경에서 검증 불가 — 사람이 실제 계정으로 1회 확인 필요. |

## Phase 3 — Dashboard

| 항목 | 내용 |
|---|---|
| **Status** | In Progress |
| **Progress** | 75%(핵심 위젯) / DSH-004·DSH-006은 0% |
| **목표** | AOD 3컬럼 태블릿 레이아웃과 핵심 위젯(Clock/Weather/Calendar/Brief/Chat/Sidebar/Status)을 완성한다. |
| **관련 Requirement** | [dashboard_requirements.md](../requirements/dashboard_requirements.md) DSH-001~008 |
| **관련 Version** | [backend/V0.0.4](backend/V0.0.4.md), [frontend/V0.0.{4,5}](frontend/) |
| **완료 조건** | 7개 핵심 위젯 렌더링(충족) + Todo Widget(DSH-004, 미착수) + Widget Visibility 토글(DSH-006, 미착수). |

## Phase 4 — Calendar

| 항목 | 내용 |
|---|---|
| **Status** | Done |
| **Progress** | 75% |
| **목표** | Google Calendar 연동(OAuth 동의, 조회 API, Frontend UI)을 완성한다. |
| **관련 Requirement** | [connector_requirements.md](../requirements/connector_requirements.md) CON-001, [requirements/domain_icd/calendar.md](../requirements/domain_icd/calendar.md) |
| **관련 Version** | [backend/V0.0.{13,15,17}](backend/), [frontend/V0.0.{12,13,15,17}](frontend/) |
| **완료 조건** | Backend Calendar API + Frontend UI + 에러 경로 실서버 검증 — **충족**. 실제 Google 계정으로 이벤트 데이터가 정확히 렌더링되는 happy-path 확인만 남음(자동화 환경 한계 — 사람이 1회 확인 필요, 두 Verification Report 공통 권고). |

## Phase 5 — Weather

| 항목 | 내용 |
|---|---|
| **Status** | Done(단, P0 결함 있음) |
| **Progress** | 75% |
| **목표** | OpenWeather 연동(현재 날씨, 5일 예보)을 완성한다. |
| **관련 Requirement** | [dashboard_requirements.md](../requirements/dashboard_requirements.md) DSH-002, [requirements/domain_icd/weather.md](../requirements/domain_icd/weather.md) |
| **관련 Version** | [backend/V0.0.4](backend/V0.0.4.md), [frontend/V0.0.6](frontend/V0.0.6.md) |
| **완료 조건** | API 연동 + 실데이터 렌더링(충족, 실 OpenWeather API로 검증) — **P0 결함**: `WeatherModule`에 에러 코드→사용자 메시지 매핑이 없어 실패 시 원시 예외 문자열이 노출됨(Frontend Schema Verification Report). V0.1.x에서 수정 필요. |

## Phase 6 — Intent Engine

| 항목 | 내용 |
|---|---|
| **Status** | Planned |
| **Progress** | 0% |
| **목표** | 자연어 메시지를 분류(Intent Classification) + 슬롯 추출하는 최소 파이프라인을 구현한다. |
| **관련 Requirement** | [intent_requirements.md](../requirements/intent_requirements.md) INT-001~005 |
| **관련 Version** | 없음 |
| **완료 조건** | `INT-001`(Intent Classification) 최소 구현 + 실제 메시지 1건이 Intent로 변환되는 것을 확인. |

## Phase 7 — Memory (RAG)

| 항목 | 내용 |
|---|---|
| **Status** | Planned |
| **Progress** | 0% |
| **목표** | Calendar/Notes 등 사용자 컨텍스트를 임베딩 기반으로 검색해 Intent/Planner 판단에 제공한다. |
| **관련 Requirement** | [memory_requirements.md](../requirements/memory_requirements.md) MEM-001~005 |
| **관련 Version** | 없음 |
| **완료 조건** | 최소 1개 벡터 스토어 연동 + Calendar Retrieval(MEM-001) 동작 확인. |

## Phase 8 — Planner

| 항목 | 내용 |
|---|---|
| **Status** | Planned |
| **Progress** | 0% |
| **목표** | 검증된 Intent를 여러 Action의 순서 있는 계획(의존성/조건/재시도/롤백)으로 변환한다. |
| **관련 Requirement** | [planner_requirements.md](../requirements/planner_requirements.md) PLN-001~005 |
| **관련 Version** | 없음 |
| **완료 조건** | `PLN-001`(Task Planning) 최소 구현. |

## Phase 9 — Action Router

| 항목 | 내용 |
|---|---|
| **Status** | Planned |
| **Progress** | 0% |
| **목표** | Planner/Intent 또는 직접 API 호출을 공통 Action Dispatcher로 라우팅하고 실행/검증/기록한다. |
| **관련 Requirement** | [action_requirements.md](../requirements/action_requirements.md) ACT-001~005(ACT-002/004/005는 라우트 단위로 이미 부분 구현 — 아래 Current Status 참고) |
| **관련 Version** | 없음(공용 Action Dispatcher 자체는 두 저장소 어디에도 없음 — Backend Schema Verification Report가 "no Action/Workflow dispatcher" 확인) |
| **완료 조건** | `POST /v1/actions/execute` 최소 스캐폴딩([docs/icd/action_layer_api.md](../docs/icd/action_layer_api.md)) 구현. |

## Phase 10 — Connector (확장)

| 항목 | 내용 |
|---|---|
| **Status** | Planned |
| **Progress** | 0%(Calendar 제외 — Calendar는 Phase 4로 별도 관리) |
| **목표** | Home Assistant, NAS, Notion 등 Calendar 외 커넥터를 추가한다. |
| **관련 Requirement** | [connector_requirements.md](../requirements/connector_requirements.md) CON-002/003/004/005 |
| **관련 Version** | 없음 |
| **완료 조건** | 최소 1개 신규 커넥터(Home Assistant, CON-002)가 실제 기기 제어에 성공. |

## Phase 11 — Automation (Workflow)

| 항목 | 내용 |
|---|---|
| **Status** | Planned |
| **Progress** | 0% |
| **목표** | 여러 Action을 조건/순서와 함께 조합해 실행하는 Workflow 엔진("퇴근 모드" 등). |
| **관련 Requirement** | [planner_requirements.md](../requirements/planner_requirements.md), [requirements/domain_icd/workflow.md](../requirements/domain_icd/workflow.md) |
| **관련 Version** | 없음 |
| **완료 조건** | 2개 이상 Tool(Phase 4, 10)이 먼저 완료된 후, 최소 1개 Workflow가 다단계 실행에 성공. |

## Phase 12 — V1.0 Release

| 항목 | 내용 |
|---|---|
| **Status** | In Progress |
| **Progress** | 25% |
| **목표** | `V_1.0.0` 출시 전 비-기능 요구사항(DB 재현성, CORS/HTTPS, 테스트, 법률 검토)을 완료한다. |
| **관련 Requirement** | 없음(체크리스트 관리 — [docs/workflow.md](../docs/workflow.md) 출시 전 체크리스트) |
| **관련 Version** | [backend/V0.1.0](backend/V0.1.0.md), [frontend/V0.1.0](frontend/V0.1.0.md) |
| **완료 조건** | DB 마이그레이션 전체 재현 가능(현재 7개 중 2개만 가능), CORS allow-list 적용(현재 전체 개방), HTTPS/HSTS 확정 문서화, 자동 테스트 도입(현재 0), Privacy Policy/Terms 법률 검토 완료. |

## 관련 문서

- [phase_status.md](phase_status.md) — Phase별 Status/Progress 표 + Version 연결
- [current_status.md](current_status.md) — Executive Summary, Risk, TODO
- [../requirements/domain_icd/domain_analysis.md](../requirements/domain_icd/domain_analysis.md) — Domain별 MVP 우선순위 원본 분석
