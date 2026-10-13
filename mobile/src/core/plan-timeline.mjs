export function planTimeline(config) {
  const segments = [];
  const totals = { prep: 0, work: 0, rest: 0 };
  const add = (phase, durationMs, round) => {
    if (durationMs <= 0) return;
    segments.push({ phase, durationMs, round });
    totals[phase] += durationMs;
  };
  add('prep', config.prepSec * 1000, 0);
  for (let round = 1; round <= config.rounds; round++) {
    add('work', config.workSec * 1000, round);
    if (round < config.rounds || !config.noRestLast) add('rest', config.restSec * 1000, round);
  }
  return { segments, totals, totalMs: totals.prep + totals.work + totals.rest };
}
