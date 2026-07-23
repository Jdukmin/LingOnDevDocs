# Verification Reports

Governed by [../CLAUDE.md](../CLAUDE.md) "Verification Report Rule". Store
reports under [backend/](backend/) or [frontend/](frontend/) depending on
which component's change is being verified. For a change that touches both,
write both, or write one under `backend/` and cross-link it from a matching
file under `frontend/`.

## Filename

`<YYYY-MM-DD>-<주제>.md` — e.g. `2026-08-01-weather-action.md`.

## Required sections

Every report must include all five:

```markdown
# <제목>

## 변경 목적

## 변경 파일

## 영향 분석

## 테스트 결과

## 남은 문제
```

## Rule

Mock 결과를 성공으로 보고하지 않는다. "테스트 결과"는 실제 서버 실행, 실제
DB 저장, 실제 API 응답, 실제 Flutter 동작 중 실제로 확인된 것만 기록한다
(`docs/workflow.md` "Real Execution Only" 원칙과 동일).

This repository itself has no source code to execute — verification against
actual running backend/frontend code happens in those repositories. Reports
placed here summarize that verification for the docs SSOT; they are not
produced by reading this repository alone.
