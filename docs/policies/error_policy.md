# Error Policy

> **Status**: Proposed · **Progress**: 부분 구현(아래 표의 "현재" 열 참고) · **Last Updated**: 2026-07-22 · **Next Milestone**: 409/422/503을 실제로 반환하는 첫 엔드포인트 설계 시 이 문서를 기준으로 코드 작성

HTTP Status별 정책이다. "현재" 열은 `backend/docs/api/*.md`에 이미 문서화된
실제 사용 현황(SSOT), "정책"은 이 문서가 새로 확정하는 표준이다 — 앞으로
모든 신규 엔드포인트(Action ICD 포함)는 이 표를 따른다.

---

## 공통 규칙

- 모든 에러는 ICD v0.0 envelope(`{ success: false, data: null, error: { code, message } }`)로 반환한다.
- `error.code`는 SCREAMING_SNAKE_CASE(예: `BAD_REQUEST`, `CALENDAR_NOT_CONNECTED`).
- `error.message`는 사용자에게 그대로 노출하지 않는다 — Frontend는 `error.code`를
  기준으로 자체 문구를 표시한다(다국어 대응, 메시지 변경이 API Breaking
  Change가 되는 것을 방지).

## HTTP Status별 정책

### 400 Bad Request

| 항목 | 내용 |
|---|---|
| 발생 조건 | 요청 형식이 잘못됨(필수 필드 누락, 타입 불일치) — 문법적 오류 |
| Backend 처리 | `AppError('BAD_REQUEST', 400, ...)`, 핸들러 상단에서 수기 검증 |
| Frontend 처리 | 입력 폼 오류 표시 |
| Retry 여부 | 아니오(사용자가 입력을 고쳐야 함) |
| 사용자 메시지 | "입력값을 확인해주세요" |
| 현재 | 전 API에서 사용 중(auth/calendar/weather/apikey/settings/users) |

### 401 Unauthorized

| 항목 | 내용 |
|---|---|
| 발생 조건 | `Authorization` 헤더 없음/형식 오류/토큰 만료·위조, refresh token 무효·revoke·버전 불일치 |
| Backend 처리 | `Policy.before()`(전역 `preHandler`)가 검증, 실패 시 `AppError('UNAUTHORIZED', 401)` |
| Frontend 처리 | `POST /v1/auth/refresh`로 1회 자동 재시도 → 실패 시 자동 로그아웃(`AuthService.md` `AuthErrorKind.unauthorized`) |
| Retry 여부 | 예, 단 1회(재발급 토큰으로) — 재시도도 401이면 재시도 중단 |
| 사용자 메시지 | "다시 로그인해주세요" |
| 현재 | 전 API에서 사용 중. **단, 자동 재시도 인터셉터는 Frontend에 아직 연결되지 않음** — [docs/icd/gap_analysis.md](../icd/gap_analysis.md) "누락된 Interface" |

### 403 Forbidden

| 항목 | 내용 |
|---|---|
| 발생 조건 | 인증은 됐지만 특정 리소스/Tool에 대한 권한이 없음(예: `CALENDAR_NOT_CONNECTED`) |
| Backend 처리 | `AppError('<RESOURCE>_NOT_CONNECTED', 403, ...)` 형태의 구체적 코드 |
| Frontend 처리 | 재시도 대신 "연결하기" CTA로 유도(예: Google Calendar 연결 화면) |
| Retry 여부 | 아니오(사용자 액션 필요) |
| 사용자 메시지 | "Google Calendar를 먼저 연결해주세요" 등 리소스별 구체적 안내 |
| 현재 | `CALENDAR_NOT_CONNECTED`(calendar.md)만 존재 — 향후 Tool마다 동일 패턴(`<TOOL>_NOT_CONNECTED`) 적용 권장 |

### 404 Not Found

| 항목 | 내용 |
|---|---|
| 발생 조건 | 요청한 리소스가 존재하지 않음(`USER_NOT_FOUND`, `API_KEY_NOT_FOUND`) |
| Backend 처리 | `AppError('<RESOURCE>_NOT_FOUND', 404)` |
| Frontend 처리 | 빈 상태(empty state) 화면 |
| Retry 여부 | 아니오 |
| 사용자 메시지 | "찾을 수 없습니다" |
| 현재 | `USER_NOT_FOUND`(auth.md/users.md), `API_KEY_NOT_FOUND`(apikey.md) |

### 409 Conflict *(신규 정책 — 현재 미사용)*

| 항목 | 내용 |
|---|---|
| 발생 조건 | 동시성 충돌 — 예: 이미 실행 중인 Action을 재실행 시도, 동일 리소스 동시 수정 |
| Backend 처리(제안) | `AppError('ACTION_ALREADY_RUNNING', 409)` 등 — Action/Workflow Domain 구현 시 도입 |
| Frontend 처리(제안) | "이미 진행 중입니다" 안내, 현재 상태를 폴링해 갱신 |
| Retry 여부 | 아니오(상태가 바뀔 때까지 대기) |
| 사용자 메시지 | "이미 처리 중입니다" |
| 현재 | 사용 중인 엔드포인트 없음 — [docs/icd/action_layer_api.md](../icd/action_layer_api.md) 구현 시 첫 적용 대상 |

### 422 Unprocessable Entity *(신규 정책 — 현재 미사용)*

| 항목 | 내용 |
|---|---|
| 발생 조건 | 형식은 올바르지만(JSON 파싱/타입 통과) 비즈니스 규칙 위반(예: 캘린더 종료 시각이 시작 시각보다 빠름) |
| Backend 처리(제안) | `AppError('<DOMAIN>_VALIDATION_FAILED', 422)` — 400(형식 오류)과 구분 |
| Frontend 처리(제안) | 필드별 비즈니스 규칙 오류 표시(400과 다른 문구 가능) |
| Retry 여부 | 아니오 |
| 사용자 메시지 | 규칙별 구체적 안내(예: "종료 시각은 시작 시각 이후여야 합니다") |
| 현재 | **미사용 — 현재는 형식 오류와 비즈니스 규칙 위반을 구분하지 않고 전부 400으로 반환한다.** 이 구분은 Domain ICD(예: [calendar.md](../../requirements/domain_icd/calendar.md) "종료 시각이 시작 시각보다 빨라선 안 됨")가 실제 Validation 로직으로 옮겨질 때부터 적용한다. |

### 429 Too Many Requests

| 항목 | 내용 |
|---|---|
| 발생 조건 | Rate limit 초과(`@fastify/rate-limit` — 미인증 30 req/min, 인증 120 req/min) |
| Backend 처리 | `@fastify/rate-limit` 기본 동작(플러그인이 자동 처리) |
| Frontend 처리 | 지수 백오프 후 재시도 |
| Retry 여부 | 예(지연 후) |
| 사용자 메시지 | "잠시 후 다시 시도해주세요" |
| 현재 | Rate limit 임계치는 문서화되어 있으나(`backend/docs/DevelopmentGuide.md`), 429 응답의 정확한 `error` envelope 형태는 문서화되지 않음 — **확인 필요**(플러그인 기본 응답을 ICD v0.0으로 감싸는지 미확인) |

### 500 Internal Server Error

| 항목 | 내용 |
|---|---|
| 발생 조건 | 예기치 않은 서버 예외(`AppError`가 아닌 모든 예외), DB 저장 실패 등 |
| Backend 처리 | Pino `fatal` + `raw_logs`의 `unhandled_exception` 행 기록(`DevelopmentGuide.md` Error handling) |
| Frontend 처리 | 재시도 안내 |
| Retry 여부 | 예(제한적, 사용자 수동 재시도) |
| 사용자 메시지 | "일시적인 오류입니다. 다시 시도해주세요" |
| 현재 | `INTERNAL`(auth.md), 일반 500 다수 |

### 502 Bad Gateway

| 항목 | 내용 |
|---|---|
| 발생 조건 | 외부 Provider(Google, OpenWeather) 호출 실패 |
| Backend 처리 | `PROVIDER_HTTP_ERROR`/`PROVIDER_NETWORK_ERROR`/`CALENDAR_TOKEN_REFRESH_FAILED`(`BaseGateway`, calendar.md) |
| Frontend 처리 | "연동 서비스 오류" 안내, 재연결 유도(토큰 문제인 경우) |
| Retry 여부 | 예(네트워크성 오류인 경우) |
| 사용자 메시지 | "외부 서비스 연결에 실패했습니다" |
| 현재 | calendar.md, services/README.md(`BaseGateway`)에 이미 정의됨 |

### 503 Service Unavailable *(신규 정책 — 현재 미사용)*

| 항목 | 내용 |
|---|---|
| 발생 조건 | 서버 자체가 일시적으로 처리 불가(DB 커넥션 풀 고갈, 유지보수 모드) |
| Backend 처리(제안) | `AppError('SERVICE_UNAVAILABLE', 503)`, 헬스체크(`GET /v1/status`)와 연계해 로드밸런서가 감지 |
| Frontend 처리(제안) | 전역 "서비스 점검 중" 배너 |
| Retry 여부 | 예(지연 후) |
| 사용자 메시지 | "서비스 점검 중입니다" |
| 현재 | **미사용** — [docs/ops/monitoring.md](../ops/monitoring.md) Health Check 도입과 함께 정의 필요 |

## 기타 (사용자 요청 목록 외, 이미 존재하는 코드)

| Status | Code | 비고 |
|---|---|---|
| 501 | `NOT_IMPLEMENTED` | 기능 자체가 비활성(예: Redirect OAuth 환경변수 미설정) — 사용자 액션으로 해결 불가, 운영 설정 문제 |

## 관련 문서

- [../icd/action_layer_api.md](../icd/action_layer_api.md) — 에러 코드 레지스트리(Action 전용 코드)
- [logging_policy.md](logging_policy.md) — 에러 로깅 레벨
- [../../docs/icd/gap_analysis.md](../icd/gap_analysis.md)

---

# Change Log

- **2026-07-22** — 최초 작성. Docs Revision(SSOT 정리) 작업의 일부.
