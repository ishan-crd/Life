import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { CURVE, DURATION } from '@/theme/motion';

/** `@keyframes riseIn` — the staggered 12px lift used across the overview. */
export function RiseIn({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: DURATION.rise, easing: CURVE.settle }));
  }, [delay, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 12 * (1 - progress.value) }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
