# Unified countdown transitions

User approved applying numeric/ring transitions to preparation, work and rest reset, extension and phase/round changes. No APK build in this task.

Presentation-only 500ms ease-out transitions interpolate from displayed time/arc to the live authoritative remaining time and new arc ratio. Reset target is configured/current duration, extension adds actual milliseconds, phase key includes phase+round so zero-rest next rounds animate. Regular decrement uses existing true clock, with no added delay to audio/phase/report. Actual final 3/2/1 cues remain sourced from authoritative time; running targets in the final 3 seconds snap to avoid conflicting countdown labels.

Use isolated presentation helper/hook and Reanimated shared arc interpolation. Retarget rapid changes from current displayed values, cancel on unmount/background/reduced motion, snap on resume/catchup. Preserve stopwatch reset. Initial mounting shows current time rather than replaying phase animation. Tests cover classification, moving targets, clamping, zero-rest round identity, background/catchup and cues. Verify paused manual reset/extension and browser visuals, typecheck/lint and source export. Physical-device animation remains a device check.
