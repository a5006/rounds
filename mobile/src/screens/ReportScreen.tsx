import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRound } from '../SessionProvider';
import { Button, Header, Label, s } from '../ui';
import { theme as t } from '../theme';

import { reportSummary, countValue } from '../core/report.mjs';
import { ReportMetric, RoundChart, useReportEntrance } from '../report-ui';
import type { Report } from '../types';
import { MistBackground } from '../MistBackground';
import { captureReport, shareReportImage } from '../report-share';

function ReportContent({ report }: { report: Report }) {
  const app = useRound(), { progress, active, ready } = useReportEntrance();
  const [exporting, setExporting] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ uri: string; width: number; height: number } | null>(null);
  const poster = useRef<View>(null), size = useRef({ width: 0, height: 0 });
  const locked = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const { complete, percent } = reportSummary(report);
  const displayProgress = exporting ? 1 : progress;
  const share = async () => {
    if (locked.current) return;
    locked.current = true;
    setShareError(null);
    setExporting(true);
    try {
      // Commit final numbers/bars and stop decorative motion before rendering the full poster.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!mounted.current) return;
      const uri = await captureReport(poster, size.current);
      if (mounted.current && Platform.OS === 'web') setPreview({ uri, ...size.current });
      if (mounted.current) await shareReportImage(uri);
    } catch (error) {
      if (mounted.current && !(error instanceof Error && error.name === 'AbortError')) { setShareError(error instanceof Error ? error.message : '请稍后重试。'); Alert.alert('图片导出失败', error instanceof Error ? error.message : '请稍后重试。'); }
    } finally { locked.current = false; if (mounted.current) setExporting(false); }
  };
  return <>
    <View ref={poster} collapsable={false} testID="report-poster" onLayout={event => { const { width, height } = event.nativeEvent.layout; size.current = { width, height }; }} style={r.poster}>
    <View style={s.between}><Text style={r.brand}>ROUND PRO</Text><Label color={t.blue}>训练战报</Label></View>
    <View style={r.hero}><MistBackground mode="rest" running={!exporting} variant="hero" /><View style={r.medalRing}><LinearGradient colors={[t.blueStrong, t.amber]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={r.medal}><Ionicons name={complete ? 'ribbon-outline' : 'fitness-outline'} size={44} color={t.bg} /></LinearGradient><View style={r.badge}><Text style={r.badgeText}>{complete ? 'VICTORY' : 'SESSION'}</Text></View></View>
      <Text style={r.eyebrow}>{complete ? 'ROUND CHAMPION' : 'EVERY ROUND COUNTS'}</Text><Text style={r.title}>{complete ? '训练完成' : '训练已结束'}</Text><Label color={t.soft}>{complete ? '又一次超越自己' : '每一回合，都算数'}</Label><Label>{new Date(report.date).toLocaleDateString('zh-CN')}</Label>
    </View>
    <View style={s.grid}>
      <ReportMetric title="已完成回合" icon="barbell-outline" value={report.completedRounds} target={report.rounds} caption={`达成率 ${countValue(percent, displayProgress)}%`} color={t.blue} progress={displayProgress} />
      <ReportMetric title="有效训练时间" icon="stopwatch-outline" value={report.workMs} time caption="运动阶段累计" color={t.redLight} progress={displayProgress} />
      <ReportMetric title="间歇休息时间" icon="moon-outline" value={report.restMs} time caption="休息阶段累计" color={t.blue} progress={displayProgress} />
      <ReportMetric title="总训练耗时" icon="time-outline" value={report.elapsedMs} time caption="包含准备时间 · 不含暂停" color={t.amber} progress={displayProgress} />
    </View>
    <RoundChart records={report.roundRecords} active={active && !exporting} ready={ready || exporting} />
    <Text style={r.footer}>每一回合，都算数 · ROUND PRO</Text></View>
    <Button title={exporting ? "正在生成战报图片…" : "分享训练战报"} icon="share-social-outline" secondary color={t.amber} disabled={exporting} onPress={() => void share()} />
    {shareError && <Text accessibilityRole="alert" style={{ color: t.redLight, fontSize: 12 }}>{shareError}</Text>}
    <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}><View style={r.previewOverlay}><View style={r.previewPanel}><Text style={s.heading}>战报图片已生成</Text><ScrollView style={{ maxHeight: 480 }}>{preview && <Image testID="report-export-preview" source={{ uri: preview.uri }} resizeMode="contain" style={{ width: '100%', aspectRatio: preview.width / preview.height }} />}</ScrollView><Button title="下载战报图片" icon="download-outline" onPress={() => { if (preview) void shareReportImage(preview.uri).catch(() => setShareError('下载失败，请重试。')); }} /><Button title="关闭预览" secondary onPress={() => setPreview(null)} /></View></View></Modal>
    <Button title="再来一次" icon="refresh-outline" onPress={() => void app.start()} style={{ minHeight: 64 }} />
    <Button title="返回首页" icon="checkmark-circle-outline" secondary color={t.blue} onPress={() => app.navigate('home')} style={{ minHeight: 64 }} />
  </>;
}

export function ReportScreen() {
  const app = useRound();
  return <><Header title="训练战报" /><ScrollView contentContainerStyle={s.content}>{app.report ? <ReportContent key={app.report.date} report={app.report} /> : <><View style={r.hero}><Ionicons name="trophy-outline" size={65} color={t.amber} /><Text style={s.title}>开始记录你的训练</Text><Label>完成训练后在这里查看战报</Label></View><Button title="开始新的训练" icon="play" onPress={() => void app.start()} /></>}</ScrollView></>;
}

const r = StyleSheet.create({
  previewOverlay: { flex: 1, backgroundColor: '#000000bb', alignItems: 'center', justifyContent: 'center', padding: 20 }, previewPanel: { width: '100%', maxWidth: 400, padding: 16, borderRadius: t.radius.card, backgroundColor: t.bg, gap: 12 },
  poster: { gap: 16, backgroundColor: t.bg, padding: 16, marginHorizontal: -16 }, brand: { color: t.text, fontWeight: '900', fontSize: 15, letterSpacing: 2 }, footer: { color: t.muted, textAlign: 'center', fontSize: 10, paddingVertical: 8 },
  hero: { alignItems: 'center', gap: 9, paddingVertical: 24 }, medalRing: { width: 112, height: 112, borderRadius: 56, borderWidth: 5, borderColor: '#2993f744', backgroundColor: t.raised, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, medal: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' }, badge: { position: 'absolute', bottom: -12, backgroundColor: t.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 }, badgeText: { color: t.blue, letterSpacing: 2, fontSize: 11, fontWeight: '700' }, eyebrow: { color: t.blue, fontWeight: '800', fontSize: 12, letterSpacing: .8, backgroundColor: t.raised, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }, title: { color: t.text, fontSize: 34, fontWeight: '900' },
});
