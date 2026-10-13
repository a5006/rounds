import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useRound } from './SessionProvider';
import { previewAudio } from './audio';
import { cancelCountdownAlert, countdownAlertsGranted, listenCountdownAlert, requestCountdownAlerts, scheduleCountdownAlert } from './countdown-alerts';
import { countdownRemaining, emptyCountdown, normalizeSeconds, pauseCountdown, recentCountdownTimes, restoreCountdown, resumeCountdown, settleCountdown, startCountdown, stopCountdown, shouldRingCountdown } from './core/countdown.mjs';

type Timer = { status: 'idle' | 'ready' | 'running' | 'paused' | 'complete'; durationMs: number; remainingMs: number; deadline: number };
type Value = { timer: Timer; remainingMs: number; selectedSeconds: number; recent: number[]; keepAwake: boolean; ready: boolean; starting: boolean; notice: string | null;
  select: (seconds: number) => void; start: () => Promise<void>; pause: () => void; resume: () => Promise<void>; stop: () => void; cancel: () => void; setKeepAwake: (value: boolean) => void };
const Context = createContext<Value | null>(null);
const storageKey = 'round-pro-countdown:v1';
export function CountdownProvider({ children }: { children: React.ReactNode }) {
  const app = useRound();
  const navigate = app.navigate;
  const [timer, setTimer] = useState<Timer>(emptyCountdown() as Timer), [remainingMs, setRemainingMs] = useState(145000);
  const [selectedSeconds, setSelectedSeconds] = useState(145), [recent, setRecent] = useState(recentCountdownTimes(null));
  const [keepAwake, setKeepAwake] = useState(true), [ready, setReady] = useState(false), [starting, setStarting] = useState(false), [notice, setNotice] = useState<string | null>(null);
  const timerRef = useRef(timer), readyRef = useRef(false), operation = useRef(0), alive = useRef(true), alerts = useRef(false), startingRef = useRef(false);
  const preferences = useRef({ muted: app.muted, vibration: app.settings.vibration, training: app.session.running });
  useEffect(() => { preferences.current = { muted: app.muted, vibration: app.settings.vibration, training: app.session.running }; }, [app.muted, app.settings.vibration, app.session.running]);
  const alertQueue = useRef(Promise.resolve()), saveQueue = useRef(Promise.resolve());
  const commit = useCallback((next: Timer) => { timerRef.current = next; setTimer(next); setRemainingMs(countdownRemaining(next, Date.now())); }, []);
  const sync = useCallback(() => {
    const current = timerRef.current, next = settleCountdown(current, Date.now()) as Timer;
    setRemainingMs(countdownRemaining(next, Date.now()));
    if (next !== current) {
      commit(next);
      if (AppState.currentState === 'active' && !alerts.current) {
        if (shouldRingCountdown(current, next, preferences.current.muted)) void previewAudio('bells', false, 1, !preferences.current.training).catch(() => { if (alive.current) setNotice('结束铃声播放失败，请检查设备声音设置。'); });
        if (preferences.current.vibration) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }
  }, [commit]);
  useEffect(() => {
    alive.current = true;
    void AsyncStorage.getItem(storageKey).then(raw => {
      if (!alive.current || !raw) return;
      const saved = JSON.parse(raw);
      commit(restoreCountdown(saved.timer, Date.now()) as Timer);
      setSelectedSeconds(normalizeSeconds(saved.selectedSeconds ?? 145));
      setRecent(recentCountdownTimes(saved.recent)); setKeepAwake(saved.keepAwake !== false);
    }).catch(() => { if (alive.current) setNotice('倒计时记录恢复失败，已使用默认时长。'); }).finally(() => {
      if (alive.current) { readyRef.current = true; setReady(true); }
    });
    return () => { alive.current = false; };
  }, [commit]);
  useEffect(() => {
    if (!ready) return;
    const snapshot = JSON.stringify({ timer, selectedSeconds, recent, keepAwake });
    saveQueue.current = saveQueue.current.catch(() => {}).then(() => AsyncStorage.setItem(storageKey, snapshot)).catch(() => { if (alive.current) setNotice('倒计时保存失败，请检查设备存储空间。'); });
  }, [ready, timer, selectedSeconds, recent, keepAwake]);
  useEffect(() => {
    const tick = setInterval(() => { if (readyRef.current && timerRef.current.status === 'running') sync(); }, 100);
    const state = AppState.addEventListener('change', value => { if (value === 'active' && readyRef.current) sync(); });
    return () => { clearInterval(tick); state.remove(); };
  }, [sync]);
  useEffect(() => listenCountdownAlert(() => navigate('countdown')), [navigate]);
  useEffect(() => {
    if (!ready || timer.status === 'complete') return;
    // Serialize scheduling and cancellation so quick pause/resume never leaves an old alarm behind.
    const expected = timer;
    alertQueue.current = alertQueue.current.catch(() => {}).then(async () => {
      if (timerRef.current !== expected) return;
      await cancelCountdownAlert(); alerts.current = false;
      if (expected.status !== 'running' || expected.deadline <= Date.now()) return;
      const granted = await countdownAlertsGranted();
      if (timerRef.current !== expected) return;
      if (!granted) { if (Platform.OS !== 'web') setNotice('通知权限未开启，后台到时提醒不可用。'); return; }
      await scheduleCountdownAlert(expected.deadline, app.muted, app.settings.vibration);
      if (timerRef.current !== expected) { await cancelCountdownAlert(); return; }
      alerts.current = true;
    }).catch(() => { alerts.current = false; if (alive.current) setNotice('系统提醒设置失败，请检查通知及闹钟权限；前台计时仍可使用。'); });
  }, [ready, timer, app.muted, app.settings.vibration]);
  useEffect(() => {
    if (!keepAwake || !app.settings.keepAwake || timer.status !== 'running') return;
    let disposed = false;
    void activateKeepAwakeAsync('round-pro-countdown').then(() => { if (disposed) void deactivateKeepAwake('round-pro-countdown').catch(() => {}); }).catch(() => {});
    return () => { disposed = true; void deactivateKeepAwake('round-pro-countdown').catch(() => {}); };
  }, [keepAwake, app.settings.keepAwake, timer.status]);
  const begin = async (resume: boolean) => {
    if (!readyRef.current || startingRef.current || (!resume && (!selectedSeconds || !['idle', 'ready', 'complete'].includes(timerRef.current.status))) || (resume && timerRef.current.status !== 'paused')) return;
    const token = ++operation.current; startingRef.current = true; setStarting(true); setNotice(null);
    try {
      // Ask before starting so time spent in the OS permission dialog does not consume the timer.
      await requestCountdownAlerts().catch(() => false);
      if (!alive.current || token !== operation.current) return;
      const next = (resume ? resumeCountdown(timerRef.current, Date.now()) : startCountdown(selectedSeconds, Date.now())) as Timer;
      commit(next);
      if (!resume) setRecent(previous => recentCountdownTimes([selectedSeconds, ...previous]));
    } finally { if (alive.current && token === operation.current) { startingRef.current = false; setStarting(false); } }
  };
  return <Context.Provider value={{ timer, remainingMs, selectedSeconds, recent, keepAwake, ready, starting, notice,
    select: seconds => { if (timerRef.current.status === 'idle') setSelectedSeconds(normalizeSeconds(seconds)); }, start: () => begin(false), resume: () => begin(true),
    pause: () => commit(pauseCountdown(timerRef.current, Date.now()) as Timer),
    stop: () => { operation.current++; startingRef.current = false; setStarting(false); setNotice(null); commit(stopCountdown(timerRef.current) as Timer); },
    cancel: () => { operation.current++; startingRef.current = false; setStarting(false); setNotice(null); commit(emptyCountdown(selectedSeconds) as Timer); }, setKeepAwake }}>{children}</Context.Provider>;
}
export function useCountdown() { const value = useContext(Context); if (!value) throw new Error('Missing CountdownProvider'); return value; }
