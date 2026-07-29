# Frontend ChangeLog

Format: `## [x.y.z] - YYYY-MM-DD` followed by bullet points. Newest first.
Governed by [../CLAUDE.md](../CLAUDE.md) — every `version/frontend.json`
bump must have a matching entry here.

## [0.1.0] - 2026-07-29

- **V_0.1.0 Baseline.** Reconciled against `jdukmin/letmeknow` real commit
  history (V_0.0.4 → V_0.0.17) plus `FRONTEND_VERIFICATION_REPORT.md`
  (2026-07-24: fixed `CalendarEvent.fromJson` to match the corrected
  Backend contract, `flutter build web --release` passed) and
  `FRONTEND_SCHEMA_VERIFICATION_REPORT.md` (2026-07-23: static review found
  Weather has no `error.code`→message mapping — P0, raw exception text
  leaks to users; 6 DevDocs-vs-code drift findings; `flutter
  analyze`/`test`/`build` could not run, no Flutter SDK in that session).
  Full per-version detail: [status/frontend/](../status/frontend/) (12
  documents, V0.0.4 through V0.1.0).
- **Known P0, not yet fixed**: Weather error messages are not user-safe.
  Blocks calling this baseline release-ready — see
  [status/current_status.md](../status/current_status.md).
- No app behavior was changed by this DevDocs pass — this entry documents
  the frontend's own history, it does not change it.

## [0.1.0] - 2026-07-23 (seed note, superseded by the entry above)

- Introduces the `version/`/`changelog/`/`verification/` SSOT system in
  this repository (see [../CLAUDE.md](../CLAUDE.md)). Did not describe a
  real frontend release at the time it was written.
