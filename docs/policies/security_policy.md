# Security Policy

> **Status**: Proposed(일부는 기존 구현 확정, 일부는 미문서화 항목에 대한 확인 요청) · **Progress**: 부분 구현 · **Last Updated**: 2026-07-22 · **Next Milestone**: HTTPS/CORS 실제 설정값 코드 확인 후 이 문서 갱신

이미 구현된 보안 메커니즘은 기존 문서(`backend/docs`)를 근거로 정책화하고,
문서화되지 않은 항목은 "확인 필요"로 명시한다 — 임의로 값을 지어내지 않는다.

---

## JWT

| 항목 | 정책 |
|---|---|
| 서명 방식 | HMAC-SHA256, `JWT_SECRET` |
| Access Token | 1시간 TTL, `Authorization: Bearer <token>` |
| Refresh Token | 30일 TTL, 클라이언트는 `flutter_secure_storage`에만 저장 |
| Payload | `{ sub, provider, email, tokenVersion, type, exp }` — `provider_id`(Google `sub`)는 `sub`에만 담기고 응답 바디에는 노출되지 않음 |
| Rotation | Refresh 시 `tokenVersion + 1`, 새 토큰을 먼저 저장한 뒤에만 이전 토큰 폐기(무효 구간 없음) |

근거: `backend/docs/api/auth.md` "JWT payload", `database/refresh_tokens.md`.

## Refresh Token

| 항목 | 정책 |
|---|---|
| 저장 형태 | SHA-256 해시만 저장 — 평문은 어디에도 남기지 않음(DB, 로그 포함) |
| 재사용 방지 | 사용된 토큰은 즉시 `revoked_at` 설정, 이후 재사용 시도는 401 |
| Idempotent Revoke | 이미 만료/폐기된 토큰에 대한 재요청도 200(에러 아님) — `api/auth.md` "Invalid/expired tokens return 200" |
| 정리(Cleanup) | 만료된 행을 주기적으로 삭제하는 Job이 **아직 없음**(`database/refresh_tokens.md` "Expired rows are never automatically deleted") — [../ops/data_sop.md](../ops/data_sop.md)에서 후속 정의 |

## MASTER_ENCRYPTION_KEY

| 항목 | 정책 |
|---|---|
| 용도 | BYOK API 키(`user_api_keys`), Google Calendar access/refresh token(`users.google_access_token` 등) 암호화 |
| 알고리즘 | AES-256-GCM |
| `JWT_SECRET`과의 관계 | **완전히 별개** — 절대 혼용하지 않는다(`DevelopmentGuide.md` "Extending auth") |
| 키 관리 | 현재 `.env` 기반. KMS/rotation 정책 **없음** — [docs/workflow.md](../workflow.md) 출시 전 체크리스트 "Secret 관리(Partial)"와 동일 항목 |

## OAuth

| 항목 | 정책 |
|---|---|
| 로그인 스코프 | `openid email profile`(`app.googleOAuth2`) |
| Calendar 스코프 | `calendar.readonly`만(`app.googleCalendarOAuth2`) — 로그인과 **완전히 분리된 별도 client 등록**, 서로 scope/consent state를 공유하지 않음 |
| CSRF 보호 | state 쿠키(`x_auth_platform`, `x_calendar_user_id`) — httpOnly, 10분 TTL |
| Redirect 목적지 | 서버 env var(`WEB_CALLBACK_URL`, `ANDROID_CALLBACK_URL`)로만 고정 — 사용자 입력 redirect URL은 절대 허용하지 않음 |
| 토큰 전달 | URL fragment(`#`)로만 — query string(`?`) 금지(서버/프록시 로그 노출 방지) |

근거: `backend/docs/plugins/google-oauth.md`, `api/auth.md` Security invariants.

## HTTPS

**미문서화 — 확인 필요.** `backend/docs`, `frontend/docs` 어디에도 HTTPS
강제 여부(HSTS, 리버스 프록시 TLS 종료 방식 등)에 대한 명시가 없다. 토큰이
URL fragment/Authorization 헤더로 오가는 설계상 HTTPS는 사실상 필수
전제인데도 정책 문서가 없다 — **출시 전 필수 확인 항목**([../workflow.md](../workflow.md)
출시 전 체크리스트에 추가 필요).

## CORS

**부분 미문서화.** `@fastify/cors`가 플러그인으로 등록되어 있음은 확인됨
(`DevelopmentGuide.md` Fastify structure 다이어그램의 "sensible / cors /
under-pressure"), 그러나 허용 Origin 목록/자격증명(credentials) 설정은
어떤 문서에도 없다 — **코드 확인 필요.**

## Cookie

| 항목 | 정책 |
|---|---|
| `x_auth_platform` | httpOnly, 10분 TTL — OAuth 리다이렉트 왕복 동안 플랫폼(web/android) 정보 유지 |
| `x_calendar_user_id` | httpOnly, 10분 TTL — Calendar 동의 콜백까지 사용자 식별 유지 |
| `Secure`/`SameSite` 속성 | **미문서화 — 확인 필요** |

## Encryption

| 대상 | 방식 |
|---|---|
| BYOK API 키(`user_api_keys`) | AES-256-GCM |
| Google Calendar access/refresh token | AES-256-GCM |
| Refresh Token(LingOn 자체 JWT) | SHA-256 해시(암호화 아님 — 단방향, 위 "Refresh Token" 절 참고) |
| `cryptoUtil`(Base64, `src/core/utils/Crypto.ts`) | **암호화 아님** — `backend/docs/FeatureList.md` TODO에 "NOT secure encryption"으로 명시된 구조적 스캐폴딩. `src/db/encrypt.ts`(AES-256-GCM, 진짜 암호화 경로)와 혼동 금지 |

## Secret 관리

현재 전부 `.env` 기반(`JWT_SECRET`, `MASTER_ENCRYPTION_KEY`,
`GOOGLE_CLIENT_SECRET` 등). KMS/Vault, 자동 rotation, 키 유출 시 대응
절차 **없음** — [../ops/deployment_sop.md](../ops/deployment_sop.md) Secret 배포
절차와 함께 출시 전 반드시 정의해야 한다.

## 관련 문서

- [logging_policy.md](logging_policy.md) — 로그에서 이 문서의 항목들을 제외하는 규칙
- [privacy_policy.md](privacy_policy.md) — OAuth 스코프/데이터 보관 정책
- [../workflow.md](../workflow.md) — 출시 전 체크리스트 Security 항목

---

# Change Log

- **2026-07-22** — 최초 작성. Docs Revision(SSOT 정리) 작업의 일부. HTTPS/CORS/Cookie 속성은 확인 필요 항목으로 명시.
