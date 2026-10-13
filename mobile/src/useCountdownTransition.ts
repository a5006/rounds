import { useEffect, useRef, useState } from 'react';
import { cancelAnimation, Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { countdownFrame, countdownRatio, transitionKind } from './core/countdown-motion.mjs';
import { useMotionPreferences } from './useMotionClock';

export function useCountdownTransition(remainingMs: number, durationMs: number, key: string, running: boolean, enabled: boolean) {
  const { active } = useMotionPreferences(enabled);
  const [displayMs, setDisplayMs] = useState(remainingMs);
  const displayed = useRef(remainingMs), frame = useRef(0);
  const source = useRef({ remainingMs, durationMs, key, running, active });
  const previous = useRef({ remainingMs, durationMs, key, running, active });
  const transition = useRef<{ from: number; start: number } | null>(null);
  const from = useSharedValue(countdownRatio(remainingMs, durationMs));
  const target = useSharedValue(countdownRatio(remainingMs, durationMs));
  const amount = useSharedValue(1);
  const ring = useDerivedValue(() => from.value + (target.value - from.value) * amount.value);

  useEffect(() => {
    const next = { remainingMs, durationMs, key, running, active };
    const kind = transitionKind(previous.current, next);
    previous.current = next; source.current = next;
    if (!enabled) return;
    const ratio = countdownRatio(remainingMs, durationMs);
    if (kind === 'snap') {
      cancelAnimationFrame(frame.current); transition.current = null;
      cancelAnimation(amount); amount.value = 1; target.value = ratio;
      displayed.current = remainingMs;
      frame.current = requestAnimationFrame(() => setDisplayMs(source.current.remainingMs));
      return;
    }
    if (kind === 'transition') {
      cancelAnimationFrame(frame.current);
      from.value = ring.value; target.value = ratio;
      cancelAnimation(amount); amount.value = 0;
      amount.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      transition.current = { from: displayed.current, start: performance.now() };
      const tick = (now: number) => {
        const current = transition.current;
        if (!current) return;
        const progress = Math.max(0, Math.min(1, (now - current.start) / 500));
        const ms = countdownFrame(current.from, source.current.remainingMs, progress);
        displayed.current = ms; setDisplayMs(ms);
        if (progress < 1) frame.current = requestAnimationFrame(tick);
        else transition.current = null;
      };
      frame.current = requestAnimationFrame(tick);
      return;
    }
    // Keep an in-flight transition aimed at the live clock; ordinary ticks must not restart it.
    target.value = transition.current ? ratio : withTiming(ratio, { duration: 110, easing: Easing.linear });
    if (!transition.current) {
      cancelAnimationFrame(frame.current);
      displayed.current = remainingMs;
      frame.current = requestAnimationFrame(() => setDisplayMs(source.current.remainingMs));
    }
  }, [remainingMs, durationMs, key, running, active, enabled, amount, from, target, ring]);

  useEffect(() => () => { cancelAnimationFrame(frame.current); cancelAnimation(amount); cancelAnimation(target); transition.current = null; }, [amount, target]);
  return { displayMs: active ? displayMs : remainingMs, ring };
}
