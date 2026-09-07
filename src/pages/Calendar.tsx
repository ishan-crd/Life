import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Panes } from '@/components/Panes';
import { ProteinDayLog } from '@/components/Protein';
import { RiseIn } from '@/components/RiseIn';
import { useSheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { Meter, RoundButton, StatChip, Txt } from '@/components/ui';
import { dateKey, daysInMonth, fmtLongDate, fmtMonth, monthLead, to12h } from '@/lib/date';
import { useNow } from '@/lib/useNow';
import { weekSplit } from '@/state/metrics';
import { proteinTotal, useAppStore } from '@/state/store';
import type { CalEvent } from '@/state/types';
import { accent, radius, useLayout, useTheme } from '@/theme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CELLS = 35;

/** One colour per tracked domain in "Where the week goes". */
const SPLIT_COLORS: Record<string, string> = {
  focus: accent.purple,
  habits: accent.lime,
  protein: accent.cyan,
};

const COLOR_OPTIONS = [
  { label: 'Work', value: accent.lime, color: accent.lime },
  { label: 'Meeting', value: accent.cyan, color: accent.cyan },
  { label: 'Community', value: accent.violet, color: accent.violet },
];

export function Calendar() {
  const t = useTheme();
  const { compact, gutter, gap, cardPad, sideColumn } = useLayout();
  const now = useNow(60_000);
  const { openSheet } = useSheet();

  const events = useAppStore((s) => s.events);
  const ensureMonth = useAppStore((s) => s.ensureMonth);
  const addEvent = useAppStore((s) => s.addEvent);
  const updateEvent = useAppStore((s) => s.updateEvent);
  const removeEvent = useAppStore((s) => s.removeEvent);
  const protein = useAppStore((s) => s.protein);
  const focusLog = useAppStore((s) => s.focusLog);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const selectDate = useAppStore((s) => s.selectDate);
  const habitLog = useAppStore((s) => s.habitLog);

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
        return {
          i,
          dayNum,
          inMonth,
          key,
          events: key ? events[key] ?? [] : [],
          grams: key ? proteinTotal(protein[key]) : 0,
        };
      }),
    [lead, total, year, month, events, protein]
  );

  const monthEventCount = useMemo(
    () =>
      cells.reduce((n, c) => n + c.events.length, 0),
    [cells]
  );

  /** An evening counts as free when nothing is booked between 18:00 and 22:00. */
  const freeEvenings = useMemo(
    () =>
      cells.filter((c) => {
        if (!c.inMonth) return false;
        return !c.events.some((e) => {
          const hour = Number(e.time.split(':')[0]);
          return hour >= 18 && hour < 22;
        });
      }).length,
    [cells]
  );

  /** The three tracked domains, each against your best of the last four weeks. */
  const week = useMemo(
    () => weekSplit(focusLog, habitLog, protein, now),
    [focusLog, habitLog, protein, now]
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
    <View style={{ flex: 1, paddingHorizontal: gutter }}>
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
          borderTopWidth: 1,
          borderTopColor: t.lineSoft,
          paddingTop: compact ? 14 : 20,
        }}
      >
        <Panes>
        <View
          style={{
            flex: compact ? undefined : 1,
            minWidth: 0,
            // Inside a stack the grid has no flex parent to fill, so it takes
            // the height five rows of day cells actually need.
            height: compact ? 320 : undefined,
            padding: cardPad,
            borderRadius: radius.card,
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
                        borderRadius: radius.cell,
                        paddingVertical: 9,
                        paddingHorizontal: 10,
                        justifyContent: 'space-between',
                        backgroundColor: isSel ? t.daySelBg : t.dayBg,
                        borderWidth: 1,
                        borderColor: isSel ? 'transparent' : isToday ? accent.purple : t.line,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 4,
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
                        {cell.grams > 0 ? (
                          <Txt
                            size={11}
                            weight="semibold"
                            color={isSel ? t.daySelInk : t.protein}
                            numberOfLines={1}
                          >
                            {cell.grams}g
                          </Txt>
                        ) : null}
                      </View>
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

        <View style={{ width: sideColumn ?? '100%', gap }}>
          <View
            style={{
              flex: compact ? undefined : 1,
              // A stacked card has no flex parent, so the events list needs a
              // height of its own to scroll inside.
              height: compact ? 360 : undefined,
              minHeight: 0,
              padding: cardPad,
              borderRadius: radius.card,
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
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={17} weight="medium" tracking={-0.02} numberOfLines={1}>
                  {fmtLongDate(selDate)}
                </Txt>
                <Txt size={13} color={t.muted2} style={{ marginTop: 3 }}>
                  {selEvents.length} {selEvents.length === 1 ? 'event' : 'events'} ·{' '}
                  {proteinTotal(protein[selKey])} g protein
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
            <ProteinDayLog dateKey={selKey} subtitle={fmtLongDate(selDate)} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 9 }} showsVerticalScrollIndicator={false}>
              {selEvents.map((ev) => (
                <Touchable
                  key={ev.id}
                  onPress={() => openEventSheet(ev)}
                  activeScale={0.99}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: radius.tile,
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
              padding: cardPad,
              borderRadius: radius.card,
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <Txt size={17} weight="medium" tracking={-0.02} style={{ marginBottom: 14 }}>
              Where the week goes
            </Txt>
            <View style={{ gap: 12 }}>
              {week.map((w) => (
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
                  <Meter pct={w.pct} color={SPLIT_COLORS[w.id]} />
                </View>
              ))}
            </View>
          </View>
        </View>
        </Panes>
      </RiseIn>
    </View>
  );
}
