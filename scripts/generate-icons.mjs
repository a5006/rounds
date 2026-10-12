import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../public/icon.svg', import.meta.url));
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await sharp(source).resize(size, size).png().toFile(new URL(`../public/${name}`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
}
const emblem = await sharp(source).resize(360, 360).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#111318' } }).composite([{ input: emblem, left: 76, top: 76 }]).png().toFile(new URL('../public/icon-maskable.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
console.log('Generated iOS touch icon and Android PWA icons.');
