# TASK-012 — `run_release.sh` has a broken TLS key path and an unclear role
Status: Partial (typo fixed; rest blocked on D-004)
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
  rsync + Apache pipeline)
- `/Route.md` §RELEASE/DEPLOY

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
**D-004** — which serving strategy is production? Blocking for everything beyond
the typo.

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

Both remain open. The contradiction Route.md §RELEASE/DEPLOY records — Apache
static serving via `compile_release.sh` vs a `flutter run` dev server on :4443 —
is unchanged by this task.

## Completion Result

**Partial (typo fixed; rest blocked on D-004).**

| # | Acceptance criterion | Result |
|---|---|---|
| 1 | TLS key path ends `.pem` | **Met** — verified by grep |
| 2 | `bash -n run_release.sh` parses | **Met** — exit 0, no output |
| 3 | Script states its role in a comment, consistent with D-004 | **Blocked** — D-004 unanswered; a comment now would fabricate the decision |
| 4 | `deployment_sop.md` and Route.md agree; no third description | **Blocked** — same dependency |

The one defect that needed no judgement is fixed and verified. The substantive
question — whether a `flutter run` dev server is really serving production TLS
traffic on :4443, or whether this script is a leftover dev harness — is still
open and still needs the Owner. Until D-004 is answered, Route.md's instruction
to "assume Apache until the Owner rules" stands.
