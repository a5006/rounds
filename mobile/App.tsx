import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Text, View, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono/700Bold';
import { SessionProvider, useRound } from './src/SessionProvider';
import { BottomNav, BusyOverlay, s } from './src/ui';
import { Slot } from 'expo-router';
import { theme as t } from './src/theme';
import { TrainingBanner } from './src/TrainingBanner';
import { backTarget } from './src/core/training-banner.mjs';
import { ConfirmDialog } from './src/ConfirmDialog';
import { MistBackground } from './src/MistBackground';
import { CountdownProvider, useCountdown } from './src/CountdownProvider';

function Screens() {
  const app = useRound();
  const countdown = useCountdown();
  const { screen, navigate } = app;
  const [showPreparation, setShowPreparation] = useState(false);
  useEffect(() => {
    if (!app.busy) { setShowPreparation(false); return; }
    const timer = setTimeout(() => setShowPreparation(true), 700);
    return () => clearTimeout(timer);
  }, [app.busy]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const target = backTarget(screen);
      if (target) { navigate(target); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [screen, navigate]);
  if (!app.ready) return <View style={local.loading}><ActivityIndicator color={t.red} /></View>;
  return <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[s.page, app.screen === 'countdown' && countdown.timer.status !== 'idle' && { backgroundColor: '#0c0e13' }]}>
    <StatusBar style="light" />
    {app.screen === 'countdown' && countdown.timer.status !== 'idle' ? <MistBackground mode="countdown" running={countdown.timer.status === 'running'} /> : app.screen === 'stopwatch' ? <MistBackground mode="stopwatch" running={app.stopwatch.running} /> : app.screen === 'training' && ['prep', 'work', 'rest'].includes(app.session.phase) ? <MistBackground mode={app.session.phase as 'prep' | 'work' | 'rest'} running={app.session.running} /> : null}
    {app.error && <View accessibilityRole="alert" style={local.error}><Text style={[s.body, { flex: 1 }]}>{app.error}</Text><Pressable accessibilityRole="button" accessibilityLabel="关闭提示" onPress={app.clearError} style={{ padding: 12 }}><Text style={{ color: t.redLight }}>关闭</Text></Pressable></View>}
    <TrainingBanner />
    <Slot />
    {!['training', 'credits'].includes(app.screen) && <BottomNav />}
    {app.busy && showPreparation && !app.session.running && <BusyOverlay />}
    {app.pendingStart && <ConfirmDialog title="还有一场训练未结束" message={`开始「${app.pendingStart.plan?.name || '新的训练'}」会结束当前训练并生成战报。`} confirm="结束当前训练并开始" onCancel={app.cancelStart} onConfirm={() => void app.confirmStart()} />}
  </SafeAreaView>;
}
export default function App() {
  const [loaded, fontError] = useFonts({ JetBrainsMono_700Bold });
  if (!loaded && !fontError) return <View style={local.loading}><ActivityIndicator color={t.red} /></View>;
  return <SafeAreaProvider><SessionProvider><CountdownProvider><Screens /></CountdownProvider></SessionProvider></SafeAreaProvider>;
}
const local = StyleSheet.create({ loading: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }, error: { backgroundColor: '#4b2028', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 } });
