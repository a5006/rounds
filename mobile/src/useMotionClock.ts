import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { advancePhase, motionProfile } from './core/motion.mjs';

export type MotionMode = 'work' | 'rest' | 'prep' | 'stopwatch' | 'countdown';
export function useMotionPreferences(running: boolean) {
  const [ready, setReady] = useState(Platform.OS === 'web');
  const [reduced, setReduced] = useState(() => Platform.OS === 'web' && typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : true);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    let live = true;
    let removeReduction: () => void;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
      query.addEventListener('change', listener);
      removeReduction = () => query.removeEventListener('change', listener);
    } else {
      void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (live) { setReduced(value); setReady(true); } }).catch(() => { if (live) { setReduced(false); setReady(true); } });
      const reduction = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
      removeReduction = () => reduction.remove();
    }
    const state = AppState.addEventListener('change', value => setForeground(value === 'active'));
    return () => { live = false; removeReduction(); state.remove(); };
  }, []);
  return { reduced, ready, active: running && foreground && !reduced };
}

export function useMotionClock(mode: MotionMode, running: boolean) {
  const { active, reduced } = useMotionPreferences(running);
  const turn = useSharedValue(0), drift = useSharedValue(0), breath = useSharedValue(0);
  const { orbitMs, driftMs, breathMs } = motionProfile(mode);
  const frame = useFrameCallback(info => {
    const delta = info.timeSincePreviousFrame ?? 0;
    turn.value = advancePhase(turn.value, delta, orbitMs);
    drift.value = advancePhase(drift.value, delta, driftMs);
    breath.value = advancePhase(breath.value, delta, breathMs);
  }, false);
  useEffect(() => { frame.setActive(active); return () => frame.setActive(false); }, [active, frame]);
  return { turn, drift, breath, active, reduced };
}
