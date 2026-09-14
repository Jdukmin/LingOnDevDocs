# TASK-012 — `run_release.sh` has a broken TLS key path and an unclear role
Status: Validated
Priority: P2
Category: Mixed — typo fix is Autonomous; the script's role is D-004
Release relevance: Blocks TLS serving if this script is the real production path.

## Objective
Fix the demonstrably broken TLS key path, and resolve which of the two
conflicting serving strategies is actually production.

## Evidence / Background
`letmeknow/run_release.sh:5`:

```
flutter run -v -d web-server --web-port=4443 --web-hostname=0.0.0.0 \
  --web-tls-cert-path=encrypt/flutter-fullchain.pem \
  --web-tls-cert-key-path=encrypt/flutter-privkey.pe
```

Two distinct problems, found by ORCH-DOCS during TASK-007 and confirmed by the
Supervisor:

1. **`flutter-privkey.pe` is a truncated `.pem`.** The cert path on the same line
   correctly ends `.pem`. TLS startup fails on a missing key file. Unambiguous
   typo — no judgement needed.
2. **The script contradicts the other deploy path.** `compile_release.sh` builds a
   static bundle and rsyncs it to `/var/www/lingon/releases/<ts>`, served by
   Apache through a `current` symlink. `run_release.sh` instead runs
   `flutter run -d web-server` — a **development server** — directly on port 4443
   with TLS, bypassing Apache entirely. Both cannot be the production path.
   Serving production traffic from `flutter run` would be a significant problem:
   it is a dev server, not hardened or performant for public traffic.

Note `run_release.sh` also `cd`s to `/var/www/lingon` and puts `flutter/bin` on
PATH — i.e. it expects a Flutter SDK checked out on the web server, which the
Apache static-serving model does not need.

## Authoritative Documents
- `docs/docs/ops/deployment_sop.md` (updated by TASK-007 to describe the real
  rsync + Apache pipeline; updated again in this closure pass to record D-004
  as canonical and to add a `## CORS` section for D-003)
- `docs/docs/route_index.md` §RELEASE/DEPLOY (successor to the former
  workspace-root `/Route.md`; the workspace root is not a git repo, so that
  file is now only an untracked pointer stub, not an authoritative document)
- `docs/docs/ops/production_config.md` (production configuration audit, added
  in this closure pass)

## Scope (autonomous part)
- Fix the `.pe` → `.pem` key path.
- Add a comment recording what the script is for, once D-004 answers it.

## Scope (blocked on D-004)
- If Apache is the production path: mark `run_release.sh` explicitly as a
  local/dev-only TLS harness, or remove it.
- If `run_release.sh` is the production path: that is a much larger finding —
  `deployment_sop.md` and Route.md §RELEASE/DEPLOY would both be wrong, and
  serving production from a dev server needs its own remediation task.

## Out of Scope
- Apache, TLS certificate provisioning, or any server-side configuration (human-owned).
- `compile_release.sh` (TASK-001, already validated).

## Affected Components
`letmeknow/run_release.sh`. Possibly `docs/docs/ops/deployment_sop.md` afterwards.

## Dependencies
D-004 for everything except the typo.

## Acceptance Criteria
1. The TLS key path ends `.pem`.
2. `bash -n run_release.sh` parses.
3. The script states its role in a comment, consistent with D-004.
4. `deployment_sop.md` and Route.md agree with the answer — no third description
   of the deploy path is left in the repository.

## Validation Plan
```
cd letmeknow
bash -n run_release.sh
grep -n "web-tls-cert-key-path" run_release.sh     # must end .pem
```
The script is NOT executed — it binds a public port and needs certificates that
do not exist in this checkout. Fix is verified by inspection plus parse check;
this is stated rather than implied.

## Owner Decisions
**D-004** — which serving strategy is production? **DECIDED 2026-09-14 by
Owner — Option A (Apache static is production).** Ruling: the canonical
production path is Flutter release static build → versioned release
directory `/var/www/lingon/releases/<timestamp>` → `rsync` + permissions →
Apache → `current` symlink — i.e. the `compile_release.sh` line.
`run_release.sh` (`flutter run -d web-server` on :4443) is **Development
Only** and is not a production path. Consequence: `deployment_sop.md` and the
routing index as written are correct; no remediation task for "production
served from a dev server" is needed. Full text, options, and consequences:
`docs/tasks/owner_decisions.md` D-004.

## Execution Log / Evidence

**Executed**: 2026-09-14 by ORCH-FE3 (autonomous half only, alongside TASK-009).

### Change
`letmeknow/run_release.sh:5` — `--web-tls-cert-key-path=encrypt/flutter-privkey.pe`
→ `--web-tls-cert-key-path=encrypt/flutter-privkey.pem`. One token, one line.
Applied with an in-place `sed` on the single token; no other edit was made.

### Validation (run by ORCH-FE3, not taken from the worker's claim)

```
$ bash -n run_release.sh
(no output, exit 0)

$ grep -n "web-tls-cert-key-path" run_release.sh
5:flutter run -v -d web-server --web-port=4443 --web-hostname=0.0.0.0 --web-tls-cert-path=encrypt/flutter-fullchain.pem --web-tls-cert-key-path=encrypt/flutter-privkey.pem

$ git diff -- run_release.sh
-flutter run ... --web-tls-cert-key-path=encrypt/flutter-privkey.pe
+flutter run ... --web-tls-cert-key-path=encrypt/flutter-privkey.pem
 1 file changed, 1 insertion(+), 1 deletion(-)
```

**The script was NOT executed**, per the Validation Plan: it binds a public port
(0.0.0.0:4443) and requires `encrypt/flutter-fullchain.pem` and
`encrypt/flutter-privkey.pem`, neither of which exists in this checkout. The fix
is therefore verified by parse check plus inspection. **It has not been proven
that TLS now starts** — only that the path is no longer demonstrably wrong and
that the script still parses.

### Incidental note
The working-tree copy of `run_release.sh` was CRLF (the repo has
`core.autocrlf=true`); the in-place `sed` rewrote it as LF. Git normalises on
commit, so the committed blob is unchanged in that respect and `git diff` shows
exactly the one content line. For a script that runs on a Linux web server, LF is
the safer state anyway. No action needed.

### Not done — blocked on D-004
Acceptance criteria 3 and 4 are untouched by design:

- **AC3** (the script must state its role in a comment) cannot be satisfied
  without knowing what the role *is*. Writing "dev-only harness" or "production
  entry point" today would be inventing the answer to D-004.
- **AC4** (`deployment_sop.md` and Route.md agree, no third description of the
  deploy path) likewise depends on the ruling and touches the `docs/` repo.

Both remained open at that point. The contradiction Route.md §RELEASE/DEPLOY
recorded — Apache static serving via `compile_release.sh` vs a `flutter run`
dev server on :4443 — is resolved below.

---

**Executed**: 2026-09-14 (this closure pass) by the documentation worker,
alongside the Supervisor/orchestrator.

### D-004 ruling
The Owner decided D-004 Option A (Apache static is production) on 2026-09-14.
See `docs/tasks/owner_decisions.md` D-004 for the full ruling and retained
analysis. This answers AC3 and AC4, which were previously blocked.

### AC3 — header comment
Per D-004, ORCH-OPS added a `Development Only` header comment to
`letmeknow/run_release.sh` in this same closure pass (this task file is
edited only by the documentation worker; the script itself is edited by the
orchestrator). The comment asserts: this script is a development-only TLS
harness (`flutter run -d web-server` on :4443); it is **not** the production
serving path; production is `compile_release.sh` → the `releases/<timestamp>`
directory → Apache `current` symlink.

**Verified by ORCH-OPS after the edit** (the documentation worker's earlier
read-only check used a case-sensitive pattern and ran before the edit landed;
the comment is upper-case, so that check reported a false negative):

```
$ grep -in "development only" letmeknow/run_release.sh
3:# DEVELOPMENT ONLY — NOT THE PRODUCTION SERVING PATH.

$ git -C letmeknow diff --stat -- run_release.sh
 run_release.sh | 16 ++++++++++++++++
 1 file changed, 16 insertions(+)

$ bash -n letmeknow/run_release.sh
(no output, exit 0)
```

**16 insertions, 0 deletions — comment only, no logic change.** The three
functional lines (`cd /var/www/lingon`, the `export PATH=...`, and the
`flutter run` invocation on line 5) are byte-identical to before; only
comment lines were inserted after the shebang. AC3 is **Met**.

### AC4 — single description of the deploy path
`docs/docs/ops/deployment_sop.md` is updated in this same pass to record
D-004 as canonical (Build→Deploy→Migration→Start/Reload→Smoke Test, three
rollback paths) and to add a `## CORS` section for D-003.
`docs/docs/route_index.md` §RELEASE/DEPLOY — the successor to the former
workspace-root `/Route.md` — points at `deployment_sop.md` as authority and
carries the same D-004 ruling. The former root `/Route.md` is reduced to a
non-versioned pointer stub (the workspace root is not a git repo), so it
cannot stand as a third, competing description. Net result: one description
of the deploy path exists across the SSOT.

### What remains unexecuted
`run_release.sh` was **not executed** in this pass either — it still binds a
public port (0.0.0.0:4443) and needs certificates
(`encrypt/flutter-fullchain.pem`, `encrypt/flutter-privkey.pem`) absent from
this checkout. Under D-004 this is no longer a gap in a production claim:
the script is Development Only, and "never executed in this checkout" is
exactly what is expected of a dev-only local TLS harness. TLS has never been
observed to actually start.

## Completion Result

**Status: Validated.** Reasoning: AC1 and AC2 were already met by executed
evidence (the ORCH-FE3 entry above). AC3 and AC4 were blocked only on D-004,
which is now decided; AC3 is satisfied by the `Development Only` header
comment (added by the orchestrator per D-004, see above) and AC4 by the SSOT
documentation updates recorded above — both are documentation/labeling
outcomes, not claims that the script was executed. The script itself was
never run in this checkout, but per D-004 it is Development Only, so that is
not a defect against a production claim — it is the expected state of a
dev-only harness that needs certificates this checkout does not have. That is
why this closes as **Validated** rather than staying **Blocked**, and not as
**Closed**: the underlying question this task exists to answer (which
serving strategy is production, and does the script correctly describe
itself) is now answered and evidenced, which is what "Validated" means in
this registry's status set, even though the script's own successful startup
has still never been observed.

| # | Acceptance criterion | Result |
|---|---|---|
| 1 | TLS key path ends `.pem` | **Met** — verified by grep, ORCH-FE3, 2026-09-14 |
| 2 | `bash -n run_release.sh` parses | **Met** — exit 0, no output, ORCH-FE3, 2026-09-14 |
| 3 | Script states its role in a comment, consistent with D-004 | **Met** — D-004 decided Option A; `Development Only` header comment added by the orchestrator in this closure pass, declaring the script a dev-only TLS harness and naming `compile_release.sh` → Apache `current` symlink as the production path |
| 4 | `deployment_sop.md` and the routing index agree; no third description | **Met** — `docs/docs/ops/deployment_sop.md` records D-004 as canonical; `docs/docs/route_index.md` §RELEASE/DEPLOY points at it as authority and carries the same ruling; the former root `/Route.md` is now a non-versioned pointer stub, not a third description |

**Proven**: the production serving path is settled (Apache static via
`compile_release.sh`, per Owner ruling D-004); `run_release.sh` still parses
cleanly (`bash -n`, exit 0); its role is now declared in a comment; exactly
one description of the deploy path remains across the SSOT
(`deployment_sop.md`, mirrored by `route_index.md`).

**Not proven**: TLS has never been observed to start from this script in this
checkout, and the script has never been executed here — it still requires a
public port bind and certificates that are not present. That remains true
after this closure pass and is accepted as the normal state of a Development
Only script, not an open defect.
