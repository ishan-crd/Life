import React, { useEffect } from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { accent } from '@/theme/tokens';
import { CURVE } from '@/theme/motion';
import type { Theme } from '@/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const KEPT_LINE =
  'M0 124 C 22 120, 34 104, 52 90 C 72 72, 84 28, 108 24 C 132 20, 140 70, 160 92 C 178 112, 196 116, 214 110 C 236 102, 250 86, 272 86 C 296 86, 316 98, 340 100 C 358 102, 370 100, 380 98';
const KEPT_AREA = `${KEPT_LINE} L 380 176 L 0 176 Z`;
const MISSED_LINE =
  'M0 148 C 20 146, 30 132, 48 126 C 66 120, 76 142, 96 144 C 116 146, 124 112, 146 110 C 168 108, 176 140, 196 146 C 214 150, 226 140, 246 138 C 266 136, 280 146, 300 144 C 322 142, 340 134, 380 130';

/** The kept-vs-missed area chart, including the 1.6s `drawLine` reveal. */
export function ConsistencyChart({ theme, height = 176 }: { theme: Theme; height?: number }) {
  const dash = useSharedValue(900);

  useEffect(() => {
    dash.value = 900;
    dash.value = withDelay(200, withTiming(0, { duration: 1600, easing: CURVE.settle }));
  }, [dash]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: dash.value }));

  return (
    <Svg width="100%" height={height} viewBox="0 0 380 176" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="lifeLime" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={accent.limeChart} stopOpacity="0.22" />
          <Stop offset="1" stopColor={accent.limeChart} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={KEPT_AREA} fill="url(#lifeLime)" />
      <AnimatedPath
        d={KEPT_LINE}
        fill="none"
        stroke={accent.limeChart}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeDasharray={900}
        animatedProps={animatedProps}
      />
      <Path
        d={MISSED_LINE}
        fill="none"
        stroke={theme.dash}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeDasharray="7 7"
      />
      <Line x1={246} y1={0} x2={246} y2={176} stroke={theme.pillLine} strokeWidth={1} strokeDasharray="4 5" />
      <Circle cx={246} cy={95} r={5} fill={accent.limeChart} />
      <Circle cx={246} cy={138} r={5} fill={theme.inkSoft2} />
    </Svg>
  );
}
