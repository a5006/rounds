import React from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useRound } from '../SessionProvider';
import { Button, Header, Card, Label, Metric, Dial, s } from '../ui';
import { theme as t } from '../theme';
import { formatDuration } from '../core/mobile-core.mjs';
import { homePlans } from '../core/plans.mjs';
import type { TrainingPlan } from '../types';

export function HomeScreen() {
  const app = useRound();
  const active = app.session.config && !['idle', 'done'].includes(app.session.phase);
  const c = active ? app.session.config! : app.selectedPlan?.config || app.config;
  const visiblePlans = homePlans(app.plans) as TrainingPlan[];
  const totalMs = (c.workSec * c.rounds + c.restSec * (c.rounds - (c.noRestLast ? 1 : 0))) * 1000;
  const currentPlan = active ? app.sessionPlan : app.selectedPlan;
  const accent = currentPlan?.color || t.red;
  return <><Header title="ROUND PRO" back={false} /><ScrollView contentContainerStyle={s.content}>
    <View><Label color={t.redLight}>PRO HUD</Label><Text style={[s.body, { color: t.redLight }]}>每一回合，都值得全力以赴</Text></View>
    <Card prominent style={local.hero}>
      <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill, { borderRadius: t.radius.card, overflow: 'hidden' }]}><Svg width="100%" height="100%"><Defs><RadialGradient id="hero-red" cx="100%" cy="0%" rx="85%" ry="90%"><Stop offset="0" stopColor={accent} stopOpacity=".15" /><Stop offset="1" stopColor={accent} stopOpacity="0" /></RadialGradient><RadialGradient id="hero-blue" cx="0%" cy="100%" rx="70%" ry="65%"><Stop offset="0" stopColor={t.blueStrong} stopOpacity=".1" /><Stop offset="1" stopColor={t.blueStrong} stopOpacity="0" /></RadialGradient></Defs><Rect width="100%" height="100%" fill="url(#hero-red)" /><Rect width="100%" height="100%" fill="url(#hero-blue)" /></Svg></View>
      <View style={local.heroHeader}><View style={{ flexGrow: 1, flexBasis: '65%', gap: 4 }}><View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}><View style={[local.statusDot, { backgroundColor: active ? accent : t.redLight }]} /><Text style={local.eyebrow}>CURRENT ACTIVE ROUTINE</Text></View><Text style={[s.title, { fontSize: 24 }]}>{currentPlan?.name || '自定义训练方案'}</Text></View><View style={local.badge}><Ionicons name="medal-outline" size={13} color={t.amber} /><Text style={local.badgeText}>{currentPlan?.category || '自定义'}</Text></View></View>
      <View accessible accessibilityLabel={active ? `第 ${app.session.round} 回合，共 ${c.rounds} 回合，已完成 ${app.session.completedRounds} 回合` : `共 ${c.rounds} 回合，尚未开始`} style={local.roundTrack}>{Array.from({ length: c.rounds }, (_, i) => { const completed = active && i < app.session.completedRounds; const current = active && i + 1 === app.session.round; return <View key={i} style={[local.roundSegment, { backgroundColor: completed ? t.redLight : current ? accent : t.border }, (completed || current) && { boxShadow: `0 0 8px ${accent}66` }]} />; })}</View>
      <View style={s.grid}><Metric icon="fitness-outline" iconColor={t.redLight} label="训练时长" value={formatDuration(c.workSec * 1000)} /><Metric icon="hourglass-outline" label="间歇休息" value={formatDuration(c.restSec * 1000)} color={t.blue} /><Metric icon="repeat-outline" iconColor={t.amber} label="总回合数" value={String(c.rounds)} unit="ROUNDS" /><Metric icon="time-outline" iconColor={t.soft} label="有效时长" value={formatDuration(totalMs)} /></View>
      <Button title={app.busy ? '正在准备训练…' : active ? '继续当前训练' : '开始训练'} style={{ marginTop: 8 }} disabled={app.busy} icon="play-outline" onPress={() => { if (active) { app.navigate('training'); if (!app.session.running) void app.resume(); } else void app.start(); }} />
    </Card>
    <View style={s.between}><View style={s.row}><View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: t.redLight }} /><Text style={[s.title, { fontSize: 20 }]}>快捷方案</Text></View><Label>即选即练</Label></View>
    {visiblePlans.length === 0 && <Card><Text style={s.body}>首页暂未展示方案</Text><Label>到方案库点亮房屋图标即可添加</Label></Card>}
    {visiblePlans.map(plan => <Pressable key={plan.id} style={({ pressed }) => pressed && s.pressed} onPress={() => void app.startPlan(plan)} accessibilityRole="button" accessibilityLabel={`开始${plan.name}`}><Card accent={plan.color}><View style={s.row}><View style={[local.presetIcon, { backgroundColor: `${plan.color}26` }]}><MaterialCommunityIcons name={plan.category === '敏捷训练' ? 'run-fast' : plan.category === 'HIIT 间歇' ? 'lightning-bolt' : 'boxing-glove'} size={27} color={plan.color} /></View><View style={{ flex: 1 }}><Text style={[s.body, { fontWeight: '800' }]}>{plan.name}</Text><Label color={t.soft}>{formatDuration(plan.config.workSec * 1000)} 训练 · {formatDuration(plan.config.restSec * 1000)} 休息 · {plan.config.rounds} 回合</Label></View><View style={local.quickArrow}><Ionicons name="arrow-forward" size={20} color={plan.color} /></View></View></Card></Pressable>)}
    <Button title="管理训练方案" icon="barbell-outline" secondary onPress={() => app.navigate('plans')} />
  </ScrollView></>;
}

export function TrainingScreen() {
  const app = useRound(), { session } = app;
  const c = session.config || app.config;
  if (session.phase === 'idle') return <><Header title="训练计时" /><View style={[s.content, { flex: 1, justifyContent: 'center' }]}><Text style={s.title}>准备开始下一回合</Text><Button title="开始训练" icon="play" onPress={() => void app.start()} /></View></>;
  if (session.phase === 'done') return <><Header title="训练完成" audio /><View style={[s.content, { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 26 }]}><Ionicons name="trophy" size={78} color={t.amber} /><Text style={s.title}>每一回合，都算数</Text><Label>完成 {session.completedRounds} 回合 · 总用时 {formatDuration(session.elapsedMs)}</Label><Button title="查看训练战报" icon="stats-chart" onPress={() => app.navigate('report')} style={{ alignSelf: 'stretch' }} /></View></>;
  const paused = !session.running;
  const color = session.phase === 'work' ? t.red : session.phase === 'rest' ? t.blue : t.amber;
  const title = paused ? 'PAUSED · 已暂停' : session.phase === 'work' ? 'FIGHT · 训练中' : session.phase === 'rest' ? 'REST · 休息中' : 'GET READY · 准备开始';
  return <><Header title={paused ? '已暂停' : session.phase === 'rest' ? '休息中' : session.phase === 'work' ? '训练中' : '准备中'} audio /><ScrollView contentContainerStyle={[s.content, { flexGrow: 1, alignItems: 'stretch' }]}>
    <View style={{ alignItems: 'center' }}><Text style={[s.title, { fontSize: 21, color }]}>{title}</Text><Label>第 {session.round} / {c.rounds} 回合</Label></View>
    <Dial transitionKey={`${session.phase}:${session.round}`} mode={session.phase} running={session.running} remainingMs={session.remainingMs} durationMs={session.durationMs} caption={session.phase === 'work' ? '本回合剩余时间' : session.phase === 'rest' ? '休息剩余时间' : '准备倒计时'} />
    <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'center', gap: 6 }]}>{Array.from({ length: c.rounds }, (_, i) => <View key={i} style={{ width: 18, height: 6, borderRadius: 3, backgroundColor: i < session.completedRounds ? t.text : i + 1 === session.round ? color : t.border }} />)}</View>
    {session.phase === 'rest' ? <Card accent={t.blue}><View style={s.between}><Text style={[s.body, { fontWeight: '800' }]}>第 {session.completedRounds} / {c.rounds} 回合已完成</Text><Ionicons name="checkmark-circle" size={21} color={t.blue} /></View><View style={s.between}><Label>下一阶段：{session.round < c.rounds ? `第 ${session.round + 1} 回合` : '训练完成'}</Label><Text style={[s.mono, { color: t.redLight }]}>{formatDuration(c.workSec * 1000)}</Text></View></Card> : <View style={{ alignItems: 'center' }}><Label>总用时 {formatDuration(session.elapsedMs)}</Label></View>}
    <View style={{ flex: 1, minHeight: 6 }} />
    {paused ? <><Button title={app.busy ? '正在准备训练…' : '继续训练'} disabled={app.busy} icon="play" color={color} onPress={() => void app.resume()} /><View style={s.row}><Button stacked title="重置本阶段" disabled={app.busy} icon="refresh" secondary color={color} style={{ flex: 1 }} onPress={() => void app.resetPhase()} /><Button stacked title="结束训练" icon="stop" secondary style={{ flex: 1 }} onPress={app.finish} /></View></> : session.phase === 'prep' ? <Button title="跳过准备，直接开练" icon="play" color={t.amber} onPress={() => void app.skip()} /> : <><View style={s.row}><Button title="+15 秒" disabled={app.busy} secondary color={color} onPress={() => void app.extend(15000)} style={{ flex: 1 }} />{session.phase === 'rest' && <Button title="+30 秒" disabled={app.busy} secondary color={color} onPress={() => void app.extend(30000)} style={{ flex: 1 }} />}</View><View style={s.row}><Button stacked title="暂停" icon="pause" color={color} style={{ flex: 1 }} onPress={app.pause} /><Button stacked title={session.phase === 'rest' ? '开始下一阶段' : '下一阶段'} icon="play-skip-forward" secondary color={color} style={{ flex: 1 }} onPress={() => void app.skip()} /></View></>}
  </ScrollView></>;
}
const local = StyleSheet.create({
  hero: { padding: 24, gap: 16, position: 'relative', boxShadow: '0 8px 24px #00000033' },
  heroHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  statusDot: { width: 7, height: 7, borderRadius: 4 }, eyebrow: { color: t.redLight, fontSize: 10, letterSpacing: .8, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: t.raised }, badgeText: { color: t.amberLight, fontSize: 10, fontWeight: '700' },
  roundTrack: { flexDirection: 'row', gap: 4, paddingVertical: 6 }, roundSegment: { flex: 1, height: 6, borderRadius: 3 },
  quickArrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.raised, alignItems: 'center', justifyContent: 'center' },
  presetIcon: { width: 48, height: 48, borderRadius: t.radius.inset, alignItems: 'center', justifyContent: 'center' },
});
