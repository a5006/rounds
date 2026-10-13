# Native Mist Implementation Plan

**Goal:** Add visible drifting glow mist and continuous double orbit tails to native workout/rest/stopwatch.

**Architecture:** Motion preferences and a UI frame clock are isolated in a shared hook. Memoized decoration and mist components consume primitive phase/running props; separate animated SVG progress follows session updates.

**Tech Stack:** Expo 57, Reanimated 4.5.1, react-native-svg, existing gradients.

- [x] Test monotonic phase accumulation, loop continuity, bounded frame delta and stage profiles.
- [x] Implement motion hook with AppState/reduced motion and stable UI clocks.
- [x] Create memoized MistBackground and DialDecoration, replacing legacy Animated orbit/interpolation.
- [x] Smooth progress via animated SVG props, preserve countdown pulse, integrate backgrounds into shared shell.
- [x] Verify browser movement/pause, review stage palettes in source and remove source credit button. Work/rest physical-device visual checks remain pending.
- [x] Run tests/typecheck/lint/export and independent review; document native-device limitations.
