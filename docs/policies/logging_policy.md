# Logging Policy

> **Status**: Proposed(레벨 정책은 기존 구현 확정, PII 마스킹은 기존 구현 확인, `DEBUG` 레벨은 신규) · **Progress**: 부분 구현 · **Last Updated**: 2026-07-22 · **Next Milestone**: `DEBUG` 레벨 실제 사용처 도입 시 이 문서 갱신

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

## PII / Secret 마스킹 정책

**절대 로그에 포함하지 않는다** (근거: `DevelopmentGuide.md` Logging 절,
원문 그대로 정책화):

| 항목 | 규칙 |
|---|---|
| API 키 / `apikey` / `api_key` / `key` 쿼리 파라미터 | `BaseGateway.sanitizeUrl()`이 URL 로깅 전 redact |
| `token` / `secret` / `password` 쿼리 파라미터 | 동일 |
| `Authorization` 헤더 | 어떤 로그에도 포함 금지 |
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

## 확인이 필요한 부분 (Docs Revision 과정에서 발견)

- Fastify의 기본 요청 로거(pino-http 계열)가 활성화되어 있다면
  `Authorization` 헤더를 기본 설정으로 로깅할 수 있다 — 이 저장소에는 실제
  코드가 없어 Fastify 로거 설정(`app.ts`)이 헤더를 명시적으로 redact하는지
  확인할 수 없었다. **실제 코드에서 `logger` 옵션의 `redact` 설정 여부를
  반드시 확인할 것.**

## 관련 문서

- [error_policy.md](error_policy.md) — 에러 레벨과 HTTP Status 매핑
- [security_policy.md](security_policy.md) — 암호화/Secret 관리
- [../../backend/docs/DevelopmentGuide.md](../../backend/docs/DevelopmentGuide.md) — 원본 구현 규칙

---

# Change Log

- **2026-07-22** — 최초 작성. Docs Revision(SSOT 정리) 작업의 일부.
