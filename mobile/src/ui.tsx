import React, { type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { theme as t } from './theme';
import { useRound } from './SessionProvider';
import type { Screen } from './types';

type Icon = ComponentProps<typeof Ionicons>['name'];
export function IconButton({ icon, label, onPress, color = t.text }: { icon: Icon; label: string; onPress: () => void; color?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.iconButton, pressed && s.pressed]}><Ionicons name={icon} size={23} color={color} /></Pressable>;
}
export function Button({ title, icon, onPress, color = t.red, secondary = false, disabled = false, stacked = false, quiet = false, caption, style }: { title: string; icon?: Icon; onPress: () => void; color?: string; secondary?: boolean; disabled?: boolean; stacked?: boolean; quiet?: boolean; caption?: string; style?: StyleProp<ViewStyle> }) {
  const foreground = secondary || quiet ? color : color === t.red || color === t.redLight ? '#680013' : color === t.blue || color === t.blueStrong ? '#002b50' : color === t.amber ? '#432c00' : '#410008';
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, { backgroundColor: quiet ? `${color}18` : secondary ? t.raised : color, minHeight: secondary ? 54 : 64, borderColor: quiet ? `${color}33` : secondary ? t.cardBorder : 'transparent', boxShadow: quiet || caption || disabled ? 'none' : secondary ? '0 2px 6px #00000018' : `0 0 ${pressed ? 12 : 24}px ${color}${pressed ? '40' : '70'}` }, (stacked || caption) && { flexDirection: 'column', gap: 2 }, disabled && { opacity: .35 }, pressed && s.pressed, style]}>
    {caption ? <><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{icon && <Ionicons name={icon} size={16} color={foreground} />}<Text style={[s.buttonLabel, { color: foreground, fontSize: 14 }]}>{title}</Text></View><Text style={{ color: foreground, fontSize: 9, letterSpacing: .6 }}>{caption}</Text></> : <>{icon && <Ionicons name={icon} size={24} color={foreground} />}<Text style={[s.buttonLabel, { color: foreground, fontSize: stacked ? 12 : secondary || quiet ? 15 : 18 }]}>{title}</Text></>}
  </Pressable>;
}
export function Header({ title, back = true, audio = false, backScreen = 'home', onBack }: { title: string; back?: boolean; audio?: boolean; backScreen?: Screen; onBack?: () => void }) {
  const app = useRound();
  return <View style={s.header}>{back ? <IconButton icon="arrow-back" label={onBack ? '返回时长选择' : backScreen === 'plans' ? '返回方案库' : '返回首页'} onPress={onBack || (() => app.navigate(backScreen))} /> : <View style={s.logo}><Text style={s.logoText}>R</Text></View>}<Text style={s.heading}>{title}</Text>{audio ? <IconButton icon={app.muted ? 'volume-mute' : 'volume-high'} label={app.muted ? '取消静音' : '静音'} onPress={app.toggleMute} /> : <IconButton icon="options" label="打开设置" onPress={() => app.navigate('settings')} />}</View>;
}
const tabs: { screen: Screen; title: string; icon: Icon }[] = [
  { screen: 'home', title: '首页', icon: 'home-outline' }, { screen: 'stopwatch', title: '秒表', icon: 'stopwatch-outline' }, { screen: 'countdown', title: '倒计时', icon: 'hourglass-outline' }, { screen: 'plans', title: '方案', icon: 'barbell-outline' }, { screen: 'report', title: '战报', icon: 'stats-chart-outline' },
];
export function BottomNav() {
  const app = useRound();
  return <View style={s.nav}>{tabs.map(tab => <Pressable key={tab.screen} onPress={() => app.navigate(tab.screen)} accessibilityRole="button" accessibilityLabel={tab.title} accessibilityState={{ selected: app.screen === tab.screen }} style={s.navItem}>{tab.screen === 'home' ? <BoxingGloveIcon color={app.screen === tab.screen ? t.red : t.soft} /> : <Ionicons name={tab.icon} size={22} color={app.screen === tab.screen ? t.red : t.soft} />}<Text style={[s.caption, { color: app.screen === tab.screen ? t.red : t.soft }]}>{tab.title}</Text></Pressable>)}</View>;
}
// Google Material Symbols Outlined: sports_mma, as used by the original React navigation.
// Apache-2.0; source and license: assets/icons/NOTICE.md and LICENSE.
function BoxingGloveIcon({ color }: { color: string }) {
  return <Svg width={22} height={22} viewBox="0 -960 960 960" aria-hidden={true}><Path fill={color} d="M320-120q-17 0-28.5-11.5T280-160v-120h400v120q0 17-11.5 28.5T640-120H320Zm440-520v120q0 3-2 8l-30 152q-3 18-16.5 29T680-320H280q-18 0-31.5-11T232-360l-30-152q-2-5-2-8v-240q0-33 23.5-56.5T280-840h320q33 0 56.5 23.5T680-760v120q0-17 11.5-28.5T720-680q17 0 28.5 11.5T760-640ZM306-400h348l26-136v-24h-80v-200H280v224l26 136Zm14-160h240v-120H320v120Zm160-20Z" /></Svg>;
}
export function Card({ children, style, accent, prominent = false }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; accent?: string; prominent?: boolean }) {
  return <View style={[s.card, prominent && { backgroundColor: t.low, borderColor: accent ? `${accent}55` : t.border }, style]}>{children}</View>;
}
export function Label({ children, color = t.muted }: { children: React.ReactNode; color?: string }) { return <Text style={[s.label, { color }]}>{children}</Text>; }
export function IconLabel({ children, icon, color = t.muted }: { children: React.ReactNode; icon: Icon; color?: string }) { return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Ionicons name={icon} size={14} color={color} /><Label color={color}>{children}</Label></View>; }
export function Metric({ label, value, color = t.text, icon, iconColor = color, unit }: { label: string; value: string; color?: string; icon?: Icon; iconColor?: string; unit?: string }) { return <View style={s.metric}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>{icon && <Ionicons name={icon} size={14} color={iconColor} />}<Label color={t.soft}>{label}</Label></View><Text style={[s.metricValue, { color }]}>{value}{unit && <Text style={{ fontSize: 11, fontFamily: undefined, color: t.muted, fontWeight: '400' }}>  {unit}</Text>}</Text></View>; }

export { Dial } from './Dial';

export function BusyOverlay() { const app = useRound(); return <View accessibilityViewIsModal style={s.overlay}><View style={[s.card, { alignItems: 'center', gap: 16 }]}><ActivityIndicator color={t.red} size="large" /><Text style={s.body}>正在准备训练…</Text><Label>长训练方案需要稍等片刻</Label><Button title="取消准备" secondary onPress={() => { app.pause(); app.navigate('home'); }} /></View></View>; }

export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: t.bg }, content: { padding: 20, paddingBottom: 28, gap: 16, width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  heading: { color: t.text, fontSize: 23, fontWeight: '800', flex: 1 }, title: { color: t.text, fontSize: 25, fontWeight: '800' }, body: { color: t.text, fontSize: 15, lineHeight: 23 }, caption: { fontSize: 11, color: t.soft, lineHeight: 17 },
  label: { fontSize: 11, letterSpacing: .7, fontWeight: '600', lineHeight: 19 }, mono: { fontFamily: t.mono, fontVariant: ['tabular-nums'], color: t.text },
  card: { padding: 16, borderRadius: t.radius.card, backgroundColor: t.card, borderWidth: 1, borderColor: t.cardBorder, gap: 12, boxShadow: '0 4px 12px #00000026' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metric: { backgroundColor: '#1e1f25b3', padding: 12, borderRadius: t.radius.inset, flexGrow: 1, flexBasis: '45%', minWidth: 0, gap: 2, boxShadow: '0 2px 4px #00000012' }, metricValue: { fontFamily: t.mono, fontSize: 20 },
  button: { minHeight: 54, borderRadius: t.radius.control, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, buttonLabel: { fontSize: 16, fontWeight: '800', flexShrink: 1, textAlign: 'center' },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.raised, alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px #00000018' }, pressed: { opacity: .85, transform: [{ scale: .98 }] },
  nav: { flexDirection: 'row', width: '100%', maxWidth: 480, alignSelf: 'center', borderTopWidth: 1, borderTopColor: '#33353a77', paddingVertical: 10 }, navItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 3 },
  logo: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: t.red, alignItems: 'center', justifyContent: 'center' }, logoText: { color: t.text, fontWeight: '800', fontSize: 19 },
  dialTime: { color: t.text, fontFamily: t.mono, fontVariant: ['tabular-nums'], letterSpacing: -3, lineHeight: 85 }, fraction: { fontFamily: t.mono, letterSpacing: -1 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: '#0c0e13dd', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 },
});
