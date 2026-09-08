import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { interpolate, interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { PAGE_COUNT, useAppStore } from '@/state/store';
import { usePager } from './Pager';
import { Txt } from './ui';
import { radius, useLayout, useTheme, type as typeScale } from '@/theme';

const HINTS = [
  'Swipe left for the board',
  'Swipe for the calendar',
  'Swipe for health & habits',
  'Swipe for notes',
  'Swipe right to go back',
];

function Dot({ index }: { index: number }) {
  const t = useTheme();
  const { position } = usePager();
  const style = useAnimatedStyle(() => {
    const d = Math.abs(position.value - index);
    return {
      width: interpolate(d, [0, 1], [24, 6], 'clamp'),
      backgroundColor: interpolateColor(Math.min(d, 1), [0, 1], [t.dotActive, t.dotIdle]),
    };
  }, [t.dotActive, t.dotIdle, index]);
  return <Animated.View style={[{ height: 6, borderRadius: radius.pill }, style]} />;
}

/** Bottom page indicator with the design's expanding active pill. */
export function PageDots() {
  const t = useTheme();
  const { narrow } = useLayout();
  const page = useAppStore((s) => s.page);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      {narrow ? (
        // Narrow pages scroll under the dots; a fade keeps the hint legible.
        // The transparent stop is the page colour at zero alpha, so the fade
        // never passes through grey on the light theme.
        <LinearGradient
          colors={[`${t.bg}00`, t.bg]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64 }}
        />
      ) : null}
      <View
        style={{
          paddingBottom: 14,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 9,
        }}
      >
        {Array.from({ length: PAGE_COUNT }, (_, i) => (
          <Dot key={i} index={i} />
        ))}
        <Txt size={typeScale.micro} color={t.muted3} style={{ marginLeft: 8 }}>
          {HINTS[page]}
        </Txt>
      </View>
    </View>
  );
}
