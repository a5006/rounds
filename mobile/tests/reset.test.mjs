import test from 'node:test';
import assert from 'node:assert/strict';
import { stopwatchResetFrame, stopwatchRing } from '../src/core/reset.mjs';

test('reset time and ring reach zero without wrapping through preceding minutes', () => {
  const start = stopwatchResetFrame(144000, 0);
  const middle = stopwatchResetFrame(144000, .5);
  assert.equal(start.ms, 144000);
  assert.equal(start.ring, .4);
  assert.ok(middle.ms < start.ms && middle.ms > 0);
  assert.ok(middle.ring < start.ring && middle.ring > 0);
  assert.deepEqual(stopwatchResetFrame(144000, 1), { ms: 0, ring: 0 });
  const frames = Array.from({ length: 101 }, (_, n) => stopwatchResetFrame(144000, n / 100));
  assert.ok(frames.every((f, n) => n === 0 || (f.ms <= frames[n - 1].ms && f.ring <= frames[n - 1].ring)));
});
test('empty ring and bounded reset values', () => {
  assert.equal(stopwatchRing(0), 0);
  assert.equal(stopwatchRing(60000), 0);
  assert.equal(stopwatchRing(90000), .5);
  assert.deepEqual(stopwatchResetFrame(0, .5), { ms: 0, ring: 0 });
  assert.deepEqual(stopwatchResetFrame(40000, 2), { ms: 0, ring: 0 });
});
