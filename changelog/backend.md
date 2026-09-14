# Backend ChangeLog

Format: `## [x.y.z] - YYYY-MM-DD` followed by bullet points. Newest first.
Governed by [../CLAUDE.md](../CLAUDE.md) — every `version/backend.json` bump
must have a matching entry here.

## [0.1.2] - 2026-09-14

- **보안 — 로그 싱크 자격증명 유출 5건 수정.** `src/` 전역 91개 로그 호출
  지점을 전수 조사해 발견했다. 모두 가설이 아니라 실제 자격증명이었다:
  `request_logs.query_params`에 살아있는 JWT와 Google OAuth code 평문 저장
  (`?access_token=` 수용 경로), raw `GaxiosError`를 통한 `client_secret` ·
  `refresh_token` · Bearer 토큰 노출(동의 철회·토큰 만료 같은 일상 이벤트에서
  발생), raw Boom 에러를 통한 OAuth `client_secret` 노출(`Authorization: Basic`
  — base64는 암호화가 아니다, 콜백 실패마다 발생), weather 라우트의 원본
  `req.query` 기록, `raw_logs`의 미정제 URL과 `{ reason }`.
  **핵심 사실**: pino `redact.paths`의 `*`는 **단일 레벨** 와일드카드라
  `err.config.headers.authorization`을 보호하지 못한다 — provider/SDK 에러
  객체를 통째로 로깅하면 안 되는 이유다.
  메커니즘은 다섯이 아니라 하나다: `projectErrorForLog` ·
  `redactQueryParams` · `sanitizeRequestUrl`이 단일 `REDACTED_QUERY_PARAMS`
  목록을 공유한다. 각 수정은 mutation 검증(되돌리면 red, 복원하면 green,
  블롭 해시 일치)을 거쳤다.
- **D-005 — provider 광고를 실제 registry와 일치시킴.** `GET /v1/apikey/status`가
  4개(openai/anthropic/gemini/openrouter)를 광고했으나 `PROVIDER_REGISTRY`는
  2개(openai/gemini)만 지원해, 사용자가 등록해도 `LLM_PROVIDER_UNSUPPORTED`로만
  실패하는 키를 저장할 수 있었다. 이제 `SUPPORTED_PROVIDER_IDS`가 registry에서
  파생되어 registry가 단일 진실 소스다(어댑터 추가 시 BYOK 계약이 자동 확장).
  세 번째 낡은 목록(`types.ts`의 `LLM_PROVIDER_IDS`, 미사용)은 삭제 — 남겨두면
  드리프트가 조용히 재유입될 자리였다. 이미 저장된 미지원 provider 키는 status에
  계속 노출된다(숨기면 UI가 삭제를 제안할 수 없어 데이터가 고립된다).
  status는 4회 병렬 `hasApiKey` 대신 `listStoredProviders` 1회 질의로 바뀌었다.
  **LLM-001 Requirement 문구는 개정되지 않았다** — D-005는 Closed Alpha의
  릴리스 범위를 한정한 것이고 Anthropic/OpenRouter는 취소가 아니라 연기다.
- **Correlation id 통일.** pino의 `reqId`와 `request_logs.req_id`/`raw_logs.reqId`가
  서로 다른 값이라 로그 한 줄을 DB 행과 연결할 수 없었다(`requestIdHeader`
  불일치). `x-request-id` + UUID 생성기로 통일.
- **`node_modules` 추적 해제**(2,948개). `.gitignore`에 있었지만 규칙 추가 이전에
  커밋되어 계속 추적되고 있었다 — 의존성 변경마다 무관한 수백 개 파일이 diff를
  덮어 리뷰가 불가능했다. 인덱스에서만 제거하며 디스크 파일은 유지된다.
- 검증: `npm test` **230 passing / 68 suites**, `tsc --noEmit` ·
  `npm run test:types` · `npm run build` 모두 exit 0, `npm audit` **0**.
- **미해결(Owner 결정 대기)**: `httpGetJson`의 에러 통째 로깅과 `AppError.meta`의
  원본 업스트림 body(테스트 3개가 현재 에러 계약을 고정) · catch-all fatal 싱크
  2곳(투영 시 stack 손실) · `BaseGateway.sanitizeUrl`의 두 번째 리댁션 목록(7개
  vs 11개). `docs/policies/logging_policy.md` 참조.

## [0.1.1] - 2026-09-14

- **Database reproducible from `migrations/` alone.** `000_baseline_schema.sql`
  creates all 7 documented tables; `001`/`004`/`005` gained existence guards so
  the sequence is idempotent. Verified on a throwaway PostgreSQL 18.6 cluster:
  applies clean twice, the app boots against the result, and the legacy
  pre-migration shape still upgrades correctly. `users.id` gets
  `DEFAULT gen_random_uuid()` — the documented schema without it would fail
  every login (TASK-003).
- **CORS locked down.** `origin: true` replaced by an exact-match allowlist from
  `CORS_ALLOWED_ORIGINS` (default `https://www.ling-on.com`). No-`Origin`
  requests still pass. Verified against a booted server; plugin registration
  order preserved (TASK-004).
- **LLM Gateway (SYS-010).** Provider registry, OpenAI + Gemini adapters,
  credential resolution (`byok` → `platform` → stable failure, LLM-006), error
  normalization, `POST /v1/actions/execute`, `GET /v1/actions/types`. Fills the
  contract frozen at system 0.2.0 — no contract changed. `apiKeyRepository.useApiKey`
  gets its first consumer after having zero call sites. Resolves **H5**
  (`getApiKey()` precedence reversed so a per-user key beats the platform-scoped
  repo; the old order could silently serve the wrong credential) and **M3**
  (`httpPostJson` added; `httpGetJson` byte-for-byte unchanged and pinned by
  tests). No dependency added — Node 22 `fetch`. Streaming returns
  `NOT_IMPLEMENTED` (501) (TASK-005).
- **Test harness.** `node:test` via the already-installed `tsx`; `npm test` and
  `npm run test:types` added. 163 tests / 47 suites (TASK-006).
- **Dependency advisories cleared 7 → 0**, all in-range, no major jump, no
  `--force`; `package.json` ranges byte-identical (TASK-008).
- **Per-user BYOK isolation proven by test** — 16 tests through the real route,
  gateway and adapter, verified by mutation. No defect found (TASK-015).
- Known: provider errors are logged as a fixed projection because
  `ProviderHttpError.providerBody` can echo user chat content; `httpGetJson`
  still logs its error whole (pre-existing, pending a logging-policy decision).

## [0.1.0] - 2026-07-29

- **V_0.1.0 Baseline.** Reconciled against `jdukmin/lingon` real commit
  history (V_0.0.4 → V_0.0.17) plus `BACKEND_VERIFICATION_REPORT.md`
  (2026-07-24: fixed Calendar response field names to match SSOT, removed
  undocumented query params, fixed live `user_api_keys` DB schema drift,
  corrected a stale auth comment, fixed `.env.example`) and
  `BACKEND_SCHEMA_VERIFICATION_REPORT.md` (2026-07-23: confirmed all 19
  documented endpoints live; found DB migration coverage incomplete for 5/7
  tables, CORS fully open, HTTPS/HSTS unenforced). Full per-version detail:
  [status/backend/](../status/backend/) (10 documents, V0.0.4 through
  V0.1.0).
- No API contract, DB schema, or route was added/removed by this DevDocs
  pass — this entry documents the backend's own history, it does not
  change it.

## [0.1.0] - 2026-07-23 (seed note, superseded by the entry above)

- Introduces the `version/`/`changelog/`/`verification/` SSOT system in
  this repository (see [../CLAUDE.md](../CLAUDE.md)). Did not describe a
  real backend release at the time it was written.
