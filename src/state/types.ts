export interface Task {
  id: string;
  label: string;
  meta: string;
  done: boolean;
}

export interface BoardCard {
  id: string;
  title: string;
  tag: string;
  meta: string;
  dot: string;
}

export type ColumnKey = 'todo' | 'doing' | 'done';

export interface BoardColumn {
  key: ColumnKey;
  title: string;
  dot: string;
  cards: BoardCard[];
}

export interface Habit {
  id: string;
  name: string;
  meta: string;
  glyph: string;
  tint: string;
}

export interface Med {
  id: string;
  name: string;
  dose: string;
  when: string;
  taken: boolean;
}

export interface Note {
  id: string;
  tag: string;
  dot: string;
  when: string;
  text: string;
  size: number;
  weight: '400' | '500' | '600';
  updatedAt: number;
}

export interface CalEvent {
  id: string;
  title: string;
  /** 24h "HH:MM". */
  time: string;
  meta: string;
  color: string;
}

/** Events bucketed by `YYYY-MM-DD`. */
export type EventMap = Record<string, CalEvent[]>;

export interface ProteinEntry {
  id: string;
  /** What it was — "Protein bar", "Whey shake". */
  label: string;
  /** Grams of protein in it. */
  grams: number;
  /** Tag colour, from the same accent set the calendar uses. */
  color: string;
}

/** Protein logs bucketed by `YYYY-MM-DD`, keyed like `EventMap`. */
export type ProteinMap = Record<string, ProteinEntry[]>;

/**
 * Seconds of focus per hour of the day — 24 buckets a day. Hour resolution is
 * what the focus heatmap needs; the daily totals fall out of it by summing.
 */
export type FocusLog = Record<string, number[]>;

/** Ids of the habits logged on a day. */
export type HabitLog = Record<string, string[]>;

/** One number a day: glasses drunk, steps walked, minutes asleep. */
export type DailyLog = Record<string, number>;

/** The widgets the home page can show, in the order the picker lists them. */
export const WIDGET_KEYS = [
  'plan',
  'deepwork',
  'consistency',
  'heatmap',
  'agenda',
  'habits',
  'protein',
  'water',
  'steps',
  'sleep',
  'board',
  'notes',
  'streak',
] as const;

export type WidgetKey = (typeof WIDGET_KEYS)[number];

/** One row of "Where the week goes"; the page picks the colour by `id`. */
export interface WeekSplitRow {
  id: string;
  label: string;
  value: string;
  pct: number;
}
