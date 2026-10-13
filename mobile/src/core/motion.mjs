export function advancePhase(phase, deltaMs, durationMs) {
  'worklet';
  return phase + Math.max(0, Math.min(64, deltaMs)) / Math.max(1, durationMs);
}
export function motionProfile(mode) {
  if (mode === 'rest') return { color: '#a2c9ff', accent: '#d3e4ff', orbitMs: 12000, driftMs: 16000, breathMs: 5000 };
  if (mode === 'work') return { color: '#ff525d', accent: '#ffb3b2', orbitMs: 6000, driftMs: 9000, breathMs: 2600 };
  return { color: '#fdbb43', accent: '#ffdeac', orbitMs: 7000, driftMs: 12000, breathMs: 4000 };
}
