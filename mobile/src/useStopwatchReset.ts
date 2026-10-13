import { useEffect, useRef, useState } from 'react';
import { useMotionPreferences } from './useMotionClock';
import { stopwatchResetFrame } from './core/reset.mjs';

export function useStopwatchReset(elapsedMs: number, reset: () => void, toggle: () => void) {
  const { active } = useMotionPreferences(true);
  const frame = useRef(0);
  const [display, setDisplay] = useState<{ ms: number; from: number } | null>(null);
  useEffect(() => {
    // Clear on either transition: background frames can be suspended and cancelled on return.
    frame.current = requestAnimationFrame(() => setDisplay(null));
    return () => cancelAnimationFrame(frame.current);
  }, [active]);
  function resetWithAnimation() {
    cancelAnimationFrame(frame.current);
    reset();
    if (!active || elapsedMs <= 0) { setDisplay(null); return; }
    const from = elapsedMs, start = performance.now();
    setDisplay({ ms: from, from });
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 500);
      if (progress === 1) { setDisplay(null); return; }
      setDisplay({ ms: stopwatchResetFrame(from, progress).ms, from });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }
  function toggleWithCancellation() { cancelAnimationFrame(frame.current); setDisplay(null); toggle(); }
  return { displayMs: active ? display?.ms ?? elapsedMs : elapsedMs, resetFrom: active ? display?.from : undefined, resetWithAnimation, toggleWithCancellation };
}
