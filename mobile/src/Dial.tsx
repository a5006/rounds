import React, { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { motionProfile } from './core/motion.mjs';
import { formatDuration } from './core/mobile-core.mjs';
import { useMotionClock, useMotionPreferences, type MotionMode } from './useMotionClock';
import { theme as t } from './theme';
import { stopwatchRing } from './core/reset.mjs';
import { useCountdownTransition } from './useCountdownTransition';
import { formatCountdownParts } from './core/countdown.mjs';
import Ionicons from '@expo/vector-icons/Ionicons';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const circumference = Math.PI * 2 * 122;

const Decoration = memo(function Decoration({ mode, running, glow }: { mode: MotionMode; running: boolean; glow: SharedValue<number> }) {
  const { color, accent } = motionProfile(mode);
  const { turn, breath, reduced } = useMotionClock(mode, running);
  const orbitStyle = useAnimatedStyle(() => ({ opacity: glow.value * (reduced ? .4 : 1), transform: [{ rotate: `${(turn.value % 1) * 360}deg` }] }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: glow.value * (.4 + Math.sin(breath.value * Math.PI * 2) * .16), transform: [{ scale: 1.015 + Math.sin(breath.value * Math.PI * 2) * .035 }] }));
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Animated.View testID="dial-halo" style={[StyleSheet.absoluteFill, haloStyle]}><Svg width="100%" height="100%" viewBox="0 0 300 300">{[132, 139, 145].map((r, index) => <Circle key={r} cx={150} cy={150} r={r} fill="none" stroke={color} strokeWidth={14 + index * 3} opacity={.17 - index * .035} />)}</Svg></Animated.View>
    <Svg width="100%" height="100%" viewBox="0 0 300 300" style={StyleSheet.absoluteFill}><Defs><RadialGradient id="dial-shade"><Stop offset="0" stopColor={t.bg} stopOpacity={.95} /><Stop offset=".7" stopColor={t.bg} stopOpacity={.65} /><Stop offset="1" stopColor={t.bg} stopOpacity={0} /></RadialGradient></Defs><Circle cx={150} cy={150} r={117} fill="url(#dial-shade)" /></Svg>
    <Animated.View testID="dial-orbit" style={[StyleSheet.absoluteFill, orbitStyle]}><Svg width="100%" height="100%" viewBox="0 0 300 300"><Defs><LinearGradient id="double-tail" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={color} stopOpacity={.04} /><Stop offset="1" stopColor={accent} stopOpacity={1} /></LinearGradient></Defs>{[0, 180].map((angle, index) => <G key={angle} transform={`rotate(${angle - 90} 150 150)`}><Circle cx={150} cy={150} r={137} fill="none" stroke={color} strokeWidth={10} strokeDasharray={`${index ? 110 : 170} 861`} opacity={.2} strokeLinecap="round" /><Circle cx={150} cy={150} r={137} fill="none" stroke="url(#double-tail)" strokeWidth={3} strokeDasharray={`${index ? 110 : 170} 861`} strokeLinecap="round" /><Circle cx={287} cy={150} r={3.5} fill={accent} /></G>)}</Svg></Animated.View>
  </View>;
});

function Progress({ progress, mode, running, resetFrom, animatedValue, glow }: { progress: number; mode: MotionMode; running: boolean; resetFrom?: number; animatedValue?: SharedValue<number>; glow: SharedValue<number> }) {
  const color = motionProfile(mode).color;
  const { reduced, active } = useMotionPreferences(running || resetFrom !== undefined);
  const value = useSharedValue(progress), previousMode = useRef(mode), previousProgress = useRef(progress);
  useEffect(() => {
    if (animatedValue) return;
    if (resetFrom !== undefined) { value.value = stopwatchRing(resetFrom); value.value = reduced || !active ? 0 : withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }); return () => cancelAnimation(value); }
    const reset = previousMode.current !== mode || (mode === 'stopwatch' ? progress < previousProgress.current : progress > previousProgress.current);
    value.value = reduced || !active || reset ? progress : withTiming(progress, { duration: 110, easing: Easing.linear });
    previousMode.current = mode; previousProgress.current = progress;
  }, [progress, mode, reduced, active, value, resetFrom, animatedValue]);
  const props = useAnimatedProps(() => {
    const current = animatedValue ? animatedValue.value : value.value;
    return { strokeDashoffset: circumference * (1 - current), opacity: current <= .00001 ? 0 : .5 + glow.value * .5 };
  });
  const outlineProps = useAnimatedProps(() => ({ opacity: glow.value * .3 }));
  return <Svg width="100%" height="100%" viewBox="0 0 300 300" style={StyleSheet.absoluteFill}><AnimatedCircle animatedProps={outlineProps} cx={150} cy={150} r={137} fill="none" stroke={color} strokeWidth={1} /><Circle cx={150} cy={150} r={122} fill="none" stroke={t.border} strokeWidth={10} /><G transform="rotate(-90 150 150)"><AnimatedCircle testID="dial-progress" animatedProps={props} cx={150} cy={150} r={122} fill="none" stroke={color} strokeWidth={10} strokeDasharray={`${circumference} ${circumference}`} strokeLinecap="round" /></G></Svg>;
}

function CountdownCue({ seconds, mode, running }: { seconds: number; mode: MotionMode; running: boolean }) {
  const { active } = useMotionPreferences(running);
  const cue = useSharedValue(0);
  useEffect(() => {
    if (!active || seconds < 1 || seconds > 3) { cue.value = 0; return; }
    cue.value = 1; cue.value = withTiming(0, { duration: 650 });
    return () => cancelAnimation(cue);
  }, [seconds, active, cue]);
  const style = useAnimatedStyle(() => ({ opacity: cue.value }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}><Svg width="100%" height="100%" viewBox="0 0 300 300"><Circle cx={150} cy={150} r={137} fill="none" stroke={motionProfile(mode).accent} strokeWidth={3} /></Svg></Animated.View>;
}

export function Dial({ mode, remainingMs, durationMs, elapsedMs, running, caption, topContent, fraction = false, resetFrom, transitionKey, statusLabel = '已暂停' }: { mode: MotionMode; remainingMs?: number; durationMs?: number; elapsedMs?: number; running: boolean; caption: React.ReactNode; topContent?: React.ReactNode; fraction?: boolean; resetFrom?: number; transitionKey?: string; statusLabel?: string }) {
  const { width } = useWindowDimensions(), size = Math.min(320, width - 64);
  const { color } = motionProfile(mode);
  const countdown = useCountdownTransition(remainingMs || 0, durationMs || 0, transitionKey || mode, running, mode !== 'stopwatch');
  const seconds = remainingMs == null ? -1 : Math.ceil(remainingMs / 1000);
  const progress = mode === 'stopwatch' ? (resetFrom !== undefined ? 0 : stopwatchRing(elapsedMs || 0)) : Math.max(0, Math.min(1, (remainingMs || 0) / Math.max(1, durationMs || 1)));
  const time = remainingMs == null ? elapsedMs || 0 : Math.ceil(countdown.displayMs / 1000) * 1000;
  const countdownTime = formatCountdownParts(remainingMs || 0);
  const glowing = running || resetFrom !== undefined;
  const { active: animateGlow } = useMotionPreferences(true);
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = animateGlow ? withTiming(glowing ? 1 : 0, { duration: 350, easing: Easing.inOut(Easing.cubic) }) : glowing ? 1 : 0;
    return () => cancelAnimation(glow);
  }, [glowing, animateGlow, glow]);
  if (mode === 'countdown') return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Decoration mode={mode} running={running} glow={glow} />
    <Progress progress={progress} mode={mode} running={running} glow={glow} animatedValue={countdown.ring} />
    <CountdownCue seconds={seconds} mode={mode} running={running} />
    <View style={{ alignItems: 'flex-end' }}>
      <Text testID="dial-time" accessibilityLabel={`${countdownTime.time}.${countdownTime.fraction}`} style={{ color: '#fff', fontFamily: t.mono, fontSize: size * .15, letterSpacing: -1, lineHeight: 58 }}>{countdownTime.time}</Text>
      <Text testID="countdown-milliseconds" accessible={false} style={{ color: '#ff7882', fontFamily: t.mono, fontSize: size * .06, lineHeight: 22, marginTop: -6, fontVariant: ['tabular-nums'] }}>.{countdownTime.fraction}</Text>
    </View>
    <View accessibilityLabel={!running && !caption ? statusLabel : undefined} style={{ marginTop: 10, minHeight: 26, paddingVertical: 4, justifyContent: 'center' }}>{!running && !caption ? <Ionicons name="pause" size={14} color="#ff4655" /> : <Text style={{ color: '#ff4655', fontFamily: t.mono, fontSize: 12 }}>{caption || `${Math.ceil(progress * 100)}%`}</Text>}</View>
  </View>;
  return <View style={{ width: size, height: size, marginVertical: 22, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
    <Decoration mode={mode} running={running} glow={glow} /><Progress progress={progress} mode={mode} running={running} glow={glow} resetFrom={resetFrom} animatedValue={mode === 'stopwatch' ? undefined : countdown.ring} /><CountdownCue seconds={seconds} mode={mode} running={running} />
    <View style={{ alignItems: 'center' }}>{topContent}{mode !== 'stopwatch' && <Text style={[styles.caption, { color }]}>{caption}</Text>}<View style={{ flexDirection: 'row', alignItems: 'baseline' }}><Text testID="dial-time" accessibilityLabel={formatDuration(time)} style={[styles.time, { fontSize: fraction ? size * .18 : size * .21 }]}>{formatDuration(time)}</Text>{fraction && <Text style={[styles.fraction, { color, fontSize: size * .095 }]}>.{String(Math.floor(time % 1000 / 10)).padStart(2, '0')}</Text>}</View>{mode === 'stopwatch' ? <Text style={styles.caption}>{caption}</Text> : !running && !!statusLabel && <Text style={styles.caption}>{statusLabel}</Text>}</View>
  </View>;
}
const styles = StyleSheet.create({ caption: { color: t.muted, fontSize: 11, letterSpacing: .7, fontWeight: '600', lineHeight: 19 }, time: { color: t.text, fontFamily: t.mono, fontVariant: ['tabular-nums'], letterSpacing: -3, lineHeight: 85 }, fraction: { fontFamily: t.mono, letterSpacing: -1 } });
