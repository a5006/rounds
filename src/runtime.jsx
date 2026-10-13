import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate as useRouterNavigate, useLocation } from 'react-router-dom';
import { emptySession, startSession, advanceSession, tickSession, pauseSession, resumeSession, extendSession, getReport } from './session';
import { shouldScheduleRoundWarning, scheduleWoodClapper } from './wood-clapper';
import woodClapperUrl from '../assets/audio/wood-clapper.wav?url';
import { scheduleRestBeeps, phaseBellCount } from './prep-beep';
import { scheduleCountdownSpeech } from './countdown-speech';

const Context = createContext(null);
const trainingPaths = ['/prep', '/combat', '/rest', '/paused'];
const phasePaths = { prep: '/prep', work: '/combat', rest: '/rest', done: '/summary' };
const storage = {
  read(key, fallback) { try { return JSON.parse(localStorage.getItem(`round-pro:${key}`)) ?? fallback; } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem(`round-pro:${key}`, JSON.stringify(value)); } catch { /* Private mode/storage quota: keep the session in memory. */ } },
};

export function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function AnimatedTime({ value }) {
  return <span className="animated-time" aria-label={value}>{value.split('').map((digit, index) => <span className="digit-slot" key={index}><span key={digit} className={digit === ':' ? 'digit-colon' : 'digit-enter'}>{digit}</span></span>)}</span>;
}

let audio;
async function prepareAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return false;
  try {
    audio ||= new AudioContext();
    await audio.resume();
    await loadWoodClapper();
    return audio.state === 'running';
  } catch { return false; }
}
function bell(count = 1) {
  if (!audio || audio.state !== 'running') return;
  for (let beat = 0; beat < count; beat++) {
    const time = audio.currentTime + beat * 0.24;
    [440, 660, 880, 1320].forEach((freq, index) => {
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.14 / (index + 1), time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.start(time); oscillator.stop(time + 0.85);
    });
  }
}

let woodClapperBuffer, woodClapperPromise;
async function loadWoodClapper() {
  if (woodClapperBuffer) return woodClapperBuffer;
  woodClapperPromise ||= fetch(woodClapperUrl)
    .then(response => { if (!response.ok) throw new Error('Unable to load clapper recording'); return response.arrayBuffer(); })
    .then(bytes => audio.decodeAudioData(bytes))
    .then(buffer => { woodClapperBuffer = buffer; return buffer; })
    .catch(error => { woodClapperPromise = undefined; throw error; });
  return woodClapperPromise;
}
function woodClapper() {
  if (!audio || audio.state !== 'running' || !woodClapperBuffer) return false;
  const source = audio.createBufferSource();
  source.buffer = woodClapperBuffer;
  source.connect(audio.destination);
  source.start();
  source.onended = () => source.disconnect();
  return true;
}

export function SessionProvider({ initialConfig, children }) {
  const navigate = useRouterNavigate(), location = useLocation();
  const [config, setConfig] = useState(() => storage.read('config', initialConfig));
  const [settings, setSettings] = useState(() => storage.read('settings', { earlyWarning: true, voiceAudio: true, vibration: true, keepAwake: true }));
  const [session, setSession] = useState(() => {
    const saved = storage.read('session', null);
    return saved?.config ? tickSession(saved, Date.now()) : emptySession();
  });
  const [lastReport, setLastReport] = useState(() => storage.read('report', null));
  const [muted, setMuted] = useState(() => storage.read('muted', false));
  const [audioReady, setAudioReady] = useState(false);
  const sessionRef = useRef(session), stateRef = useRef({ config, settings, muted });
  sessionRef.current = session; stateRef.current = { config, settings, muted };
  useEffect(() => storage.write('config', config), [config]);
  useEffect(() => storage.write('settings', settings), [settings]);
  useEffect(() => storage.write('muted', muted), [muted]);
  useEffect(() => storage.write('report', lastReport), [lastReport]);
  useEffect(() => {
    const persist = () => storage.write('session', sessionRef.current);
    const timer = setInterval(persist, 1000);
    window.addEventListener('pagehide', persist);
    return () => { clearInterval(timer); persist(); window.removeEventListener('pagehide', persist); };
  }, []);
  useEffect(() => {
    if (!session.running) { storage.write('session', session); return; }
    const tick = () => setSession(prev => tickSession(prev, Date.now()));
    const timer = setInterval(tick, 50);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [session.running]);

  // Only timer screens follow the session. Normal navigation remains usable.
  useEffect(() => {
    if (!trainingPaths.includes(location.pathname)) return;
    if (session.phase === 'idle') { navigate('/', { replace: true }); return; }
    const target = !session.running && session.phase !== 'done' ? '/paused' : phasePaths[session.phase];
    if (target && target !== location.pathname) navigate(target, { replace: true });
  }, [session.phase, session.running, location.pathname, navigate]);
  useEffect(() => {
    if (session.phase === 'done' && session.config) setLastReport(getReport(session));
  }, [session.phase]);

  const lastCue = useRef('');
  const lastCountdownBeep = useRef(null);
  const lastWorkNumber = useRef(null);
  const spokenRound = useRef(null);
  const phaseDeadline = session.running ? session.lastTick + session.remainingMs : 0;
  useEffect(() => {
    if (!session.running && session.phase !== 'done') return;
    const cue = `${session.phase}:${session.round}`;
    if (lastCue.current === cue) return;
    if (!audioReady) return;
    lastCue.current = cue;
    if (muted) return;
    bell(phaseBellCount(session.phase));
    if (settings.vibration) navigator.vibrate?.(session.phase === 'work' ? [100, 50, 100] : 70);
    if (settings.voiceAudio && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const message = session.phase === 'work' ? `第 ${session.round} 回合，开始` : session.phase === 'rest' ? '回合结束，休息' : session.phase === 'done' ? '训练完成' : '准备训练';
      const utterance = new SpeechSynthesisUtterance(message); utterance.lang = 'zh-CN'; utterance.rate = 1.1;
      speechSynthesis.speak(utterance);
    }
  }, [session.phase, session.round, session.running, muted, settings, audioReady]);
  useEffect(() => {
    if (!['prep', 'rest'].includes(session.phase)) { lastCountdownBeep.current = null; return; }
    if (!session.running || muted || !audioReady) return;
    const remainingMs = Math.max(0, phaseDeadline - Date.now());
    if (remainingMs > 3000) lastCountdownBeep.current = null;
    return scheduleRestBeeps(audio, remainingMs, lastCountdownBeep.current, second => { lastCountdownBeep.current = second; });
  }, [phaseDeadline, session.phase, session.round, session.running, muted, audioReady]);
  useEffect(() => {
    if (!shouldScheduleRoundWarning(session, { enabled: settings.earlyWarning, muted, audioReady })) return;
    const round = session.round;
    return scheduleWoodClapper(audio, woodClapperBuffer, Math.max(0, phaseDeadline - Date.now()), () => {
      setSession(prev => prev.warningPlayedRound === round ? prev : ({ ...prev, warningPlayedRound: round }));
    });
  }, [phaseDeadline, session.phase, session.round, session.running, settings.earlyWarning, muted, audioReady]);
  useEffect(() => {
    if (session.phase !== 'work') { lastWorkNumber.current = null; return; }
    if (spokenRound.current !== session.round) { spokenRound.current = session.round; lastWorkNumber.current = null; }
    if (!session.running || muted || !settings.voiceAudio || !('speechSynthesis' in window)) return;
    const cancel = scheduleCountdownSpeech(phaseDeadline, lastWorkNumber.current, second => {
      lastWorkNumber.current = second;
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance({ 3: '三', 2: '二', 1: '一' }[second]);
      utterance.lang = 'zh-CN'; utterance.rate = 1.25;
      const voice = speechSynthesis.getVoices().find(voice => /^zh[-_]CN/i.test(voice.lang));
      if (voice) utterance.voice = voice;
      speechSynthesis.speak(utterance);
    });
    return () => { cancel(); speechSynthesis.cancel(); };
  }, [phaseDeadline, session.phase, session.round, session.running, muted, settings.voiceAudio]);

  useEffect(() => {
    if (!session.running || !settings.keepAwake || !navigator.wakeLock) return;
    let lock, disposed = false;
    const acquire = async () => {
      if (document.visibilityState !== 'visible' || disposed || lock && !lock.released) return;
      try { const next = await navigator.wakeLock.request('screen'); if (disposed) await next.release(); else lock = next; } catch { /* Unsupported/power saving mode. */ }
    };
    acquire(); document.addEventListener('visibilitychange', acquire);
    return () => { disposed = true; lock?.release().catch(() => {}); document.removeEventListener('visibilitychange', acquire); };
  }, [session.running, settings.keepAwake]);

  const unlockAudio = async (count = 1) => { const ready = await prepareAudio(); setAudioReady(ready); if (ready) bell(count); };
  const previewWoodClapper = async () => { const ready = await prepareAudio(); setAudioReady(ready); if (ready) woodClapper(); };
  const go = (path, customConfig) => {
    let next = tickSession(sessionRef.current, Date.now());
    if (path === '/prep') {
      const c = customConfig || stateRef.current.config;
      next = startSession(c, Date.now());
      if (customConfig) setConfig(c);
      prepareAudio().then(setAudioReady);
      lastCue.current = '';
      lastCountdownBeep.current = null;
      lastWorkNumber.current = null;
      path = phasePaths[next.phase];
    } else if (path === '/paused') next = pauseSession(next, Date.now());
    else if (path === '/combat' || path === '/rest') {
      if (location.pathname === '/paused' || !trainingPaths.includes(location.pathname)) {
        next = resumeSession(next, Date.now());
        prepareAudio().then(setAudioReady);
      }
      else if (next.phase !== 'done') next = advanceSession(next);
      path = phasePaths[next.phase] || '/';
    } else if (path === '/summary' && !['idle', 'done'].includes(next.phase)) {
      next = { ...next, phase: 'done', running: false };
    } else if (path === '/' && trainingPaths.includes(location.pathname)) next = emptySession();
    sessionRef.current = next; setSession(next); storage.write('session', next);
    navigate(path);
  };
  const addTime = ms => setSession(prev => extendSession(prev, ms, Date.now()));
  const togglePause = () => setSession(prev => prev.running ? pauseSession(prev, Date.now()) : resumeSession(prev, Date.now()));
  const resetPhase = () => {
    const current = tickSession(sessionRef.current, Date.now());
    const next = { ...current, remainingMs: current.durationMs, warningPlayedRound: current.phase === 'work' ? 0 : current.warningPlayedRound };
    if (current.phase === 'prep' || current.phase === 'rest') lastCountdownBeep.current = null;
    if (current.phase === 'work') lastWorkNumber.current = null;
    sessionRef.current = next; setSession(next);
  };

  // Make icon-only controls accessible without changing the reference layout.
  useEffect(() => {
    const labels = { volume_off: '取消静音', volume_up: '静音', arrow_back: '返回', close: '关闭', pause: '暂停训练', play_arrow: '开始', person: '设置', tune: '设置', remove: '减少', add: '增加', more_vert: '更多', settings: '设置', notifications_active: '铃声预览', doorbell: '铃声预览' };
    const enhance = () => document.querySelectorAll('button').forEach(button => {
      if (button.hasAttribute('aria-label')) return;
      const icon = button.querySelector('.material-symbols-outlined');
      if (!icon) return;
      const iconText = icon.textContent.trim();
      const text = button.textContent.replace(iconText, '').trim();
      if (!text) button.setAttribute('aria-label', labels[iconText] || iconText);
    });
    enhance();
    const observer = new MutationObserver(enhance); observer.observe(document.getElementById('root'), { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return <Context.Provider value={{ config, setConfig, session, settings, setSettings, muted, setMuted, lastReport, go, addTime, togglePause, resetPhase, audioReady, unlockAudio, previewWoodClapper }}>{children}</Context.Provider>;
}
export function useWorkout() { return useContext(Context); }
export function useNavigate() { return useWorkout().go; }

export function useStopwatch() {
  const [running, setRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [laps, setLapsState] = useState(() => storage.read('laps', []));
  const base = useRef(0), started = useRef(0), lastLap = useRef(0), frame = useRef(0);
  useEffect(() => {
    if (!running) return;
    const update = () => { setElapsedTime(base.current + performance.now() - started.current); frame.current = requestAnimationFrame(update); };
    frame.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame.current);
  }, [running]);
  const currentTime = () => running ? base.current + performance.now() - started.current : base.current;
  const toggle = () => {
    if (running) { base.current = currentTime(); setElapsedTime(base.current); }
    else started.current = performance.now();
    setRunning(!running);
  };
  const setLaps = useCallback(value => { setLapsState(value); storage.write('laps', value); if (!value.length) lastLap.current = currentTime(); }, [running]);
  const lap = () => {
    if (!running) return;
    const elapsed = currentTime(), lapMs = elapsed - lastLap.current;
    const newLaps = [{ id: String(laps.length + 1).padStart(2, '0'), ms: lapMs, totalMs: elapsed }, ...laps];
    lastLap.current = elapsed;
    const best = Math.min(...newLaps.map(item => item.ms));
    const formatted = newLaps.map(item => ({ ...item, lap: preciseTime(item.ms), total: preciseTime(item.totalMs), diff: `+${preciseTime(item.ms - best)}`, best: item.ms === best, label: item.ms === best ? '最佳单圈' : '分段标记' }));
    setLaps(formatted);
  };
  const reset = () => { setRunning(false); base.current = 0; lastLap.current = 0; setElapsedTime(0); setLapsState([]); storage.write('laps', []); };
  return { elapsedTime, lapTime: Math.max(0, elapsedTime - lastLap.current), isRunning: running, toggle, lap, reset, laps, setLaps };
}
const preciseTime = ms => `${formatDuration(ms)}.${String(Math.floor(ms % 1000 / 10)).padStart(2, '0')}`;
export function exportLaps(laps) {
  const content = '\ufeff圈次,单圈,总时间\n' + laps.map(l => `${l.id},${l.lap},${l.total}`).join('\n');
  download(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'ROUND-PRO-分圈成绩.csv');
}
function download(blob, name) {
  const link = document.createElement('a'), url = URL.createObjectURL(blob);
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function shareReport(report) {
  const text = `ROUND PRO · 训练战报\n完成 ${report.completedRounds}/${report.rounds} 回合\n总用时 ${formatDuration(report.elapsedMs)}`;
  if (navigator.share) { await navigator.share({ title: 'ROUND PRO 训练战报', text }); return; }
  if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return; }
  download(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'ROUND-PRO-训练战报.txt');
}
