# Credential Leak Fixes — Backend Logging (5건)

> Governed by [../../CLAUDE.md](../../CLAUDE.md) "Verification Report Rule".
> Assessed against `lingon@b5fad88`, `letmeknow@48bc665`.
> Policy SSOT: [../../docs/policies/logging_policy.md](../../docs/policies/logging_policy.md).
> Routing: [../../docs/route_index.md](../../docs/route_index.md).

## 변경 목적

로그 싱크로 **살아 있는 credential이 그대로 흘러 들어간 5건**을 차단하고, 그
차단을 개별 call site의 주의력이 아니라 **공유된 단일 메커니즘**으로 고정한다.

핵심 기술 사실 하나가 이 작업 전체의 전제다: **pino의 `redact.paths`에서 `*`는
단일 레벨 와일드카드다.** 설정된 경로는
`['req.headers.authorization', 'req.headers.cookie', '*.headers.authorization', '*.headers.cookie']`
(`lingon/src/core/utils/Logger.ts:276`)인데, `*`가 정확히 한 세그먼트만
매칭하므로 `*.headers.authorization`은 `X.headers.authorization`은 가리지만
**`err.config.headers.authorization`은 가리지 못한다** — 한 단계 더 깊기
때문이다. 근거는 소스에 주석으로 고정되어 있다(`Logger.ts:136-152`).

그 결과 `redact.paths`는 **단독으로는 안전망이 아니다**. Gaxios는 outbound
request `config`(URL, body, headers)를 `GaxiosError`에 **own enumerable**
속성으로 붙이고, pino-std-serializers의 기본 `err` serializer는 own enumerable
키를 전부 복사한다. 따라서 raw error를 `{ err }`로 한 번 로깅하면 살아 있는
Google OAuth `client_secret`, refresh token, Bearer access token이
`data/log/*.log`와 `raw_logs`에 그대로 기록된다.

**따라서 정책 규칙은 하나다 — raw provider/SDK 에러 객체를 절대 로깅하지
않는다.** 허용 목록(allowlist) 투영만 로깅한다.

## 변경 파일

### 1. Backend 소스 (`lingon@b5fad88` — 본 저장소 밖, 기록 목적)

| 파일 | 변경 |
|---|---|
| `lingon/src/core/utils/Logger.ts` | 공유 메커니즘 신설/export: `REDACTED_QUERY_PARAMS`(11개, `:84-87`), `sanitizeRequestUrl()`(`:97`), `redactQueryParams()`(`:123`), `projectErrorForLog()`(`:169`, 타입 `ProjectedLogError` `:162`). `saveRequestLog` 내부에서 redaction 적용(`:328`) |
| `lingon/src/gateway/GoogleTokenService.ts` | LEAK 2 — raw `GaxiosError` 로깅 → `projectErrorForLog(err)`(`:68`, import `:5`) |
| `lingon/src/gateway/GoogleCalendarAPI.ts` | LEAK 2 — 동일(`:82`, import `:5`) |
| `lingon/src/route/LingOnAuth.ts` | LEAK 3 — raw Boom 에러 로깅 → `projectErrorForLog(err)`(`:311`, `:457`, import `:11`) |
| `lingon/src/route/LingOnWeather.ts` | LEAK 4 — raw `req.query` 로깅 → `redactQueryParams(req.query)`(`:94`, `:119`, `:144`, `:171`, import `:5`) |
| `lingon/src/core/utils/AppError.ts` | LEAK 5 — `raw_logs.endpoint`에 `sanitizeRequestUrl(req.url)` 적용(`:89`, import `:3`) |
| `lingon/src/app.ts` | LEAK 5 — `unhandledRejection`의 `{ reason }` → `projectErrorForLog(reason)`(`:73`). Correlation id 통합: `requestIdHeader: 'x-request-id'` + `genReqId: () => randomUUID()`(`:124-125`, import `:10`) |
| `lingon/src/plugins/LingOnDataManage/RequestContext.ts` | `requestId: String(req.id)` — Fastify `req.id` 재사용(`:23`, 근거 주석 `:12-13`) |
| `lingon/src/gateway/llm/LlmGatewayService.ts` | D-005 — `PROVIDER_REGISTRY`(`:161`)에서 `SUPPORTED_PROVIDER_IDS` 파생(`:188`) |
| `lingon/src/route/LingOnApiKey.ts` | D-005 — `SUPPORTED_PROVIDER_IDS` import(`:5`), `listStoredProviders` 단일 쿼리(`:97`) |
| `lingon/src/gateway/llm/types.ts` | D-005 — 세 번째 중복 목록 `LLM_PROVIDER_IDS` **삭제** |
| `lingon/tests/security/*.test.ts` | leak-guard 테스트 5파일 신설(아래 "테스트 결과") |

### 2. 본 저장소(`docs/`) 문서 동기화 — 이번 pass에서 실제 변경한 파일

| 파일 | 변경 |
|---|---|
| `docs/policies/logging_policy.md` | raw 에러 로깅 금지 규칙, `*` 단일 레벨 와일드카드 갭, LEAK 1~5 기록, "확인이 필요한 부분"의 `Authorization` 항목 **종결 + 재한정**, 미결 Owner 결정 OPEN-1~4 기록 |
| `docs/ops/monitoring.md` | Correlation id 통합 기록 — 한 개의 id가 pino / `request_logs.req_id` / `raw_logs.reqId`를 관통 |
| `docs/route_index.md` | **로그 싱크 2개 → 3개 정정**, validation baseline 갱신, 로깅 규칙 및 D-005 registry 규칙 추가 |
| `backend/docs/database/request_logs.md` | `query_params`가 목록 키에 대해 `[redacted]`를 저장 |
| `backend/docs/services/google-calendar.md` | `GoogleCalendarAPI`/`GoogleTokenService`의 에러 로깅 동작 |
| `backend/docs/services/README.md` | `BaseGateway.sanitizeUrl`의 7개 목록이 `REDACTED_QUERY_PARAMS`(11개)와 분리되어 있음을 주석(OPEN-3) |
| `backend/docs/api/apikey.md` | D-005 — allow-list 파생화, `status` 단일 쿼리, DELETE 400-vs-404 규칙 |
| `backend/docs/database/user_api_keys.md` | D-005 — `provider` 컬럼 설명 |
| `backend/docs/FeatureList.md` | D-005 — 2개소 |
| `requirements/llm_gateway_requirements.md` | D-005 — 지원 대상 절 + LLM-001 근거 노트, 현황 문단 정정, LLM-001 Requirement 문구 상위규정 플래그 |
| `frontend/docs/services/LlmService.md` | 삭제된 `enum LlmProvider` 기술 제거 |

본 저장소 밖(`lingon/`, `letmeknow/`)의 파일은 이번 pass에서 **한 건도 변경하지
않았다** — `docs/CLAUDE.md`의 "Never modify source code from this repository"
규칙. 증거는 "테스트 결과" 절의 `git status` 대조.

## 영향 분석

### 유출 5건 — 무엇이 새고 있었는가

| # | 싱크 | 유출 값 | 수정 위치 |
|---|---|---|---|
| LEAK 1 | `request_logs.query_params`(**영속 DB 컬럼**) | `?access_token=`로 전달된 **살아 있는 LingOn JWT**, OAuth 콜백의 **Google authorization code**. `RequestLog.ts:40`이 `req.query`를 그대로 전달 | `saveRequestLog` 내부 redaction(`Logger.ts:328`) |
| LEAK 2 | pino + `raw_logs` | `GaxiosError.config.data`의 `client_secret` + `refresh_token`, `config.headers.authorization`의 live Bearer | `GoogleTokenService.ts:68`, `GoogleCalendarAPI.ts:82` |
| LEAK 3 | pino | Boom 에러의 `err.data.res.client._httpMessage._header` → `Authorization: Basic base64(client_id:client_secret)` | `LingOnAuth.ts:311`, `:457` |
| LEAK 4 | pino | raw `req.query`(weather 4개 라우트) | `LingOnWeather.ts:94/119/144/171` |
| LEAK 5 | `raw_logs.endpoint`, pino | 미-sanitize URL, `unhandledRejection`의 raw `reason` | `AppError.ts:89`, `app.ts:73` |

LEAK 1은 유일하게 **영속 DB 컬럼**에 남은 건이라 심각도가 가장 높다.
`RequestLog.ts`의 헤더 주석은 "only route-level query params are stored
(lat, lon, units, lang, q, limit)"라고 주장하고 있었으나, 훅은 실제로
`req.query` 전체를 넘기고 있었다 — 그 주석이 잘못된 확신의 출처였다. 이제
보장은 훅이 아니라 `saveRequestLog`라는 **단일 choke point**가 강제한다.

### 설계 선택 — 왜 denylist가 아니라 allowlist인가

`projectErrorForLog`는 `{ name, message?, code?, status? }`만 반환한다
(`Logger.ts:169`). denylist였다면 향후 어떤 에러 서브타입이든 검토되지 않은
필드를 own enumerable 속성으로 실어 로그에 밀어넣을 수 있다. allowlist는 그
경로를 구조적으로 막는다. `Error`가 아닌 입력은 `{ name: 'UnknownError' }`를
반환하고, `code`는 `string`/`number`일 때만, `status`는 `err.status` 또는
`err.response.status`에서만 취하며 **`err.response`의 나머지(headers, body)는
건드리지 않는다**.

**`message`는 항상 유지된다**(`Logger.ts:174`). Boom 에러의 경우 그 값은
`Response Error: <status> <statusText>` 형태이며 — 이는 **안전하고 의도된
것**이다. 향후 이를 "누락"으로 보고 제거하지 않도록 여기 명시한다.

### 싱크는 3개다 (2개가 아니다)

`docs/route_index.md`가 "There are TWO log sinks"라고 기술하고 있었다. 실제로는
셋이다: ① pino, ② `appLogger.saveRawLog` → `raw_logs`(`Logger.ts:347`),
③ `appLogger.saveRequestLog` → `request_logs`(`Logger.ts:313`). **누출이
발생한 곳이 정확히 세 번째**이므로, 이 오기는 비용이 큰 종류였다. 정정했다.
leak-guard 테스트는 **세 싱크 전부**를 가로채야 하고, 반드시
non-vacuous assertion(`logLines.length > 0`)을 함께 걸어야 한다 — 싱크가 비어
있으면 "민감정보 없음" assertion이 잘못된 이유로 통과한다.

### Correlation id 통합 (부수 효과지만 진단 가치가 큼)

이전에는 pino의 `reqId`, `request_logs.req_id`, `raw_logs.reqId`가 **서로
무관한 값**이었고, 따라서 **로그 라인을 그 요청의 DB 행에 조인할 수 없었다**.
이제 `requestIdHeader: 'x-request-id'` + `genReqId: () => randomUUID()`
(`app.ts:124-125`)와 `RequestContext`의 `req.id` 재사용(`RequestContext.ts:23`)으로
한 개의 id가 세 싱크를 관통한다. `raw_logs.reqId`는 nullable로 남는다 —
요청 스코프 밖의 프로세스 레벨 이벤트에는 요청 id가 없다.

### 계약 영향

API 응답 계약은 **변경되지 않았다**. 변경은 전부 로그 출력 형태에 한정된다.
단, `AppError.meta`를 통해 upstream body가 클라이언트 에러 envelope까지
도달하는 경로는 **여전히 열려 있다**(아래 OPEN-1) — 이는 계약이므로 이번
범위에서 건드리지 않았다.

## 테스트 결과

실제 실행 결과만 기록한다(`docs/CLAUDE.md`: "Mock 결과를 성공으로 보고하지
않는다"). 전부 2026-09-14, `lingon@b5fad88` / `letmeknow@48bc665`에서 실행.

| 검증 | 명령 | 결과 |
|---|---|---|
| Backend tests | `cd lingon && npm test` | **230 passing / 68 suites** — `# pass 230`, `# fail 0`, `# skipped 0`, `# todo 0`, exit 0 |
| Backend types | `cd lingon && ./node_modules/.bin/tsc -p tsconfig.json --noEmit` | clean, **exit 0** |
| Backend test types | `cd lingon && npm run test:types` | clean(`tsconfig.test.json`), **exit 0** |
| Backend build | `cd lingon && npm run build` | **exit 0** |
| Dependency risk | `cd lingon && npm audit` | **found 0 vulnerabilities**, exit 0 |
| Frontend tests | `cd letmeknow && flutter test` | **283 passing** — "All tests passed!", exit 0 |

### Leak-guard 테스트 — `lingon/tests/security/`

| 파일 | `test()` 수 | 대상 |
|---|---|---|
| `googleErrorRedaction.test.ts` | 6 | LEAK 2 |
| `oauthCallbackErrorRedaction.test.ts` | 3 | LEAK 3 |
| `requestLogRedaction.test.ts` | 5 | LEAK 1 |
| `unhandledExceptionUrlRedaction.test.ts` | 4 | LEAK 5 |
| `weatherQueryLogRedaction.test.ts` | 3 | LEAK 4 |
| `byokIsolation.test.ts` | 16 | (기존) BYOK 격리 |

Backend TAP 출력의 최상위 suite #68은
`weather query log redaction — all four routes redact at their own debug call site`로
통과했다. 위 5개 파일(21 test)이 이번 작업으로 신설된 leak-guard이며,
`byokIsolation.test.ts`(16 test)는 기존 자산이다.

### 소스 저장소 무변경 대조

```
git -C lingon status --porcelain      → (출력 없음)
git -C letmeknow status --porcelain   → generated_plugin_* 6개 (본 작업 이전부터 존재하던 수정)
```

`letmeknow`의 6건은 `linux/flutter/generated_plugin_registrant.{cc,h}`,
`linux/flutter/generated_plugins.cmake`,
`windows/flutter/generated_plugin_registrant.{cc,h}`,
`windows/flutter/generated_plugins.cmake` — Flutter 툴체인이 생성하는
파일이며 본 pass와 무관하다. **새로 추가된 항목은 없다.**

## 남은 문제

### 미결 Owner 결정 (해결하지 않았다 — 기록만)

| # | 내용 | 왜 미결인가 |
|---|---|---|
| **OPEN-1** | `BaseGateway.httpGetJson`이 caught 에러를 여전히 통째로 로깅하고(`lingon/src/core/base/BaseGateway.ts:408`), raw upstream body를 `AppError.meta`에 넣는다. 노출 지점은 **2곳** — 그 로그 라인, 그리고 `AppError.ts:51`/`:67`이 `meta: err.meta`를 클라이언트 에러 envelope로 복사하는 경로 | **테스트 3건이 이 에러 계약을 고정**하고 있다. 바꾸면 정리가 아니라 **계약 변경**이다 |
| **OPEN-2** | catch-all fatal 싱크 2곳이 raw 에러를 로깅한다 — `AppError.plugin`의 진짜 unhandled 분기(`AppError.ts:74-75`), `app.ts`의 `uncaughtException`(`app.ts:51`) | 투영하면 **`stack`이 사라진다**. 이 두 싱크의 존재 이유가 바로 `stack`이다. 실질적 trade-off |
| **OPEN-3** | `BaseGateway.sanitizeUrl`(`BaseGateway.ts:340-351`)이 **7개** 파라미터의 별도 redaction 목록을 유지 — `REDACTED_QUERY_PARAMS`의 **11개**와 분리(`code`, `access_token`, `id_token`, `state` 누락) | **DRY 위험이지 현재 악용 가능한 결함은 아니다** — gateway URL은 누락된 4개를 싣지 않는다 |
| **OPEN-4** | `BaseGateway.httpPostJson`에 `projectErrorForLog`와 별개인 **네 번째** 인라인 투영 shape(`projectedErr`)이 존재(`BaseGateway.ts:584-593`) | 투영 2개, 헬퍼 1개. 통합 주체가 지정되지 않음 |

### 재한정된 종결 항목

`logging_policy.md`의 "확인이 필요한 부분" 중 `Authorization` 헤더 redact 여부
문항은 **종결**했다 — `Logger.ts:276`이 `req.headers.authorization` /
`req.headers.cookie`를 실제로 redact한다. 다만 **이 커버리지는
`req.headers.*`에만 미치며, 에러 페이로드 내부에 중첩된 `Authorization`에는
미치지 않는다**. LEAK 2와 LEAK 3이 정확히 그 경로로 발생했다. "Authorization
헤더는 이제 어디서나 안전하다"로 읽히면 안 된다.

### 범위 밖

- **통합 미검증**: LLM chat은 여전히 live provider credential을 가진 실서버에
  대해 검증된 적이 없다. mocked transport만 통과했다 — `route_index.md`의
  LLM/AI PLATFORM 절 참조. 이번 작업은 로깅 경로에 한정된다.
- **`DEBUG` 레벨**: `logging_policy.md`가 예약만 해 둔 상태로 실사용처는 여전히
  없다.

---

# Change Log

- **2026-09-14** — 최초 작성. credential 유출 5건 수정, 공유 redaction
  메커니즘, correlation id 통합, 미결 Owner 결정 OPEN-1~4 기록.
