import React, { memo, useEffect, useRef, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { barDelay, countValue, reportColumns } from './core/report.mjs';
import { formatDuration } from './core/mobile-core.mjs';
import { useMotionPreferences } from './useMotionClock';
import { Card, Label, s } from './ui';
import { theme as t } from './theme';

export function useReportEntrance() {
  const { active, ready } = useMotionPreferences(true);
  const finished = useRef(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!ready) return;
    if (!active || finished.current) {
      finished.current = true;
      const frame = requestAnimationFrame(() => setProgress(1));
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0, start: number | null = null, last = -40;
    const tick = (now: number) => {
      start ??= now;
      const elapsed = now - start;
      if (elapsed - last >= 32 || elapsed >= 700) {
        const linear = Math.min(1, elapsed / 700);
        setProgress(1 - (1 - linear) ** 3);
        if (linear === 1) finished.current = true;
        last = elapsed;
      }
      if (elapsed < 700) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); if (start !== null) { finished.current = true; setProgress(1); } };
  }, [active, ready]);
  return { progress: !ready ? 0 : (!active ? 1 : progress), active, ready };
}

type Icon = ComponentProps<typeof Ionicons>['name'];
export function ReportMetric({ title, icon, value, time, target, caption, color, progress }: {
  title: string; icon: Icon; value: number; time?: boolean; target?: number; caption: string; color: string; progress: number;
}) {
  const displayed = countValue(value, progress);
  const final = time ? formatDuration(value) : `${value}/${target}`;
  return <View style={r.metric} accessible accessibilityLabel={`${title} ${final}，${caption}`}>
    <View style={s.between}><Text style={r.metricTitle}>{title}</Text><Ionicons name={icon} size={22} color={color} /></View>
    <Text testID={`report-value-${time ? title : 'rounds'}`} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={.55} style={[r.value, { color }]}>{time ? formatDuration(displayed) : displayed}{target !== undefined && <Text style={r.target}> / {target}</Text>}</Text>
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} /><Text style={r.caption}>{caption}</Text></View>
  </View>;
}

function RoundBar({ round, ms, ratio, count, active, ready }: { round: number; ms: number; ratio: number; count: number; active: boolean; ready: boolean }) {
  const growth = useSharedValue(0);
  const started = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (active && !started.current) {
      growth.value = withDelay(barDelay(round - 1, count), withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    } else { growth.value = 1; started.current = true; }
    const frame = requestAnimationFrame(() => { started.current = true; });
    return () => { cancelAnimationFrame(frame); cancelAnimation(growth); };
  }, [active, ready, count, round, growth]);
  const style = useAnimatedStyle(() => ({ opacity: growth.value, transform: [{ translateY: 52 * ratio * (1 - growth.value) }, { scaleY: growth.value }] }));
  return <View style={r.column} accessible accessibilityLabel={`第 ${round} 回合训练用时 ${formatDuration(ms)}`}>
    <View style={r.barTrack}><Animated.View testID={`report-bar-${round}`} style={[r.bar, { height: 104 * ratio }, style]} />{ms === 0 && <View style={r.zero} />}</View>
  </View>;
}

export const RoundChart = memo(function RoundChart({ records, active, ready }: { records: number[]; active: boolean; ready: boolean }) {
  const columns = reportColumns(records) as { round: number; ms: number; ratio: number }[];
  const gap = columns.length > 15 ? 2 : columns.length > 8 ? 4 : 6;
  return <Card style={{ backgroundColor: t.raised }}><View style={s.between}><View style={s.row}><Ionicons name="stats-chart" size={18} color={t.red} /><Text style={[s.body, { fontWeight: '800' }]}>回合训练用时</Text></View><Label color={t.blue}>{columns.length} 回合</Label></View>
    {columns.length ? <><View testID="report-chart" style={[r.chart, { gap }]}>{columns.map(column => <RoundBar key={column.round} {...column} count={columns.length} active={active} ready={ready} />)}</View>{columns.length <= 10 ? <View style={r.durationLabels}>{columns.map(column => <Text key={column.round} style={r.barTime}>R{column.round} {formatDuration(column.ms)}</Text>)}</View> : <View style={[s.between, { alignSelf: 'center', width: '100%', maxWidth: columns.length * 50 + (columns.length - 1) * gap }]}><Text style={r.barLabel}>R1</Text><Text style={r.barLabel}>R{Math.ceil(columns.length / 2)}</Text><Text style={r.barLabel}>R{columns.length}</Text></View>}</> : <Label>本次尚无回合训练用时</Label>}
  </Card>;
});

const r = StyleSheet.create({
  metric: { backgroundColor: t.card, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.border, padding: 16, flexBasis: '46%', flexGrow: 1, minWidth: 0, gap: 12 },
  metricTitle: { color: t.soft, fontSize: 12, flex: 1 }, value: { fontFamily: t.mono, fontVariant: ['tabular-nums'], fontSize: 38, lineHeight: 52, letterSpacing: -1.5 }, target: { fontSize: 18, color: t.soft, letterSpacing: 0 }, caption: { color: t.soft, fontSize: 10 },
  chart: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }, column: { flex: 1, minWidth: 0, maxWidth: 50, gap: 7 }, durationLabels: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }, barTime: { fontFamily: t.mono, color: t.soft, fontSize: 9, textAlign: 'center' }, barTrack: { height: 104, justifyContent: 'flex-end', overflow: 'hidden', borderBottomWidth: 1, borderColor: '#ffffff22' }, bar: { backgroundColor: t.red, borderTopLeftRadius: 5, borderTopRightRadius: 5, width: '100%' }, zero: { height: 2, backgroundColor: t.muted }, barLabel: { fontFamily: t.mono, color: t.soft, fontSize: 10, textAlign: 'center' },
});
