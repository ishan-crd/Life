/**
 * Metric scales for the dashboard, read off `Life Dashboard Dark.dc.html`.
 *
 * The design is not built on an 8pt grid — it uses a specific, slightly odd set
 * of values (26px gutters, 22px card radius, 9px chip radius). Those exact
 * numbers are named here so screens reference intent instead of magic numbers,
 * and so the whole system can be retuned from one place.
 */

/** Corner radii, from the largest surface down to the smallest chip. */
export const radius = {
  /** The dashboard shell and every top-level card. */
  shell: 22,
  card: 22,
  /** Sheets and onboarding surfaces sit slightly softer than cards. */
  sheet: 26,
  /** Board cards, calendar events, list rows. */
  tile: 16,
  /** Day cells, list-row hover targets, dashed add buttons. */
  cell: 14,
  /** Glyph tiles and habit dots. */
  glyph: 11,
  /** Heatmap cells and chart badges. */
  chip: 9,
  /** Checkbox squares. */
  check: 7,
  /** Legend swatches and water glasses. */
  swatch: 4,
  /** Fully rounded pills and buttons. */
  pill: 999,
} as const;

/** Spacing steps. `gutter` is the page edge; `gap` is the standard card gap. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  /** Horizontal padding on every page. */
  gutter: 26,
  /** Gap between cards in a row or grid. */
  gap: 18,
  /** Inner padding of a dashboard card. */
  cardPad: 18,
  /** Inner padding of the wider overview cards. */
  cardPadWide: 20,
  /** Inner padding of the sheet and the auth panel. */
  sheetPad: 24,
} as const;

/** Font sizes. Names describe the role, not the number. */
export const type = {
  /** 44px page titles ("Everything in flight"). */
  pageTitle: 44,
  /** 46px counters ("4/6") and the 40px onboarding headings. */
  display: 46,
  heading: 40,
  /** 34px / 30px stat readouts. */
  stat: 34,
  statSm: 26,
  /** The 24px brand wordmark. */
  brand: 24,
  /** 18px / 17px card titles. */
  cardTitle: 18,
  sectionTitle: 17,
  /** 16px lead text. */
  lead: 16,
  /** 15px controls. */
  control: 15,
  /** 14px body — the app's default. */
  body: 14,
  /** 13px secondary text and small pills. */
  small: 13,
  /** 12px meta, axis labels and tags. */
  meta: 12,
  /** 11px ring labels and the page hint. */
  micro: 11,
} as const;

/** Letter-spacing, expressed as an em multiplier of the font size. */
export const tracking = {
  display: -0.035,
  title: -0.03,
  heading: -0.02,
  body: -0.01,
} as const;

/** Fixed component heights the design repeats. */
export const size = {
  /** The top bar. */
  header: 108,
  /** Header utility buttons and the avatar. */
  headerButton: 46,
  /** Page-header action row (stat chip, primary button). */
  action: 48,
  /** Card-corner icon buttons. */
  cardButton: 34,
  /** Calendar/habits header buttons. */
  smallButton: 38,
  /** Auth and onboarding primary buttons. */
  formButton: 54,
  /** Text inputs in the sheet and auth form. */
  input: 50,
  /** Progress dials. */
  dial: 44,
} as const;

/** Stacking order for the few overlapping layers. */
export const layer = {
  page: 0,
  overlay: 10,
  dragGhost: 70,
} as const;

/** Shadow presets, kept in one place so elevation reads consistently. */
export const elevation = {
  dragGhost: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 24 },
    elevation: 20,
  },
  sheet: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 24 },
    elevation: 24,
  },
} as const;
