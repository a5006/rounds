export const emptySession = () => ({ phase: 'idle', round: 1, completedRounds: 0, warningPlayedRound: 0, remainingMs: 0, durationMs: 0, elapsedMs: 0, workMs: 0, restMs: 0, roundMs: 0, roundRecords: [], running: false, lastTick: 0, config: null });

export function startSession(config, now) {
  const phase = config.prepSec > 0 ? 'prep' : 'work';
  const durationMs = (phase === 'prep' ? config.prepSec : config.workSec) * 1000;
  return { ...emptySession(), config: { ...config }, phase, durationMs, remainingMs: durationMs, running: true, lastTick: now };
}

export function advanceSession(session) {
  const s = { ...session };
  const c = s.config;
  if (!c || ['idle', 'done'].includes(s.phase)) return s;
  if (s.phase === 'prep') s.phase = 'work';
  else if (s.phase === 'work') {
    s.completedRounds = s.round;
    s.roundRecords = [...(s.roundRecords || []), s.roundMs || 0];
    s.roundMs = 0;
    if (s.round >= c.rounds && (c.noRestLast || c.restSec === 0)) s.phase = 'done';
    else if (c.restSec > 0) s.phase = 'rest';
    else { s.round += 1; s.phase = 'work'; }
  } else if (s.phase === 'rest') {
    if (s.round >= c.rounds) s.phase = 'done';
    else { s.round += 1; s.phase = 'work'; }
  }
  s.durationMs = s.phase === 'work' ? c.workSec * 1000 : s.phase === 'rest' ? c.restSec * 1000 : 0;
  s.remainingMs = s.durationMs;
  if (s.phase === 'done') s.running = false;
  return s;
}

// Consume actual elapsed time, including time spent in a background browser tab.
export function tickSession(session, now) {
  if (!session.running || !session.config) return session;
  let s = { ...session, lastTick: now };
  let delta = Math.max(0, now - session.lastTick);
  for (let i = 0; s.running && i < 100 && delta >= s.remainingMs; i++) {
    delta -= s.remainingMs;
    if (s.phase === 'work') { s.workMs = (s.workMs || 0) + s.remainingMs; s.roundMs = (s.roundMs || 0) + s.remainingMs; }
    if (s.phase === 'rest') s.restMs = (s.restMs || 0) + s.remainingMs;
    s.elapsedMs += s.remainingMs;
    s = advanceSession(s);
  }
  if (s.running) {
    if (s.phase === 'work') { s.workMs = (s.workMs || 0) + delta; s.roundMs = (s.roundMs || 0) + delta; }
    if (s.phase === 'rest') s.restMs = (s.restMs || 0) + delta;
    s.remainingMs = Math.max(0, s.remainingMs - delta); s.elapsedMs += delta;
  }
  return s;
}

export function pauseSession(session, now) {
  return { ...tickSession(session, now), running: false };
}

export function resumeSession(session, now) {
  if (['idle', 'done'].includes(session.phase)) return session;
  return { ...session, running: true, lastTick: now };
}

export function extendSession(session, ms, now) {
  const s = tickSession(session, now);
  if (['idle', 'done'].includes(s.phase)) return s;
  return { ...s, remainingMs: Math.max(0, s.remainingMs + ms), durationMs: Math.max(1, s.durationMs + ms) };
}

export function getReport(s) {
  const roundRecords = s.roundMs > 0 ? [...(s.roundRecords || []), s.roundMs] : (s.roundRecords || []);
  return { completedRounds: s.completedRounds, rounds: s.config?.rounds || 0, workSec: s.config?.workSec || 0, restSec: s.config?.restSec || 0, elapsedMs: s.elapsedMs, workMs: s.workMs || 0, restMs: s.restMs || 0, roundRecords, date: new Date().toISOString() };
}
