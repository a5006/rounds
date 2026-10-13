import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRound } from '../SessionProvider';
import { Button, Card, Header, IconButton, IconLabel, Label, s } from '../ui';
import { ConfirmDialog } from '../ConfirmDialog';
import { formatDuration } from '../core/mobile-core.mjs';
import { planDurationMs } from '../core/plans.mjs';
import { theme as t } from '../theme';
import type { TrainingPlan } from '../types';

type Filter = 'all' | 'custom' | 'template' | 'home';
const filters: { key: Filter; title: string }[] = [{ key: 'all', title: '全部' }, { key: 'custom', title: '自定义' }, { key: 'template', title: '预设模板' }, { key: 'home', title: '首页展示' }];
export function PlansScreen() {
  const app = useRound();
  const [filter, setFilter] = useState<Filter>('all'), [deleting, setDeleting] = useState<TrainingPlan | null>(null);
  const matches = (plan: TrainingPlan, key: Filter) => key === 'all' || (key === 'custom' && !plan.template) || (key === 'template' && plan.template) || (key === 'home' && plan.showOnHome);
  const rows = app.plans.filter(plan => matches(plan, filter)).sort((a, b) => Number(b.id === app.selectedPlan?.id) - Number(a.id === app.selectedPlan?.id));
  const start = (plan: TrainingPlan) => { void app.startPlan(plan); };
  return <><Header title="训练方案库" /><ScrollView contentContainerStyle={s.content}>
    <View style={s.between}><Label color={t.redLight}>TRAINING PLANS</Label><Label>共 {app.plans.length} 套方案</Label></View>
    <Button title="新增自定义方案" icon="add-circle-outline" onPress={() => app.editPlan()} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{filters.map(item => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: filter === item.key }} onPress={() => setFilter(item.key)} style={[styles.chip, { backgroundColor: filter === item.key ? t.text : t.raised }]}><Text style={{ color: filter === item.key ? t.bg : t.soft, fontSize: 12 }}>{item.title} {app.plans.filter(plan => matches(plan, item.key)).length}</Text></Pressable>)}</ScrollView>
    {rows.length === 0 && <Card><Text style={s.body}>这里还没有方案</Text><Label>{filter === 'home' ? '点击方案右上角的房屋图标即可在首页展示' : '创建一套专属训练节奏'}</Label></Card>}
    {rows.map(plan => <Card key={plan.id} accent={plan.color} prominent={app.selectedPlan?.id === plan.id} style={{ borderColor: app.selectedPlan?.id === plan.id ? plan.color : t.border }}>
      <View style={s.between}><View style={{ flex: 1, gap: 5 }}><IconLabel icon="repeat-outline" color={plan.color}>{plan.template ? 'PRESET · 预设模板' : 'CUSTOM · 自定义'} · {plan.config.rounds} 回合</IconLabel><Text style={[s.title, { fontSize: 21 }]}>{plan.name}</Text></View><IconButton icon={plan.showOnHome ? 'home' : 'home-outline'} color={plan.showOnHome ? plan.color : t.muted} label={`${plan.showOnHome ? '从首页隐藏' : '在首页展示'}${plan.name}`} onPress={() => app.toggleHomeVisibility(plan.id)} /></View>
      <IconLabel icon="time-outline">{plan.category} · {formatDuration(planDurationMs(plan.config))}</IconLabel>
      {app.audioStatus[plan.id] === 'preparing' && <IconLabel icon="hourglass-outline">正在准备训练音频…</IconLabel>}
      {app.audioStatus[plan.id] === 'error' && <IconLabel icon="alert-circle-outline" color={t.amber}>音频准备失败，启动时会重试</IconLabel>}
      <View style={styles.metrics}>{[{ label: '训练', icon: 'fitness-outline' as const, seconds: plan.config.workSec, color: t.redLight }, { label: '休息', icon: 'cafe-outline' as const, seconds: plan.config.restSec, color: t.blue }, { label: '准备', icon: 'hourglass-outline' as const, seconds: plan.config.prepSec, color: t.amber }].map(metric => <View key={metric.label} style={styles.metric}><IconLabel icon={metric.icon} color={metric.color}>{metric.label}</IconLabel><Text style={[s.mono, { fontSize: 18, color: metric.color }]}>{formatDuration(metric.seconds * 1000)}</Text></View>)}</View>
      <View style={s.row}><Button title={plan.template ? '复制为副本' : '编辑方案'} icon={plan.template ? 'copy-outline' : 'create-outline'} secondary color={plan.color} style={{ flex: 1, paddingHorizontal: 10 }} onPress={() => { if (plan.template) app.editPlan(app.copySavedPlan(plan.id).id); else app.editPlan(plan.id); }} /><Button title="启动" icon="play" color={plan.color} style={{ flex: 1 }} onPress={() => start(plan)} /></View>
      <View style={s.between}><Pressable accessibilityRole="button" accessibilityLabel={`${app.selectedPlan?.id === plan.id ? '当前方案' : '设为当前方案'}：${plan.name}`} accessibilityState={{ selected: app.selectedPlan?.id === plan.id }} onPress={() => app.selectPlan(plan.id)} style={styles.selectionAction}><Ionicons name={app.selectedPlan?.id === plan.id ? 'checkmark-circle' : 'radio-button-off-outline'} size={19} color={app.selectedPlan?.id === plan.id ? plan.color : t.soft} /><Text style={{ color: app.selectedPlan?.id === plan.id ? plan.color : t.soft, fontSize: 12 }}>{app.selectedPlan?.id === plan.id ? '当前方案' : '设为当前'}</Text></Pressable>{!plan.template && <View style={s.row}><Pressable accessibilityRole="button" accessibilityLabel={`复制${plan.name}`} onPress={() => app.editPlan(app.copySavedPlan(plan.id).id)} style={styles.textAction}><Ionicons name="copy-outline" size={18} color={t.soft} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`删除${plan.name}`} onPress={() => setDeleting(plan)} style={styles.textAction}><Ionicons name="trash-outline" size={18} color={t.redLight} /></Pressable></View>}</View>
    </Card>)}
  </ScrollView>
    {deleting && <ConfirmDialog title="删除这个方案？" message={`「${deleting.name}」将从本机方案库移除，已有训练记录和正在进行的训练会保留。`} confirm="确认删除" onCancel={() => setDeleting(null)} onConfirm={() => { app.deletePlan(deleting.id); setDeleting(null); }} />}
  </>;
}
const styles = StyleSheet.create({ selectionAction: { minHeight: 44, flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 4 }, chip: { borderRadius: t.radius.control, paddingHorizontal: 14, paddingVertical: 10 }, metrics: { flexDirection: 'row', gap: 6 }, metric: { flex: 1, minWidth: 0, padding: 10, gap: 4, borderRadius: t.radius.inset, backgroundColor: t.low }, textAction: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 4 } });
