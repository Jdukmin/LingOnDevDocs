# TASK-008 — High-severity backend dependency advisories
Status: Validated
Priority: P2
Category: Autonomous
Release relevance: Security review item before public exposure.

## Objective
Resolve or formally accept the high-severity advisories in `lingon`'s dependency tree.

## Evidence / Background
`npm audit` on `lingon` (2026-09-14, after a full `npm install`):
**3 high, 2 moderate, 2 low**. The high findings:

| Package | Advisory |
|---|---|
| `find-my-way` | DDoS via HTTP/2 — this is Fastify's router, on every request path |
| `fast-uri` | Host confusion via literal backslash authority delimiter |
| `brace-expansion` | DoS via unbounded expansion → OOM crash |

`find-my-way` and `fast-uri` are transitive through `fastify` itself, so the fix
is most likely a Fastify patch bump rather than a direct dependency change.

## Authoritative Documents
`docs/docs/policies/security_policy.md`.

## Scope
- Determine the minimum upgrade that clears the high findings.
- Apply it, preferring patch/minor bumps of the direct dependency that carries
  the vulnerable transitive.
- Verify nothing breaks.
- For anything not fixable without a breaking upgrade, record an explicit
  accepted-risk note with reachability reasoning — do not leave it silent.

## Out of Scope
- Major-version upgrades of Fastify or any framework (structural change; needs
  its own task and evidence).
- Frontend dependency upgrades (`flutter pub outdated` reports 55 constrained
  packages — separate concern, not security-flagged).
- Blanket `npm audit fix --force`.

## Affected Components
`lingon/package.json`, `lingon/package-lock.json`.

## Dependencies
Ideally after TASK-006 so a test suite backs the upgrade. If TASK-006 has not
landed, typecheck + build + a boot smoke check is the minimum evidence.

## Acceptance Criteria
1. `npm audit` reports 0 high (or each remaining one has a written, reasoned
   accepted-risk entry).
2. `tsc --noEmit` clean after the upgrade.
3. `npm run build` succeeds.
4. No major-version framework jump was performed.
5. The lockfile change is reviewable and scoped to this task.

## Validation Plan
```
cd lingon
npm audit
npm install
./node_modules/.bin/tsc -p tsconfig.json --noEmit
npm run build
npm test          # if TASK-006 has landed
npm audit
```
Record before/after audit counts.

## Owner Decisions
None.

## Execution Log / Evidence

Executed 2026-09-14 by ORCH-BE2, after TASK-006 landed (so the upgrade is backed
by a real test suite, not only a typecheck). All commands run from `lingon/` on
Node v22.14.0 / npm 10.9.2. Every output below is literal.

### Audit BEFORE

```
$ npm audit
# npm audit report

brace-expansion  2.0.0 - 2.1.3
Severity: high
brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash - GHSA-mh99-v99m-4gvg
brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation - GHSA-rgw5-rvv9-x895
node_modules/brace-expansion

esbuild  0.27.3 - 0.28.0
esbuild allows arbitrary file read when running the development server on Windows - GHSA-g7r4-m6w7-qqqr
node_modules/esbuild

fast-uri  3.0.0 - 3.1.5
Severity: high
fast-uri vulnerable to host confusion via literal backslash authority delimiter - GHSA-v2hh-gcrm-f6hx
fast-uri vulnerable to host confusion via backslash authority introducer - GHSA-7p8r-x3mc-p8w7
fast-uri vulnerable to server-side request forgery via malformed IPv6 normalization - GHSA-f65p-4m7j-42xc
fast-uri vulnerable to server-side request forgery via repeated hostname percent-decoding - GHSA-fph4-wmhf-6fwf
fast-uri vulnerable to host confusion via percent-encoded scheme normalization - GHSA-jqff-g426-hqxp
fast-uri vulnerable to host confusion via failed IDN canonicalization - GHSA-4c8g-83qw-93j6
node_modules/fast-uri

fastify  <=5.12.0
Severity: moderate
fastify vulnerable to schema validation bypass via root primitive coercion mismatch - GHSA-w2qp-rph6-63g4
fastify vulnerable to X-Forwarded-* spoofing under trustProxy hop-count - GHSA-3m5p-2c4r-xxw2
node_modules/fastify

find-my-way  <=9.6.0
Severity: high
find-my-way: DDoS with HTTP2 - GHSA-c96f-x56v-gq3h
node_modules/find-my-way

joi  17.1.1 - 17.13.5
joi: Prototype pollution via a `__proto__` language key in custom messages - GHSA-6w3j-5fw6-r9vr
joi: object().rename() with a template target can set the validated object's prototype - GHSA-gg4h-3hg2-grpc
node_modules/joi

qs  2.2.5 - 6.15.3
Severity: moderate
qs array-limit bypass via bracket-key comma parsing - GHSA-x5fp-wj9c-mxmx
qs: Denial of Service via Attacker Controlled isBuffer - GHSA-4mjr-xmp4-gh2g
node_modules/qs

7 vulnerabilities (2 low, 2 moderate, 3 high)
AUDIT_EXIT=1
```

**BEFORE: 3 high / 2 moderate / 2 low = 7.**

### Reachability analysis done before touching anything

`npm ls` established that all three high findings are transitive, and registry
checks established that every one of them has a fix INSIDE the semver range its
parent already declares — so no major jump was ever required:

| Advisory | Reached via | Fixed at | Inside parent's existing range? |
|---|---|---|---|
| find-my-way `<=9.6.0` | `fastify` → `find-my-way` (the router — on every request path) | 9.7.0+ | yes, fastify declares `find-my-way: ^9.6.0` |
| fast-uri `3.0.0-3.1.5` | `fastify` → `@fastify/ajv-compiler` / `fast-json-stringify`; also `@fastify/env` → `env-schema` → `ajv` | 3.1.6+ | yes, `ajv` declares `fast-uri: ^3.0.1` — no 4.x major needed |
| brace-expansion `2.0.0-2.1.3` | `googleapis` → `googleapis-common` → `gaxios` → `rimraf` → `glob` → `minimatch` | 2.1.4 | yes — no 3.x/4.x major needed |

### Action taken

Two commands, no `--force`, no manual range edits:

```
$ npm audit fix
added 2 packages, changed 8 packages, and audited 219 packages in 2s
```
cleared all 3 highs and both moderates in one in-range pass.

```
$ npm update tsx
```
cleared the last remaining advisory (esbuild). See "Corrected accepted-risk
reasoning" below for why this second step was needed and why it is not a
breaking upgrade.

### Version changes (all in-range; `dependencies`/`devDependencies` untouched)

| Package | Before | After | Why |
|---|---|---|---|
| find-my-way | 9.5.0 | 9.9.0 | HIGH cleared (GHSA-c96f-x56v-gq3h) |
| fast-uri | 3.1.2 | 3.1.7 | HIGH cleared (6 advisories) |
| brace-expansion | 2.1.2 | 2.1.4 | HIGH cleared (2 advisories) |
| fastify | 5.8.5 | 5.12.4 | MODERATE cleared; minor bump, stays on 5.x |
| qs | 6.15.3 | 6.16.0 | MODERATE cleared |
| joi | 17.13.4 | 17.13.8 | LOW cleared |
| esbuild | 0.27.3 | 0.28.2 | LOW cleared, via the tsx bump below |
| tsx | 4.21.0 | 4.23.13 | devDependency minor bump inside the declared `^4.21.0`; carries esbuild `~0.28.0` |

`git diff -- package.json` shows **no change to `dependencies` or
`devDependencies`** — only TASK-006's `scripts` additions are present in that
file. The entire dependency change is carried by `package-lock.json`:

```
$ git diff --stat -- package.json package-lock.json
 package-lock.json | 343 ++++++++++++++++++++++++++++--------------------------
 package.json      |   4 +-
 2 files changed, 184 insertions(+), 163 deletions(-)
```

> Note for reviewers: this repository unusually **tracks `node_modules/` in git**,
> so `git status` additionally shows a very large `node_modules/**` diff. That is
> the install artefact of the above, not a separate change.

### Corrected accepted-risk reasoning (esbuild) — why it became a fix instead

The first pass left `esbuild 0.27.3` (low, GHSA-g7r4-m6w7-qqqr) and it was
initially written up as accepted risk on the grounds that only a `tsx` MAJOR
upgrade could clear it. **That reasoning was wrong and was corrected before
sign-off.** The facts:

- `tsx@4.21.0` declares `esbuild: ~0.27.0`, capping the tree at 0.27.x. Versions
  0.27.4 / 0.27.5 / 0.27.7 all still fall inside the advisory range
  (`0.27.3 - 0.28.0`); the fix is 0.28.1. So with tsx pinned at 4.21.0 there is
  genuinely no in-range fix — that much was right.
- However `package.json` declares `"tsx": "^4.21.0"`, and the latest tsx 4.x is
  **4.23.13**, which declares `esbuild: ~0.28.0` → resolves to **0.28.2**.
- tsx 4.21.0 → 4.23.13 is a **minor** bump of a devDependency already permitted
  by the existing range. It is not a major jump and not a framework change, so
  it is squarely in scope.

`npm update tsx` was applied and the suite re-validated. Since tsx is the loader
that runs both `npm run dev` and `npm test`, the 29-test suite passing after the
bump is the evidence that the runner still works.

**No accepted-risk entries remain. Zero advisories are outstanding.**

### Audit AFTER

```
$ npm audit
found 0 vulnerabilities
AUDIT_EXIT=0
```

**AFTER: 0 high / 0 moderate / 0 low = 0.** (7 → 0)

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

$ npm test ; echo "TEST_EXIT=$?"

> lingon@0.0.1 test
> node --import tsx --test "tests/**/*.test.ts"
...
1..5
# tests 29
# suites 5
# pass 29
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 553.4816
TEST_EXIT=0
```

The TASK-006 suite is meaningful evidence here rather than a formality: its
`AppError.plugin — ICD error envelope shaping` suite builds a real
`fastify({ logger: false })` instance, registers the global error handler and
drives it through `app.inject()`. Those two tests passing on fastify 5.12.4
exercise routing (find-my-way 9.9.0) and error-response serialisation after the
bump, not just compilation.

No-major-jump check:

```
$ npm ls --depth=0
lingon@0.0.1
+-- @fastify/autoload@6.3.1      +-- @fastify/cookie@11.1.2
+-- @fastify/cors@10.1.0         +-- @fastify/env@5.0.3
+-- @fastify/oauth2@8.2.0        +-- @fastify/rate-limit@11.0.0
+-- @fastify/sensible@6.0.4      +-- @fastify/under-pressure@9.0.3
+-- @types/node@25.3.0           +-- @types/pg@8.20.0
+-- dotenv@17.3.1                +-- fastify-plugin@5.1.0
+-- fastify@5.12.4               +-- google-auth-library@10.9.0
+-- googleapis@173.0.0           +-- pg@8.22.0
+-- pino-pretty@13.1.3           +-- pino@10.3.1
+-- tsx@4.23.13                  `-- typescript@5.9.3
```
Every major matches the pre-existing `package.json` ranges. fastify stays 5.x;
every `@fastify/*` plugin stays on its prior major. Nothing added, nothing
removed. `npm audit fix --force` was never run.

Other tasks' uncommitted work was left untouched — `git status --short` still
shows TASK-003's `migrations/*`, TASK-004's `src/app.ts`,
`src/config/env.ts`, `src/config/FastifyDefinition.ts`, and TASK-006's
`tests/` + `tsconfig.test.json` + `tsconfig.json` exactly as they were.

### Divergence found
`## Authoritative Documents` names `docs/docs/policies/security_policy.md` as
the authority for this task, but that file contains **no clause about dependency
advisories at all** — no `npm audit` cadence, no severity threshold for release
gating, and no format for recording an accepted risk. The accepted-risk write-up
process used here had to be invented for this task.
Classification: **DevDocs Update Required** — `security_policy.md` needs a
dependency-management section (audit cadence, severity gate, accepted-risk
record format) so the next advisory is handled by policy rather than by
improvisation.

## Completion Result

**Validated.** All five acceptance criteria met:

1. `npm audit` reports **0 high** — in fact 0 vulnerabilities of any severity
   (7 → 0). No accepted-risk entry is needed, because nothing remains.
2. `tsc -p tsconfig.json --noEmit` clean after the upgrade (exit 0), and
   `tsc -p tsconfig.test.json --noEmit` clean as well.
3. `npm run build` succeeds (exit 0).
4. No major-version framework jump: fastify 5.8.5 → 5.12.4 is a minor bump
   within 5.x; every `@fastify/*` plugin major is unchanged; the only other
   direct-dependency move is the devDependency tsx 4.21.0 → 4.23.13, also a
   minor. `npm audit fix --force` was never used.
5. The change is reviewable and scoped: `package.json`'s dependency blocks are
   byte-identical to before, and the whole upgrade lives in `package-lock.json`
   (343 lines). Eight package resolutions moved, each traceable to a specific
   advisory in the table above.

Beyond the acceptance bar, `npm test` (29/29) passes on the upgraded tree, so
the evidence for this upgrade is behavioural and not merely "it compiles".

Files: `lingon/package-lock.json` (and the tracked `node_modules/**` install
artefact). `lingon/package.json` dependency ranges deliberately unchanged.
Changes left uncommitted in the working tree per instruction.
