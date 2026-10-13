import React, { useState } from 'react';
import { ScrollView, Text, View, Switch, Alert, Linking } from 'react-native';


import { useRound } from '../SessionProvider';
import { Button, Header, Card, Label, Metric, Dial, s } from '../ui';
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
  const average = watch.laps.length ? watch.laps.reduce((sum, lap) => sum + lap.ms, 0) / watch.laps.length : 0;
  return <>{!focus && <Header title="STOPWATCH" audio />}<ScrollView contentContainerStyle={[s.content, focus && { flexGrow: 1, justifyContent: 'center' }]}>
    <View style={s.between}><Label>高精度竞技模式 · 1/100 SEC</Label><Button title={focus ? '退出专注' : '专注模式'} secondary color={t.amber} onPress={() => setFocus(!focus)} style={{ minHeight: 42, paddingHorizontal: 14 }} /></View>
    <View style={{ alignItems: 'center' }}><Label color={t.amber}>本圈用时 {precise(Math.max(0, reset.displayMs - watch.lastLapMs))}</Label><Dial mode="stopwatch" running={watch.running} elapsedMs={reset.displayMs} resetFrom={reset.resetFrom} caption={`SPLIT TIMER · LAP ${String(watch.laps.length + 1).padStart(2, '0')}`} fraction /></View>
    {!focus && <View style={s.grid}><Metric label="最快单圈" value={best ? precise(best) : '—'} color={t.amber} /><Metric label="平均圈速" value={average ? precise(average) : '—'} color={t.amber} /></View>}
    <View style={s.row}><Button title="分圈" icon="flag" secondary color={t.amber} disabled={!watch.running} onPress={app.lap} style={{ flex: 1 }} /><Button title={watch.running ? '暂停' : '开始'} icon={watch.running ? 'pause' : 'play'} color={t.amber} onPress={reset.toggleWithCancellation} style={{ flex: 1 }} /><Button title="复位" icon="refresh" secondary color={t.amber} onPress={reset.resetWithAnimation} style={{ flex: 1 }} /></View>
    {!focus && <Card><View style={s.between}><Text style={[s.body, { fontWeight: '800' }]}>分圈成绩清单</Text><Label>{watch.laps.length} LAPS</Label></View>{watch.laps.length === 0 ? <Label>开始计时后触击分圈</Label> : watch.laps.map(lap => <View key={lap.id} style={[s.between, { borderTopWidth: 1, borderColor: t.border, paddingTop: 10 }]}><Label color={lap.ms === best ? t.amber : t.soft}>#{String(lap.id).padStart(2, '0')}{lap.ms === best ? ' · 最佳' : ''}</Label><Text style={[s.mono, { color: lap.ms === best ? t.amber : t.text }]}>{precise(lap.ms)}</Text><Label>{precise(lap.totalMs)}</Label></View>)}</Card>}
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
    <Card>{options.map((option, i) => <View key={option.key} style={[s.between, { paddingVertical: 12 }, i > 0 && { borderTopWidth: 1, borderColor: t.border }]}><View style={{ flex: 1 }}><Text style={[s.body, { fontWeight: '800' }]}>{option.title}</Text><Label>{option.caption}</Label></View><Switch accessibilityLabel={option.title} value={app.settings[option.key]} onValueChange={value => app.setSettings({ ...app.settings, [option.key]: value })} trackColor={{ false: t.border, true: t.red }} thumbColor={t.text} /></View>)}</Card>
    <Button title="试听训练铃声" onPress={() => void preview('bells')} /><Button title="试听敲板声 · 最后 10 秒预警" secondary color={t.amber} onPress={() => void preview('clapper')} />
    <Button title={app.muted ? '取消全局静音' : '全局静音'} secondary icon={app.muted ? 'volume-high' : 'volume-mute'} onPress={app.toggleMute} />
  </ScrollView></>;
}

export { ReportScreen } from './ReportScreen';

export function CreditsScreen() {
  const app = useRound();
  return <><Header title="音效来源" /><ScrollView contentContainerStyle={s.content}><Card><Text style={[s.body, { fontWeight: '800' }]}>木板敲击实录</Text><Text style={s.body}>boardclapdry.wav · ashboy34</Text><Label>CC BY 3.0 · 原始录音剪辑、归一化并组合为三连击。</Label><Button title="查看原始录音" secondary onPress={() => void Linking.openURL('https://freesound.org/people/ashboy34/sounds/544885/')} /><Button title="查看授权条款" secondary onPress={() => void Linking.openURL('https://creativecommons.org/licenses/by/3.0/')} /></Card><Card><Text style={s.body}>电子滴声和铃声由项目生成，中文提示音随应用本地打包。</Text></Card><Button title="返回训练设置" secondary onPress={() => app.navigate('settings')} /></ScrollView></>;
}
