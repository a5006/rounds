import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
const files = JSON.parse(source.match(/const FILES = (.*);/)[1]);
test('all offline shell resources exist in the production build', async () => {
  for (const file of files) await stat(new URL(`../dist${file === '/' ? '/index.html' : file}`, import.meta.url));
  assert(files.some(file => file.endsWith('.js')));
  assert(files.some(file => file.endsWith('.woff2')));
  assert(files.includes('/boxing.jpg'));
});
test('navigation falls back to the cached app shell when offline', async () => {
  const handlers = {};
  const shell = { body: 'cached-shell' };
  vm.runInNewContext(source, {
    self: { location: { origin: 'https://round.test' }, addEventListener: (type, handler) => { handlers[type] = handler; } },
    caches: { match: async path => path === '/index.html' ? shell : undefined },
    fetch: async () => { throw new Error('offline'); }, URL,
  });
  let result;
  handlers.fetch({ request: { method: 'GET', url: 'https://round.test/combat', mode: 'navigate' }, respondWith: promise => { result = promise; } });
  assert.equal(await result, shell);
});
test('static assets use the cached file without fetching', async () => {
  const handlers = {}, cached = { body: 'cached-font' };
  vm.runInNewContext(source, {
    self: { location: { origin: 'https://round.test' }, addEventListener: (type, handler) => { handlers[type] = handler; } },
    caches: { match: async () => cached }, fetch: async () => { throw new Error('must not fetch'); }, URL,
  });
  let result;
  handlers.fetch({ request: { method: 'GET', url: 'https://round.test/assets/font.woff2', mode: 'cors' }, respondWith: promise => { result = promise; } });
  assert.equal(await result, cached);
});
