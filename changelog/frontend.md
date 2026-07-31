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
## [0.1.2] - 2026-07-31

Minor bump — Frontend Design System documentation reconciliation. Reconciled
directly against `jdukmin/letmeknow` source (commit `ad0e0f4` "updated UI
modules" + `b0923f0` "updated UI theme", docs-submodule-pointer-only) by
reading `aod_colors.dart`/`aod_theme.dart`/`app_card.dart`/
`app_typography.dart`/`app_spacing.dart` and grepping all 7 dashboard widget
files for `WidgetVariant` usage — not a `flutter analyze`/`test` run, static
source review only.

- **Green Theme 확정, 구버전 Blue/Gold 문서 제거**: `ThemeGuide.md`를
  전체 재작성했다. 이전 문서는 Blue Accent(`#2563EB`/`#3B82F6`) + Gold
  AI(`#B45309`/`#F59E0B`)를 기술하고 있었으나 실제 코드는 이미 Green
  Accent였다(이번 리디자인과 무관한, 그 이전부터의 drift). 리디자인으로
  코드 자체도 한 단계 더 정제됨을 확인: `AodColors`/`AodTheme`에 Primary
  `#61CE70`/Secondary `#3FA956`/Accent(container) `#DDF7E2` 적용 — 단,
  라이트 테마 `accent`/`success`는 WCAG 대비 실패(실측 ≈1.87:1, ≈2.82:1)로
  기존 감사값(`#1A7A40` 5.1:1, `#18823A` 5.0:1)이 유지되어 있음을 확인.
  Divider는 반투명 alpha에서 불투명 실색상으로 변경됨.
- **Card Component System 문서화**: `lib/core/design/app_card.dart` —
  `SmallCard`/`MediumCard`/`LargeCard`, 신규 `AppRadius.xxl`(28dp, Large
  Card) 확인. 신규 문서: [theme/CardComponent.md](../frontend/docs/theme/CardComponent.md).
  이 패스 시점에는 어떤 위젯도 이 시스템을 채택하지 않은 상태였음(순수
  additive) — 아래 "추가 확인 2026-07-31" 참고, 이후 상태가 달라졌다.
- **Typography System 확장 확인**: `AppTypography`에 `cardDisplay`(32sp/700),
  `cardTitleLarge`(22sp/700), `cardHeading`(18sp/600) 추가 확인. 기존
  hero 타이포(`displayXl` 72sp 등, 150cm 시청 거리 기준)는 무변경 — 두
  스케일 공존을 `ThemeGuide.md`에 명시.
- **Widget Presentation Rule 문서 신설**: [widgets/WidgetPresentationRule.md](../frontend/docs/widgets/WidgetPresentationRule.md) —
  `Widget = Module Data + Widget Variant + Card Component` 원칙. 이 패스
  시점에는 Module Data + Widget Variant 결합까지만 사실이었음.
- **Widget Variant 실렌더링 확인**: `WeatherNowWidget`, `WeatherForecastWidget`,
  `CalendarWidget`, `ClockWidget`, `StatusWidget`, `ChatWidget`,
  `BriefCardWidget` 7개 전부 `variant`에 따라 실제로 다른 UI를 렌더링함을
  코드에서 확인(grep으로 전수 확인).
- **LayoutConstraint/LayoutResolver 실사용 확인**: `AodDisplay`가
  `dashboard_widget_catalog.dart`(7개 위젯의 `WidgetMetadata`)와
  `LayoutResolver.resolve()`를 통해 각 위젯의 `variant`를 결정하도록
  배선되어 있음을 확인 — 하드코딩된 Variant 선택을 대체.
- **DevDocs Update Required**: `requirements/domain_icd/dashboard.md`(현재
  v0.1.0-draft)와 `requirements/dashboard_requirements.md`(현재
  DSH-001~008까지만 존재)는 이번 패스에서 변경하지 않았다. 코드에는 이미
  `WidgetVariant`/`WidgetMetadata`/`LayoutConstraint`/`LayoutResolver`가
  구현되어 있으나, 이를 Domain 차원의 정식 계약(DSH-009~011급 requirement,
  `LayoutDirective`/`PLN-006`)으로 다루는 별도 Domain ICD 리뷰 패스가
  아직 없다 — `WidgetPresentationRule.md`에도 동일하게 명시함.
- 문서 구조: Color/Shape/Typography를 별도 파일로 분리하지 않고
  `ThemeGuide.md` 한 곳에 유지하기로 결정(근거는 문서 말미에 기록).

> **추가 확인 2026-07-31(Documentation Synchronization pass, 버전 변경 없음)**:
> `jdukmin/letmeknow`의 로컬 uncommitted working tree(`git diff HEAD`로 확인,
> 커밋 `ad0e0f4` 대비)에서 위 "Card Component System... 실제로 채택한 위젯이
> 아직 하나도 없음" 서술이 더 이상 맞지 않음을 확인했다 — 7개 대시보드
> 위젯 전부가 이제 해당 Card 컴포넌트를 쓴다(Tier: Clock/Status/WeatherNow=
> Small, WeatherForecast/Calendar/Chat=Medium, BriefCard=Large). **단, 이
> 변경은 frontend 저장소에 아직 커밋되지 않았다** — Version 관리 규칙(실제
> 구현 반영된 경우만 버전 변경)에 따라 이번 패스에서는 버전을 올리지
> 않았고, `ThemeGuide.md`/`CardComponent.md`/`WidgetPresentationRule.md`/
> `FeatureList.md`에 uncommitted 상태임을 명시하는 각주만 추가했다.
> `version/frontend.json`의 `known_discrepancy`에 동일 내용 기록. 커밋되면
> 버전 재검토 필요.

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
