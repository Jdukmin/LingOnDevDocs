# TASK-006 — Backend has no test runner
Status: Validated
Priority: P2
Category: Autonomous
Release relevance: Gates trustworthy evidence for all backend work, incl. TASK-005.

## Objective
Give `lingon` a working test runner and a first meaningful suite, so backend
tasks can produce real validation evidence instead of typecheck-only.

## Evidence / Background
- `lingon/package.json` has scripts `dev`, `build`, `start` — **no `test`**, and
  no test framework in `devDependencies`.
- Verified 2026-09-14: `tsc --noEmit` passes cleanly, so the only backend
  evidence currently obtainable is "it compiles".
- By contrast the frontend has 98 passing tests, so the SSOT's blanket claim of
  "automated tests 0" is only true of the backend (see TASK-007).

## Authoritative Documents
- `docs/backend/docs/DevelopmentGuide.md` (conventions to match)
- `docs/docs/workflow.md` ("Real Execution Only" evidence rule)

## Scope
- Add a test runner appropriate to the stack (Node ESM + TypeScript via `tsx`,
  which is already a devDependency — prefer it over adding a heavy new toolchain).
- Wire an `npm test` script.
- Write a first suite over pure, high-value logic that needs no live DB or
  network: `src/core/utils/` (`AppError`, `Jwt`, `Crypto`), `src/db/encrypt.ts`
  (AES-256-GCM round-trip), and response-envelope shaping.

## Out of Scope
- Integration tests against a live PostgreSQL or live Google/OpenWeather.
- CI pipeline configuration.
- Retrofitting tests across all routes — first suite only.

## Affected Components
`lingon/package.json`, new test directory, no production source changes.

## Dependencies
None. Should precede TASK-005.

## Acceptance Criteria
1. `npm test` runs and passes from a clean `npm install`.
2. Encryption round-trip is covered (encrypt→decrypt yields the original; a
   tampered payload fails).
3. Tests need no live database or network.
4. `tsc --noEmit` stays clean.
5. No production behaviour changes.

## Validation Plan
```
cd lingon
npm install
npm test
./node_modules/.bin/tsc -p tsconfig.json --noEmit
```
Paste the full runner output into the Execution Log.

## Owner Decisions
None.

## Execution Log / Evidence

Executed 2026-09-14 by ORCH-BE2. All commands run from `lingon/` on
Node v22.14.0 / npm 10.9.2. Every output below is literal.

### Runner choice
Node's built-in `node:test` driven through the already-installed `tsx` loader
(`node --import tsx --test`). No new dependency was added — `tsx@4.21.0` was
already in `devDependencies`. Rejected jest/vitest: both would add a large
toolchain plus ESM / `module: nodenext` interop configuration for no gain on a
pure-unit suite. Glob expansion by the Node test runner was verified working on
this Node version before the design was fixed.

### Changes

`lingon/package.json:9-10` — two scripts added; `dev`/`build`/`start` untouched:

```diff
@@ -6,7 +6,9 @@
   "scripts": {
     "dev": "tsx watch src/app.ts",
     "build": "tsc -p tsconfig.json",
-    "start": "node dist/app.js"
+    "start": "node dist/app.js",
+    "test": "node --import tsx --test \"tests/**/*.test.ts\"",
+    "test:types": "tsc -p tsconfig.test.json --noEmit"
   },
```

`lingon/tsconfig.json:3` — one key added:

```diff
@@ -1,5 +1,6 @@
 {
   // Visit https://aka.ms/tsconfig to read more about this file
+  "exclude": ["dist", "tests"],
   "compilerOptions": {
     // File Layout
     "rootDir": "./src",
```

Rationale: `rootDir` is `./src` and the config has no `include`, so an
un-excluded `tests/` would break `tsc -p tsconfig.json` with TS6059 and would
also emit test files into `dist/`. Excluding it keeps `npm run build` and
`tsc -p tsconfig.json --noEmit` identical in meaning to before.

`lingon/tsconfig.test.json` (new) — so the tests are still type-checked:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "rootDir": ".", "noEmit": true,
                       "declaration": false, "declarationMap": false },
  "include": ["src", "tests"],
  "exclude": ["dist", "node_modules"]
}
```

New test files (no production source was modified — `git diff --stat -- src`
shows only `src/app.ts`, `src/config/env.ts`, `src/config/FastifyDefinition.ts`,
which are TASK-004's uncommitted CORS work, untouched by this task):

- `lingon/tests/core/utils/AppError.test.ts`
- `lingon/tests/core/utils/Jwt.test.ts`
- `lingon/tests/core/utils/Crypto.test.ts`
- `lingon/tests/db/encrypt.test.ts`

### Test names (29 tests, 5 suites)

**`tests/core/utils/Crypto.test.ts` — suite `cryptoUtil`**
1. encrypt returns the base64 encoding of the input
2. encrypt then decrypt round-trip returns the original string
3. round-trip preserves non-ASCII / unicode text
4. round-trip preserves the empty string

**`tests/core/utils/AppError.test.ts` — suite `AppError`**
5. stores code, statusCode and message
6. is an instanceof Error and its name is "AppError"
7. meta is undefined when omitted and preserved verbatim when supplied
8. is catchable through a normal try/catch as an Error

**`tests/core/utils/AppError.test.ts` — suite `AppError.plugin — ICD error envelope shaping`**
9. shapes a 400 AppError without meta into the ICD envelope with meta: null
10. shapes a 502 AppError with meta into the ICD envelope preserving meta

> These two use a bare `fastify({ logger: false })` instance plus `app.inject()`.
> No socket and no database. The non-`AppError` branch of the handler was
> deliberately left uncovered: it calls `appLogger.saveRawLog()`, which would
> attempt a real PostgreSQL connection and violate acceptance criterion 3.

**`tests/core/utils/Jwt.test.ts` — suite `Jwt`**
11. issueAccessToken -> verifyAccessToken round-trip returns userId / provider / email / tokenVersion
12. issueRefreshToken -> verifyRefreshToken round-trip returns the same claims
13. verifyAccessToken rejects a refresh token (wrong type) with AppError UNAUTHORIZED/401
14. verifyRefreshToken rejects an access token (wrong type) with AppError 401
15. a tampered signature is rejected with AppError 401
16. a malformed token (not three dot-separated parts) is rejected with AppError 401
17. a token signed with a different JWT_SECRET is rejected with AppError 401
18. an expired token is rejected with AppError 401
19. ACCESS_TTL_SECONDS === 3600
20. REFRESH_TTL_SECONDS === 2592000

**`tests/db/encrypt.test.ts` — suite `db/encrypt`** (acceptance criterion 2)
21. encrypt -> decrypt returns the exact original plaintext (AES-256-GCM round-trip)
22. round-trip preserves unicode and a long (>1KB) plaintext
23. two encryptions of the same plaintext produce DIFFERENT ciphertexts (fresh random IV per call)
24. the blob decodes as base64 and is at least 28 bytes (12-byte IV + 16-byte tag)
25. decrypt throws when the ciphertext body is tampered (byte flipped after offset 28)
26. decrypt throws when the 16-byte auth tag is tampered (offsets 12..27)
27. decrypt throws when the IV is tampered (offsets 0..11)
28. decrypt throws under a different MASTER_ENCRYPTION_KEY than the one used to encrypt
29. encrypt throws when MASTER_ENCRYPTION_KEY is absent, and when it is the wrong length

Both `src/db/encrypt.ts` and `src/core/utils/Jwt.ts` read `process.env` lazily
at call time, so the suites set `MASTER_ENCRYPTION_KEY` / `JWT_SECRET` in the
test body and restore them in `finally`. `.env` is empty in this checkout and
`dotenv.config()` does not override already-set variables, so the suite is
hermetic and order-independent.

### Validation — run by the orchestrator, not the implementer

```
$ ./node_modules/.bin/tsc -p tsconfig.json --noEmit ; echo "TSC_EXIT=$?"
TSC_EXIT=0

$ ./node_modules/.bin/tsc -p tsconfig.test.json --noEmit ; echo "TSCTEST_EXIT=$?"
TSCTEST_EXIT=0

$ npm run build ; echo "BUILD_EXIT=$?"

> lingon@0.0.1 build
> tsc -p tsconfig.json

BUILD_EXIT=0
```

```
$ npm test

> lingon@0.0.1 test
> node --import tsx --test "tests/**/*.test.ts"

TAP version 13
# Subtest: AppError
    ok 1 - stores code, statusCode and message
    ok 2 - is an instanceof Error and its name is "AppError"
    ok 3 - meta is undefined when omitted and preserved verbatim when supplied
    ok 4 - is catchable through a normal try/catch as an Error
    1..4
ok 1 - AppError
# Subtest: AppError.plugin — ICD error envelope shaping
    ok 1 - shapes a 400 AppError without meta into the ICD envelope with meta: null
    ok 2 - shapes a 502 AppError with meta into the ICD envelope preserving meta
    1..2
ok 2 - AppError.plugin — ICD error envelope shaping
# Subtest: cryptoUtil
    ok 1 - encrypt returns the base64 encoding of the input
    ok 2 - encrypt then decrypt round-trip returns the original string
    ok 3 - round-trip preserves non-ASCII / unicode text
    ok 4 - round-trip preserves the empty string
    1..4
ok 3 - cryptoUtil
# Subtest: Jwt
    ok 1 - issueAccessToken -> verifyAccessToken round-trip returns userId / provider / email / tokenVersion
    ok 2 - issueRefreshToken -> verifyRefreshToken round-trip returns the same claims
    ok 3 - verifyAccessToken rejects a refresh token (wrong type) with AppError UNAUTHORIZED/401
    ok 4 - verifyRefreshToken rejects an access token (wrong type) with AppError 401
    ok 5 - a tampered signature is rejected with AppError 401
    ok 6 - a malformed token (not three dot-separated parts) is rejected with AppError 401
    ok 7 - a token signed with a different JWT_SECRET is rejected with AppError 401
    ok 8 - an expired token is rejected with AppError 401
    ok 9 - ACCESS_TTL_SECONDS === 3600
    ok 10 - REFRESH_TTL_SECONDS === 2592000
    1..10
ok 4 - Jwt
# Subtest: db/encrypt
    ok 1 - encrypt -> decrypt returns the exact original plaintext (AES-256-GCM round-trip)
    ok 2 - round-trip preserves unicode and a long (>1KB) plaintext
    ok 3 - two encryptions of the same plaintext produce DIFFERENT ciphertexts (fresh random IV per call)
    ok 4 - the blob decodes as base64 and is at least 28 bytes (12-byte IV + 16-byte tag)
    ok 5 - decrypt throws when the ciphertext body is tampered (byte flipped after offset 28)
    ok 6 - decrypt throws when the 16-byte auth tag is tampered (offsets 12..27)
    ok 7 - decrypt throws when the IV is tampered (offsets 0..11)
    ok 8 - decrypt throws under a different MASTER_ENCRYPTION_KEY than the one used to encrypt
    ok 9 - encrypt throws when MASTER_ENCRYPTION_KEY is absent, and when it is the wrong length
    1..9
ok 5 - db/encrypt
1..5
# tests 29
# suites 5
# pass 29
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 743.4858
TEST_EXIT=0
```

(TAP `---` / `duration_ms` detail blocks elided for readability; the pass/fail
counters are verbatim.)

Scope checks:

```
$ git status --short -- tests tsconfig.test.json
?? tests/
?? tsconfig.test.json

$ git status --short -- package-lock.json
(empty — lockfile untouched, TASK-008 owns it)

$ ls dist
app.d.ts  app.d.ts.map  app.js  app.js.map  config  core  db  gateway  plugins  route
(no `tests` directory — build output unpolluted)
```

### Divergence found
`## Scope` of this task also names "response-envelope shaping" as a unit to
test. There is **no shared response-envelope helper** in the codebase — the
`{ success, data, error }` success envelope is written as an inline object
literal in each of the nine files under `src/route/` and in
`src/core/base/BaseRoutes.ts`'s doc example. Only the *error* envelope is
centralised, inside `AppError.plugin`. Tests 9-10 cover that centralised error
envelope; the success envelope has no single unit to test.
Classification: **Implementation Correction Required** — a shared envelope
helper should exist so the success shape is testable and cannot drift per
route. Filed as an observation, not fixed here, since this task forbids
production source changes.

## Completion Result

**Validated.** All five acceptance criteria met:

1. `npm test` runs and passes — 29 tests, 5 suites, `# pass 29 / # fail 0`, exit 0.
2. AES-256-GCM round-trip covered, plus tampering of body, auth tag and IV, and
   a wrong-key decrypt (tests 21-29).
3. No live database and no network: the pg `Pool` in `src/db/pool.ts` is lazy and
   opens no connection at import; the two Fastify tests use in-process
   `app.inject()`. Full suite runs in ~0.74 s.
4. `tsc -p tsconfig.json --noEmit` exit 0 (and the new `tsconfig.test.json`
   type-checks the tests themselves, also exit 0).
5. No production behaviour change — `src/` untouched; `dist/` output unchanged
   apart from being rebuilt.

Files: `lingon/package.json`, `lingon/tsconfig.json`, `lingon/tsconfig.test.json`,
`lingon/tests/core/utils/AppError.test.ts`, `lingon/tests/core/utils/Jwt.test.ts`,
`lingon/tests/core/utils/Crypto.test.ts`, `lingon/tests/db/encrypt.test.ts`.
Changes left uncommitted in the working tree per instruction.
