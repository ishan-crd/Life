import React, { createContext, useContext, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/**
 * The design was drawn for a landscape iPad. These breakpoints keep that
 * canvas exact on a tablet and rebuild it for everything smaller, so the same
 * five pages work on a phone in either orientation.
 */
export type Breakpoint = 'compact' | 'medium' | 'wide';

export interface Layout {
  width: number;
  height: number;
  bp: Breakpoint;
  /** Phone-sized, in either orientation. */
  compact: boolean;
  /**
   * Too narrow for a page's side pane: every phone, and a tablet held
   * upright. Pages stack here; `compact` is for what only a phone needs.
   */
  narrow: boolean;
  landscape: boolean;
  /**
   * Columns in the home-page widget grid. It stops at three because that is
   * what the design puts across the bottom of the home page.
   */
  columns: number;
  /** Columns on the notes wall. */
  noteColumns: number;
  /** Horizontal padding on every page. */
  gutter: number;
  /** Gap between cards. */
  gap: number;
  /** Inner padding of a card. */
  cardPad: number;
  /** Multiplier every `<Txt size>` passes through. */
  fontScale: number;
  headerHeight: number;
  /** Margin and corner radius of the dashboard shell — 0 on phones, full bleed. */
  shellInset: number;
  shellRadius: number;
  /** Height of one widget row, and the least it may shrink to before the page scrolls. */
  rowHeight: number;
  minRowHeight: number;
  /** Width of a page's detail column, or null when it should stack instead. */
  sideColumn: number | null;
}

/** A phone is anything whose short edge, or width, cannot hold two columns. */
const PHONE_SHORT_EDGE = 500;
const PHONE_WIDTH = 640;

export function resolveLayout(width: number, height: number): Layout {
  const compact = Math.min(width, height) < PHONE_SHORT_EDGE || width < PHONE_WIDTH;
  const bp: Breakpoint = compact ? 'compact' : width < 1000 ? 'medium' : 'wide';
  const wide = bp === 'wide';
  const landscape = width > height;

  return {
    width,
    height,
    bp,
    compact,
    narrow: compact || (bp === 'medium' && !landscape),
    landscape,
    columns: compact ? 1 : width < 900 ? 2 : 3,
    noteColumns: compact ? 1 : bp === 'medium' ? 2 : width < 1300 ? 3 : 4,
    gutter: compact ? 16 : wide ? 26 : 22,
    gap: compact ? 12 : wide ? 18 : 16,
    cardPad: compact ? 14 : wide ? 18 : 16,
    fontScale: compact ? 0.78 : wide ? 1 : 0.9,
    headerHeight: compact ? 64 : wide ? 108 : 88,
    shellInset: compact ? 0 : 12,
    shellRadius: compact ? 0 : 22,
    rowHeight: compact ? 96 : wide ? 118 : 108,
    minRowHeight: compact ? 96 : 78,
    sideColumn: compact ? null : wide ? 348 : 292,
  };
}

/**
 * Type does not scale linearly: a 44px page title has room to shrink on a
 * phone, a 12px axis label does not. Display sizes take the full multiplier,
 * body and meta sizes take a fraction of it so they stay legible.
 */
export function scaleType(size: number, fontScale: number): number {
  if (fontScale === 1) return size;
  const factor = size >= 20 ? fontScale : 1 - (1 - fontScale) * 0.45;
  return Math.round(size * factor * 10) / 10;
}

const LayoutContext = createContext<Layout>(resolveLayout(1024, 768));

/**
 * Resolves the window once and hands the result down by context, for the same
 * reason `ThemeProvider` does: every card and label needs it, and subscribing
 * each one to `useWindowDimensions` would re-render the whole tree on a resize
 * rather than the one provider.
 */
export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const value = useMemo(() => resolveLayout(width, height), [width, height]);
  return React.createElement(LayoutContext.Provider, { value }, children);
}

export function useLayout(): Layout {
  return useContext(LayoutContext);
}
