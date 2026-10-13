import test from 'node:test';
import assert from 'node:assert/strict';
import * as p from '../src/core/plans.mjs';

const config = { workSec: 20, restSec: 15, prepSec: 0, rounds: 3, noRestLast: true };
const draft = { name: ' 我的拳击 ', category: '拳击实战', color: '#ff525d', config, vibration: false, volume: .4 };
test('legacy single config migrates once and home visibility restores explicit template flags', () => {
  const first = p.restorePlans(null, config);
  assert.equal(first.filter(x => !x.template).length, 1);
  assert.deepEqual(first.find(x => !x.template).config, config);
  assert.equal(p.homePlans(first).length, 3);
  const hidden = p.togglePlanHome(first, first[0].id);
  const restored = p.restorePlans(hidden, config);
  assert.equal(restored[0].showOnHome, false);
  assert.equal(restored.length, first.length);
  assert.equal(p.restorePlans(first.filter(x => x.template), config).filter(x => !x.template).length, 0);
});
test('new and edited plans normalize metadata and preserve independent alert profiles', () => {
  const first = p.restorePlans([], config);
  const added = p.saveCustomPlan(first, draft, 'custom-one');
  const saved = added.find(x => x.id === 'custom-one');
  assert.equal(saved.name, '我的拳击');
  assert.equal(saved.volume, .4);
  assert.equal(saved.vibration, false);
  const edited = p.saveCustomPlan(added, { ...saved, name: '修改方案', volume: 9 }, saved.id);
  assert.equal(edited.length, added.length);
  assert.equal(edited.find(x => x.id === saved.id).volume, 1);
  assert.equal(saved.name, '我的拳击');
  assert.throws(() => p.saveCustomPlan(first, { ...draft, name: '   ' }, 'blank'), /名称/);
});
test('templates are immutable and copied plans do not share config objects', () => {
  const first = p.restorePlans([], config), template = first[0];
  assert.throws(() => p.saveCustomPlan(first, draft, template.id), /预设/);
  assert.throws(() => p.removeCustomPlan(first, template.id), /预设/);
  const next = p.copyPlan(first, template.id, 'copied');
  const copy = next.find(x => x.id === 'copied');
  assert.equal(copy.template, false);
  assert.equal(copy.showOnHome, false);
  assert.match(copy.name, /副本/);
  copy.config.workSec = 5;
  assert.notEqual(copy.config.workSec, template.config.workSec);
});
test('legacy custom favorites become homepage entries and editing keeps homepage visibility', () => {
  const restored = p.restorePlans([{ ...draft, id: 'old-custom', favorite: true }], config);
  assert.equal(p.homePlans(restored).some(x => x.id === 'old-custom'), true);
  const hidden = p.togglePlanHome(restored, 'old-custom');
  const edited = p.saveCustomPlan(hidden, { ...draft, showOnHome: true }, 'old-custom');
  assert.equal(edited.find(x => x.id === 'old-custom').showOnHome, false);
  assert.equal(p.restorePlans(edited, config).find(x => x.id === 'old-custom').showOnHome, false);
  assert.equal(p.homePlans(edited).some(x => x.id === 'old-custom'), false);
});
test('deletion only removes the selected custom plan and a session snapshot stays independent', () => {
  const first = p.saveCustomPlan(p.restorePlans([], config), draft, 'custom-one');
  const selected = first.find(x => x.id === 'custom-one');
  const snapshot = p.snapshotPlan(selected);
  selected.config.workSec = 180;
  assert.equal(snapshot.config.workSec, 20);
  const removed = p.removeCustomPlan(first, selected.id);
  assert.equal(removed.some(x => x.id === selected.id), false);
  assert.equal(snapshot.name, '我的拳击');
  assert.equal(p.planDurationMs(snapshot.config), 90000);
});
test('all start requests preserve a snapshot and require confirmation for unfinished phases even paused', () => {
  const plan = p.normalizePlan(draft, 'starting');
  for (const phase of ['prep', 'work', 'rest']) {
    assert.equal(p.makeStartRequest({ phase, config, running: false }, config, plan).requiresConfirmation, true);
  }
  for (const phase of ['idle', 'done']) assert.equal(p.makeStartRequest({ phase, config }, config, plan).requiresConfirmation, false);
  const request = p.makeStartRequest({ phase: 'idle', config: null }, config, plan);
  plan.volume = 1; plan.config.workSec = 180; config.workSec = 15;
  assert.equal(request.plan.volume, .4);
  assert.equal(request.config.workSec, 20);
  config.workSec = 20;
});
