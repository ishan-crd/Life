import React from 'react';
import { ScrollView, View } from 'react-native';
import { useLayout } from '@/theme';

/**
 * A page's panes side by side, or stacked into one scroll once the window is
 * too narrow to hold them. Every multi-pane page routes through this so the
 * stacking rule lives in one place.
 */
export function Panes({
  children,
  stack,
  onScroll,
}: {
  children: React.ReactNode;
  /** Stack even off a phone — a page whose side pane needs more than a portrait tablet has. */
  stack?: boolean;
  /** Called while the stacked layout scrolls, for pages that measure hit-boxes. */
  onScroll?: () => void;
}) {
  const { compact, gap } = useLayout();

  if (!(stack ?? compact)) {
    return <View style={{ flex: 1, flexDirection: 'row', gap, paddingBottom: 30 }}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1 }}
      // Enough at the end for the last card to clear the page dots.
      contentContainerStyle={{ gap, paddingBottom: 52 }}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={32}
    >
      {children}
    </ScrollView>
  );
}
