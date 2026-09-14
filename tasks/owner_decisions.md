# Owner Decision Registry

Persistent record of decisions that require **Owner authority** — product,
architecture, business, or cost choices where more than one option is
materially valid. Questions answerable from repository evidence are **not**
Owner Decisions; they are researched and resolved in the task.

Once the Owner answers, the decision is recorded here permanently and never
asked again. Work not listed under "Blocks" continues regardless.

---

## D-001 — Which LLM provider(s), and is a platform-funded key offered at beta?

**Status**: ✅ **DECIDED 2026-09-14 by Owner — Option A (BYOK primary)**

> **Owner ruling**: BYOK is the primary supported path for **LLM providers** during
> Closed Alpha. This does **not** extend to all integrations — platform-funded
> backend credentials such as OpenWeather remain valid and must not be removed or
> redesigned. Consequence: a BYOK entry UI becomes mandatory (see D-002).

**Original analysis (retained):** Status was Open · **Opened**: 2026-09-14 · **Needed by**: TASK-005 completion (not start)

**Why this needs the Owner**: `LLM-006` fixes the *resolution order*
(`byok` → `platform` → fail) but deliberately does not decide **whether a
`platform` credential is offered at all**. That is a cost and business model
question, not a technical one: a platform key means the Owner pays for every
user's tokens; BYOK-only means every beta user must obtain their own API key
before chat works at all.

| Option | Consequence | Advantage | Disadvantage |
|---|---|---|---|
| **A. BYOK-only at beta** | `platform` source implemented but disabled by policy flag; user must register a key | Zero token cost; no billing/abuse surface; BYOK path gets real testing | Hard onboarding wall — chat is dead on first launch until the user pastes a key |
| **B. Platform key with quota** | Backend holds one provider key; per-user quota enforced | Chat works immediately on signup; far better first-run demo | Owner pays; needs quota + abuse controls before any public exposure |
| **C. Both, Owner-allowlisted** | Platform key enabled only for invited beta accounts | Good demo for invitees, bounded cost | Needs an allowlist mechanism that does not exist yet (extra work) |

**Recommended default**: **A** for the closed-alpha (the resolution order already
prefers `byok`, so A is the no-extra-work path and leaves B reachable later
without a contract change). Revisit before any public beta, where B or C is
likely required for acceptable onboarding.

**Blocks**: final enablement flag in TASK-005; TASK-010 UI urgency.
**Does NOT block**: TASK-005 implementation itself (both sources are built
either way — this only sets the default policy value), TASK-001/002/003/004/006/007/008/009.

**Provider choice**: the adapter contract (LLM-007) requires that adding a
provider touches only an adapter. The *first* adapter is OpenAI — that is
already the implemented client path and is treated as evidence-backed, not a
new decision.

---

## D-002 — Does the closed alpha ship a Settings / BYOK management UI?

**Status**: ✅ **DECIDED 2026-09-14 by Owner — Option A (ship it)**

> **Owner ruling**: yes. Complete any missing Frontend UI required to make the real
> user flow usable; low/medium-risk UI gaps need no further approval. TASK-010 is
> unblocked and in progress.

**Original analysis (retained):** Status was Open · **Opened**: 2026-09-14 · **Needed by**: TASK-010

**Why this needs the Owner**: `LingonApiKeyRoute` and `LingonSettingsRoute`
are fully implemented on both ends but no screen calls them
(`lib/route/lingon_api_key.dart:60` is the sole occurrence). This is either
"unfinished feature" or "deliberately not in scope" — the SSOT records it as
an open question, not as a defect, so the product owner decides.
This decision interacts with D-001: choosing **D-001 option A** makes a BYOK
entry UI *mandatory*, because there would be no other way for a user to enable chat.

| Option | Consequence | Advantage | Disadvantage |
|---|---|---|---|
| **A. Ship minimal BYOK entry UI** | One settings screen: paste/clear key per provider, show status | Unblocks chat under BYOK-only; removes dead code | Frontend work; needs secure-input and masking care |
| **B. Defer, mark Not-MVP** | Routes documented as intentionally unused | Zero work now | Chat unusable under D-001-A; dead code persists and keeps re-surfacing in audits |

**Recommended default**: **A**, scoped to the minimum (no model/temperature
tuning UI — only key entry + status), *conditional on D-001 = A*. If D-001
resolves to B, this drops to P4.

**Blocks**: TASK-010.
**Does NOT block**: everything else.

---

## D-003 — Production CORS origin allowlist

**Status**: ✅ **DECIDED 2026-09-14 by Owner — explicit allow-list only**

> **Owner ruling**: explicit allow-list only. The canonical production
> frontend origin is `https://www.ling-on.com`, **exact string match**.
> `https://ling-on.com` (apex) is **redirect-only to `www` at the web-server
> (Apache) level** — it is **NOT** added to the API allow-list. Staging
> origins are added **only when a real staging frontend exists**; none exists
> today. **Wildcard CORS is forbidden** — no `*`, no scheme/port/subdomain
> inference. Consequence: `CORS_ALLOWED_ORIGINS` already defaults to
> `https://www.ling-on.com` in code (`lingon/src/app.ts:33`), so the decided
> value is the shipped default and **no env change is required** for the
> canonical origin — but the backend process must be **restarted** for any
> future change to take effect, and no deploy script performs that restart
> today. Operational procedure and a worked example:
> `docs/docs/ops/deployment_sop.md` §CORS.

**Original analysis (retained):** Status was Open — **deployment gate only**
(Owner 2026-09-14: does not block code completion) · **Opened**: 2026-09-14 ·
**Needed by**: deployment of TASK-004

**Why this needs the Owner**: the *mechanism* is not a decision and is being
implemented autonomously in TASK-004 (env-driven allowlist replacing
`origin: true`). The **value** — which origins are legitimate — is
infrastructure knowledge only the Owner holds. Evidence gives a starting set:
`https://www.ling-on.com` (`api_client.dart:57`) and the Apache-served web
build at `/var/www/lingon`; whether a bare `https://ling-on.com`, a staging
host, or Android WebView origins must also be accepted is not derivable.

**Recommended default**: ship `CORS_ALLOWED_ORIGINS` defaulting to
`https://www.ling-on.com`, and have the Owner extend the env var at deploy
time. This makes the code correct now and the value operational — so it does
**not** block TASK-004.

**Blocks**: nothing — decided. Nothing further is blocked; the shipped default
already matches the decided value, and any future change to it requires an
env update plus a backend restart per `deployment_sop.md` §CORS.
**Does NOT block**: TASK-004 implementation and merge (already complete).

---

## D-004 — Which serving strategy is production: Apache static, or `flutter run`?

**Status**: ✅ **DECIDED 2026-09-14 by Owner — Option A (Apache static)**

> **Owner ruling**: Option A. The canonical production path is Flutter release
> static build → versioned release directory
> `/var/www/lingon/releases/<timestamp>` → `rsync` + permissions → Apache →
> `current` symlink — the `letmeknow/compile_release.sh` line. `run_release.sh`
> (`flutter run -d web-server` on :4443) is **Development Only** — it is not
> deleted, it is marked as such (a `Development Only` header comment).
> Consequence: TASK-012 is unblocked and closed (see
> `docs/tasks/TASK-012-run-release-script-defects.md`); `deployment_sop.md` as
> written is correct; no remediation task for "production served from a dev
> server" is needed.

**Original analysis (retained):** Status was Open — **deployment gate only**
(Owner 2026-09-14: does not block code completion) · **Opened**: 2026-09-14 ·
**Needed by**: TASK-012

**Why this needs the Owner**: the repository contains two mutually exclusive
deploy paths and nothing in it says which is live. This is infrastructure
knowledge, not a derivable fact.

| | `compile_release.sh` | `run_release.sh` |
|---|---|---|
| Mechanism | `flutter build web` → rsync to `/var/www/lingon/releases/<ts>` → Apache serves via `current` symlink | `flutter run -d web-server` on port 4443 with TLS, no Apache |
| Nature | static bundle, production-shaped | **development server** |
| Rollback | repoint the `current` symlink | none |
| Needs Flutter SDK on the server | no | yes (`export PATH="flutter/bin:$PATH"`) |

**Evidence**: `run_release.sh:5` also has a broken TLS key path
(`flutter-privkey.pe`, missing the `m`), which suggests it may not have been
run successfully in its current form.

| Option | Consequence |
|---|---|
| **A. Apache static is production** | `run_release.sh` becomes dev-only or is deleted; the docs already updated by TASK-007 are correct as written |
| **B. `run_release.sh` is production** | `deployment_sop.md` and Route.md are both wrong, and serving public traffic from `flutter run` needs its own remediation task — a dev server is not hardened or performant for production |

**Recommended default**: **A**. `compile_release.sh` is the more complete and
production-shaped script (release directories, permissions, symlink switch,
Apache reload), and the broken TLS path in `run_release.sh` suggests it is not in
active successful use. Proceeding on A unless the Owner says otherwise; the typo
is fixed either way.

**Blocks**: nothing — decided. TASK-012 is unblocked and closed.
**Does NOT block**: anything else.
