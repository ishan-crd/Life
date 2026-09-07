import React, { forwardRef, useEffect } from 'react';
import type { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { CURVE, DURATION } from '@/theme';

/** `@keyframes riseIn` — the staggered 12px lift used across the overview. */
export const RiseIn = forwardRef<View, {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  onLayout?: (e: LayoutChangeEvent) => void;
}>(function RiseIn({ delay = 0, style, children, onLayout }, ref) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: DURATION.rise, easing: CURVE.settle }));
  }, [delay, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 12 * (1 - progress.value) }],
  }));

  return (
    <Animated.View ref={ref} onLayout={onLayout} style={[style, animated]}>
      {children}
    </Animated.View>
  );
});
