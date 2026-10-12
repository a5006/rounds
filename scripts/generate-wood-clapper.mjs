// Actual recording by ashboy34, "boardclapdry.wav", CC BY 3.0.
// https://freesound.org/people/ashboy34/sounds/544885/
import { readFile, writeFile } from 'node:fs/promises';
const source = await readFile(new URL('../assets/audio/boardclapdry-source.wav', import.meta.url));
let dataOffset = 12, pcmOffset, pcmSize, rate;
while (dataOffset + 8 <= source.length) {
  const chunk = source.toString('ascii', dataOffset, dataOffset + 4), size = source.readUInt32LE(dataOffset + 4);
  if (chunk === 'fmt ') {
    if (source.readUInt16LE(dataOffset + 8) !== 1 || source.readUInt16LE(dataOffset + 10) !== 1 || source.readUInt16LE(dataOffset + 22) !== 16) throw new Error('Expected mono 16-bit PCM source');
    rate = source.readUInt32LE(dataOffset + 12);
  }
  if (chunk === 'data') { pcmOffset = dataOffset + 8; pcmSize = size; }
  dataOffset += 8 + size + size % 2;
}
if (!pcmOffset || !rate) throw new Error('Invalid source WAV');
const samples = new Int16Array(Math.ceil(rate * 0.76));
const hitLength = Math.min(Math.floor(rate * 0.17), pcmSize / 2);
let peak = 1;
for (let i = 0; i < hitLength; i++) peak = Math.max(peak, Math.abs(source.readInt16LE(pcmOffset + i * 2)));
const gain = 30000 / peak;
for (const offset of [0, 0.24, 0.48]) {
  for (let i = 0; i < hitLength; i++) {
    const fade = Math.min(1, (hitLength - 1 - i) / (rate * 0.008));
    samples[Math.floor(rate * offset) + i] = Math.round(source.readInt16LE(pcmOffset + i * 2) * gain * fade);
  }
}
const wav = Buffer.alloc(44 + samples.length * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(samples.length * 2, 40);
samples.forEach((value, i) => wav.writeInt16LE(value, 44 + i * 2));
await Promise.all(['../assets/audio/wood-clapper.wav', '../public/wood-clapper.wav'].map(path => writeFile(new URL(path, import.meta.url), wav)));
console.log('Three-clap warning built from the real board-on-board recording.');
