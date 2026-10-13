import { Asset } from 'expo-asset';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { audioAssets } from './audio-assets';
import { decodeWav, wavChunks } from './core/pcm.mjs';
import type { AudioPhase, Config, Settings } from './types';
import { createWorkoutPlan } from './core/mobile-core.mjs';
import { audioKey, createAudioCache } from './core/audio-cache.mjs';
import { audioStore } from './audio-storage';
import { presetAudioAssets } from './preset-audio-assets';

type Decoded = { sampleRate: number; samples: Float32Array };
const decodedClips: Record<string, Decoded> = {};
const clipJobs: Record<string, Promise<Decoded>> = {};
const cache = createAudioCache(audioStore);
const log = (stage: string, started: number, extra: Record<string, unknown> = {}) => { if (__DEV__) console.info('[training-audio]', JSON.stringify({ stage, ms: Math.round(performance.now() - started), ...extra })); };

async function loadClips(plan: AudioPhase[], cancelled: () => boolean) {
  const names = [...new Set(plan.flatMap(phase => phase.cues.map(cue => cue.clip)))];
  for (const name of names) {
    if (cancelled()) throw new Error('cancelled');
    if (decodedClips[name]) continue;
    clipJobs[name] ??= (async () => {
      if (!audioAssets[name]) throw new Error(`缺少训练声音资源：${name}`);
      const asset = Asset.fromModule(audioAssets[name]);
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const bytes = Platform.OS === 'web' ? new Uint8Array(await (await fetch(uri)).arrayBuffer()) : new Uint8Array(await new File(uri).arrayBuffer());
      return decodeWav(bytes);
    })();
    try { decodedClips[name] = await clipJobs[name]; } finally { delete clipJobs[name]; }
  }
  return decodedClips;
}

export function retainWorkoutAudio(configs: Config[], settings: Settings) {
  return cache.retain(configs.map(config => audioKey(config, settings)).filter(key => !presetAudioAssets[key]));
}

export async function prepareWorkoutAudio(config: Config, settings: Settings) {
  const key = audioKey(config, settings), started = performance.now();
  if (presetAudioAssets[key]) {
    log('bundled-preset', started, { key });
    return { key, source: presetAudioAssets[key] as string | number, release: async () => {} };
  }
  const lease = await cache.acquire(key, async (fileKey: string) => {
    const plan = createWorkoutPlan(config, settings) as AudioPhase[];
    const loadStart = performance.now(), clips = await loadClips(plan, () => false);
    log('load-clips', loadStart, { key });
    const renderStart = performance.now();
    const value = await audioStore.write(fileKey, wavChunks(plan, clips));
    log('render-and-store', renderStart, { key });
    return value;
  });
  const blob = Platform.OS === 'web' && lease.value instanceof Blob;
  const source = blob ? URL.createObjectURL(lease.value) : lease.value as string;
  log('cache-acquire', started, { key });
  let released = false;
  return { key, source, release: async () => { if (released) return; released = true; if (blob) URL.revokeObjectURL(source); await lease.release(); } };
}

let temporaryId = 0;
async function temporarySource(plan: AudioPhase[], cancelled: () => boolean) {
  const started = performance.now();
  const clips = await loadClips(plan, cancelled);
  if (cancelled()) throw new Error('cancelled');
  let source: string, cleanup = () => {};
  if (Platform.OS === 'web') {
    const chunks: ArrayBuffer[] = []; let block = 0;
    for (const bytes of wavChunks(plan, clips)) {
      if (cancelled()) throw new Error('cancelled');
      chunks.push(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
      if (++block % 24 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    source = URL.createObjectURL(new Blob(chunks, { type: 'audio/wav' }));
    cleanup = () => URL.revokeObjectURL(source);
  } else {
    const file = new File(Paths.cache, `round-pro-timeline-${Date.now()}-${++temporaryId}.wav`);
    file.create({ overwrite: true });
    const handle = file.open();
    try {
      let block = 0;
      for (const chunk of wavChunks(plan, clips)) {
        if (cancelled()) throw new Error('cancelled');
        handle.writeBytes(chunk);
        if (++block % 24 === 0) await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (error) {
      handle.close(); file.delete(); throw error;
    }
    handle.close(); source = file.uri;
    cleanup = () => { if (file.exists) file.delete(); };
  }
  log('temporary-render', started);
  return { source, release: async () => cleanup() };
}

export async function prepareTimeline(plan: AudioPhase[], backgroundAudio: boolean, cancelled: () => boolean, cached?: { config: Config; settings: Settings }) {
  let release = async () => {}, player: AudioPlayer | undefined;
  try {
    let resource;
    if (cached) {
      try { resource = await prepareWorkoutAudio(cached.config, cached.settings); }
      catch (error) { if (__DEV__) console.warn('[training-audio] cache fallback', error); }
    }
    resource ??= await temporarySource(plan, cancelled);
    release = resource.release;
    if (cancelled()) throw new Error('cancelled');
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: backgroundAudio, interruptionMode: 'doNotMix' });
    if (cancelled()) throw new Error('cancelled');
    const started = performance.now();
    player = createAudioPlayer(typeof resource.source === 'number' ? resource.source : { uri: resource.source }, { updateInterval: 100, keepAudioSessionActive: true });
    const deadline = Date.now() + 10000;
    while (!player.isLoaded) {
      if (cancelled()) throw new Error('cancelled');
      if (Date.now() > deadline) throw new Error('音频加载超时，请重试');
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    log('player-loaded', started);
    if (backgroundAudio && Platform.OS !== 'web') player.setActiveForLockScreen(true, { title: 'ROUND PRO · 训练计时', artist: '准备 / 运动 / 休息' }, { showSeekForward: false, showSeekBackward: false, isLiveStream: true });
    const loaded = player;
    let disposed = false;
    return { player: loaded, dispose: () => { if (disposed) return; disposed = true; loaded.pause(); if (Platform.OS !== 'web') loaded.clearLockScreenControls(); loaded.remove(); void release().catch(error => { if (__DEV__) console.warn('[training-audio] cleanup', error); }); } };
  } catch (error) { player?.remove(); await release().catch(() => {}); throw error; }
}

let previewPlayer: AudioPlayer | undefined;
let previewGeneration = 0;
export function stopPreviewAudio() { previewGeneration++; previewPlayer?.remove(); previewPlayer = undefined; }
export async function previewAudio(name: 'bells' | 'clapper', backgroundAudio = true, volume = 1, configureMode = true) {
  stopPreviewAudio();
  const token = previewGeneration;
  if (configureMode) await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: backgroundAudio, interruptionMode: 'doNotMix' });
  if (token !== previewGeneration) return;
  previewPlayer = createAudioPlayer(audioAssets[name]);
  previewPlayer.volume = Math.max(0, Math.min(1, volume));
  previewPlayer.play();
}
