import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assets = path.join(root, 'mobile/assets');
const audioDir = path.join(assets, 'audio');
await fs.mkdir(audioDir, { recursive: true });
const rate = 22050;
function wav(samples) {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write('RIFF'); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((sample, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), 44 + i * 2));
  return data;
}
for (const [name, frequency, duration] of [['beep', 2400, .09], ['start', 3200, .18]]) {
  const samples = Array.from({ length: Math.ceil(rate * (duration + .01)) }, (_, i) => {
    const t = i / rate, envelope = t < .002 ? t / .002 : t > duration - .025 ? Math.max(0, (duration - t) / .025) : 1;
    return .12 * envelope * (Math.sin(2 * Math.PI * frequency * t) >= 0 ? 1 : -1);
  });
  await fs.writeFile(path.join(audioDir, `${name}.wav`), wav(samples));
}
const bell = Array.from({ length: Math.ceil(rate * 1.34) }, (_, i) => {
  const time = i / rate;
  return [0, .24, .48].reduce((sum, start) => {
    const t = time - start;
    if (t < 0 || t > .85) return sum;
    return sum + [440, 660, 880, 1320].reduce((s, f, harmonic) => s + Math.sin(2 * Math.PI * f * t) * .12 / (harmonic + 1) * Math.min(1, t / .008) * Math.exp(-10 * t), 0);
  }, 0);
});
await fs.writeFile(path.join(audioDir, 'bells.wav'), wav(bell));
await fs.copyFile(path.join(root, 'assets/audio/wood-clapper.wav'), path.join(audioDir, 'clapper.wav'));
const source = await fs.readFile(path.join(root, 'public/icon.svg'));
await sharp(source).resize(1024, 1024).png().toFile(path.join(assets, 'icon.png'));
await sharp(source).resize(512, 512).png().toFile(path.join(assets, 'splash-icon.png'));
await sharp(source).resize(192, 192).png().toFile(path.join(assets, 'favicon.png'));
const emblem = await sharp(source).resize(600, 600).png().toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#111318' } }).composite([{ input: emblem, left: 212, top: 212 }]).png().toFile(path.join(assets, 'adaptive-icon.png'));
const clips = (await fs.readdir(audioDir)).filter(name => name.endsWith('.wav')).sort();
await fs.writeFile(path.join(root, 'mobile/src/audio-assets.ts'), `// Bundled assets: no network required during training.\nexport const audioAssets: Record<string, number> = {\n${clips.map(name => `  '${name.slice(0, -4)}': require('../assets/audio/${name}'),`).join('\n')}\n};\n`);
console.log(`Generated tones, icons and manifest (${clips.length} audio clips).`);
