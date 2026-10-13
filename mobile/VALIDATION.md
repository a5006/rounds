# Validation · 2026-10-13

## Unified preparation/work/rest transitions

- Added a presentation-only countdown hook with 500ms numeric and Reanimated derived arc interpolation for reset, extension and phase/round changes. Live remaining time remains the target during transitions; ordinary 50ms ticks do not restart animations. Phase+round key covers consecutive work rounds with zero rest. Actual last-three-second cues remain sourced from real time and snap to actual displayed countdown when running; session/audio provider unchanged.
- Reduced motion/background/resume/large catchup cancel/snap rather than replay stale transitions. Retargeting uses current displayed time/arc. Stopwatch reset remains unchanged.
- 42 mobile/session tests passed; typecheck and changed-file lint passed. Reviewer found no important blocker. Isolated temporary route verified 10->30 paused reset, extension 10->12 intermediate->25 with SVG offset511.03->490.55->340.69, work->rest 25->29 intermediate->60 and offset340.69->307.87->0, rest->prep60->10. Temporary route removed; real session/report preserved.
- No EAS/APK build triggered. Existing finished APK predates these countdown changes; native rendering/audio synchronization require physical-device checks. Native resource export was not repeated for this follow-up.

## Gradient surfaces, reset and image sharing

- Shared primary buttons now have tinted gradients and phase-colour boxShadow; shared cards/metrics use restrained dark gradients. Homepage current plan and library selection receive stronger theme tint, preset cards use plan accents, report metrics use their own colour. Existing fog remains independent of timer refresh.
- Stopwatch reset clears persisted data/laps immediately and animates display to zero over 500ms. Numeric interpolation and the ring's minute-fraction interpolation are separate, preventing backward minute wrapping. Starting cancels reset presentation; inactive/reduced motion shows committed values and foreground transitions clear any suspended frame. Zero progress stroke is hidden.
- 38 mobile/session tests passed, typecheck passed, full lint 0 errors/5 existing provider warnings, scoped changed-file lint clean. Final Android/iOS/Web export passed. Review background-reset stall corrected and re-reviewed with no important blocker.
- Browser verified actual reset 00:53 -> 00:09 -> 00:06 -> 00:00, SVG dashoffset advances to circumference 766.5486 and opacity0. Stopwatch export button removed; empty lap list preserved. Homepage gradient/glow screenshot home-gradient-glow.png saved.
- Generated actual complete 1080x2297 PNG with 12 columns, final numbers, branding and no navigation/buttons; inspected full image round-report-export.png. Web capture subsequently switched to direct 1080px rasterization to avoid enlarging low-resolution canvas. Web provides image preview and Blob download, native uses temporary PNG and system image sharing. Do not release PNG immediately after Android chooser returns; default view-shot filename retains automatic cleanup.
- Native version 1.0.1, Android versionCode2/iOS buildNumber2. EAS APK build submitted after checks. Physical-device performance and WeChat/system-share flow still require installation verification.
- User requested pausing packaging and auditing features. Cancellation response confirms build 3e8d0fa2-49ff-4b85-b76c-dc2eb44b865d already finished; cannot cancel a finished build. No new build submitted, APK download/device validation/delivery deferred. Fresh audit reran 38 tests, typecheck and lint (0 errors/5 existing warnings), all passed.

## Animated training report

- Latest user adjustment raises maximum column width from 10px to 50px, retaining centred group and existing gaps. Three-round browser measurement: 50px columns, equal120px margins. Typecheck/scoped lint passed; report-50px-centered.png saved. No audio changes or APK build.

- Follow-up caps columns at 10px and centres the group; existing 6/4/2px gap selection retained, columns can shrink further on small widths. Per-round time labels moved below chart to remain readable beside thin columns. Browser actual three-round report measured 10px each, 180px equal side margins in 402px chart, no overflow. Typecheck/scoped lint passed; report-slim-centered.png saved. Audio and APK build unchanged.

- Added hero-only blue/gold drifting mist behind report medal/title using existing MistBackground compact variant. Four-edge fade blends into background; shared clock honors reduced motion/background preferences. Browser inspected readable title and changing cloud transforms across samples; saved report-hero-mist.png. Follow-up typecheck and scoped lint passed.

- Rebuilt report into separate screen and report-ui components: gradient medal, completion/interruption heading, four icon cards, actual duration columns, share/restart/home actions. No calories or estimated energy load. Elapsed time explicitly includes preparation and excludes pauses.
- Numbers count up in 700ms; columns grow from the baseline with left-to-right stagger, finishing within 600ms for up to 30 rounds. Equal actual duration means equal height; partial and zero records are preserved, empty records show a placeholder. Follow-up removes horizontal scrolling and all column width limits: flex columns share the entire container, with narrower gaps and sparse first/middle/last labels for many rounds.
- Follow-up scoped lint and typecheck passed. Browser inspected actual 12-round report: all columns fit into a 402px chart; scrollWidth equals client width 402, individual columns approximately 29.83px plus 4px gaps. Screenshot report-fill-chart.png saved.
- 36 mobile/session tests passed. Typecheck and full lint passed (0 errors, 5 existing provider warnings); Android/iOS/Web export passed. New scoped lint clean. Reviewer identified preference readiness and lifecycle replay; corrected native initial final-to-zero flash, StrictMode replay and background/reduced-motion transitions, re-review found no important remaining issue.
- Browser observed effective work value 00:00 -> 00:08 -> 00:13 and chart transform scaleY .561 -> 1 / opacity .561 -> 1. Existing interrupted report retained. At 390x844 document scrollWidth equals width 390; icons, four cards and partial-round column inspected. Saved report-animated.png in task visualization directory; viewport restored.
- Native device smoothness, accessibility and multi-column visual animation still require physical-device verification. No new APK built.

## Drifting mist and double orbit trails

- Added red workout, ice-blue rest and amber preparation/stopwatch mist with three drifting radial-gradient clouds, a dark digit centre and two opposite orbit tails. No new dependency or bitmap resource. Settings source-credit button removed; attribution documentation retained.
- Replaced legacy Animated loops with Reanimated frame clocks independent of timer text updates. Rotation phase accumulates across turns; pause/background stops frame updates and resume preserves phase. SVG progress updates through animated props. Reduced-motion preferences keep decoration static.
- Browser observed changing orbit/cloud transforms while running and identical transforms across separated samples after pause settled. Saved native-amber-mist.png in the task visualization directory. Native frame rate, original flashing reproduction and work/rest visuals require a fresh APK and physical-device checks.
- 32 mobile/session tests, TypeScript and Android/iOS/Web export passed. Scoped lint: 0 errors/warnings. Full lint: 0 errors and 5 existing SessionProvider hook warnings; earlier ui.tsx Animated-ref errors are eliminated by this replacement.
- Independent review completed. Corrected React Native Web reduced-motion listener cleanup using direct matchMedia registration/removal; re-review found no remaining blocker. Existing APK predates this update.

## Editor proportional training timeline

- Added PlanTimeline below the final-rest switch: dark inset surface, right-aligned total, ordered preparation/work/rest segments with widths proportional to actual stage durations, phase legends and separators. Removed duplicate summary above parameter fields.
- Pure timeline tests cover the design's eight-round total 31:10, omitted zero stages, exact sums and optional final rest. 29 mobile/session tests passed; TypeScript and targeted lint passed; Android/iOS/Web export passed after interrupted-session recovery.
- Browser verified 12-round configuration: switch off changes 47:15 to 48:15 and rest total 11:00 to 12:00; restoring the switch restores totals. 24 visible segments occupy 377.98px of a 378px track. Draft changes were not saved and the switch was restored.
- Screenshot plan-timeline-final.png saved in the task visualization directory. Web (5173) and native preview (8081) development services restarted after interruption. Native device checks and rebuilding APK remain separate.

## Homepage plan visibility and icons

- Replaced favorites with showOnHome, a filled/outline house control and a homepage-display filter. All visible custom and template plans appear in homepage shortcuts. Hidden presets remain immutable and available in the library. Explicit false flags survive reload; old custom favorites migrate to visible, new/copy plans start hidden.
- Current-plan control now uses a selected check-circle or unselected circle with text, retaining a single selectedPlanId. Added existing Ionicons to work/rest/preparation/round metrics, editor parameter rows, volume/vibration and final-rest controls.
- 27 mobile/session tests passed; typecheck and scoped lint passed. Browser verified hide-template/show-custom -> homepage list, refresh persistence and exactly one selected-plan control. Temporary test changes to selection/visibility were restored.
- Screenshot: plan-home-icons.png in the task visualization directory. Final Android/iOS/Web export passed.

## Training plan library update

- Implemented local custom-plan CRUD, favorites/filters, four protected copyable presets, legacy single-config migration, and independent vibration/volume profiles. Editor retains wheel selectors and adds name/category/color/profile controls.
- Running training holds a separate plan/config snapshot; edit/delete operations do not modify it or delete the report. Native audio playback and preview receive the configured volume.
- Switched navigation to Expo Router under src/app as required by mobile/AGENTS.md; preserved shared safe-area shell, top training banner, return targets and existing screens.
- Browser checked new-plan creation, category/color selection, disabling vibration, slider to 40%, save-to-library, favorite and reload persistence. Selected plan is pinned first; final library layout inspected and screenshot saved. Model tests cover deletion, template immutability, copy isolation, migration and recovery.
- Independent review found unguarded Home/Report start paths and inconsistent legacy quick presets; fixed with a central pending-start confirmation and unified plan-backed quick presets. Re-review found no important remaining issues. Cancellation keeps active training; confirming creates prior report before using the frozen start request. Guard is covered by regression tests and code review; native system interactions need device verification.
- 26 mobile/session tests passed, TypeScript passed, targeted lint returned 0 errors with 5 existing provider hook warnings. Full-project Animated-ref lint issues described below remain. Final Android/iOS/Web export passed after the central start-guard corrections.
- Expo doctor: 20 checks passed; remote config-schema check could not complete twice due Expo API network/TLS errors. Dependency checks passed.
- Existing APK and source ZIP linked earlier predate this feature; no new signed binary was built in this update.

## Parameter wheel update

- Integrated @quidone/react-native-wheel-picker 1.7.2 for minutes, seconds and rounds. Themed centre highlight and fade overlays use existing expo-linear-gradient.
- Fixed reproducible web header flex-basis collapse (18px width, four-line title). Header now has a flexible single-line centre title and equal-width actions.
- Browser interaction verified: 00:15 preset syncs second wheel; tapping minute 01 confirms 01:15; mouse scroll changes selected seconds; cancelling another preset preserves the previous draft; tapping round 4 confirms 4. Test draft restored to prep 0 and rounds 3 without saving configuration.
- At 390px viewport: no horizontal overflow; modal title has 206px width and 26px single-line height. Temporary viewport restored afterward.
- Typecheck, scoped ESLint (ParameterWheel and EditorScreen), 21 mobile/session tests and Android/iOS/Web export passed. Full-project lint limitations described below remain.
- Browser preview is updated. Physical-device gestures and screen-reader interaction need device verification; the existing APK predates these changes.

## Training banner update

- Added safe-area top banner for prep/work/rest and paused sessions outside the training screen. Uses the existing session clock; tap returns without changing playback.
- Android hardware back from training now navigates home without pausing. Navigation callback is stable so the back listener is not recreated by timer ticks.
- Mobile test command: 21 tests passed (includes 3 banner/back-navigation regression tests).
- Typecheck passed; Android/iOS/Web export passed. Targeted lint for App, banner, presentation helper and new tests passed with no warnings after correcting the effect dependencies.
- First full-project lint configured ESLint; it reports pre-existing Animated-ref rule errors in ui.tsx and existing hook/unused-import warnings. These are not resolved by this banner change.
- Banner layout and Android hardware-back behavior still require physical-device verification. The APK linked below predates this update and needs rebuilding to include it.

Verified on Windows with Node.js 24.14.0.

- Root timer/audio tests plus mobile plan, PCM mixer and stopwatch tests: **36 passed, 0 failed**.
- `npx tsc --noEmit` in `mobile/`: passed.
- `npx expo-doctor`: **21/21 checks passed**.
- `npx expo export --platform all`: Android and iOS Hermes bundles, web bundle and bundled assets exported successfully.
- Introspected native configuration: iOS background audio capability; Android media playback foreground service permissions. Microphone permission is removed.
- Independent code review completed; identified preparation cancellation and audio-mode preservation issues fixed and re-reviewed.
- React Native Web interaction checks: parameter modal presets, zero preparation, training start, native-audio-position-driven phase transitions, pause/resume, rest extension (14 seconds to 29 seconds), interrupted report (2/3 rounds with partial final round), stopwatch start/pause and lap/best/average.
- Phone-width layout checked at a 390 x 844 CSS viewport.

Android APK: EAS cloud build **FINISHED** for `preview` (signed `assembleRelease` APK), build `b35b487e-cf58-458a-8423-3130329eb18d`. Downloaded artifact: 84,904,152 bytes. ZIP inspection confirms AndroidManifest.xml, classes.dex, 68 native library entries and 40 bundled WAV assets. SHA-256: `411CAF436765FF664EA9A5EE8F0C430E7036B396995EC40BFC90CD4BA5CEB6A7`.

Build: https://expo.dev/accounts/silanjavascript/projects/round-pro/builds/b35b487e-cf58-458a-8423-3130329eb18d

APK: https://expo.dev/artifacts/eas/8-7v4qbou40Ze4APepE09zEpPupkn0gOlaN27sOsuT0.apk

Not yet verified: physical Android/iOS devices, lock screen sustained playback, notification controls and Bluetooth/phone-call interruption behavior. User selected Android APK first; iOS source/configuration and Hermes bundle are prepared, but an iOS installation binary requires an Apple Developer account and a separate signed build.

## Persistent workout audio cache — 2026-10-13

- 48 tests passed, including six cache/static-asset regressions. Typecheck passed; lint passed with the same five existing hook warnings and no errors. Android/iOS/Web resource export succeeded after the final source changes. No EAS/APK build requested or started.
- 16 static AAC/M4A preset variants generated using installed FFmpeg. FFprobe verified each format duration against the source timeline (2,837.5 / 1,872.5 / 1,182.5 / 672.5 seconds, including completion tail). Total source asset bytes: 7,268,654. Tests validate manifest identity, timeline duration and file sizes against current presets.
- Browser QA read an existing custom workout WAV Blob from IndexedDB: 1,019,858 bytes, repeated acquisitions 2.1 ms and 1.2 ms. A newly created preview tab reused the persistent file; logs showed cache-acquire with no load-clips/render-and-store. Presets reported bundled-preset with no synthesis. These measurements exclude player initialization and are not phone startup benchmarks. Temporary QA route removed afterward.
- Homepage boxing shortcuts now display MaterialCommunityIcons boxing-glove, confirmed visually. Round data remains 1–30 and editor explains the limit.
- Independent review caught preparation cancellation/settings and save/settings races; fixed and re-reviewed with no remaining major findings. Shared files and active/pending leases survive cleanup until unused. Preparation does not create a player or alter the audio session.
- Native documents persistence, offline AAC decoding/cue boundaries, system audio interruptions, lock-screen timing and storage-pressure behavior still require physical Android/iOS acceptance. Existing APK predates this change.

## Flat sport card surfaces — 2026-10-13

- Replaced shared card, inset metric, report metric and button gradients with solid charcoal surfaces and thin boundaries; removed unused surfaces.tsx. Cards use 12px radii, inset blocks 8px, controls 10px and sheets 16px. Circular icon controls, primary-button subtle glow, selected-plan border/checkmark and dial/fog/medal/wheel effects retained.
- npm run typecheck passed. npm run lint passed with zero errors and five existing SessionProvider hook warnings.
- Browser checked homepage, plan library/current selection and new-plan editor at 390x844. Editor document has no horizontal overflow. Captured home and plan-library screenshots; viewport reset afterward. No plan saved, workout started or APK built during verification.
