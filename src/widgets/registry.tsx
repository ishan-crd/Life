import React from 'react';
import type { IconName } from '@/components/Icon';
import type { WidgetSize } from '@/components/WidgetGrid';
import { WIDGET_KEYS, type WidgetKey } from '@/state/types';
import {
  AgendaWidget,
  ConsistencyWidget,
  DeepWorkWidget,
  HabitsWidget,
  HeatmapWidget,
  PlanWidget,
} from './Panels';
import {
  BoardWidget,
  NotesWidget,
  ProteinWidget,
  SleepWidget,
  StepsWidget,
  StreakWidget,
  WaterWidget,
} from './Tiles';

export interface WidgetMeta extends WidgetSize {
  key: WidgetKey;
  /** Name in the widget picker. */
  title: string;
  /** One line explaining what it shows, also in the picker. */
  blurb: string;
  icon: IconName;
  Component: React.ComponentType;
}

/**
 * Every widget the home page can show, with the size it wants. `span` is in
 * grid columns and is clamped to however many the window has; `rows` is its
 * height in grid rows.
 */
export const WIDGETS: Record<WidgetKey, WidgetMeta> = {
  plan: {
    key: 'plan',
    title: "Today's plan",
    blurb: 'Rituals kept, focus banked and the timer',
    icon: 'check',
    span: 1,
    rows: 2,
    Component: PlanWidget,
  },
  deepwork: {
    key: 'deepwork',
    title: 'Deep work',
    blurb: 'Focus over the range, against the period before',
    icon: 'clock',
    span: 2,
    rows: 2,
    Component: DeepWorkWidget,
  },
  consistency: {
    key: 'consistency',
    title: 'Consistency',
    blurb: 'Habits kept versus missed, month by month',
    icon: 'smile',
    span: 1,
    rows: 3,
    Component: ConsistencyWidget,
  },
  heatmap: {
    key: 'heatmap',
    title: 'Focus by time',
    blurb: 'When in the day and week focus lands',
    icon: 'globe',
    span: 1,
    rows: 3,
    Component: HeatmapWidget,
  },
  agenda: {
    key: 'agenda',
    title: 'Up next today',
    blurb: "What is left on today's calendar",
    icon: 'clock',
    span: 1,
    rows: 3,
    Component: AgendaWidget,
  },
  habits: {
    key: 'habits',
    title: 'Habits',
    blurb: "Tick today's habits without leaving home",
    icon: 'check',
    span: 1,
    rows: 2,
    Component: HabitsWidget,
  },
  protein: {
    key: 'protein',
    title: 'Protein',
    blurb: "Today's grams against your goal",
    icon: 'bolt',
    span: 1,
    rows: 1,
    Component: ProteinWidget,
  },
  water: {
    key: 'water',
    title: 'Water',
    blurb: 'Glasses drunk today',
    icon: 'bolt',
    span: 1,
    rows: 1,
    Component: WaterWidget,
  },
  steps: {
    key: 'steps',
    title: 'Steps',
    blurb: 'Steps against your daily goal',
    icon: 'bolt',
    span: 1,
    rows: 1,
    Component: StepsWidget,
  },
  sleep: {
    key: 'sleep',
    title: 'Sleep',
    blurb: 'How last night went',
    icon: 'moon',
    span: 1,
    rows: 1,
    Component: SleepWidget,
  },
  board: {
    key: 'board',
    title: 'Board',
    blurb: 'Cards done and in progress',
    icon: 'expand',
    span: 1,
    rows: 1,
    Component: BoardWidget,
  },
  notes: {
    key: 'notes',
    title: 'Latest note',
    blurb: 'The last thing you wrote down',
    icon: 'expand',
    span: 1,
    rows: 1,
    Component: NotesWidget,
  },
  streak: {
    key: 'streak',
    title: 'Focus streak',
    blurb: 'Days in a row, and the week-on-week trend',
    icon: 'smile',
    span: 1,
    rows: 1,
    Component: StreakWidget,
  },
};

export function widgetSize(key: WidgetKey): WidgetSize {
  const meta = WIDGETS[key];
  return { span: meta.span, rows: meta.rows };
}

/** Widgets not already on the page, in the order the picker lists them. */
export function availableWidgets(current: WidgetKey[]): WidgetMeta[] {
  return WIDGET_KEYS.filter((k) => !current.includes(k)).map((k) => WIDGETS[k]);
}
