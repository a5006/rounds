import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';

function offlineShell() {
  return {
    name: 'round-pro-offline-shell',
    generateBundle(_options, bundle) {
      const files = ['/', '/index.html', '/icon.svg', '/icon-192.png', '/icon-512.png', '/icon-maskable.png', '/apple-touch-icon.png', '/boxing.jpg', '/wood-clapper.wav', '/manifest.webmanifest', ...Object.keys(bundle).map(file => `/${file}`)];
      const version = createHash('sha256').update(JSON.stringify(Object.keys(bundle))).digest('hex').slice(0, 12);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const CACHE = 'round-pro-${version}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('round-pro-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => response.ok ? response : caches.match('/index.html')).catch(() => caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});` });
    },
  };
}
export default defineConfig({ plugins: [react(), offlineShell()], server: { host: '0.0.0.0' } });
