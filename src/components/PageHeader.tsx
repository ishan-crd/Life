import React from 'react';
import { View } from 'react-native';
import { Txt } from './ui';
import { tracking, useTheme, type as typeScale } from '@/theme';

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
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 6,
        paddingBottom: 22,
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{right}</View>
    </View>
  );
}
