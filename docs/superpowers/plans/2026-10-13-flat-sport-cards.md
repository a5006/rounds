# Flat sport cards implementation plan

**Approved design:** Replace tinted card/button gradients with solid charcoal surfaces, clear thin borders, 12px cards, 8px inset blocks, 10px controls. Retain subtle primary-button glow, circular icon controls, dial/fog/medal animations and wheel fade masks. No athlete image or functional changes. No APK build.

**Architecture:** Shared theme radius tokens and Card/Button/Metric styles apply across screens. ReportMetric uses the same tokens; compact local controls adopt the new radii. Remove the unused SurfaceGradient helper after all consumers are replaced.

- [x] Update shared theme, surfaces and report metrics. Preserve hit target sizes, selected-state borders and disabled/pressed states.
- [x] Align homepage shortcuts, plan chips, editor inset blocks/sheet, training banner and report preview panel.
- [x] Run typecheck/lint; inspect homepage, plans and editor at phone width and capture screenshots. This is a reversible visual-only change; no implementation-mirroring tests.
