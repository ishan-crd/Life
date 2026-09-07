import React, { useCallback } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CURVE, DURATION } from '@/theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface TouchableProps extends Omit<PressableProps, 'style'> {
  /** Scale applied while pressed — mirrors the design's `style-active` transforms. */
  activeScale?: number;
  /** Extra rotation in degrees while pressed (the theme toggle spins -25deg). */
  activeRotate?: number;
  /** Opacity applied while pressed. */
  activeOpacity?: number;
  haptic?: false | 'light' | 'medium' | 'selection';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Pressable with the design's springy press feedback, driven on the UI thread
 * so it never drops a frame behind the pager gesture.
 */
export function Touchable({
  activeScale = 0.96,
  activeRotate = 0,
  activeOpacity,
  haptic = 'selection',
  style,
  onPress,
  children,
  ...rest
}: TouchableProps) {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { scale: 1 + (activeScale - 1) * p },
        ...(activeRotate ? [{ rotate: `${activeRotate * p}deg` }] : []),
      ],
      ...(activeOpacity != null ? { opacity: 1 + (activeOpacity - 1) * p } : null),
    };
  }, [activeScale, activeRotate, activeOpacity]);

  const handlePressIn = useCallback(() => {
    progress.value = withTiming(1, { duration: DURATION.press, easing: CURVE.pop });
  }, [progress]);

  const handlePressOut = useCallback(() => {
    progress.value = withTiming(0, { duration: DURATION.quick, easing: CURVE.pop });
  }, [progress]);

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (e) => {
      if (haptic) {
        if (haptic === 'selection') Haptics.selectionAsync();
        else if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress?.(e);
    },
    [haptic, onPress]
  );

  return (
    <AnimatedPressable
      {...rest}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
