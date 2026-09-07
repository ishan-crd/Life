import { addDays, isoDay, keyOf, startOfWeek } from '@/lib/date';
import type { DailyLog, FocusLog, Habit, HabitLog } from './types';

/**
 * Everything the dashboard reports is derived here from the dated logs, so no
 * screen invents a number of its own. All of it is pure: give it a log and a
 * "today" and it returns the same answer every time.
 */

/** The six rows of the focus heatmap, each covering a slice of the day. */
export const FOCUS_BANDS: { label: string; from: number; to: number }[] = [
  { label: '7 am', from: 6, to: 9 },
  { label: '10 am', from: 9, to: 12 },
  { label: '1 pm', from: 12, to: 15 },
  { label: '4 pm', from: 15, to: 18 },
  { label: '7 pm', from: 18, to: 21 },
  { label: '10 pm', from: 21, to: 24 },
];

/** Seconds of focus logged on one day. */
export function focusOn(log: FocusLog, key: string): number {
  const hours = log[key];
  return hours ? hours.reduce((n, s) => n + s, 0) : 0;
}

/** Seconds per day for the `days` days ending on `today`, oldest first. */
export function focusSeries(log: FocusLog, today: Date, days: number): number[] {
  return Array.from({ length: days }, (_, i) => focusOn(log, keyOf(addDays(today, i - days + 1))));
}

/** Daily totals for one calendar month, oldest first. */
export function focusMonth(log: FocusLog, year: number, month: number): number[] {
  const total = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: total }, (_, i) => focusOn(log, keyOf(new Date(year, month, i + 1))));
}

/**
 * Weekday × time-band intensity on a 1..5 ramp, over the last `weeks` weeks.
 * Empty slots stay at 1 so the grid keeps its shape on a brand new account.
 */
export function focusHeat(log: FocusLog, today: Date, weeks: number): number[][] {
  const totals = FOCUS_BANDS.map(() => new Array(7).fill(0));
  const monday = startOfWeek(today);

  for (let w = 0; w < weeks; w += 1) {
    for (let d = 0; d < 7; d += 1) {
      const hours = log[keyOf(addDays(monday, d - w * 7))];
      if (!hours) continue;
      FOCUS_BANDS.forEach((band, r) => {
        for (let h = band.from; h < band.to; h += 1) totals[r][d] += hours[h] ?? 0;
      });
    }
  }

  const peak = Math.max(...totals.flat());
  if (peak === 0) return totals.map((row) => row.map(() => 1));
  return totals.map((row) => row.map((v) => (v === 0 ? 1 : Math.min(5, 1 + Math.ceil((v / peak) * 4)))));
}

/** Consecutive days with focus logged, counting back from today or yesterday. */
export function focusStreak(log: FocusLog, today: Date): number {
  let streak = 0;
  // A day that is still in progress should not break yesterday's streak.
  let cursor = focusOn(log, keyOf(today)) > 0 ? today : addDays(today, -1);
  while (focusOn(log, keyOf(cursor)) > 0) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** This week's focus against the same span last week, as a signed percentage. */
export function focusTrend(log: FocusLog, today: Date): number {
  const elapsed = isoDay(today) + 1;
  const monday = startOfWeek(today);
  let thisWeek = 0;
  let lastWeek = 0;
  for (let d = 0; d < elapsed; d += 1) {
    thisWeek += focusOn(log, keyOf(addDays(monday, d)));
    lastWeek += focusOn(log, keyOf(addDays(monday, d - 7)));
  }
  if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
}

/** Monday-first flags for one habit in the week containing `today`. */
export function habitWeek(log: HabitLog, habitId: string, today: Date): boolean[] {
  const monday = startOfWeek(today);
  return Array.from({ length: 7 }, (_, i) => (log[keyOf(addDays(monday, i))] ?? []).includes(habitId));
}

/** How many of today's habits are logged. */
export function habitsLoggedOn(log: HabitLog, key: string): number {
  return (log[key] ?? []).length;
}

export interface MonthConsistency {
  /** Share of the month's habit slots that were kept, 0..1. */
  kept: number;
  /** Slots missed in the month. */
  missed: number;
  label: string;
}

/**
 * Kept-versus-missed per month for the last `months` months.
 *
 * The denominator uses today's habit list — the log does not record when a
 * habit was created, so a habit added this week reads as missed before it.
 */
export function consistencySeries(
  log: HabitLog,
  habits: Habit[],
  today: Date,
  months: number
): MonthConsistency[] {
  const out: MonthConsistency[] = [];
  for (let m = months - 1; m >= 0; m -= 1) {
    const first = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const days =
      m === 0 ? today.getDate() : new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    let kept = 0;
    for (let d = 1; d <= days; d += 1) {
      kept += (log[keyOf(new Date(first.getFullYear(), first.getMonth(), d))] ?? []).length;
    }
    const slots = days * Math.max(1, habits.length);
    out.push({
      kept: slots ? kept / slots : 0,
      missed: Math.max(0, slots - kept),
      label: first.toLocaleDateString([], { month: 'short' }),
    });
  }
  return out;
}

/** The last seven days of a one-number-a-day log, oldest first. */
export function weekSeries(log: DailyLog, today: Date): number[] {
  return Array.from({ length: 7 }, (_, i) => log[keyOf(addDays(today, i - 6))] ?? 0);
}
