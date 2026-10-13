import test from 'node:test';
import assert from 'node:assert/strict';
import * as motion from '../src/core/motion.mjs';

test('orbit phase remains continuous over full turns and resumed increments', () => {
  let phase = .999;
  const next = motion.advancePhase(phase, 16, 6000);
  assert(next > 1);
  assert(next - phase < .01);
  phase = next;
  assert.equal(motion.advancePhase(phase, 0, 6000), phase);
  assert(motion.advancePhase(phase, 16, 6000) > phase);
});
test('background suspension cannot cause a large catch-up jump', () => {
  assert.equal(motion.advancePhase(3, 10000, 6000), 3 + 64 / 6000);
  assert.equal(motion.advancePhase(3, -20, 6000), 3);
});
test('phase styles match the red blue amber theme and rest moves slower', () => {
  assert.equal(motion.motionProfile('work').color, '#ff525d');
  assert.equal(motion.motionProfile('rest').color, '#a2c9ff');
  assert.equal(motion.motionProfile('stopwatch').color, '#fdbb43');
  assert(motion.motionProfile('rest').orbitMs > motion.motionProfile('work').orbitMs);
});
