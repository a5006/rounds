// Web has no reliable closed-tab alarms. Keep its preview foreground-only.
export async function requestCountdownAlerts() { return false; }
export async function countdownAlertsGranted() { return false; }
export async function scheduleCountdownAlert(_deadline: number, _muted: boolean, _vibration: boolean) {}
export async function cancelCountdownAlert() {}
export function listenCountdownAlert(_open: () => void) { return () => {}; }
