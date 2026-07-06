# Development Documents

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
