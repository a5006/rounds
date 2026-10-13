import test from 'node:test';
import assert from 'node:assert/strict';
import { reportColumns, countValue, barDelay, reportSummary } from '../src/core/report.mjs';

test('columns preserve equal, zero and partial actual work durations', () => {
  const columns = reportColumns([60000, 60000, 15000, 0]);
  assert.deepEqual(columns.map(c => c.ratio), [1, 1, .25, 0]);
  assert.deepEqual(columns.map(c => c.ms), [60000, 60000, 15000, 0]);
  assert.deepEqual(reportColumns([]), []);
  assert.equal(reportColumns([0])[0].ratio, 0);
});
test('count up clamps to exact integer endpoint without overshooting', () => {
  assert.equal(countValue(480000, 0), 0);
  assert.equal(countValue(480000, .5), 240000);
  assert.equal(countValue(480000, 1), 480000);
  assert.equal(countValue(8, 2), 8);
  assert.equal(countValue(8, -1), 0);
});
test('stagger remains ordered and finishes within 600ms even at 30 rounds', () => {
  assert.equal(barDelay(0, 30), 0);
  assert.equal(barDelay(29, 30) + 320, 600);
  assert.ok(barDelay(1, 8) > barDelay(0, 8));
});
test('summary distinguishes interrupted and complete reports and zero targets', () => {
  assert.deepEqual(reportSummary({ completedRounds: 2, rounds: 8 }), { complete: false, percent: 25 });
  assert.deepEqual(reportSummary({ completedRounds: 8, rounds: 8 }), { complete: true, percent: 100 });
  assert.deepEqual(reportSummary({ completedRounds: 0, rounds: 0 }), { complete: false, percent: 0 });
});
