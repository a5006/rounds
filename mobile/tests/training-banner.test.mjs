import test from 'node:test';
import assert from 'node:assert/strict';
import * as banner from '../src/core/training-banner.mjs';

const session = { phase: 'work', running: true, round: 2, remainingMs: 24100, config: { rounds: 8 } };
test('active phases remain visible on other pages with live rounded remaining time', () => {
  for (const [phase, label] of [['prep', '准备中'], ['work', '训练中'], ['rest', '休息中']]) {
    assert.deepEqual(banner.trainingBanner('home', { ...session, phase }), { phase, label, round: '第 2/8 回合', time: '00:25' });
  }
  assert.equal(banner.trainingBanner('settings', { ...session, remainingMs: 1000 }).time, '00:01');
});
test('paused sessions are visible but idle completed and training screens hide the banner', () => {
  assert.equal(banner.trainingBanner('report', { ...session, running: false }).label, '已暂停 · 训练');
  for (const phase of ['idle', 'done']) assert.equal(banner.trainingBanner('home', { ...session, phase }), null);
  assert.equal(banner.trainingBanner('training', session), null);
  assert.equal(banner.trainingBanner('home', { ...session, config: null }), null);
});
test('back leaves training without pausing and preserves credits return destination', () => {
  assert.equal(banner.backTarget('training'), 'home');
  assert.equal(banner.backTarget('credits'), 'settings');
  assert.equal(banner.backTarget('settings'), 'home');
  assert.equal(banner.backTarget('editor'), 'plans');
  assert.equal(banner.backTarget('home'), null);
});
