import React from 'react';
import { View } from 'react-native';
import { Txt } from './ui';
import { tracking, useLayout, useTheme, type as typeScale } from '@/theme';

/**
 * The 44px page title ("Everything in flight") with a dimmed second half and a
 * right-hand action cluster, shared by every page.
 */
export function PageHeader({
  title,
  accent: accentText,
  right,
}: {
  title: string;
  accent?: string;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  const { compact } = useLayout();
  return (
    <View
      style={{
        // A phone cannot hold a 44px title and an action cluster on one line,
        // so the cluster drops beneath the title instead of squeezing it.
        flexDirection: compact ? 'column' : 'row',
        alignItems: compact ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: compact ? 12 : 0,
        paddingTop: 6,
        paddingBottom: compact ? 16 : 22,
      }}
    >
      <Txt size={typeScale.pageTitle} weight="medium" tracking={tracking.title} numberOfLines={1}>
        {title}
        {accentText ? (
          <Txt
            size={typeScale.pageTitle}
            weight="medium"
            tracking={tracking.title}
            color={t.inkDim}
          >{` ${accentText}`}</Txt>
        ) : null}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>{right}</View>
    </View>
  );
}
