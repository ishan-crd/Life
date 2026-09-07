import React, { createContext, useContext, useMemo } from 'react';
import { useAppStore } from '@/state/store';
import { darkTheme, themes, type Theme } from './tokens';

const ThemeContext = createContext<Theme>(darkTheme);

/**
 * Resolves the active theme once and hands it down by context.
 *
 * Every `<Txt>` and card in the app needs the palette, so reading it from the
 * store in each component would mean hundreds of store subscriptions all
 * re-evaluating on unrelated updates — the focus timer alone ticks once a
 * second. One subscription here, cheap context reads everywhere else.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const light = useAppStore((s) => s.light);
  const theme = useMemo(() => themes[light ? 'light' : 'dark'], [light]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
