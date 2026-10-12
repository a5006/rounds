import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shouldScheduleRoundWarning } from '../src/wood-clapper.js';
const ready = { enabled: true, muted: false, audioReady: true };
const session = { phase: 'work', round: 1, running: true, remainingMs: 10000, warningPlayedRound: 0 };
test('wooden warning can be scheduled ahead, only in a running work round', () => {
  assert.equal(shouldScheduleRoundWarning(session, ready), true);
  assert.equal(shouldScheduleRoundWarning({ ...session, remainingMs: 10001 }, ready), true);
  for (const phase of ['prep', 'rest', 'done', 'idle']) assert.equal(shouldScheduleRoundWarning({ ...session, phase }, ready), false);
  assert.equal(shouldScheduleRoundWarning({ ...session, running: false }, ready), false);
  assert.equal(shouldScheduleRoundWarning({ ...session, remainingMs: 0 }, ready), false);
});
test('switch off, global mute, and locked mobile audio all suppress the warning', () => {
  assert.equal(shouldScheduleRoundWarning(session, { ...ready, enabled: false }), false);
  assert.equal(shouldScheduleRoundWarning(session, { ...ready, muted: true }), false);
  assert.equal(shouldScheduleRoundWarning(session, { ...ready, audioReady: false }), false);
});
test('a round warns once across pause, resume, reload and extensions; the next round warns again', () => {
  const played = { ...session, warningPlayedRound: 1 };
  for (const remainingMs of [10000, 9000, 5000]) assert.equal(shouldScheduleRoundWarning({ ...played, remainingMs }, ready), false);
  assert.equal(shouldScheduleRoundWarning(JSON.parse(JSON.stringify(played)), ready), false);
  assert.equal(shouldScheduleRoundWarning({ ...played, round: 2 }, ready), true);
});
test('warning contains three real recorded board impacts with silent gaps', () => {
  const wav = readFileSync(new URL('../assets/audio/wood-clapper.wav', import.meta.url));
  const preview = readFileSync(new URL('../public/wood-clapper.wav', import.meta.url));
  assert.deepEqual(wav, preview);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  const rate = wav.readUInt32LE(24);
  const sample = i => wav.readInt16LE(44 + i * 2);
  for (const offset of [0, 0.24, 0.48]) {
    let peak = 0;
    for (let i = Math.floor(offset * rate); i < Math.floor((offset + 0.05) * rate); i++) peak = Math.max(peak, Math.abs(sample(i)));
    assert(peak > 15000);
  }
  for (let i = Math.ceil(0.66 * rate); i < (wav.length - 44) / 2; i++) assert.equal(sample(i), 0);
  const source = readFileSync(new URL('../assets/audio/boardclapdry-source.wav', import.meta.url));
  let position = 12;
  while (source.toString('ascii', position, position + 4) !== 'data') position += 8 + source.readUInt32LE(position + 4) + source.readUInt32LE(position + 4) % 2;
  let cross = 0, originalEnergy = 0, resultEnergy = 0;
  for (let i = 0; i < Math.floor(rate * 0.04); i++) {
    const a = source.readInt16LE(position + 8 + i * 2), b = sample(i);
    cross += a * b; originalEnergy += a * a; resultEnergy += b * b;
  }
  assert(cross / Math.sqrt(originalEnergy * resultEnergy) > 0.9999, 'impact must retain the recorded waveform');
});
