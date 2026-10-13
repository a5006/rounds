# Audio cache implementation

- [x] Test cache fingerprints, concurrency, persistence, shared-owner deletion, active leases and failed/replaced generation.
- [x] Implement pure cache manager and native document/Web IndexedDB adapters with atomic publishing.
- [x] Generate and validate 16 preset M4A assets/manifest using existing FFmpeg. Container durations match source timelines; physical-device cue timing remains a device acceptance check.
- [x] Separate prepare-file from create-player; integrate save/restore/settings/start/delete lifecycle and delayed busy UI.
- [x] Keep round picker/validation 1–30, add limit label, replace boxing shortcuts with glove icon.
- [x] Run tests/typecheck/lint/export, review concurrency/storage/audio semantics and browser checks; document measurements and native limitations. No APK build.
