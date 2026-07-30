# CLAUDE.md

Instructions for Claude (Claude Code, Claude Web) operating in this
repository. Not a human guide. Follow these rules literally.

## 역할

This repository (`LingOnDevDocs`) is the **Source of Truth (SSOT)** for the
LingOn system:

- Architecture
- API Contract
- Database Contract
- Authentication Flow
- Backend/Frontend Interface
- ICD (Domain ICD, API ICD, Action ICD)
- Verification Report
- Version
- Change History

Backend and Frontend source repositories reference this repository. They do
not own these contracts.

**Never modify source code from this repository.** This repository contains
no `src/` tree — only documentation. If a task requires changing source
code, state that explicitly and stop; do not attempt it here.

Do not restructure existing directories (`backend/docs/`, `frontend/docs/`,
`requirements/`, `docs/`) unless the user explicitly asks. Add to them; do
not reorganize them as a side effect of another task.

## Context Loading Rule

Do not read the entire repository for every task. Read only what the task
requires.

| Task | Read |
|---|---|
| API 계약 확인/변경 | `backend/docs/api/`, `docs/icd/action_layer_api.md`, `docs/icd/api_comparison.md` |
| Database | `backend/docs/database/` |
| Authentication / OAuth | `backend/docs/api/auth.md`, `backend/docs/plugins/google-oauth.md`, `backend/docs/plugins/policy.md`, `docs/policies/security_policy.md` |
| Domain 계약(비즈니스 규칙) | `requirements/domain_icd/` |
| Requirement / 진행률 | `requirements/README.md`, `requirements/*_requirements.md` |
| Backend 구현 문서 | `backend/docs/` (routes/, services/, plugins/, deployment/) |
| Frontend 구현 문서 | `frontend/docs/` (services/, state/, ui/, widgets/) |
| 제품 전략/우선순위 | `docs/strategy/`, `docs/roadmap/`, `docs/decisions/` |
| 개발 절차(SOP) | `docs/workflow.md` |
| Error/Logging/Security/Privacy 정책 | `docs/policies/` |
| 배포/운영 | `docs/ops/` |
| 검증 결과 | `verification/backend/`, `verification/frontend/` |
| Version | `version/backend.json`, `version/frontend.json`, `version/system.json` |
| Change History | `changelog/backend.md`, `changelog/frontend.md`, `changelog/system.md` |

If the task touches Domain/API/Action ICD, read `docs/workflow.md` Step 0
(Domain Freeze) before anything else.

## ICD Rule

API 변경 시 아래 4단계를 **반드시 이 순서로** 수행한다:

1. **ICD 영향 분석** — 영향받는 문서 식별: Domain ICD(`requirements/domain_icd/`),
   API ICD(`backend/docs/api/`), Action ICD(`docs/icd/action_layer_api.md`).
2. **ICD 업데이트** — 위 문서를 갱신한다. 구현에 맞춰 조용히 고치지 않는다 —
   ICD가 구현과 달라야 하는 이유를 먼저 남긴다(`docs/workflow.md` Step 6).
3. **Version 변경** — 아래 "Version 관리" 규칙에 따라 해당 컴포넌트의
   `version/*.json`을 올린다.
4. **ChangeLog 작성** — 대응하는 `changelog/*.md`에 항목을 추가한다.

Domain ICD가 없는 기능은 구현을 진행하지 않는다 — 먼저 ICD 부재를 알리고
`requirements/domain_icd/README.md` 형식에 맞춰 작성을 제안한다.

## Verification Report Rule

위치: `verification/backend/`, `verification/frontend/`

파일명: `<YYYY-MM-DD>-<주제>.md`

Report 필수 포함 항목:
- 변경 목적
- 변경 파일
- 영향 분석
- 테스트 결과
- 남은 문제

Mock 결과를 성공으로 보고하지 않는다. 실제 실행/응답/저장을 확인한 결과만
"테스트 결과"로 기록한다.

## Version 관리

파일: `version/backend.json`, `version/frontend.json`, `version/system.json`

버전이 오를 때마다 **끝자리(Patch)만 1씩 올린다**: `V_0.1.0` → `V_0.1.1` →
`V_0.1.2` → ... (2026-07-30 변경, 사용자 지시). Major/Minor 자리는 사용자가
명시적으로 지시할 때만 올린다 — Breaking Change/Feature 추가 여부로 자동
판단하지 않는다.

API/DB/ICD를 변경하면 해당 컴포넌트의 version을 반드시 올린다. 문서만
바뀌고 계약이 바뀌지 않았다면 version을 올리지 않는다.

## ChangeLog

파일: `changelog/backend.md`, `changelog/frontend.md`, `changelog/system.md`

형식:

```
## [x.y.z] - YYYY-MM-DD
- 변경 내용
```

Version을 올릴 때마다 대응하는 ChangeLog 항목을 함께 추가한다 — 둘 중
하나만 하지 않는다.

## Commit Rule

형식: `type(scope): summary`

| Type | 용도 |
|---|---|
| `feat:` | 기능 추가 |
| `fix:` | 버그 수정 |
| `refactor:` | 동작 변경 없는 구조 개선 |
| `docs:` | 문서만 변경 |
| `test:` | 테스트만 추가/변경 |

Scope 예: `api`, `domain`, `workflow`, `policy`, `changelog`.

기존 커밋 로그의 `V_0.0.x: ...` 형식은 이 규칙 이전의 것이다 — 과거 커밋을
소급 변경하지 않는다. 새 커밋부터 이 규칙을 적용한다.

## Claude Web 대응

이 문서는 사람이 읽는 설명서가 아니라 Claude 실행 지침이다.

- 새 규칙을 추가할 때 서술형 문장을 쓰지 않는다. 명령형으로 쓴다.
- 배경 설명·예시는 표로 압축한다. 문단으로 늘어놓지 않는다.
- 이 문서에 없는 규칙을 추론해서 따르지 않는다 — 없으면 사용자에게 확인한다.

## 관련 문서

- [docs/workflow.md](docs/workflow.md) — 전체 개발 SOP(Step 0~6, Phase 0~10)
- [requirements/domain_icd/README.md](requirements/domain_icd/README.md) — Domain ICD 목록
- [docs/icd/README.md](docs/icd/README.md) — API/Action ICD
- [requirements/README.md](requirements/README.md) — Requirement RDD 규칙
