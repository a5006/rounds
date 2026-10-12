export function shouldScheduleRoundWarning(session, { enabled, muted, audioReady }) {
  return Boolean(enabled && !muted && audioReady && session.running &&
    session.phase === 'work' && session.remainingMs > 0 &&
    session.warningPlayedRound !== session.round);
}

export function scheduleWoodClapper(context, buffer, remainingMs, onPlayed = () => {}) {
  if (!context || context.state !== 'running' || !buffer || remainingMs <= 0) return () => {};
  const start = context.currentTime + Math.max(0, (remainingMs - 10000) / 1000);
  const source = context.createBufferSource();
  let cancelled = false, played = false;
  const mark = () => { if (!played) { played = true; onPlayed(); } };
  source.buffer = buffer; source.connect(context.destination); source.start(start);
  source.onended = () => { source.disconnect(); if (!cancelled) mark(); };
  return () => {
    cancelled = true;
    if (context.currentTime >= start) mark();
    try { source.stop(context.currentTime); } catch { /* Already finished. */ }
  };
}
