export const stopwatchRing = ms => (Math.max(0, ms) % 60000) / 60000;
export function stopwatchResetFrame(fromMs, progress) {
  const remaining = (1 - Math.max(0, Math.min(1, progress))) ** 3;
  return { ms: Math.floor(Math.max(0, fromMs) * remaining), ring: stopwatchRing(fromMs) * remaining };
}
