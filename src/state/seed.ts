import { accent } from '@/theme/tokens';
import { dateKey, daysInMonth } from '@/lib/date';
import type { BoardColumn, CalEvent, EventMap, Habit, Med, Note, Task, WeekSplitRow } from './types';

export const seedTasks: Task[] = [
  { id: 't1', label: 'Check Clipstake Discord', meta: 'Community · morning', done: true },
  { id: 't2', label: 'Ship one small thing', meta: 'Deep work block', done: false },
  { id: 't3', label: 'Workout', meta: '6:30 PM · Cult', done: false },
  { id: 't4', label: 'Inbox to zero', meta: '10 min', done: true },
  { id: 't5', label: 'Read 20 pages', meta: 'Before bed', done: false },
  { id: 't6', label: 'Plan tomorrow', meta: '5 min · evening', done: false },
];

export const seedColumns: BoardColumn[] = [
  {
    key: 'todo',
    title: 'To do',
    dot: accent.violetSoft,
    cards: [
      { id: 'c1', title: 'Storyboard the swipe transition', tag: 'Design', meta: 'Today', dot: accent.violet },
      { id: 'c2', title: 'Clipstake weekly recap post', tag: 'Content', meta: 'Fri', dot: accent.lime },
      { id: 'c3', title: 'Book physio appointment', tag: 'Life', meta: 'This week', dot: accent.cyan },
    ],
  },
  {
    key: 'doing',
    title: 'Ongoing',
    dot: accent.purple,
    cards: [
      { id: 'c4', title: 'Kanban drag physics', tag: 'Build', meta: '2 h left', dot: accent.cyan },
      { id: 'c5', title: 'Widget motion spec', tag: 'Design', meta: 'In review', dot: accent.violet },
    ],
  },
  {
    key: 'done',
    title: 'Done',
    dot: accent.lime,
    cards: [
      { id: 'c6', title: 'Glass card tokens', tag: 'Design', meta: 'Mon', dot: accent.violet },
      { id: 'c7', title: 'Focus dial tick ring', tag: 'Build', meta: 'Tue', dot: accent.cyan },
    ],
  },
];

export const seedHabits: Habit[] = [
  { id: 'h1', name: 'Discord check-in', meta: 'Clipstake · every morning', glyph: '💬', tint: 'rgba(139,92,246,0.18)', days: [1, 1, 1, 1, 1, 0, 0] },
  { id: 'h2', name: 'Workout', meta: '4× a week · Cult', glyph: '🏋', tint: 'rgba(217,242,74,0.16)', days: [1, 0, 1, 1, 0, 0, 0] },
  { id: 'h3', name: 'Read 20 pages', meta: 'Before bed', glyph: '📖', tint: 'rgba(34,211,238,0.16)', days: [1, 1, 0, 1, 1, 0, 0] },
  { id: 'h4', name: 'No screens after 11', meta: 'Sleep hygiene', glyph: '🌙', tint: 'rgba(139,92,246,0.14)', days: [0, 1, 1, 0, 1, 0, 0] },
  { id: 'h5', name: 'Journal', meta: '5 min · evening', glyph: '✍', tint: 'rgba(217,242,74,0.14)', days: [1, 1, 1, 0, 0, 0, 0] },
  { id: 'h6', name: 'Stretch', meta: '10 min · post-work', glyph: '🧘', tint: 'rgba(34,211,238,0.14)', days: [0, 0, 1, 1, 1, 0, 0] },
];

export const seedMeds: Med[] = [
  { id: 'm1', name: 'Vitamin D3', dose: '2000 IU · with breakfast', when: '9:00', taken: true },
  { id: 'm2', name: 'Omega 3', dose: '1000 mg · with food', when: '9:00', taken: true },
  { id: 'm3', name: 'Magnesium', dose: '400 mg · before bed', when: '22:30', taken: false },
  { id: 'm4', name: 'Multivitamin', dose: '1 tablet', when: '13:00', taken: false },
  { id: 'm5', name: 'Creatine', dose: '5 g · post workout', when: '19:30', taken: false },
];

export const seedNotes: Note[] = [
  { id: 'n1', tag: 'Idea', dot: accent.violet, when: '2m ago', text: 'Leave a little room for the unexpected.', size: 25, weight: '400', updatedAt: 0 },
  { id: 'n2', tag: 'Work', dot: accent.lime, when: '1h ago', text: 'Swipe transition: page snaps at 90px, rubber-bands at the ends. Board first, then calendar.', size: 15, weight: '500', updatedAt: 0 },
  { id: 'n3', tag: 'Life', dot: accent.cyan, when: 'Yesterday', text: 'Call physio · Thursday morning slot', size: 15, weight: '500', updatedAt: 0 },
  { id: 'n4', tag: 'Clipstake', dot: accent.violet, when: 'Yesterday', text: 'Recap post outline — 3 wins, 1 lesson, next week focus.', size: 15, weight: '500', updatedAt: 0 },
  { id: 'n5', tag: 'Health', dot: accent.lime, when: 'Mon', text: 'Magnesium works better 30 min earlier.', size: 15, weight: '500', updatedAt: 0 },
  { id: 'n6', tag: 'Idea', dot: accent.violet, when: 'Mon', text: 'Widget marketplace: let people publish their own dashboard tiles.', size: 15, weight: '500', updatedAt: 0 },
  { id: 'n7', tag: 'Mind', dot: accent.cyan, when: 'Sun', text: 'Slow is smooth, smooth is fast.', size: 19, weight: '500', updatedAt: 0 },
];

export const seedWeekSplit: WeekSplitRow[] = [
  { id: 'w1', label: 'Deep work', value: '14 h', pct: 72, color: accent.purple },
  { id: 'w2', label: 'Body & health', value: '5 h', pct: 38, color: accent.lime },
  { id: 'w3', label: 'Life admin', value: '3 h', pct: 22, color: accent.cyan },
];

/**
 * The design keys its sample agenda off `day % 3`; we materialise the same
 * three rotations into real dated events so they can be edited and persisted.
 */
const EVENT_ROTATIONS: Omit<CalEvent, 'id'>[][] = [
  [
    { title: 'Clipstake standup', time: '10:00', meta: '30 min · Discord', color: accent.violet },
    { title: 'Deep work — motion spec', time: '11:30', meta: '2 hours · no notifications', color: accent.lime },
    { title: 'Design review · Hamna', time: '14:30', meta: '1 hour · FaceTime', color: accent.cyan },
    { title: 'Strength session', time: '18:30', meta: '1 hour · Cult', color: accent.lime },
    { title: 'Read 20 pages', time: '22:00', meta: 'Before bed', color: accent.violet },
  ],
  [
    { title: 'Sprint planning', time: '11:00', meta: '45 min · Discord', color: accent.violet },
    { title: 'Deep work — swipe physics', time: '13:00', meta: '2 hours · no notifications', color: accent.lime },
    { title: 'Physio', time: '17:00', meta: '40 min · Indiranagar', color: accent.cyan },
    { title: 'Journal', time: '22:15', meta: '5 min · evening', color: accent.violet },
  ],
  [
    { title: 'Deep work — kanban physics', time: '09:30', meta: '3 hours', color: accent.lime },
    { title: 'Recap post draft', time: '14:00', meta: '45 min · Clipstake', color: accent.violet },
    { title: 'Strength session', time: '18:30', meta: '1 hour · Cult', color: accent.lime },
    { title: 'Dinner with Hamna', time: '20:00', meta: '2 hours · Omakase', color: accent.violet },
  ],
];

export function seedMonthEvents(year: number, month: number, existing: EventMap): EventMap {
  const next: EventMap = {};
  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day += 1) {
    const key = dateKey(year, month, day);
    if (existing[key]) continue;
    next[key] = EVENT_ROTATIONS[day % 3].map((e, i) => ({ ...e, id: `${key}_${i}` }));
  }
  return next;
}
