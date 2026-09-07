import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { CURVE, DURATION } from '@/theme/motion';

/** `@keyframes growBarY` — a bar that scales up from its baseline on mount. */
export function GrowBar({
  delay = 0,
  duration = DURATION.bar,
  style,
}: {
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0.06);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: CURVE.settle }));
  }, [delay, duration, progress]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scaleY: progress.value }] }));

  return <Animated.View style={[{ transformOrigin: 'bottom' }, style, animated]} />;
}

/** `@keyframes growBarX` variant — the horizontal Rituals bar. */
export function GrowBarX({
  delay = 0,
  duration = DURATION.bar,
  style,
  children,
}: {
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const progress = useSharedValue(0.06);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: CURVE.settle }));
  }, [delay, duration, progress]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

  return <Animated.View style={[{ transformOrigin: 'left' }, style, animated]}>{children}</Animated.View>;
}

/** `@keyframes fadeCell` — heatmap cells popping in. */
export function FadeCell({
  delay = 0,
  style,
}: {
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: DURATION.rise, easing: CURVE.settle }));
  }, [delay, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.86 + 0.14 * progress.value }],
  }));

  return <Animated.View style={[style, animated]} />;
}
