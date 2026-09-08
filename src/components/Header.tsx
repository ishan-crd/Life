import React, { useCallback } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { firstName, useProfileStore } from '@/state/profile';
import { PAGE_TITLES, useAppStore } from '@/state/store';
import { ConicDisc } from './ConicDisc';
import { pagerPosition } from './Pager';
import { FONT, RoundButton, Txt } from './ui';
import { Touchable } from './Touchable';
import {
  accent,
  BRAND_STOPS,
  onAccent,
  radius,
  scaleType,
  size as metric,
  tracking,
  useLayout,
  useTheme,
  type as typeScale,
} from '@/theme';

interface TabFrame {
  x: number;
  w: number;
}

interface HeaderProps {
  onSearch(): void;
  onNotifications(): void;
  onProfile(): void;
  hasNotifications: boolean;
}

/** The top bar: brand, page tabs, and the utility cluster. */
export const Header = React.memo(function Header({
  onSearch,
  onNotifications,
  onProfile,
  hasNotifications,
}: HeaderProps) {
  const t = useTheme();
  const { bp, compact, gutter, headerHeight } = useLayout();
  const button = compact ? 38 : metric.headerButton;
  // A tablet held upright fits the tabs, but not at the design's padding.
  const tight = bp === 'medium';
  const setPage = useAppStore((s) => s.setPage);
  /** Where each tab sits, so the highlight can slide between them. */
  const frames = useSharedValue<TabFrame[]>([]);
  const light = useAppStore((s) => s.light);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const profile = useProfileStore((s) => s.profile);
  const initial = firstName(profile).charAt(0).toUpperCase();

  const pick = useCallback((i: number) => () => setPage(i), [setPage]);

  const onTabLayout = useCallback(
    (i: number) => (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      const next = [...frames.value];
      next[i] = { x, w: width };
      frames.value = next;
    },
    [frames]
  );

  /**
   * The highlight is one pill that tracks the pager's live position, so it
   * moves with the swipe rather than jumping to the tab when the swipe lands.
   */
  const pillStyle = useAnimatedStyle(() => {
    const f = frames.value;
    const count = PAGE_TITLES.length;
    for (let i = 0; i < count; i += 1) if (!f[i]) return { opacity: 0 };
    const pos = Math.max(0, Math.min(count - 1, pagerPosition.value));
    const i = Math.floor(pos);
    const j = Math.min(count - 1, i + 1);
    const k = pos - i;
    return {
      opacity: 1,
      width: f[i].w + (f[j].w - f[i].w) * k,
      transform: [{ translateX: f[i].x + (f[j].x - f[i].x) * k }],
    };
  });

  return (
    <View
      style={{
        height: headerHeight,
        paddingHorizontal: gutter,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 10 : 14, flex: 1 }}>
        <View style={{ width: button - 8, height: button - 8, borderRadius: button, overflow: 'hidden' }}>
          <ConicDisc size={button - 8} from={200} stops={BRAND_STOPS} />
        </View>
        <Txt size={typeScale.brand} weight="semibold" tracking={tracking.heading}>
          Life
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, display: compact ? 'none' : 'flex' }}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              borderRadius: radius.pill,
              backgroundColor: t.invBg,
            },
            pillStyle,
          ]}
        />
        {PAGE_TITLES.map((label, i) => (
          <Tab
            key={label}
            index={i}
            label={label}
            tight={tight}
            onLayout={onTabLayout(i)}
            onPress={pick(i)}
          />
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 6 : 10,
          flex: 1,
          justifyContent: 'flex-end',
        }}
      >
        <RoundButton
          icon="search"
          size={button}
          iconSize={compact ? 16 : 18}
          variant="chip"
          activeScale={0.92}
          accessibilityLabel="Search"
          onPress={onSearch}
        />
        <RoundButton
          icon={light ? 'moon' : 'sun'}
          size={button}
          iconSize={compact ? 16 : 18}
          variant="chip"
          activeScale={0.92}
          activeRotate={-25}
          accessibilityLabel="Toggle light mode"
          onPress={toggleTheme}
        />
        <View style={{ display: bp === 'wide' ? 'flex' : 'none' }}>
          <RoundButton
            icon="bell"
            size={button}
            iconSize={18}
            variant="chip"
            activeScale={0.92}
            accessibilityLabel="Notifications"
            onPress={onNotifications}
          />
          {hasNotifications ? (
            <View
              style={{
                position: 'absolute',
                top: 9,
                right: 10,
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: accent.rose,
                borderWidth: 2,
                borderColor: t.chip,
              }}
            />
          ) : null}
        </View>
        <Touchable
          onPress={onProfile}
          activeScale={0.92}
          accessibilityLabel="Profile"
          style={{
            width: button,
            height: button,
            borderRadius: button / 2,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: t.pillLine,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.surface3,
          }}
        >
          <ConicDisc size={button} from={20} stops={BRAND_STOPS} />
          <View style={{ position: 'absolute' }}>
            <Txt size={16} weight="semibold" color={onAccent.deep}>
              {initial}
            </Txt>
          </View>
        </Touchable>
      </View>
    </View>
  );
});

/**
 * One page tab. Its ink fades between the highlight's and the muted colour
 * with the same live position the pill follows, so the label never lags the
 * pill it is sitting on.
 */
function Tab({
  index,
  label,
  tight,
  onLayout,
  onPress,
}: {
  index: number;
  label: string;
  tight: boolean;
  onLayout(e: LayoutChangeEvent): void;
  onPress(): void;
}) {
  const t = useTheme();
  const { fontScale } = useLayout();
  const ink = useAnimatedStyle(() => {
    const distance = Math.min(1, Math.abs(pagerPosition.value - index));
    return { color: interpolateColor(distance, [0, 1], [t.invInk, t.muted]) };
  }, [index, t.invInk, t.muted]);

  return (
    <Touchable
      accessibilityRole="tab"
      onLayout={onLayout}
      onPress={onPress}
      style={{
        paddingHorizontal: tight ? 14 : 22,
        paddingVertical: tight ? 11 : 13,
        borderRadius: radius.pill,
      }}
    >
      <Animated.Text
        style={[{ fontFamily: FONT.medium, fontSize: scaleType(typeScale.body, fontScale) }, ink]}
      >
        {label}
      </Animated.Text>
    </Touchable>
  );
}
