# Deployment SOP — Release / Deployment / Rollback / Versioning

> **Status**: Partially documented(실제 배포 파이프라인·서빙 경로(D-004)·CORS 정책(D-003)·3축 롤백 절차는 확정·문서화됨, CI/CD 트리거·Release Note 승인·release pruning·백엔드 프로세스 자동화·DB 백업/복원은 미수립) · **Progress**: 55% · **Last Updated**: 2026-09-14 · **Next Milestone**: CI/CD 자동 트리거, release 정리(pruning), 백엔드 프로세스 기동/재시작 자동화, DB 백업/복원 정책 확정
>
> **55% 근거**: 프런트엔드 빌드→배포(rsync→symlink→Apache reload)와 백엔드
> 빌드 절차는 실제 스크립트로 존재하고 라인 단위로 검증됐다(빌드/배포
> 실행 축 확정). 프로덕션 서빙 경로는 Owner 결정 D-004로 확정되어
> `run_release.sh`가 Development Only로 명시됐다(서빙 경로 축 확정).
> CORS 허용 Origin 정책은 Owner 결정 D-003으로 확정되었고 코드 동작과
> 정확히 일치함이 라인 단위로 검증됐다(CORS 축 확정). 프런트엔드/백엔드/DB
> 세 갈래 롤백(심볼릭 링크 재지정 / 재빌드+수동 재시작 / forward-fix)도
> 문서화됐다(롤백 정책 축 확정). 반면 (1) 배포를 트리거하는 CI/CD 자동화,
> (2) Release Note 템플릿·승인권자·릴리즈 주기, (3) 오래된 `releases/*`
> 디렉토리 정리(pruning), (4) 백엔드 프로세스 기동/재시작 자동화(PM2
> 연동), (5) 자동 롤백 트리거·RTO 목표, (6) DB 백업/복원 정책은 전부
> 미수립이다 — 확정된 네 축(서빙 경로/CORS/빌드·배포 실행/롤백 정책)
> 대 미수립 다섯~여섯 항목의 비중을 반영해 55%로 기록한다.

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

## CORS

**D-003 DECIDED (Owner, 2026-09-14): 명시적 allow-list만 허용, 정확
문자열(exact string) 일치, wildcard 금지.** 아래는 그 결정과
`lingon/src/app.ts` 구현이 정확히 일치함을 라인 단위로 확인한 결과다.

### 정책

| 항목 | 값 |
|---|---|
| 허용 방식 | 명시적 allow-list(`CORS_ALLOWED_ORIGINS`), **정확 문자열 일치만** — scheme/port/subdomain 추론 없음 |
| Wildcard | **금지** — `*`를 넣어도 실제 `Origin` 헤더와 리터럴로 일치하지 않으므로 아무 효과가 없다(아래 "`*` footgun" 참고) |
| 프로덕션 canonical origin | `https://www.ling-on.com` — `letmeknow/lib/core/network/api_client.dart:57`의 `super.baseUrl = 'https://www.ling-on.com'`과 일치 |
| Apex(`ling-on.com`, `www` 없음) | API allow-list에 **넣지 않는다** — Apache 레벨에서 `www`로 301/302 redirect만 한다(아래 "Apex" 절) |
| Staging | 실제 staging 프런트엔드가 존재하기 전까지 추가하지 않는다 |

### Apex는 redirect-only — allow-list에 넣지 않는 이유

`https://ling-on.com`(apex, `www` 없음)은 Apache에서
`https://www.ling-on.com`으로 301/302 redirect된다. 브라우저는 redirect가
끝난 뒤의 origin(`https://www.ling-on.com`)만 `Origin` 헤더로 보내므로,
API는 apex를 신뢰 목록에 넣을 필요가 전혀 없다 — 넣으면 신뢰하는 origin
표면만 이유 없이 넓어진다.

### 설정 방법 — 프로덕션 예시

```bash
# /etc/lingon/backend.env (or the process manager's env file)
# Comma-separated, exact-match. No wildcard. No trailing slash. Scheme+host(+port) must match the browser's Origin header byte-for-byte.
CORS_ALLOWED_ORIGINS=https://www.ling-on.com
```

향후 실제 staging 프런트엔드가 생기면 comma로 추가한다(**지금 이대로
설정하는 것이 아니라 미래를 위한 예시일 뿐**):

```bash
# example for the future; not to be set today
CORS_ALLOWED_ORIGINS=https://www.ling-on.com,https://staging.ling-on.com
```

### 동작 원리 (코드 인용, `lingon/src/app.ts`)

> **라인 인용 기준(verification baseline)**: 이 문서의 `lingon/src/app.ts`
> 라인 번호는 **커밋된 상태 `lingon@b5fad88`**(`b5fad88b645b9951d24cf4de6710bcb2a039869f`,
> "chore(repo): stop tracking node_modules") 기준으로 2026-09-14에 직접
> 확인한 것이다. 이 번호들은 그 커밋 상태에 **고정(pinned)**되어 있다 —
> 이전 버전이 기록했던 미커밋 드리프트(요청 ID correlation 추가로 인한
> schema +1행, cors +11행)는 이제 이 커밋에 포함되어 있고, 그 이후 추가
> 커밋 3건이 더 반영되어 아래 라인 번호에 이미 녹아 있다. `docs/ops/` 두
> 문서(`deployment_sop.md`, `production_config.md`)는 **같은 커밋 기준**을
> 쓴다 — 섞어 쓰지 않는다. `src/config/env.ts`와
> `src/config/FastifyDefinition.ts`는 미변경이므로 그 라인 번호는 안정적이다.
> 따라서 번호가 어긋나면 아래 **고정 앵커**로 찾는다:
> `required: ['PORT', 'HOST']` · `CORS_ALLOWED_ORIGINS: { type: 'string'` ·
> `await app.register(AutoLoad, { dir:` · `` `*` is NOT special-cased `` ·
> `const allowedOrigins = app.config.CORS_ALLOWED_ORIGINS` ·
> `callback(null, false)`.

- `app.ts:34`(`@fastify/env` schema) — 값이 없으면 기본값
  `https://www.ling-on.com`.
- `app.ts:176-179` — `app.config.CORS_ALLOWED_ORIGINS`를 `.split(',')` →
  `.map(o => o.trim())` → `.filter(o => o.length > 0)`으로 분해해
  `allowedOrigins` 배열을 만든다.
- `app.ts:181-189` — `app.register(cors, { origin: (origin, callback) => {
  if (origin === undefined || allowedOrigins.includes(origin)) {
  callback(null, true); return; } callback(null, false); } })`.
  `Array.prototype.includes`이므로 **정확 문자열 일치**다.
- `Origin` 헤더가 없는 요청(Android 클라이언트, 서버-서버 호출)은
  `origin === undefined` 분기로 **항상 허용**된다(`app.ts:183`).
- allow-list에 없는 Origin은 `callback(null, false)`(`app.ts:187`)로
  처리된다 — 에러를 던지는 것이 아니라 `@fastify/cors`가
  `Access-Control-Allow-Origin` 헤더를 **생략**하게 만든다. 즉 500이
  아니라 헤더 부재로 나타난다.

### `*` footgun

`CORS_ALLOWED_ORIGINS=*`를 설정해도 wildcard로 동작하지 않는다. `*`는
다른 항목과 똑같이 리터럴 문자열로 비교되고(`allowedOrigins.includes(origin)`),
실제 브라우저가 보내는 `Origin` 헤더가 문자 그대로 `"*"`인 경우는 없으므로
**단 하나의 cross-origin 브라우저 요청도 통과시키지 못한다** — 오히려
모든 cross-origin 요청을 조용히 차단한다. 근거: `app.ts:167-169`(코드
주석, load-bearing) — "`*` is NOT special-cased as a wildcard — it is
compared like any other entry and, since real `Origin` headers are never
literally `"*"`, including it has no effect."

### 등록 순서 경고

`cors`는 `AutoLoad plugins/` 등록(`app.ts:158`) **이후에** 등록되어야
한다(`app.ts:160-162` 주석) — `RequestContext`의 `onRequest` 훅이
`req.ctx`를 먼저 채운 뒤에만 cors의 `onRequest` 훅이 OPTIONS preflight를
short-circuit해야 하기 때문이다. **이 등록 순서는 load-bearing이므로
옮기지 않는다.**

### 변경 시 재시작 필요 — 아직 자동화되지 않음

`CORS_ALLOWED_ORIGINS`를 바꾸면 백엔드 프로세스를 재시작해야 값이
반영된다(`@fastify/env`가 프로세스 시작 시점에 한 번만 읽는다). 그런데
아래 "알려진 공백" 절에서 기록하듯 **어느 스크립트도 백엔드 프로세스를
시작/재시작하지 않는다** — 즉 이 값을 바꿔도 사람이 수동으로 프로세스를
재시작하기 전까지는 적용되지 않는다.

### 이 변수는 3개 파일에 중복 정의되어 있다

`CORS_ALLOWED_ORIGINS`는 `lingon/src/app.ts:34`(`@fastify/env` schema),
`lingon/src/config/env.ts:33`(early-init 스냅샷), `lingon/src/config/FastifyDefinition.ts:51`
(타입 선언) 세 곳에 각각 존재한다. 새 env var를 추가할 때는 반드시 이
세 파일을 모두 함께 고쳐야 한다 — 하나라도 빠뜨리면 `app.config.X`가
타입체크를 통과하지 못하거나(FastifyDefinition 누락 시) 초기화 시점
값이 어긋난다(env.ts 누락 시).

## Deployment SOP — 실측된 배포 구조 (2026-09-14, TASK-007)

> 이전 버전은 이 절을 "제안 — 미수립"으로 기술했으나, 아래 3~4개 스크립트가
> 실제 배포 절차를 구현하고 있음이 2026-09-14 실측으로 확인되었다. 분류:
> **DevDocs Update Required**. 아래 모든 라인 인용은 해당 파일을 직접 읽어
> 확인한 것이다.

### Production 표준 경로 — D-004 (DECIDED 2026-09-14)

**Owner 결정 D-004**: 프로덕션 canonical 배포 경로는 다음 하나뿐이다 —

```
flutter build web --release
  → 버저닝된 release 디렉토리 /var/www/lingon/releases/<YYYYmmdd_HHMMSS>
  → rsync -a --delete + chown root:www-data + 755(dir)/644(file)
  → ln -sfn <release> /var/www/lingon/current
  → systemctl reload apache2
```

즉 `letmeknow/compile_release.sh`가 구현하는 경로다(아래 "프런트엔드 —
`compile_release.sh`" 절에서 라인 단위로 재확인). Apache는 `current`
심볼릭 링크가 가리키는 디렉토리에서 정적 빌드 결과물을 서빙한다.

`letmeknow/run_release.sh`는 **Development Only이며 프로덕션 경로가
아니다** — `flutter run -d web-server`(개발 서버)를 구동하며, Apache와
`current` 심볼릭 링크를 완전히 우회하고, 웹 서버에 Flutter SDK가 그대로
체크아웃되어 있어야 하며, 공개 트래픽을 견딜 만큼 hardening되지도
performant하지도 않다. `.pe`→`.pem` TLS 키 경로 오타는 TASK-012에서
이미 수정되어 현재 스크립트는 `--web-tls-cert-key-path=encrypt/flutter-privkey.pem`으로
정확히 끝난다(2026-09-14 직접 재확인 — 아래 상세 절 참고). 이 스크립트에는
"Development Only" 헤더 주석이 **추가되었다**(ORCH-OPS가 D-004에 따라
수행 — 주석 16행 삽입, 삭제 0행, 로직 변경 없음):

```
$ grep -in "development only" letmeknow/run_release.sh
3:# DEVELOPMENT ONLY — NOT THE PRODUCTION SERVING PATH.

$ git -C letmeknow diff --stat -- run_release.sh
 run_release.sh | 16 ++++++++++++++++
 1 file changed, 16 insertions(+)

$ bash -n letmeknow/run_release.sh
(no output, exit 0)
```

**결론**: 이제 이 저장소 안에는 프로덕션 배포 경로에 대한 서술이
정확히 하나만 존재한다 — 이 절과 아래 라인 단위 상세뿐이다. 이와
충돌하는 세 번째 서술은 없다.

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

### 프런트엔드 dev/TLS 서빙 — `letmeknow/run_release.sh` (Development Only, D-004)

`/var/www/lingon`에서 `PATH="flutter/bin:$PATH"`로 실행되며,
`flutter run -v -d web-server --web-port=4443 --web-hostname=0.0.0.0
--web-tls-cert-path=encrypt/flutter-fullchain.pem
--web-tls-cert-key-path=encrypt/flutter-privkey.pem`를 구동한다(현재
21행 — "Development Only" 헤더 주석이 앞에 추가되며 원래 5행에서 밀렸다.
2026-09-14 재확인).

**정정 2026-09-14**: 이 문서는 이전에 `--web-tls-cert-key-path` 값이
`encrypt/flutter-privkey.pe`(`.pem`이 아닌 `.pe`로 잘린 파일명)로
끝난다고 기록했으나, 2026-09-14 재확인 결과 이 오타는 **TASK-012에서
이미 수정되어 커밋됐다** — 현재 이 줄은 `...flutter-privkey.pem`으로
정확히 끝난다. 더 이상 결함으로 취급하지 않는다.

이 스크립트가 여전히 프로덕션 경로가 아닌 이유는 오타가 아니라 구조
자체다 — `flutter run`(개발 서버)을 구동하며, 위 `compile_release.sh`의
`current` 심볼릭 링크·Apache 경로를 완전히 우회한다. Owner 결정 D-004에
따라 이 스크립트는 **Development Only**로 확정되었다(위 "Production
표준 경로 — D-004" 절 참고).

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
"제안 — 미수립"이다. (아래 "알려진 공백" 절에서 다시 이름을 붙여
기록한다.)

## 배포 절차 — Build → Deploy → Migration → Start/Reload → Smoke Test

실제 배포는 다섯 단계로 구성된다. 각 단계마다 "오늘 실제로 일어나는 일"과
"현재는 사람이 수동으로 수행해야 하는 절차"를 구분해 기록한다.

### 1. Build

- **프런트엔드**: 검증만 할 때는 `SKIP_DEPLOY=1 bash ./compile_release.sh`
  (126행에서 exit 0, `sudo` 불필요 — 위 절 참고). 실제 릴리즈는
  `SKIP_DEPLOY` 없이 전체 실행(117행 `flutter build web --release`부터
  배포까지).
- **백엔드**: `lingon/server_deploy.sh` — `npm install --production=false` +
  `npm run build`만 실행(`server_deploy.sh:5`,`:7` — 스크립트 전체가 7행이다).
- **시크릿 유출 점검**(빌드 결과물에 대해 실행해야 하는 명령):

  ```bash
  grep -raoE "sk-[A-Za-z0-9_-]{20,}" letmeknow/build/web
  ```

  **`grep -ril "sk-" build/web`은 절대 사용하지 않는다** — CanvasKit/Skia가
  ICU locale 태그를 내장하고 있어 `sk-SK`(슬로바키아어)가 항상 오탐(false
  positive)으로 잡히기 때문이다.

### 2. Deploy

- **프런트엔드**: `rsync -a --delete build/web/ $RELEASE_DIR/` → `chown
  root:www-data` → 디렉토리 755/파일 644 → `ln -sfn $RELEASE_DIR
  $CURRENT_LINK` → `systemctl reload apache2`(134-161행).
- **백엔드**: **아무것도 배포되지 않는다** — `server_deploy.sh`는 제자리
  (in-place)에서 빌드만 하고 아무 것도 복사하지 않는다(`server_deploy.sh` 전문 7행 — `set -e`, echo, `npm install --production=false`(5행), `npm run build`(7행)가 전부다).

### 3. Migration

`lingon/migrations/README.md`가 정의하는 순방향(forward-only) 순서로
`000_baseline_schema.sql` → `005_fix_user_api_keys_schema.sql`까지 실행:

```bash
for f in migrations/*.sql; do
  psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$f"
done
```

각 파일은 `IF NOT EXISTS` 또는 `information_schema` 가드로 idempotent —
`000`→`005`를 신규 PostgreSQL 18.6 데이터베이스에 두 번 연속 적용해도
에러 없이 통과함이 검증됐다([status/release_state.md](../../status/release_state.md) §7).

### 4. Start/Reload

- **프런트엔드**: Apache reload(`systemctl reload apache2`) — 위 Deploy
  단계에 이미 포함.
- **백엔드**: **자동화되지 않은 공백** — 아래 "알려진 공백" 절 참고. PM2가
  설치되어 있음(`server_init.sh:21`)에도 어느 스크립트도 이를 호출해
  백엔드 프로세스를 시작/재시작하지 않는다.

### 5. Smoke Test

실행해야 하는 최소 점검 목록이다(이 문서는 **점검 항목을 정의**할 뿐,
이 세션이 실제로 실행하지는 않았다):

- `current` 심볼릭 링크가 새 release 디렉토리를 정확히 가리키는지
  (`readlink /var/www/lingon/current`)
- Apache가 `index.html`을 정상 응답하는지
- 백엔드가 자신의 health/status route에 응답하는지
- **인증을 거치고 DB를 실제로 만지는 요청이 성공하는지** — 이 항목은
  생략하면 안 된다. [production_config.md](production_config.md)가
  기록하듯 `DB_*`/`JWT_SECRET`/`MASTER_ENCRYPTION_KEY`는 `@fastify/env`
  스키마 밖에 있어 **완전히 잘못 설정된 서버도 기동에 성공하고 "ready"를
  보고한다.** "프로세스가 떠 있는가 / 포트가 응답하는가"만 보는 점검은
  그런 배포를 정상으로 오판한다
- `https://www.ling-on.com`에서 보낸 브라우저 요청이 정확히 그 origin과
  일치하는 `Access-Control-Allow-Origin` 헤더를 받는지, 그리고 다른
  origin에서 보낸 요청은 그 헤더를 받지 못하는지(위 CORS 절 "동작 원리" —
  `app.ts:187`의 `callback(null, false)` → 헤더 생략 동작)

## Rollback SOP — 세 갈래 롤백 경로

배포는 프런트엔드/백엔드/데이터베이스라는 서로 다른 세 축을 가지며, 각
축의 롤백 메커니즘과 성숙도는 전혀 다르다. 하나로 묶어 서술하지 않는다.

### 1. 프런트엔드 롤백 — 실제로 존재하는 유일한 롤백 메커니즘

`current` 심볼릭 링크를 이전 `releases/<timestamp>` 디렉토리로 다시
가리키게 한 뒤 Apache를 reload한다:

```bash
sudo ln -sfn /var/www/lingon/releases/<이전_timestamp> /var/www/lingon/current
sudo systemctl reload apache2
```

이전 릴리즈들은 `compile_release.sh`의 `rsync -a --delete`가 release
디렉토리 **내부**의 원본↔대상 파일만 동기화할 뿐 `releases/` 아래의
**형제 release 디렉토리**는 전혀 건드리지 않으므로, 위 명령이 그대로
동작한다. 이 경로는 빠르고 수동이며, **오늘 실제로 존재하는 유일한
롤백 메커니즘**이다.

### 2. 백엔드 롤백 — release 디렉토리 모델 없음, 수동 재빌드

백엔드에는 프런트엔드 같은 release 디렉토리/심볼릭 링크 모델이 없다.
`server_deploy.sh`는 제자리(in-place)에서 빌드하므로, 백엔드를 이전
상태로 되돌리는 절차는 문서화된 수동 시퀀스로만 존재한다:

1. 이전 백엔드 commit으로 checkout
2. `npm install --production=false && npm run build` 재실행
3. 백엔드 프로세스를 재시작(**어느 스크립트도 이를 자동화하지 않는다** —
   아래 "알려진 공백" 절 참고)

1·2는 `server_deploy.sh`가 하는 일과 동일한 방식으로 재현 가능하지만,
3은 오늘 자동화가 전혀 없는 수동 단계다.

### 3. 데이터베이스 롤백 — 코드 롤백과 같지 않다

**이 절에서 가장 중요한 한 문장: 애플리케이션 코드를 롤백해도 스키마는
롤백되지 않는다.** 코드 롤백은 이전 코드를 더 새로운 스키마 위에
올려놓는 결과를 낳을 수 있다.

근거:

- Migration은 **순방향(forward-only)**이다. 어떤 migration에도 `DOWN`
  스크립트가 없다 — `grep -in "drop table|-- down|rollback"
  lingon/migrations/*.sql`는 아무 것도 매치하지 않는다(2026-09-14
  재확인, exit code 1 = no match).
- Migration을 다시 실행하는 것은 안전하다(가드 덕분에 idempotent —
  [status/release_state.md](../../status/release_state.md) §7에서 두 번
  연속 검증됨)지만, **아무 것도 되돌리지 않는다.** 재실행은 전진
  (forward)만 반복할 뿐이다.
- 일부 forward 단계는 **데이터 파괴적**이다: `004_fix_settings_schema.sql`은
  `ai_settings.provider`/`ai_settings.options`/`ui_settings.settings`
  legacy 컬럼을 `DROP COLUMN`하고(`004:15,42,43`), `005_fix_user_api_keys_schema.sql`은
  `user_api_keys.iv` 컬럼을 `DROP COLUMN`한다(`005:17`). 이 컬럼들이
  드롭되기 전에 들어 있던 데이터는 어떤 스크립트로도 복구되지 않는다.

**정책 — forward-fix.** migration이 문제를 일으켰을 때의 대응은
**되돌리기 시도가 아니라, 더 높은 번호의 새 forward migration으로
상태를 고치는 것**이다. 되돌리기(reversal)는 그것이 명백히 비파괴적
(non-destructive)임이 증명될 때만 고려하며, 그때도 되돌리기 자체를 새
번호의 migration으로 작성한다 — 기존 파일을 고쳐 쓰지 않는다.

이 정책이 요구하는 것:

- 모든 migration은 *이전* 애플리케이션 버전이 여전히 접속해 있는
  데이터베이스에서도 안전해야 한다 — additive를 먼저, destructive를
  나중에, destructive 변경은 그 변경에 의존하는 코드와 **같은 배포에
  절대 포함하지 않는다.**
- 진짜 "undo"는 백업으로부터의 restore뿐이다. 이는 백업 정책을
  전제하는데, 그 백업 정책은 **오늘 존재하지 않는다**
  ([data_sop.md](data_sop.md) Backup/Restore 절 — Status: Not Started).
  백업이 없다는 사실이 바로 forward-fix 정책을 필수로 만드는 이유다
  (달리 되돌릴 방법이 없다).

migration 단위 롤백은 "미수립"이 아니라 **의도적으로 순방향 전용
(deliberately forward-only)**이다 — 이는 결정 사항이며, 앞으로 DOWN
스크립트를 "아직 안 만든 것"으로 취급하지 않는다.

| 상황 | 대응 |
|---|---|
| 배포 직후 에러율 급증(프런트엔드) | 위 "1. 프런트엔드 롤백" — `current` 심볼릭 링크 재지정 + Apache reload로 즉시 롤백 가능(수동). 자동 감지 기준은 미정 — [monitoring.md](monitoring.md) Alert 정의 후 확정 |
| 배포 직후 문제(백엔드) | 위 "2. 백엔드 롤백" — 이전 commit 재빌드 + 프로세스 재시작(수동, 재시작 자체는 미자동화) |
| DB Migration이 포함된 배포의 문제 | 위 "3. 데이터베이스 롤백" — **되돌리지 않는다.** forward-fix migration을 새로 작성한다. 되돌리기는 미수립이 아니라 정책상 배제되어 있다 |
| Action Layer 배포 후 특정 Action Type 오작동 | 해당 Action Type만 `GET /v1/actions/types`에서 비활성화(연결 해제 아님, 카탈로그 노출만 중단) — Action Layer 구현 후 설계 |

**여전히 없음(자동화 관점, 위 forward-fix 정책과는 별개)**: 자동 롤백
트리거, 롤백 소요시간 목표(RTO), DB 백업/복원(이것이 없다는 사실이 위
forward-fix 정책을 유일한 안전망으로 만든다).

## 알려진 공백 (Known Gaps — 소유자 없음)

아래 두 항목은 [status/release_state.md](../../status/release_state.md)
§8("Open items with no owning task")에도 동일하게 기록되어 있다. 이
문서는 그 사실을 재서술할 뿐, 소유자·Task ID·목표일을 새로 만들지
않는다.

1. **백엔드 배포가 프로세스를 시작/재시작하지 않는다 — PM2가 설치돼
   있음에도.** `lingon/server_init.sh:21`이 `npm install -g pm2`로 PM2를
   전역 설치하지만, 어느 스크립트도 실제로 PM2를 호출하지 않는다.
   결과: `server_deploy.sh`가 끝난 뒤에도 **이전** 빌드로 뜬 백엔드
   프로세스가 계속 요청을 처리한다 — 사람이 수동으로 재시작하기
   전까지는 새 빌드가 반영되지 않는다. 같은 이유로
   `CORS_ALLOWED_ORIGINS` 같은 env var 변경도 수동 재시작 전까지
   반영되지 않는다(위 CORS 절 참고).
2. **오래된 `releases/*`를 정리(prune)하는 장치가 없다.** 배포마다 웹
   번들 전체 복사본이 `/var/www/lingon/releases/` 아래에 쌓이며, 디스크
   사용량이 무한정 증가한다. 동시에 retention floor(최소 몇 개의 이전
   release를 항상 남겨둘지)에 대한 보장도 없다 — 즉 위 "1. 프런트엔드
   롤백"이 몇 단계 전까지 되돌릴 수 있는지는 **깊이가 정해져 있지
   않고, 보장되지도 않는다.** 디스크 증가와 롤백 깊이 미보장, 두
   절반을 모두 기록해 둔다.

## `route_index.md`와의 관계

과거 이 절은 워크스페이스 루트의 `Route.md`(저장소 밖, 버전관리 되지
않는 파일)를 임시 권위 문서로 다루고 그 소유자가 갱신해야 한다고
기술했다. 이는 이제 낡은 서술이다: 라우팅 인덱스는 2026-09-14부로 이
저장소 안의 **`docs/docs/route_index.md`**(브랜치 `V_0.1`, 버전관리됨)로
이전되었고, 루트 `/Route.md`는 이제 그쪽을 가리키는 포인터 스텁일
뿐이다(내용은 없음).

`route_index.md`의 "RELEASE / DEPLOY" 절은 이미 이 문서
(`deployment_sop.md`)를 권위 문서로 명시하고 있다 — 즉 이 저장소 안에
배포 구조를 서술하는 문서는 이제 정확히 하나(이 문서)이고,
`route_index.md`는 그쪽으로의 포인터일 뿐 서로 충돌하는 세 번째 서술은
존재하지 않는다.

인간만 수행 가능한 단계(프로덕션 TLS 인증서 발급, 스토어 등록 등)는
이 문서의 권한 밖이며 [status/required_human_resource.md](../../status/required_human_resource.md)가
계속 그 항목들의 권위 문서다.

## 관련 문서

- [production_config.md](production_config.md) — 프로덕션 설정 표면 감사(Required/Optional/Development Only 분류, 필수값 누락 시 fail-fast 부재)
- [../route_index.md](../route_index.md) — AI 컨텍스트 라우팅 인덱스(§RELEASE/DEPLOY가 이 문서를 권위로 지목)
- [data_sop.md](data_sop.md) — Migration/Backup/Restore
- [monitoring.md](monitoring.md) — 배포 후 상태 확인
- [../workflow.md](../workflow.md) — 출시 전 체크리스트, Step 6(Documentation Update)과의 관계
- [../../status/required_human_resource.md](../../status/required_human_resource.md) — 인간만 수행 가능한 단계(프로덕션 TLS, 스토어 등록 등)의 권위 문서

---

# Change Log

- **2026-07-22** — 최초 작성(뼈대만 — 실제 절차는 대부분 미수립 상태를 그대로 기록). Docs Revision(SSOT 정리) 작업의 일부.
- **2026-09-14** — TASK-007 SSOT 동기화: "배포 파이프라인 없음"(Status: Not Started, 0%) 기술을 정정. 실제 파이프라인(compile_release.sh / run_release.sh / server_deploy.sh) 기록, Flutter Web + Apache 정적 서빙에 따른 --dart-define 시크릿 공개 노출 결과, current 심볼릭 링크 롤백 절차 추가. DevDocs Update Required.
- **2026-09-14** — Owner 결정 D-003(CORS)/D-004(서빙 경로) 반영: `## CORS` 절 신설(allow-list/exact-match/wildcard 금지/apex redirect-only/`*` footgun/등록 순서, `app.ts`/`env.ts`/`FastifyDefinition.ts` 라인 인용). `run_release.sh`의 `.pe`→`.pem` 오타가 TASK-012에서 이미 수정됐음을 반영(더 이상 결함으로 기술하지 않음)하고 Development Only로 확정. Build→Deploy→Migration→Start/Reload→Smoke Test 5단계 절 신설. Rollback SOP를 프런트엔드/백엔드/DB 세 갈래로 재구성하고 DB는 forward-fix 정책(순방향 전용, DOWN 스크립트 없음, 코드 롤백≠스키마 롤백)으로 명시. PM2 미연동·releases pruning 부재 두 공백을 명시적으로 기록. `Route.md`와의 관계 절을 `docs/docs/route_index.md` 이전 사실에 맞게 재작성(`route_index.md`와의 관계로 개명). Progress 40%→55%.
