import React, { useCallback, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { GrowBar } from '@/components/GrowBar';
import { Icon } from '@/components/Icon';
import { PageHeader } from '@/components/PageHeader';
import { Panes } from '@/components/Panes';
import { RiseIn } from '@/components/RiseIn';
import { useSheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { Meter, ProgressRing, RoundButton, StatChip, Txt } from '@/components/ui';
import { addDays, isoDay, keyOf, startOfWeek } from '@/lib/date';
import { useNow } from '@/lib/useNow';
import { habitWeek, weekSeries } from '@/state/metrics';
import { useAppStore } from '@/state/store';
import type { Habit, Med } from '@/state/types';
import { accent, CURVE, DURATION, HABIT_TINTS, onAccent, radius, useLayout, useTheme } from '@/theme';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function Habits() {
  const t = useTheme();
  const { compact, gutter, gap, cardPad, sideColumn } = useLayout();
  const now = useNow(60_000);
  const { openSheet } = useSheet();

  const habits = useAppStore((s) => s.habits);
  const meds = useAppStore((s) => s.meds);
  const habitLog = useAppStore((s) => s.habitLog);
  const toggleHabitOn = useAppStore((s) => s.toggleHabitOn);
  const addHabit = useAppStore((s) => s.addHabit);
  const updateHabit = useAppStore((s) => s.updateHabit);
  const removeHabit = useAppStore((s) => s.removeHabit);
  const toggleMed = useAppStore((s) => s.toggleMed);
  const addMed = useAppStore((s) => s.addMed);
  const updateMed = useAppStore((s) => s.updateMed);
  const removeMed = useAppStore((s) => s.removeMed);
  const waterLog = useAppStore((s) => s.waterLog);
  const waterGoal = useAppStore((s) => s.waterGoal);
  const addWater = useAppStore((s) => s.addWater);
  const stepLog = useAppStore((s) => s.stepLog);
  const stepGoal = useAppStore((s) => s.stepGoal);
  const setSteps = useAppStore((s) => s.setSteps);
  const sleepLog = useAppStore((s) => s.sleepLog);
  const setSleep = useAppStore((s) => s.setSleep);

  const weekStart = useMemo(() => startOfWeek(now), [now]);
  const dotSize = compact ? 20 : 26;
  const dotGap = compact ? 5 : 8;

  const today = isoDay(now);
  const todayKey = keyOf(now);
  const loggedToday = habitLog[todayKey] ?? [];
  const habitDone = habits.filter((h) => loggedToday.includes(h.id)).length;
  const medsTaken = meds.filter((m) => m.taken).length;
  const medsPct = meds.length ? medsTaken / meds.length : 0;

  const water = waterLog[todayKey] ?? 0;
  const steps = stepLog[todayKey] ?? 0;
  const stepPct = Math.min(100, Math.round((steps / stepGoal) * 100));
  const sleepMinutes = sleepLog[todayKey] ?? 0;
  const sleepWeek = useMemo(() => weekSeries(sleepLog, now), [sleepLog, now]);
  const sleepPeak = Math.max(1, ...sleepWeek);

  const openHabitSheet = useCallback(
    (habit?: Habit) => {
      openSheet({
        title: habit ? 'Edit habit' : 'New habit',
        submitLabel: habit ? 'Save' : 'Add habit',
        fields: [
          { key: 'name', label: 'Habit', placeholder: 'Read 20 pages', initial: habit?.name, required: true },
          { key: 'meta', label: 'Detail', placeholder: 'Before bed', initial: habit?.meta },
          { key: 'glyph', label: 'Glyph', placeholder: '📖', initial: habit?.glyph ?? '✨' },
          { key: 'tint', label: 'Tint', kind: 'select', initial: habit?.tint, options: [...HABIT_TINTS] },
        ],
        onSubmit: (v) => {
          const payload = { name: v.name, meta: v.meta, glyph: v.glyph || '✨', tint: v.tint };
          if (habit) updateHabit(habit.id, payload);
          else addHabit(payload);
        },
        onDelete: habit ? () => removeHabit(habit.id) : undefined,
      });
    },
    [openSheet, addHabit, updateHabit, removeHabit]
  );

  const openMedSheet = useCallback(
    (med?: Med) => {
      openSheet({
        title: med ? 'Edit pill' : 'New pill',
        submitLabel: med ? 'Save' : 'Add',
        fields: [
          { key: 'name', label: 'Name', placeholder: 'Magnesium', initial: med?.name, required: true },
          { key: 'dose', label: 'Dose', placeholder: '400 mg · before bed', initial: med?.dose },
          { key: 'when', label: 'Time', placeholder: '22:30', initial: med?.when ?? '9:00', required: true },
        ],
        onSubmit: (v) => {
          const payload = { name: v.name, dose: v.dose, when: v.when };
          if (med) updateMed(med.id, payload);
          else addMed(payload);
        },
        onDelete: med ? () => removeMed(med.id) : undefined,
      });
    },
    [openSheet, addMed, updateMed, removeMed]
  );

  const openStepSheet = useCallback(() => {
    openSheet({
      title: 'Steps today',
      subtitle: 'What your phone or watch says.',
      submitLabel: 'Save',
      fields: [{ key: 'steps', label: 'Steps', placeholder: '8400', initial: steps ? String(steps) : '', required: true }],
      onSubmit: (v) => setSteps(todayKey, Number(v.steps.replace(/[^0-9]/g, '')) || 0),
    });
  }, [openSheet, setSteps, steps, todayKey]);

  const openSleepSheet = useCallback(() => {
    openSheet({
      title: 'Sleep last night',
      subtitle: 'Hours and minutes, as you slept them.',
      submitLabel: 'Save',
      fields: [
        { key: 'hours', label: 'Hours', placeholder: '7', initial: sleepMinutes ? String(Math.floor(sleepMinutes / 60)) : '', required: true },
        { key: 'minutes', label: 'Minutes', placeholder: '20', initial: sleepMinutes ? String(sleepMinutes % 60) : '' },
      ],
      onSubmit: (v) =>
        setSleep(todayKey, (Number(v.hours) || 0) * 60 + (Number(v.minutes) || 0)),
    });
  }, [openSheet, setSleep, sleepMinutes, todayKey]);

  return (
    <View style={{ flex: 1, paddingHorizontal: gutter }}>
      <PageHeader
        title="Health"
        accent="& habits"
        right={
          <>
            <StatChip
              left={`${habitDone}/${habits.length} habits today`}
              right={`${medsTaken}/${meds.length} pills taken`}
            />
            <RoundButton
              icon="plus"
              size={38}
              iconSize={15}
              accessibilityLabel="Add habit"
              onPress={() => openHabitSheet()}
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
            height: compact ? 380 : undefined,
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
              marginBottom: 14,
            }}
          >
            <View>
              <Txt size={17} weight="medium" tracking={-0.02}>
                Habits
              </Txt>
              <Txt size={13} color={t.muted2} style={{ marginTop: 3 }}>
                Tap today&apos;s dot to log it
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: dotGap, paddingRight: 8 }}>
              {DAY_LETTERS.map((d, i) => (
                <Txt
                  key={i}
                  size={12}
                  color={i === today ? t.ink : t.muted2}
                  style={{ width: dotSize, textAlign: 'center' }}
                >
                  {d}
                </Txt>
              ))}
            </View>
          </View>
          <ScrollView style={{ flex: 1, marginHorizontal: -8 }} showsVerticalScrollIndicator={false}>
            {habits.map((hb) => (
              <HabitRow
                key={hb.id}
                habit={hb}
                today={today}
                week={habitWeek(habitLog, hb.id, now)}
                weekStart={weekStart}
                dotSize={dotSize}
                dotGap={dotGap}
                onToggleDay={toggleHabitOn}
                onEdit={openHabitSheet}
              />
            ))}
          </ScrollView>
        </View>

        <View
          style={{
            width: compact ? '100%' : (sideColumn ?? 0) + 24,
            height: compact ? 360 : undefined,
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
              marginBottom: 14,
            }}
          >
            <View style={{ flex: 1 }}>
              <Txt size={17} weight="medium" tracking={-0.02}>
                Meds &amp; pills
              </Txt>
              <Txt size={13} color={t.muted2} style={{ marginTop: 3 }}>
                {medsTaken}/{meds.length} taken today
              </Txt>
            </View>
            <ProgressRing progress={medsPct} color={accent.cyan} label={`${Math.round(medsPct * 100)}%`} />
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 9 }} showsVerticalScrollIndicator={false}>
            {meds.map((m) => (
              <MedRow key={m.id} med={m} onToggle={toggleMed} onEdit={openMedSheet} />
            ))}
            <Touchable
              onPress={() => openMedSheet()}
              activeScale={0.98}
              style={{
                padding: 12,
                borderRadius: radius.cell,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: t.btnLineDash,
                alignItems: 'center',
              }}
            >
              <Txt size={13} color={t.muted2}>
                + Add pill
              </Txt>
            </Touchable>
          </ScrollView>
        </View>

        <View style={{ width: compact ? '100%' : 274, gap }}>
          <View
            style={{
              padding: cardPad,
              borderRadius: radius.card,
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt size={13} color={t.muted2}>
                Sleep last night
              </Txt>
              <RoundButton
                icon="plus"
                size={28}
                iconSize={13}
                strokeWidth={2.4}
                activeScale={0.88}
                accessibilityLabel="Log sleep"
                onPress={openSleepSheet}
              />
            </View>
            <Txt size={34} weight="semibold" tracking={-0.035} lineHeight={1.1} style={{ marginTop: 6 }}>
              {sleepMinutes ? `${Math.floor(sleepMinutes / 60)}h ${sleepMinutes % 60}m` : 'Not logged'}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'flex-end', height: 40, marginTop: 14 }}>
              {sleepWeek.map((v, i) => (
                <View key={i} style={{ flex: 1, height: `${Math.max(6, (v / sleepPeak) * 100)}%` }}>
                  <GrowBar
                    delay={200 + i * 50}
                    style={{
                      flex: 1,
                      borderRadius: 4,
                      backgroundColor: i === sleepWeek.length - 1 ? accent.violet : t.sleepIdle,
                    }}
                  />
                </View>
              ))}
            </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt size={13} color={t.muted2}>
                Water
              </Txt>
              <RoundButton
                icon="plus"
                size={28}
                iconSize={13}
                strokeWidth={2.4}
                activeScale={0.88}
                accessibilityLabel="Add a glass"
                onPress={() => addWater(todayKey)}
              />
            </View>
            <Txt size={26} weight="semibold" tracking={-0.03} style={{ marginTop: 6 }}>
              {water} / {waterGoal} glasses
            </Txt>
            <View style={{ flexDirection: 'row', gap: 5, marginTop: 12 }}>
              {Array.from({ length: waterGoal }, (_, i) => (
                <Glass key={i} filled={i < water} />
              ))}
            </View>
          </View>

          <View
            style={{
              flex: compact ? undefined : 1,
              padding: cardPad,
              borderRadius: radius.card,
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt size={13} color={t.muted2}>
                Steps
              </Txt>
              <RoundButton
                icon="plus"
                size={28}
                iconSize={13}
                strokeWidth={2.4}
                activeScale={0.88}
                accessibilityLabel="Log steps"
                onPress={openStepSheet}
              />
            </View>
            <Txt size={26} weight="semibold" tracking={-0.03} style={{ marginTop: 6 }}>
              {steps.toLocaleString()}
            </Txt>
            <Txt size={12} color={t.muted2} style={{ marginTop: 4 }}>
              {stepPct}% of {Math.round(stepGoal / 1000)}k goal
            </Txt>
            <View style={{ marginTop: 12 }}>
              <Meter pct={stepPct} color={accent.lime} />
            </View>
          </View>
        </View>
        </Panes>
      </RiseIn>
    </View>
  );
}

function DayDot({
  on,
  isToday,
  size,
  onPress,
}: {
  on: boolean;
  isToday: boolean;
  size: number;
  onPress(): void;
}) {
  const t = useTheme();
  const style = useAnimatedStyle(
    () => ({
      backgroundColor: withTiming(on ? accent.purple : 'transparent', { duration: DURATION.base }),
      borderColor: withTiming(on ? accent.purple : t.btnLineSoft, { duration: DURATION.base }),
      transform: [{ scale: withTiming(on ? 1.04 : 1, { duration: 400, easing: CURVE.pop }) }],
    }),
    [on, t.btnLineSoft]
  );
  return (
    <Touchable onPress={onPress} activeScale={1.12} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius.chip,
            borderWidth: 1,
          },
          isToday ? { borderStyle: 'solid' } : null,
          style,
        ]}
      />
    </Touchable>
  );
}

function RoundTick({ checked }: { checked: boolean }) {
  const t = useTheme();
  const style = useAnimatedStyle(
    () => ({
      backgroundColor: withTiming(checked ? accent.cyan : 'transparent', { duration: DURATION.base }),
      borderColor: withTiming(checked ? accent.cyan : t.btnLineSoft, { duration: DURATION.base }),
      transform: [{ scale: withTiming(checked ? 1.05 : 1, { duration: 400, easing: CURVE.pop }) }],
    }),
    [checked, t.btnLineSoft]
  );
  const tick = useAnimatedStyle(
    () => ({
      opacity: withTiming(checked ? 1 : 0, { duration: DURATION.quick }),
      transform: [{ scale: withTiming(checked ? 1 : 0.5, { duration: 400, easing: CURVE.pop }) }],
    }),
    [checked]
  );
  return (
    <Animated.View
      style={[
        { width: 22, height: 22, borderRadius: radius.glyph, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Animated.View style={tick}>
        <Icon name="check" size={12} color={onAccent.bright} strokeWidth={3.4} />
      </Animated.View>
    </Animated.View>
  );
}

function Glass({ filled }: { filled: boolean }) {
  const t = useTheme();
  const style = useAnimatedStyle(
    () => ({
      backgroundColor: withTiming(filled ? accent.cyan : t.glassEmpty, {
        duration: 400,
        easing: CURVE.settle,
      }),
    }),
    [filled, t.glassEmpty]
  );
  return <Animated.View style={[{ flex: 1, height: 26, borderRadius: 7 }, style]} />;
}

/**
 * One habit and its week of dots. Memoised so logging a single dot re-renders
 * that row alone rather than all six rows and their 42 animated cells.
 */
const HabitRow = React.memo(function HabitRow({
  habit,
  today,
  week,
  weekStart,
  dotSize,
  dotGap,
  onToggleDay,
  onEdit,
}: {
  habit: Habit;
  today: number;
  /** Monday-first flags for the week on screen. */
  week: boolean[];
  weekStart: Date;
  dotSize: number;
  dotGap: number;
  onToggleDay(id: string, dateKey: string): void;
  onEdit(habit: Habit): void;
}) {
  const t = useTheme();
  const edit = useCallback(() => onEdit(habit), [onEdit, habit]);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: radius.cell,
      }}
    >
      <Touchable
        onPress={edit}
        activeScale={0.92}
        accessibilityLabel={`Edit ${habit.name}`}
        style={{
          width: 34,
          height: 34,
          borderRadius: radius.glyph,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: habit.tint,
        }}
      >
        <Txt size={15}>{habit.glyph}</Txt>
      </Touchable>
      <Touchable onPress={edit} activeScale={0.995} haptic={false} style={{ flex: 1, minWidth: 0 }}>
        <Txt size={14} weight="semibold" tracking={-0.01} numberOfLines={1}>
          {habit.name}
        </Txt>
        <Txt size={12} color={t.muted2} style={{ marginTop: 2 }} numberOfLines={1}>
          {habit.meta}
        </Txt>
      </Touchable>
      <View style={{ flexDirection: 'row', gap: dotGap }}>
        {week.map((on, i) => (
          <DayDot
            key={i}
            on={on}
            isToday={i === today}
            size={dotSize}
            onPress={() => onToggleDay(habit.id, keyOf(addDays(weekStart, i)))}
          />
        ))}
      </View>
    </View>
  );
});

/** One pill row — memoised for the same reason as `HabitRow`. */
const MedRow = React.memo(function MedRow({
  med,
  onToggle,
  onEdit,
}: {
  med: Med;
  onToggle(id: string): void;
  onEdit(med: Med): void;
}) {
  const t = useTheme();
  return (
    <Touchable
      onPress={() => onToggle(med.id)}
      onLongPress={() => onEdit(med)}
      activeScale={0.99}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: radius.tile,
        backgroundColor: med.taken ? t.medTakenBg : t.medIdleBg,
        borderWidth: 1,
        borderColor: med.taken ? t.medTakenBorder : t.medIdleBorder,
      }}
    >
      <RoundTick checked={med.taken} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt
          size={14}
          weight="semibold"
          tracking={-0.01}
          color={med.taken ? t.inkDone : t.ink}
          style={[
            med.taken ? { textDecorationLine: 'line-through' } : null,
            med.taken && t.name === 'dark' ? { opacity: 0.55 } : null,
          ]}
          numberOfLines={1}
        >
          {med.name}
        </Txt>
        <Txt size={12} color={t.muted2} style={{ marginTop: 2 }} numberOfLines={1}>
          {med.dose}
        </Txt>
      </View>
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: radius.pill,
          backgroundColor: t.pill,
          borderWidth: 1,
          borderColor: t.pillLine,
        }}
      >
        <Txt size={12} weight="semibold" color={t.inkSoft}>
          {med.when}
        </Txt>
      </View>
    </Touchable>
  );
});
