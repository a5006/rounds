import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldPlayPrepBeep, playPrepBeep, scheduleRestBeeps, schedulePrepFinish } from '../src/prep-beep.js';
const session = { phase: 'prep', running: true, remainingMs: 10000 };
const ready = { muted: false, audioReady: true, lastSecond: null };
test('preparation beeps exactly once per displayed countdown second', () => {
  let lastSecond = null, count = 0;
  for (let remainingMs = 10000; remainingMs > 0; remainingMs -= 50) {
    if (shouldPlayPrepBeep({ ...session, remainingMs }, { ...ready, lastSecond })) {
      count++; lastSecond = Math.ceil(remainingMs / 1000);
    }
  }
  assert.equal(count, 10);
});
test('pause, mute, locked audio and non-preparation phases suppress the beep', () => {
  assert.equal(shouldPlayPrepBeep({ ...session, running: false }, ready), false);
  assert.equal(shouldPlayPrepBeep(session, { ...ready, muted: true }), false);
  assert.equal(shouldPlayPrepBeep(session, { ...ready, audioReady: false }), false);
  for (const phase of ['work', 'rest', 'done', 'idle']) assert.equal(shouldPlayPrepBeep({ ...session, phase }, ready), false);
  assert.equal(shouldPlayPrepBeep({ ...session, remainingMs: 0 }, ready), false);
});
test('resuming the same second does not double beep; background catch-up does not replay missed ticks', () => {
  assert.equal(shouldPlayPrepBeep({ ...session, remainingMs: 9500 }, { ...ready, lastSecond: 10 }), false);
  assert.equal(shouldPlayPrepBeep({ ...session, remainingMs: 4200 }, { ...ready, lastSecond: 10 }), true);
  assert.equal(shouldPlayPrepBeep({ ...session, remainingMs: 4150 }, { ...ready, lastSecond: 5 }), false);
});
test('the watch beep is a short 2400Hz square wave and cleans up its audio nodes', () => {
  const events = [];
  const oscillator = { frequency: {}, connect() {}, start: value => events.push(['start', value]), stop: value => events.push(['stop', value]), disconnect: () => events.push(['oscillator-disconnect']) };
  const gain = { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect: () => events.push(['gain-disconnect']) };
  assert.equal(playPrepBeep({ state: 'suspended' }), false);
  assert.equal(playPrepBeep({ state: 'running', currentTime: 2, createOscillator: () => oscillator, createGain: () => gain }), true);
  assert.equal(oscillator.type, 'square'); assert.equal(oscillator.frequency.value, 2400);
  assert.deepEqual(events[0], ['start', 2]);
  assert.equal(events[1][0], 'stop');
  assert(Math.abs(events[1][1] - 2.1) < 1e-9);
  oscillator.onended(); assert.equal(events.length, 4);
});
test('only the last countdown second plays the higher, slightly longer finish beep', () => {
  const tones = [];
  for (const secondsLeft of [3, 2, 1]) {
    const oscillator = { frequency: {}, connect() {}, start() {}, stop(time) { tones.push({ frequency: this.frequency.value, length: time }); }, disconnect() {} };
    const gain = { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} };
    playPrepBeep({ state: 'running', currentTime: 0, createOscillator: () => oscillator, createGain: () => gain }, secondsLeft);
  }
  assert.equal(tones[0].frequency, tones[1].frequency);
  assert(tones[2].frequency > tones[1].frequency);
  assert(tones[2].length > tones[1].length && tones[2].length < 0.3);
});
function audioClock() {
  const nodes = [];
  const context = {
    state: 'running', currentTime: 10,
    createOscillator() {
      const node = { frequency: {}, connect() {}, disconnect() {}, start(time) { this.startTime = time; }, stop(time) { this.stopTime = time; } };
      nodes.push(node); return node;
    },
    createGain: () => ({ gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }),
  };
  return { context, nodes };
}
test('all three rest beeps are scheduled before the UI enters the last three seconds', () => {
  const { context, nodes } = audioClock();
  scheduleRestBeeps(context, 6000, null);
  assert.deepEqual(nodes.map(node => node.startTime), [13, 14, 15]);
  assert.deepEqual(nodes.map(node => node.frequency.value), [2400, 2400, 3200]);
});
test('pause cancels queued beeps, and resume preserves an already heard first beep', () => {
  const { context, nodes } = audioClock(); const heard = [];
  const cancel = scheduleRestBeeps(context, 6000, null, second => heard.push(second));
  context.currentTime = 13.2; cancel();
  assert.deepEqual(heard, [3]);
  assert(nodes.every(node => node.stopTime === 13.2));
  nodes.forEach(node => node.onended()); assert.deepEqual(heard, [3]);
  const next = audioClock(); scheduleRestBeeps(next.context, 2800, 3);
  assert.deepEqual(next.nodes.map(node => node.frequency.value), [2400, 3200]);
  assert.deepEqual(next.nodes.map(node => node.startTime), [10.8, 11.8]);
});
test('extending rest cancels the previous schedule and plans a complete new three-beep sequence', () => {
  const first = audioClock(); const cancel = scheduleRestBeeps(first.context, 4000, null);
  cancel(); assert(first.nodes.every(node => node.stopTime === 10));
  const extended = audioClock(); scheduleRestBeeps(extended.context, 19000, null);
  assert.deepEqual(extended.nodes.map(node => node.startTime), [26, 27, 28]);
});
test('preparation keeps 3, 2, 1 ordinary, and schedules the high tone at zero', () => {
  const { context, nodes } = audioClock();
  [3, 2, 1].forEach(second => playPrepBeep(context, second, 0));
  const cancel = schedulePrepFinish(context, 4000);
  assert.deepEqual(nodes.map(node => node.frequency.value), [2400, 2400, 2400, 3200]);
  assert.equal(nodes[3].startTime, 14);
  context.currentTime = 14.02; cancel();
  assert(nodes[3].stopTime > 14.1, 'phase transition must not cut off the zero-second finish beep');
});
