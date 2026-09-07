import React, { useCallback } from 'react';
import { View } from 'react-native';
import { PAGE_TITLES, useAppStore } from '@/state/store';
import { ConicDisc } from './ConicDisc';
import { RoundButton, Txt } from './ui';
import { Touchable } from './Touchable';
import { accent, radius, size as metric, tracking, useLayout, useTheme, type as typeScale } from '@/theme';

const BRAND_STOPS = [
  { color: '#c4b5fd', to: 150 },
  { color: '#6d28d9', to: 250 },
  { color: '#3b1d8f', to: 360 },
];

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
  const { compact, gutter, headerHeight } = useLayout();
  const button = compact ? 38 : metric.headerButton;
  const page = useAppStore((s) => s.page);
  const setPage = useAppStore((s) => s.setPage);
  const light = useAppStore((s) => s.light);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  const pick = useCallback((i: number) => () => setPage(i), [setPage]);

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
        {PAGE_TITLES.map((label, i) => {
          const active = page === i;
          return (
            <Touchable
              key={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={pick(i)}
              style={{
                paddingHorizontal: 22,
                paddingVertical: 13,
                borderRadius: radius.pill,
                backgroundColor: active ? t.invBg : 'transparent',
              }}
            >
              <Txt size={typeScale.body} weight="medium" color={active ? t.invInk : t.muted}>
                {label}
              </Txt>
            </Touchable>
          );
        })}
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
        <View style={{ display: compact ? 'none' : 'flex' }}>
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
            <Txt size={16} weight="semibold" color="#fff">
              A
            </Txt>
          </View>
        </Touchable>
      </View>
    </View>
  );
});
