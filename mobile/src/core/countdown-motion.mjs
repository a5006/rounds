export const countdownRatio = (remainingMs, durationMs) => Math.max(0, Math.min(1, remainingMs / Math.max(1, durationMs)));
export function transitionKind(previous, next) {
  if (!previous.active || !next.active || (next.running && next.remainingMs <= 3000)) return 'snap';
  if (next.key !== previous.key || next.remainingMs > previous.remainingMs + 100 || next.durationMs !== previous.durationMs) return 'transition';
  if (previous.remainingMs - next.remainingMs > 1000) return 'snap';
  return 'tick';
}
export function countdownFrame(from, target, progress) {
  const fraction = 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3;
  return Math.max(0, Math.round(from + (target - from) * fraction));
}
