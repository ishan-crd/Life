import React, { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { Icon } from './Icon';
import { useSheet } from './Sheet';
import { Touchable } from './Touchable';
import { Meter, RoundButton, Txt } from './ui';
import { proteinTotal, useAppStore } from '@/state/store';
import type { ProteinEntry } from '@/state/types';
import { accent, radius, useTheme, type as typeScale } from '@/theme';

/** Kept out of the selector so an empty day never returns a fresh array. */
const NONE: ProteinEntry[] = [];

/** The same three-way tag the calendar uses for events, read for food. */
export const PROTEIN_TAGS = [
  { label: 'Meal', value: accent.lime, color: accent.lime },
  { label: 'Shake', value: accent.cyan, color: accent.cyan },
  { label: 'Snack', value: accent.violet, color: accent.violet },
];

/** "30", "30g" and "30 g" all mean the same thing to someone logging in a hurry. */
export function parseGrams(input: string): number {
  const n = Number(input.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.max(0, Math.min(999, Math.round(n))) : 0;
}

/**
 * Opens the log-protein editor for one day — `YYYY-MM-DD`, the same key the
 * calendar buckets events under. Pass an entry to edit or delete it.
 */
export function useProteinSheet(dateKey: string, subtitle?: string) {
  const { openSheet } = useSheet();
  const addProtein = useAppStore((s) => s.addProtein);
  const updateProtein = useAppStore((s) => s.updateProtein);
  const removeProtein = useAppStore((s) => s.removeProtein);

  return useCallback(
    (entry?: ProteinEntry) => {
      openSheet({
        title: entry ? 'Edit protein' : 'Log protein',
        subtitle,
        submitLabel: entry ? 'Save' : 'Log it',
        fields: [
          { key: 'label', label: 'What', placeholder: 'Protein bar', initial: entry?.label, required: true },
          {
            key: 'grams',
            label: 'Protein',
            placeholder: '10 g',
            initial: entry ? String(entry.grams) : '',
            required: true,
          },
          { key: 'color', label: 'Tag', kind: 'select', initial: entry?.color, options: PROTEIN_TAGS },
        ],
        onSubmit: (v) => {
          const payload = {
            label: v.label.trim(),
            grams: parseGrams(v.grams),
            color: v.color || accent.lime,
          };
          if (entry) updateProtein(dateKey, entry.id, payload);
          else addProtein(dateKey, payload);
        },
        onDelete: entry ? () => removeProtein(dateKey, entry.id) : undefined,
      });
    },
    [openSheet, subtitle, dateKey, addProtein, updateProtein, removeProtein]
  );
}

/** Editor for the daily target every day's total is measured against. */
export function useProteinGoalSheet() {
  const { openSheet } = useSheet();
  const goal = useAppStore((s) => s.proteinGoal);
  const setProteinGoal = useAppStore((s) => s.setProteinGoal);

  return useCallback(() => {
    openSheet({
      title: 'Daily protein goal',
      subtitle: 'Every day on the calendar is measured against this.',
      submitLabel: 'Save goal',
      fields: [{ key: 'goal', label: 'Grams a day', placeholder: '150 g', initial: String(goal), required: true }],
      onSubmit: (v) => setProteinGoal(parseGrams(v.goal)),
    });
  }, [openSheet, goal, setProteinGoal]);
}

/** One logged item — "Protein bar · 10 g". Tap to edit it. */
const ProteinChip = React.memo(function ProteinChip({
  entry,
  onPress,
}: {
  entry: ProteinEntry;
  onPress(entry: ProteinEntry): void;
}) {
  const t = useTheme();
  return (
    <Touchable
      onPress={() => onPress(entry)}
      activeScale={0.96}
      accessibilityLabel={`Edit ${entry.label}, ${entry.grams} grams`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: t.pill,
        borderWidth: 1,
        borderColor: t.pillLine,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: entry.color }} />
      <Txt size={typeScale.meta} color={t.inkSoft}>
        {entry.label}
      </Txt>
      <Txt size={typeScale.meta} weight="semibold">
        {entry.grams} g
      </Txt>
    </Touchable>
  );
});

/** Total + goal, tappable to retune the goal. */
function GoalReadout({ total, goal, onPress }: { total: number; goal: number; onPress(): void }) {
  const t = useTheme();
  return (
    <Touchable
      onPress={onPress}
      activeScale={0.96}
      haptic={false}
      accessibilityLabel={`${total} of ${goal} grams. Change the daily goal.`}
    >
      <Txt size={typeScale.control} weight="semibold" color={total >= goal ? t.protein : t.ink}>
        {total}
        <Txt size={typeScale.small} weight="regular" color={t.muted2}>
          {` / ${goal} g`}
        </Txt>
      </Txt>
    </Touchable>
  );
}

/**
 * The per-day protein log that sits under the calendar's day header: the day's
 * total against the goal, and every item logged on it.
 */
export function ProteinDayLog({ dateKey, subtitle }: { dateKey: string; subtitle: string }) {
  const t = useTheme();
  const entries = useAppStore((s) => s.protein[dateKey]) ?? NONE;
  const goal = useAppStore((s) => s.proteinGoal);
  const openProtein = useProteinSheet(dateKey, subtitle);
  const openGoal = useProteinGoalSheet();

  const total = proteinTotal(entries);
  const pct = Math.round((total / goal) * 100);

  return (
    <View style={{ paddingTop: 12, marginBottom: 12, borderTopWidth: 1, borderTopColor: t.lineSoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="bolt" size={15} color={t.inkSoft2} strokeWidth={1.8} />
        <Txt size={typeScale.small} color={t.muted2} style={{ flex: 1 }}>
          Protein
        </Txt>
        <GoalReadout total={total} goal={goal} onPress={openGoal} />
        <RoundButton
          icon="plus"
          size={28}
          iconSize={13}
          strokeWidth={2.4}
          activeScale={0.88}
          accessibilityLabel="Log protein"
          onPress={() => openProtein()}
        />
      </View>
      <View style={{ marginTop: 10 }}>
        <Meter pct={pct} color={t.protein} />
      </View>
      {entries.length ? (
        // Two rows of chips, then scroll. A horizontal strip would fight the
        // pager's swipe; vertical scrolling is what the pager already yields to.
        <ScrollView
          style={{ maxHeight: 84 }}
          contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {entries.map((e) => (
            <ProteinChip key={e.id} entry={e} onPress={openProtein} />
          ))}
        </ScrollView>
      ) : (
        <Txt size={typeScale.meta} color={t.muted2} style={{ paddingTop: 10 }}>
          Nothing logged — tap + for &ldquo;Protein bar · 10 g&rdquo;.
        </Txt>
      )}
    </View>
  );
}
