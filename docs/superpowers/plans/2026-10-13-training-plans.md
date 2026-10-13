# Training Plans Implementation Plan

**Goal:** Implement the approved Stitch plan library and configurable plans in the native application.

**Architecture:** Tested pure library operations normalize and protect templates. SessionProvider stores the library and snapshots the active plan at workout start. Expo Router maps existing screens and the new library, while shared controls and wheels remain reusable.

**Tech Stack:** Expo SDK 57, TypeScript, React Native, Expo Router, expo-audio, AsyncStorage.

- [x] Write failing plan-model tests: migration, template protection, copy independence, edits, deletion, favorites, invalid names and profile clamping.
- [x] Implement plans.mjs model operations and TypeScript plan types.
- [x] Integrate persistent library, selected plan and session snapshot; apply volume and vibration without changing cue rules.
- [x] Add src/app routing and shared shell per mobile/AGENTS.md; preserve banner and return behavior.
- [x] Add filtered library cards, creation, copy, favorite and delete confirmation, active-session replacement guard.
- [x] Expand editor with name, category, color, profile switches and volume; reuse time/round wheels and add timing breakdown.
- [x] Verify browser editing, reload persistence, template copy, delete/history preservation, workout snapshot and preview.
- [x] Run tests/typecheck/lint/doctor/export and document remaining physical-device checks.
