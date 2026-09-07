import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useProteinSheet, useProteinGoalSheet } from '@/components/Protein';
import { useSheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { Meter, RoundButton, Txt } from '@/components/ui';
import { fmtDuration, keyOf } from '@/lib/date';
import { useNow } from '@/lib/useNow';
import { focusOn, focusStreak, focusTrend } from '@/state/metrics';
import { proteinTotal, useAppStore } from '@/state/store';
import { accent, radius, useLayout, useTheme } from '@/theme';

/**
 * The one-row widgets: a label, one number worth reading at a glance, and a
 * single action. They share this frame so the row of them reads as a set.
 */
function Tile({
  label,
  value,
  caption,
  action,
  actionLabel,
  onAction,
  onPress,
  children,
}: {
  label: string;
  value: string;
  caption?: string;
  action?: 'plus' | 'arrowRight';
  actionLabel?: string;
  onAction?(): void;
  onPress?(): void;
  children?: React.ReactNode;
}) {
  const t = useTheme();
  const { cardPad, compact } = useLayout();

  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt size={13} color={t.muted2} numberOfLines={1} style={{ flex: 1 }}>
          {label}
        </Txt>
        {action && onAction ? (
          <RoundButton
            icon={action}
            size={26}
            iconSize={12}
            strokeWidth={2.4}
            activeScale={0.88}
            accessibilityLabel={actionLabel ?? label}
            onPress={onAction}
          />
        ) : null}
      </View>
      <Txt size={compact ? 22 : 26} weight="semibold" tracking={-0.03} numberOfLines={1} style={{ marginTop: 4 }}>
        {value}
      </Txt>
      {caption ? (
        <Txt size={12} color={t.muted2} numberOfLines={1} style={{ marginTop: 2 }}>
          {caption}
        </Txt>
      ) : null}
      {children ? <View style={{ marginTop: 10 }}>{children}</View> : null}
    </>
  );

  const style = {
    flex: 1,
    padding: cardPad,
    borderRadius: radius.card,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.line,
    overflow: 'hidden' as const,
    justifyContent: 'center' as const,
  };

  if (onPress) {
    return (
      <Touchable onPress={onPress} activeScale={0.99} haptic={false} style={style}>
        {body}
      </Touchable>
    );
  }
  return <View style={style}>{body}</View>;
}

export function ProteinWidget() {
  const t = useTheme();
  const now = useNow(60_000);
  const key = keyOf(now);
  const entries = useAppStore((s) => s.protein[key]);
  const goal = useAppStore((s) => s.proteinGoal);
  const openProtein = useProteinSheet(key, 'Today');
  const openGoal = useProteinGoalSheet();

  const total = proteinTotal(entries);
  return (
    <Tile
      label="Protein today"
      value={`${total} / ${goal} g`}
      action="plus"
      actionLabel="Log protein"
      onAction={() => openProtein()}
      onPress={openGoal}
    >
      <Meter pct={Math.round((total / goal) * 100)} color={t.protein} />
    </Tile>
  );
}

export function WaterWidget() {
  const now = useNow(60_000);
  const key = keyOf(now);
  const glasses = useAppStore((s) => s.waterLog[key]) ?? 0;
  const goal = useAppStore((s) => s.waterGoal);
  const addWater = useAppStore((s) => s.addWater);

  return (
    <Tile
      label="Water"
      value={`${glasses} / ${goal} glasses`}
      action="plus"
      actionLabel="Add a glass"
      onAction={() => addWater(key)}
    >
      <Meter pct={Math.round((glasses / goal) * 100)} color={accent.cyan} />
    </Tile>
  );
}

export function StepsWidget() {
  const now = useNow(60_000);
  const { openSheet } = useSheet();
  const key = keyOf(now);
  const steps = useAppStore((s) => s.stepLog[key]) ?? 0;
  const goal = useAppStore((s) => s.stepGoal);
  const setSteps = useAppStore((s) => s.setSteps);

  const open = useCallback(() => {
    openSheet({
      title: 'Steps today',
      subtitle: 'What your phone or watch says.',
      submitLabel: 'Save',
      fields: [{ key: 'steps', label: 'Steps', placeholder: '8400', initial: steps ? String(steps) : '', required: true }],
      onSubmit: (v) => setSteps(key, Number(v.steps.replace(/[^0-9]/g, '')) || 0),
    });
  }, [openSheet, setSteps, steps, key]);

  const pct = Math.min(100, Math.round((steps / goal) * 100));
  return (
    <Tile
      label="Steps"
      value={steps.toLocaleString()}
      caption={`${pct}% of ${Math.round(goal / 1000)}k goal`}
      action="plus"
      actionLabel="Log steps"
      onAction={open}
    >
      <Meter pct={pct} color={accent.lime} />
    </Tile>
  );
}

export function SleepWidget() {
  const now = useNow(60_000);
  const { openSheet } = useSheet();
  const key = keyOf(now);
  const minutes = useAppStore((s) => s.sleepLog[key]) ?? 0;
  const setSleep = useAppStore((s) => s.setSleep);

  const open = useCallback(() => {
    openSheet({
      title: 'Sleep last night',
      subtitle: 'Hours and minutes, as you slept them.',
      submitLabel: 'Save',
      fields: [
        { key: 'hours', label: 'Hours', placeholder: '7', initial: minutes ? String(Math.floor(minutes / 60)) : '', required: true },
        { key: 'minutes', label: 'Minutes', placeholder: '20', initial: minutes ? String(minutes % 60) : '' },
      ],
      onSubmit: (v) => setSleep(key, (Number(v.hours) || 0) * 60 + (Number(v.minutes) || 0)),
    });
  }, [openSheet, setSleep, minutes, key]);

  return (
    <Tile
      label="Sleep last night"
      value={minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : 'Not logged'}
      action="plus"
      actionLabel="Log sleep"
      onAction={open}
    />
  );
}

export function BoardWidget() {
  const columns = useAppStore((s) => s.columns);
  const setPage = useAppStore((s) => s.setPage);
  const doing = columns.find((c) => c.key === 'doing')?.cards.length ?? 0;
  const total = columns.reduce((n, c) => n + c.cards.length, 0);
  const done = columns.find((c) => c.key === 'done')?.cards.length ?? 0;

  return (
    <Tile
      label="Board"
      value={`${done} / ${total} done`}
      caption={`${doing} in progress`}
      action="arrowRight"
      actionLabel="Open the board"
      onAction={() => setPage(1)}
    />
  );
}

export function NotesWidget() {
  const t = useTheme();
  const notes = useAppStore((s) => s.notes);
  const setPage = useAppStore((s) => s.setPage);
  const latest = useMemo(() => [...notes].sort((a, b) => b.updatedAt - a.updatedAt)[0], [notes]);

  return (
    <Tile
      label={latest ? `Latest note · ${latest.tag}` : 'Notes'}
      value={`${notes.length} notes`}
      action="arrowRight"
      actionLabel="Open notes"
      onAction={() => setPage(4)}
    >
      <Txt size={13} color={t.inkSoft} numberOfLines={2} lineHeight={1.3}>
        {latest?.text || 'Nothing written down yet.'}
      </Txt>
    </Tile>
  );
}

export function StreakWidget() {
  const t = useTheme();
  const now = useNow(60_000);
  const focusLog = useAppStore((s) => s.focusLog);
  const streak = useMemo(() => focusStreak(focusLog, now), [focusLog, now]);
  const trend = useMemo(() => focusTrend(focusLog, now), [focusLog, now]);
  const today = focusOn(focusLog, keyOf(now));

  return (
    <Tile
      label="Focus streak"
      value={`${streak} ${streak === 1 ? 'day' : 'days'}`}
      caption={`${fmtDuration(today)} today`}
    >
      <Txt size={12} weight="semibold" color={trend >= 0 ? t.cyan : t.muted2}>
        {trend >= 0 ? '+' : ''}
        {trend}% on last week
      </Txt>
    </Tile>
  );
}
