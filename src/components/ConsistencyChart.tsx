import React, { useEffect } from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import type { Theme } from '@/theme';
import { accent, CURVE } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const VIEW_W = 380;
const VIEW_H = 176;
/** Keeps the first and last month off the edges so their markers stay whole. */
const PAD_X = 22;
const PAD_Y = 16;

/**
 * A Catmull-Rom spline through the points, emitted as cubic beziers — the same
 * eased curve the design drew by hand, for any number of points.
 */
function smoothPath(values: number[]): string {
  if (values.length === 0) return '';
  const step = values.length > 1 ? (VIEW_W - PAD_X * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => ({
    x: PAD_X + i * step,
    y: PAD_Y + (1 - Math.max(0, Math.min(1, v))) * (VIEW_H - PAD_Y * 2),
  }));
  if (pts.length === 1) return `M${pts[0].x} ${pts[0].y}`;

  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function pointAt(values: number[], index: number): { x: number; y: number } {
  const step = values.length > 1 ? (VIEW_W - PAD_X * 2) / (values.length - 1) : 0;
  const v = Math.max(0, Math.min(1, values[index] ?? 0));
  return { x: PAD_X + index * step, y: PAD_Y + (1 - v) * (VIEW_H - PAD_Y * 2) };
}

/**
 * Kept versus missed over the last few months, with the design's 1.6s
 * `drawLine` reveal. Both series are 0..1 shares of the month's habit slots.
 */
export function ConsistencyChart({
  theme,
  height = VIEW_H,
  kept,
  missed,
}: {
  theme: Theme;
  height?: number | string;
  kept: number[];
  missed: number[];
}) {
  const dash = useSharedValue(900);

  useEffect(() => {
    dash.value = 900;
    dash.value = withDelay(200, withTiming(0, { duration: 1600, easing: CURVE.settle }));
  }, [dash]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: dash.value }));

  const keptLine = smoothPath(kept);
  const marker = Math.max(0, kept.length - 1);
  const keptPoint = pointAt(kept, marker);
  const missedPoint = pointAt(missed, marker);

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="lifeLime" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={accent.limeChart} stopOpacity="0.22" />
          <Stop offset="1" stopColor={accent.limeChart} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={`${keptLine} L ${VIEW_W - PAD_X} ${VIEW_H} L ${PAD_X} ${VIEW_H} Z`} fill="url(#lifeLime)" />
      <AnimatedPath
        d={keptLine}
        fill="none"
        stroke={accent.limeChart}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeDasharray={900}
        animatedProps={animatedProps}
      />
      <Path
        d={smoothPath(missed)}
        fill="none"
        stroke={theme.dash}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeDasharray="7 7"
      />
      <Line
        x1={keptPoint.x}
        y1={0}
        x2={keptPoint.x}
        y2={VIEW_H}
        stroke={theme.pillLine}
        strokeWidth={1}
        strokeDasharray="4 5"
      />
      <Circle cx={keptPoint.x} cy={keptPoint.y} r={5} fill={accent.limeChart} />
      <Circle cx={missedPoint.x} cy={missedPoint.y} r={5} fill={theme.inkSoft2} />
    </Svg>
  );
}
