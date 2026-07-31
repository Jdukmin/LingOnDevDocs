# Frontend ChangeLog

Format: `## [x.y.z] - YYYY-MM-DD` followed by bullet points. Newest first.
Governed by [../CLAUDE.md](../CLAUDE.md) — every `version/frontend.json`
bump must have a matching entry here.

## [0.1.1] - 2026-07-31

- **AodColors v2 redesign — verified via real source.** User provided the
  actual `lib/core/utils/aod_colors.dart` content directly (not a summary).
  Confirmed real changes: Primary accent redesigned to `#61CE70` (**dark
  mode only** — light mode keeps the darkened `#1A7A40`, since the file's
  own comments show the raw Primary fails contrast on the light background,
  ≈1.87:1 against a 3:1 floor); new fields `bgElevated`/`bgGlass`/
  `surfaceHover`/`surfaceSelected`/`accentLime`/`accentHighlight`/
  `accentGlow`/`semanticInfo`/`semanticNeutral`/`aiAccent`/`borderMed`;
  `aiGold` deprecated in favor of `aiAccent` (compat alias kept); two new
  decoration factories `aiCardDecor`/`floatingDecor`. Full detail:
  [frontend/docs/theme/ThemeGuide.md](../frontend/docs/theme/ThemeGuide.md).
- **Correction to a prior known_discrepancy note**: a 2026-07-30 report
  (unverified at the time) claimed the theme system was renamed to
  `AppCard`/`AppTypography`/`AppSpacing`/`AppRadius`. The actual source
  shows the class is still named `AodColors` — that renaming claim is
  **not confirmed** and is not reflected anywhere in DevDocs. Card Tier
  System and `WidgetPresentationRule` claims from the same report remain
  unverified for the same reason.
- Also surfaced, incidentally: `ThemeGuide.md`'s `warning`/`error`/`divider`
  values already differed from actual code **before** this redesign (e.g.
  `error` was documented as `#EF4444`/`#DC2626`, actual is `#FF5050`/
  `#CC2424`, unchanged by this redesign) — pre-existing documentation drift,
  corrected in this pass.
- No requirements/domain_icd changes — this is a Frontend implementation
  detail of the already-`Done` theme-toggle feature
  (`frontend/docs/FeatureList.md` "다크/라이트/시스템 테마"), not a new
  Requirement. No `system.json`/`backend.json` impact.

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
