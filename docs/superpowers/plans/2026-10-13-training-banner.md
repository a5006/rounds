# Training Banner Implementation Plan

**Goal:** Keep the native workout visible while browsing other screens.

**Architecture:** A compact safe-area banner consumes the existing session. Pure presentation and back-target helpers cover visibility, rounding, and navigation without changing audio playback.

**Tech Stack:** Existing Expo 57, React Native, TypeScript and Node tests.

- [x] Add failing tests in mobile/tests/training-banner.test.mjs: prep/work/rest outside training visible, idle/done hidden, paused label, ceil seconds, Android training back goes home.
- [x] Implement mobile/src/core/training-banner.mjs returning phase/label/time/round; backTarget(screen) returns home for training, settings for credits, home for other screens, null for home.
- [x] Add mobile/src/TrainingBanner.tsx: Pressable with phase dot, label, round, mono timer, chevron, theme border; onPress navigates training without resuming.
- [x] Render banner above ScreenComponent in mobile/App.tsx. Replace hardware-back pause branch with backTarget navigation.
- [x] Run mobile tests, typecheck, lint and expo export; update validation notes with physical device limits.

