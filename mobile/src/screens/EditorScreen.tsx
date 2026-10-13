import React, { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ParameterWheel, minuteItems, secondItems, roundItems } from '../ParameterWheel';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRound } from '../SessionProvider';
import { Button, Card, Header, Label, s } from '../ui';
import { theme as t } from '../theme';
import { formatDuration } from '../core/mobile-core.mjs';
import { PLAN_CATEGORIES, PLAN_COLORS } from '../core/plans.mjs';
import { PlanTimeline } from '../PlanTimeline';
import { previewAudio } from '../audio';
import { ConfirmDialog } from '../ConfirmDialog';
import type { Config, TrainingPlan } from '../types';

type Parameter = 'workSec' | 'restSec' | 'prepSec' | 'rounds';
const parameterIcons: Record<Parameter, ComponentProps<typeof Ionicons>['name']> = { workSec: 'fitness-outline', restSec: 'cafe-outline', prepSec: 'hourglass-outline', rounds: 'repeat-outline' };
const parameters: { key: Parameter; title: string; color: string; presets: number[] }[] = [
  { key: 'workSec', title: '训练时长', color: t.redLight, presets: [20, 60, 180, 300] },
  { key: 'restSec', title: '休息时长', color: t.blue, presets: [0, 15, 30, 60] },
  { key: 'prepSec', title: '准备时间', color: t.amber, presets: [0, 10, 15, 30] },
  { key: 'rounds', title: '训练回合', color: t.text, presets: [3, 5, 8, 12] },
];

export function EditorScreen() {
  const app = useRound();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const seed = app.plans.find(plan => plan.id === id);
  if (seed?.template) return <><Header title="预设方案" backScreen="plans" /><View style={s.content}><Text style={s.body}>预设模板需要复制后才能编辑。</Text><Button title="复制为副本" onPress={() => app.editPlan(app.copySavedPlan(seed.id).id)} /></View></>;
  return <PlanEditor key={id || 'new'} seed={seed} />;
}

function PlanEditor({ seed }: { seed?: TrainingPlan }) {
  const app = useRound();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Config>(seed?.config || app.config), [editing, setEditing] = useState<Parameter | null>(null), [value, setValue] = useState(0);
  const [name, setName] = useState(seed?.name || '');
  const category = seed?.category || PLAN_CATEGORIES[0];
  const color = seed?.color || PLAN_COLORS[0];
  const [vibration, setVibration] = useState(seed?.vibration ?? app.settings.vibration), [volume, setVolume] = useState(seed?.volume ?? 1);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false), live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const parameter = parameters.find(p => p.key === editing);
  const select = (key: Parameter) => { setValue(draft[key]); setEditing(key); };
  const save = async () => {
    if (saveLock.current) return;
    saveLock.current = true; setSaving(true);
    try { await app.savePlan({ id: seed?.id || '', name, category, color, config: draft, vibration, volume, showOnHome: seed?.showOnHome || false, template: false }); if (live.current) app.navigate('plans'); }
    catch (error) { if (live.current) Alert.alert('无法保存', error instanceof Error ? error.message : '请检查方案内容和设备存储空间。'); }
    finally { saveLock.current = false; if (live.current) setSaving(false); }
  };
  const preview = async () => { try { await previewAudio('bells', app.settings.backgroundAudio, app.muted ? 0 : volume); } catch { Alert.alert('试听失败', '请检查设备音量后重试。'); } };
  return <><Header title={seed ? '编辑训练方案' : '新建训练方案'} backScreen="plans" /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    <Card><Label color={color}>ROUTINE CONFIG</Label><Label>方案名称</Label><TextInput accessibilityLabel="方案名称" value={name} onChangeText={setName} maxLength={40} placeholder="给这套训练起个名字" placeholderTextColor={t.muted} style={local.input} />
    </Card>
    <PlanTimeline config={draft} />
    <View style={s.between}><Text style={[s.body, { fontSize: 18, fontWeight: '800' }]}>核心训练参数</Text><Label>轻触数值调整</Label></View>
    {[...parameters].sort((a, b) => ['workSec', 'restSec', 'rounds', 'prepSec'].indexOf(a.key) - ['workSec', 'restSec', 'rounds', 'prepSec'].indexOf(b.key)).map(p => <Pressable key={p.key} style={({ pressed }) => pressed && s.pressed} accessibilityRole="button" accessibilityLabel={`编辑${p.title}`} onPress={() => select(p.key)}><Card><View style={[s.between, { gap: 8 }]}><View style={{ flex: 1, minWidth: 0, gap: 5 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Ionicons name={parameterIcons[p.key]} size={17} color={p.color} /><Text style={{ color: p.color, fontSize: 16, fontWeight: '800' }}>{p.title}</Text></View><Text style={local.parameterCaption}>{p.key === 'workSec' ? '单回合高强度训练时间' : p.key === 'restSec' ? '回合间恢复与调整' : p.key === 'rounds' ? '支持 1–30 回合' : '训练前缓冲与就位'}</Text></View><View style={[local.parameterValue, { borderColor: `${p.color}33` }]}><Text style={[s.mono, { fontSize: 26, color: p.color }]}>{p.key === 'rounds' ? draft[p.key] : formatDuration(draft[p.key] * 1000)}</Text>{p.key === 'rounds' && <Text style={{ color: p.color, fontSize: 11 }}>轮</Text>}<Ionicons name="options-outline" size={15} color={p.color} /></View></View></Card></Pressable>)}
    <View style={s.between}><Text style={[s.body, { fontSize: 18, fontWeight: '800' }]}>声音与体感</Text><Label>方案独立设置</Label></View>
    <Card><View style={s.between}><View style={[s.row, { flex: 1 }]}><Ionicons name="flag-outline" size={21} color={t.redLight} /><View style={{ flex: 1 }}><Text style={s.body}>末局不进入休息</Text><Label>最后一回合结束后直接完成训练</Label></View></View><Switch accessibilityLabel="最后一回合后免休息" value={draft.noRestLast} onValueChange={value => setDraft({ ...draft, noRestLast: value })} trackColor={{ false: t.border, true: t.red }} thumbColor={t.text} /></View><View style={s.between}><View style={{ flex: 1 }}><View style={s.row}><Ionicons name="phone-portrait-outline" size={20} color={color} /><Text style={s.body}>阶段切换震动</Text></View><Label>此方案独立设置</Label></View><Switch accessibilityLabel="方案震动" value={vibration} onValueChange={setVibration} trackColor={{ false: t.border, true: color }} thumbColor={t.text} /></View>
      <View style={s.between}><View style={s.row}><Ionicons name="volume-high-outline" size={20} color={color} /><Text style={s.body}>提示音量</Text></View><Text style={[s.mono, { color }]}>{Math.round(volume * 100)}%</Text></View>
      <Slider accessibilityLabel="方案提示音量" accessibilityValue={{ min: 0, max: 100, now: Math.round(volume * 100), text: `${Math.round(volume * 100)}%` }} minimumValue={0} maximumValue={1} step={.05} value={volume} onValueChange={setVolume} minimumTrackTintColor={color} maximumTrackTintColor={t.border} thumbTintColor={color} style={{ height: 40, width: '100%' }} />
      <Label>准备／休息结束用滴声，进入休息／训练结束用铃声</Label><Button title="试听提示音" icon="volume-high-outline" secondary color={color} disabled={app.session.running || app.busy} onPress={() => void preview()} />
    </Card>
    <Button title={saving ? '正在保存并准备音频…' : '保存训练方案'} icon="checkmark" disabled={saving || !name.trim()} onPress={() => void save()} />
    {seed && <Button title="删除此方案" icon="trash-outline" secondary color={t.redLight} onPress={() => setDeleting(true)} />}
  </ScrollView>
    <Modal visible={editing !== null} transparent animationType="slide" onRequestClose={() => setEditing(null)}><View style={[local.modal, { paddingTop: insets.top + 12 }]}><Pressable accessibilityLabel="取消参数编辑" style={StyleSheet.absoluteFill} onPress={() => setEditing(null)} /><ScrollView style={local.sheet} contentContainerStyle={[local.sheetContent, { paddingBottom: Math.max(24, insets.bottom + 16) }]} bounces={false}>
      <View style={s.between}><Pressable accessibilityRole="button" onPress={() => setEditing(null)} style={local.action}><Text style={{ color: t.soft }}>取消</Text></Pressable><Text numberOfLines={1} style={local.sheetTitle}>{parameter?.title}</Text><Pressable accessibilityRole="button" disabled={editing === 'workSec' && value < 5} onPress={() => { if (editing) setDraft({ ...draft, [editing]: value }); setEditing(null); }} style={local.action}><Text style={{ color: editing === 'workSec' && value < 5 ? t.muted : t.redLight, fontWeight: '800' }}>确定</Text></Pressable></View>
      <View style={[s.row, { justifyContent: 'center', flexWrap: 'wrap' }]}>{parameter?.presets.map(p => <Pressable key={p} accessibilityRole="button" accessibilityLabel={`预设${editing === 'rounds' ? `${p}回合` : formatDuration(p * 1000)}`} onPress={() => setValue(p)} style={[local.preset, { borderColor: value === p ? parameter.color : t.border }]}><Text style={{ color: parameter.color }}>{editing === 'rounds' ? `${p} 回合` : formatDuration(p * 1000)}</Text></Pressable>)}</View>
      {parameter && (editing === 'rounds' ? <View><ParameterWheel label="回合" data={roundItems} value={value} color={parameter.color} onChange={setValue} /><Label>支持 1～30 回合</Label></View> : <View style={s.row}><ParameterWheel label="分钟" data={minuteItems} value={Math.floor(value / 60)} color={parameter.color} onChange={minute => setValue(current => minute * 60 + current % 60)} /><Text style={[s.mono, { fontSize: 28, color: parameter.color, marginTop: 26 }]}>:</Text><ParameterWheel label="秒" data={secondItems} value={value % 60} color={parameter.color} onChange={second => setValue(current => Math.floor(current / 60) * 60 + second)} /></View>)}
    </ScrollView></View></Modal>
    {deleting && seed && <ConfirmDialog title="删除这个方案？" message="已有训练记录和正在进行的训练会保留。" confirm="确认删除" onCancel={() => setDeleting(false)} onConfirm={() => { app.deletePlan(seed.id); setDeleting(false); app.navigate('plans'); }} />}
  </>;
}
const local = StyleSheet.create({ parameterCaption: { color: t.muted, fontSize: 10, lineHeight: 16 }, parameterValue: { minWidth: 104, minHeight: 46, paddingHorizontal: 8, gap: 5, borderRadius: 12, borderWidth: 1, backgroundColor: t.bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, input: { color: t.text, backgroundColor: t.low, borderWidth: 1, borderColor: t.border, borderRadius: t.radius.inset, padding: 14, fontSize: 17, minHeight: 50 }, color: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, modal: { flex: 1, backgroundColor: '#0009', justifyContent: 'flex-end' }, sheet: { flexGrow: 0, flexShrink: 1, backgroundColor: t.low, borderTopLeftRadius: t.radius.sheet, borderTopRightRadius: t.radius.sheet, width: '100%', maxWidth: 480, alignSelf: 'center' }, sheetContent: { padding: 20, gap: 20 }, sheetTitle: { flex: 1, minWidth: 0, textAlign: 'center', color: t.text, fontSize: 18, fontWeight: '800' }, action: { width: 60, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, preset: { paddingVertical: 9, paddingHorizontal: 14, borderWidth: 1, borderRadius: t.radius.control, backgroundColor: t.raised } });
