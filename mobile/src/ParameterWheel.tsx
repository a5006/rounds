import React from 'react';
import { StyleSheet, View } from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Label } from './ui';
import { theme as t } from './theme';

export const minuteItems = Array.from({ length: 11 }, (_, value) => ({ value, label: String(value).padStart(2, '0') }));
export const secondItems = Array.from({ length: 12 }, (_, index) => ({ value: index * 5, label: String(index * 5).padStart(2, '0') }));
export const roundItems = Array.from({ length: 30 }, (_, index) => ({ value: index + 1, label: String(index + 1) }));

export function ParameterWheel({ label, data, value, color, onChange }: { label: string; data: { value: number; label: string }[]; value: number; color: string; onChange: (value: number) => void }) {
  return <View style={styles.column}>
    <Label color={t.soft}>{label}</Label>
    <View style={styles.wheel} accessibilityLabel={`${label}滚轮`}>
      <WheelPicker data={data} value={value} width="100%" itemHeight={44} visibleItemCount={5} enableScrollByTapOnItem
        onValueChanged={({ item }) => onChange(item.value)}
        itemTextStyle={{ color, fontFamily: t.mono, fontSize: 25 }}
        overlayItemStyle={{ opacity: 1, backgroundColor: `${color}12`, borderColor: `${color}40`, borderTopWidth: 1, borderBottomWidth: 1, borderRadius: 12 }}
        testID={`wheel-${label}`} />
      <LinearGradient pointerEvents="none" colors={[t.low, `${t.low}00`]} style={[styles.fade, { top: 0 }]} />
      <LinearGradient pointerEvents="none" colors={[`${t.low}00`, t.low]} style={[styles.fade, { bottom: 0 }]} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  column: { flex: 1, minWidth: 0, alignItems: 'center', gap: 8 },
  wheel: { width: '100%', overflow: 'hidden', borderRadius: 12 },
  fade: { position: 'absolute', left: 0, right: 0, height: 64 },
});
