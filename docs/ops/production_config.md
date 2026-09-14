# Production Configuration — 설정 항목 지도 (Config Surface Audit)

> **Status**: Audited (static analysis only — 서버 기동/DB 연결/실패 재현은 수행하지 않았다) · **Progress**: 100%(정적 분석 범위 내) · **Last Updated**: 2026-09-14 · **Next Milestone**: `schema.required` 확장 여부에 대한 Owner 결정(별도 태스크), Smoke Test에 인증+DB 경유 요청 포함 여부 확정

이 문서는 LingOn 프로덕션의 **설정 표면(configuration surface)** 전체를
정적 코드 분석만으로 지도화한다. "무엇을 읽는가", "기본값이 있는가",
"없으면 실제로 무슨 일이 일어나는가"를 항목별로 기록한다. **서버를
실행하거나 DB에 연결하거나 실패를 재현하지 않았다** — 모든 결론은
소스 코드를 직접 읽고 인용한 라인에 근거한다.

## 분류 정의 (Classification)

- **Required** — 이 값 없이는 프로덕션이 실제로 올바르게 동작하지 않는다.
  다만 "동작하지 않는다"가 **기동 시점에 실패**하는지, **요청 시점에
  실패**하는지는 항목마다 다르다 — 이 구분이 아래 "fail-fast 여부" 절의
  핵심이다.
- **Optional** — 안전한 기본값이 있거나, 없으면 해당 기능만 비활성화된
  상태로 우아하게 저하(degrade)된다.
- **Development Only** — 로컬/테스트 용도로만 존재하며 프로덕션에서는
  설정하거나 의존해서는 안 된다.

---

## 설정 항목 표

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

| Item | Read at (file:line) | Default | Class | 없으면 무슨 일이 일어나는가, 언제 |
|---|---|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `lingon/src/db/pool.ts:23-31` | 없음(`DB_PORT`만 `?? 5432`) | **Required** | `@fastify/env` 스키마에 전혀 없음 — `pg.Pool`은 **lazy**라서 import 시점에 연결을 열지 않는다(`pool.ts:23-31`). 기동은 항상 성공한다. 잘못되거나 없으면 **최초 쿼리 시점**(요청 단위)에 실패 — 로그인, `request_logs` INSERT, BYOK 등 DB를 만지는 모든 요청이 500. `pool.on('error', ...)`(`pool.ts:36-38`)는 `console.error`만 하고 프로세스를 죽이지 않는다. |
| `JWT_SECRET` | `lingon/src/core/utils/Jwt.ts:28-32` (`getSecret()`) | 없음 | **Required** | `@fastify/env` 스키마에 없음. `sign()`(`Jwt.ts:34-40`)과 `verify()`(`Jwt.ts:42-68`) 양쪽에서 호출되는 `getSecret()`이 `if (!secret) throw new Error('JWT_SECRET is not configured')`(`Jwt.ts:30`)를 던진다. 기동은 성공하고, **최초 로그인(토큰 발급) 또는 최초 인증 요청(토큰 검증) 시점**에 500. |
| 리프레시 토큰 TTL — `ACCESS_TTL_SECONDS` / `REFRESH_TTL_SECONDS` | `lingon/src/core/utils/Jwt.ts:23-24`(정의), `Jwt.ts:82`/`Jwt.ts:98`(`issueAccessToken`/`issueRefreshToken` 내 `exp` 계산), `lingon/src/route/LingOnAuth.ts:221`,`347`, `lingon/src/route/LingOnSession.ts:109`(refresh_tokens `expires_at` 계산) | 코드에 하드코딩 — Access 1시간, Refresh 30일 | **해당 없음(설정 항목이 아님)** | **환경변수가 존재하지 않는다.** `ACCESS_TTL_SECONDS = 60 * 60`, `REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60`(`Jwt.ts:23-24`)로 소스에 상수로 박혀 있다. 토큰 수명을 바꾸려면 **코드 수정 + 재배포**가 필요하다 — 설정으로는 바꿀 수 없다. 이것은 결함 수정 대상이 아니라 이 감사의 **발견 사항**으로만 기록한다. 관련: OAuth 라운드트립 쿠키(`x_auth_platform`/`x_calendar_user_id`)의 `maxAge: 600`(10분)도 동일하게 하드코딩(`LingOnAuth.ts:102`, `LingOnAuth.ts:409`). |
| `MASTER_ENCRYPTION_KEY` | `lingon/src/db/encrypt.ts:14-23`(`getKey()`) | 없음 | **Required** | `@fastify/env` 스키마에 없음. `encrypt.ts:7-12` 문서화 주석대로 이 키는 **매 encrypt/decrypt 호출마다** 다시 읽힌다(핫 리로드로 키 교체를 지원하려는 설계). `hex.length !== 64`면 `Error('MASTER_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ...')`(`encrypt.ts:16-20`)를 던진다. 기동은 성공하고, **최초 BYOK 키 저장/조회 또는 최초 Google 토큰 암복호화 시점**에 500. 형식: 정확히 64자 hex = 32바이트, AES-256-GCM. **`JWT_SECRET`과는 다른 키**다 — 목적과 값이 완전히 분리되어 있다. |
| Google OAuth — `GOOGLE_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `GOOGLE_CALENDAR_CALLBACK_URL` | 스키마: `lingon/src/app.ts:26-30` (모두 `default: ''`) · 조건부 등록: `lingon/src/plugins/LingOnOAuth/GoogleOAuth.ts:74-123` · 501 반환: `lingon/src/route/LingOnAuth.ts:249-255`,`284-286`,`388-394`,`432-434` | `''`(전부) | **Optional**(각 플로우 단위로 없으면 비활성화) | `@fastify/env`는 기본값이 있어 실패하지 않음. `GoogleOAuth.ts:82`가 로그인용 3종(`GOOGLE_CLIENT_ID`+`GOOGLE_CLIENT_SECRET`+`GOOGLE_CALLBACK_URL`) 중 하나라도 없으면 `app.googleOAuth2`를 등록하지 않고 경고 로그만 남긴다(`GoogleOAuth.ts:82-97`); Calendar용 3종(`GOOGLE_CLIENT_ID`+`GOOGLE_CLIENT_SECRET`+`GOOGLE_CALENDAR_CALLBACK_URL`)도 동일 패턴(`GoogleOAuth.ts:99-109`). **라우트 코드에서 직접 확인함**: `LingOnAuth.ts:249`(`if (!app.googleOAuth2)`)→`252`에서 501, `LingOnAuth.ts:284-286`도 501, Calendar 쪽 `LingOnAuth.ts:388-394`,`432-434`도 501 — `FastifyDefinition.ts:96-109`의 타입 주석("Routes check for presence... return 501")뿐 아니라 실제 라우트 핸들러에서도 확인됨. `GOOGLE_ANDROID_CLIENT_ID`는 `POST /v1/auth/google`의 idToken 검증 경로에서만 쓰이며 없어도 Web 클라이언트 ID만으로 동작(둘 중 하나만 있으면 됨). |
| `WEB_CALLBACK_URL` | 스키마 `lingon/src/app.ts:31`, 소비 `lingon/src/route/LingOnAuth.ts`(redirect flow — 브라우저 클라이언트에 `#token=...&refresh_token=...`으로 전달) | `''` | **Optional**(redirect flow 사용 시 사실상 필수) | 스키마 기본값이 있어 기동은 항상 성공. 비어 있으면 redirect flow 완료 후 리다이렉트할 목적지가 없어 해당 플로우가 실질적으로 동작하지 않는다 — Web 클라이언트가 OAuth redirect flow를 쓰지 않는다면(ID Token flow만 사용) 영향 없음. |
| `ANDROID_CALLBACK_URL` | 스키마 `lingon/src/app.ts:32`, 소비 `lingon/src/route/LingOnAuth.ts`(Android 딥링크, 예: `lingon://auth/callback`) | `''` | **Optional**(redirect flow 사용 시 사실상 필수) | 위와 동일한 성격 — Android가 OAuth redirect flow를 쓸 때만 필요. |
| `CORS_ALLOWED_ORIGINS` | 스키마 `lingon/src/app.ts:34`, 소비 `lingon/src/app.ts:176-189` | `'https://www.ling-on.com'` | **Optional**(기본값이 곧 프로덕션 정책값) | 명시적 exact-match allow-list(comma-separated), 와일드카드 금지, `Origin` 헤더 없는 요청(Android, 서버 간 호출)은 항상 허용. 메커니즘과 실제 배포 값의 근거·워크드 예시는 이 문서에서 재설명하지 않는다 — [deployment_sop.md](deployment_sop.md)의 CORS 관련 절을 참고(Owner Decision D-003, 2026-09-14 DECIDED). |
| 퍼블릭 프런트엔드 URL(`https://www.ling-on.com` origin) | `CORS_ALLOWED_ORIGINS` 기본값(`app.ts:34`), Apache 서빙 대상(별도 문서 소유) | `'https://www.ling-on.com'` | **Optional**(기본값이 곧 실제 프로덕션 값) | CORS allow-list의 기준값이자 백엔드 콜백 URL들의 기준 origin. Apache/도메인 레벨 설정은 [deployment_sop.md](deployment_sop.md) 소유 범위. |
| 퍼블릭 백엔드 URL / `LINGON_API_BASE_URL` / `--dart-define=API_BASE_URL` | 하드코드: `letmeknow/lib/core/network/api_client.dart:57`(`super.baseUrl = 'https://www.ling-on.com'`) · 미전달: `letmeknow/lib/modules/auth/auth_module.dart:59`(`ApiClient(onUnauthorized: _handleUnauthorized)` — `baseUrl` 인자 없음) · 빌드 스크립트: `letmeknow/compile_release.sh:43-44` | 하드코드 `'https://www.ling-on.com'` | **Dead config(발견 사항)** — `LINGON_API_BASE_URL`은 사실상 **Development Only도 아니고 그냥 inert(무효)** | `compile_release.sh:43-44`는 `LINGON_API_BASE_URL` 환경변수가 있으면 `--dart-define=API_BASE_URL=...`을 Flutter 빌드에 주입한다. 그러나 **Dart 코드 어디에도 이 define을 읽는 코드가 없다.** 직접 재실행해 확인: `grep -rn "fromEnvironment" --include=*.dart .`(`letmeknow/` 루트) → **0건**, `grep -rn "API_BASE_URL" --include=*.dart .` → **0건**(정의된 곳은 `compile_release.sh` 안의 셸 변수 이름뿐이며 `.dart` 파일에는 등장하지 않음). 결론: **백엔드 URL은 `api_client.dart:57`의 컴파일타임 하드코드이며, 빌드 스크립트가 주입하는 `API_BASE_URL` dart-define은 어떤 Dart 코드에도 읽히지 않아 현재 완전히 무효(inert)다.** `auth_module.dart:59`가 `ApiClient(...)`를 `baseUrl` 없이 생성하는 것도 이 하드코드가 실제로 쓰인다는 것을 재확인해 준다. 수정 방안은 이 문서의 범위 밖 — 발견 사항으로만 기록. |
| `OPENWEATHER_API_KEY` + `OPENWEATHER_BASE_URL` | 스키마 `lingon/src/app.ts:24-25`, dotenv 스냅샷 `lingon/src/config/env.ts:18-21` | `''` / `'https://api.openweathermap.org'` | **Required**(기능 단위) | 기동은 항상 성공(스키마 기본값 있음). 비어 있으면 날씨/지오코딩 엔드포인트가 OpenWeather 호출 시 실패(요청 시점). Owner Decision D-001(2026-09-14 DECIDED)에 따라 BYOK 원칙은 LLM 제공자에만 적용되며, OpenWeather처럼 플랫폼이 대는 백엔드 자격증명은 계속 유효하다 — 즉 이 키는 정당하게 플랫폼이 관리하는 프로덕션 시크릿이다. |
| 레거시 `OPENAI_API_KEY` | dotenv 스냅샷 `lingon/src/config/env.ts:23`, 시딩 경로 `lingon/src/plugins/LingOnDataManage/Repositories.ts:14-16` | `''` | **Development Only / Deprecated — 프로덕션에서 의존 금지** | `Repositories.ts:14-16`에서 `cryptoUtil.encrypt()`(`core/utils/Crypto.ts`)로 **Base64 인코딩만** 해서 메모리에 저장한다 — 이는 진짜 암호화가 아니라고 문서화되어 있다(`env.ts:44-45`, `FastifyDefinition.ts:64-66` 양쪽 주석 모두 "NOT secure encryption"이라고 명시). `LLM_OPENAI_API_KEY`가 이 시딩 경로를 대체(supersede)한다(`env.ts:41-48`, `FastifyDefinition.ts:58-67`). 프로덕션에서는 절대 이 경로에 의존해서는 안 된다 — 보안 요구사항 미달. |
| BYOK 암호화 의존 체인(`MASTER_ENCRYPTION_KEY` + DB) | `lingon/src/db/apiKeyRepository.ts:16-26`(`saveApiKey` → `encrypt()` → `pool.query`), `lingon/src/db/encrypt.ts:14-23` | 없음 | **Required**(BYOK 기능 단위) | BYOK 키는 `user_api_keys` 테이블에 AES-256-GCM으로 암호화되어 저장된다(`apiKeyRepository.ts:16-26`, `encrypt.ts:37-44`). 이 경로는 위 두 항목(`DB_*`, `MASTER_ENCRYPTION_KEY`)이 **동시에** 유효해야 동작한다 — 둘 중 하나라도 문제면 BYOK 저장/조회가 요청 시점에 500. |
| LLM 런타임 설정 — `LLM_PLATFORM_ENABLED`, `LLM_DEFAULT_PROVIDER`, `LLM_FALLBACK_PROVIDER`, `LLM_OPENAI_API_KEY`, `LLM_GEMINI_API_KEY`, `LLM_OPENAI_BASE_URL`, `LLM_GEMINI_BASE_URL`, `LLM_REQUEST_TIMEOUT_MS` | 스키마 `lingon/src/app.ts:35-42`, dotenv 스냅샷 `lingon/src/config/env.ts:34-60`, 타입 `FastifyDefinition.ts:52-82` | `'false'` / `'openai'` / `''` / `''` / `''` / `'https://api.openai.com'` / `'https://generativelanguage.googleapis.com'` / `'60000'` | **Optional**(기본값 = BYOK-only, off) | 전부 기본값이 있어 기동은 항상 성공. Owner Decision D-001(2026-09-14 DECIDED)에 따라 Closed Alpha에서 BYOK가 LLM 제공자의 주 지원 경로이며 `LLM_PLATFORM_ENABLED`는 기본 `'false'`다. `LLM_OPENAI_API_KEY`/`LLM_GEMINI_API_KEY`는 **기본적으로 꺼져 있는(off-by-default)** 플랫폼 자격증명이며, `LLM_PLATFORM_ENABLED=true`일 때만 읽힌다(`FastifyDefinition.ts:52,60,71`). |
| `PORT` | 스키마 `lingon/src/app.ts:20`(`required`),`22`(default), 소비 `lingon/src/app.ts:258` | `'4444'` | **해당 없음(항상 기본값이 적용됨)** | `schema.required`에 이름은 올라 있지만 `default: '4444'`가 있어 **실제로는 절대 실패하지 않는다** — `@fastify/env`는 값이 없으면 기본값을 채운 뒤 required 검사를 통과시킨다. |
| `HOST` | 스키마 `lingon/src/app.ts:20`(`required`),`23`(default), 소비 `lingon/src/app.ts:258` | `'127.0.0.1'` | **해당 없음(항상 기본값이 적용됨)** | `PORT`와 동일 — 이름은 `required` 배열에 있지만 기본값이 있어 실질적으로 항상 통과. 참고: 기본값 `127.0.0.1`은 루프백이므로, 프로덕션에서 외부 트래픽을 받으려면 리버스 프록시(Apache 등) 뒤에서 이 기본값 그대로 두거나 `0.0.0.0`으로 명시적으로 바꿔야 한다 — 어느 쪽이 실제 배포 값인지는 이 문서의 범위 밖(`deployment_sop.md` 소유)이다. |
| `LOG_LEVEL` | 스키마 `lingon/src/app.ts:33`, 소비 `lingon/src/core/utils/Logger.ts`(`appLogger.LOG_LEVEL`) | `'info'` | **Optional** | 기동은 항상 성공. 없으면 `info` 레벨로 로깅 — 기능적 실패 없음, 로그 상세도만 달라짐. |
| 프로덕션 모드 플래그(`NODE_ENV` 등) | 해당 없음 | 해당 없음 | **존재하지 않음(발견 사항)** | `grep -rn "NODE_ENV" lingon/src/` 결과 **0건** — `lingon/src/` 전체에 `NODE_ENV`를 읽는 코드가 없다. 즉 **개발/프로덕션을 구분하는 런타임 모드 플래그 자체가 존재하지 않는다.** `lingon/package.json`의 스크립트는 `dev: "tsx watch src/app.ts"`(소스 직접 실행), `build: "tsc -p tsconfig.json"`, `start: "node dist/app.js"`(빌드 산출물 실행)로 구분되어 있으나, 실제 프로덕션 배포가 `npm run start`(즉 `dist/app.js`)로 기동되는지 `npm run dev`로 기동되는지는 이 저장소의 정적 코드만으로는 **미확정(undetermined)** — 배포 스크립트(`lingon/server_deploy.sh`, `server_init.sh`, 다른 워커 소유)를 확인해야 한다. |

---

## 필수 설정 누락 시 실제로 무슨 일이 일어나는가 (fail-fast 여부)

이 절이 이 문서에서 가장 중요한 결론이다.

1. **`@fastify/env`의 `schema.required`는 `['PORT', 'HOST']` 두 개뿐이다**
   (`lingon/src/app.ts:20`). 그리고 그 둘 다 `default` 값이 있다(`PORT`
   `'4444'`, `HOST`
   `'127.0.0.1'` — `app.ts:22-23`). `@fastify/env`는 값이 비어 있으면
   먼저 기본값을 채운 뒤 `required` 검사를 하므로, **환경변수가 하나도
   설정되지 않은 상태에서도 이 검사는 절대 실패하지 않는다.**
   `app.ts:16`의 주석("If any `required` key is missing, Fastify
   aborts before accepting connections.")은 문자 그대로는 맞지만, 실제
   required 집합이 이 두 개뿐이고 둘 다 기본값이 있어 **실질적으로는
   결코 발동하지 않는 안전장치**라는 점이 이 감사의 핵심 발견이다.
2. **`DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`, `JWT_SECRET`,
   `MASTER_ENCRYPTION_KEY`는 `@fastify/env` 스키마에 전혀 존재하지
   않는다.** 이들은 `process.env`에서 **호출 시점에 직접** 읽힌다
   (`pool.ts:23-31`, `Jwt.ts:29`, `encrypt.ts:15`) — Fastify의 env
   검증·기동 절차와는 완전히 무관하다.
3. 따라서 실제 동작은 다음과 같다: **서버는 완전히 잘못 설정된
   상태에서도 정상적으로 기동에 성공하고 "ready"를 보고한다**
   (`app.ts:260-273`의 `lingon ready` 로그 + `server_ready` raw_log는
   `DB_*`/`JWT_SECRET`/`MASTER_ENCRYPTION_KEY`의 유효성과 무관하게 항상
   기록된다 — 단, `server_ready` raw_log 자체가 DB INSERT이므로 `DB_*`가
   잘못되면 이 INSERT는 실패하지만 `catch`(`app.ts:271-273`)로 흡수되어
   서버는 계속 살아있고 `listen`은 이미 완료된 상태다). 실패는 나중에,
   **요청 단위로**, 아래 세 가지 방식으로만 드러난다:
   - `DB_*` 오류 → **첫 쿼리 시점** 500 (로그인, 세팅 조회, BYOK, 요청
     로깅 등 DB를 만지는 모든 엔드포인트)
   - `JWT_SECRET` 미설정 → **첫 로그인(서명) 또는 첫 인증 요청(검증)
     시점** 500
   - `MASTER_ENCRYPTION_KEY` 미설정/형식 오류 → **첫 BYOK 저장/조회 또는
     첫 Google 토큰 암복호화 시점** 500
   - (예외) Google OAuth 미설정 → 요청 시점에 500이 아니라 **501**로
     저하(위 표의 Google OAuth 행 참고)
4. **운영상 결론(한 문장)**: "프로세스가 떠 있는가 / 포트가 응답하는가"만
   확인하는 헬스체크는 완전히 잘못 설정된 배포도 "정상"으로 판정한다 —
   그러므로 스모크 테스트는 반드시 **인증을 거치고 DB를 실제로 만지는
   요청**을 포함해야 한다. 이 스모크 테스트 단계 자체의 설계는
   [deployment_sop.md](deployment_sop.md)의 Smoke Test 절(다른 워커
   작성/소유)을 참고 — 여기서는 재설계하지 않는다.
5. **범위의 한계(명시적으로 하지 않는 것)**: 이 문서는 새로운 설정
   프레임워크를 제안하지 않는다. `schema.required`를 넓혀 `DB_*` /
   `JWT_SECRET` / `MASTER_ENCRYPTION_KEY`를 fail-fast하게 만드는 것은
   **백엔드 저장소(`lingon/`) 코드 변경이며 별도 태스크와 Owner 결정이
   필요하다** — 값을 하나라도 비워 둔 채 돌고 있는 기존 배포가 그 즉시
   기동 실패로 바뀌는 파급 효과가 있기 때문이다. 이 문서는 그 코드를
   작성하지 않으며, 새 태스크 파일도 만들지 않는다 — 격차를 기록하는
   것으로 범위를 한정한다.

---

## Frontend configuration — 시크릿 제로 원칙

프런트엔드(`letmeknow`)는 Flutter Web으로 빌드되어 Apache가 정적으로
서빙하는 번들이다. **모든 `--dart-define` 값은 서빙되는 JS(및 wasm)
안에 평문으로 존재하며 누구든 읽을 수 있다.** 이것이 프런트엔드 설정
표면 전체를 지배하는 규칙이다: **프런트엔드 설정에는 어떤 시크릿도
있을 수 없다, 예외 없이.**

- `letmeknow/compile_release.sh:57-101`(`assert_no_secret_defines()`,
  `:103`에서 호출)은 이 규칙을 빌드 단계에서 강제한다: `--dart-define`
  이름이 `*API_KEY*|*SECRET*|*TOKEN*|*PASSWORD*|*PRIVATE_KEY*`
  패턴에 매칭되거나, 값이 `sk-`로 시작하거나, `OPENAI_API_KEY` /
  `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `GOOGLE_API_KEY` 환경변수가
  하나라도 설정되어 있으면 빌드를 **거부(`err` → `exit 1`)**한다.
- 현재 이 배열에 실제로 추가되는 유일한 define은
  `--dart-define=API_BASE_URL=${LINGON_API_BASE_URL}`(
  `compile_release.sh:43-44`, `LINGON_API_BASE_URL`이 비어있지 않을 때만)
  뿐이며, 이것은 시크릿이 아니라 백엔드 URL이다 — 그런데 위 표에서
  기록했듯 **이 값을 읽는 Dart 코드가 존재하지 않는다.**
  `grep -rn "fromEnvironment" --include=*.dart .` → 0건,
  `grep -rn "API_BASE_URL" --include=*.dart .` → 0건(`letmeknow/` 루트
  기준, 직접 재실행하여 확인). 실제로 쓰이는 값은
  `letmeknow/lib/core/network/api_client.dart:57`의 하드코드
  `'https://www.ling-on.com'`이며, `auth_module.dart:59`가 `ApiClient`를
  `baseUrl` 인자 없이 생성하는 것이 이를 뒷받침한다. `LINGON_API_BASE_URL`
  은 현재 **inert**(전달되지만 아무도 읽지 않음) — 수정안은 이 문서의
  범위 밖이며 발견 사항으로만 기록한다.

---

## Maintenance — 이 문서를 최신으로 유지하는 규칙

**Three-file rule**: 백엔드에 환경변수를 하나 추가하려면 **세 파일**을
동시에 고쳐야 한다 —

1. `lingon/src/app.ts`의 `schema.properties`(+ 필요 시 `schema.required`)
2. `lingon/src/config/env.ts`의 dotenv 스냅샷(Fastify 등록 전 코드에서
   쓰는 경우)
3. `lingon/src/config/FastifyDefinition.ts`의 `FastifyInstance.config`
   타입 — 이걸 빼먹으면 `app.config.X`가 타입체크를 통과하지 못한다.

세 파일 중 하나라도 빠지면 타입 오류(3번 누락) 또는 런타임에서 값을
읽을 수 없는 상태(1·2번 누락)가 된다. **이 문서(`production_config.md`)
는 설정 항목이 추가·삭제·기본값 변경될 때마다 함께 갱신되어야 한다** —
그렇지 않으면 이 문서가 코드보다 stale해진다.

---

## 관련 문서

- [deployment_sop.md](deployment_sop.md) — 배포 파이프라인, CORS 실제
  운영값과 워크드 예시(Owner Decision D-003), Smoke Test 단계
- [data_sop.md](data_sop.md) — Migration/Backup/Restore, DB 스키마
- [../policies/security_policy.md](../policies/security_policy.md) —
  암호화·시크릿 취급 정책 전반
- [../workflow.md](../workflow.md) — 개발 SOP 전체 흐름

---

# Change Log

- **2026-09-14** — 최초 작성. 정적 코드 분석으로 백엔드(`lingon/`)
  `@fastify/env` 스키마 및 스키마 밖 설정(`DB_*`, `JWT_SECRET`,
  `MASTER_ENCRYPTION_KEY`), 프런트엔드(`letmeknow/`) 백엔드 URL/시크릿
  가드를 전수 조사. fail-fast 부재, `NODE_ENV` 부재, `API_BASE_URL`
  dart-define inert 상태를 발견 사항으로 기록.
