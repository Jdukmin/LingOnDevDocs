# SSOT State Sync — Backend (TASK-007)

> Companion report: [../frontend/2026-09-14-ssot-state-sync.md](../frontend/2026-09-14-ssot-state-sync.md)
> (frontend half of the same pass — toolchain baseline, `lib/` tree correction,
> client-emitted error codes).
>
> Governed by [../../CLAUDE.md](../../CLAUDE.md) "Verification Report Rule".
> Assessed against `docs@36cd588`, `letmeknow@ad08414`, `lingon@dd38b22`.

## 변경 목적

`docs/` SSOT의 backend 계약 문서가 실제 스키마/구현과 어긋난 지점을 정정하고,
그 근거를 실행된 명령 출력과 `file:line`으로 고정한다. 모든 항목의 분류는
**DevDocs Update Required** — 구현이 아니라 문서가 뒤처져 있었다.

가장 중요한 한 건: `backend/docs/database/users.md`가 문서화한 스키마
(`id uuid PK`, 기본값 없음)로 데이터베이스를 만들면 **애플리케이션이 기동조차
하지 못한다**. `userRepository.ts:72`(`create()`)와 `:138`
(`upsertByProvider()`)의 `INSERT` 컬럼 목록에 `id`가 없으므로, 서버측 기본값이
없으면 모든 로그인 `INSERT`가 `id` NOT NULL 위반으로 실패한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/docs/database/users.md` | `id` → `uuid PK, DEFAULT gen_random_uuid()`. `created_at`/`updated_at` → `NOT NULL DEFAULT NOW()`. UNIQUE 제약의 정확한 이름 `users_provider_provider_id_key` 명시 |
| `backend/docs/database/ai_settings.md` | `model` `text` → `varchar(64) NOT NULL`. `temperature`/`max_tokens` `NOT NULL`. 제목의 "(inferred — no migration file)" 제거 |
| `backend/docs/database/ui_settings.md` | `theme`/`language` `text` → `varchar(20) NOT NULL`. `chk_ui_settings_theme` CHECK 제약 추가. 제목의 "(inferred)" 제거 |
| `backend/docs/database/request_logs.md` | `provider`/`operation`/`user_id` nullable 명시, 나머지 컬럼 `NOT NULL` 명시 |
| `backend/docs/database/raw_logs.md` | `level`/`source` nullable, `event` `NOT NULL` 명시 |
| `backend/docs/database/user_api_keys.md` | 제목의 "(inferred — no migration file)" 제거. `NOT NULL`/기본값/복합 PK `(user_id, provider)` 명시. **`lingon/CLAUDE.md:325-333`와의 충돌 5건을 비교표로 기록**(해결이 아니라 기록 — 해당 파일은 backend 저장소 소유) |
| `backend/docs/database/README.md` | "마이그레이션 파일이 존재하지 않는다"는 전제 문단 정정. "각 테이블을 실제로 쓰는 곳" 절 신설. `usage_logs` 기술 정정. `updated_at` `timestamp`/`timestamptz` 문서 내부 불일치 신규 기록 |
| `backend/docs/api/weather.md` | `## Errors` 절 신설 — `error.code` 표 11행(SSOT 최초). Rate limit 기술 정정 |
| `docs/policies/error_policy.md` | 429 행의 "envelope 형태 미문서화 — 확인 필요" 정정. Client-emitted `RouteException` 코드 표 신설 |

본 저장소 밖(`letmeknow/`, `lingon/`)의 파일은 **한 건도 변경하지 않았다** —
`docs/CLAUDE.md`의 "Never modify source code from this repository" 규칙. 증거는
"테스트 결과" 절의 `git status` 대조.

## 영향 분석

| 항목 | 문서(기존) | 실제 | 근거 | 영향 |
|---|---|---|---|---|
| `users.id` | `uuid PK`, 기본값 없음 | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | `src/db/userRepository.ts:72`, `:138`(`INSERT` 컬럼 목록에 `id` 없음) · `migrations/000_baseline_schema.sql` | **치명적**. 문서대로 만든 스키마에서는 로그인이 전부 실패한다. `gen_random_uuid()`는 PostgreSQL 13+ 내장(pgcrypto 불필요) |
| `users.created_at`/`updated_at` | `timestamptz` | `timestamptz NOT NULL DEFAULT NOW()` | 동일 `INSERT` 컬럼 목록에 없음 | 기본값 없으면 동일하게 INSERT 실패 |
| `ai_settings.model` | `text` | `varchar(64) NOT NULL` | `migrations/000_baseline_schema.sql` · `migrations/004_fix_settings_schema.sql` 주석(라이브 컬럼을 의도적으로 미변경) | 64자 초과 모델 식별자가 런타임에 절단/거부됨 — 문서만 보면 예측 불가 |
| `ui_settings.theme`/`.language` | `text` | `varchar(20) NOT NULL` + `CHECK (theme IN ('system','light','dark'))` | 동일 | 허용값 집합이 문서에 없었다 |
| `request_logs.provider`/`.operation` | nullability 미기재 | nullable | `src/plugins/LingOnDataManage/RequestLog.ts`가 `?? null`로 공급(비게이트웨이 라우트) | `NOT NULL`로 만들면 `/v1/status` 등 모든 비게이트웨이 요청의 로그 INSERT가 실패 |
| `raw_logs.level`/`.source` | nullability 미기재 | nullable | `src/core/utils/Logger.ts` `saveRawLog`가 `?? null`로 삽입 | 동일 |
| `request_logs`/`raw_logs` 기록 주체 | 저장소 없음(표에만) | `Logger.ts` + `RequestLog.ts` `onResponse` 훅 | `src/db/`에 해당 repository 파일 부재 | 독자가 `src/db/`를 뒤지다 실패하던 문제 — README에 명시 |
| `usage_logs` | "계획 단계, 테이블 없음" | 라이브 DB에 **존재**, 쓰는 코드는 **없음** | `migrations/000_baseline_schema.sql` 헤더(의도적 제외) | 열린 발견으로 기록. 스키마 문서는 만들지 않았다 — 아무도 결정하지 않은 것을 계약으로 굳히지 않는다 |
| `updated_at` 타입 | — | `ai_settings`/`ui_settings`/`user_api_keys`는 `timestamp`, 그 외는 `timestamptz` | baseline이 문서를 문자 그대로 따름 | 문서 내부 불일치. 코드가 인라인 `NOW()`를 쓰므로 양쪽 다 동작 → **타입을 바꾸지 않고** 열린 항목으로만 기록 |
| `/v1/weather/*` `error.code` | 표 없음(산문에 `BAD_REQUEST`만) | 11개 코드 | 아래 표 | Frontend가 `error.code`로 분기하도록 정한 공통 규칙을 지킬 근거가 없었다 |
| 429 envelope | "미문서화 — 확인 필요" | `RATE_LIMITED`/429/ICD v0.0 | `src/app.ts:192-197` | 2026-07-22 라이브 curl 검증으로 이미 확정된 사항이 문서에 반영 안 됨 |

### 추가된 `error.code`(weather) 도출 근거

`BAD_REQUEST`(`LingOnWeather.ts:143`, `:191`, `:197`; `BaseGateway.ts:222`,
`:226`, `:230`, `:243`) · `OP_NOT_SUPPORTED`(`OpenWeatherAPI.ts:63`) ·
`RATE_LIMITED`(`app.ts:192`) · `PROVIDER_HTTP_ERROR`(`BaseGateway.ts:294`) ·
`PROVIDER_NETWORK_ERROR`(`BaseGateway.ts:364`) ·
`PROVIDER_KEY_MISSING`(`BaseGateway.ts:113`, `:134`) ·
`PROVIDER_KEY_INVALID`(`BaseGateway.ts:123`) · `INTERNAL`(`LingOnWeather.ts:212`).
전부 `AppError.plugin`의 `setErrorHandler`(`AppError.ts:46-70`)를 통해 ICD v0.0
envelope으로 나간다.

### Version / ChangeLog 영향 — **없음(의도적)**

`docs/CLAUDE.md` "Version 관리": 문서만 바뀌고 계약이 바뀌지 않으면 version을
올리지 않는다. 위 정정은 전부 **문서를 구현에 맞춘 것**이므로 계약 변경이
아니다. 또한 근거가 되는 코드(`migrations/000_baseline_schema.sql` 등)는 전부
**커밋되지 않은 작업 트리 상태**이며, `version/frontend.json`의
`known_discrepancy`가 세운 선례("Version 관리 rule requires actual committed
implementation, and uncommitted working-tree code doesn't qualify")에 따라
version bump 대상이 아니다. 따라서 `version/*.json`과 `changelog/*.md`는
**한 글자도 변경하지 않았다**.

보류 중인 bump(커밋 이후에만 유효): backend Patch `0.1.0` → `0.1.1`
(`migrations/000_baseline_schema.sql` + 001/004/005의 조건부 가드).

## 테스트 결과

이 저장소에는 실행할 소스가 없다. 아래는 **실제로 실행한 명령과 그 출력**이며
mock이 아니다. 실행 일자: 2026-09-14, 이 머신.

| 명령 | 결과 |
|---|---|
| `cd lingon && ./node_modules/.bin/tsc -p tsconfig.json --noEmit` | **exit 0, 출력 없음** — clean |
| `cd lingon && npm audit` | **7 vulnerabilities (2 low, 2 moderate, 3 high)**. high: `brace-expansion` 2.0.0–2.1.3, `fast-uri` 3.0.0–3.1.5, `find-my-way` ≤9.6.0(Fastify 자체 라우터, HTTP/2 DDoS). moderate: `fastify` ≤5.12.0, `qs`. → TASK-008 |
| Backend 자동 테스트 | 검증 기준점(`dd38b22`)에서 **0건** — `package.json`에 `test` 스크립트 없음 |

문서 검증(빌드가 없으므로 이것이 evidence):

- 본 보고서와 편집된 문서에 등장하는 모든 `file:line` 인용을 `sed -n '<line>p'`로
  개별 확인했다. 1건 교정: rate-limit `max` 수식은 `src/app.ts:183`이 아니라
  `:182`(`:183`은 `keyGenerator`) — 발행 전 정정.
- 모든 상대 링크 대상 파일의 존재를 확인했다.
- 편집한 문서를 전부 재독해 내부 모순이 남지 않았음을 확인했다(예: 서두는
  "마이그레이션 없음"인데 본문은 마이그레이션을 인용하는 상태 → 해소).

소스 저장소 무변경 증거 — 이 작업 시작 시점 스냅샷과 종료 시점 `git status`
대조(`node_modules` 제외):

```
$ git -C lingon status --porcelain | grep -v node_modules
 M CLAUDE.md
 M migrations/001_rename_provider_sub_to_provider_id.sql
 M migrations/004_fix_settings_schema.sql
 M migrations/005_fix_user_api_keys_schema.sql
 M src/app.ts
 M src/config/FastifyDefinition.ts
 M src/config/env.ts
?? migrations/000_baseline_schema.sql
?? migrations/README.md
```

이 목록은 **이 작업 이전부터 존재하던 항목**(TASK-001~004의 미커밋 결과물)이며
본 패스가 추가한 항목은 없다. 작업 도중 5건이 새로 나타났다 —
` M package.json`, ` M tsconfig.json`, `?? tests/`, `?? tsconfig.test.json`은
**동시 진행 중인 TASK-006**(backend 테스트 하네스)의 산출물이고,
` M package-lock.json`은 의존성 업그레이드(esbuild `0.27.3` → `0.28.2` 등)로
다른 오케스트레이터의 `npm install`/`npm audit fix` 결과다(TASK-008 추정).
본 패스가 `lingon/`에 실행한 것은 읽기 전용뿐이다 — `cat`/`sed`/`grep`,
`tsc --noEmit`, `npm audit`. 셋 다 lockfile을 다시 쓰거나 의존성을 올리지
않는다(`npm audit`은 보고만 한다).

> **따라서 위 `npm audit` 수치(3 high / 2 moderate / 2 low)는 본 패스가 실행한
> 시점 기준이다.** TASK-008의 업그레이드가 반영되면 값이 달라지므로, 인용하지
> 말고 다시 실행해서 확인할 것.

## 남은 문제

1. **`usage_logs`** — 라이브 DB에 존재하나 쓰는 코드가 없다. 삭제할지, 구현할지
   결정이 필요하다. 결정 전까지 스키마 문서를 만들지 않는다. (P3)
2. **`updated_at` 타입 불일치** — `timestamp` 3개 테이블 vs `timestamptz` 4개.
   현재 동작에는 문제가 없으나 통일 여부가 미결. (P3)
3. **`lingon/CLAUDE.md:325-333` 충돌 — 1건이 아니라 5건**:
   `id bigserial PK`(SSOT: `id` 컬럼 없음), `user_id FK → users.id`(SSOT:
   `text`, FK 없음), `provider varchar`(SSOT: `text`), PK가 `id`(SSOT: 복합
   `(user_id, provider)`), `updated_at timestamptz`(SSOT: `timestamp`).
   복합 키가 실제 코드가 요구하는 형태다 — `saveApiKey`의
   `ON CONFLICT (user_id, provider)`가 바로 그 unique 키를 필요로 하고,
   어떤 쿼리도 `id`를 select/order 하지 않는다. 해당 파일은 **backend 저장소
   소유**이므로 이 패스에서 고칠 수 없다. `Route.md` §1 권한 순서상 SSOT가
   우선. backend 저장소 패스에서 정정 필요. (P3)
4. **`migrations/000_baseline_schema.sql`가 미커밋** — 커밋되기 전까지 이
   문서들의 근거는 작업 트리에만 존재한다. 커밋 후 backend Patch bump
   `0.1.0` → `0.1.1`과 ChangeLog 항목을 함께 작성해야 한다.
5. **Backend 자동 테스트 0건** — TASK-006이 `node --test` 하네스를 작업
   트리에 올리는 중이나 미커밋·미검증. 여전히 열린 갭.
6. **`npm audit` high 3건** — TASK-008. `find-my-way`는 Fastify 라우터 본체라
   업그레이드 영향 범위 평가가 필요하다.
7. **실 DB 대조 미수행** — 위 스키마 정정의 근거는 `migrations/` +
   `src/db/`/`Logger.ts` 코드이며, 라이브 PostgreSQL 인스턴스에
   `information_schema` 질의를 던져 대조하지는 않았다. `usage_logs` 존재
   주장은 선행 보고서(`BACKEND_VERIFICATION_REPORT.md` §12)에서 인용한 것이다.
