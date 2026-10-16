# Timer UI polish

Apply the seven browser annotations, with the final clarification taking priority: show the countdown back button only in its execution view, including paused, ready, and complete states. Hide header back buttons on stopwatch, reports, and plans; keep other screens as they are. Show the same R logo as the home header on stopwatch, countdown setup/history, plans, and reports. Countdown execution retains its back button.

Countdown progress shows only its percentage; paused status uses an accessible pause icon. Show whole seconds plus a smaller red three-digit millisecond fraction underneath the time, aligned to its right edge. Derive both pieces from the same remaining time, flooring whole seconds to avoid mismatched fractions. Retain the existing deadline clock and refresh rate.

Use the existing motion clock to animate a red countdown setup dot and an amber stopwatch dot. Respect reduced motion and background suspension. Stopwatch label: PRECISION TIMING · 1/100 SEC. Quick adjustments: +15S, +30S, +60S.

Validate time boundaries with unit tests; validate layouts, navigation, pause/resume and milliseconds in the browser. Run mobile lint and typecheck.
