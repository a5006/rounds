import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { emptySession, startSession, tickSession, resumeSession, advanceSession, extendSession, getReport } from '../../src/session';
import { DEFAULT_CONFIG, DEFAULT_SETTINGS, normalizeConfig, planFromSession, stopwatchElapsed } from './core/mobile-core.mjs';
import { prepareTimeline, prepareWorkoutAudio, retainWorkoutAudio } from './audio';
import { audioKey } from './core/audio-cache.mjs';
import { restorePlans, saveCustomPlan, copyPlan, removeCustomPlan, togglePlanHome, snapshotPlan, makeStartRequest } from './core/plans.mjs';
import type { Config, Session, Settings, Stopwatch, Report, Screen, TrainingPlan } from './types';

const STORAGE_KEY = 'round-pro-native:v1';
const emptyStopwatch: Stopwatch = { elapsedMs: 0, running: false, startedAt: 0, lastLapMs: 0, laps: [] };
type Engine = Awaited<ReturnType<typeof prepareTimeline>> & { base: Session };
type StartRequest = { config: Config; plan: TrainingPlan | null; requiresConfirmation: boolean };
type ContextValue = {
  ready: boolean; busy: boolean; audioStatus: Record<string, 'preparing' | 'ready' | 'error'>; error: string | null; clearError: () => void;
  config: Config; settings: Settings; muted: boolean; session: Session; report: Report | null;
  stopwatch: Stopwatch; stopwatchMs: number; screen: Screen; navigate: (screen: Screen) => void;
  start: (config?: Config) => Promise<void>; pause: () => void; resume: () => Promise<void>;
  skip: () => Promise<void>; extend: (ms: number) => Promise<void>; resetPhase: () => Promise<void>;
  finish: () => void; saveConfig: (config: Config) => void; setSettings: (settings: Settings) => void;
  toggleMute: () => void; toggleStopwatch: () => void; lap: () => void; resetStopwatch: () => void;
  plans: TrainingPlan[]; selectedPlan: TrainingPlan | null; sessionPlan: TrainingPlan | null;
  savePlan: (draft: TrainingPlan) => Promise<TrainingPlan>; copySavedPlan: (id: string) => TrainingPlan;
  deletePlan: (id: string) => void; toggleHomeVisibility: (id: string) => void; selectPlan: (id: string) => void;
  editPlan: (id?: string) => void; startPlan: (plan: TrainingPlan) => Promise<void>;
  pendingStart: StartRequest | null; confirmStart: () => Promise<void>; cancelStart: () => void;
};
const Context = createContext<ContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter(), pathname = usePathname();
  const screen = (pathname === '/' ? 'home' : pathname.split('/')[1]) as Screen;
  const navigate = useCallback((next: Screen) => router.replace(next === 'home' ? '/' : `/${next}`), [router]);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG), [settings, setSettingsState] = useState<Settings>({ ...DEFAULT_SETTINGS, backgroundAudio: true });
  const [muted, setMuted] = useState(false);
  const [plans, setPlans] = useState<TrainingPlan[]>(restorePlans(null, DEFAULT_CONFIG) as TrainingPlan[]);
  const [selectedPlanId, setSelectedPlanId] = useState('custom-legacy'), [sessionPlan, setSessionPlan] = useState<TrainingPlan | null>(null);
  const [pendingStart, setPendingStart] = useState<StartRequest | null>(null);
  const [audioStatus, setAudioStatus] = useState<Record<string, 'preparing' | 'ready' | 'error'>>({});
  const saveVersions = useRef<Record<string, number>>({});
  const plansRef = useRef(plans), selectedPlanRef = useRef(selectedPlanId), sessionPlanRef = useRef(sessionPlan);
  const selectedPlan = plans.find(plan => plan.id === selectedPlanId) || null;
  const [session, setSession] = useState<Session>(emptySession() as Session), [report, setReport] = useState<Report | null>(null);
  const [stopwatch, setStopwatch] = useState<Stopwatch>(emptyStopwatch), [stopwatchMs, setStopwatchMs] = useState(0);
  const engine = useRef<Engine | null>(null), generation = useRef(0), sessionRef = useRef(session), stopwatchRef = useRef(stopwatch);
  const stateRef = useRef({ config, settings, muted, report });
  stateRef.current = { config, settings, muted, report };
  const commitSession = useCallback((next: Session) => { sessionRef.current = next; setSession(next); }, []);
  const commitStopwatch = (next: Stopwatch) => { stopwatchRef.current = next; setStopwatch(next); setStopwatchMs(stopwatchElapsed(next, Date.now())); };
  const snapshot = () => JSON.stringify({ ...stateRef.current, session: sessionRef.current, stopwatch: stopwatchRef.current, plans: plansRef.current, selectedPlanId: selectedPlanRef.current, sessionPlan: sessionPlanRef.current });
  const persist = () => AsyncStorage.setItem(STORAGE_KEY, snapshot()).catch(() => setError('本地保存失败，请检查设备存储空间。'));

  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!live || !raw) return;
      const saved = JSON.parse(raw);
      setConfig(normalizeConfig(saved.config));
      const restored = restorePlans(saved.plans, saved.config || DEFAULT_CONFIG) as TrainingPlan[];
      plansRef.current = restored; setPlans(restored);
      const selectedId = restored.some(x => x.id === saved.selectedPlanId) ? saved.selectedPlanId : restored.find(x => !x.template)?.id || restored[0].id;
      selectedPlanRef.current = selectedId; setSelectedPlanId(selectedId);
      if (saved.sessionPlan?.name) { const restoredProfile = snapshotPlan(saved.sessionPlan) as TrainingPlan; sessionPlanRef.current = restoredProfile; setSessionPlan(restoredProfile); }
      setSettingsState({ ...DEFAULT_SETTINGS, backgroundAudio: true, ...saved.settings });
      setMuted(Boolean(saved.muted)); setReport(saved.report || null);
      // A terminated app cannot keep playing. Restore training paused at its saved position.
      if (saved.session?.config) commitSession({ ...saved.session, config: normalizeConfig(saved.session.config), running: false });
      if (saved.stopwatch) commitStopwatch({ ...emptyStopwatch, ...saved.stopwatch });
    }).catch(() => setError('未能恢复本地记录，已使用默认设置。')).finally(() => { if (live) setReady(true); });
    return () => { live = false; generation.current++; engine.current?.dispose(); engine.current = null; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void persist();
    const timer = setInterval(() => void persist(), 1000);
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active' && !stateRef.current.settings.backgroundAudio) pause();
      if (state === 'active') { sync(); setStopwatchMs(stopwatchElapsed(stopwatchRef.current, Date.now())); }
      void persist();
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [ready]);

  useEffect(() => { if (ready) void persist(); }, [config, settings, muted, report, plans, selectedPlanId, sessionPlan]);
  useEffect(() => {
    if (!ready) return;
    let live = true;
    const sounds = { ...DEFAULT_SETTINGS, backgroundAudio: true, voiceAudio: settings.voiceAudio, earlyWarning: settings.earlyWarning } as Settings;
    void retainWorkoutAudio(plans.map(plan => plan.config), sounds).then(async () => {
      if (!live) return;
      setAudioStatus(Object.fromEntries(plans.map(plan => [plan.id, 'preparing'])));
      await Promise.all(plans.map(async plan => {
        try {
          const resource = await prepareWorkoutAudio(plan.config, sounds);
          await resource.release();
          if (live) setAudioStatus(previous => ({ ...previous, [plan.id]: 'ready' }));
        } catch {
          if (live) setAudioStatus(previous => ({ ...previous, [plan.id]: 'error' }));
        }
      }));
    }).catch(() => { if (live) setError('音频缓存维护失败，请检查设备存储空间。'); });
    return () => { live = false; };
  }, [ready, plans, settings.voiceAudio, settings.earlyWarning]);
  useEffect(() => {
    const keep = settings.keepAwake && (session.running || stopwatch.running);
    if (!keep) return;
    let disposed = false;
    void activateKeepAwakeAsync('round-pro-training').then(() => {
      if (disposed) void deactivateKeepAwake('round-pro-training').catch(() => {});
    }).catch(() => {});
    return () => { disposed = true; void deactivateKeepAwake('round-pro-training').catch(() => {}); };
  }, [settings.keepAwake, session.running, stopwatch.running]);

  function sync() {
    const active = engine.current;
    if (!active || (!sessionRef.current.running && !active.player.playing)) return;
    const previous = sessionRef.current;
    let next = tickSession(active.base, active.base.lastTick + active.player.currentTime * 1000) as Session;
    if (next.phase === 'work' && next.remainingMs <= 10000 && next.config!.workSec > 10) next.warningPlayedRound = next.round;
    if (!active.player.playing && active.player.currentTime > .25 && next.phase !== 'done') next = { ...next, running: false };
    commitSession(next);
    if (next.phase === 'done' && previous.phase !== 'done') setReport(getReport(next) as Report);
    if ((sessionPlanRef.current?.vibration ?? stateRef.current.settings.vibration) && (next.phase !== previous.phase || next.round !== previous.round) && AppState.currentState === 'active') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }

  useEffect(() => {
    const timer = setInterval(() => { sync(); if (stopwatchRef.current.running) setStopwatchMs(stopwatchElapsed(stopwatchRef.current, Date.now())); }, 50);
    return () => clearInterval(timer);
  }, []);

  async function play(next: Session, includeStart = false, cachedConfig?: Config) {
    const token = ++generation.current;
    engine.current?.dispose(); engine.current = null;
    setBusy(true); setError(null);
    commitSession({ ...next, running: false });
    try {
      const playback = await prepareTimeline(planFromSession(next, stateRef.current.settings, includeStart), stateRef.current.settings.backgroundAudio, () => generation.current !== token, cachedConfig ? { config: cachedConfig, settings: stateRef.current.settings } : undefined);
      if (generation.current !== token) { playback.dispose(); return; }
      const base = { ...next, running: next.phase !== 'done', lastTick: Date.now() };
      playback.player.muted = stateRef.current.muted;
      playback.player.volume = sessionPlanRef.current?.volume ?? 1;
      engine.current = { ...playback, base };
      commitSession(base); playback.player.play(); navigate('training');
    } catch (cause) {
      if (generation.current === token) setError(cause instanceof Error ? cause.message : '无法准备训练音频，请重试。');
    } finally { if (generation.current === token) setBusy(false); }
  }

  async function start(custom?: Config) {
    const plan = custom ? null : plansRef.current.find(x => x.id === selectedPlanRef.current) || null;
    await requestStart(custom || plan?.config || stateRef.current.config, plan);
  }
  async function startPlan(plan: TrainingPlan) {
    await requestStart(plan.config, plan);
  }
  async function requestStart(nextConfig: Config, plan: TrainingPlan | null) {
    sync();
    const request = makeStartRequest(sessionRef.current, nextConfig, plan) as StartRequest;
    if (request.requiresConfirmation) { setPendingStart(request); return; }
    await executeStart(request);
  }
  async function executeStart(request: StartRequest) {
    if (request.plan) selectPlan(request.plan.id);
    sessionPlanRef.current = request.plan; setSessionPlan(request.plan);
    setConfig(request.config); navigate('training');
    await play(startSession(request.config, Date.now()) as Session, true, request.config);
  }
  async function confirmStart() {
    if (!pendingStart) return;
    const request = pendingStart; setPendingStart(null);
    finish(); await executeStart(request);
  }
  function pause() {
    // AppState listeners outlive renders: always invalidate pending preparation.
    generation.current++; setBusy(false);
    sync(); engine.current?.player.pause();
    commitSession({ ...sessionRef.current, running: false });
  }
  async function resume() {
    if (engine.current) {
      engine.current.player.play(); commitSession({ ...sessionRef.current, running: true }); navigate('training');
    } else if (sessionRef.current.config && !['idle', 'done'].includes(sessionRef.current.phase)) await play(resumeSession(sessionRef.current, Date.now()) as Session);
  }
  async function skip() { sync(); const next = advanceSession(sessionRef.current) as Session; if (next.phase === 'done') setReport(getReport(next) as Report); await play(next, true); }
  async function extend(ms: number) {
    sync(); const current = sessionRef.current;
    const next = extendSession({ ...current, running: false }, ms, Date.now()) as Session;
    if (current.running) await play(next); else { engine.current?.dispose(); engine.current = null; commitSession(next); }
  }
  async function resetPhase() {
    const current = sessionRef.current, next = { ...current, remainingMs: current.durationMs, warningPlayedRound: current.phase === 'work' ? 0 : current.warningPlayedRound };
    engine.current?.dispose(); engine.current = null; commitSession({ ...next, running: false });
  }
  function finish() {
    sync(); generation.current++; setBusy(false); engine.current?.dispose(); engine.current = null;
    const next = { ...sessionRef.current, phase: 'done' as const, running: false }; commitSession(next); setReport(getReport(next) as Report); navigate('report');
  }
  function toggleMute() { const next = !stateRef.current.muted; stateRef.current.muted = next; setMuted(next); if (engine.current) engine.current.player.muted = next; }
  function setSettings(next: Settings) { pause(); engine.current?.dispose(); engine.current = null; stateRef.current.settings = next; setSettingsState(next); }
  function toggleStopwatch() {
    const current = stopwatchRef.current, now = Date.now();
    commitStopwatch({ ...current, elapsedMs: stopwatchElapsed(current, now), startedAt: now, running: !current.running });
  }
  function lap() {
    const current = stopwatchRef.current; if (!current.running) return;
    const elapsed = stopwatchElapsed(current, Date.now());
    commitStopwatch({ ...current, lastLapMs: elapsed, laps: [{ id: current.laps.length + 1, ms: elapsed - current.lastLapMs, totalMs: elapsed }, ...current.laps] });
    if (stateRef.current.settings.vibration) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
  const editPlan = (id?: string) => router.replace({ pathname: '/editor', params: { id: id || 'new' } });
  const newId = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  function commitPlans(next: TrainingPlan[]) { plansRef.current = next; setPlans(next); }
  function selectPlan(id: string) {
    const plan = plansRef.current.find(x => x.id === id); if (!plan) return;
    selectedPlanRef.current = id; setSelectedPlanId(id); stateRef.current.config = plan.config; setConfig(plan.config);
  }
  async function savePlan(draft: TrainingPlan) {
    const id = draft.id || newId(), next = saveCustomPlan(plansRef.current, draft, id) as TrainingPlan[];
    const plan = next.find(x => x.id === id)!;
    const version = (saveVersions.current[id] || 0) + 1; saveVersions.current[id] = version;
    let resource = await prepareWorkoutAudio(plan.config, stateRef.current.settings);
    try {
      while (resource.key !== audioKey(plan.config, stateRef.current.settings)) {
        await resource.release();
        if (saveVersions.current[id] !== version) throw new Error('方案保存已取消。');
        resource = await prepareWorkoutAudio(plan.config, stateRef.current.settings);
      }
      if (saveVersions.current[id] !== version) throw new Error('方案保存已取消。');
      const updated = saveCustomPlan(plansRef.current, plan, id) as TrainingPlan[];
      // Retention publishes ownership synchronously; commit without an intervening await.
      const maintenance = retainWorkoutAudio(updated.map(item => item.config), stateRef.current.settings);
      commitPlans(updated); selectPlan(id);
      await maintenance.catch(() => setError('音频缓存清理失败，请检查设备存储空间。'));
      return updated.find(x => x.id === id)!;
    } finally { await resource.release().catch(() => {}); }
  }
  function copySavedPlan(id: string) {
    const nextId = newId(), next = copyPlan(plansRef.current, id, nextId) as TrainingPlan[];
    commitPlans(next); return next.find(x => x.id === nextId)!;
  }
  function deletePlan(id: string) {
    saveVersions.current[id] = (saveVersions.current[id] || 0) + 1;
    const next = removeCustomPlan(plansRef.current, id) as TrainingPlan[]; commitPlans(next);
    if (selectedPlanRef.current === id) selectPlan(next.find(x => !x.template)?.id || next[0].id);
  }
  return <Context.Provider value={{ ready, busy, audioStatus, error, clearError: () => setError(null), config, settings, muted, session, report, stopwatch, stopwatchMs, screen, navigate, start, startPlan, pause, resume, skip, extend, resetPhase, finish, saveConfig: value => setConfig(normalizeConfig(value)), setSettings, toggleMute, toggleStopwatch, lap, resetStopwatch: () => commitStopwatch({ ...emptyStopwatch, laps: [] }), plans, selectedPlan, sessionPlan, savePlan, copySavedPlan, deletePlan, toggleHomeVisibility: id => commitPlans(togglePlanHome(plansRef.current, id)), selectPlan, editPlan, pendingStart, confirmStart, cancelStart: () => setPendingStart(null) }}>{children}</Context.Provider>;
}

export function useRound() { const context = useContext(Context); if (!context) throw new Error('Missing SessionProvider'); return context; }
