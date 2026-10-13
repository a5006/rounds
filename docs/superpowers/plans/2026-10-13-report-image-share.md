# Report image sharing

User requests image export using mobile system share APIs, and removing stopwatch CSV export.

- [x] Install Expo-compatible view-shot; use existing expo-sharing for native PNG file sharing, web PNG preview/Blob download without external upload.
- [x] Capture only report visuals in a non-collapsible view with final numeric/bar values, frozen fog, branding and padding; exclude navigation and buttons.
- [x] Guard concurrent captures, show generating state, handle errors/cancellation, preserve report data.
- [x] Remove stopwatch CSV button and unused export helper/imports.
- [x] Verify exported browser PNG, typecheck/lint/tests/platform export, review and document native-device limitations/new binary requirement.
