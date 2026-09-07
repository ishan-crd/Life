import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addDays, keyOf, startOfWeek } from '@/lib/date';
import { uid } from '@/lib/id';
import {
  seedColumns,
  seedDailyLog,
  seedFocusLog,
  seedHabitLog,
  seedHabits,
  seedMeds,
  seedMonthEvents,
  seedMonthProtein,
  seedNotes,
  seedTasks,
} from './seed';
import type {
  BoardCard,
  BoardColumn,
  CalEvent,
  ColumnKey,
  DailyLog,
  EventMap,
  FocusLog,
  Habit,
  HabitLog,
  Med,
  Note,
  ProteinEntry,
  ProteinMap,
  Task,
  WidgetKey,
} from './types';
import { accent } from '@/theme';

export const PAGE_COUNT = 5;
export const PAGE_TITLES = ['Overview', 'Board', 'Calendar', 'Habits', 'Notes'] as const;

export interface AppState {
  hydrated: boolean;
  light: boolean;
  page: number;
  range: number;

  focusLeft: number;
  focusTotal: number;
  focusRunning: boolean;

  tasks: Task[];
  columns: BoardColumn[];
  habits: Habit[];
  meds: Med[];
  notes: Note[];
  events: EventMap;
  protein: ProteinMap;

  /**
   * Everything the dashboard charts is a dated log, keyed `YYYY-MM-DD` the way
   * `events` is. `src/state/metrics.ts` turns them into the numbers screens
   * show, so no screen carries a figure of its own.
   */
  focusLog: FocusLog;
  habitLog: HabitLog;
  waterLog: DailyLog;
  stepLog: DailyLog;
  sleepLog: DailyLog;

  waterGoal: number;
  stepGoal: number;
  proteinGoal: number;

  selectedDate: string | null;

  /** The home page's widgets, in the order they are laid out. */
  widgets: WidgetKey[];

  toggleTheme(): void;
  setPage(page: number): void;
  setRange(range: number): void;

  toggleTimer(): void;
  resetTimer(): void;
  tickTimer(): void;
  setFocusTotal(minutes: number): void;

  addTask(input: Pick<Task, 'label' | 'meta'>): void;
  updateTask(id: string, patch: Partial<Omit<Task, 'id'>>): void;
  toggleTask(id: string): void;
  removeTask(id: string): void;

  addCard(column: ColumnKey, input: Omit<BoardCard, 'id'>): void;
  updateCard(id: string, patch: Partial<Omit<BoardCard, 'id'>>): void;
  removeCard(id: string): void;
  moveCard(id: string, from: ColumnKey, to: ColumnKey, index?: number): void;

  addHabit(input: Omit<Habit, 'id' | 'days'>): void;
  updateHabit(id: string, patch: Partial<Omit<Habit, 'id'>>): void;
  toggleHabitOn(id: string, dateKey: string): void;
  removeHabit(id: string): void;

  addMed(input: Omit<Med, 'id' | 'taken'>): void;
  updateMed(id: string, patch: Partial<Omit<Med, 'id'>>): void;
  toggleMed(id: string): void;
  removeMed(id: string): void;

  addNote(input?: Partial<Omit<Note, 'id'>>): string;
  updateNote(id: string, patch: Partial<Omit<Note, 'id'>>): void;
  removeNote(id: string): void;

  ensureMonth(year: number, month: number): void;
  addEvent(dateKey: string, input: Omit<CalEvent, 'id'>): void;
  updateEvent(dateKey: string, id: string, patch: Partial<Omit<CalEvent, 'id'>>): void;
  removeEvent(dateKey: string, id: string): void;
  selectDate(dateKey: string | null): void;

  addProtein(dateKey: string, input: Omit<ProteinEntry, 'id'>): void;
  updateProtein(dateKey: string, id: string, patch: Partial<Omit<ProteinEntry, 'id'>>): void;
  removeProtein(dateKey: string, id: string): void;
  setProteinGoal(grams: number): void;

  addWater(dateKey: string): void;
  setSteps(dateKey: string, steps: number): void;
  setSleep(dateKey: string, minutes: number): void;

  applyOnboarding(input: {
    rituals: string[];
    waterGoal: number;
    stepGoal: number;
    proteinGoal: number;
    focusHours: number;
  }): void;

  setWidgets(widgets: WidgetKey[]): void;
  addWidget(key: WidgetKey): void;
  removeWidget(key: WidgetKey): void;
  resetWidgets(): void;

  resetAll(): void;
}

/**
 * The home page as the design drew it: the plan and the deep-work chart on one
 * row, then consistency, the focus heatmap and today's agenda.
 */
export const DEFAULT_WIDGETS: WidgetKey[] = [
  'plan',
  'deepwork',
  'consistency',
  'heatmap',
  'agenda',
];

const NOTE_TAGS: Record<string, string> = {
  Idea: accent.violet,
  Work: accent.lime,
  Life: accent.cyan,
  Health: accent.lime,
  Mind: accent.cyan,
  Clipstake: accent.violet,
};

export function tagColor(tag: string): string {
  return NOTE_TAGS[tag] ?? accent.violet;
}

/** Grams logged on one day. Undefined (nothing logged) reads as zero. */
export function proteinTotal(entries: ProteinEntry[] | undefined): number {
  return entries ? entries.reduce((n, e) => n + e.grams, 0) : 0;
}

/** A brand new account opens on eight weeks of seeded history. */
function seedLogs(today = new Date()) {
  return {
    focusLog: seedFocusLog(today),
    habitLog: seedHabitLog(today, seedHabits),
    waterLog: seedDailyLog(today, 6, 5),
    stepLog: seedDailyLog(today, 8400, 5200),
    sleepLog: seedDailyLog(today, 432, 110),
  };
}

const initial = {
  light: false,
  page: 0,
  range: 1,
  focusLeft: 25 * 60,
  focusTotal: 25 * 60,
  focusRunning: false,
  tasks: seedTasks,
  columns: seedColumns,
  habits: seedHabits,
  meds: seedMeds,
  notes: seedNotes,
  events: {} as EventMap,
  protein: {} as ProteinMap,
  ...seedLogs(),
  waterGoal: 8,
  stepGoal: 10000,
  proteinGoal: 150,
  selectedDate: null,
  widgets: DEFAULT_WIDGETS,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initial,

      toggleTheme: () => set((s) => ({ light: !s.light })),
      setPage: (page) => set({ page: Math.max(0, Math.min(PAGE_COUNT - 1, page)) }),
      setRange: (range) => set({ range }),

      toggleTimer: () => set((s) => ({ focusRunning: !s.focusRunning })),
      resetTimer: () => set((s) => ({ focusLeft: s.focusTotal, focusRunning: false })),
      /** One second of a running block, banked into the hour it happened in. */
      tickTimer: () =>
        set((s) => {
          if (!s.focusRunning || s.focusLeft <= 0) {
            return s.focusRunning && s.focusLeft <= 0 ? { focusRunning: false } : {};
          }
          const now = new Date();
          const key = keyOf(now);
          const hours = s.focusLog[key] ? [...s.focusLog[key]] : new Array(24).fill(0);
          hours[now.getHours()] += 1;
          return { focusLeft: s.focusLeft - 1, focusLog: { ...s.focusLog, [key]: hours } };
        }),
      setFocusTotal: (minutes) =>
        set({ focusTotal: minutes * 60, focusLeft: minutes * 60, focusRunning: false }),

      addTask: ({ label, meta }) =>
        set((s) => ({ tasks: [...s.tasks, { id: uid('t'), label, meta, done: false }] })),
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      toggleTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addCard: (column, input) =>
        set((s) => ({
          columns: s.columns.map((c) =>
            c.key === column ? { ...c, cards: [...c.cards, { ...input, id: uid('c') }] } : c
          ),
        })),
      updateCard: (id, patch) =>
        set((s) => ({
          columns: s.columns.map((c) => ({
            ...c,
            cards: c.cards.map((card) => (card.id === id ? { ...card, ...patch } : card)),
          })),
        })),
      removeCard: (id) =>
        set((s) => ({
          columns: s.columns.map((c) => ({ ...c, cards: c.cards.filter((card) => card.id !== id) })),
        })),
      moveCard: (id, from, to, index) =>
        set((s) => {
          if (from === to) return {};
          const source = s.columns.find((c) => c.key === from);
          const card = source?.cards.find((x) => x.id === id);
          if (!card) return {};
          return {
            columns: s.columns.map((c) => {
              if (c.key === from) return { ...c, cards: c.cards.filter((x) => x.id !== id) };
              if (c.key === to) {
                const cards = [...c.cards];
                cards.splice(index ?? cards.length, 0, card);
                return { ...c, cards };
              }
              return c;
            }),
          };
        }),

      addHabit: (input) => set((s) => ({ habits: [...s.habits, { ...input, id: uid('h') }] })),
      updateHabit: (id, patch) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      toggleHabitOn: (id, key) =>
        set((s) => {
          const logged = s.habitLog[key] ?? [];
          const next = logged.includes(id) ? logged.filter((x) => x !== id) : [...logged, id];
          return { habitLog: { ...s.habitLog, [key]: next } };
        }),
      /** Dropping a habit drops its history with it, so nothing counts a ghost. */
      removeHabit: (id) =>
        set((s) => {
          const habitLog: HabitLog = {};
          for (const [key, ids] of Object.entries(s.habitLog)) {
            const kept = ids.filter((x) => x !== id);
            if (kept.length) habitLog[key] = kept;
          }
          return { habits: s.habits.filter((h) => h.id !== id), habitLog };
        }),

      addMed: (input) => set((s) => ({ meds: [...s.meds, { ...input, id: uid('m'), taken: false }] })),
      updateMed: (id, patch) =>
        set((s) => ({ meds: s.meds.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      toggleMed: (id) =>
        set((s) => ({ meds: s.meds.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m)) })),
      removeMed: (id) => set((s) => ({ meds: s.meds.filter((m) => m.id !== id) })),

      addNote: (input) => {
        const id = uid('n');
        set((s) => ({
          notes: [
            {
              id,
              tag: 'Idea',
              dot: accent.violet,
              when: 'just now',
              text: '',
              size: 15,
              weight: '500',
              updatedAt: Date.now(),
              ...input,
            },
            ...s.notes,
          ],
        }));
        return id;
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, when: 'just now', updatedAt: Date.now() } : n
          ),
        })),
      removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      ensureMonth: (year, month) => {
        const { events, protein } = get();
        const freshEvents = seedMonthEvents(year, month, events);
        const freshProtein = seedMonthProtein(year, month, protein);
        const hasEvents = Object.keys(freshEvents).length > 0;
        const hasProtein = Object.keys(freshProtein).length > 0;
        if (!hasEvents && !hasProtein) return;
        set((s) => ({
          events: hasEvents ? { ...s.events, ...freshEvents } : s.events,
          protein: hasProtein ? { ...s.protein, ...freshProtein } : s.protein,
        }));
      },
      addEvent: (key, input) =>
        set((s) => ({
          events: {
            ...s.events,
            [key]: [...(s.events[key] ?? []), { ...input, id: uid('e') }].sort((a, b) =>
              a.time.localeCompare(b.time)
            ),
          },
        })),
      updateEvent: (key, id, patch) =>
        set((s) => ({
          events: {
            ...s.events,
            [key]: (s.events[key] ?? [])
              .map((e) => (e.id === id ? { ...e, ...patch } : e))
              .sort((a, b) => a.time.localeCompare(b.time)),
          },
        })),
      removeEvent: (key, id) =>
        set((s) => ({ events: { ...s.events, [key]: (s.events[key] ?? []).filter((e) => e.id !== id) } })),
      selectDate: (selectedDate) => set({ selectedDate }),

      addProtein: (key, input) =>
        set((s) => ({
          protein: { ...s.protein, [key]: [...(s.protein[key] ?? []), { ...input, id: uid('p') }] },
        })),
      updateProtein: (key, id, patch) =>
        set((s) => ({
          protein: {
            ...s.protein,
            [key]: (s.protein[key] ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
          },
        })),
      removeProtein: (key, id) =>
        set((s) => ({
          protein: { ...s.protein, [key]: (s.protein[key] ?? []).filter((e) => e.id !== id) },
        })),
      /** A goal of zero would make every day 0% — keep at least one gram. */
      setProteinGoal: (grams) => set({ proteinGoal: Math.max(1, Math.round(grams)) }),

      addWater: (key) =>
        set((s) => {
          const glasses = s.waterLog[key] ?? 0;
          // Tapping past the goal starts the day over rather than counting on.
          return { waterLog: { ...s.waterLog, [key]: glasses >= s.waterGoal ? 0 : glasses + 1 } };
        }),
      setSteps: (key, steps) =>
        set((s) => ({ stepLog: { ...s.stepLog, [key]: Math.max(0, Math.round(steps)) } })),
      setSleep: (key, minutes) =>
        set((s) => ({ sleepLog: { ...s.sleepLog, [key]: Math.max(0, Math.round(minutes)) } })),

      /** Seeds the dashboard from the answers collected during onboarding. */
      applyOnboarding: ({ rituals, waterGoal, stepGoal, proteinGoal, focusHours }) =>
        set((s) => ({
          tasks: rituals.length
            ? rituals.map((label, i) => ({
                id: `onb_${i}`,
                label,
                meta: 'Every day',
                done: false,
              }))
            : s.tasks,
          waterGoal,
          stepGoal,
          proteinGoal,
          focusTotal: Math.max(15, Math.min(90, Math.round((focusHours * 60) / 2))) * 60,
          focusLeft: Math.max(15, Math.min(90, Math.round((focusHours * 60) / 2))) * 60,
        })),

      /** Wipes the dashboard back to its seed — used when an account signs out. */
      setWidgets: (widgets) => set({ widgets }),
      addWidget: (key) =>
        set((s) => (s.widgets.includes(key) ? {} : { widgets: [...s.widgets, key] })),
      removeWidget: (key) => set((s) => ({ widgets: s.widgets.filter((w) => w !== key) })),
      resetWidgets: () => set({ widgets: DEFAULT_WIDGETS }),

      /** Wipes the dashboard back to a fresh account, history included. */
      resetAll: () => set({ ...initial, ...seedLogs(), events: {}, protein: {} }),
    }),
    {
      name: 'life-dashboard-v1',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // `hydrated` is runtime-only and `page` should always start at the overview.
      partialize: ({ hydrated: _hydrated, page: _page, ...rest }) => rest,
      /**
       * v1 kept a week of dots on each habit and a single number for water,
       * steps and sleep. Both become dated logs, so the week of dots is
       * replayed onto the dates it stood for and the single numbers land on
       * the day the app was last open — today.
       */
      migrate: (persisted, version) => {
        if (version >= 2) return persisted;
        const s = persisted as Record<string, unknown>;
        const today = new Date();
        const key = keyOf(today);
        const monday = startOfWeek(today);
        const habits = (s.habits ?? []) as (Habit & { days?: number[] })[];
        const habitLog: HabitLog = {};
        for (const habit of habits) {
          habit.days?.forEach((on, i) => {
            if (!on) return;
            const dayKey = keyOf(addDays(monday, i));
            habitLog[dayKey] = [...(habitLog[dayKey] ?? []), habit.id];
          });
          delete habit.days;
        }
        return {
          ...s,
          habits,
          habitLog,
          focusLog: seedFocusLog(today),
          waterLog: { [key]: (s.water as number) ?? 0 },
          stepLog: { [key]: (s.steps as number) ?? 0 },
          sleepLog: { [key]: (s.sleepMinutes as number) ?? 0 },
        };
      },
      onRehydrateStorage: () => (state) => {
        useAppStore.setState({ hydrated: true });
        state?.setPage?.(0);
      },
    }
  )
);
