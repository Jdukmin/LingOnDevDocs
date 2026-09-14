# route_index.md — AI Context Routing Index

> **Role**: this file is a **routing index / operational development map — NOT
> documentation, and NOT a duplicate SSOT**. It answers *which subsystem owns
> this task, which SSOT to trust, which source to open, and what NOT to read.*
> It duplicates no SSOT content. If you need the contract itself, follow the
> link — this file never restates one.

> **Path convention**: every path in this file (`docs/docs/workflow.md`,
> `lingon/src/app.ts`, `letmeknow/lib/...`) is relative to the **workspace
> root** `C:\Users\ykyk1\source\repos\LingOn`, **not** to the `docs/` repo this
> file now lives in. Do not misresolve a path like `docs/...` below as
> `docs/docs/...` just because you are reading this from inside `docs/docs/`.

> **Purpose**: the first file every agent reads.
>
> **Last verified**: 2026-09-14 against `docs@36cd588`, `letmeknow@48bc665`,
> `lingon@b5fad88` (content baseline, unchanged by the migration below).
>
> **Migrated**: 2026-09-14 — moved from the workspace-root `Route.md` (an
> unversioned file outside any git repo) into the SSOT repo at this path,
> `docs/docs/route_index.md` on branch `V_0.1`, so the routing index is finally
> version-controlled. The migration itself re-verified no commit hashes.
>
> **Re-verified**: 2026-09-14 (DevDocs sync pass) — the `letmeknow@48bc665` and
> `lingon@b5fad88` hashes above, and the six section-4 rows marked as re-run,
> were confirmed against live command output in this pass. `docs@36cd588` was
> **not** re-verified and carries over from the prior baseline.

## 0. Repository topology

| Path | Role | Git |
|---|---|---|
| `docs/` | **SSOT** — requirements, ICD, policies, status, versions | own repo, branch `V_0.1` |
| `letmeknow/` | Flutter frontend (web + Android) | own repo, branch `master` |
| `lingon/` | Fastify/TypeScript backend | own repo, branch `V_0.1` |
| `/` (root) | not a git repo — now holds only a **pointer stub** to this file; the canonical, version-controlled routing index is `docs/docs/route_index.md` on branch `V_0.1` | — |

Three **independent** repos. A change spanning two of them is two commits.
`docs/` never contains source; `letmeknow/`+`lingon/` never redefine contracts.

## 1. Authority order (non-negotiable)

```
docs/ SSOT  >  latest Owner decision  >  approved contract  >  implementation  >  assumption
```

On doc↔code conflict, do **not** silently edit the SSOT to match code. Decide and
label: **DevDocs Update Required** (doc stale) or **Implementation Correction
Required** (code defective). Record it in the task's Execution Log.

## 2. Global entrypoints

| Need | Read |
|---|---|
| Working rules for `docs/` | `docs/CLAUDE.md` |
| Dev SOP (Step 0–6, Phase 0–12) | `docs/docs/workflow.md` |
| Current state / blockers | `docs/status/current_status.md`, `docs/status/BETA_RELEASE_STATUS_REPORT.md` |
| Release-state truth (this system) | `docs/status/release_state.md` |
| Task backlog + format | `docs/tasks/README.md` |
| Owner decisions | `docs/tasks/owner_decisions.md` |
| Versions | `docs/version/{system,backend,frontend}.json` |
| Architecture decisions | `docs/docs/decisions/architecture_decisions.md` (DEC-001…004) |
| Production configuration surface | `docs/docs/ops/production_config.md` — Required/Optional/Dev-only env vars |

**Version/ChangeLog rule**: any contract change ⇒ bump the component
`version/*.json` **and** add a `changelog/*.md` entry. Never one without the other.

## 3. Domains

### AUTH — Google OAuth / session / refresh
- **Authority**: `docs/backend/docs/api/auth.md`, `docs/docs/policies/security_policy.md`
- **Context**: `docs/backend/docs/plugins/google-oauth.md`, `docs/backend/docs/plugins/policy.md`, `docs/requirements/domain_icd/user.md`
- **Source (BE)**: `lingon/src/route/LingOnAuth.ts`, `LingOnSession.ts`, `src/plugins/LingOnOAuth/GoogleOAuth.ts`, `src/gateway/GoogleAuthAPI.ts`, `src/core/utils/Jwt.ts`, `src/db/refreshTokenRepository.ts`
- **Source (FE)**: `letmeknow/lib/modules/auth/`, `lib/route/lingon_auth.dart`, `lib/screen/oauth_callback_screen.dart`
- **Interfaces**: `POST /v1/auth/google`, redirect callback, refresh rotation; `ApiClient._withRetry` 401→refresh→retry
- **Do not read**: widgets, layout, weather, calendar
- **Escalate**: any change to token lifetime, cookie flags, or rotation semantics

### DASHBOARD — layout / widgets / variants
- **Authority**: `docs/requirements/domain_icd/dashboard.md`, `docs/requirements/dashboard_requirements.md`
- **Context**: `docs/frontend/docs/widgets/WidgetPresentationRule.md`, `docs/frontend/docs/theme/{ThemeGuide,CardComponent}.md`
- **Source**: `letmeknow/lib/core/dashboard/`, `lib/layout/`, `lib/widget/`, `lib/core/design/`, `lib/core/registry/widget_registry.dart`
- **Tests**: `letmeknow/test/widget/`, `test/core/dashboard/`, `test/integration/dashboard_layout_resolution_test.dart`
- **Do not read**: `lingon/` (dashboard is frontend-only), auth internals
- **Escalate**: adding a widget type (needs Domain ICD entry first)

### WEATHER
- **Authority**: `docs/requirements/domain_icd/weather.md`, `docs/backend/docs/api/weather.md` (now carries an 11-row `## Errors` `error.code` table, added by TASK-007). Client-emitted `RouteException` codes are documented in `docs/docs/policies/error_policy.md` (table added by TASK-007); they originate in `letmeknow/lib/core/utils/error_handler.dart` and `lib/core/base/base_route.dart`.
- **Source (BE)**: `lingon/src/route/LingOnWeather.ts`, `src/gateway/OpenWeatherAPI.ts`
- **Source (FE)**: `letmeknow/lib/modules/weather/weather_module.dart`, `weather_error_mapper.dart`, `lib/route/lingon_weather.dart`, `lib/widget/weather_*`
- **Resolved**: error mapping landed in TASK-002 (`weather_error_mapper.dart`)

### CALENDAR — Google Calendar
- **Authority**: `docs/backend/docs/api/calendar.md`, `docs/requirements/domain_icd/calendar.md`
- **Source (BE)**: `lingon/src/route/LingOnCalendar.ts`, `src/gateway/GoogleCalendarAPI.ts`, `GoogleTokenService.ts`, `src/db/googleTokenRepository.ts`
- **Source (FE)**: `letmeknow/lib/modules/calendar/`, `lib/widget/calendar_widget.dart`
- **Reference pattern**: `google_calendar_data_source.dart:29` `_codeToMessage` — the canonical error-mapping shape to copy

### LLM / AI PLATFORM — **contract frozen at system 0.2.0; implemented, integration-unverified**
> Built TASK-005 (backend) + TASK-009 (frontend). Both validated against **mocked
> transports only** — never against a live server with a real provider credential.
> Chat is **not** proven working end-to-end. Streaming returns 501; CHAT-002 = 0%.
- **Authority**: `docs/requirements/domain_icd/llm.md`, `docs/requirements/llm_gateway_requirements.md` (LLM-001…007), `docs/docs/icd/action_layer_api.md`
- **Implementation spec (already written — follow, do not re-derive)**:
  `docs/docs/ai_platform/backend_prompt_ai_gateway.md`,
  `docs/docs/ai_platform/frontend_prompt_ai_chat_gateway.md`
- **Review evidence**: `docs/docs/ai_platform/2026-08-01-ai-platform-review.md` (findings H5, M3, M4)
- **Source (BE, built in TASK-005)**: `lingon/src/gateway/llm/` (`types.ts`, `LlmErrors.ts`, `OpenAIProvider.ts`, `GeminiProvider.ts`, `LlmGatewayService.ts`), `src/route/LingOnActions.ts` (`POST /v1/actions/execute`, `GET /v1/actions/types`), adapter base `src/core/base/BaseGateway.ts`, `src/db/apiKeyRepository.ts`
- **Base-class contract (H5/M3) — do not regress**: `getApiKey()` precedence is **injected `apiKey` first**, repo second (reversed in TASK-005; the old order silently served the platform key in place of a user's BYOK key). `GatewayKeyRepo` is **platform-scoped only** — never for user-scoped credentials; `RequestScopedGatewayDeps` (`keyRepo?: never`) enforces this at the type level. `httpPostJson` is a **separate** method from `httpGetJson`, deliberately duplicated so the OpenWeather GET path cannot regress; 3 tests pin GET's behaviour.
- **Logging rule**: never log a caught provider error whole. `ProviderHttpError.providerBody` is attacker-influenced and can echo user chat content. Log the fixed projection (`BaseGateway.ts:573-596`). Known residual: `httpGetJson` still logs its error whole (no request body, pre-existing) — now recorded as an OPEN Owner decision in `docs/docs/policies/logging_policy.md`; do not resolve it here.
- **There are THREE log sinks**, not two — see `docs/docs/policies/logging_policy.md` for the full rule set:
  1. **pino** — console/file request logger (`lingon/src/core/utils/Logger.ts`, `AppLogger` class). `appLogger.log.fatal` is this sink, not a separate one.
  2. **`appLogger.saveRawLog` → `raw_logs`** (`Logger.ts:347`) — server lifecycle, unhandled exceptions, provider errors; written from `BaseGateway`'s error paths and `AppError.plugin`.
  3. **`appLogger.saveRequestLog` → `request_logs`** (`Logger.ts:313`) — one row per HTTP response, written by the `onResponse` hook in `lingon/src/plugins/LingOnDataManage/RequestLog.ts`. **This is the sink that leaked**: it stored `req.query` verbatim (`RequestLog.ts:40`), capturing a live LingOn JWT (`?access_token=`) and the Google OAuth code; now redacted inside `saveRequestLog` (`Logger.ts:328`).
  Any leak-guard test must intercept **all three**, and must assert non-vacuously (`logLines.length > 0`) or an empty sink makes the assertion pass for the wrong reason.
- **Credential isolation is pinned** by `lingon/tests/security/byokIsolation.test.ts` (16 tests): per-user resolution, no cross-user fallback, body-supplied `userId` ignored, H5 precedence, no key in any sink. The H5 precedence test is **structurally untestable through the route** — `RequestScopedGatewayDeps` types `keyRepo?: never` — so it must stay pinned at the `BaseGateway` level. Verified by mutation: inverting the precedence turns it red.
- **Frontend provider list** must come from `GET /v1/actions/types`, not a hardcoded enum (fixes M4 — TASK-009); reinforced by Owner decision D-005 (registry-derived, no hardcoded list anywhere) — see BYOK / API KEYS section below.
- **Source (FE, rewired in TASK-009)**: `letmeknow/lib/route/lingon_actions.dart`, `lib/gateway/llm/lingon_llm_gateway.dart`, `lib/modules/chat/chat_module.dart`, `chat_error_mapper.dart`, `lib/route/lingon_api_key.dart`. `openai_gateway.dart` and `llm_provider.dart` are **deleted** — do not reintroduce a client-side provider call or a hardcoded provider enum.
- **Hard rule**: `User → Intent/Action → Action Layer → LLM Gateway → Provider`.
  `User → LLM → Dashboard` is forbidden (DEC-004). LLM is an engine, not a product layer.
- **Do not read**: dashboard/layout, weather, calendar

### BYOK / API KEYS
- **Authority**: `docs/backend/docs/api/apikey.md`, `docs/backend/docs/database/user_api_keys.md`, `docs/docs/policies/security_policy.md`
- **Source (BE)**: `lingon/src/route/LingOnApiKey.ts`, `src/db/apiKeyRepository.ts`, `src/db/encrypt.ts`
- **Source (FE)**: `letmeknow/lib/route/lingon_api_key.dart` (implemented, **no UI calls it**)
- **Rule**: AES-256-GCM under `MASTER_ENCRYPTION_KEY` (≠ `JWT_SECRET`). Keys never logged.
- **Provider support is registry-derived (Owner decision D-005) — there is NO hardcoded provider list anywhere, frontend or backend.** `PROVIDER_REGISTRY` in `lingon/src/gateway/llm/LlmGatewayService.ts:161` is the single source of truth (currently `openai`, `gemini` — Anthropic/OpenRouter no longer supported). `SUPPORTED_PROVIDER_IDS` is derived from it (`LlmGatewayService.ts:188`); `lingon/src/route/LingOnApiKey.ts:5` imports it. A third stale copy, `LLM_PROVIDER_IDS` in `lingon/src/gateway/llm/types.ts`, was deleted. Adding a provider = one `IAIProvider` adapter + one Map row.
- **DELETE asymmetry (routing gotcha)**: `DELETE /v1/apikey/:provider` is **deliberately not** restricted to the supported set (`LingOnApiKey.ts:154`) so a key stored for a de-advertised provider stays deletable; `GET /v1/apikey/status` surfaces it for the same reason.

### DATABASE / MIGRATIONS
- **Authority**: `docs/backend/docs/database/` (one file per table). ⚠️ Four known divergences where the documents are wrong and the baseline followed the code — see TASK-003 Execution Log (most important: `users.id` needs `DEFAULT gen_random_uuid()` or login fails, since `userRepository` INSERTs supply no `id`).
- **Source**: `lingon/migrations/` (run order `000`→`005`, see `migrations/README.md`), `lingon/src/db/`. ⚠️ `request_logs` and `raw_logs` have **no repository** — they are written directly by `lingon/src/core/utils/Logger.ts` and `src/plugins/LingOnDataManage/RequestLog.ts`. Read those for those two tables' shape.
- **Also stale**: `lingon/CLAUDE.md` describes a `user_api_keys` `id bigserial` PK + FKs that the SSOT does not document. SSOT wins.
- **Resolved**: baseline schema landed in TASK-003; `000`→`005` is reproducible and idempotent, verified on a real PostgreSQL 18.6 cluster.

### BACKEND PLATFORM — app wiring, CORS, rate limit, logging
- **Authority**: `docs/docs/policies/{security,logging,error}_policy.md`, `docs/backend/docs/plugins/`
- **Source**: `lingon/src/app.ts`, `src/config/env.ts`, `src/plugins/LingOnDataManage/`
- ⚠️ **Adding an env var touches THREE files**: the `@fastify/env` `schema.properties` in `src/app.ts`, `src/config/env.ts`, **and** `src/config/FastifyDefinition.ts` — which hand-types `FastifyInstance.config`. Miss the third and `app.config.X` will not typecheck (and a worker will reach for a cast). Leave `schema.required` alone unless the server genuinely cannot start without the value.
- **Resolved**: CORS allowlist landed in TASK-004 (`CORS_ALLOWED_ORIGINS`, exact string match, no-`Origin` passthrough). Registration order after `plugins/` is load-bearing — do not move it.
- **Tests**: `lingon/tests/` (`node:test` via `tsx`; `tsconfig.json` excludes `tests`, `tsconfig.test.json` typechecks them). Keep suites hermetic — no live DB, no network. The `pg` Pool is lazy and opens nothing at import; `encrypt.ts`/`Jwt.ts` read `process.env` at call time, so set and restore secrets in `finally`.
- ⚠️ **No shared success-envelope helper exists** — `{success,data,error}` is an inline literal in all nine `src/route/*.ts`. Only the *error* envelope is centralised (`AppError.plugin`). The success shape can drift per route.
- ⚠️ **This repo tracks `node_modules/` in git** (~2,948 files). Any dependency change produces an enormous diff alongside the lockfile. Expected artefact, not stray edits.
- ⚠️ **Never log a raw provider/SDK error object.** Use the shared helpers in `lingon/src/core/utils/Logger.ts`: `projectErrorForLog(err)` (`Logger.ts:169`, allowlists `{name, message?, code?, status?}`), `redactQueryParams(query)` (`Logger.ts:123`), `sanitizeRequestUrl(url)` (`Logger.ts:97`) — one shared list, `REDACTED_QUERY_PARAMS`, 11 entries (`Logger.ts:84`).
- ⚠️ **pino's `redact.paths` `*` is a SINGLE-level wildcard** (`Logger.ts:276`): `*.headers.authorization` redacts `X.headers.authorization` but NOT `err.config.headers.authorization`, one level deeper. `redact.paths` is **not** a backstop — a raw Gaxios/Boom error logged as `{ err }` writes a live `client_secret`, refresh token, or Bearer token straight past it. Five such leaks were fixed 2026-09-14.
- **Correlation id is unified**: `requestIdHeader: 'x-request-id'` + `genReqId: () => randomUUID()` (`lingon/src/app.ts:124-125`), `RequestContext` reuses `req.id` (`RequestContext.ts:23`) — one id spans pino `reqId`, `request_logs.req_id`, `raw_logs.reqId`, previously unrelated.
- **Authority for all of the above**: `docs/docs/policies/logging_policy.md` (being expanded with the full rule set + four OPEN Owner decisions) — reference it, do not restate it here.

### RELEASE / DEPLOY
- **Authority**: `docs/docs/ops/deployment_sop.md` — rewritten by TASK-007 against the real pipeline (build → rsync → Apache `current` symlink, symlink rollback, web-secret exposure). Authority has returned to it; this section is now a pointer, not a substitute. `docs/status/required_human_resource.md` covers human-only steps. Production configuration surface (Required/Optional/Dev-only env vars): `docs/docs/ops/production_config.md`.
- **D-004 DECIDED (Owner, 2026-09-14): Apache static serving is production.** The canonical production path is Flutter release static build → versioned release directory (`/var/www/lingon/releases/<timestamp>`) → rsync + permissions → Apache → `current` symlink — i.e. the `letmeknow/compile_release.sh` line. `letmeknow/run_release.sh` (`flutter run -d web-server` on :4443) is **Development Only** and is NOT a production path.
- **Open deploy gaps** (recorded, unowned): backend deploy never starts or reloads a process despite PM2 being installed; nothing prunes old `releases/*`.
- **Source**: `letmeknow/compile_release.sh` (fixed in TASK-001: `FLUTTER_DEFINE_ARGS` now defined, `PROJECT_DIR` derived from `BASH_SOURCE`, `assert_no_secret_defines()` guard, `SKIP_DEPLOY=1` opt-out for local build validation), `run_release.sh`, `lingon/server_deploy.sh`, `server_init.sh`
- **Deploy shape**: frontend builds to **Flutter Web**, rsync'd to `/var/www/lingon/releases/*`, Apache serves via `current` symlink. ⇒ *any* `--dart-define` secret is public in served JS.

## 4. Validation commands (the only accepted completion evidence)

Six rows below were re-verified 2026-09-14 at `lingon@b5fad88` / `letmeknow@48bc665`
(superseding the prior baseline figures for those rows); the remaining rows are
unchanged from the prior baseline.

| Scope | Command | Verified baseline 2026-09-14 |
|---|---|---|
| Frontend static | `cd letmeknow && flutter analyze` | **clean, 0 issues** |
| Frontend tests | `cd letmeknow && flutter test` | **283 passing**, exit 0 |
| Backend types | `cd lingon && ./node_modules/.bin/tsc -p tsconfig.json --noEmit` | **clean, exit 0** (requires full `npm install`) |
| Backend build | `cd lingon && npm run build` | **exit 0** |
| Backend tests | `cd lingon && npm test` | **230 passing / 68 suites**, 0 fail, 0 skipped, exit 0 (`node:test` via `tsx`) |
| Backend test types | `cd lingon && npm run test:types` | **clean, exit 0** (`tsconfig.test.json`) |
| Frontend release build | `cd letmeknow && SKIP_DEPLOY=1 bash ./compile_release.sh` | **exit 0**, builds `build/web/` without `sudo` |
| Client secret leak | `grep -raoE "sk-[A-Za-z0-9_-]{20,}" letmeknow/build/web` | **no matches** |
| Dependency risk | `cd lingon && npm audit` | **found 0 vulnerabilities**, exit 0 |

⚠️ **Do not use `grep -ril "sk-" build/web` as a secret check.** It always matches:
CanvasKit/Skia embeds ICU locale tags and `sk-SK` is Slovak. Use the key-shaped
regex above.

**Test-infrastructure files** (routed as read-only for any Flutter test work):
`letmeknow/lib/core/base/base_gateway.dart` — `BaseGateway.clearAll()` /
`isRegistered<T>()` are how a test isolates itself from other files' gateway
registrations. Call `clearAll()` in `setUp`.

**Error-mapping rule (frontend).** `BaseModule.runGuarded`
(`base_module.dart:73`) ends in `setErrorMessage(e.toString())`, so **any module
that does not map its errors first renders raw exception text to the user**. Every
module must catch and rethrow a domain exception whose `toString()` *is* the user
message. Existing mappers: `weather_error_mapper.dart`, `brief_error_mapper.dart`,
`google_calendar_data_source.dart:29`. `runGuarded` itself is **not** to be
changed — considered and rejected twice (it would alter every module at once and
would mask which modules still lack real mapping); escalate instead.
Regression check: `grep -rn "setErrorMessage(e.toString())" lib/ | grep -v ":[0-9]*:///"`
must return exactly one line (`base_module.dart:73`).
Still unmapped: `chat_module.dart` — owned by TASK-009.

`flutter` 3.41.2 and `dart` 3.11.0 **are installed and `flutter doctor` is clean** —
prior SSOT reports written under "Flutter SDK unavailable" are obsolete on that point.

## 5. Routing failures

If a task forced you outside its route, append to the task's Execution Log:
what was missing, which file you actually needed, and whether this file should
change. Repeat offenders get a permanent entry here.
