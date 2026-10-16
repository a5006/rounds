import test from 'node:test';
import * as countdown from '../src/core/countdown.mjs';
import assert from 'node:assert/strict';
import { countdownRemaining, emptyCountdown, formatCountdown, pauseCountdown, recentCountdownTimes, restoreCountdown, resumeCountdown, settleCountdown, startCountdown, stopCountdown, shouldRingCountdown } from '../src/core/countdown.mjs';

test('wall clock catch-up completes a suspended timer without negative time', () => {
  const timer = startCountdown(145, 1000);
  assert.equal(countdownRemaining(timer, 31000), 115000);
  assert.equal(countdownRemaining(timer, 180000), 0);
  const done = settleCountdown(timer, 180000);
  assert.equal(done.status, 'complete');
  assert.equal(settleCountdown(done, 200000), done);
});
test('pause preserves sub-second remainder and resume excludes paused wall time', () => {
  const paused = pauseCountdown(startCountdown(30, 1000), 2250);
  assert.equal(paused.remainingMs, 28750);
  assert.equal(countdownRemaining(paused, 100000), 28750);
  const resumed = resumeCountdown(paused, 100000);
  assert.equal(resumed.deadline, 128750);
  assert.equal(countdownRemaining(resumed, 101000), 27750);
  assert.equal(pauseCountdown(resumed, 128750).status, 'complete');
});
test('restoration preserves a live deadline and completes elapsed alarms', () => {
  const timer = startCountdown(3600, 1000);
  assert.deepEqual(restoreCountdown(timer, 100000), timer);
  assert.equal(restoreCountdown(timer, 4000000).status, 'complete');
  const paused = pauseCountdown(timer, 2000);
  assert.deepEqual(restoreCountdown(paused, 4000000), paused);
  assert.equal(restoreCountdown({ ...timer, deadline: null }, 2000).status, 'paused');
  assert.deepEqual(restoreCountdown(null, 2000), emptyCountdown());
});
test('limits, zero-duration starts, rounding and recent selections', () => {
  assert.equal(startCountdown(0, 1).status, 'idle');
  assert.equal(startCountdown(100000, 1).durationMs, 86399000);
  assert.equal(formatCountdown(86399000), '23:59:59');
  assert.equal(formatCountdown(1001), '00:00:02');
  assert.equal(formatCountdown(-1), '00:00:00');
  assert.deepEqual(recentCountdownTimes([30, 30, 0, NaN, 145, 60, 90, 120, 180, 240]), [30, 145, 60, 90]);
  assert.equal(resumeCountdown(emptyCountdown(), 1).status, 'idle');
});
test('recent countdowns retain at most four entries and an empty deleted history stays empty', () => {
  assert.equal(recentCountdownTimes(null).length, 4);
  const history = recentCountdownTimes([59, 145, 67, 623, 30, 25]);
  assert.deepEqual(history, [59, 145, 67, 623]);
  assert.deepEqual(recentCountdownTimes(history.filter(seconds => seconds !== 145)), [59, 67, 623]);
  assert.deepEqual(recentCountdownTimes([]), []);
  assert.deepEqual(recentCountdownTimes([10, ...history]), [10, 59, 145, 67]);
});

test('stop restores the original duration without returning to setup, survives reload and restarts fully', () => {
  const stopped = stopCountdown(pauseCountdown(startCountdown(67, 1000), 10000));
  assert.equal(stopped.status, 'ready');
  assert.equal(stopped.remainingMs, 67000);
  assert.equal(stopped.deadline, 0);
  assert.deepEqual(restoreCountdown(stopped, 100000), stopped);
  const restarted = startCountdown(stopped.durationMs / 1000, 100000);
  assert.equal(restarted.deadline, 167000);
  assert.equal(settleCountdown(stopped, 200000).status, 'ready');
});

test('finish rings once only when sound is enabled; pause and stop never ring', () => {
  const running = startCountdown(1, 1000);
  const done = settleCountdown(running, 2000);
  assert.equal(shouldRingCountdown(running, done, false), true);
  assert.equal(shouldRingCountdown(running, done, true), false);
  assert.equal(shouldRingCountdown(done, settleCountdown(done, 3000), false), false);
  assert.equal(shouldRingCountdown(running, stopCountdown(running), false), false);
  assert.equal(shouldRingCountdown(running, pauseCountdown(running, 1500), false), false);
});
test('a scheduled notification does not suppress the foreground completion bell', () => {
  const running = startCountdown(1, 1000), done = settleCountdown(running, 2000);
  assert.equal(shouldRingCountdown(running, done, false, { foreground: true, scheduled: true }), true);
  assert.equal(shouldRingCountdown(running, done, true, { foreground: true, scheduled: true }), false);
  assert.equal(shouldRingCountdown(running, done, false, { foreground: false, scheduled: true }), false);
  assert.equal(shouldRingCountdown(running, done, false, { foreground: true, scheduled: true, catchUp: true }), false);
  assert.equal(shouldRingCountdown(running, done, false, { foreground: true, scheduled: false, catchUp: true }), true);
});
test('countdown notifications leave foreground sound to the app and keep background bells', () => {
  assert.equal(typeof countdown.countdownNotificationSound, 'function');
  assert.equal(countdown.countdownNotificationSound(true, 'bells.wav', true), false);
  assert.equal(countdown.countdownNotificationSound(true, 'bells.wav', false), true);
  assert.equal(countdown.countdownNotificationSound(true, false, false), false);
  assert.equal(countdown.countdownNotificationSound(false, 'default', true), true);
});
