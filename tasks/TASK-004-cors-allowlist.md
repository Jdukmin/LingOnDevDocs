# TASK-004 — CORS reflects every origin
Status: Validated
Priority: P1
Category: Autonomous (mechanism is not a decision; deployed value is D-003)
Release relevance: Security hardening required before any public exposure.

## Objective
Replace unrestricted origin reflection with a configurable allowlist.

## Evidence / Background
- `lingon/src/app.ts:135` — `await app.register(cors, { origin: true });`
  reflects the caller's `Origin` header for every request, with credentials in
  play (`@fastify/cookie` is registered and auth uses cookies).
- `docs/docs/policies/security_policy.md` requires an explicit allowlist.
- Known legitimate origin from code: `https://www.ling-on.com`
  (`letmeknow/lib/core/network/api_client.dart:57`).
- Registration order is load-bearing: the comment at `app.ts:132-135` records
  that cors must stay **after** `plugins/` so `RequestContext`'s `onRequest` hook
  sets `req.ctx` before cors short-circuits OPTIONS preflight. Preserve this.

## Authoritative Documents
- `docs/docs/policies/security_policy.md`
- `docs/backend/docs/plugins/request-context.md` (hook-order constraint)

## Scope
- Add a `CORS_ALLOWED_ORIGINS` env entry (comma-separated) to `src/config/env.ts`
  following the existing env-schema style, defaulting to `https://www.ling-on.com`.
- Register cors with an allowlist derived from it, keeping current registration order.
- Non-browser callers (no `Origin` header, e.g. the Android client) must keep working.
- Document the new variable where backend env vars are already documented.

## Out of Scope
- HTTPS/HSTS enforcement (separate concern, partly reverse-proxy/human-owned).
- Changing auth, cookie flags, or rate limiting.

## Affected Components
`lingon/src/app.ts`, `lingon/src/config/env.ts`, backend env documentation.

## Dependencies
None. D-003 supplies the deployed *value*, not the code.

## Acceptance Criteria
1. `origin: true` is gone.
2. An allowed origin receives the correct `Access-Control-Allow-Origin`.
3. A disallowed origin is rejected / not reflected.
4. A request with no `Origin` header still succeeds.
5. OPTIONS preflight still works and `req.ctx` is still set — hook order intact.
6. Default value works with no env configuration present.

## Validation Plan
```
cd lingon
./node_modules/.bin/tsc -p tsconfig.json --noEmit
npm run build
```
Typecheck must stay clean. Then boot the server and capture headers for: an
allowed origin, a disallowed origin, a request with no Origin header, and an
OPTIONS preflight.

If the server cannot boot locally (missing DB/secrets), report the exact failure
and validate the allowlist logic via an automated test instead — do not claim
success from inspection.

## Owner Decisions
D-003 (deployed origin list; does not block this task).

## Execution Log / Evidence

**Executed 2026-09-14 by ORCH-BE.** Implementation by a Sonnet worker; every
validation result below was produced by the orchestrator running the commands.

### Changes

| File | Change |
|---|---|
| `lingon/src/app.ts:32-33` | Added `CORS_ALLOWED_ORIGINS: { type: 'string', default: 'https://www.ling-on.com' }` to the `@fastify/env` JSON schema. Not added to `required`. |
| `lingon/src/app.ts:82-84` | Extended the registration-order doc-comment (item 6) to record the allowlist and the no-`Origin` passthrough. |
| `lingon/src/app.ts:135-164` | Replaced `await app.register(cors, { origin: true });` with a parsed allowlist plus an `origin` callback. |
| `lingon/src/config/FastifyDefinition.ts:50-51` | Added `CORS_ALLOWED_ORIGINS: string;` to the hand-maintained `FastifyInstance.config` type augmentation. |
| `lingon/src/config/env.ts:24-33` | Added the `CORS_ALLOWED_ORIGINS` entry in the file's existing style, same default. |
| `lingon/CLAUDE.md:413` | One row added to the "Environment variables" table. |
| `docs/backend/docs/deployment/README.md:56` | One row added to the "Other variables consumed at runtime" table. |

The registration itself (`app.ts:154-164`):

```ts
  const allowedOrigins = app.config.CORS_ALLOWED_ORIGINS
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  await app.register(cors, {
    origin: (origin: string | undefined, callback: (err: Error | null, allow: boolean) => void) => {
      if (origin === undefined || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    }
  });
```

A disallowed origin gets `(null, false)` rather than a thrown `Error`, so
`@fastify/cors` simply omits `Access-Control-Allow-Origin` instead of surfacing a
500 through `AppError.plugin`'s handler. `credentials` was **not** added — that
would be an auth/cookie behaviour change and is out of scope.

### AC 5 — registration order preserved

`git diff` shows no `app.register(...)` call moved. Order in the built file:
`AutoLoad` for `plugins/` at `app.ts:133` → `cors` at `app.ts:135-164` →
`rateLimit` immediately after. The existing explanatory comment at lines 132-134
is intact and was extended, not replaced.

### Typecheck and build (verbatim)

```
=== tsc --noEmit ===
tsc_exit=0
=== npm run build ===

> lingon@0.0.1 build
> tsc -p tsconfig.json

build_exit=0
```

Both clean — no output, no warnings. Baseline (`tsc --noEmit` clean) preserved.

### Runtime verification — the server was actually booted

`node dist/app.js` was booted on port 4455 against a throwaway PostgreSQL 18.6
instance carrying the TASK-003 baseline schema (the local 5432 service rejected
authentication, so a scratch cluster was used). `CORS_ALLOWED_ORIGINS` was
**deliberately left unset** for this run, so this also proves AC 6.

```
=============== 1. ALLOWED ORIGIN (https://www.ling-on.com) ===============
HTTP/1.1 200 OK
vary: Origin
access-control-allow-origin: https://www.ling-on.com
=============== 2. DISALLOWED ORIGIN (https://evil.example.com) ===============
HTTP/1.1 200 OK
vary: Origin
  (no access-control-allow-origin line above = not reflected)
=============== 3. NO ORIGIN HEADER (Android client) ===============
HTTP/1.1 200 OK
=============== 4. OPTIONS PREFLIGHT, allowed origin ===============
HTTP/1.1 204 No Content
vary: Origin, Access-Control-Request-Headers
access-control-allow-origin: https://www.ling-on.com
access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE
=============== 5. OPTIONS PREFLIGHT, disallowed origin ===============
HTTP/1.1 404 Not Found
```

- **AC 1** — `origin: true` is gone (see diff above).
- **AC 2** — case 1: the allowed origin is echoed exactly.
- **AC 3** — case 2: no `Access-Control-Allow-Origin` header at all, so a browser
  blocks the response. The body is still served on the wire (HTTP 200) — that is
  normal, correct CORS behaviour: CORS is enforced by the browser, not the
  server, and this endpoint is unauthenticated. Case 5 shows the preflight for a
  disallowed origin fails outright (404, no CORS headers), so any
  non-simple/credentialed cross-origin request is blocked before it is sent.
- **AC 4** — case 3: no `Origin` header, HTTP 200. Android/server-to-server
  callers keep working.
- **AC 6** — every result above was produced with no `CORS_ALLOWED_ORIGINS` set,
  so the `https://www.ling-on.com` default is what was exercised.

### AC 5 — `req.ctx` proven still set during preflight

The decisive evidence is in `request_logs`, written from the `onResponse` hook
whose `latency_ms` is computed as `Date.now() - req.ctx.startedAtMs`. Rows
written by that live server:

```
method  | endpoint   | status_code | latency_ms | remote_ip
GET     | /v1/status | 200         | 3          | 127.0.0.1
OPTIONS | *          | 204         | 0          | 127.0.0.1
OPTIONS | /v1/status | 404         | 1          | 127.0.0.1
```

The OPTIONS preflight produced a complete `request_logs` row with a real
`latency_ms`. Had `req.ctx` been unset at that point, `Policy.after()`'s
`onResponse` hook would have thrown on `req.ctx.startedAtMs` — the exact
regression the comment at `app.ts:132-134` warns about. The server log contained
**0** `ERROR`/`FATAL` lines across the whole run. Hook order is intact.

### Multi-value env parsing verified

Second boot on port 4456 with
`CORS_ALLOWED_ORIGINS="https://www.ling-on.com, https://staging.ling-on.com ,http://localhost:3000"`
(deliberately including irregular whitespace):

```
Origin: https://www.ling-on.com      ->  access-control-allow-origin: https://www.ling-on.com
Origin: https://staging.ling-on.com  ->  access-control-allow-origin: https://staging.ling-on.com
Origin: http://localhost:3000        ->  access-control-allow-origin: http://localhost:3000
Origin: https://evil.example.com     ->  <no ACAO header: REJECTED>
--- no-Origin request ---
http_code=200
```

Comma splitting, whitespace trimming, multi-origin matching and rejection all
behave correctly.

### Note for the Owner (D-003)

The deployed value is still D-003's call. The code default is
`https://www.ling-on.com` only; if the Flutter Web app is ever served from an
apex domain (`https://ling-on.com`) or a staging host, those origins must be
added to `CORS_ALLOWED_ORIGINS` in deployment or they will be rejected. Exact
string match — no scheme, port, or subdomain inference.

### Deviation from the original worker brief

The worker's first pass accessed `app.config.CORS_ALLOWED_ORIGINS` through an
inline intersection-type cast, because `FastifyInstance.config`'s type is
hand-maintained in `src/config/FastifyDefinition.ts` and that file was not on the
worker's permitted list. The orchestrator widened the permission and had the cast
replaced with a proper declaration in `FastifyDefinition.ts`, matching how every
other env var in this repo is typed. No cast remains.

## Completion Result

**Validated.** `origin: true` is replaced by an env-driven, exact-match allowlist
read from `CORS_ALLOWED_ORIGINS` (default `https://www.ling-on.com`). All 6
acceptance criteria were verified against a running server, not by inspection:
allowed origins are echoed, disallowed origins are never reflected and their
preflight fails, no-`Origin` callers still succeed, the default works with no env
configuration, multi-value parsing works, and `req.ctx` is still populated during
OPTIONS preflight (proven by the preflight's own `request_logs` row). `tsc
--noEmit` and `npm run build` are both clean. Registration order is unchanged;
auth, cookie flags and rate limiting were not touched.
