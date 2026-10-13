import { advanceSession } from '../../../src/session.js';

export const DEFAULT_CONFIG = { workSec: 60, restSec: 60, prepSec: 10, rounds: 8, noRestLast: true };
export const DEFAULT_SETTINGS = { earlyWarning: true, voiceAudio: true, vibration: true, keepAwake: true };

export function normalizeConfig(input = {}) {
  const seconds = (value, fallback, min) => Math.max(min, Math.min(655, Math.round((Number.isFinite(Number(value)) ? Number(value) : fallback) / 5) * 5));
  return {
    workSec: seconds(input.workSec, 60, 5), restSec: seconds(input.restSec, 60, 0), prepSec: seconds(input.prepSec, 10, 0),
    rounds: Math.max(1, Math.min(30, Math.round(Number(input.rounds) || 8))), noRestLast: input.noRestLast !== false,
  };
}

function phaseCues(phase, round, durationMs, settings, includeStart) {
  const cues = [];
  const add = (atMs, kind, clip) => cues.push({ atMs, kind, clip: clip || kind });
  if (includeStart) {
    if (phase === 'work') add(0, 'start');
    if (phase === 'rest' || phase === 'done') add(0, 'bells');
    if (settings.voiceAudio) add(phase === 'work' ? 250 : 350, 'voice', phase === 'work' ? `round-${round}` : phase);
  }
  if (phase === 'prep' || phase === 'rest') {
    for (const second of [3, 2, 1]) if (durationMs >= second * 1000) add(durationMs - second * 1000, 'beep');
  }
  if (phase === 'work') {
    if (settings.earlyWarning && durationMs > 10000) add(durationMs - 10000, 'clapper');
    if (settings.voiceAudio) for (const second of [3, 2, 1]) if (durationMs >= second * 1000) add(durationMs - second * 1000, 'voice', `number-${second}`);
  }
  return cues.sort((a, b) => a.atMs - b.atMs);
}

export function planFromSession(session, options = {}, includeStart = false) {
  if (!session.config || session.phase === 'idle') return [];
  const settings = { ...DEFAULT_SETTINGS, ...options };
  const plan = [];
  let current = { ...session }, offsetMs = 0, first = true;
  while (plan.length < 65) {
    const durationMs = current.phase === 'done' ? 2500 : current.remainingMs;
    plan.push({ phase: current.phase, round: current.round, durationMs, offsetMs, cues: phaseCues(current.phase, current.round, durationMs, settings, first ? includeStart : true).filter(c => !(first && current.phase === 'work' && current.warningPlayedRound === current.round && c.kind === 'clapper')) });
    offsetMs += durationMs;
    if (current.phase === 'done') break;
    current = advanceSession(current); first = false;
  }
  return plan;
}

export function createWorkoutPlan(input, settings = {}) {
  const config = normalizeConfig(input);
  const phase = config.prepSec > 0 ? 'prep' : 'work';
  return planFromSession({ config, phase, round: 1, completedRounds: 0, roundRecords: [], remainingMs: (phase === 'prep' ? config.prepSec : config.workSec) * 1000 }, settings, true);
}

export function stopwatchElapsed(stopwatch, now) {
  return Math.max(0, stopwatch.elapsedMs + (stopwatch.running ? Math.max(0, now - stopwatch.startedAt) : 0));
}

export function formatDuration(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
