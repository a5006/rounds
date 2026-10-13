import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRound } from './SessionProvider';
import { trainingBanner } from './core/training-banner.mjs';
import { theme as t } from './theme';

export function TrainingBanner() {
  const app = useRound();
  const status = trainingBanner(app.screen, app.session);
  if (!status) return null;
  const color = status.phase === 'work' ? t.red : status.phase === 'rest' ? t.blue : t.amber;
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${status.label}，${status.round}，剩余 ${status.time}，返回训练页`} onPress={() => app.navigate('training')} style={({ pressed }) => [styles.bar, { borderColor: `${color}55` }, pressed && { opacity: .75 }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.description}><Text numberOfLines={1} style={[styles.label, { color }]}>{status.label}</Text><Text numberOfLines={1} style={styles.round}>{status.round}</Text></View>
      <Text style={[styles.time, { color }]}>{status.time}</Text>
      <Ionicons name="chevron-forward" size={18} color={color} />
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  bar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.raised, borderWidth: 1, borderRadius: t.radius.control, paddingHorizontal: 14, paddingVertical: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  description: { flex: 1, gap: 2 },
  label: { fontSize: 13, fontWeight: '700' },
  round: { fontSize: 11, color: t.soft },
  time: { fontFamily: t.mono, fontVariant: ['tabular-nums'], fontSize: 22 },
});
