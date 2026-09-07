import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Txt } from './ui';

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
      <Txt size={44} weight="medium" tracking={-0.03} numberOfLines={1}>
        {title}
        {accentText ? <Txt size={44} weight="medium" tracking={-0.03} color={t.inkDim}>{` ${accentText}`}</Txt> : null}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{right}</View>
    </View>
  );
}
