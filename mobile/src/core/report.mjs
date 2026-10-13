export function countValue(target, progress) {
  return Math.floor(Math.max(0, target) * Math.max(0, Math.min(1, progress)));
}
export function barDelay(index, count) {
  return count > 1 ? index * Math.min(45, 280 / (count - 1)) : 0;
}
export function reportColumns(records) {
  const values = records.map(ms => Math.max(0, Number(ms) || 0));
  const max = Math.max(1, ...values);
  return values.map((ms, index) => ({ round: index + 1, ms, ratio: ms / max }));
}
export function reportSummary(report) {
  return { complete: report.rounds > 0 && report.completedRounds >= report.rounds,
    percent: report.rounds > 0 ? Math.min(100, Math.round(report.completedRounds / report.rounds * 100)) : 0 };
}
