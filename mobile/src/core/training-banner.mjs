import { formatDuration } from './mobile-core.mjs';

export function trainingBanner(screen, session) {
  const phases = { prep: '准备', work: '训练', rest: '休息' };
  const name = phases[session.phase];
  if (screen === 'training' || !session.config || !name) return null;
  return {
    phase: session.phase,
    label: session.running ? `${name}中` : `已暂停 · ${name}`,
    round: `第 ${session.round}/${session.config.rounds} 回合`,
    time: formatDuration(Math.ceil(Math.max(0, session.remainingMs) / 1000) * 1000),
  };
}

export function backTarget(screen) {
  return screen === 'home' ? null : screen === 'credits' ? 'settings' : screen === 'editor' ? 'plans' : 'home';
}
