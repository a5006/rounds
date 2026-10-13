import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const load = () => import('../src/core/pcm.mjs');

test('PCM reads bundled Chinese voice, bells and wood recordings with RIFF metadata chunks', async () => {
  const { decodeWav } = await load();
  for (const clip of ['round-30', 'number-3', 'bells', 'clapper']) {
    const decoded = decodeWav(fs.readFileSync(new URL(`../assets/audio/${clip}.wav`, import.meta.url)));
    assert(decoded.samples.length > 100);
    assert(decoded.sampleRate > 0);
    assert(decoded.samples.some(sample => Math.abs(sample) > .01));
  }
});

test('streamed workout audio has exact duration with silent gaps and cue at the native boundary', async () => {
  const { wavChunks, decodeWav } = await load();
  const clip = { samples: new Float32Array([.5, .5]), sampleRate: 10 };
  const plan = [{ durationMs: 1000, offsetMs: 0, cues: [] }, { durationMs: 1000, offsetMs: 1000, cues: [{ atMs: 0, clip: 'start' }] }];
  const bytes = Buffer.concat([...wavChunks(plan, { start: clip }, 10, 4)].map(b => Buffer.from(b)));
  const result = decodeWav(bytes);
  assert.equal(result.samples.length, 20);
  assert.equal(result.samples[9], 0);
  assert(result.samples[10] > .45);
  assert.equal(result.samples[12], 0);
  assert.equal(bytes.readUInt32LE(40), 20);
});

test('overlapping bell and voice are mixed without clipping or changing the phase duration', async () => {
  const { wavChunks, decodeWav } = await load();
  const clip = { samples: new Float32Array([.8, .8, .8]), sampleRate: 10 };
  const plan = [{ durationMs: 1000, offsetMs: 0, cues: [{ atMs: 0, clip: 'a' }, { atMs: 100, clip: 'b' }] }];
  const bytes = Buffer.concat([...wavChunks(plan, { a: clip, b: clip }, 10, 4)].map(b => Buffer.from(b)));
  const result = decodeWav(bytes);
  assert.equal(result.samples.length, 10);
  assert(result.samples[1] <= 1);
  assert(result.samples[1] > .9);
});
