import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { RiseIn } from '@/components/RiseIn';
import { useSheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { Meter, RoundButton, StatChip, Txt } from '@/components/ui';
import { dateKey, daysInMonth, fmtLongDate, fmtMonth, monthLead, to12h } from '@/lib/date';
import { useNow } from '@/lib/useNow';
import { useAppStore } from '@/state/store';
import type { CalEvent } from '@/state/types';
import { accent } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CELLS = 35;

const COLOR_OPTIONS = [
  { label: 'Work', value: accent.lime, color: accent.lime },
  { label: 'Meeting', value: accent.cyan, color: accent.cyan },
  { label: 'Community', value: accent.violet, color: accent.violet },
];

export function Calendar() {
  const t = useTheme();
  const now = useNow(60_000);
  const { openSheet } = useSheet();

  const events = useAppStore((s) => s.events);
  const ensureMonth = useAppStore((s) => s.ensureMonth);
  const addEvent = useAppStore((s) => s.addEvent);
  const updateEvent = useAppStore((s) => s.updateEvent);
  const removeEvent = useAppStore((s) => s.removeEvent);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const selectDate = useAppStore((s) => s.selectDate);
  const weekSplit = useAppStore((s) => s.weekSplit);

  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));

  useEffect(() => {
    ensureMonth(cursor.getFullYear(), cursor.getMonth());
  }, [cursor, ensureMonth]);

  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const selKey = selectedDate ?? todayKey;

  const shiftMonth = useCallback((delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const lead = monthLead(year, month);
  const total = daysInMonth(year, month);

  const cells = useMemo(
    () =>
      Array.from({ length: CELLS }, (_, i) => {
        const dayNum = i - lead + 1;
        const inMonth = dayNum >= 1 && dayNum <= total;
        const key = inMonth ? dateKey(year, month, dayNum) : null;
        return { i, dayNum, inMonth, key, events: key ? events[key] ?? [] : [] };
      }),
    [lead, total, year, month, events]
  );

  const monthEventCount = useMemo(
    () =>
      cells.reduce((n, c) => n + c.events.length, 0),
    [cells]
  );

  const freeEvenings = useMemo(
    () => cells.filter((c) => c.inMonth && !c.events.some((e) => Number(e.time.split(':')[0]) >= 18)).length,
    [cells]
  );

  const selDate = useMemo(() => {
    const [y, m, d] = selKey.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selKey]);

  const selEvents = events[selKey] ?? [];

  const openEventSheet = useCallback(
    (event?: CalEvent) => {
      openSheet({
        title: event ? 'Edit event' : 'New event',
        subtitle: fmtLongDate(selDate),
        submitLabel: event ? 'Save' : 'Add event',
        fields: [
          { key: 'title', label: 'What', placeholder: 'Design review', initial: event?.title, required: true },
          { key: 'time', label: 'When (24h)', placeholder: '14:30', initial: event?.time ?? '10:00', required: true },
          { key: 'meta', label: 'Detail', placeholder: '1 hour · FaceTime', initial: event?.meta },
          { key: 'color', label: 'Tag', kind: 'select', initial: event?.color, options: COLOR_OPTIONS },
        ],
        onSubmit: (v) => {
          const payload = { title: v.title, time: v.time, meta: v.meta, color: v.color || accent.violet };
          if (event) updateEvent(selKey, event.id, payload);
          else addEvent(selKey, payload);
        },
        onDelete: event ? () => removeEvent(selKey, event.id) : undefined,
      });
    },
    [openSheet, selDate, selKey, addEvent, updateEvent, removeEvent]
  );

  return (
    <View style={{ flex: 1, paddingHorizontal: 26 }}>
      <PageHeader
        title="Calendar"
        accent={fmtMonth(cursor)}
        right={
          <>
            <StatChip left={`${monthEventCount} events`} right={`${freeEvenings} free evenings`} />
            <RoundButton
              icon="chevronLeft"
              size={38}
              iconSize={15}
              accessibilityLabel="Previous month"
              onPress={() => shiftMonth(-1)}
            />
            <RoundButton
              icon="chevronRight"
              size={38}
              iconSize={15}
              accessibilityLabel="Next month"
              onPress={() => shiftMonth(1)}
            />
          </>
        }
      />

      <RiseIn
        delay={80}
        style={{
          flex: 1,
          flexDirection: 'row',
          gap: 18,
          paddingBottom: 30,
          borderTopWidth: 1,
          borderTopColor: t.lineSoft,
          paddingTop: 20,
        }}
      >
        <View
          style={{
            flex: 1,
            minWidth: 0,
            padding: 18,
            borderRadius: 22,
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.line,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            {WEEKDAYS.map((d) => (
              <Txt key={d} size={12} color={t.muted2} style={{ flex: 1, textAlign: 'center' }}>
                {d}
              </Txt>
            ))}
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            {Array.from({ length: CELLS / 7 }, (_, row) => (
              <View key={row} style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                {cells.slice(row * 7, row * 7 + 7).map((cell) => {
                  const isSel = cell.inMonth && cell.key === selKey;
                  const isToday = cell.inMonth && cell.key === todayKey;
                  return (
                    <Touchable
                      key={cell.i}
                      disabled={!cell.inMonth}
                      onPress={() => cell.key && selectDate(cell.key)}
                      activeScale={0.97}
                      style={{
                        flex: 1,
                        borderRadius: 14,
                        paddingVertical: 9,
                        paddingHorizontal: 10,
                        justifyContent: 'space-between',
                        backgroundColor: isSel ? t.daySelBg : t.dayBg,
                        borderWidth: 1,
                        borderColor: isSel ? 'transparent' : isToday ? accent.purple : t.line,
                      }}
                    >
                      <Txt
                        size={14}
                        weight="semibold"
                        color={isSel ? t.daySelInk : t.ink}
                        style={{ opacity: cell.inMonth ? 1 : 0.32 }}
                      >
                        {cell.inMonth ? String(cell.dayNum) : ''}
                      </Txt>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        {cell.events.slice(0, 3).map((e) => (
                          <View
                            key={e.id}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: isSel ? t.daySelInk : e.color,
                            }}
                          />
                        ))}
                      </View>
                    </Touchable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={{ width: 348, gap: 18 }}>
          <View
            style={{
              flex: 1,
              minHeight: 0,
              padding: 18,
              borderRadius: 22,
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <View>
                <Txt size={17} weight="medium" tracking={-0.02}>
                  {fmtLongDate(selDate)}
                </Txt>
                <Txt size={13} color={t.muted2} style={{ marginTop: 3 }}>
                  {selEvents.length} {selEvents.length === 1 ? 'event' : 'events'}
                </Txt>
              </View>
              <RoundButton
                icon="plus"
                size={38}
                iconSize={15}
                accessibilityLabel="Add event"
                onPress={() => openEventSheet()}
              />
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 9 }} showsVerticalScrollIndicator={false}>
              {selEvents.map((ev) => (
                <Touchable
                  key={ev.id}
                  onPress={() => openEventSheet(ev)}
                  activeScale={0.99}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 16,
                    backgroundColor: t.surface2,
                    borderWidth: 1,
                    borderColor: t.pillLineSoft,
                    borderLeftWidth: 3,
                    borderLeftColor: ev.color,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <Txt size={14} weight="semibold" tracking={-0.01} numberOfLines={1} style={{ flex: 1 }}>
                      {ev.title}
                    </Txt>
                    <Txt size={12} color={t.muted2}>
                      {to12h(ev.time)}
                    </Txt>
                  </View>
                  <Txt size={12} color={t.muted2} style={{ marginTop: 3 }}>
                    {ev.meta}
                  </Txt>
                </Touchable>
              ))}
              {selEvents.length === 0 ? (
                <Txt size={13} color={t.muted2} style={{ paddingVertical: 12 }}>
                  Nothing scheduled. Enjoy the gap.
                </Txt>
              ) : null}
            </ScrollView>
          </View>

          <View
            style={{
              padding: 18,
              borderRadius: 22,
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <Txt size={17} weight="medium" tracking={-0.02} style={{ marginBottom: 14 }}>
              Where the week goes
            </Txt>
            <View style={{ gap: 12 }}>
              {weekSplit.map((w) => (
                <View key={w.id}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <Txt size={13} color={t.inkSoft}>
                      {w.label}
                    </Txt>
                    <Txt size={13} weight="semibold">
                      {w.value}
                    </Txt>
                  </View>
                  <Meter pct={w.pct} color={w.color} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </RiseIn>
    </View>
  );
}
