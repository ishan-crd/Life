import { useMemo } from 'react';
import { useAppStore } from '@/state/store';
import { themes, type Theme } from './tokens';

export function useTheme(): Theme {
  const light = useAppStore((s) => s.light);
  return useMemo(() => themes[light ? 'light' : 'dark'], [light]);
}
