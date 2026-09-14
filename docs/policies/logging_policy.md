# Logging Policy

> **Status**: Proposed(레벨 정책은 기존 구현 확정, PII 마스킹은 기존 구현 확인, `DEBUG` 레벨은 신규) · **Progress**: 부분 구현(2026-09-14 — `lingon@b5fad88` 기준 5건 credential 유출 수정 완료, redaction 메커니즘 실제 코드로 확인) · **Last Updated**: 2026-09-14 · **Next Milestone**: `DEBUG` 레벨 실제 사용처 도입 시 이 문서 갱신, OPEN-1~4 Owner 결정 시 이 문서 갱신

로그 레벨/PII 마스킹 정책이다. 대부분 `backend/docs/DevelopmentGuide.md`
"Logging"/"Error handling" 절에 이미 문서화된 실제 구현을 그대로 정책화한
것이며, 없는 부분(DEBUG 레벨 등)만 신규로 제안한다.

---

## 로그 레벨

| 레벨 | 의미 | 현재 사용처 |
|---|---|---|
| `FATAL` | 예기치 않은 예외(버그) — `AppError`가 아닌 모든 예외 | `AppError.plugin` 전역 핸들러(`DevelopmentGuide.md` Error handling) |
| `ERROR` | `AppError` 중 5xx(서버/Provider 귀책) | 동일 |
| `WARN` | `AppError` 중 4xx(클라이언트 귀책, 영속화하지 않음) | 동일 |
| `INFO` | 정상 요청 완료(`{latency, userId}`) | `Policy.after()`(`onResponse` 훅, `backend/docs/plugins/policy.md`) |
| `DEBUG` | *(신규 제안)* 상세 진단 정보(외부 API 요청/응답 요약, 캐시 hit/miss 등) | **현재 사용처 없음** — 실제 코드 확인 필요, 이 문서가 최초로 레벨을 예약함 |

레벨 선택 기준: **statusCode ≥ 500 → ERROR, statusCode < 500 → WARN,
AppError 아닌 예외 → FATAL, 정상 응답 → INFO.** 이 기준을 벗어나는 로그를
추가할 때는(예: DEBUG) 반드시 이 표를 먼저 갱신한다.

## 로그 싱크 — 역할 분리

| 싱크 | 내용 | 출처 |
|---|---|---|
| `request_logs` | HTTP 요청/응답 1건당 1행 | `RequestLog.ts`(`onResponse` 훅) |
| `raw_logs` | 서버 lifecycle, 예외, Provider 오류 | `appLogger.saveRawLog(...)` |
| Pino(콘솔/stdout) | 모든 레벨의 실시간 로그 | `req.log`(요청 스코프) / `appLogger`(요청 외부) |

두 DB 싱크를 섞지 않는다(`DevelopmentGuide.md` 원문 규칙) — HTTP 데이터는
`request_logs`에만, lifecycle/예외/Provider 오류는 `raw_logs`에만.

**(2026-09-14 추가) `request_logs`는 실제로 credential이 유출된 적이 있는
싱크다** — 아래 LEAK 1 참조(`req.query`가 redact 없이 그대로 저장되어 살아
있는 JWT/OAuth code가 남았던 사례). Leak-guard 테스트를 작성할 때는 위 세
싱크(`request_logs`, `raw_logs`, Pino) **전부**를 커버해야 하며, 반드시
`logLines.length > 0` 같은 non-vacuous assertion으로 "실제로 그 싱크에 로그가
남았는지"를 먼저 확인한다 — 싱크가 비어 있으면 "민감정보가 없다"는 assertion이
잘못된 이유로 통과한다.

## PII / Secret 마스킹 정책

**절대 로그에 포함하지 않는다** (근거: `DevelopmentGuide.md` Logging 절,
원문 그대로 정책화):

| 항목 | 규칙 |
|---|---|
| `code` / `access_token` / `id_token` / `token` / `state` / `appid` / `apikey` / `api_key` / `key` / `secret` / `password` 쿼리 파라미터 | **(2026-09-14 갱신)** 프로젝트 전역 단일 목록 `REDACTED_QUERY_PARAMS`(11개, `lingon/src/core/utils/Logger.ts:84-87`)가 1차 메커니즘이다 — URL 문자열은 `sanitizeRequestUrl()`(`Logger.ts:97`), 쿼리 객체는 `redactQueryParams()`(`Logger.ts:123`)로 redact한다. `BaseGateway.sanitizeUrl()`은 별도의 gateway 로컬 redaction이며 7개 파라미터만 커버하는 **분리된(divergent)** 목록이다 — 아래 "미결 항목" OPEN-3 참조 |
| `Authorization` 헤더 | 어떤 로그에도 포함 금지. Fastify/pino `redact.paths`가 `req.headers.authorization` / `req.headers.cookie`를 redact하지만(`Logger.ts:276`), 이 커버리지는 `req.headers.*`에만 적용되고 에러 페이로드 내부에 중첩된 `Authorization`에는 적용되지 않는다 — 아래 "Raw Provider/SDK 에러 객체" 규칙 참조 |
| JWT(access/refresh token 원문) | 어떤 로그에도 포함 금지 — `sub`(Google OAuth 검증 후)만 로깅 허용(`backend/docs/services/google-auth.md` Security) |
| 쿠키 | 어떤 로그에도 포함 금지 |
| Google `id_token` / authorization code | 어떤 로그에도 포함 금지(`api/auth.md` Security invariants) |
| `provider_id`(Google `sub`) | HTTP 응답에는 없지만, 로그에도 원문 그대로 남기지 않는 것을 권장(신규 권고 — 기존 문서에 명시 없음) |

### Access Token 저장 금지 (신규 정책 — 기존 관행 재확인)

- Access token은 어떤 DB 테이블에도 저장하지 않는다(Frontend
  `flutter_secure_storage`에만 보관 — 서버는 무상태 JWT 검증만 수행).
- Refresh token은 **SHA-256 해시로만** 저장한다(`database/refresh_tokens.md`) —
  평문은 절대 저장/로깅하지 않는다.
- Google Calendar access/refresh token은 AES-256-GCM으로 암호화 저장한다
  (`database/users.md`) — 이는 "저장 금지"가 아니라 "암호화 저장" 대상이며,
  Refresh Token(해시만 저장)과는 다른 정책임에 주의.

### 공유 redaction 메커니즘 — `Logger.ts` (2026-09-14 신규)

`lingon/src/core/utils/Logger.ts`에 프로젝트 전역에서 재사용하는 단일
redaction 유틸리티가 존재한다. 이제 이것이 쿼리 파라미터/URL/에러 로깅의
1차 SSOT다.

| 함수/상수 | 위치 | 역할 |
|---|---|---|
| `REDACTED_QUERY_PARAMS` | `Logger.ts:84-87` | redact 대상 쿼리 파라미터 11개의 단일 목록: `code`, `access_token`, `id_token`, `token`, `state`, `appid`, `apikey`, `api_key`, `key`, `secret`, `password` |
| `sanitizeRequestUrl(rawUrl)` | `Logger.ts:97` | URL 문자열에서 위 파라미터를 redact. pino `req` serializer(`Logger.ts:216`)와 `AppError.plugin`의 `unhandled_exception` `raw_logs.endpoint`(`AppError.ts:89`)가 공유 — 두 번째 divergent sanitizer가 존재하지 않는다 |
| `redactQueryParams(query)` | `Logger.ts:123` | 쿼리 객체(object) 버전. `AppLogger.saveRequestLog`(`Logger.ts:328`) 내부에서 적용되어 `request_logs.query_params` 컬럼의 단일 choke point가 된다 |
| `projectErrorForLog(err)` | `Logger.ts:169`, 타입 `ProjectedLogError`는 `Logger.ts:162` | **allowlist** 방식 에러 프로젝션 — `{ name, message?, code?, status? }`만 반환. denylist가 아니라 allowlist이므로, 앞으로 어떤 에러 서브타입이 own enumerable property로 무엇을 들고 오든 검토되지 않은 필드가 로그에 새어 들어갈 수 없다. `Error`가 아닌 입력은 `{ name: 'UnknownError' }`. `code`는 `string`/`number`일 때만 복사하고, `status`는 `err.status` 또는 `err.response.status`에서만 가져오며 **`err.response`의 다른 어떤 필드도 건드리지 않는다** |

`projectErrorForLog`는 **항상 `message`를 보존한다**(`Logger.ts:174`,
`{ name: err.name, message: err.message }`). Boom 에러의 경우 이
`message`는 `Response Error: <status> <statusText>` 형태다 — 이것은
**의도된 안전한 동작**이며 오류가 아니다. 향후 이 문서를 읽는 사람이 이를
"고쳐야 할 누락"으로 오해하지 않도록 명시한다.

### pino `redact.paths`의 `*`는 단일-레벨(single-level) wildcard다 — 핵심 기술 사실

현재 설정(`Logger.ts:276`)은 다음과 같다:

```
paths: ['req.headers.authorization', 'req.headers.cookie',
        '*.headers.authorization', '*.headers.cookie']
```

pino의 `*`는 정확히 **한 단계(segment)**만 매칭한다. 즉
`*.headers.authorization`은 `X.headers.authorization`은 redact하지만,
한 단계 더 깊은 `err.config.headers.authorization`은 **redact하지
않는다**. 근거는 `Logger.ts:136-152`의 코드 내 주석에 이미 문서화되어
있다.

**이로부터 도출되는 규칙: `redact.paths`만으로는 충분하지 않다. Provider/SDK
가 만든 raw 에러 객체를 그대로 로깅해서는 안 된다.** 예를 들어 Gaxios는
`GaxiosError`에 outbound request `config`(URL, body, `Authorization`
헤더 포함)를 own enumerable property로 붙이고, pino-std-serializers의
기본 `err` serializer는 own enumerable key를 전부 복사한다 — 그 결과
`{ err }` 형태로 raw `GaxiosError`를 로깅하면 `redact` 설정을 완전히
건너뛰어 살아 있는 Google OAuth `client_secret`, refresh token, Bearer
access token이 `data/log/*.log`와 `raw_logs`에 그대로 기록됐다(아래 LEAK
2, LEAK 3).

### 규칙: raw Provider/SDK 에러 객체를 절대 그대로 로깅하지 않는다 (2026-09-14 신규)

- **절대** `{ err }`(raw `Error`/`GaxiosError`/Boom 에러 등)를 그대로
  `logger.error/.fatal(...)`에 넘기지 않는다.
- 대신 `projectErrorForLog(err)`(에러 객체), `redactQueryParams(query)`
  (쿼리 객체), `sanitizeRequestUrl(url)`(URL 문자열) 중 맞는 것을 사용한다.
- `redact.paths`의 `*`는 1단계만 매칭하는 wildcard이며 **백스톱(backstop)
  이 아니다** — 위 유틸리티를 거치지 않은 에러 객체를 안전하게 만들어주지
  못한다.

### 해결된 Credential 유출 — LEAK 1~5 (2026-09-14, `lingon@b5fad88`에서 수정 완료)

| # | 위치 | 유출 내용 | 수정 |
|---|---|---|---|
| LEAK 1 | `RequestLog.ts`의 `onResponse` 훅(`lingon/src/plugins/LingOnDataManage/RequestLog.ts:40`)이 `req.query`를 그대로 `saveRequestLog`에 전달 | `?access_token=`을 붙인 요청의 살아 있는 LingOn JWT, Google OAuth callback의 authorization code가 `request_logs.query_params`에 평문 저장 | `AppLogger.saveRequestLog` 내부에서 `redactQueryParams()` 적용(`Logger.ts:328`) |
| LEAK 2 | `GoogleTokenService` / `GoogleCalendarAPI`가 raw `GaxiosError`를 로깅 | `config.data`의 `client_secret` + `refresh_token`, `config.headers.authorization`의 살아 있는 Bearer 토큰 | `{ err: projectErrorForLog(err), userId }`로 교체 — `lingon/src/gateway/GoogleTokenService.ts:68`, `lingon/src/gateway/GoogleCalendarAPI.ts:82` |
| LEAK 3 | `LingOnAuth`가 raw Boom 에러를 로깅 | `err.data.res.client._httpMessage._header`에 `Authorization: Basic base64(client_id:client_secret)` | `projectErrorForLog(err)`로 교체 — `lingon/src/route/LingOnAuth.ts:311`, `:457` |
| LEAK 4 | `LingOnWeather`의 4개 라우트가 raw `req.query`를 로깅 | 쿼리 파라미터 원문(redact되지 않은 채) | 각 debug 호출부에서 `redactQueryParams(req.query)` 사용 — `lingon/src/route/LingOnWeather.ts:94`, `:119`, `:144`, `:171`. 백엔드 테스트 #68("weather query log redaction — all four routes redact at their own debug call site")이 이를 고정(pin)한다 |
| LEAK 5 | `AppError.plugin`의 `raw_logs.endpoint`, `app.ts`의 `unhandledRejection` `{ reason }` | 미redact URL(OAuth `code`/`state` 포함), raw `reason` 객체 | `AppError.plugin`은 `endpoint: req.url ? sanitizeRequestUrl(req.url) : null`(`lingon/src/core/utils/AppError.ts:89`); `app.ts`는 `{ reason: projectErrorForLog(reason) }`(`lingon/src/app.ts:73`) — `app.ts:67`의 코드 내 주석대로 `reason`은 `err` 키 밑에 있지 않아 pino 표준 에러 serializer가 아예 동작하지 않았던 점도 원인 중 하나였다 |

### Correlation ID 통합 (2026-09-14)

`app.ts`가 `requestIdHeader: 'x-request-id'`와 `genReqId: () =>
randomUUID()`를 설정하고(`lingon/src/app.ts:124-125`), `RequestContext`가
`req.id`를 그대로 재사용한다(`lingon/src/plugins/LingOnDataManage/RequestContext.ts:23`,
근거는 `:12-13`). 그 결과 pino의 `reqId`, `request_logs.req_id`,
`raw_logs.reqId`가 **하나의 동일한 id**를 공유한다. 이전에는 이 셋이
서로 무관한 값이어서 pino 로그 한 줄을 DB 행과 join할 방법이 없었다.
자세한 내용은 [../ops/monitoring.md](../ops/monitoring.md) 참조.

## 확인이 필요한 부분 (Docs Revision 과정에서 발견)

- ~~Fastify의 기본 요청 로거(pino-http 계열)가 활성화되어 있다면
  `Authorization` 헤더를 기본 설정으로 로깅할 수 있다 — 이 저장소에는 실제
  코드가 없어 Fastify 로거 설정(`app.ts`)이 헤더를 명시적으로 redact하는지
  확인할 수 없었다.~~ **해결 (2026-09-14)**: 확인됨 — `Logger.ts:276`의
  `redact.paths`가 `req.headers.authorization`과 `req.headers.cookie`를
  명시적으로 redact한다. **단, 이 해결은 재한정(re-qualify)이 필요하다**:
  이 커버리지는 `req.headers.*`에만 적용되며, 에러 페이로드 내부에 중첩된
  `Authorization` 헤더(예: `err.config.headers.authorization`,
  `err.data.res.client._httpMessage._header`)에는 적용되지 않는다 — 바로
  이 간극 때문에 LEAK 2, LEAK 3이 발생했다. 즉 "`Authorization` 헤더는
  어디서나 안전하다"로 읽어서는 안 되고, "요청 헤더 자체는 redact되지만
  에러 객체에 중첩된 헤더는 별도로 `projectErrorForLog()`를 거쳐야 한다"로
  읽어야 한다.

### 미결 항목 (Owner 결정 필요, 2026-09-14 — 아래 4건은 해결된 것이 아니다)

- **OPEN-1**: `BaseGateway.httpGetJson`이 여전히 caught error 전체를
  그대로 로깅한다(`lingon/src/core/base/BaseGateway.ts:408` —
  `this.logger.error({ ...meta, err, ms: elapsedMs }, ...)`), 또한 raw
  upstream body를 `AppError.meta`에 그대로 담는다(`AppError.ts:51`,
  `:67`에서 `meta: err.meta`를 에러 envelope로 복사). 이 동작은 **테스트
  3건이 이 에러 계약(error contract)을 고정(pin)하고 있어**, 변경 시
  단순 정리가 아니라 계약 변경(breaking change)이 된다. Owner 결정 필요.
- **OPEN-2**: 두 개의 catch-all fatal sink가 raw 에러를 로깅한다 —
  `AppError.plugin`의 truly-unhandled 분기(`lingon/src/core/utils/AppError.ts:74-75`,
  `appLogger.log.fatal({ err }, ...)` / `req.log.fatal({ err }, ...)`)와
  `app.ts`의 `uncaughtException` 핸들러(`lingon/src/app.ts:51`,
  `appLogger.log.fatal({ err }, 'uncaughtException')`). 이를
  `projectErrorForLog()`로 프로젝션하면 `stack`이 사라지는데, `stack`은
  이 로그의 유일한 진단 가치다. Trade-off가 실재하며 Owner 결정 필요.
- **OPEN-3**: `BaseGateway.sanitizeUrl()`(`lingon/src/core/base/BaseGateway.ts:340-351`)이
  `REDACTED_QUERY_PARAMS`와 별개로 divergent한 두 번째 redaction 목록을
  유지한다 — 7개 파라미터(`appid`, `apikey`, `api_key`, `key`, `token`,
  `secret`, `password`)뿐이며 `REDACTED_QUERY_PARAMS`의 11개 중
  `code`, `access_token`, `id_token`, `state`가 빠져 있다. DRY 위반이지만
  **현재는 악용 가능하지 않다**(gateway URL이 이 4개 파라미터를 갖지
  않기 때문) — 두 측면 모두를 기록해 둔다. Owner 결정 필요(통합 여부).
- **OPEN-4**: `BaseGateway.httpPostJson`의 catch 블록(`lingon/src/core/base/BaseGateway.ts:584-593`,
  `projectedErr` 구성부)에 `projectErrorForLog`와는 별개인 **네
  번째** 인라인 에러-프로젝션 shape이 존재한다. 프로젝션이 두 곳, 헬퍼가
  하나 — 통합(consolidation)은 아직 누구의 소유도 아니다. Owner 결정
  필요.

## 관련 문서

- [error_policy.md](error_policy.md) — 에러 레벨과 HTTP Status 매핑
- [security_policy.md](security_policy.md) — 암호화/Secret 관리
- [../../backend/docs/DevelopmentGuide.md](../../backend/docs/DevelopmentGuide.md) — 원본 구현 규칙
- [../ops/monitoring.md](../ops/monitoring.md) — Correlation id(`req.id`/`reqId`/`req_id`) 통합의 상세 내용

---

# Change Log

- **2026-07-22** — 최초 작성. Docs Revision(SSOT 정리) 작업의 일부.
- **2026-09-14** — `lingon@b5fad88` 기준으로 다음을 기록:
  - 공유 redaction 메커니즘(`Logger.ts`의 `REDACTED_QUERY_PARAMS`,
    `sanitizeRequestUrl`, `redactQueryParams`, `projectErrorForLog`) 신규
    문서화.
  - pino `redact.paths`의 `*`가 단일-레벨 wildcard라는 사실과, 그로 인해
    raw Provider/SDK 에러 객체를 절대 그대로 로깅해서는 안 된다는 규칙을
    명시.
  - 해결 완료된 credential 유출 5건(LEAK 1~5: `request_logs.query_params`,
    `GoogleTokenService`/`GoogleCalendarAPI`의 raw `GaxiosError`,
    `LingOnAuth`의 raw Boom 에러, `LingOnWeather` 4개 라우트, `AppError`/
    `app.ts`의 `raw_logs.endpoint`·`unhandledRejection`)를 각 위치와 함께
    기록.
  - Correlation id(`req.id` / `reqId` / `req_id`)가 pino·`request_logs`·
    `raw_logs` 전체에서 통일되었음을 기록, `../ops/monitoring.md`로
    상세 내용 링크.
  - "확인이 필요한 부분"의 `Authorization` 헤더 redact 여부 항목을
    해결(resolved)로 닫되, `req.headers.*`에만 적용된다는 점을 재한정.
  - 해결되지 않은 4건(OPEN-1~4: `BaseGateway.httpGetJson`의 raw 에러
    로깅과 `AppError.meta`, 두 catch-all fatal sink의 raw 에러 로깅,
    `BaseGateway.sanitizeUrl()`의 divergent 7-파라미터 목록, `httpPostJson`의
    네 번째 인라인 에러 프로젝션)를 Owner 결정이 필요한 미결 항목으로
    신규 등록 — 해결된 것으로 처리하지 않음.
  - PII 마스킹 표의 쿼리 파라미터 redaction 행을 갱신해 `BaseGateway.sanitizeUrl()`
    단독 표기 대신 `REDACTED_QUERY_PARAMS`/`sanitizeRequestUrl`/
    `redactQueryParams`를 1차 메커니즘으로, `BaseGateway.sanitizeUrl()`을
    분리된 gateway 로컬 메커니즘(OPEN-3)으로 재기술.
  - 로그 싱크 표에 `request_logs`가 LEAK 1의 유출 지점이었다는 점과,
    leak-guard 테스트는 세 싱크 전부를 non-vacuous하게(`logLines.length
    > 0`) 검증해야 한다는 점을 추가.
