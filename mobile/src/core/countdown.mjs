export const MAX_COUNTDOWN_SECONDS = 86399;
export const DEFAULT_RECENT_TIMES = [145, 67, 623, 59, 30, 25];
export function normalizeSeconds(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(MAX_COUNTDOWN_SECONDS, Math.floor(number))) : 0;
}
export function emptyCountdown(seconds = 145) {
  const durationMs = normalizeSeconds(seconds) * 1000;
  return { status: 'idle', durationMs, remainingMs: durationMs, deadline: 0 };
}
export function countdownRemaining(timer, now) {
  return timer.status === 'running' ? Math.max(0, timer.deadline - now) : timer.remainingMs;
}
export function settleCountdown(timer, now) {
  if (timer.status !== 'running' || countdownRemaining(timer, now) > 0) return timer;
  return { ...timer, status: 'complete', remainingMs: 0, deadline: 0 };
}
export function startCountdown(seconds, now) {
  const timer = emptyCountdown(seconds);
  return timer.durationMs ? { ...timer, status: 'running', deadline: now + timer.durationMs } : timer;
}
export function pauseCountdown(timer, now) {
  const settled = settleCountdown(timer, now);
  return settled.status === 'running' ? { ...settled, status: 'paused', remainingMs: countdownRemaining(settled, now), deadline: 0 } : settled;
}
export function stopCountdown(timer) {
  return { ...timer, status: 'ready', remainingMs: timer.durationMs, deadline: 0 };
}
export function shouldRingCountdown(previous, next, muted) {
  return !muted && previous.status === 'running' && next.status === 'complete';
}
export function resumeCountdown(timer, now) {
  return timer.status === 'paused' && timer.remainingMs > 0 ? { ...timer, status: 'running', deadline: now + timer.remainingMs } : timer;
}
export function recentCountdownTimes(values) {
  const times = Array.isArray(values) ? values : DEFAULT_RECENT_TIMES;
  return [...new Set(times.map(normalizeSeconds).filter(Boolean))].slice(0, 6);
}
export function restoreCountdown(saved, now) {
  const fallback = emptyCountdown();
  if (!saved || !['idle', 'ready', 'running', 'paused', 'complete'].includes(saved.status)) return fallback;
  const durationMs = normalizeSeconds(saved.durationMs / 1000) * 1000;
  if (!durationMs) return fallback;
  const remainingMs = Number.isFinite(saved.remainingMs) ? Math.max(0, Math.min(durationMs, saved.remainingMs)) : durationMs;
  if (saved.status === 'running' && (!Number.isFinite(saved.deadline) || saved.deadline <= 0 || saved.deadline > now + durationMs)) return { ...fallback, durationMs, remainingMs, status: 'paused' };
  return settleCountdown({ status: saved.status, durationMs, remainingMs: saved.status === 'ready' ? durationMs : saved.status === 'complete' ? 0 : remainingMs, deadline: saved.status === 'running' ? saved.deadline : 0 }, now);
}
export function formatCountdown(ms) {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
}
