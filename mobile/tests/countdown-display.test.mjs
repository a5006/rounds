import test from 'node:test';
import assert from 'node:assert/strict';
import * as countdown from '../src/core/countdown.mjs';

test('countdown time and milliseconds describe the same instant', () => {
  assert.equal(typeof countdown.formatCountdownParts, 'function');
  for (const [ms, time, fraction] of [
    [59999, '00:00:59', '999'],
    [60000, '00:01:00', '000'],
    [3600001, '01:00:00', '001'],
    [15237, '00:00:15', '237'],
    [999, '00:00:00', '999'],
    [0, '00:00:00', '000'],
    [-1, '00:00:00', '000'],
  ]) assert.deepEqual(countdown.formatCountdownParts(ms), { time, fraction });
});
