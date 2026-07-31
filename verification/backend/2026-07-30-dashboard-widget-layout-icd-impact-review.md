# Dashboard/Widget/Layout ICD Impact Review (Backend)

## 변경 목적

2026-07-30 `requirements/domain_icd/dashboard.md` 확장(WidgetVariant /
WidgetMetadata / LayoutConstraint / LayoutDirective 추가) 및 신규 Requirement
(DSH-009/DSH-010/DSH-011, PLN-006)이 Backend 계약(API ICD, DB Schema)에
영향을 주는지 확인한다 — [docs/workflow.md](../../docs/workflow.md) Step 0
(Domain Freeze)의 "API ICD 확인 / DB Schema 확인" 항목에 대응하는 리뷰다.

## 변경 파일

DevDocs 쪽 변경 없음 — Backend 소스 저장소(`jdukmin/lingon`)를 실제로 검토한
결과다. Backend 소스 파일도 변경되지 않았다(리뷰만 수행, 구현 없음). Backend
쪽에서 로컬 `docs/`(LingOnDevDocs submodule) 포인터를 `origin/V_0.1` 최신
커밋(`ea8b497`, `e6186b5`)으로 fast-forward한 것이 유일한 로컬 변경이며,
Backend 저장소 자체에는 아직 커밋되지 않았다(아래 "남은 문제" 참고).

## 영향 분석

- `src/route/`, `src/gateway/`, `src/db/`, `migrations/` 전체에 Dashboard·
  Widget·Module·Layout 관련 route, table, migration이 없다.
- `src/` 내 "widget/module/layout" 문자열 검색 결과는 전부 무관하다(ESM 모듈
  boilerplate 주석 — `pool.ts`, `FastifyDefinition.ts`, `env.ts` — 및
  `LingOnSettings.ts:24`의 frontend 문서(`SidebarWidget.md`) 교차 참조 1건뿐).
- Backend가 관리하는 `docs/backend/docs/FeatureList.md`(구현 완료 엔드포인트
  19개 목록) 중 Dashboard 관련 항목이 없다.
- 이는 드리프트가 아니라 예상된 결과다 —
  [requirements/domain_icd/dashboard.md](../../requirements/domain_icd/dashboard.md)는
  2026-07-30 변경 전후로 동일하게 **"Backend: (직접 대응 없음 — Dashboard는
  순수 Frontend 개념)"**이라고 명시해 왔다.
- 신규 Entity(WidgetVariant / WidgetMetadata / LayoutConstraint)는 Flutter
  측 렌더링/선택 개념(같은 Widget이 화면에서 어떤 형태로 보일지)이며 REST/DB
  대상이 아니다.
- `LayoutDirective`는 Planner Layer([planner_requirements.md](../../requirements/planner_requirements.md)
  PLN-006, Planned/0%, 코드·문서 근거 없음)에 의해 게이팅되어 있고, 이번
  리뷰 범위에서 Planner/LLM 기반 자동 레이아웃 구현은 명시적으로 제외
  대상이다.
- API ICD(`backend/docs/api/`) 재사용 대상 없음, [docs/icd/api_comparison.md](../../docs/icd/api_comparison.md)에
  Dashboard 항목 없음 — Wrap 대상 아님.
- DB Schema(`backend/docs/database/`)에 필요한 신규 테이블 없음 — Migration
  불필요.

## 테스트 결과

구현 대상이 없어 "테스트"할 대상도 없다. 대신 실제 Backend 소스 저장소
(`jdukmin/lingon`)를 정적 검토(소스 전체 grep + `FeatureList.md` 대조)한
결과만 기록한다 — Mock이 아니라 실제 소스 코드를 확인한 결과다. 서버 실행 ·
DB 저장 · API 응답 검증은 구현 자체가 없으므로 해당 사항 없음.

## 남은 문제

- Backend 저장소 쪽 `docs/`(LingOnDevDocs) submodule 포인터가
  `origin/V_0.1`(`ea8b497`, `e6186b5`)로 fast-forward됐으나, Backend
  저장소 자체에는 아직 커밋되지 않았다. Backend 저장소에서 이 submodule
  포인터 bump를 커밋할지는 **이 저장소(DevDocs)의 범위 밖**이다 — 사용자가
  Backend 저장소 쪽에서 직접 확인·커밋해야 한다.
- Planner Layer(PLN-006)가 실제로 착수되면 그 시점에 Domain Model/DTO
  Validation/API Contract Test가 필요하다 — 지금은 해당 없음.

## References

- [requirements/domain_icd/dashboard.md](../../requirements/domain_icd/dashboard.md)
- [requirements/dashboard_requirements.md](../../requirements/dashboard_requirements.md) DSH-009/DSH-010/DSH-011
- [requirements/planner_requirements.md](../../requirements/planner_requirements.md) PLN-006
