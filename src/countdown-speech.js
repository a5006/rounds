// Deadline-based callbacks; missed background cues are skipped rather than queued together.
export function scheduleCountdownSpeech(deadline, lastSecond, speak, clock = globalThis) {
  const remainingMs = deadline - clock.Date.now();
  const timers = [3, 2, 1].filter(second => second <= Math.ceil(remainingMs / 1000) && second !== lastSecond).map(second => {
    const target = deadline - second * 1000;
    return clock.setTimeout(() => {
      if (clock.Date.now() <= target + 400) speak(second);
    }, Math.max(0, target - clock.Date.now()));
  });
  return () => timers.forEach(timer => clock.clearTimeout(timer));
}
