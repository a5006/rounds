import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useMotionClock, type MotionMode } from './useMotionClock';

export function BreathingDot({ color, mode }: { color: string; mode: MotionMode }) {
  const { breath, active } = useMotionClock(mode, true);
  const style = useAnimatedStyle(() => {
    const wave = active ? (Math.sin(breath.value * Math.PI * 2) + 1) / 2 : 1;
    return { opacity: .4 + wave * .6, transform: [{ scale: .85 + wave * .3 }] };
  });
  return <Animated.View accessible={false} style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, boxShadow: `0 0 8px ${color}88` }, style]} />;
}
