# Plan Timeline Implementation Plan

**Goal:** Restore the approved design's proportional preparation/work/rest time bar in the plan editor.

**Architecture:** A pure timeline function builds ordered nonzero phases and totals. A dedicated component renders proportional widths with internal separators and phase-colored legends, immediately recomputed from the editor draft.

**Tech Stack:** Existing React Native View/Text and Ionicons.

- [x] Add failing tests for eight-round design totals, zero phases and optional final rest.
- [x] Implement pure timeline and themed summary component.
- [x] Position summary under final-rest switch as in design; remove duplicate summary above parameters.
- [x] Verify live updates and compact layout in browser; run tests, typecheck, scoped lint and export.
