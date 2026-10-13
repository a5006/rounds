import React, { type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme as t } from './theme';
import { useRound } from './SessionProvider';
import type { Screen } from './types';

type Icon = ComponentProps<typeof Ionicons>['name'];
export function IconButton({ icon, label, onPress, color = t.text }: { icon: Icon; label: string; onPress: () => void; color?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.iconButton, pressed && s.pressed]}><Ionicons name={icon} size={23} color={color} /></Pressable>;
}
export function Button({ title, icon, onPress, color = t.red, secondary = false, disabled = false, style }: { title: string; icon?: Icon; onPress: () => void; color?: string; secondary?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, { backgroundColor: secondary ? t.raised : color, minHeight: secondary ? 54 : 64, borderColor: secondary ? t.border : color, boxShadow: !secondary && !disabled ? `0 4px ${pressed ? 8 : 14}px ${color}${pressed ? '18' : '30'}` : 'none' }, disabled && { opacity: .35 }, pressed && s.pressed, style]}>
    {icon && <Ionicons name={icon} size={22} color={secondary ? color : '#111318'} />}<Text style={[s.buttonLabel, { color: secondary ? color : '#111318' }]}>{title}</Text>
  </Pressable>;
}
export function Header({ title, back = true, audio = false, backScreen = 'home' }: { title: string; back?: boolean; audio?: boolean; backScreen?: Screen }) {
  const app = useRound();
  return <View style={s.header}>{back ? <IconButton icon="arrow-back" label={backScreen === 'plans' ? '返回方案库' : '返回首页'} onPress={() => app.navigate(backScreen)} /> : <View style={s.logo}><Text style={s.logoText}>R</Text></View>}<Text style={s.heading}>{title}</Text>{audio ? <IconButton icon={app.muted ? 'volume-mute' : 'volume-high'} label={app.muted ? '取消静音' : '静音'} onPress={app.toggleMute} /> : <IconButton icon="options" label="打开设置" onPress={() => app.navigate('settings')} />}</View>;
}
const tabs: { screen: Screen; title: string; icon: Icon }[] = [
  { screen: 'home', title: '首页', icon: 'home-outline' }, { screen: 'stopwatch', title: '秒表', icon: 'stopwatch-outline' }, { screen: 'plans', title: '方案', icon: 'barbell-outline' }, { screen: 'report', title: '战报', icon: 'stats-chart-outline' }, { screen: 'settings', title: '设置', icon: 'options-outline' },
];
export function BottomNav() {
  const app = useRound();
  return <View style={s.nav}>{tabs.map(tab => <Pressable key={tab.screen} onPress={() => app.navigate(tab.screen)} accessibilityRole="button" accessibilityLabel={tab.title} accessibilityState={{ selected: app.screen === tab.screen }} style={s.navItem}><Ionicons name={tab.icon} size={22} color={app.screen === tab.screen ? t.red : t.soft} /><Text style={[s.caption, { color: app.screen === tab.screen ? t.red : t.soft }]}>{tab.title}</Text></Pressable>)}</View>;
}
export function Card({ children, style, accent, prominent = false }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; accent?: string; prominent?: boolean }) {
  return <View style={[s.card, prominent && { backgroundColor: t.low, borderColor: accent ? `${accent}55` : t.border }, style]}>{children}</View>;
}
export function Label({ children, color = t.muted }: { children: React.ReactNode; color?: string }) { return <Text style={[s.label, { color }]}>{children}</Text>; }
export function IconLabel({ children, icon, color = t.muted }: { children: React.ReactNode; icon: Icon; color?: string }) { return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Ionicons name={icon} size={14} color={color} /><Label color={color}>{children}</Label></View>; }
export function Metric({ label, value, color = t.text, icon }: { label: string; value: string; color?: string; icon?: Icon }) { return <View style={s.metric}>{icon ? <IconLabel icon={icon} color={color}>{label}</IconLabel> : <Label>{label}</Label>}<Text style={[s.metricValue, { color }]}>{value}</Text></View>; }

export { Dial } from './Dial';

export function BusyOverlay() { const app = useRound(); return <View accessibilityViewIsModal style={s.overlay}><View style={[s.card, { alignItems: 'center', gap: 16 }]}><ActivityIndicator color={t.red} size="large" /><Text style={s.body}>正在准备训练…</Text><Label>长训练方案需要稍等片刻</Label><Button title="取消准备" secondary onPress={() => { app.pause(); app.navigate('home'); }} /></View></View>; }

export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: t.bg }, content: { padding: 20, paddingBottom: 28, gap: 16, width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  heading: { color: t.text, fontSize: 23, fontWeight: '800', flex: 1 }, title: { color: t.text, fontSize: 25, fontWeight: '800' }, body: { color: t.text, fontSize: 15, lineHeight: 23 }, caption: { fontSize: 11, color: t.soft, lineHeight: 17 },
  label: { fontSize: 11, letterSpacing: .7, fontWeight: '600', lineHeight: 19 }, mono: { fontFamily: t.mono, fontVariant: ['tabular-nums'], color: t.text },
  card: { padding: 18, borderRadius: t.radius.card, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, metric: { backgroundColor: t.card, padding: 12, borderRadius: t.radius.inset, flexGrow: 1, flexBasis: '45%', gap: 4 }, metricValue: { fontFamily: t.mono, fontSize: 23 },
  button: { minHeight: 54, borderRadius: t.radius.control, borderWidth: 1, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, buttonLabel: { fontSize: 16, fontWeight: '800' },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.raised, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: .75, transform: [{ scale: .97 }] },
  nav: { flexDirection: 'row', width: '100%', maxWidth: 480, alignSelf: 'center', borderTopWidth: 1, borderTopColor: '#33353a77', paddingVertical: 10 }, navItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 3 },
  logo: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: t.red, alignItems: 'center', justifyContent: 'center' }, logoText: { color: t.text, fontWeight: '800', fontSize: 19 },
  dialTime: { color: t.text, fontFamily: t.mono, fontVariant: ['tabular-nums'], letterSpacing: -3, lineHeight: 85 }, fraction: { fontFamily: t.mono, letterSpacing: -1 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: '#0c0e13dd', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 },
});
