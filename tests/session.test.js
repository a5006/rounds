import test from 'node:test';
import assert from 'node:assert/strict';
import { startSession, tickSession, pauseSession, resumeSession, advanceSession, extendSession, getReport } from '../src/session.js';
const config = { prepSec: 2, workSec: 3, restSec: 1, rounds: 2, noRestLast: true };
test('preparation → work → rest → final work → completion', () => {
  let s = startSession(config, 1000);
  s = tickSession(s, 3000); assert.equal(s.phase, 'work'); assert.equal(s.round, 1);
  s = tickSession(s, 6000); assert.equal(s.phase, 'rest'); assert.equal(s.completedRounds, 1);
  s = tickSession(s, 7000); assert.equal(s.phase, 'work'); assert.equal(s.round, 2);
  s = tickSession(s, 10000); assert.equal(s.phase, 'done'); assert.equal(s.completedRounds, 2); assert.equal(s.elapsedMs, 9000);
});
test('pause/resume preserves remaining time and excludes pause duration', () => {
  let s = startSession(config, 1000);
  s = pauseSession(s, 1500); assert.equal(s.remainingMs, 1500);
  s = tickSession(s, 100000); assert.equal(s.remainingMs, 1500);
  s = resumeSession(s, 100000); s = tickSession(s, 100500);
  assert.equal(s.remainingMs, 1000); assert.equal(s.elapsedMs, 1000);
});
test('background catch-up crosses all completed phases without timer drift', () => {
  const s = tickSession(startSession(config, 1000), 90000);
  assert.equal(s.phase, 'done'); assert.equal(s.completedRounds, 2); assert.equal(s.elapsedMs, 9000);
});
test('zero preparation and zero rest do not fall back to demo durations', () => {
  let s = startSession({ ...config, prepSec: 0, restSec: 0 }, 1000);
  assert.equal(s.phase, 'work'); s = tickSession(s, 4000); assert.equal(s.round, 2);
  s = tickSession(s, 7000); assert.equal(s.phase, 'done'); assert.equal(s.elapsedMs, 6000);
});
test('last rest runs when requested', () => {
  let s = startSession({ ...config, noRestLast: false }, 1000);
  s = tickSession(s, 10000); assert.equal(s.phase, 'rest'); assert.equal(s.round, 2);
  s = tickSession(s, 11000); assert.equal(s.phase, 'done');
});
test('extensions adjust remaining time and ring duration', () => {
  let s = startSession(config, 1000); s = extendSession(s, 15000, 1500);
  assert.equal(s.remainingMs, 16500); assert.equal(s.durationMs, 17000);
});
test('skip counts completed work but not preparation', () => {
  let s = startSession(config, 1000); s = advanceSession(s); assert.equal(s.completedRounds, 0);
  s = advanceSession(s); assert.equal(s.completedRounds, 1); assert.equal(s.phase, 'rest');
});
test('an interrupted round reports actual work without counting it completed', () => {
  const s = pauseSession(startSession({ ...config, prepSec: 0 }, 1000), 2500);
  const report = getReport(s);
  assert.equal(report.workMs, 1500);
  assert.equal(report.completedRounds, 0);
  assert.deepEqual(report.roundRecords, [1500]);
});
