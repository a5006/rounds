import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Dial, Header, s } from '../ui';
import { CountdownWheel } from '../CountdownWheel';
import { useCountdown } from '../CountdownProvider';
import { theme as t } from '../theme';
import { formatCountdown } from '../core/countdown.mjs';
import { BreathingDot } from '../BreathingDot';

const hours = Array.from({ length: 24 }, (_, value) => ({ value, label: String(value).padStart(2, '0') }));
const parts = Array.from({ length: 60 }, (_, value) => ({ value, label: String(value).padStart(2, '0') }));
const adjustments = [{ label: '+15S', delta: 15 }, { label: '+30S', delta: 30 }, { label: '+60S', delta: 60 }, { label: 'RESET', delta: 0 }];
export function CountdownScreen() {
  const timer = useCountdown();
  const { width, height } = useWindowDimensions();
  const [menu, setMenu] = useState<{ seconds: number; x: number; y: number } | null>(null);
  const running = timer.timer.status === 'running', complete = timer.timer.status === 'complete', idle = timer.timer.status === 'idle';
  const restart = timer.timer.status === 'ready' || complete;
  const actionColor = running ? '#282a2f' : t.red;
  const actionForeground = running ? t.amber : '#fff';
  const values = [Math.floor(timer.selectedSeconds / 3600), Math.floor(timer.selectedSeconds % 3600 / 60), timer.selectedSeconds % 60];
  return <><Header title="COUNTDOWN" audio back={!idle} onBack={idle ? undefined : timer.cancel} />{idle ? <ScrollView contentContainerStyle={local.setup} showsVerticalScrollIndicator={false}>
    <View style={local.telemetry}><View style={local.telemetryLabel}><BreathingDot color="#ff525d" mode="countdown" /><Text style={local.telemetryText}>HUD TACTICAL TIMING</Text></View><View style={local.smallDot} /></View>
    <View style={local.selector}>
      <View style={local.wheels}><View pointerEvents="none" style={local.band}><View style={local.marker} /><View style={local.marker} /></View>
        {['小时', '分钟', '秒'].map((label, index) => <React.Fragment key={label}>{index > 0 && <Text style={local.colon}>:</Text>}<CountdownWheel label={label} data={index ? parts : hours} value={values[index]} color={index === 2 ? '#ff525d' : '#e2e2e9'} onChange={value => timer.select(timer.selectedSeconds + (value - values[index]) * [3600, 60, 1][index])} /></React.Fragment>)}
      </View>
      <View style={local.quick}>{adjustments.map(item => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.delta ? item.label : '复位'} onPress={() => timer.select(item.delta ? timer.selectedSeconds + item.delta : 0)} style={({ pressed }) => [local.quickTarget, pressed && s.pressed]}><View style={[local.quickChip, !item.delta && { backgroundColor: '#33353a' }]}>{!item.delta && <Ionicons name="refresh-outline" size={14} color={t.soft} />}<Text style={[local.quickText, !item.delta && { color: t.soft }]}>{item.label}</Text></View></Pressable>)}</View>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="开始" disabled={!timer.ready || timer.starting || !timer.selectedSeconds} onPress={() => void timer.start()} style={({ pressed }) => [local.start, (!timer.ready || timer.starting || !timer.selectedSeconds) && { opacity: .35 }, pressed && s.pressed]}><Ionicons name="play-outline" size={28} color="#fff" /><Text style={local.startText}>{timer.starting ? '正在准备…' : '开始'}</Text></Pressable>
    {!timer.selectedSeconds && <Text style={local.hint}>请选择至少 1 秒</Text>}
    {timer.notice && <Text accessibilityRole="alert" style={local.hint}>{timer.notice}</Text>}
    <View style={local.historyTitle}><Ionicons name="time-outline" size={18} color="#ffb3b2" /><Text style={local.historyHeading}>历史倒计时</Text></View>
    <View style={local.recent}>{timer.recent.map(seconds => { const selected = seconds === timer.selectedSeconds; return <Pressable key={seconds} accessibilityRole="button" accessibilityLabel={'选择 ' + formatCountdown(seconds * 1000)} accessibilityHint="长按打开删除菜单" accessibilityState={{ selected }} delayLongPress={500} onLongPress={event => setMenu({ seconds, x: event.nativeEvent.pageX, y: event.nativeEvent.pageY })} onPress={() => timer.select(seconds)} style={({ pressed }) => [local.preset, selected && local.selected, pressed && s.pressed]}>{selected && <View style={local.stripe} />}<Text style={[local.presetTime, selected && { color: '#ffb3b2' }]}>{formatCountdown(seconds * 1000)}</Text></Pressable>; })}</View>
    {timer.recent.length === 0 && <Text style={local.hint}>暂无历史倒计时</Text>}
  </ScrollView> : <View style={local.running}>
    <View style={local.gauge}><Dial mode="countdown" running={running} remainingMs={timer.remainingMs} durationMs={timer.timer.durationMs} caption={complete ? 'TIME’S UP' : timer.timer.status === 'ready' ? 'READY' : ''} transitionKey={'countdown-' + timer.timer.durationMs} statusLabel={complete ? 'COUNTDOWN COMPLETE' : 'PAUSED'} /></View>
    <View style={local.actions}>{!restart && <Pressable accessibilityRole="button" accessibilityLabel="停止" onPress={timer.stop} style={({ pressed }) => [local.stop, pressed && s.pressed]}><Text style={[local.actionText, { color: t.soft }]}>停止</Text></Pressable>}
      <Pressable accessibilityRole="button" accessibilityLabel={restart ? '开始' : running ? '暂停' : '继续'} disabled={timer.starting} onPress={() => { if (restart) void timer.start(); else if (running) timer.pause(); else void timer.resume(); }} style={({ pressed }) => [local.pause, { backgroundColor: actionColor, boxShadow: running ? 'none' : `0 4px 18px ${actionColor}66` }, timer.starting && { opacity: .35 }, pressed && s.pressed]}><Ionicons name={running ? 'pause' : 'play'} size={20} color={actionForeground} /><Text style={[local.actionText, { color: actionForeground }]}>{timer.starting ? '准备中' : restart ? '开始' : running ? '暂停' : '继续'}</Text></Pressable></View>
    {timer.notice && <Text accessibilityRole="alert" style={local.runningHint}>{timer.notice}</Text>}
  </View>}
  <Modal visible={!!menu && idle} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
    <Pressable accessibilityRole="button" accessibilityLabel="关闭删除菜单" onPress={() => setMenu(null)} style={StyleSheet.absoluteFill} />
    {menu && <View accessibilityViewIsModal style={[local.popover, { left: Math.max(16, Math.min(width - 156, menu.x - 70)), top: Math.max(68, Math.min(height - 80, menu.y - 56)) }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={'删除历史倒计时 ' + formatCountdown(menu.seconds * 1000)} onPress={() => { timer.deleteRecent(menu.seconds); setMenu(null); }} style={local.deleteButton}><Ionicons name="trash-outline" size={18} color={t.red} /><Text style={local.deleteText}>删除</Text></Pressable>
    </View>}
  </Modal></>;
}
const local = StyleSheet.create({
  popover: { position: 'absolute', width: 140, backgroundColor: '#282a2f', borderRadius: 10, borderWidth: 1, borderColor: '#45464f', boxShadow: '0 6px 20px #00000066' }, deleteButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, deleteText: { color: t.red, fontSize: 15, fontWeight: '600' },
  setup: { paddingHorizontal: 20, paddingBottom: 24, width: '100%', maxWidth: 430, alignSelf: 'center' },
  telemetry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, marginBottom: 8 }, telemetryLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 }, telemetryText: { color: '#e4bdbc', fontSize: 11, fontWeight: '700', letterSpacing: 1.1 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff525d' }, smallDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#ab8887' },
  selector: { backgroundColor: '#1a1b21', borderRadius: 12, padding: 16 }, wheels: { height: 176, flexDirection: 'row', alignItems: 'center' }, band: { position: 'absolute', left: 0, right: 0, top: 60, height: 56, backgroundColor: '#282a2fe6', borderRadius: 8, boxShadow: '0 0 16px #ff525d2e', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }, marker: { width: 4, height: 24, borderRadius: 2, backgroundColor: '#ff525d' }, colon: { color: '#ff525d', fontFamily: t.mono, fontSize: 48, lineHeight: 56 },
  quick: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 }, quickTarget: { minHeight: 44, justifyContent: 'center' }, quickChip: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#282a2f', borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }, quickText: { color: '#e2e2e9', fontSize: 11, fontWeight: '600' },
  historyTitle: { marginTop: 24, marginBottom: 8, flexDirection: 'row', gap: 4, alignItems: 'center' }, historyHeading: { color: '#e2e2e9', fontSize: 18, lineHeight: 24, fontWeight: '600' },
  recent: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, preset: { flexBasis: '45%', flexGrow: 1, minHeight: 96, backgroundColor: '#1a1b21', borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, selected: { backgroundColor: '#282a2f' }, stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#ff525d' }, presetTime: { color: '#e2e2e9', fontFamily: t.mono, fontSize: 22, letterSpacing: 1.1 },
  start: { marginTop: 24, height: 64, borderRadius: 999, backgroundColor: t.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, startText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1.4 }, hint: { color: '#ab8887', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 8 },
  running: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, width: '100%', maxWidth: 430, alignSelf: 'center' }, gauge: { flex: 1, alignItems: 'center', justifyContent: 'center' }, actions: { width: '100%', flexDirection: 'row', gap: 14 }, stop: { flex: 1, height: 56, backgroundColor: '#1a1b21', borderColor: '#282a2f', borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, pause: { flex: 1, height: 56, backgroundColor: '#ff4655', borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, boxShadow: '0 4px 18px #ff465566' }, actionText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: .4 }, runningHint: { color: '#ab8887', fontSize: 10, lineHeight: 14, textAlign: 'center', marginTop: 8 },
});
