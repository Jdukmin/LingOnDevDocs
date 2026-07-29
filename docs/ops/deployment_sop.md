# Deployment SOP — Release / Deployment / Rollback / Versioning

> **Status**: Not Started(절차 미수립) · **Progress**: 0% · **Last Updated**: 2026-07-22 · **Next Milestone**: Phase 1(Weather Action) 첫 배포 전 이 문서의 최소 버전을 실제로 확정

이 저장소에는 현재 배포 파이프라인 자체가 없다 — 이 문서는 무엇을
정의해야 하는지에 대한 뼈대이며, 실제 CI/CD 도구·환경이 정해지는 대로
구체화한다.

---

## Versioning Rule

| 대상 | 규칙(제안) |
|---|---|
| Backend API | ICD v0.0 envelope 자체는 유지, Action Type 스키마는 추가만 허용(하위 호환) — [docs/icd/action_layer_api.md](../icd/action_layer_api.md) "버전/호환성" 절과 동일 원칙 |
| 앱(Flutter) | Semantic Versioning(`MAJOR.MINOR.PATCH`) — 기존 커밋 로그의 `V_0.0.x` 표기와 정합성 확인 필요 |
| Domain ICD 문서 | `0.x.0-draft` → 검토·승인 후 `1.0.0`로 전환(현재 전부 `0.1.0-draft`/`0.2.0-draft`) |

## Release SOP (제안 — 미수립)

1. `docs/workflow.md` Step 5(Integration Verification) 통과
2. Release 대상 기능의 Requirement Status가 `Done`인지 확인([requirements/README.md](../../requirements/README.md))
3. Release Note 작성(무엇이 바뀌었는지, Breaking Change 여부)
4. 버전 태그 발행

**현재 없음**: Release Note 템플릿, 승인권자(사용자 승인 — [docs/workflow.md](../workflow.md) "AI 조직 운영 구조" 참고), Release 주기.

## Deployment SOP (제안 — 미수립)

**현재 없음**: 배포 대상 환경(Staging/Production 분리 여부), 컨테이너화
여부, 배포 자동화(CI/CD) 도구, 무중단 배포 방식. [docs/workflow.md](../workflow.md)
출시 전 체크리스트 "Infrastructure"와 직결된 공백이다.

## Rollback SOP (제안 — 미수립)

| 상황 | 대응(제안) |
|---|---|
| 배포 직후 에러율 급증 | 이전 버전으로 즉시 롤백(자동 감지 기준 미정 — [monitoring.md](monitoring.md) Alert 정의 후 확정) |
| DB Migration이 포함된 배포의 롤백 | [data_sop.md](data_sop.md) Migration 절 — **Migration 자체가 아직 없어 롤백 스크립트도 없음** |
| Action Layer 배포 후 특정 Action Type 오작동 | 해당 Action Type만 `GET /v1/actions/types`에서 비활성화(연결 해제 아님, 카탈로그 노출만 중단) — Action Layer 구현 후 설계 |

**현재 없음**: 자동 롤백 트리거, 롤백 소요시간 목표(RTO).

## 관련 문서

- [data_sop.md](data_sop.md) — Migration/Backup/Restore
- [monitoring.md](monitoring.md) — 배포 후 상태 확인
- [../workflow.md](../workflow.md) — 출시 전 체크리스트, Step 6(Documentation Update)과의 관계

---

# Change Log

- **2026-07-22** — 최초 작성(뼈대만 — 실제 절차는 대부분 미수립 상태를 그대로 기록). Docs Revision(SSOT 정리) 작업의 일부.
