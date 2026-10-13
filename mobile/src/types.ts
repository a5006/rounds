export type Config = { workSec: number; restSec: number; prepSec: number; rounds: number; noRestLast: boolean };
export type TrainingPlan = { id: string; name: string; category: string; color: string; config: Config; vibration: boolean; volume: number; showOnHome: boolean; template: boolean };
export type Settings = { earlyWarning: boolean; voiceAudio: boolean; vibration: boolean; keepAwake: boolean; backgroundAudio: boolean };
export type Phase = 'idle' | 'prep' | 'work' | 'rest' | 'done';
export type Session = {
  phase: Phase; round: number; completedRounds: number; warningPlayedRound: number;
  remainingMs: number; durationMs: number; elapsedMs: number; workMs: number; restMs: number;
  roundMs: number; roundRecords: number[]; running: boolean; lastTick: number; config: Config | null;
};
export type Report = { completedRounds: number; rounds: number; workSec: number; restSec: number; elapsedMs: number; workMs: number; restMs: number; roundRecords: number[]; date: string };
export type Cue = { atMs: number; kind: string; clip: string };
export type AudioPhase = { phase: string; round: number; durationMs: number; offsetMs: number; cues: Cue[] };
export type Lap = { id: number; ms: number; totalMs: number };
export type Stopwatch = { elapsedMs: number; running: boolean; startedAt: number; lastLapMs: number; laps: Lap[] };
export type Screen = 'home' | 'training' | 'stopwatch' | 'countdown' | 'editor' | 'plans' | 'settings' | 'report' | 'credits';
