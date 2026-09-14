# TASK-001 — Web release build is broken and secret-unsafe
Status: Validated
Priority: P0
Category: Autonomous
Release relevance: Blocks any distributable build. Nothing can ship until this is fixed.

## Objective
Make `letmeknow/compile_release.sh` actually produce a web release, and make the
LLM credential path safe for a **publicly served Flutter Web bundle**.

## Evidence / Background
1. `letmeknow/compile_release.sh` runs `set -euo pipefail`, then calls
   `flutter build web --release "${FLUTTER_DEFINE_ARGS[@]}"`. `FLUTTER_DEFINE_ARGS`
   is **never assigned anywhere in the file**. Under `set -u` an unbound array
   expansion aborts the script — the deploy has no working build step.
2. The deploy target is a static web bundle: build output is rsync'd to
   `/var/www/lingon/releases/<ts>` and served by Apache through a `current`
   symlink. Therefore **every `--dart-define` value is readable in the served
   JavaScript** by any visitor.
3. `letmeknow/lib/main.dart:39` reads `String.fromEnvironment('OPENAI_API_KEY')`
   and passes it to `OpenAiGateway`, which calls `https://api.openai.com/v1`
   directly (`openai_gateway.dart:20`). So the apparently-intended
   `FLUTTER_DEFINE_ARGS` would have embedded a provider secret into public JS.
4. `PROJECT_DIR="$HOME/Prototypes/lingon"` is hardcoded to one machine's layout.

Classification: **Implementation Correction Required** (code defective; no SSOT
says the client should hold a provider key — `security_policy.md` and
`domain_icd/llm.md` both require the opposite).

## Authoritative Documents
- `docs/docs/ops/deployment_sop.md`
- `docs/docs/policies/security_policy.md` (Secret management)
- `docs/requirements/domain_icd/llm.md` (client must not hold provider credentials)

## Scope
- Fix `compile_release.sh`: define the build-args array before use (default
  empty), derive `PROJECT_DIR` from the script location, keep `set -euo pipefail`.
- Ensure **no provider API key is passable via `--dart-define`** in the release
  path. Build args may carry only non-secret config (e.g. backend base URL).
- Add an explicit guard that fails the build if a known-secret define name
  (`OPENAI_API_KEY` or similar) is present.
- Verify the release build actually completes.

## Out of Scope
- Removing `OpenAiGateway` / rewiring chat to the backend — that is TASK-009.
  This task only guarantees the *build* is correct and leaks nothing.
- Apache/TLS/server configuration (human-operated).

## Affected Components
`letmeknow/compile_release.sh`; read-only reference `letmeknow/lib/main.dart`.

## Dependencies
None. TASK-009 later removes the client-side key entirely.

## Acceptance Criteria
1. `bash -n compile_release.sh` parses, and running it no longer aborts on an
   undefined variable.
2. The script builds from its own repository location, not a hardcoded `$HOME` path.
3. A release build of the web bundle completes and produces `build/web/index.html`.
4. Grep of the produced bundle shows no OpenAI key material.
5. Attempting to inject a secret define fails the build with a clear message.

## Validation Plan
```
cd letmeknow
bash -n compile_release.sh
flutter build web --release
ls build/web/index.html
grep -ril "sk-" build/web | head
flutter analyze
```
Deploy-only steps (`sudo`, `rsync`, `systemctl`) are NOT executed here; the build
path is validated locally and the deploy path is validated by inspection.

## Owner Decisions
None.

## Execution Log / Evidence

**Executed 2026-09-14 by ORCH-FE.** Implementation by a Sonnet worker; every
command below was re-run independently by the orchestrator — worker claims were
not accepted as evidence.

### What changed — `letmeknow/compile_release.sh` (75 -> 167 lines)

| Line(s) | Change |
|---|---|
| `compile_release.sh:2` | `set -euo pipefail` kept unchanged. |
| `compile_release.sh:9-11` | Hardcoded `PROJECT_DIR="$HOME/Prototypes/lingon"` replaced by `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` + `PROJECT_DIR="${PROJECT_DIR:-$SCRIPT_DIR}"`. `BUILD_DIR` still `$PROJECT_DIR/build/web`. |
| `compile_release.sh:41` | `FLUTTER_DEFINE_ARGS=()` — the array that was used but **never assigned** is now defined (root cause of the `set -u` abort). |
| `compile_release.sh:43-45` | Only non-secret config may enter the array: optional `LINGON_API_BASE_URL` -> `--dart-define=API_BASE_URL=...`. |
| `compile_release.sh:57-101` | New `assert_no_secret_defines()` guard. Checks every element of `FLUTTER_DEFINE_ARGS` **and** every CLI arg (`"$@"`) against define names `OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY|*API_KEY*|*SECRET*|*TOKEN*|*PASSWORD*|*PRIVATE_KEY*`, rejects any value matching `*=sk-*`, and refuses if one of the four named provider env vars is set. |
| `compile_release.sh:103` | Guard invoked before anything is built. |
| `compile_release.sh:117` | `flutter build web --release ${FLUTTER_DEFINE_ARGS[@]+"${FLUTTER_DEFINE_ARGS[@]}"}` — empty-array-safe under `set -u` on bash < 4.4 as well. |
| `compile_release.sh:125-129` | `SKIP_DEPLOY=1` opt-out: exits 0 after build-output verification so the build path is exercisable without `sudo`. All deploy steps (rsync/chown/chmod/symlink/apache reload) unchanged and in original order (`:131-167`). |

Scoped env check (worker design note, accepted): the environment scan matches the
four named provider keys exactly rather than wildcard-scanning the whole
environment, because unrelated `*_TOKEN`/`*_SECRET` vars are normal in dev/CI
shells and are never read into this build. The wildcard patterns still apply in
full to the two paths that actually become `--dart-define` values.

### Literal validation output (orchestrator-run)

```
$ bash -n compile_release.sh
bash -n: OK (exit 0)

$ flutter analyze
Analyzing letmeknow...
No issues found! (ran in 2.3s)

$ flutter test
00:02 +113: All tests passed!

$ SKIP_DEPLOY=1 bash ./compile_release.sh
...
Compiling lib/main.dart for the Web...                             55.1s
[OK] Built build/web
[DEPLOY] SKIP_DEPLOY=1 set; skipping deploy steps (rsync/chown/chmod/symlink/apache reload)
SCRIPT EXIT: 0

$ ls build/web/index.html
-rw-r--r-- 1 ykyk1 197609 1231 Sep 14 01:34 build/web/index.html
```

Guard behaviour, exercised against the real script with a stub `flutter` on PATH
(exit codes verbatim):

```
1. clean run, no args                          -> [stub flutter] args: build web --release                        exit 0
2. LINGON_API_BASE_URL=https://api.example.com -> ... --dart-define=API_BASE_URL=https://api.example.com          exit 0
3. --dart-define=OPENAI_API_KEY=sk-test123     -> [ERROR] Refusing to build: ... secret define ('OPENAI_API_KEY')  exit 1
4. --dart-define=MY_API_KEY=abc                -> [ERROR] Refusing to build: ... ('MY_API_KEY')                    exit 1
5. --dart-define=SESSION_TOKEN=abc             -> [ERROR] Refusing to build: ... ('SESSION_TOKEN')                 exit 1
6. --dart-define=FOO=sk-abcdef                 -> [ERROR] ... OpenAI-style API key (starts with 'sk-')             exit 1
7. OPENAI_API_KEY=sk-test123 (env form)        -> [ERROR] ... environment variable 'OPENAI_API_KEY' is set         exit 1
```

Project-dir derivation, with no `PROJECT_DIR` override:
```
[DEPLOY] Project dir: /c/Users/ykyk1/source/repos/LingOn/letmeknow
```

### Secret grep of the produced bundle

```
$ grep -ril "sk-" build/web | head
build/web/canvaskit/canvaskit.wasm
build/web/canvaskit/chromium/canvaskit.wasm
build/web/canvaskit/skwasm.wasm
build/web/canvaskit/skwasm_heavy.wasm
build/web/canvaskit/wimp.wasm
```

**These are false positives, not key material.** Context dump of the match:
`sk_SK sk-SK PRK ur_` — CanvasKit/Skia embeds ICU locale tags, and `sk-SK` is
Slovak. The key-shaped search returns nothing:

```
$ grep -raoE "sk-[A-Za-z0-9_-]{20,}" build/web
(no output)
```

`OPENAI_API_KEY` does appear once in `build/web/main.dart.js`, and that is also
not key material — it is inside a Korean UI string (".env 파일에 OPENAI_API_KEY를
추가하고 앱을 재시작..."). The *value* is empty because no define was passed;
`lib/main.dart:39-40` skips `OpenAiGateway.init` when the define is empty.

### Doc/code divergence found

1. **DevDocs Update Required** — this task file's own Validation Plan (and the
   same command as used from `/Route.md` §4) specifies `grep -ril "sk-" build/web | head`
   and treats empty output as the pass condition. That command can **never** be
   empty for a CanvasKit web build (`sk-SK` locale tags inside the Skia wasm).
   The reliable check is `grep -raoE "sk-[A-Za-z0-9_-]{20,}" build/web`.
2. **DevDocs Update Required** — `docs/docs/ops/deployment_sop.md` states
   "이 저장소에는 현재 배포 파이프라인 자체가 없다" (Status: Not Started, 0%), yet
   `letmeknow/compile_release.sh`, `letmeknow/run_release.sh` and
   `lingon/server_deploy.sh` implement a real rsync + Apache `current`-symlink
   deploy, which `/Route.md` §RELEASE/DEPLOY already documents. The SOP is stale;
   the code is not wrong. Not fixed here (docs repo is outside this task's scope).
3. The original **Implementation Correction Required** classification stands and
   is discharged for the *build path*. The client-side provider-key call site
   (`lib/main.dart:39`, `openai_gateway.dart`) still exists and is removed by
   TASK-009; the guard makes it un-feedable from the release path meanwhile.

### Route.md adherence
No file outside the TASK-001 route was needed for implementation. The orchestrator
additionally read `docs/docs/ops/deployment_sop.md` (listed as this task's
Authority) and found it contains no build/deploy specifics at all — see
divergence 2.

## Completion Result

**Validated.** All five acceptance criteria met:

1. `bash -n compile_release.sh` exits 0; a real run reaches and completes the
   build with no unbound-variable abort.
2. `PROJECT_DIR` is derived from `BASH_SOURCE`; verified to resolve to the repo
   root with no override, and still overridable by export.
3. `SKIP_DEPLOY=1 bash ./compile_release.sh` exits 0 and produces
   `build/web/index.html` (1231 bytes).
4. No OpenAI key material in the bundle (`sk-[A-Za-z0-9_-]{20,}` -> no matches);
   the raw `sk-` hits are Skia ICU locale tags.
5. Secret defines are rejected before the build with an explicit message and
   exit 1 — via CLI arg, wildcard-matching name, `sk-` value, or env var.

No regression: `flutter analyze` clean, `flutter test` 113 passing
(98 baseline + 15 new from TASK-002).
