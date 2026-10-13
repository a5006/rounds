# Gradient surfaces, stopwatch reset and APK

User approved implementation on 2026-10-13.

Apply dark gradients to shared cards/metrics, theme-tinted gradients to current home plan/plan cards/report metrics, strong same-colour gradient/glow to primary buttons and restrained secondary surfaces. Preserve red/blue/amber palette and legibility. Existing fog remains animated. Shared surfaces avoid adding continuous animation per card.

Stopwatch reset commits cleared persistent stopwatch immediately, including laps, but renders its previous time interpolating to zero over 500ms. Ring interpolates the previous minute fraction directly to zero separately from numbers to prevent wrapping as minutes decrease. Reset always ends stopped with empty ring; reduced motion resets instantly. Starting during reset cancels presentation animation and starts from cleared time. Background/unmount cancels animation. Test minute-boundary and cancellation cases.

Complete pending PNG report share verification and remove stopwatch CSV export. Run tests/typecheck/lint and Android/iOS/Web exports before authorized EAS preview APK build. Increase native version code for upgrade and retain existing package/signing credentials. Poll build at bounded intervals, fetch artifact, validate ZIP and deliver installation link. Physical-device performance/system sharing remains a device check.
