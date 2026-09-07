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
  /** Monday-first, 7 entries, 1 = logged. */
  days: number[];
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

export interface WeekSplitRow {
  id: string;
  label: string;
  value: string;
  pct: number;
  color: string;
}
