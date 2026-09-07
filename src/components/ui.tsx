import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CURVE, DURATION } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';
import { Icon, type IconName } from './Icon';
import { Touchable, type TouchableProps } from './Touchable';

export const FONT = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export type Weight = keyof typeof FONT;

interface TxtProps {
  children?: React.ReactNode;
  size?: number;
  weight?: Weight;
  color?: string;
  tracking?: number;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  lineHeight?: number;
}

/** Typography primitive — the design uses Plus Jakarta Sans throughout. */
export function Txt({
  children,
  size = 14,
  weight = 'regular',
  color,
  tracking,
  lineHeight,
  style,
  numberOfLines,
}: TxtProps) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: FONT[weight],
          fontSize: size,
          color: color ?? t.ink,
          ...(tracking != null ? { letterSpacing: tracking * size } : null),
          ...(lineHeight != null ? { lineHeight: lineHeight * size } : null),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Card({
  children,
  style,
  padding = 20,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        { padding, borderRadius: 22, backgroundColor: t.card, borderWidth: 1, borderColor: t.line },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Pill({
  children,
  dot,
  style,
  paddingH = 13,
  paddingV = 7,
}: {
  children?: React.ReactNode;
  dot?: string;
  style?: StyleProp<ViewStyle>;
  paddingH?: number;
  paddingV?: number;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          borderRadius: 999,
          backgroundColor: t.pill,
          borderWidth: 1,
          borderColor: t.pillLine,
        },
        style,
      ]}
    >
      {dot ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} /> : null}
      {typeof children === 'string' ? (
        <Txt size={13} color={t.inkSoft}>
          {children}
        </Txt>
      ) : (
        children
      )}
    </View>
  );
}

interface RoundButtonProps extends Omit<TouchableProps, 'children'> {
  icon: IconName;
  size?: number;
  iconSize?: number;
  variant?: 'chip' | 'surface' | 'outline';
  color?: string;
  strokeWidth?: number;
}

/** The circular icon buttons used in the header and every card corner. */
export function RoundButton({
  icon,
  size = 34,
  iconSize,
  variant = 'surface',
  color,
  strokeWidth,
  style,
  activeScale = 0.9,
  ...rest
}: RoundButtonProps) {
  const t = useTheme();
  const bg = variant === 'chip' ? t.chip : variant === 'outline' ? 'transparent' : t.surface2;
  const border = variant === 'outline' ? t.btnLine : variant === 'chip' ? t.pillLine : t.pillLineSoft;
  const tint = color ?? (variant === 'chip' ? t.inkSoft2 : t.inkSoft);
  return (
    <Touchable
      {...rest}
      activeScale={activeScale}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Icon name={icon} size={iconSize ?? Math.round(size * 0.44)} color={tint} strokeWidth={strokeWidth} />
    </Touchable>
  );
}

/** Outlined pill button ("Board →", "Focus · 25:00"). */
export function GhostButton({
  label,
  icon,
  onPress,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <Touchable
      onPress={onPress}
      activeScale={0.95}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: t.btnLine,
        },
        style,
      ]}
    >
      <Txt size={15} color={t.ink}>
        {label}
      </Txt>
      {icon ? <Icon name={icon} size={15} color={t.ink} strokeWidth={1.9} /> : null}
    </Touchable>
  );
}

/** Filled inverse pill button ("Overview", "New note"). */
export function PrimaryButton({
  label,
  icon,
  onPress,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <Touchable
      onPress={onPress}
      activeScale={0.95}
      haptic="light"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          height: 48,
          paddingHorizontal: 20,
          borderRadius: 999,
          backgroundColor: t.invBg,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={15} color={t.invInk} strokeWidth={2.2} /> : null}
      <Txt size={14} weight="semibold" color={t.invInk}>
        {label}
      </Txt>
    </Touchable>
  );
}

/** Stat chip in each page header: "5/7 done · 2 in progress". */
export function StatChip({ left, right }: { left: string; right: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        height: 48,
        paddingHorizontal: 20,
        borderRadius: 999,
        backgroundColor: t.chip,
        borderWidth: 1,
        borderColor: t.lineSoft,
      }}
    >
      <Txt size={14} color={t.muted}>
        {left}
      </Txt>
      <View style={{ width: 1, height: 16, backgroundColor: t.pillLine }} />
      <Txt size={14} color={t.muted}>
        {right}
      </Txt>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Ring progress dial — the SVG equivalent of the design's conic-gradient +
 * radial mask, animated with the same .5s settle curve.
 */
export function ProgressRing({
  progress,
  size = 44,
  color,
  label,
}: {
  progress: number;
  size?: number;
  color: string;
  label: string;
}) {
  const t = useTheme();
  // The design masks the conic dial with `closest-side transparent 70%`, so the
  // visible ring is 30% of the radius.
  const thickness = size * 0.15;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const value = useSharedValue(progress);

  useEffect(() => {
    value.value = withTiming(progress, { duration: 500, easing: CURVE.settle });
  }, [progress, value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - value.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.surface3} strokeWidth={thickness} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Txt size={11} weight="semibold" color={t.inkSoft}>
        {label}
      </Txt>
    </View>
  );
}

/** Track + fill meter used by "Where the week goes" and the steps card. */
export function Meter({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  const t = useTheme();
  const style = useAnimatedStyle(
    () => ({
      width: withTiming(`${Math.max(0, Math.min(100, pct))}%`, {
        duration: DURATION.page,
        easing: CURVE.settle,
      }),
    }),
    [pct]
  );
  return (
    <View
      style={{ height, borderRadius: 999, backgroundColor: t.surface3, overflow: 'hidden' }}
    >
      <Animated.View style={[{ height: '100%', borderRadius: 999, backgroundColor: color }, style]} />
    </View>
  );
}
