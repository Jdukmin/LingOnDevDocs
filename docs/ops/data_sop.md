# Data SOP — Migration / Backup / Restore

> **Status**: Partially documented(Migration은 실제 존재·검증됨 및 forward-only 정책으로 문서화됨, Backup/Restore는 Not Started) · **Progress**: 33%(Migration/Backup/Restore 3개 축 중 Migration 1개만 확정) · **Last Updated**: 2026-09-14 · **Next Milestone**: DB 백업 정책 수립(주기/대상/저장위치/암호화) 및 Restore 절차 확정

---

## Migration

**정정 2026-09-14 — DevDocs Update Required(이 문서가 stale, 코드는
정상)**: 이 절은 이전에 "이 저장소에는 마이그레이션 파일 자체가
없다"라고 기술했으나, 이는 2026-09-14 기준 **거짓으로 확인되어 아래
서술로 대체한다**. 실제로는 backend 저장소(`lingon/`)의
`lingon/migrations/000_baseline_schema.sql`부터
`005_fix_user_api_keys_schema.sql`까지 6개 파일과, 실행 순서를 정의한
`migrations/README.md`가 존재한다. `000`→`005`를 신규 PostgreSQL 18.6
데이터베이스에 두 번 연속 적용해도 에러 없이 통과함이 검증됐다
(idempotent — [ops/deployment_sop.md](deployment_sop.md) "Migration"
단계, [status/release_state.md](../../status/release_state.md) §7).

**절차**:

1. 모든 스키마 변경은 순번이 매겨진 `.sql` 파일로 작성(기존 네이밍 패턴
   `NNN_설명.sql` 유지 — `database/users.md` 참고)
2. **정정 2026-09-14**: 이 문서는 이전에 "각 Migration은 `UP`/`DOWN`(또는
   별도 rollback 스크립트) 모두 작성"이라고 제안했으나, 이는 실제 채택된
   정책과 충돌한다 — **오늘 어떤 migration 파일에도 `DOWN`/rollback
   스크립트가 없다**(`grep -in "drop table|-- down|rollback"
   migrations/*.sql` → 매치 없음, 2026-09-14 확인). 대신 **forward-only +
   forward-fix 정책**을 채택한다: migration은 순방향(forward-only)으로만
   작성하고, 문제가 발견되면 되돌리는 것이 아니라 더 높은 번호의 새
   forward migration으로 상태를 고친다. 되돌리기(reversal)는 그것이
   명백히 비파괴적(non-destructive)임이 증명될 때만 고려하며, 그때도
   되돌리기 자체를 새 번호의 migration으로 작성한다 — 기존 파일을 고쳐
   쓰지 않는다. 각 migration은 `IF NOT EXISTS` 또는 `information_schema`
   조회 가드로 idempotent하게 작성해 여러 번 재실행해도 안전하도록 한다
   (`000`/`002`/`003`은 `IF NOT EXISTS`, `001`/`004`/`005`는
   `information_schema`/`pg_constraint` 조회 가드 — `migrations/README.md`
   "Idempotency" 절 참고). 상세 근거와 "코드 롤백 ≠ 스키마 롤백" 원칙은
   [ops/deployment_sop.md](deployment_sop.md) "데이터베이스 롤백" 절
   참고.
3. `docs/workflow.md` Step 0(Domain Freeze)에서 DB Schema 변경 여부를 먼저
   확인한 뒤에만 Migration을 작성
4. Migration 적용 후 `backend/docs/database/<table>.md`를 함께 갱신(Step 6
   Documentation Update)

**주의 — 일부 forward migration은 데이터 파괴적이다**:
`004_fix_settings_schema.sql`은 `ai_settings`/`ui_settings`의 legacy
컬럼을 `DROP COLUMN`하고, `005_fix_user_api_keys_schema.sql`은
`user_api_keys.iv` 컬럼을 `DROP COLUMN`한다. 이런 컬럼이 드롭되기 전에
있던 데이터는 아래 "Backup" 절이 정의하는 백업이 없는 한 어떤
스크립트로도 복구할 수 없다 — Backup이 오늘 존재하지 않는다는 사실이
바로 위 forward-fix 정책을 유일한 안전망으로 만드는 이유다.

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
- **2026-09-14** — Migration 절 정정(DevDocs Update Required): "마이그레이션 파일 자체가 없다" 서술을 제거하고 `lingon/migrations/000`~`005` + `migrations/README.md`의 실존·검증된 idempotency를 기록. 절차 2번을 "UP/DOWN 모두 작성"에서 forward-only + forward-fix 정책(DOWN 스크립트 없음, 되돌리기 대신 새 forward migration)으로 교체. Backup/Restore는 Not Started 유지 — 그 부재가 forward-fix 정책을 유일한 안전망으로 만든다는 점을 명시. Status 갱신.
