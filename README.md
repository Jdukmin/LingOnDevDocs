# Development Documents

> **Claude 작업 지침**: [CLAUDE.md](CLAUDE.md) — Claude Code/Claude Web이 이
> 저장소에서 작업할 때 따르는 실행 지침(Context Loading, ICD Rule,
> Verification Report, Version/ChangeLog, Commit 규칙). 사람이 아니라
> Claude를 위한 문서다.

> **DevDocs SSOT Verification Report**: [DEVDOCS_SSOT_VERIFICATION_REPORT.md](DEVDOCS_SSOT_VERIFICATION_REPORT.md) —
> 2026-07-23 전체 DevDocs 감사 결과(수정 문서, 해결된 충돌, Backend/Frontend
> 영향, 우선순위별 잔여 TODO).

## 개발 SOP

[docs/workflow.md](docs/workflow.md) — **LingOn AI Development Workflow**.
모든 기능 개발이 따라야 할 표준 절차(Step 0~6: Domain Freeze → Backend
개발/검증 → Frontend 개발/검증 → 통합 검증 → 문서 갱신), MVP Phase 순서,
출시 전 체크리스트, AI 조직 운영 구조를 정의한다. **새 기능을 시작하기 전
가장 먼저 읽는 문서.** 출시 전 체크리스트의 세부 정책/절차는
[docs/policies/](docs/policies/)(Error/Logging/Security/Privacy)와
[docs/ops/](docs/ops/)(Deployment/Data SOP, Monitoring)에 있다.

## 제품 전략 (Why)

[docs/](docs/)는 **구현(How)이 아니라 왜(Why)**를 기록하는 최상위 전략 문서다
(`strategy/`, `roadmap/`, `decisions/`, `development_rules.md`). 모든 신규 기능은
이 디렉터리의 우선순위("Dashboard가 아니라 Action Layer가 제품이다")를 먼저
따른 뒤 [requirements/](requirements/)에서 Requirement로 구체화한다.
시작점: [docs/strategy/product.md](docs/strategy/product.md), [docs/development_rules.md](docs/development_rules.md).
Action Layer 중심으로 재검토된 신규 ICD 제안은 [docs/icd/README.md](docs/icd/README.md)에 있다
(기존 `backend/docs`, `frontend/docs`의 API/인터페이스 문서는 삭제·변경 없이 유지된다).

```
docs/strategy/            → 왜 (제품 전략)
requirements/domain_icd/  → 무엇의 계약을 지켜야 하는가 (Domain ICD)
requirements/*_requirements.md → 무엇을 (Requirement, RDD)
docs/icd/, backend/docs, frontend/docs → 어떻게 (API/구현)
```

## Requirements (RDD) & Domain ICD

[requirements/](requirements/)에 시스템 전체 Requirement(System/Layer Requirement,
Status/Progress 규칙, Traceability)를 관리한다. 새 기능은 반드시 이 디렉터리의
Requirement를 먼저 확인/작성한 뒤 구현한다. 시작점: [requirements/README.md](requirements/README.md).
API/State/DB보다 상위에서 도메인 간 계약을 정의하는 **Domain ICD**는
[requirements/domain_icd/README.md](requirements/domain_icd/README.md)에 있다 — Backend/Frontend는
API가 아니라 이 계약을 기준으로 구현한다.

## 문서 포털 (검색 · 라우팅)

`backend/docs`, `frontend/docs`의 모든 문서를 브라우저에서 검색하고 탐색할 수 있는
정적 포털이 저장소 루트에 포함되어 있습니다. 기존 문서 파일은 전혀 수정하지 않고,
`index.html`이 그 위에서 목차/검색/렌더링만 담당합니다.

```bash
node serve.js          # http://localhost:4321 (기본 포트) 에서 서버 실행
# 포트를 바꾸려면: node serve.js 5000
```

브라우저에서 `file://`로 `index.html`을 직접 열면 각 문서를 fetch하지 못하므로
(브라우저의 CORS 정책) 반드시 위 명령으로 로컬 서버를 띄운 뒤 접속해야 합니다.

문서를 추가/삭제/이동한 뒤에는 검색 색인을 갱신하세요.

```bash
node scripts/build-manifest.js
```

구성 파일: [index.html](index.html), [assets/app.js](assets/app.js), [assets/style.css](assets/style.css),
[assets/manifest.json](assets/manifest.json)(자동 생성), [scripts/build-manifest.js](scripts/build-manifest.js), [serve.js](serve.js)

---

## Claude Code 규칙

Claude는 작업 전에 다음 순서로 문서를 참고합니다.

1. `docs/workflow.md` — 모든 기능 개발이 따라야 할 SOP(Step 0~6)
2. `requirements/README.md` — Requirement 작성/추적 규칙(RDD)
3. `backend/docs/FeatureList.md`, `frontend/docs/FeatureList.md` — 각 구현체의 현재 상태(단일 출처)
4. `backend/docs/DevelopmentGuide.md`, `frontend/docs/DevelopmentGuide.md` — 구현 컨벤션

> **참고**: 일부 오래된 문서가 `CLAUDE.md`(루트 또는 `docs/`)를 참조하지만, 이
> 파일은 이 문서 미러 저장소(`LingOnDevDocs`)에는 포함되어 있지 않다 — 실제
> 소스 저장소(backend/frontend)의 루트에 존재하는 파일이다. 필요한 경우에만
> `docs/`의 세부 문서를 추가로 참조한다.

---

## 저장소 구조

이 저장소(`LingOnDevDocs`)는 backend/frontend 소스 저장소와 공통 설계
저장소(`LetMeKnow-Docs`)의 **문서만** 한곳에 모은 미러다 — 소스 코드는
포함하지 않는다([requirements/README.md](requirements/README.md) 참고).

```text
requirements/       → Requirement(RDD) + Domain ICD — "무엇을/무엇의 계약을"
docs/                → 제품 전략/로드맵/정책/운영 SOP + Action Layer ICD 제안 — "왜/어떻게(신규)"
backend/docs/        → Backend 구현 문서(API, DB, Plugin, Service, Route) — "어떻게(기존)"
frontend/docs/       → Frontend 구현 문서(UI, Widget, State, Service, Theme) — "어떻게(기존)"
README.md, index.html, assets/, scripts/, serve.js → 이 문서 포털 자체
```

## 유지보수 규칙

새로운 기능을 개발하거나 기존 기능을 변경한 경우 [docs/workflow.md](docs/workflow.md)의
Step 0~6을 따릅니다(요약: Domain Freeze → Backend 개발/검증 → Frontend
개발/검증 → 통합 검증 → 문서 갱신). 공통 설계(Domain ICD, API ICD, 정책)
변경이 필요한 경우 [requirements/domain_icd/](requirements/domain_icd/),
[docs/icd/](docs/icd/), [docs/policies/](docs/policies/)를 먼저 갱신한 뒤에만
구현을 시작합니다 — 구현에 맞춰 문서를 조용히 고치지 않습니다
([docs/workflow.md](docs/workflow.md) "ICD 변경 관리 규칙").

항상 **구현 문서와 코드가 동일한 상태**를 유지하는 것을 원칙으로 합니다.
