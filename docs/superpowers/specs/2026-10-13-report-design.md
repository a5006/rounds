# Animated training report

User approved the supplied reference and proposed design on 2026-10-13.

Four icon cards: completed rounds (with target and attainment), actual work time, actual rest time, elapsed time including preparation. No calories, energy-load estimate or health claim. Complete/interrupted headings depend on report completion. Share retains actual data; restart uses the existing unfinished-session guard; return home uses existing persisted report.

Numeric values count from zero to their exact formatted final values in 700ms. Vertical red columns represent recorded work duration, including partial rounds and zero-duration skipped records. Equal durations have equal heights; maximum sets chart scale. Stagger starts left-to-right, columns grow upwards from baseline; group finishes within 600ms. All rounds share the container width without scrolling. Empty data has an explicit placeholder. Reduced motion shows final values immediately; animations clean up on unmount/background.

Follow-up: user requires columns to share the full container width dynamically, without horizontal scrolling or minimum/maximum column width. Up to ten rounds retain per-column labels; larger charts use first/middle/last round labels to prevent overlap. Preserve actual duration scaling and entrance motion.

Use existing Ionicons/Reanimated/gradient libraries. Isolate report screen, visual components and pure presentation helper. Validate partial/empty/zero/equal records, count bounds, animation schedule, typecheck/lint, platform exports and browser visuals. Native smoothness requires device checks.
