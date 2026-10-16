import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { countdownNotificationSound } from './core/countdown.mjs';

const identifier = 'round-pro-countdown';
const sound = 'bells.wav';
const channelId = (muted: boolean, vibration: boolean) => `countdown-v1-${muted ? 'silent' : 'sound'}-${vibration ? 'vibrate' : 'still'}`;
Notifications.setNotificationHandler({
  handleNotification: async notification => ({ shouldShowBanner: true, shouldShowList: true, shouldSetBadge: false, shouldPlaySound: countdownNotificationSound(Boolean(notification.request.content.data?.countdown), notification.request.content.sound, AppState.currentState === 'active') }),
});
async function channel(muted: boolean, vibration: boolean) {
  const id = channelId(muted, vibration);
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(id, {
    name: `倒计时${muted ? ' · 静音' : ''}${vibration ? ' · 振动' : ''}`,
    importance: Notifications.AndroidImportance.HIGH,
    sound: muted ? null : sound, enableVibrate: vibration, vibrationPattern: vibration ? [0, 300, 150, 300] : undefined,
  });
  return id;
}
export async function requestCountdownAlerts() {
  await channel(false, true);
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}
export async function countdownAlertsGranted() {
  const permission = await Notifications.getPermissionsAsync();
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}
export async function scheduleCountdownAlert(deadline: number, muted: boolean, vibration: boolean) {
  const id = await channel(muted, vibration);
  if (deadline <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({ identifier, content: {
    title: 'ROUND PRO · 时间到', body: '本次倒计时已完成', sound: muted ? false : sound,
    vibrate: vibration ? [0, 300, 150, 300] : [], data: { countdown: true },
  }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: deadline, channelId: id } });
}
export async function cancelCountdownAlert() { await Notifications.cancelScheduledNotificationAsync(identifier); }
export function listenCountdownAlert(open: () => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    if (response.notification.request.content.data?.countdown) { open(); void Notifications.clearLastNotificationResponseAsync(); }
  });
  void Notifications.getLastNotificationResponseAsync().then(response => {
    if (response?.notification.request.content.data?.countdown) { open(); void Notifications.clearLastNotificationResponseAsync(); }
  }).catch(() => {});
  return () => subscription.remove();
}
