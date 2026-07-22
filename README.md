# Development Documents

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

이 디렉터리는 **프로젝트 구현(Implementation)에 대한 개발 문서**를 관리합니다.

공통 설계 문서는 저장하지 않습니다.

공통 설계, 아키텍처, ICD, 개발 컨셉은 Repository 루트의 **`docs/`**(Git Submodule: LetMeKnow-Docs)에서 관리합니다.

---

## 목적

이 문서는 현재 Repository의 구현 내용을 기록하기 위한 것입니다.

예를 들어 다음과 같은 내용을 포함합니다.

* UI 구현 구조
* Widget 설계
* 화면(Screen) 설명
* State Management
* Service 구조
* Route 구현
* Plugin 구현
* 구현 세부사항
* 개발 진행 현황

---

## 문서 작성 원칙

### 이곳(devdocs)에 작성하는 내용

* 현재 Repository에서만 사용하는 구현 내용
* 코드 구조
* 화면 구성
* 클래스 설명
* 구현 방식
* TODO
* 개발 메모

### `docs/`(공통 문서)에 작성하는 내용

* 시스템 아키텍처
* API Gateway ICD
* Database ICD
* 개발 컨셉
* Connector 설계
* ADR(Architecture Decision Record)
* AI 구조
* 공통 Sequence Diagram
* 공통 Mermaid Diagram

---

## Claude Code 규칙

Claude는 작업 전에 다음 순서로 문서를 참고합니다.

1. `docs/CLAUDE.md`
2. Repository 루트의 `CLAUDE.md`
3. `devdocs/FeatureList.md`
4. `devdocs/DevelopmentGuide.md`

필요한 경우에만 `docs/`의 세부 문서를 추가로 참조합니다.

---

## 디렉터리 예시

```text
devdocs/
├── README.md
├── DevelopmentGuide.md
├── FeatureList.md
├── ui/
├── widgets/
├── screens/
├── state/
├── services/
├── routes/
├── database/
└── deployment/
```

프로젝트 특성에 따라 하위 디렉터리는 자유롭게 추가하거나 제거할 수 있습니다.

---

## 유지보수 규칙

새로운 기능을 개발하거나 기존 기능을 변경한 경우 다음 순서를 따릅니다.

1. 코드 수정
2. 관련 `devdocs` 문서 업데이트
3. 공통 설계 변경 여부 확인
4. 공통 설계 변경이 필요한 경우 `LetMeKnow-Docs` 저장소(`docs/`)를 수정

항상 **구현 문서와 코드가 동일한 상태**를 유지하는 것을 원칙으로 합니다.
