import test from 'node:test';
import assert from 'node:assert/strict';
import * as timeline from '../src/core/plan-timeline.mjs';

test('eight rounds match the design duration and stage sequence', () => {
  const result = timeline.planTimeline({ rounds: 8, workSec: 180, restSec: 60, prepSec: 10, noRestLast: true });
  assert.equal(result.totalMs, 1870000);
  assert.deepEqual(result.totals, { prep: 10000, work: 1440000, rest: 420000 });
  assert.equal(result.segments.length, 16);
  assert.equal(result.segments[0].phase, 'prep');
  assert.equal(result.segments.at(-1).phase, 'work');
  assert.equal(result.segments.reduce((sum, x) => sum + x.durationMs, 0), result.totalMs);
});
test('zero stages are omitted and enabling final rest adds exactly one segment', () => {
  const config = { rounds: 3, workSec: 20, restSec: 0, prepSec: 0, noRestLast: true };
  const result = timeline.planTimeline(config);
  assert.deepEqual(result.segments.map(x => x.phase), ['work', 'work', 'work']);
  const withRest = timeline.planTimeline({ ...config, restSec: 15, noRestLast: false });
  assert.equal(withRest.segments.at(-1).phase, 'rest');
  assert.equal(withRest.totalMs, 105000);
  assert.equal(withRest.totals.rest, 45000);
});
