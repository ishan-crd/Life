import React from 'react';
import { View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { RoundButton, Txt } from '@/components/ui';
import { radius, useLayout, useTheme } from '@/theme';

/**
 * The frame every widget shares: a card that fills the slot the grid gave it,
 * a header, and a body that takes whatever height is left.
 */
export function WidgetCard({
  icon,
  title,
  action,
  actionLabel,
  onAction,
  children,
}: {
  icon?: IconName;
  title: string;
  action?: IconName;
  actionLabel?: string;
  onAction?(): void;
  children: React.ReactNode;
}) {
  const t = useTheme();
  const { cardPad, compact } = useLayout();

  return (
    <View
      style={{
        flex: 1,
        padding: cardPad,
        borderRadius: radius.card,
        backgroundColor: t.card,
        borderWidth: 1,
        borderColor: t.line,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          {icon ? <Icon name={icon} size={compact ? 17 : 20} color={t.inkSoft2} strokeWidth={1.7} /> : null}
          <Txt size={compact ? 15 : 17} weight="medium" tracking={-0.02} numberOfLines={1}>
            {title}
          </Txt>
        </View>
        {action && onAction ? (
          <RoundButton
            icon={action}
            size={compact ? 28 : 32}
            iconSize={14}
            accessibilityLabel={actionLabel ?? title}
            onPress={onAction}
          />
        ) : null}
      </View>
      <View style={{ flex: 1, minHeight: 0, marginTop: compact ? 8 : 12 }}>{children}</View>
    </View>
  );
}
