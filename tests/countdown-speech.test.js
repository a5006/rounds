import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleCountdownSpeech } from '../src/countdown-speech.js';
import { scheduleWoodClapper } from '../src/wood-clapper.js';
function timerClock() {
  const timers = [], clock = { Date: { now: () => 1000 }, setTimeout(fn, delay) { timers.push({ fn, delay }); return timers.length; }, clearTimeout(id) { timers[id - 1].cancelled = true; } };
  return { clock, timers };
}
test('work speech schedules three distinct numbers at the 3, 2, 1 second deadlines', () => {
  const { clock, timers } = timerClock(); const heard = [];
  const cancel = scheduleCountdownSpeech(7000, null, second => heard.push(second), clock);
  assert.deepEqual(timers.map(timer => timer.delay), [3000, 4000, 5000]);
  timers.forEach(timer => timer.fn()); assert.deepEqual(heard, [3, 2, 1]);
  cancel(); assert(timers.every(timer => timer.cancelled));
});
test('speech skips late background callbacks and avoids replaying a spoken number after resume', () => {
  const { clock, timers } = timerClock(); const heard = [];
  scheduleCountdownSpeech(3800, 3, second => heard.push(second), clock);
  assert.deepEqual(timers.map(timer => timer.delay), [800, 1800]);
  clock.Date.now = () => 9000;
  timers.forEach(timer => timer.fn()); assert.deepEqual(heard, []);
});
test('wood recording starts at precisely ten seconds remaining on the audio clock', () => {
  const source = { connect() {}, disconnect() {}, start(at) { this.startedAt = at; }, stop(at) { this.stoppedAt = at; } };
  const context = { state: 'running', currentTime: 4, createBufferSource: () => source };
  let played = 0;
  const cancel = scheduleWoodClapper(context, {}, 60000, () => played++);
  assert.equal(source.startedAt, 54);
  context.currentTime = 20; cancel(); assert.equal(played, 0); assert.equal(source.stoppedAt, 20);
});
