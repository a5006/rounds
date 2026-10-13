import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, Text, View, Switch, Alert, Linking, StyleSheet } from 'react-native';


import { useRound } from '../SessionProvider';
import { Button, Header, Card, Label, Dial, s } from '../ui';
import { theme as t } from '../theme';
import { formatDuration } from '../core/mobile-core.mjs';
import { previewAudio } from '../audio';
import type { Settings } from '../types';
import { useStopwatchReset } from '../useStopwatchReset';

const precise = (ms: number) => `${formatDuration(ms)}.${String(Math.floor(ms % 1000 / 10)).padStart(2, '0')}`;
export function StopwatchScreen() {
  const app = useRound(), watch = app.stopwatch;
  const [focus, setFocus] = useState(false);
  const reset = useStopwatchReset(app.stopwatchMs, app.resetStopwatch, app.toggleStopwatch);
  const best = watch.laps.length ? Math.min(...watch.laps.map(lap => lap.ms)) : 0;
  const bestLap = watch.laps.find(lap => lap.ms === best);
  const average = watch.laps.length ? watch.laps.reduce((sum, lap) => sum + lap.ms, 0) / watch.laps.length : 0;
  return <>{!focus && <Header title="STOPWATCH" audio />}<ScrollView contentContainerStyle={[s.content, focus && { flexGrow: 1, justifyContent: 'center' }]}>
    <View style={s.between}><Label>高精度竞技模式 · 1/100 SEC</Label><Button title={focus ? '退出专注' : '专注模式'} secondary color={t.amber} onPress={() => setFocus(!focus)} style={{ minHeight: 42, paddingHorizontal: 14 }} /></View>
    <Dial mode="stopwatch" running={watch.running} elapsedMs={reset.displayMs} resetFrom={reset.resetFrom} topContent={<View style={stopwatchStyles.lapBadge}><View style={stopwatchStyles.blueDot} /><Text style={stopwatchStyles.badgeLabel}>本圈用时</Text><Text style={stopwatchStyles.badgeTime}>{precise(Math.max(0, reset.displayMs - watch.lastLapMs))}</Text></View>} caption={<><Text style={{ color: t.muted }}>SPLIT-TIMER</Text><Text style={{ color: t.border }}>  ·  </Text><Text style={[s.mono, { color: t.amber, fontSize: 10 }]}>LAP #{String(watch.laps.length + 1).padStart(2, '0')}</Text></>} fraction />
    {!focus && <View style={stopwatchStyles.stats}>
      <View style={stopwatchStyles.stat}><View style={stopwatchStyles.statHeading}><Text style={stopwatchStyles.statLabel}>最快单圈</Text><Ionicons name="flash" size={12} color={t.blue} /></View><Text numberOfLines={1} adjustsFontSizeToFit style={[stopwatchStyles.statValue, { color: t.blue }]}>{bestLap ? precise(best) : '—'}</Text><Text style={stopwatchStyles.statCaption}>{bestLap ? `圈次 ${String(bestLap.id).padStart(2, '0')}` : '等待分圈'}</Text></View>
      <View style={stopwatchStyles.stat}><View style={stopwatchStyles.statHeading}><Text style={stopwatchStyles.statLabel}>平均圈速</Text><Ionicons name="time-outline" size={12} color={t.amber} /></View><Text numberOfLines={1} adjustsFontSizeToFit style={[stopwatchStyles.statValue, { color: t.amber }]}>{watch.laps.length ? precise(average) : '—'}</Text><Text style={stopwatchStyles.statCaption}>{watch.laps.length ? '已记录单圈的平均时间' : '开始后触击分圈'}</Text></View>
      <View style={stopwatchStyles.stat}><View style={stopwatchStyles.statHeading}><Text style={stopwatchStyles.statLabel}>记录圈数</Text><Ionicons name="list-outline" size={12} color={t.red} /></View><Text style={stopwatchStyles.statValue}>{String(watch.laps.length).padStart(2, '0')}<Text style={stopwatchStyles.lapsUnit}> LAPS</Text></Text><Text style={[stopwatchStyles.statCaption, { color: t.redLight }]}>{watch.running ? '正在计时…' : '已暂停'}</Text></View>
    </View>}
    <View style={s.row}><Button caption="LAP" title="分圈" icon="flag-outline" secondary color={t.soft} disabled={!watch.running} onPress={app.lap} style={{ flex: 1, minHeight: 64, paddingHorizontal: 10 }} /><Button caption={watch.running ? 'PAUSE · 运行' : 'START · 就绪'} title={watch.running ? '暂停' : '开始'} icon={watch.running ? 'pause' : 'play'} color={watch.running ? t.red : t.blueStrong} onPress={reset.toggleWithCancellation} style={{ flex: 1, minHeight: 64, paddingHorizontal: 10 }} /><Button caption="RESET" title="复位" icon="refresh-outline" secondary color={t.soft} onPress={reset.resetWithAnimation} style={{ flex: 1, minHeight: 64, paddingHorizontal: 10 }} /></View>
    {!focus && <Card><View style={s.between}><View style={[s.row, { gap: 8 }]}><View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: t.red }} /><Text style={[s.body, { fontWeight: '800' }]}>分圈成绩清单</Text></View><Label>累计分段 {watch.laps.length} 次</Label></View>{watch.laps.length === 0 ? <Label>开始计时后触击分圈</Label> : watch.laps.map(lap => { const isBest = lap.id === bestLap?.id; return <View key={lap.id} style={[s.between, stopwatchStyles.lapRow, { backgroundColor: isBest ? t.border : t.raised }]}>
      {isBest && <View style={stopwatchStyles.bestStripe} />}<View style={[s.row, { gap: 8, flex: 1 }]}><Text style={[stopwatchStyles.lapNumber, { backgroundColor: isBest ? t.blue : t.card, color: isBest ? '#00315c' : t.text }]}>{String(lap.id).padStart(2, '0')}</Text><View style={{ flex: 1 }}><Text style={[s.mono, { color: isBest ? t.blue : t.text, fontSize: 15 }]}>{precise(lap.ms)}</Text><Text style={stopwatchStyles.statCaption}>总时间 {precise(lap.totalMs)}</Text></View></View><View style={{ alignItems: 'flex-end', gap: 4 }}>{isBest ? <View style={stopwatchStyles.bestBadge}><Ionicons name="medal-outline" size={12} color={t.blue} /><Text style={{ color: t.blue, fontSize: 9 }}>最佳单圈</Text></View> : <Text style={[s.mono, { fontSize: 11, color: t.redLight }]}>+{precise(lap.ms - best)}</Text>}<Text style={stopwatchStyles.lapTag}>LAP {String(lap.id).padStart(2, '0')}</Text></View>
    </View>; })}</Card>}

  </ScrollView></>;
}

const options: { key: keyof Settings; title: string; caption: string }[] = [
  { key: 'earlyWarning', title: '结束前 10 秒敲板声', caption: '每回合一次 · 三下木板敲击' },
  { key: 'voiceAudio', title: '阶段语音', caption: '准备、训练、休息与倒计时报数' },
  { key: 'vibration', title: '触觉反馈', caption: '阶段切换与分圈时振动' },
  { key: 'keepAwake', title: '保持屏幕常亮', caption: '训练和秒表运行期间' },
  { key: 'backgroundAudio', title: '后台训练提示', caption: '锁屏后继续计时和播放声音' },
];
export function SettingsScreen() {
  const app = useRound();
  const preview = async (clip: 'bells' | 'clapper') => { try { await previewAudio(clip, app.settings.backgroundAudio); } catch { Alert.alert('试听失败', '请检查设备音量后重试。'); } };
  return <><Header title="训练设置" /><ScrollView contentContainerStyle={s.content}><Label color={t.redLight}>MAKE IT YOUR ROUND</Label>
    <Card>{options.map((option, i) => <View key={option.key} style={[s.between, { paddingVertical: 12 }, i > 0 && { borderTopWidth: 1, borderColor: t.border }]}><View style={{ flex: 1, minHeight: 64, paddingHorizontal: 10 }}><Text style={[s.body, { fontWeight: '800' }]}>{option.title}</Text><Label>{option.caption}</Label></View><Switch accessibilityLabel={option.title} value={app.settings[option.key]} onValueChange={value => app.setSettings({ ...app.settings, [option.key]: value })} trackColor={{ false: t.border, true: t.red }} thumbColor={t.text} /></View>)}</Card>
    <Button title="试听训练铃声" onPress={() => void preview('bells')} /><Button title="试听敲板声 · 最后 10 秒预警" secondary color={t.amber} onPress={() => void preview('clapper')} />
    <Button title={app.muted ? '取消全局静音' : '全局静音'} secondary icon={app.muted ? 'volume-high' : 'volume-mute'} onPress={app.toggleMute} />
  </ScrollView></>;
}

export { ReportScreen } from './ReportScreen';

export function CreditsScreen() {
  const app = useRound();
  return <><Header title="音效来源" /><ScrollView contentContainerStyle={s.content}><Card><Text style={[s.body, { fontWeight: '800' }]}>木板敲击实录</Text><Text style={s.body}>boardclapdry.wav · ashboy34</Text><Label>CC BY 3.0 · 原始录音剪辑、归一化并组合为三连击。</Label><Button title="查看原始录音" secondary onPress={() => void Linking.openURL('https://freesound.org/people/ashboy34/sounds/544885/')} /><Button title="查看授权条款" secondary onPress={() => void Linking.openURL('https://creativecommons.org/licenses/by/3.0/')} /></Card><Card><Text style={s.body}>电子滴声和铃声由项目生成，中文提示音随应用本地打包。</Text></Card><Button title="返回训练设置" secondary onPress={() => app.navigate('settings')} /></ScrollView></>;
}

const stopwatchStyles = StyleSheet.create({
  lapBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: '#1e1f25e6', boxShadow: '0 2px 4px #00000026' },
  blueDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: t.blue, boxShadow: '0 0 8px #2993f766' }, badgeLabel: { color: t.soft, fontSize: 9, fontWeight: '700' }, badgeTime: { color: t.blue, fontFamily: t.mono, fontSize: 9 },
  stats: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, minWidth: 0, backgroundColor: t.card, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.cardBorder, padding: 8, gap: 5, boxShadow: '0 3px 8px #00000026' },
  statHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 }, statLabel: { fontSize: 9, color: t.soft, flexShrink: 1 }, statValue: { fontFamily: t.mono, color: t.text, fontSize: 12, letterSpacing: -.4 }, lapsUnit: { color: t.soft, fontFamily: undefined, fontSize: 9 }, statCaption: { fontSize: 9, color: t.muted, lineHeight: 13 },
  lapRow: { padding: 10, borderRadius: t.radius.inset, overflow: 'hidden', gap: 6 }, bestStripe: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: t.blue }, lapNumber: { width: 28, height: 28, lineHeight: 28, textAlign: 'center', fontFamily: t.mono, fontSize: 11, borderRadius: 6 }, bestBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 99, backgroundColor: '#2993f733' }, lapTag: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: t.card, borderRadius: 99, fontSize: 8, color: t.soft },
});
