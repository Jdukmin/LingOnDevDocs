# Dashboard Integration Verification

> **Status**: Proposed · **Progress**: N/A(방법론 문서) · **Last Updated**: 2026-07-30 · **Owner**: Frontend/UX

Frontend↔Backend 통합 지점에 대한 **경량 개발자 검증** 템플릿이다. 자동화 UI
테스트 프레임워크, 기기 인증 프로세스, Accessibility QA, 외부 QA 프로세스,
CI 테스트 파이프라인은 이 문서의 범위가 아니다 — 현재 프로젝트 단계에서
필요하지 않다.

## Purpose

Release 전에 개발자가 직접 확인해야 하는 Frontend/Backend 통합 지점을
정의한다. Dashboard/Widget/Layout 기능이 실제 Backend 데이터와 올바르게
연동되는지 확인하는 것이 목적이며, Widget의 시각적 렌더링 품질(정보 밀도,
overflow 등) 자체는 다루지 않는다 — 그건 Frontend 저장소 쪽 Widget 테스트의
몫이다.

## Test Scope

Frontend↔Backend 통합 지점만. 범위 밖: UI 렌더링 세부, Accessibility,
Device 인증, Planner/LLM 기반 자동 레이아웃(PLN-006 착수 전까지 해당 없음).

## Test Environment

실제 Backend 서버(로컬 또는 스테이징) + 실제 Frontend 빌드. Mock 서버로
대체하지 않는다 — [CLAUDE.md](../../CLAUDE.md) Verification Report Rule과
동일한 원칙("Mock 결과를 성공으로 보고하지 않는다").

## Test Types

| Category | 목적 |
|---|---|
| Dashboard Loading | Frontend가 대시보드를 로드하고, 필요한 Backend 데이터가 준비되며, Empty State가 올바르게 처리되는지 |
| Widget Data Binding | Backend 응답 → Module 상태 갱신 → Widget 렌더링이 순서대로 이어지는지 |
| Widget Interaction | 사용자 상호작용 → Frontend 상태 변경 → (필요 시) Backend 요청까지 이어지는지 |
| Error Handling | Backend 불가용 / 잘못된 데이터 / Timeout / 빈 응답 각각이 사용자에게 안전한 상태로 표시되는지(원시 예외 노출 금지 — `docs/policies/error_policy.md`) |
| Version Compatibility | `version/frontend.json` + `version/backend.json` + API Contract가 서로 호환되는지 |

## Test Execution Method

아래 "Test Procedure Documentation" 템플릿으로 각 절차를 실행하고, Actual
Result/Evidence를 실제 실행 결과로 채운다. 절차 실행 전 코드 리뷰만으로
Pass 처리하지 않는다.

## Pass/Fail Criteria

Expected Result와 Actual Result가 정확히 일치하고 Evidence(실제 로그/응답/
스크린샷)가 첨부되어야 Pass다. Evidence 없는 Pass는 인정하지 않는다.

## Evidence Collection

실제 HTTP 요청/응답 로그, 실제 앱 실행 로그 또는 스크린샷, `flutter
analyze`/`flutter test` 실제 출력 중 해당하는 것을 첨부한다. 이 저장소
(DevDocs)는 소스 코드가 없는 문서 전용 미러이므로, Evidence는 항상 Frontend/
Backend 소스 저장소 쪽에서 실행한 결과를 가져와야 한다.

---

## Test Procedure Template

```
## Test ID

## Purpose

## Preconditions

## Environment

## Execution Steps

## Expected Result

## Actual Result

## Evidence
```

## Initial Test Procedures (Draft)

아래는 각 Category별 최소 1개씩 정의한 초기 절차다. Actual Result/Evidence는
실제 실행 후에만 채운다 — 지금은 미실행 상태(Draft)다.

### DSH-INT-LOAD-001 — Dashboard Initial Loading

- **Purpose**: 앱 시작 시 Dashboard가 Backend 데이터를 정상적으로 로드하는지 확인
- **Preconditions**: 로그인 완료, Backend 서버 정상 기동
- **Environment**: 실제 Backend(로컬/스테이징) + 실제 Frontend 빌드
- **Execution Steps**: 1) 앱 실행 2) 로그인 세션 복원 대기 3) AodDisplay 진입 관찰
- **Expected Result**: Clock/Weather/Calendar/Brief/Status 위젯이 각자의 Backend 데이터로 채워짐(Empty/Loading 상태를 거쳐 Populated로 전이)
- **Actual Result**: *(미실행)*
- **Evidence**: *(미실행)*

### DSH-INT-BIND-001 — Weather Widget Data Binding

- **Purpose**: Backend `GET /v1/weather/current` 응답이 WeatherModule → WeatherNowWidget까지 정확히 반영되는지 확인
- **Preconditions**: OpenWeather 연동 정상
- **Environment**: 실제 Backend + 실제 Frontend
- **Execution Steps**: 1) Weather 위젯 로드 2) 실제 API 응답값과 화면 표시값 대조
- **Expected Result**: 온도/체감온도/습도 등이 API 응답과 일치
- **Actual Result**: *(미실행)*
- **Evidence**: *(미실행)*

### DSH-INT-INTERACT-001 — Sidebar Toggle Interaction

- **Purpose**: 사용자 상호작용(사이드바 열기)이 Frontend 상태 변경으로 이어지는지 확인(이 절차는 Backend 요청이 필요 없는 케이스)
- **Preconditions**: 앱 정상 기동
- **Environment**: 실제 Frontend
- **Execution Steps**: 1) 사이드바 버튼 탭 2) 슬라이드인 애니메이션/상태 확인
- **Expected Result**: `_sidebarOpen` 상태 변경, SidebarWidget 표시
- **Actual Result**: *(미실행)*
- **Evidence**: *(미실행)*

### DSH-INT-ERROR-001 — Weather Backend Unavailable

- **Purpose**: Backend/OpenWeather 장애 시 원시 예외가 아니라 사용자 안전 메시지가 표시되는지 확인
- **Preconditions**: Backend 또는 OpenWeather 응답을 의도적으로 실패시킬 수 있는 환경
- **Environment**: 실제 Backend(장애 상황 재현) + 실제 Frontend
- **Execution Steps**: 1) Backend/OpenWeather 실패 유도 2) Weather 위젯 상태 관찰
- **Expected Result**: `error.code` → 사용자 메시지 매핑 표시(원시 `RouteException.toString()` 노출 금지)
- **Actual Result**: *(미실행 — 현재 알려진 P0 결함: 이 매핑이 없어 원시 예외가 노출됨. 근거: `frontend/docs/FeatureList.md` P0 기록, `status/current_status.md`)*
- **Evidence**: *(미실행)*

### DSH-INT-VERSION-001 — Frontend/Backend/API Version Compatibility

- **Purpose**: 배포 전 3개 버전(Frontend/Backend/API Contract)이 서로 호환되는지 확인
- **Preconditions**: 없음
- **Environment**: `version/frontend.json`, `version/backend.json`, `backend/docs/api/` 문서 대조
- **Execution Steps**: 1) 세 버전/계약 문서를 나란히 확인 2) API Contract 변경이 있었다면 두 컴포넌트 버전에 모두 반영됐는지 확인
- **Expected Result**: 불일치 없음
- **Actual Result**: *(미실행)*
- **Evidence**: *(미실행)*

## References

- [requirements/domain_icd/dashboard.md](../../requirements/domain_icd/dashboard.md)
- [requirements/dashboard_requirements.md](../../requirements/dashboard_requirements.md) DSH-009~012
- [docs/policies/error_policy.md](../policies/error_policy.md)
- [CLAUDE.md](../../CLAUDE.md) Verification Report Rule
