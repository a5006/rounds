import test from 'node:test';
import assert from 'node:assert/strict';

async function core() { return import('../src/core/mobile-core.mjs'); }

test('mobile configuration preserves valid zero stages and clamps picker ranges', async () => {
  const { normalizeConfig } = await core();
  assert.deepEqual(normalizeConfig({ workSec: 0, restSec: 0, prepSec: 0, rounds: 99, noRestLast: true }), { workSec: 5, restSec: 0, prepSec: 0, rounds: 30, noRestLast: true });
  assert.equal(normalizeConfig({ workSec: 659 }).workSec, 655);
  assert.equal(normalizeConfig({ workSec: 16 }).workSec, 15);
});

test('native cue plan uses ordinary beeps at 3/2/1 and a high start cue at the work boundary', async () => {
  const { createWorkoutPlan } = await core();
  const plan = createWorkoutPlan({ workSec: 15, restSec: 10, prepSec: 5, rounds: 2, noRestLast: true });
  assert.deepEqual(plan.map(p => [p.phase, p.round, p.durationMs]), [['prep', 1, 5000], ['work', 1, 15000], ['rest', 1, 10000], ['work', 2, 15000], ['done', 2, 2500]]);
  assert.deepEqual(plan[0].cues.filter(c => c.kind === 'beep').map(c => c.atMs), [2000, 3000, 4000]);
  assert.deepEqual(plan[2].cues.filter(c => c.kind === 'beep').map(c => c.atMs), [7000, 8000, 9000]);
  assert(plan[1].cues.some(c => c.kind === 'start' && c.atMs === 0));
  assert(plan[3].cues.some(c => c.kind === 'start' && c.atMs === 0));
  assert(!plan[1].cues.some(c => c.kind === 'bells'));
  assert(plan[2].cues.some(c => c.kind === 'bells' && c.atMs === 0));
  assert(plan[4].cues.some(c => c.kind === 'bells' && c.atMs === 0));
});

test('work warning and speech obey settings; disabled voice never removes beeps or bells', async () => {
  const { createWorkoutPlan } = await core();
  const plan = createWorkoutPlan({ workSec: 15, restSec: 10, prepSec: 0, rounds: 1, noRestLast: true }, { earlyWarning: false, voiceAudio: false });
  assert(!plan.some(p => p.cues.some(c => c.kind === 'voice' || c.kind === 'clapper')));
  assert(plan[0].cues.some(c => c.kind === 'start'));
  assert(plan[1].cues.some(c => c.kind === 'bells'));
});

test('zero rest advances directly to work; optional final rest runs before completion', async () => {
  const { createWorkoutPlan } = await core();
  assert.deepEqual(createWorkoutPlan({ workSec: 5, restSec: 0, prepSec: 0, rounds: 2 }).map(p => p.phase), ['work', 'work', 'done']);
  assert.deepEqual(createWorkoutPlan({ workSec: 5, restSec: 5, prepSec: 0, rounds: 1, noRestLast: false }).map(p => p.phase), ['work', 'rest', 'done']);
});

test('resume builds only the remaining audio timeline and does not replay elapsed cues', async () => {
  const { planFromSession } = await core();
  const { startSession, tickSession } = await import('../../src/session.js');
  const config = { workSec: 15, restSec: 10, prepSec: 5, rounds: 2, noRestLast: true };
  const session = tickSession(startSession(config, 1000), 23000);
  assert.equal(session.phase, 'rest');
  const plan = planFromSession(session);
  assert.equal(plan[0].durationMs, 8000);
  assert(!plan[0].cues.some(c => c.kind === 'bells'));
  assert.deepEqual(plan[0].cues.filter(c => c.kind === 'beep').map(c => c.atMs), [5000, 6000, 7000]);
  assert.equal(plan[1].phase, 'work');
});

test('extension and round reset replan from current remaining time without replaying the start', async () => {
  const { planFromSession } = await core();
  const { startSession, extendSession } = await import('../../src/session.js');
  const session = extendSession(startSession({ workSec: 15, restSec: 10, prepSec: 0, rounds: 2, noRestLast: true }, 0), 15000, 5000);
  const plan = planFromSession(session);
  assert.equal(plan[0].durationMs, 25000);
  assert.equal(plan[0].cues.find(c => c.kind === 'clapper').atMs, 15000);
  assert(!plan[0].cues.some(c => c.kind === 'start'));
});

test('stopwatch resume includes elapsed wall time and never advances while paused', async () => {
  const { stopwatchElapsed } = await core();
  assert.equal(stopwatchElapsed({ elapsedMs: 2500, running: true, startedAt: 1000 }, 7000), 8500);
  assert.equal(stopwatchElapsed({ elapsedMs: 2500, running: false, startedAt: 1000 }, 7000), 2500);
});
