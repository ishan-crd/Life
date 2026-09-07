import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { RiseIn } from '@/components/RiseIn';
import { useSheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { RoundButton, Txt } from '@/components/ui';
import { WidgetGrid } from '@/components/WidgetGrid';
import { greetingFor } from '@/lib/date';
import { useNow } from '@/lib/useNow';
import { firstName, useProfileStore } from '@/state/profile';
import { useAppStore } from '@/state/store';
import type { WidgetKey } from '@/state/types';
import { availableWidgets, WIDGETS, widgetSize } from '@/widgets/registry';
import { radius, useLayout, useTheme, type as typeScale } from '@/theme';

const RANGES = ['Day', 'Week', 'Month'] as const;

/**
 * The home page: a greeting, the range switch, and a grid of widgets you
 * arrange yourself. Long-press any widget to start rearranging.
 */
export function Overview() {
  const t = useTheme();
  const { compact, gutter } = useLayout();
  const now = useNow(30_000);
  const { openSheet } = useSheet();

  const profile = useProfileStore((s) => s.profile);
  const range = useAppStore((s) => s.range);
  const setRange = useAppStore((s) => s.setRange);
  const widgets = useAppStore((s) => s.widgets);
  const setWidgets = useAppStore((s) => s.setWidgets);
  const addWidget = useAppStore((s) => s.addWidget);
  const removeWidget = useAppStore((s) => s.removeWidget);
  const resetWidgets = useAppStore((s) => s.resetWidgets);

  const [editing, setEditing] = useState(false);

  const startEditing = useCallback(() => setEditing(true), []);
  const stopEditing = useCallback(() => setEditing(false), []);

  const openAddWidget = useCallback(() => {
    const options = availableWidgets(widgets);
    if (options.length === 0) {
      openSheet({
        title: 'Every widget is on',
        subtitle: 'Remove one with the − badge to free up a slot.',
        submitLabel: 'Done',
        fields: [],
        onSubmit: () => undefined,
        onDelete: resetWidgets,
        deleteLabel: 'Reset layout',
      });
      return;
    }
    openSheet({
      title: 'Add a widget',
      subtitle: options[0].blurb,
      submitLabel: 'Add to home',
      fields: [
        {
          key: 'widget',
          label: 'Widget',
          kind: 'select',
          initial: options[0].key,
          options: options.map((w) => ({ label: w.title, value: w.key })),
        },
      ],
      onSubmit: (v) => {
        addWidget(v.widget as WidgetKey);
        setEditing(true);
      },
      onDelete: resetWidgets,
      deleteLabel: 'Reset layout',
    });
  }, [openSheet, widgets, addWidget, resetWidgets]);

  const render = useCallback((key: WidgetKey) => {
    const { Component } = WIDGETS[key];
    return <Component />;
  }, []);

  const greeting = useMemo(() => greetingFor(now.getHours()), [now]);

  return (
    <View style={{ flex: 1, paddingHorizontal: gutter }}>
      <RiseIn
        delay={50}
        style={{
          flexDirection: compact ? 'column' : 'row',
          alignItems: compact ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: compact ? 12 : 0,
          paddingTop: 6,
          paddingBottom: compact ? 14 : 20,
        }}
      >
        <Txt size={typeScale.pageTitle} weight="medium" tracking={-0.03} numberOfLines={1}>
          {greeting},
          <Txt size={typeScale.pageTitle} weight="medium" tracking={-0.03} color={t.inkDim}>
            {` ${firstName(profile)}`}
          </Txt>
        </Txt>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              gap: 3,
              padding: 5,
              borderRadius: radius.pill,
              backgroundColor: t.chip,
              borderWidth: 1,
              borderColor: t.lineSoft,
            }}
          >
            {RANGES.map((label, i) => {
              const active = range === i;
              return (
                <Touchable
                  key={label}
                  onPress={() => setRange(i)}
                  style={{
                    paddingHorizontal: compact ? 14 : gutter,
                    paddingVertical: compact ? 8 : 11,
                    borderRadius: radius.pill,
                    backgroundColor: active ? t.rangeActiveBg : 'transparent',
                  }}
                >
                  <Txt size={14} weight={active ? 'semibold' : 'regular'} color={active ? t.rangeActiveInk : t.muted}>
                    {label}
                  </Txt>
                </Touchable>
              );
            })}
          </View>

          {editing ? (
            <>
              <RoundButton
                icon="plus"
                size={compact ? 38 : 44}
                iconSize={16}
                variant="chip"
                accessibilityLabel="Add a widget"
                onPress={openAddWidget}
              />
              <Touchable
                onPress={stopEditing}
                activeScale={0.95}
                haptic="light"
                accessibilityLabel="Done arranging"
                style={{
                  height: compact ? 38 : 44,
                  paddingHorizontal: 18,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: t.invBg,
                }}
              >
                <Txt size={14} weight="semibold" color={t.invInk}>
                  Done
                </Txt>
              </Touchable>
            </>
          ) : (
            <RoundButton
              icon="expand"
              size={compact ? 38 : 44}
              iconSize={16}
              variant="chip"
              accessibilityLabel="Arrange widgets"
              onPress={startEditing}
            />
          )}
        </View>
      </RiseIn>

      <RiseIn delay={100} style={{ flex: 1, borderTopWidth: 1, borderTopColor: t.lineSoft }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: compact ? 14 : 20, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          <WidgetGrid
            order={widgets}
            sizeOf={widgetSize}
            render={render}
            editing={editing}
            onRequestEdit={startEditing}
            onReorder={setWidgets}
            onRemove={removeWidget}
          />
          {editing ? (
            <Txt size={12} color={t.muted3} style={{ textAlign: 'center', paddingTop: 16 }}>
              Drag a widget to move it · − removes it · + adds one
            </Txt>
          ) : null}
        </ScrollView>
      </RiseIn>
    </View>
  );
}
