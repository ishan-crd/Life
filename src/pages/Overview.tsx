import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ConsistencyChart } from '@/components/ConsistencyChart';
import { FadeCell, GrowBar, GrowBarX } from '@/components/GrowBar';
import { Icon } from '@/components/Icon';
import { ProteinToday } from '@/components/Protein';
import { RiseIn } from '@/components/RiseIn';
import { useSheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { Card, GhostButton, Pill, RoundButton, Txt } from '@/components/ui';
import { addDays, fmtDuration, fmtShortDate, greetingFor, keyOf, mmss, startOfWeek, to12h } from '@/lib/date';
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
import { firstName, useProfileStore } from '@/state/profile';
import { accent, radius, space, useTheme } from '@/theme';

const RANGES = ['Day', 'Week', 'Month'] as const;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AGENDA_TAGS: Record<string, string> = {
  Discord: accent.violet,
  Work: accent.lime,
  Meeting: accent.cyan,
  Body: accent.lime,
  Mind: accent.violet,
};

export function Overview() {
  const t = useTheme();
  const now = useNow(30_000);
  const { openSheet } = useSheet();

  const profile = useProfileStore((s) => s.profile);
  const tasks = useAppStore((s) => s.tasks);
  const range = useAppStore((s) => s.range);
  const setRange = useAppStore((s) => s.setRange);
  const setPage = useAppStore((s) => s.setPage);
  const resetTimer = useAppStore((s) => s.resetTimer);
  const setFocusTotal = useAppStore((s) => s.setFocusTotal);
  const focusLog = useAppStore((s) => s.focusLog);
  const habitLog = useAppStore((s) => s.habitLog);
  const habits = useAppStore((s) => s.habits);
  const events = useAppStore((s) => s.events);
  const addEvent = useAppStore((s) => s.addEvent);

  const done = tasks.filter((x) => x.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const monday = useMemo(() => startOfWeek(now), [now]);
  const sunday = useMemo(() => addDays(monday, 6), [monday]);

  const rangeLabel = useMemo(() => {
    if (range === 0) return { start: fmtShortDate(now), end: 'today' };
    if (range === 2) {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: fmtShortDate(first), end: fmtShortDate(last) };
    }
    return { start: fmtShortDate(monday), end: fmtShortDate(sunday) };
  }, [range, now, monday, sunday]);

  const todayKey = useMemo(() => keyOf(now), [now]);

  /** The focus the bars draw: today by the hour, this week, or this month. */
  const focusBars = useMemo(() => {
    if (range === 0) return focusLog[todayKey] ?? new Array(24).fill(0);
    if (range === 2) return focusMonth(focusLog, now.getFullYear(), now.getMonth());
    return focusSeries(focusLog, now, 7);
  }, [range, focusLog, now, todayKey]);

  /** The same span, one period earlier, for the comparison caption. */
  const previousFocus = useMemo(() => {
    if (range === 0) return focusOn(focusLog, keyOf(addDays(now, -1)));
    if (range === 2) {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return focusMonth(focusLog, last.getFullYear(), last.getMonth())
        .slice(0, now.getDate())
        .reduce((n, v) => n + v, 0);
    }
    return focusSeries(focusLog, addDays(now, -7), 7).reduce((n, v) => n + v, 0);
  }, [range, focusLog, now]);

  const focusTotalLogged = focusBars.reduce((n: number, v: number) => n + v, 0);
  const focusPeak = Math.max(1, ...focusBars);
  const focusAverage = focusBars.length ? focusTotalLogged / focusBars.length : 0;

  const workBars = useMemo(
    () =>
      focusBars.map((seconds: number, i: number) => ({
        h: 12 + (seconds / focusPeak) * 88,
        c: i % 3 === 0 ? accent.violet : i % 3 === 1 ? accent.purple : accent.purpleSoft,
        delay: 200 + i * 14,
      })),
    [focusBars, focusPeak]
  );

  /** Habits kept on each of the last seven days. */
  const habitBars = useMemo(() => {
    const counts = Array.from({ length: 7 }, (_, i) => habitsLoggedOn(habitLog, keyOf(addDays(now, i - 6))));
    const peak = Math.max(1, ...counts);
    return counts.map((v, i) => ({ h: 12 + (v / peak) * 88, delay: 300 + i * 30 }));
  }, [habitLog, now]);

  const heat = useMemo(() => focusHeat(focusLog, now, 8), [focusLog, now]);
  const streak = useMemo(() => focusStreak(focusLog, now), [focusLog, now]);
  const consistency = useMemo(
    () => consistencySeries(habitLog, habits, now, 6),
    [habitLog, habits, now]
  );
  const habitsKeptWeek = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => habitsLoggedOn(habitLog, keyOf(addDays(now, i - 6)))).reduce(
        (n, v) => n + v,
        0
      ),
    [habitLog, now]
  );
  const latest = consistency[consistency.length - 1];

  const agenda = useMemo(() => (events[todayKey] ?? []).slice(0, 5), [events, todayKey]);

  const focusLogged = fmtDuration(focusOn(focusLog, todayKey));

  const goToBoard = useCallback(() => setPage(1), [setPage]);

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
    <View style={{ flex: 1, paddingHorizontal: space.gutter }}>
      <RiseIn
        delay={50}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 6,
          paddingBottom: 22,
        }}
      >
        <Txt size={44} weight="medium" tracking={-0.03} numberOfLines={1}>
          {greetingFor(now.getHours())},
          <Txt size={44} weight="medium" tracking={-0.03} color={t.inkDim}>
            {` ${firstName(profile)}`}
          </Txt>
        </Txt>
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
                  paddingHorizontal: space.gutter,
                  paddingVertical: 11,
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
      </RiseIn>

      <RiseIn delay={100} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: t.lineSoft }}>
        <View style={{ width: 428, paddingTop: 18, paddingRight: 30, paddingBottom: 16 }}>
          <Txt size={16} color={t.muted}>
            Today&apos;s plan
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 9, marginTop: 8 }}>
            <Txt size={46} weight="medium" tracking={-0.035} lineHeight={1}>
              {done}
              <Txt size={46} weight="medium" tracking={-0.035} color={t.muted4}>
                /{tasks.length}
              </Txt>
            </Txt>
            <Txt size={13} weight="medium" color={t.cyan} style={{ paddingBottom: 7 }}>
              {pct}% done
            </Txt>
          </View>
          <Txt size={13} color={t.muted2} style={{ marginTop: 18 }}>
            Focus logged today:{' '}
            <Txt size={13} weight="semibold" color={t.ink}>
              {focusLogged}
            </Txt>
            {' · streak '}
            <Txt size={13} weight="semibold" color={t.ink}>
              {streak} days
            </Txt>
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 }}>
            <GhostButton label="Board" icon="arrowRight" onPress={goToBoard} />
            <FocusButton />
            <RoundButton
              icon="dots"
              size={46}
              iconSize={16}
              variant="outline"
              accessibilityLabel="Focus options"
              onPress={openTimerOptions}
            />
          </View>
          <ProteinToday dateKey={todayKey} />
        </View>

        <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: t.lineSoft, paddingLeft: 20 }}>
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: '40.5%', top: 0, bottom: 44, width: 1, backgroundColor: t.lineSoft }}
          />
          <View pointerEvents="none" style={{ position: 'absolute', left: '40.5%', top: -16, paddingLeft: 14 }}>
            <Txt size={17} weight="semibold" tracking={-0.02}>
              {fmtDuration(focusTotalLogged)} logged
            </Txt>
          </View>
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: '83%', top: 44, bottom: 44, width: 1, backgroundColor: t.lineSoft }}
          />
          <Txt size={17} weight="semibold" tracking={-0.02} style={{ paddingTop: 14 }}>
            {fmtDuration(previousFocus)} before
          </Txt>

          <DashedRule color={t.btnLine} style={{ position: 'absolute', left: 0, right: 0, top: 104 }} />
          <View style={{ position: 'absolute', left: '65%', top: 88 }}>
            <Pill paddingH={15} paddingV={8}>{`Average ${fmtDuration(focusAverage)}`}</Pill>
          </View>

          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end', height: 186, paddingTop: 36 }}>
            <View style={{ flex: 1.02, paddingRight: 20 }}>
              <Txt size={14} style={{ marginBottom: 12 }}>
                <Txt size={14} weight="semibold">
                  {pct}%
                </Txt>
                <Txt size={14} color={t.muted2}>
                  {' Rituals'}
                </Txt>
              </Txt>
              <View style={{ height: 46, width: `${pct}%`, minWidth: 8 }}>
                <GrowBarX
                  delay={200}
                  duration={800}
                  style={{ height: 46, borderRadius: radius.chip, overflow: 'hidden' }}
                >
                  <LinearGradient
                    colors={[accent.purpleSoft, accent.purpleDeep]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ flex: 1 }}
                  />
                </GrowBarX>
              </View>
            </View>

            <View style={{ flex: 1, paddingRight: 20 }}>
              <Txt size={14} style={{ marginBottom: 12 }}>
                <Txt size={14} weight="semibold">
                  {fmtDuration(focusTotalLogged)}
                </Txt>
                <Txt size={14} color={t.muted2}>
                  {' Deep work'}
                </Txt>
              </Txt>
              <BarGroup bars={workBars} height={62} />
            </View>

            <View style={{ flex: 0.38 }}>
              <Txt size={14} style={{ marginBottom: 12 }}>
                <Txt size={14} weight="semibold">
                  {habitsKeptWeek}
                </Txt>
                <Txt size={14} color={t.muted2}>
                  {' Habits'}
                </Txt>
              </Txt>
              <BarGroup bars={habitBars} height={56} color={t.barMuted} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
            <Txt size={14} color={t.muted}>
              {rangeLabel.start}
            </Txt>
            <Txt size={14} color={t.muted}>
              {rangeLabel.end}
            </Txt>
          </View>
        </View>
      </RiseIn>

      <RiseIn delay={180} style={{ flex: 1, flexDirection: 'row', gap: space.gap, paddingBottom: 30 }}>
        <Card style={{ flex: 1 }}>
          <CardHead icon="smile" title="Consistency" action="dots" onAction={() => {}} />
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 16 }}>
            <Legend color={accent.limeChart} label="Kept" />
            <Legend color={t.legendMuted} label="Missed" muted />
          </View>
          <View style={{ marginTop: 10, height: 176 }}>
            <ConsistencyChart
              theme={t}
              height={176}
              kept={consistency.map((m) => m.kept)}
              missed={consistency.map((m) => Math.min(1, 1 - m.kept))}
            />
            <View style={{ position: 'absolute', right: 2, top: 20 }}>
              <ChartBadge color={accent.limeChart} label={`${Math.round((latest?.kept ?? 0) * 100)}% kept`} />
            </View>
            <View style={{ position: 'absolute', right: 2, top: 58 }}>
              <ChartBadge color={t.legendMuted} label={`${latest?.missed ?? 0} missed`} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 2 }}>
            {consistency.map((m) => (
              <Txt key={m.label} size={13} color={t.muted2}>
                {m.label}
              </Txt>
            ))}
          </View>
        </Card>

        <Card style={{ flex: 1 }}>
          <CardHead icon="globe" title="Focus by time" action="expand" onAction={() => {}} />
          <View style={{ flexDirection: 'row', gap: 7, marginTop: 18 }}>
            <View style={{ width: 42 }} />
            {WEEKDAYS.map((d) => (
              <Txt key={d} size={12} color={t.muted2} style={{ flex: 1, textAlign: 'center' }}>
                {d}
              </Txt>
            ))}
          </View>
          <View style={{ marginTop: 8, gap: 7 }}>
            {heat.map((row, r) => (
              <View key={r} style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
                <Txt size={12} color={t.muted2} style={{ width: 42 }}>
                  {FOCUS_BANDS[r].label}
                </Txt>
                {row.map((v, c) => (
                  <FadeCell
                    key={c}
                    delay={150 + (r + c) * 25}
                    style={{
                      flex: 1,
                      height: 32,
                      borderRadius: radius.chip,
                      backgroundColor: t.heat[v as 1 | 2 | 3 | 4 | 5],
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 16,
            }}
          >
            <Txt size={12} color={t.muted2}>
              Less
            </Txt>
            {t.heatLegend.map((c) => (
              <View key={c} style={{ width: 15, height: 15, borderRadius: radius.swatch, backgroundColor: c }} />
            ))}
            <Txt size={12} color={t.muted2}>
              More
            </Txt>
          </View>
        </Card>

        <Card style={{ flex: 1 }}>
          <CardHead icon="clock" title="Up next today" action="plus" onAction={openAddEvent} />
          <View style={{ marginTop: 16 }}>
            {agenda.map((item) => (
              <Touchable
                key={item.id}
                activeScale={0.99}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  marginHorizontal: -8,
                  borderRadius: radius.cell,
                }}
              >
                <Txt size={14} weight="semibold" tracking={-0.01} numberOfLines={1} style={{ flex: 1 }}>
                  {item.title}
                </Txt>
                <Pill dot={item.color}>{tagFor(item)}</Pill>
                <Txt size={14} weight="semibold" style={{ textAlign: 'right' }}>
                  {to12h(item.time)}
                </Txt>
                <RoundButton
                  icon="dots"
                  size={26}
                  iconSize={14}
                  variant="outline"
                  color={t.muted3}
                  style={{ borderColor: 'transparent' }}
                  accessibilityLabel="Options"
                  onPress={() => {}}
                />
              </Touchable>
            ))}
          </View>
        </Card>
      </RiseIn>
    </View>
  );
}

function tagFor(item: { meta: string; color: string }): string {
  const entry = Object.entries(AGENDA_TAGS).find(([, c]) => c === item.color);
  return entry ? entry[0] : 'Life';
}

function Legend({ color, label, muted }: { color: string; label: string; muted?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 13, height: 13, borderRadius: 3, backgroundColor: color }} />
      <Txt size={14} color={muted ? t.inkSoft : t.ink}>
        {label}
      </Txt>
    </View>
  );
}

function ChartBadge({ color, label }: { color: string; label: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: radius.chip,
        backgroundColor: t.pill,
        borderWidth: 1,
        borderColor: t.pillLine,
      }}
    >
      <View style={{ width: 3, height: 15, borderRadius: 2, backgroundColor: color }} />
      <Txt size={13} weight="semibold">
        {label}
      </Txt>
    </View>
  );
}

function CardHead({
  icon,
  title,
  action,
  onAction,
}: {
  icon: 'smile' | 'globe' | 'clock';
  title: string;
  action: 'dots' | 'expand' | 'plus';
  onAction(): void;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <Icon name={icon} size={21} color={t.inkSoft2} strokeWidth={1.7} />
        <Txt size={18} weight="medium" tracking={-0.02}>
          {title}
        </Txt>
      </View>
      <RoundButton icon={action} size={34} iconSize={15} onPress={onAction} accessibilityLabel={title} />
    </View>
  );
}

/** The repeating 7px dash rule under the planned/logged labels. */
function DashedRule({ color, style }: { color: string; style?: object }) {
  return (
    <View style={[{ flexDirection: 'row', height: 1, overflow: 'hidden' }, style]}>
      {Array.from({ length: 60 }, (_, i) => (
        <View key={i} style={{ width: 7, height: 1, marginRight: 7, backgroundColor: color }} />
      ))}
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
  height,
  color,
}: {
  bars: Bar[];
  height: number;
  /** Fallback fill for bar groups that share one colour. */
  color?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height }}>
      {bars.map((b, i) => (
        <View key={i} style={{ flex: 1, height: `${b.h}%` }}>
          <GrowBar
            delay={b.delay}
            style={{ flex: 1, borderRadius: 5, backgroundColor: b.c ?? color ?? accent.violetInk }}
          />
        </View>
      ))}
    </View>
  );
});

/**
 * The focus timer ticks every second. Keeping its subscription in a leaf means
 * the rest of the overview — charts, heatmap, bars — never re-renders for it.
 */
function FocusButton() {
  const left = useAppStore((s) => s.focusLeft);
  const running = useAppStore((s) => s.focusRunning);
  const toggleTimer = useAppStore((s) => s.toggleTimer);
  return <GhostButton label={`${running ? 'Pause' : 'Focus'} · ${mmss(left)}`} onPress={toggleTimer} />;
}
