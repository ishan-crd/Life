import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { accent } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface BlobProps {
  color: string;
  size: number;
  x: number;
  y: number;
  drift: number;
  duration: number;
  delay?: number;
  opacity?: number;
}

/** A slow-drifting radial glow — the aurora behind the sign-in panel. */
function Blob({ color, size, x, y, drift, duration, delay = 0, opacity = 0.55 }: BlobProps) {
  const progress = useSharedValue(0);
  const id = `blob-${color.replace('#', '')}-${Math.round(x)}-${Math.round(y)}`;

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [duration, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift * progress.value },
      { translateY: -drift * 0.6 * progress.value },
      { scale: 1 + 0.12 * progress.value },
    ],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y, opacity }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity="0.85" />
            <Stop offset="0.55" stopColor={color} stopOpacity="0.25" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/** Concentric dashed rings that rotate at different rates. */
function Orbits({ size }: { size: number }) {
  const t = useTheme();
  const slow = useSharedValue(0);
  const fast = useSharedValue(0);

  useEffect(() => {
    slow.value = withRepeat(withTiming(1, { duration: 42000, easing: Easing.linear }), -1, false);
    fast.value = withRepeat(withTiming(1, { duration: 24000, easing: Easing.linear }), -1, false);
  }, [slow, fast]);

  const slowStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${slow.value * 360}deg` }] }));
  const fastStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-fast.value * 360}deg` }] }));

  const r1 = size * 0.46;
  const r2 = size * 0.34;
  const r3 = size * 0.22;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[StyleSheet.absoluteFill, slowStyle]}>
        <Svg width={size} height={size}>
          <G>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r1}
              stroke={t.pillLine}
              strokeWidth={1}
              strokeDasharray="3 10"
              fill="none"
            />
            <Circle cx={size / 2} cy={size / 2 - r1} r={4} fill={accent.lime} />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, fastStyle]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r2}
            stroke={t.btnLine}
            strokeWidth={1}
            strokeDasharray="1 8"
            fill="none"
          />
          <Circle cx={size / 2 + r2} cy={size / 2} r={3.5} fill={accent.cyan} />
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r3} stroke={t.line} strokeWidth={1} fill="none" />
      </Svg>
    </View>
  );
}

/**
 * The animated backdrop shared by the sign-in and onboarding screens: drifting
 * aurora glows behind slowly counter-rotating orbit rings.
 */
export function Aurora({ width, height, showOrbits = true }: { width: number; height: number; showOrbits?: boolean }) {
  const t = useTheme();
  const orbitSize = Math.min(width, height) * 0.82;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <Blob
        color={accent.purple}
        size={width * 0.9}
        x={-width * 0.25}
        y={-height * 0.3}
        drift={40}
        duration={11000}
        opacity={t.name === 'dark' ? 0.5 : 0.28}
      />
      <Blob
        color={accent.cyan}
        size={width * 0.7}
        x={width * 0.42}
        y={height * 0.42}
        drift={-34}
        duration={14000}
        opacity={t.name === 'dark' ? 0.32 : 0.2}
      />
      <Blob
        color={accent.lime}
        size={width * 0.5}
        x={width * 0.05}
        y={height * 0.55}
        drift={26}
        duration={17000}
        opacity={t.name === 'dark' ? 0.18 : 0.14}
      />
      {showOrbits ? (
        <View
          style={{
            position: 'absolute',
            left: (width - orbitSize) / 2,
            top: (height - orbitSize) / 2,
          }}
        >
          <Orbits size={orbitSize} />
        </View>
      ) : null}
    </View>
  );
}
