import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { uid } from '@/lib/id';
import {
  seedColumns,
  seedHabits,
  seedMeds,
  seedMonthEvents,
  seedNotes,
  seedTasks,
  seedWeekSplit,
} from './seed';
import type {
  BoardCard,
  BoardColumn,
  CalEvent,
  ColumnKey,
  EventMap,
  Habit,
  Med,
  Note,
  Task,
  WeekSplitRow,
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
  focusBankedSeconds: number;

  tasks: Task[];
  columns: BoardColumn[];
  habits: Habit[];
  meds: Med[];
  notes: Note[];
  events: EventMap;
  weekSplit: WeekSplitRow[];

  water: number;
  waterGoal: number;
  steps: number;
  stepGoal: number;
  sleepMinutes: number;
  sleepWeek: number[];
  streak: number;

  selectedDate: string | null;

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
  toggleHabitDay(id: string, dayIndex: number): void;
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

  addWater(): void;

  applyOnboarding(input: {
    rituals: string[];
    waterGoal: number;
    stepGoal: number;
    focusHours: number;
  }): void;

  resetAll(): void;
}

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

const initial = {
  light: false,
  page: 0,
  range: 1,
  focusLeft: 25 * 60,
  focusTotal: 25 * 60,
  focusRunning: false,
  focusBankedSeconds: 0,
  tasks: seedTasks,
  columns: seedColumns,
  habits: seedHabits,
  meds: seedMeds,
  notes: seedNotes,
  events: {} as EventMap,
  weekSplit: seedWeekSplit,
  water: 5,
  waterGoal: 8,
  steps: 8420,
  stepGoal: 10000,
  sleepMinutes: 440,
  sleepWeek: [62, 78, 55, 88, 70, 96, 74],
  streak: 17,
  selectedDate: null,
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
      tickTimer: () =>
        set((s) => {
          if (!s.focusRunning || s.focusLeft <= 0) {
            return s.focusRunning && s.focusLeft <= 0 ? { focusRunning: false } : {};
          }
          return { focusLeft: s.focusLeft - 1, focusBankedSeconds: s.focusBankedSeconds + 1 };
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

      addHabit: (input) =>
        set((s) => ({ habits: [...s.habits, { ...input, id: uid('h'), days: [0, 0, 0, 0, 0, 0, 0] }] })),
      updateHabit: (id, patch) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      toggleHabitDay: (id, dayIndex) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id
              ? { ...h, days: h.days.map((d, i) => (i === dayIndex ? (d ? 0 : 1) : d)) }
              : h
          ),
        })),
      removeHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

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
        const fresh = seedMonthEvents(year, month, get().events);
        if (Object.keys(fresh).length === 0) return;
        set((s) => ({ events: { ...s.events, ...fresh } }));
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

      addWater: () => set((s) => ({ water: s.water >= s.waterGoal ? 0 : s.water + 1 })),

      /** Seeds the dashboard from the answers collected during onboarding. */
      applyOnboarding: ({ rituals, waterGoal, stepGoal, focusHours }) =>
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
          water: Math.min(s.water, waterGoal),
          stepGoal,
          focusTotal: Math.max(15, Math.min(90, Math.round((focusHours * 60) / 2))) * 60,
          focusLeft: Math.max(15, Math.min(90, Math.round((focusHours * 60) / 2))) * 60,
        })),

      /** Wipes the dashboard back to its seed — used when an account signs out. */
      resetAll: () => set({ ...initial, events: {} }),
    }),
    {
      name: 'life-dashboard-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // `hydrated` is runtime-only and `page` should always start at the overview.
      partialize: ({ hydrated: _hydrated, page: _page, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        useAppStore.setState({ hydrated: true });
        state?.setPage?.(0);
      },
    }
  )
);
