# Deployment SOP — Release / Deployment / Rollback / Versioning

> **Status**: Partially documented(실제 배포 파이프라인은 존재·검증됨, 자동화·승인·모니터링·정리(pruning) 절차는 미수립) · **Progress**: 40% · **Last Updated**: 2026-09-14 · **Next Milestone**: CI/CD 자동 트리거, release 정리(pruning), 백엔드 프로세스 기동/재시작 자동화 확정
>
> **40% 근거**: 프런트엔드 빌드→배포(rsync→symlink→Apache reload)와 백엔드
> 빌드 절차는 실제 스크립트로 존재하고 아래처럼 라인 단위로 검증됐다(빌드·
> 배포·롤백 축 중 "무엇을 실행하면 되는가"는 확정). 반면 (1) 배포를 트리거하는
> CI/CD 자동화, (2) Release Note 템플릿·승인권자·릴리즈 주기, (3) 오래된
> `releases/*` 디렉토리 정리(pruning), (4) 백엔드 프로세스 기동/재시작
> 자동화(PM2 연동), (5) 자동 롤백 트리거·RTO 목표는 전부 미수립이다 — 다섯
> 축 중 두 축(빌드/배포 실행, 수동 롤백 메커니즘)만 확정되었다고 보아 40%로
> 기록한다.

**정정 2026-09-14(TASK-007)**: 이 문서는 이전에 "이 저장소에는 현재 배포
파이프라인 자체가 없다"라고 기술했으나, 그 서술은 **거짓으로 확인되어
위 문단에서 제거했다** — 분류: **DevDocs Update Required**(이 문서가
stale, 코드는 정상). 실제로는 프런트엔드 `letmeknow/compile_release.sh` +
`letmeknow/run_release.sh`, 백엔드 `lingon/server_deploy.sh` +
`lingon/server_init.sh` 3~4개 스크립트가 실제 배포 절차를 구현하고
있다(전부 2026-09-14 실측, 아래 "실측된 배포 구조" 절 참고). 근거: 각
스크립트 직접 실측(라인 인용은 아래 절 참고).

---

## Versioning Rule

| 대상 | 규칙(제안) |
|---|---|
| Backend API | ICD v0.0 envelope 자체는 유지, Action Type 스키마는 추가만 허용(하위 호환) — [docs/icd/action_layer_api.md](../icd/action_layer_api.md) "버전/호환성" 절과 동일 원칙 |
| 앱(Flutter) | Semantic Versioning(`MAJOR.MINOR.PATCH`) — 기존 커밋 로그의 `V_0.0.x` 표기와 정합성 확인 필요 |
| Domain ICD 문서 | `0.x.0-draft` → 검토·승인 후 `1.0.0`로 전환(현재 전부 `0.1.0-draft`/`0.1.2-draft`) |

## Release SOP (제안 — 미수립)

1. `docs/workflow.md` Step 5(Integration Verification) 통과
2. Release 대상 기능의 Requirement Status가 `Done`인지 확인([requirements/README.md](../../requirements/README.md))
3. Release Note 작성(무엇이 바뀌었는지, Breaking Change 여부)
4. 버전 태그 발행

**현재 없음**: Release Note 템플릿, 승인권자(사용자 승인 — [docs/workflow.md](../workflow.md) "AI 조직 운영 구조" 참고), Release 주기.

## Deployment SOP — 실측된 배포 구조 (2026-09-14, TASK-007)

> 이전 버전은 이 절을 "제안 — 미수립"으로 기술했으나, 아래 3~4개 스크립트가
> 실제 배포 절차를 구현하고 있음이 2026-09-14 실측으로 확인되었다. 분류:
> **DevDocs Update Required**. 아래 모든 라인 인용은 해당 파일을 직접 읽어
> 확인한 것이다.

### 프런트엔드 — `letmeknow/compile_release.sh`

- `set -euo pipefail`(2행). `SCRIPT_DIR`을 `${BASH_SOURCE[0]}`에서 유도하고
  `PROJECT_DIR="${PROJECT_DIR:-$SCRIPT_DIR}"`(9-10행)로 환경변수 오버라이드를
  허용한다.
- 배포 상수(13-15행): `DEPLOY_BASE=/var/www/lingon`,
  `RELEASES_DIR=$DEPLOY_BASE/releases`, `CURRENT_LINK=$DEPLOY_BASE/current`.
- Release 이름은 `date +%Y%m%d_%H%M%S`(18행) 타임스탬프 →
  `RELEASE_DIR=$RELEASES_DIR/$RELEASE_NAME`.
- `FLUTTER_DEFINE_ARGS=()`(41행) — 유일하게 추가되는 define은
  `--dart-define=API_BASE_URL=$LINGON_API_BASE_URL`이며, 그것도 해당
  환경변수가 비어있지 않을 때만 추가된다(43-45행).
- `assert_no_secret_defines()`(57-101행, 103행에서 호출)가 다음 중 하나라도
  해당하면 빌드를 **거부**한다: `--dart-define` 이름이
  `*API_KEY*|*SECRET*|*TOKEN*|*PASSWORD*|*PRIVATE_KEY*` 패턴에 매치하거나,
  값이 `sk-`로 시작하거나, `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/
  `GEMINI_API_KEY`/`GOOGLE_API_KEY` 중 하나라도 환경변수로 설정되어 있는
  경우.
- 빌드: `flutter build web --release`(117행) → 출력물 `$PROJECT_DIR/build/web`,
  `index.html` 존재 여부 확인(122-123행).
- `SKIP_DEPLOY=1`(126행) 설정 시 빌드 후 exit 0 — `sudo`/배포 접근 권한 없이
  개발 머신에서 빌드 경로만 검증 가능.
- 배포 단계(134-161행): `sudo mkdir -p $RELEASE_DIR` →
  `sudo rsync -a --delete build/web/ $RELEASE_DIR/` →
  `sudo chown -R root:www-data` → 디렉토리 `755`/파일 `644` 권한 설정 →
  `sudo ln -sfn $RELEASE_DIR $CURRENT_LINK` → `sudo systemctl reload apache2`.

**⚠️ 보안 결론(현재 어느 ops/status 문서에도 기록되어 있지 않음)**:
프런트엔드는 **Flutter Web을 Apache가 `/var/www/lingon/current`에서 정적
JS/wasm으로 서빙**하는 구조다. 따라서 **`--dart-define`으로 넘기는 모든
값은 방문자에게 그대로 공개된 JavaScript로 노출된다.** Provider API
키/토큰/시크릿은 절대 `--dart-define`으로 전달해서는 안 되며, 그런
자격증명은 클라이언트가 호출하는 백엔드 쪽에 있어야 한다 —
`assert_no_secret_defines()`가 존재하는 이유가 바로 이것이다.

빌드 결과물의 시크릿 유출 점검(정확한 방법, `Route.md` §4 기준):

```bash
grep -raoE "sk-[A-Za-z0-9_-]{20,}" letmeknow/build/web
```

**`grep -ril "sk-" build/web`은 절대 사용하지 않는다** — CanvasKit/Skia가
ICU locale 태그를 내장하고 있어 `sk-SK`(슬로바키아어)가 항상 오탐(false
positive)으로 잡히기 때문이다.

### 프런트엔드 dev/TLS 서빙 — `letmeknow/run_release.sh`

`/var/www/lingon`에서 `PATH="flutter/bin:$PATH"`로 실행되며,
`flutter run -v -d web-server --web-port=4443 --web-hostname=0.0.0.0
--web-tls-cert-path=encrypt/flutter-fullchain.pem
--web-tls-cert-key-path=encrypt/flutter-privkey.pe`를 구동한다(5행).

**미해결 결함 2건(2026-09-14 확인, 이 문서는 기록만 하고 임의로 고치지
않는다)**:

1. `--web-tls-cert-key-path` 값이 `encrypt/flutter-privkey.pe`로 끝난다 —
   `.pem`이 아니라 `.pe`다. 파일명이 잘린 것으로 보인다.
2. 이 스크립트는 `flutter run`(개발 서버)이며 프로덕션 정적 서빙이
   아니다 — 위 `compile_release.sh`의 `current` 심볼릭 링크 경로를 완전히
   우회한다.

### 백엔드 — `lingon/server_deploy.sh` / `lingon/server_init.sh`

`server_deploy.sh`: `set -e` 후 `npm install --production=false`와
`npm run build`만 실행한다. **프로세스를 재시작하지 않고, 산출물을 복사하지
않으며, 아무것도 reload하지 않는다.**

`server_init.sh`: NodeSource로 Node LTS를 설치하고
`npm install -g pm2`(21행)로 PM2를 설치한다 — 즉 PM2가 의도된 프로세스
매니저이지만, **어느 스크립트도 실제로 PM2를 호출해 백엔드를
시작/재시작하지 않는다.**

**미수립 공백(명시적으로 기록만 함)**: 백엔드 "배포"는 빌드까지만이며,
프로세스 시작/재시작은 문서화되지 않은 수동 단계다. 이 부분은 여전히
"제안 — 미수립"이다.

## Rollback SOP

**프런트엔드 롤백(실제로 존재하는 유일한 롤백 메커니즘)**: `current`
심볼릭 링크를 이전 `releases/<timestamp>` 디렉토리로 다시 가리키게 한 뒤
Apache를 reload하면 된다 —

```bash
sudo ln -sfn /var/www/lingon/releases/<이전_timestamp> /var/www/lingon/current
sudo systemctl reload apache2
```

이전 릴리즈들은 `compile_release.sh`가 `--delete` 없이(그 옵션은
`rsync`의 원본↔대상 파일 동기화용이지 이전 release 디렉토리 삭제용이
아님) `releases/` 아래에 그대로 보존되므로 위 명령이 바로 동작한다. **미해결
공백**: 오래된 `releases/*` 디렉토리를 정리(prune)하는 장치가 없고(디스크가
무한정 쌓임), 에러율 급증 등을 감지해 위 롤백을 자동으로 트리거하는
장치도 없다(수동 실행만 가능).

| 상황 | 대응 |
|---|---|
| 배포 직후 에러율 급증 | 위 `current` 심볼릭 링크 재지정 + Apache reload로 즉시 롤백 가능(수동). 자동 감지 기준은 미정 — [monitoring.md](monitoring.md) Alert 정의 후 확정 |
| DB Migration이 포함된 배포의 롤백 | [data_sop.md](data_sop.md) Migration 절 — **정정 2026-09-14**: `lingon/migrations/`에 `000_baseline_schema.sql`~`005_fix_user_api_keys_schema.sql` 6개 파일과 실행 순서를 정의한 `migrations/README.md`가 실제로 존재한다(더 이상 "Migration 자체가 없음"이 아니다 — `000_baseline_schema.sql`은 2026-09-14 기준 `lingon` 작업 트리에 UNCOMMITTED 상태). 다만 이 파일들에는 각 migration에 대응하는 `DOWN`/롤백 스크립트가 없다 — 순방향 적용만 가능하며, migration 롤백 절차 자체는 여전히 미수립이다. |
| Action Layer 배포 후 특정 Action Type 오작동 | 해당 Action Type만 `GET /v1/actions/types`에서 비활성화(연결 해제 아님, 카탈로그 노출만 중단) — Action Layer 구현 후 설계 |

**여전히 없음**: 자동 롤백 트리거, 롤백 소요시간 목표(RTO), `releases/*`
정리(pruning) 정책, migration 단위 롤백(DOWN) 스크립트.

## `Route.md`와의 관계

저장소 루트 `Route.md`(이 저장소 밖 파일, `docs/`가 아니므로 여기서
직접 수정하지 않음) "RELEASE / DEPLOY" 절은 스스로를 "`deployment_sop.md`가
재작성될 때까지"의 임시 권위 문서로 명시하고 있다. 이번 정정으로 그
조건이 충족되었으므로, 이제부터는 다시 이 문서(`deployment_sop.md`)가
배포 구조에 대한 권위 문서다 — `Route.md` 소유자가 해당 절을 갱신해야
한다(이 세션은 `docs/` 밖 파일이므로 `Route.md`를 직접 수정하지 않았다).

인간만 수행 가능한 단계(프로덕션 TLS 인증서 발급, 스토어 등록 등)는
이 문서의 권한 밖이며 [status/required_human_resource.md](../../status/required_human_resource.md)가
계속 그 항목들의 권위 문서다.

## 관련 문서

- [data_sop.md](data_sop.md) — Migration/Backup/Restore
- [monitoring.md](monitoring.md) — 배포 후 상태 확인
- [../workflow.md](../workflow.md) — 출시 전 체크리스트, Step 6(Documentation Update)과의 관계
- [../../status/required_human_resource.md](../../status/required_human_resource.md) — 인간만 수행 가능한 단계(프로덕션 TLS, 스토어 등록 등)의 권위 문서

---

# Change Log

- **2026-07-22** — 최초 작성(뼈대만 — 실제 절차는 대부분 미수립 상태를 그대로 기록). Docs Revision(SSOT 정리) 작업의 일부.
- **2026-09-14** — TASK-007 SSOT 동기화: "배포 파이프라인 없음"(Status: Not Started, 0%) 기술을 정정. 실제 파이프라인(compile_release.sh / run_release.sh / server_deploy.sh) 기록, Flutter Web + Apache 정적 서빙에 따른 --dart-define 시크릿 공개 노출 결과, current 심볼릭 링크 롤백 절차 추가. DevDocs Update Required.
