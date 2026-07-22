# Data SOP — Migration / Backup / Restore

> **Status**: Not Started · **Progress**: 0% · **Last Updated**: 2026-07-22 · **Next Milestone**: 첫 Migration 파일 생성 시 이 문서의 Migration 절차를 실제로 적용

---

## Migration

**현재 상태**: `backend/docs/database/README.md`가 명시하듯, 이 저장소에는
**마이그레이션 파일 자체가 없다** — 모든 테이블 스키마는 `src/db/*.ts`의
쿼리에서 역으로 추론된 것이다. `database/users.md`가 참조하는
`migrations/001_rename_provider_sub_to_provider_id.sql` 등 파일 경로가
문서에 등장하지만, 이 저장소(`LingOnDevDocs`)에는 해당 파일이 없다(실제
backend 저장소에만 존재할 가능성 — **확인 필요**).

**절차(제안)**:

1. 모든 스키마 변경은 순번이 매겨진 `.sql` 파일로 작성(기존 네이밍 패턴
   `NNN_설명.sql` 유지 — `database/users.md` 참고)
2. 각 Migration은 `UP`/`DOWN`(또는 별도 rollback 스크립트) 모두 작성
3. `docs/workflow.md` Step 0(Domain Freeze)에서 DB Schema 변경 여부를 먼저
   확인한 뒤에만 Migration을 작성
4. Migration 적용 후 `backend/docs/database/<table>.md`를 함께 갱신(Step 6
   Documentation Update)

## Backup

**현재 상태**: 없음. NAS Domain([nas.md](../../requirements/domain_icd/nas.md))은
**사용자의** NAS 백업을 다루지만, 서비스 자체 Postgres DB의 백업 계획은
문서 어디에도 없다.

**절차(제안 — 미수립)**:

| 항목 | 결정 필요 |
|---|---|
| 백업 주기 | 일/시간 단위 미정 |
| 백업 대상 | 전체 DB vs 특정 테이블(예: `user_api_keys`, `refresh_tokens`처럼 민감한 테이블 우선) |
| 백업 저장 위치 | 미정(호스팅 제공자 자동 백업 vs 별도 스토리지) |
| 암호화 | 백업 파일 자체의 암호화 여부 미정 — [security_policy.md](../policies/security_policy.md)와 연계 필요 |

## Restore

**현재 상태**: 없음(Backup이 없으므로 Restore 절차도 정의 불가).

**절차(제안 — 미수립)**:

1. 최신 백업 시점 확인
2. Restore 대상 환경 격리(Production에 직접 복원하지 않고 별도 검증 후 전환)
3. Restore 후 데이터 정합성 확인(특히 암호화된 컬럼 — `MASTER_ENCRYPTION_KEY`가
   백업 시점과 동일한지 확인, 키가 바뀌었다면 복호화 불가)

## 관련 문서

- [deployment_sop.md](deployment_sop.md) — Migration이 포함된 배포의 Rollback
- [../policies/security_policy.md](../policies/security_policy.md) — 암호화 키 관리
- [../workflow.md](../workflow.md) — 출시 전 체크리스트 Database 항목

---

# Change Log

- **2026-07-22** — 최초 작성(대부분 "미수립" 상태를 그대로 기록). Docs Revision(SSOT 정리) 작업의 일부.
