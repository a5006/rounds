import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { planTimeline } from './core/plan-timeline.mjs';
import { formatDuration } from './core/mobile-core.mjs';
import { theme as t } from './theme';
import type { Config } from './types';

type Phase = 'prep' | 'work' | 'rest';
const colors: Record<Phase, string> = { prep: t.amber, work: t.red, rest: t.blueStrong };
const labels: Record<Phase, string> = { prep: '准备', work: '训练', rest: '休息' };
export function PlanTimeline({ config }: { config: Config }) {
  const timeline = planTimeline(config);
  const summary = (['prep', 'work', 'rest'] as const).map(phase => `${labels[phase]} ${formatDuration(timeline.totals[phase])}`).join('，');
  return <View style={styles.summary} testID="plan-timeline">
    <View style={styles.header}><View style={styles.label}><Ionicons name="time-outline" size={16} color={t.redLight} /><Text style={styles.heading}>预计总时长</Text></View><View style={styles.total}><Text style={styles.time} testID="timeline-total">{formatDuration(timeline.totalMs)}</Text><Text style={styles.unit}>MIN:SEC</Text></View></View>
    <View accessible accessibilityLabel={`训练时间轴：${summary}`} style={styles.track} testID="timeline-track">
      {timeline.segments.map((segment: { phase: Phase; durationMs: number; round: number }, index: number) => <View key={`${segment.phase}-${segment.round}`} style={{ width: `${segment.durationMs / Math.max(1, timeline.totalMs) * 100}%`, height: '100%', backgroundColor: colors[segment.phase] }}>{index > 0 && <View style={styles.divider} />}</View>)}
    </View>
    <View style={styles.legend}>{(['prep', 'work', 'rest'] as const).map(phase => <View key={phase} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors[phase] }]} /><Text style={styles.legendText}>{labels[phase]} {formatDuration(timeline.totals[phase])}</Text></View>)}</View>
  </View>;
}
const styles = StyleSheet.create({
  summary: { backgroundColor: t.card, borderRadius: t.radius.card, padding: 16, gap: 12, borderWidth: 1, borderColor: t.cardBorder },
  header: { gap: 8 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 5 }, heading: { fontSize: 11, color: t.soft },
  total: { flexDirection: 'row', alignItems: 'baseline', gap: 5, alignSelf: 'flex-start' }, time: { fontFamily: t.mono, fontSize: 48, lineHeight: 56, color: t.text }, unit: { fontSize: 9, color: t.muted },
  track: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: t.border },
  divider: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 1, backgroundColor: '#0c0e1380' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, dot: { width: 6, height: 6, borderRadius: 3 }, legendText: { color: t.soft, fontSize: 10 },
});
