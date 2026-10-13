import test from 'node:test';
import assert from 'node:assert/strict';
import { countdownRatio, transitionKind, countdownFrame } from '../src/core/countdown-motion.mjs';
const state = (remainingMs, key = 'work:1', extra = {}) => ({ remainingMs, durationMs: 60000, key, active: true, running: true, ...extra });

test('ordinary ticks stay live; reset and extension animate even paused', () => {
  assert.equal(transitionKind(state(30000), state(29950)), 'tick');
  assert.equal(transitionKind(state(10000, 'rest:1', { running: false }), state(60000, 'rest:1', { running: false })), 'transition');
  assert.equal(transitionKind(state(30000), state(45000, 'work:1', { durationMs: 75000 })), 'transition');
});
test('phase and zero-rest round switches animate; short final cues remain actual', () => {
  assert.equal(transitionKind(state(50, 'prep:1'), state(60000, 'work:1')), 'transition');
  assert.equal(transitionKind(state(50), state(60000, 'work:2')), 'transition');
  assert.equal(transitionKind(state(50), state(3000, 'rest:1')), 'snap');
});
test('inactive, resumed and large clock catchups snap rather than replay stale values', () => {
  assert.equal(transitionKind(state(30000), state(5000, 'work:1', { active: false })), 'snap');
  assert.equal(transitionKind(state(30000, 'work:1', { active: false }), state(5000)), 'snap');
  assert.equal(transitionKind(state(30000), state(10000)), 'snap');
});
test('interpolation reaches the live target; ratios clamp zero duration and overflow', () => {
  assert.equal(countdownFrame(10000, 30000, 0), 10000);
  assert.ok(countdownFrame(10000, 29750, .5) > 10000);
  assert.equal(countdownFrame(10000, 29500, 1), 29500);
  assert.equal(countdownRatio(0, 0), 0);
  assert.equal(countdownRatio(90000, 60000), 1);
  assert.equal(countdownFrame(10000, 30000, 2), 30000);
});
