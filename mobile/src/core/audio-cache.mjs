import { normalizeConfig } from './mobile-core.mjs';
export const AUDIO_CACHE_REVISION = 'sound2-pcm8-11025';
export function audioKey(config, settings = {}) {
  const c = normalizeConfig(config);
  return `${AUDIO_CACHE_REVISION}-p${c.prepSec}-w${c.workSec}-s${c.restSec}-r${c.rounds}-l${Number(c.noRestLast)}-v${Number(settings.voiceAudio !== false)}-e${Number(settings.earlyWarning !== false)}`;
}
export function createAudioCache(store) {
  let desired = new Set();
  const references = new Map(), pending = new Map();
  let buildQueue = Promise.resolve();
  async function prune() {
    for (const key of await store.keys()) if (!desired.has(key) && !references.get(key) && !pending.has(key)) await store.remove(key);
  }
  function decrement(key) { const count = (references.get(key) || 1) - 1; if (count) references.set(key, count); else references.delete(key); }
  return {
    async retain(keys) { desired = new Set(keys); await prune(); },
    async acquire(key, build) {
      references.set(key, (references.get(key) || 0) + 1);
      let work = pending.get(key);
      if (!work) {
        work = Promise.resolve().then(async () => {
          const cached = await store.read(key);
          if (cached != null) return cached;
          const job = buildQueue.then(() => build(key));
          buildQueue = job.catch(() => {});
          return job;
        }).finally(() => pending.delete(key));
        pending.set(key, work);
      }
      try {
        const value = await work;
        let released = false;
        return { value, release: async () => { if (released) return; released = true; decrement(key); await prune(); } };
      } catch (error) { decrement(key); await prune().catch(() => {}); throw error; }
    },
  };
}
