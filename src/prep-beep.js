export function phaseBellCount(phase) {
  return phase === 'rest' || phase === 'done' ? 3 : 0;
}

export function shouldPlayPrepBeep(session, { muted, audioReady, lastSecond }) {
  const second = Math.ceil(session.remainingMs / 1000);
  return Boolean(session.phase === 'prep' && session.running && !muted && audioReady && second > 0 && second <= 3 && second !== lastSecond);
}

// Short piezo-style electronic watch beep, with a soft edge to prevent clicks.
function createCountdownBeep(context, secondsLeft, start, onEnded, finalAt = 0) {
  const oscillator = context.createOscillator(), gain = context.createGain();
  const finalSecond = secondsLeft === finalAt;
  const duration = finalSecond ? 0.18 : 0.09;
  oscillator.type = 'square';
  oscillator.frequency.value = finalSecond ? 3200 : 2400;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.055, start + 0.002);
  gain.gain.setValueAtTime(0.055, start + duration - 0.025);
  gain.gain.linearRampToValueAtTime(0, start + duration);
  oscillator.connect(gain); gain.connect(context.destination);
  oscillator.start(start); oscillator.stop(start + duration + 0.01);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); onEnded?.(); };
  return oscillator;
}

export function playPrepBeep(context, secondsLeft, finalAt = 0) {
  if (!context || context.state !== 'running') return false;
  createCountdownBeep(context, secondsLeft, context.currentTime, undefined, finalAt);
  return true;
}

export function schedulePrepFinish(context, remainingMs, onPlayed = () => {}) {
  if (!context || context.state !== 'running' || remainingMs <= 0) return () => {};
  const start = context.currentTime + remainingMs / 1000;
  let cancelled = false;
  const node = createCountdownBeep(context, 0, start, () => { if (!cancelled) onPlayed(); }, 0);
  return () => {
    // The phase may change a few milliseconds after zero. Let that final beep finish.
    if (context.currentTime >= start) { onPlayed(); return; }
    cancelled = true;
    try { node.stop(context.currentTime); } catch { /* Already stopped. */ }
  };
}

// Shared by preparation and rest: ordinary tones at 3/2/1, high finish tone at zero.
// Schedule on the audio clock, independent of UI ticks.
export function scheduleRestBeeps(context, remainingMs, lastSecond, onPlayed = () => {}) {
  if (!context || context.state !== 'running' || remainingMs <= 0) return () => {};
  let cancelled = false;
  const displayedSecond = Math.ceil(remainingMs / 1000);
  const notes = [3, 2, 1, 0].filter(second => second <= displayedSecond && second !== lastSecond).map(second => {
    const start = context.currentTime + Math.max(0, (remainingMs - second * 1000) / 1000);
    const note = { second, start, played: false };
    note.node = createCountdownBeep(context, second, start, () => {
      if (!cancelled && !note.played) { note.played = true; onPlayed(second); }
    });
    return note;
  });
  return () => {
    cancelled = true;
    for (const note of notes) {
      if (!note.played && context.currentTime >= note.start) { note.played = true; onPlayed(note.second); }
      // Let the zero-second start cue finish when the UI enters the work phase.
      if (note.second === 0 && context.currentTime >= note.start) continue;
      try { note.node.stop(context.currentTime); } catch { /* Node may already have finished. */ }
    }
  };
}
