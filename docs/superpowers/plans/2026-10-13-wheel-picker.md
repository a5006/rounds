# Wheel Picker Implementation Plan

**Goal:** Replace platform-dependent parameter selects with consistent wheels and repair the header.

**Architecture:** Wrap the third-party wheel in a focused themed ParameterWheel component. Editor retains its draft, modal and confirm/cancel behavior. Stable data arrays describe minutes, five-second values and round counts.

**Tech Stack:** Expo 57, React Native, @quidone/react-native-wheel-picker, existing expo-linear-gradient.

- [x] Inspect installed picker API and web implementation before integrating.
- [x] Add themed wheel with visible-item count 5, 44px row height, controlled value, centre highlight and fade overlays.
- [x] Replace Editor Picker elements; make header title flex:1 with minWidth:0 and single line, actions fixed equal width.
- [x] Verify preset-to-wheel synchronization, minute/second edits, rounds and cancel/confirm in browser; check narrow screen layout.
- [x] Run typecheck, scoped lint, existing tests and cross-platform export; record verification and device limitations.
