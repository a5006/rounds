# Home Plan Visibility Implementation Plan

**Goal:** Replace favorites with persisted homepage visibility and enrich existing plan controls with icons.

**Architecture:** Plan model owns showOnHome and migrates legacy favorite records. The homepage uses one filtered plan list, while selection remains a separate single selectedPlanId.

**Tech Stack:** Existing Expo/React Native, Ionicons, pure Node tests.

- [x] Update regression tests for toggle, restore false, preset protection, copy hidden, editing preserves visibility and legacy favorites migration.
- [x] Replace favorite model/type/provider/UI with showOnHome; filter homepage and show empty state.
- [x] Render house button, selection icon+label and parameter/alert icons using Ionicons.
- [x] Verify browser toggle/filter/home/refresh, check types/tests/lint and document outcome.
