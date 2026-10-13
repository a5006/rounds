import React, { memo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { motionProfile } from './core/motion.mjs';
import { useMotionClock, type MotionMode } from './useMotionClock';
import { theme as t } from './theme';

const Cloud = memo(function Cloud({ clock, index, color, diameter, running, compact }: { clock: SharedValue<number>; index: number; color: string; diameter: number; running: boolean; compact: boolean }) {
  const style = useAnimatedStyle(() => {
    const phase = clock.value * Math.PI * 2 + index * 2.1;
    return { transform: [{ translateX: Math.sin(phase) * 65 }, { translateY: Math.cos(phase * .8) * 55 }, { rotate: `${Math.sin(phase * .45) * 24}deg` }, { scale: 1.03 + Math.sin(phase * .65) * .16 }] };
  });
  return <Animated.View testID={`mist-cloud-${index}`} style={[styles.cloud, { width: diameter, height: diameter, left: compact ? (index === 1 ? '28%' : '-28%') : (index === 1 ? '12%' : '-20%'), top: compact ? (index === 2 ? '10%' : '-28%') : (index === 0 ? '6%' : index === 1 ? '28%' : '54%'), opacity: running ? .9 : .35 }, style]}>
    <Svg width="100%" height="100%" viewBox="0 0 400 400"><Defs><RadialGradient id={`fog-${index}`} cx="50%" cy="50%" rx="50%" ry="50%"><Stop offset="0" stopColor={color} stopOpacity={.42} /><Stop offset=".3" stopColor={color} stopOpacity={.27} /><Stop offset=".65" stopColor={color} stopOpacity={.1} /><Stop offset="1" stopColor={color} stopOpacity={0} /></RadialGradient></Defs><Ellipse cx={200} cy={200} rx={198} ry={150 + index * 14} fill={`url(#fog-${index})`} /></Svg>
  </Animated.View>;
});

export const MistBackground = memo(function MistBackground({ mode, running, variant = 'screen' }: { mode: MotionMode; running: boolean; variant?: 'screen' | 'hero' }) {
  const { width } = useWindowDimensions();
  const { drift, reduced } = useMotionClock(mode, running);
  const { color, accent } = motionProfile(mode);
  const compact = variant === 'hero';
  const diameter = compact ? Math.min(440, Math.max(320, width * .85)) : Math.min(650, Math.max(420, width * 1.25));
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={styles.background} testID="mist-background">
    <View style={styles.canvas}>
      {[0, 1, 2].map(index => <Cloud key={index} clock={drift} index={index} color={compact ? (index === 1 ? t.amber : t.blueStrong) : (index === 1 ? accent : color)} diameter={diameter} running={running && !reduced} compact={compact} />)}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}><Defs><RadialGradient id="mist-dark-center" cx="50%" cy="39%" rx="38%" ry="22%"><Stop offset="0" stopColor={t.bg} stopOpacity={.85} /><Stop offset=".45" stopColor={t.bg} stopOpacity={.5} /><Stop offset="1" stopColor={t.bg} stopOpacity={0} /></RadialGradient></Defs><Rect width="100%" height="100%" fill="url(#mist-dark-center)" /></Svg>
      <LinearGradient colors={[t.bg, '#11131800', '#11131800', t.bg]} locations={[0, .2, .72, 1]} style={StyleSheet.absoluteFill} />
      {compact && <LinearGradient colors={[t.bg, '#11131800', '#11131800', t.bg]} locations={[0, .22, .78, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
    </View>
  </View>;
});
const styles = StyleSheet.create({ background: { ...StyleSheet.absoluteFill, overflow: 'hidden', alignItems: 'center' }, canvas: { width: '100%', maxWidth: 640, height: '100%', overflow: 'hidden' }, cloud: { position: 'absolute' } });
