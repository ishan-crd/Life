import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ConsistencyChart } from '@/components/ConsistencyChart';
import { FadeCell, GrowBar, GrowBarX } from '@/components/GrowBar';
import { useSheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { GhostButton, Pill, Txt } from '@/components/ui';
import { addDays, fmtDuration, fmtShortDate, keyOf, mmss, startOfWeek, to12h } from '@/lib/date';
import { useNow } from '@/lib/useNow';
import {
  consistencySeries,
  FOCUS_BANDS,
  focusHeat,
  focusMonth,
  focusOn,
  focusSeries,
  focusStreak,
  habitsLoggedOn,
} from '@/state/metrics';
import { useAppStore } from '@/state/store';
import { accent, radius, useLayout, useTheme } from '@/theme';
import { WidgetCard } from './WidgetCard';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AGENDA_TAGS: Record<string, string> = {
  Discord: accent.violet,
  Work: accent.lime,
  Meeting: accent.cyan,
  Body: accent.lime,
  Mind: accent.violet,
};

/** Today's rituals, the focus timer and what the timer has banked. */
export function PlanWidget() {
  const t = useTheme();
  const { compact } = useLayout();
  const now = useNow(30_000);
  const { openSheet } = useSheet();

  const tasks = useAppStore((s) => s.tasks);
  const setPage = useAppStore((s) => s.setPage);
  const focusLog = useAppStore((s) => s.focusLog);
  const resetTimer = useAppStore((s) => s.resetTimer);
  const setFocusTotal = useAppStore((s) => s.setFocusTotal);

  const done = tasks.filter((x) => x.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const streak = useMemo(() => focusStreak(focusLog, now), [focusLog, now]);
  const logged = focusOn(focusLog, keyOf(now));

  const openTimerOptions = useCallback(() => {
    openSheet({
      title: 'Focus timer',
      subtitle: 'Set the length of a single focus block.',
      submitLabel: 'Apply',
      fields: [
        {
          key: 'minutes',
          label: 'Block length',
          kind: 'select',
          initial: '25',
          options: [
            { label: '15 min', value: '15' },
            { label: '25 min', value: '25' },
            { label: '45 min', value: '45' },
            { label: '60 min', value: '60' },
            { label: '90 min', value: '90' },
          ],
        },
      ],
      onSubmit: (v) => setFocusTotal(Number(v.minutes)),
      onDelete: resetTimer,
      deleteLabel: 'Reset timer',
    });
  }, [openSheet, setFocusTotal, resetTimer]);

  return (
    <WidgetCard title="Today's plan" icon="check" action="dots" actionLabel="Focus options" onAction={openTimerOptions}>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 9 }}>
            <Txt size={compact ? 30 : 38} weight="medium" tracking={-0.035} lineHeight={1}>
              {done}
              <Txt size={compact ? 30 : 38} weight="medium" tracking={-0.035} color={t.muted4}>
                /{tasks.length}
              </Txt>
            </Txt>
            <Txt size={13} weight="medium" color={t.cyan} style={{ paddingBottom: 6 }}>
              {pct}% done
            </Txt>
          </View>
          <Txt size={13} color={t.muted2} style={{ marginTop: 8 }}>
            {'Focus today '}
            <Txt size={13} weight="semibold" color={t.ink}>
              {fmtDuration(logged)}
            </Txt>
            {' · streak '}
            <Txt size={13} weight="semibold" color={t.ink}>
              {streak} days
            </Txt>
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <GhostButton label="Board" icon="arrowRight" onPress={() => setPage(1)} />
          <FocusButton />
        </View>
      </View>
    </WidgetCard>
  );
}

/**
 * The focus timer ticks every second. Keeping its subscription in a leaf means
 * the rest of the widget — and every other widget — never re-renders for it.
 */
function FocusButton() {
  const left = useAppStore((s) => s.focusLeft);
  const running = useAppStore((s) => s.focusRunning);
  const toggleTimer = useAppStore((s) => s.toggleTimer);
  return <GhostButton label={`${running ? 'Pause' : 'Focus'} · ${mmss(left)}`} onPress={toggleTimer} />;
}

/** Focus logged over the selected range, against the period before it. */
export function DeepWorkWidget() {
  const t = useTheme();
  const { compact } = useLayout();
  const now = useNow(60_000);
  /** The habits group is dropped in a one-column slot, where three groups collide. */
  const [width, setWidth] = useState(0);
  const roomy = width >= 440;

  const range = useAppStore((s) => s.range);
  const tasks = useAppStore((s) => s.tasks);
  const focusLog = useAppStore((s) => s.focusLog);
  const habitLog = useAppStore((s) => s.habitLog);

  const todayKey = keyOf(now);
  const done = tasks.filter((x) => x.done).length;
  const ritualPct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const series = useMemo(() => {
    if (range === 0) return focusLog[todayKey] ?? new Array(24).fill(0);
    if (range === 2) return focusMonth(focusLog, now.getFullYear(), now.getMonth());
    return focusSeries(focusLog, now, 7);
  }, [range, focusLog, now, todayKey]);

  const previous = useMemo(() => {
    if (range === 0) return focusOn(focusLog, keyOf(addDays(now, -1)));
    if (range === 2) {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return focusMonth(focusLog, last.getFullYear(), last.getMonth())
        .slice(0, now.getDate())
        .reduce((n, v) => n + v, 0);
    }
    return focusSeries(focusLog, addDays(now, -7), 7).reduce((n, v) => n + v, 0);
  }, [range, focusLog, now]);

  const total = series.reduce((n: number, v: number) => n + v, 0);
  const peak = Math.max(1, ...series);
  const average = series.length ? total / series.length : 0;

  const bars = useMemo(
    () =>
      series.map((seconds: number, i: number) => ({
        h: 12 + (seconds / peak) * 88,
        c: i % 3 === 0 ? accent.violet : i % 3 === 1 ? accent.purple : accent.purpleSoft,
        delay: 200 + i * 14,
      })),
    [series, peak]
  );

  const habitBars = useMemo(() => {
    const counts = Array.from({ length: 7 }, (_, i) => habitsLoggedOn(habitLog, keyOf(addDays(now, i - 6))));
    const max = Math.max(1, ...counts);
    return counts.map((v, i) => ({ h: 12 + (v / max) * 88, delay: 300 + i * 30 }));
  }, [habitLog, now]);

  const habitsKept = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => habitsLoggedOn(habitLog, keyOf(addDays(now, i - 6)))).reduce(
        (n, v) => n + v,
        0
      ),
    [habitLog, now]
  );

  const span = useMemo(() => {
    if (range === 0) return { start: fmtShortDate(now), end: 'today' };
    if (range === 2) {
      return {
        start: fmtShortDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: fmtShortDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    }
    const monday = startOfWeek(now);
    return { start: fmtShortDate(monday), end: fmtShortDate(addDays(monday, 6)) };
  }, [range, now]);

  return (
    <WidgetCard title={`${fmtDuration(total)} logged`} icon="clock">
      <View style={{ flex: 1, justifyContent: 'space-between' }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt size={13} color={t.muted2}>
            {fmtDuration(previous)} the period before
          </Txt>
          <Pill paddingH={12} paddingV={6}>{`Average ${fmtDuration(average)}`}</Pill>
        </View>

        <View style={{ flexDirection: 'row', gap: compact ? 10 : 16, alignItems: 'stretch', flex: 1, minHeight: 0, paddingTop: 10 }}>
          <View style={{ flex: roomy ? 1.02 : 0.7, alignSelf: 'stretch', paddingRight: compact ? 8 : 16 }}>
            <Txt size={13} style={{ marginBottom: 10 }} numberOfLines={1}>
              <Txt size={13} weight="semibold">
                {ritualPct}%
              </Txt>
              <Txt size={13} color={t.muted2}>
                {' Rituals'}
              </Txt>
            </Txt>
            <View style={{ flex: 1, minHeight: 24, maxHeight: 46, width: `${Math.max(4, ritualPct)}%` }}>
              <GrowBarX delay={200} duration={800} style={{ flex: 1, borderRadius: radius.chip, overflow: 'hidden' }}>
                <LinearGradient
                  colors={[accent.purpleSoft, accent.purpleDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{ flex: 1 }}
                />
              </GrowBarX>
            </View>
          </View>

          <View style={{ flex: 1, alignSelf: 'stretch', paddingRight: roomy ? (compact ? 8 : 16) : 0 }}>
            <Txt size={13} style={{ marginBottom: 10 }} numberOfLines={1}>
              <Txt size={13} weight="semibold">
                {fmtDuration(total)}
              </Txt>
              <Txt size={13} color={t.muted2}>
                {' Deep work'}
              </Txt>
            </Txt>
            <BarGroup bars={bars} />
          </View>

          {roomy ? (
          <View style={{ flex: 0.42, alignSelf: 'stretch' }}>
            <Txt size={13} style={{ marginBottom: 10 }}>
              <Txt size={13} weight="semibold">
                {habitsKept}
              </Txt>
              <Txt size={13} color={t.muted2}>
                {' Habits'}
              </Txt>
            </Txt>
            <BarGroup bars={habitBars} color={t.barMuted} />
          </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
          <Txt size={12} color={t.muted}>
            {span.start}
          </Txt>
          <Txt size={12} color={t.muted}>
            {span.end}
          </Txt>
        </View>
      </View>
    </WidgetCard>
  );
}

/** Habits kept versus missed, month by month. */
export function ConsistencyWidget() {
  const t = useTheme();
  const now = useNow(60_000);
  const habitLog = useAppStore((s) => s.habitLog);
  const habits = useAppStore((s) => s.habits);

  const months = useMemo(() => consistencySeries(habitLog, habits, now, 6), [habitLog, habits, now]);
  const latest = months[months.length - 1];

  return (
    <WidgetCard title="Consistency" icon="smile">
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', gap: 18 }}>
          <Legend color={accent.limeChart} label={`${Math.round((latest?.kept ?? 0) * 100)}% kept`} />
          <Legend color={t.legendMuted} label={`${latest?.missed ?? 0} missed`} muted />
        </View>
        <View style={{ flex: 1, minHeight: 0, marginTop: 8 }}>
          <ConsistencyChart
            theme={t}
            height="100%"
            kept={months.map((m) => m.kept)}
            missed={months.map((m) => Math.min(1, 1 - m.kept))}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 }}>
          {months.map((m) => (
            <Txt key={m.label} size={12} color={t.muted2}>
              {m.label}
            </Txt>
          ))}
        </View>
      </View>
    </WidgetCard>
  );
}

/** When in the day and week focus actually lands. */
export function HeatmapWidget() {
  const t = useTheme();
  const now = useNow(60_000);
  const focusLog = useAppStore((s) => s.focusLog);
  const heat = useMemo(() => focusHeat(focusLog, now, 8), [focusLog, now]);

  return (
    <WidgetCard title="Focus by time" icon="globe">
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={{ width: 38 }} />
          {WEEKDAYS.map((d) => (
            <Txt key={d} size={11} color={t.muted2} style={{ flex: 1, textAlign: 'center' }}>
              {d}
            </Txt>
          ))}
        </View>
        <View style={{ flex: 1, gap: 6, marginTop: 6 }}>
          {heat.map((row, r) => (
            <View key={r} style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Txt size={11} color={t.muted2} style={{ width: 38 }}>
                {FOCUS_BANDS[r].label}
              </Txt>
              {row.map((v, c) => (
                <FadeCell
                  key={c}
                  delay={150 + (r + c) * 25}
                  style={{
                    flex: 1,
                    alignSelf: 'stretch',
                    borderRadius: radius.chip,
                    backgroundColor: t.heat[v as 1 | 2 | 3 | 4 | 5],
                  }}
                />
              ))}
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 7, marginTop: 10 }}>
          <Txt size={11} color={t.muted2}>
            Less
          </Txt>
          {t.heatLegend.map((c) => (
            <View key={c} style={{ width: 13, height: 13, borderRadius: radius.swatch, backgroundColor: c }} />
          ))}
          <Txt size={11} color={t.muted2}>
            More
          </Txt>
        </View>
      </View>
    </WidgetCard>
  );
}

/** What is left on today's calendar. */
export function AgendaWidget() {
  const t = useTheme();
  const now = useNow(60_000);
  const { openSheet } = useSheet();
  const events = useAppStore((s) => s.events);
  const addEvent = useAppStore((s) => s.addEvent);
  const todayKey = keyOf(now);
  const agenda = events[todayKey] ?? [];

  const openAddEvent = useCallback(() => {
    openSheet({
      title: 'Add to today',
      submitLabel: 'Add',
      fields: [
        { key: 'title', label: 'What', placeholder: 'Deep work — motion spec', required: true },
        { key: 'time', label: 'When', placeholder: '14:30', initial: '10:00', required: true },
        { key: 'meta', label: 'Detail', placeholder: '1 hour · FaceTime' },
        {
          key: 'color',
          label: 'Tag',
          kind: 'select',
          options: [
            { label: 'Work', value: accent.lime, color: accent.lime },
            { label: 'Meeting', value: accent.cyan, color: accent.cyan },
            { label: 'Community', value: accent.violet, color: accent.violet },
          ],
        },
      ],
      onSubmit: (v) =>
        addEvent(todayKey, { title: v.title, time: v.time, meta: v.meta, color: v.color || accent.violet }),
    });
  }, [openSheet, addEvent, todayKey]);

  return (
    <WidgetCard title="Up next today" icon="clock" action="plus" actionLabel="Add to today" onAction={openAddEvent}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {agenda.map((item) => (
          <View
            key={item.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}
          >
            <Txt size={13} weight="semibold" tracking={-0.01} numberOfLines={1} style={{ flex: 1 }}>
              {item.title}
            </Txt>
            <Pill dot={item.color} paddingH={10} paddingV={5}>
              {tagFor(item)}
            </Pill>
            <Txt size={13} weight="semibold">
              {to12h(item.time)}
            </Txt>
          </View>
        ))}
        {agenda.length === 0 ? (
          <Txt size={13} color={t.muted2} style={{ paddingVertical: 10 }}>
            Nothing scheduled. Enjoy the gap.
          </Txt>
        ) : null}
      </ScrollView>
    </WidgetCard>
  );
}

/** Today's habits, tickable without leaving the home page. */
export function HabitsWidget() {
  const t = useTheme();
  const now = useNow(60_000);
  const habits = useAppStore((s) => s.habits);
  const habitLog = useAppStore((s) => s.habitLog);
  const toggleHabitOn = useAppStore((s) => s.toggleHabitOn);
  const setPage = useAppStore((s) => s.setPage);

  const todayKey = keyOf(now);
  const logged = habitLog[todayKey] ?? [];

  return (
    <WidgetCard
      title={`Habits · ${logged.length}/${habits.length}`}
      icon="check"
      action="arrowRight"
      actionLabel="Open health"
      onAction={() => setPage(3)}
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {habits.map((h) => {
          const on = logged.includes(h.id);
          return (
            <Touchable
              key={h.id}
              onPress={() => toggleHabitOn(h.id, todayKey)}
              activeScale={0.99}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: radius.glyph,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: h.tint,
                }}
              >
                <Txt size={12}>{h.glyph}</Txt>
              </View>
              <Txt size={13} numberOfLines={1} style={{ flex: 1 }} color={on ? t.ink : t.inkSoft}>
                {h.name}
              </Txt>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: radius.check,
                  borderWidth: 1,
                  backgroundColor: on ? accent.purple : 'transparent',
                  borderColor: on ? accent.purple : t.btnLineSoft,
                }}
              />
            </Touchable>
          );
        })}
      </ScrollView>
    </WidgetCard>
  );
}

function tagFor(item: { meta: string; color: string }): string {
  const entry = Object.entries(AGENDA_TAGS).find(([, c]) => c === item.color);
  return entry ? entry[0] : 'Life';
}

function Legend({ color, label, muted }: { color: string; label: string; muted?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color }} />
      <Txt size={13} color={muted ? t.inkSoft : t.ink}>
        {label}
      </Txt>
    </View>
  );
}

interface Bar {
  h: number;
  c?: string;
  delay: number;
}

/** A row of bottom-anchored bars that grow in on mount. */
const BarGroup = React.memo(function BarGroup({
  bars,
  color,
}: {
  bars: Bar[];
  color?: string;
}) {
  return (
    <View style={{ flex: 1, minHeight: 26, flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
      {bars.map((b, i) => (
        <View key={i} style={{ flex: 1, height: `${b.h}%` }}>
          <GrowBar delay={b.delay} style={{ flex: 1, borderRadius: 4, backgroundColor: b.c ?? color ?? accent.violetInk }} />
        </View>
      ))}
    </View>
  );
});
