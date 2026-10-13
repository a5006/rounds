import test from 'node:test';
import assert from 'node:assert/strict';
import { audioKey, createAudioCache } from '../src/core/audio-cache.mjs';
import { readFileSync, statSync } from 'node:fs';
import { PLAN_TEMPLATES } from '../src/core/plans.mjs';
import { createWorkoutPlan } from '../src/core/mobile-core.mjs';
const config = { prepSec: 10, workSec: 180, restSec: 60, rounds: 8, noRestLast: true };
const memoryStore = () => {
  const files = new Map();
  return { files, read: async key => files.get(key) ?? null, keys: async () => [...files.keys()], remove: async key => files.delete(key) };
};
test('identity ignores cosmetic/player options and distinguishes actual audio changes', () => {
  const key = audioKey(config, { voiceAudio: true, earlyWarning: true });
  assert.equal(audioKey({ ...config, name: 'other', volume: .4 }, { voiceAudio: true, earlyWarning: true, backgroundAudio: false }), key);
  assert.notEqual(audioKey({ ...config, workSec: 185 }, {}), key);
  assert.notEqual(audioKey(config, { voiceAudio: false }), key);
  assert.notEqual(audioKey(config, { earlyWarning: false }), key);
  assert.equal(audioKey({ ...config, rounds: 100 }, {}), audioKey({ ...config, rounds: 30 }, {}));
});
test('concurrent preparations deduplicate and persisted files survive a new manager', async () => {
  const store = memoryStore(), cache = createAudioCache(store);
  let count = 0;
  const build = async key => { count++; await Promise.resolve(); store.files.set(key, 'file'); return 'file'; };
  await cache.retain(['a']);
  const [first, second] = await Promise.all([cache.acquire('a', build), cache.acquire('a', build)]);
  assert.equal(count, 1); await first.release(); await second.release();
  const next = createAudioCache(store); await next.retain(['a']);
  const restored = await next.acquire('a', build); assert.equal(restored.value, 'file'); assert.equal(count, 1); await restored.release();
});
test('shared keys stay owned and deletion waits for active playback leases', async () => {
  const store = memoryStore(); store.files.set('shared', 'file');
  const cache = createAudioCache(store); await cache.retain(['shared', 'shared']);
  const playing = await cache.acquire('shared', async () => 'unused');
  await cache.retain(['shared']); assert.ok(store.files.has('shared'));
  await cache.retain([]); assert.ok(store.files.has('shared'));
  await playing.release(); assert.equal(store.files.has('shared'), false);
  await playing.release(); // Release is idempotent.
});
test('failed preparation can retry and stale queued files are removed after release', async () => {
  const store = memoryStore(), cache = createAudioCache(store);
  await assert.rejects(cache.acquire('failed', async () => { throw new Error('disk full'); }), /disk full/);
  const lease = await cache.acquire('failed', async key => { store.files.set(key, 'okay'); return 'okay'; });
  assert.equal(lease.value, 'okay'); await lease.release(); assert.equal(store.files.has('failed'), false);
});

test('deleting a plan during generation waits for its lease before removing the file', async () => {
  const store = memoryStore(), cache = createAudioCache(store);
  let finish;
  const gate = new Promise(resolve => { finish = resolve; });
  await cache.retain(['pending']);
  const work = cache.acquire('pending', async key => { await gate; store.files.set(key, 'file'); return 'file'; });
  await cache.retain([]);
  finish();
  const lease = await work;
  assert.ok(store.files.has('pending'));
  await lease.release(); assert.equal(store.files.has('pending'), false);
});

test('bundled presets cover every sound setting and match current timing and asset sizes', () => {
  const directory = new URL('../assets/audio-presets/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', directory), 'utf8'));
  assert.equal(manifest.length, PLAN_TEMPLATES.length * 4);
  assert.equal(new Set(manifest.map(item => item.key)).size, manifest.length);
  for (const preset of PLAN_TEMPLATES) for (const voiceAudio of [false, true]) for (const earlyWarning of [false, true]) {
    const settings = { voiceAudio, earlyWarning }, key = audioKey(preset.config, settings);
    const item = manifest.find(item => item.key === key);
    assert.ok(item, key);
    const duration = createWorkoutPlan(preset.config, settings).reduce((total, phase) => total + phase.durationMs, 0) / 1000;
    assert.ok(Math.abs(item.duration - duration) < .05, key);
    assert.equal(statSync(new URL(`${key}.m4a`, directory)).size, item.bytes);
  }
});
