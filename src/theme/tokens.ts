/**
 * Theme tokens transcribed 1:1 from `Life Dashboard Dark.dc.html`.
 * The design drives colour through CSS custom properties with dark values as
 * the inline fallback and a `LIGHT` override map; both sets live here.
 */

export const accent = {
  purple: '#6d3bf5',
  purpleSoft: '#7c4dff',
  purpleDeep: '#6d33f0',
  violet: '#8b5cf6',
  violetSoft: '#a78bfa',
  violetDeep: '#4b31a8',
  violetInk: '#3d2a76',
  violetInkSoft: '#2a2350',
  cyan: '#22d3ee',
  lime: '#d9f24a',
  limeChart: '#c8e832',
  rose: '#f43f5e',
} as const;

/**
 * Ink for a glyph sitting on a filled accent swatch. Purple carries white;
 * lime and cyan are bright enough to need the dark ink instead.
 */
export const onAccent = {
  deep: '#ffffff',
  bright: '#0a0a0c',
} as const;

/**
 * The three tints a habit glyph can wear. They live here rather than in the
 * seed and the habit editor separately, which is where they used to disagree.
 */
export const HABIT_TINTS = [
  { label: 'Violet', value: 'rgba(139,92,246,0.18)', color: accent.violet },
  { label: 'Lime', value: 'rgba(217,242,74,0.16)', color: accent.lime },
  { label: 'Cyan', value: 'rgba(34,211,238,0.16)', color: accent.cyan },
] as const;

/** The conic sweep behind the wordmark and the avatar. */
export const BRAND_STOPS = [
  { color: '#c4b5fd', to: 150 },
  { color: '#6d28d9', to: 250 },
  { color: '#3b1d8f', to: 360 },
] as const;

export type ThemeName = 'dark' | 'light';

export interface Theme {
  name: ThemeName;
  /** Page backdrop behind the 22px-radius dashboard shell. */
  backdrop: string;
  bg: string;
  card: string;
  line: string;
  lineSoft: string;
  chip: string;
  pill: string;
  pillLine: string;
  pillLineSoft: string;
  surface2: string;
  surface3: string;
  btnLine: string;
  btnLineSoft: string;
  btnLineDash: string;
  btnLineHi: string;
  ink: string;
  inkSoft: string;
  inkSoft2: string;
  inkDim: string;
  muted: string;
  muted2: string;
  muted3: string;
  muted4: string;
  dash: string;
  invBg: string;
  invInk: string;
  cyan: string;
  /** Focus-heatmap ramp, keyed by intensity 1..5. */
  heat: Record<1 | 2 | 3 | 4 | 5, string>;
  /**
   * The four "less → more" legend swatches under the heatmap. The design
   * hardcodes the dark ramp inline; the light values continue the light ramp so
   * the legend stays readable when the theme flips.
   */
  heatLegend: readonly [string, string, string, string];
  /** Low-emphasis bars (the "Workouts" group) — a muted tint of the accent. */
  barMuted: string;
  /**
   * Nutrition accent — protein meters, chips and the grams on a calendar day.
   * Lime is the design's "body & health" accent; the light value is darkened
   * because raw lime text is unreadable on a white card.
   */
  protein: string;
  /** The neutral "Missed" swatch in the consistency legend. */
  legendMuted: string;
  /** The card that follows the finger while a board card is being dragged. */
  dragGhost: string;
  /** Struck-through text on a pill that has been taken. */
  inkDone: string;
  /** The dimmed backdrop behind a sheet. */
  scrim: string;
  sleepIdle: string;
  glassEmpty: string;
  rangeActiveBg: string;
  rangeActiveInk: string;
  dotIdle: string;
  dotActive: string;
  dayBg: string;
  daySelBg: string;
  daySelInk: string;
  boardColBg: string;
  boardColActiveBg: string;
  medTakenBg: string;
  medTakenBorder: string;
  medIdleBg: string;
  medIdleBorder: string;
  shadow: string;
}

export const darkTheme: Theme = {
  name: 'dark',
  backdrop: '#050506',
  bg: '#0a0a0c',
  card: '#101014',
  line: '#1c1b21',
  lineSoft: '#1b1a20',
  chip: '#141317',
  pill: '#1b1a21',
  pillLine: '#26252c',
  pillLineSoft: '#24232a',
  surface2: '#17161b',
  surface3: '#232228',
  btnLine: '#37363f',
  btnLineSoft: '#3a3942',
  btnLineDash: '#2f2e36',
  btnLineHi: '#38363f',
  ink: '#ffffff',
  inkSoft: '#c9c8d0',
  inkSoft2: '#e7e7ea',
  inkDim: '#65646e',
  muted: '#a5a4ad',
  muted2: '#8a8992',
  muted3: '#6f6e78',
  muted4: '#5b5a63',
  dash: '#6b6a74',
  invBg: '#ffffff',
  invInk: '#0a0a0c',
  cyan: '#22d3ee',
  heat: { 1: '#241d47', 2: '#4b31a8', 3: '#8b6bf7', 4: '#e6dffb', 5: '#cbb9fb' },
  heatLegend: ['#2a2350', '#4b31a8', '#6d3bf5', '#a78bfa'],
  barMuted: '#3d2a76',
  protein: '#d9f24a',
  legendMuted: '#4b4a53',
  dragGhost: '#1c1b22',
  inkDone: '#ffffff',
  scrim: 'rgba(4,4,6,0.62)',
  sleepIdle: '#2f2952',
  glassEmpty: '#232228',
  rangeActiveBg: '#2a2930',
  rangeActiveInk: '#ffffff',
  dotIdle: '#33323a',
  dotActive: '#e7e7ea',
  dayBg: '#141317',
  daySelBg: '#e7e7ea',
  daySelInk: '#0a0a0c',
  boardColBg: '#101014',
  boardColActiveBg: '#15141a',
  medTakenBg: 'rgba(34,211,238,0.08)',
  medTakenBorder: 'rgba(34,211,238,0.45)',
  medIdleBg: '#17161b',
  medIdleBorder: '#24232a',
  shadow: 'rgba(0,0,0,0.85)',
};

export const lightTheme: Theme = {
  name: 'light',
  backdrop: '#e7e9ef',
  bg: '#f2f3f7',
  card: '#ffffff',
  line: '#e5e6ec',
  lineSoft: '#e5e6ec',
  chip: '#ffffff',
  pill: '#f3f4f8',
  pillLine: '#e0e1e8',
  pillLineSoft: '#e0e1e8',
  surface2: '#f1f2f6',
  surface3: '#e8e9ef',
  btnLine: '#d3d4dd',
  btnLineSoft: '#d3d4dd',
  btnLineDash: '#d3d4dd',
  btnLineHi: '#b8b9c4',
  ink: '#14151a',
  inkSoft: '#3d3f47',
  inkSoft2: '#1c1d23',
  inkDim: '#83848d',
  muted: '#5f6068',
  muted2: '#5f6068',
  muted3: '#5f6068',
  muted4: '#5f6068',
  dash: '#9a9ba4',
  invBg: '#14151a',
  invInk: '#ffffff',
  cyan: '#0e7490',
  heat: { 1: '#ece8fb', 2: '#c3b1fa', 3: '#8b6bf7', 4: '#4b31a8', 5: '#6d3bf5' },
  heatLegend: ['#ece8fb', '#c3b1fa', '#8b6bf7', '#4b31a8'],
  barMuted: '#c3b1fa',
  protein: '#5f6f0a',
  legendMuted: '#b8b9c4',
  dragGhost: '#ffffff',
  inkDone: '#4d4f57',
  scrim: 'rgba(4,4,6,0.45)',
  sleepIdle: '#e3e0f6',
  glassEmpty: '#e8e9ef',
  rangeActiveBg: '#e2e3ea',
  rangeActiveInk: '#14151a',
  dotIdle: '#cfd0d8',
  dotActive: '#2a2b33',
  dayBg: '#f7f8fb',
  daySelBg: '#14151a',
  daySelInk: '#ffffff',
  boardColBg: '#ffffff',
  boardColActiveBg: '#f8f6ff',
  medTakenBg: '#effcff',
  medTakenBorder: 'rgba(34,211,238,0.45)',
  medIdleBg: '#f1f2f6',
  medIdleBorder: '#e0e1e8',
  shadow: 'rgba(20,21,26,0.28)',
};

export const themes: Record<ThemeName, Theme> = { dark: darkTheme, light: lightTheme };
