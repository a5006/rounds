# Native Mobile Implementation Plan

**Goal:** Provide a native Expo application for both Android and iOS with the current training and stopwatch behavior.

**Architecture:** Keep the existing Vite app. Reuse the pure session engine from the repository root, and build native screens and platform services in `mobile/`. Keep audio scheduling and configuration normalization in pure modules so their behavior is testable.

**Tech Stack:** Expo, React Native, TypeScript, native SVG/Animated, AsyncStorage, expo-audio, expo-speech, expo-keep-awake and native sharing.

- [x] Scaffold `mobile/`, install SDK-compatible packages and configure Metro to share the root session module.
- [x] Write failing tests for cue timeline rules, zero durations, pause/resume and stopwatch restoration; implement pure adapters.
- [x] Implement bundled audio assets and native playback; honor global mute and stage voice settings.
- [x] Implement persistent session/provider and AppState recovery using the existing state machine.
- [x] Implement all native screens, theme, ambient ring, accessibility and parameter picker.
- [x] Add icon/splash assets, application identifiers, EAS build profiles and an operational README.
- [x] Run core tests, native tests, TypeScript, Expo dependency/configuration checks and Android/iOS JS exports.
- [x] Preview the native component tree through Expo web and verify interactions; explicitly distinguish this check from Android/iOS device verification.
- [x] Report signed-build prerequisites and any remaining platform limits without claiming unbuilt binaries.
- [x] Build Android APK after user completes Expo device login. EAS build finished successfully; APK downloaded and structurally verified. User requested Android first and has no Apple Developer account yet.
