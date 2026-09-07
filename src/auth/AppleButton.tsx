import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Touchable } from '@/components/Touchable';
import { Txt } from '@/components/ui';
import { radius, size as metric } from '@/theme';

/** Apple's mark, drawn inline so the button needs no image asset. */
function AppleGlyph({ size = 19, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M17.05 12.54c-.02-2.09 1.71-3.09 1.79-3.14-.98-1.43-2.5-1.63-3.04-1.65-1.29-.13-2.52.76-3.18.76-.66 0-1.67-.74-2.75-.72-1.41.02-2.72.82-3.45 2.08-1.47 2.55-.38 6.32 1.06 8.39.7 1.01 1.54 2.15 2.64 2.11 1.06-.04 1.46-.68 2.74-.68 1.28 0 1.64.68 2.76.66 1.14-.02 1.86-1.03 2.56-2.05.81-1.18 1.14-2.32 1.16-2.38-.03-.01-2.22-.85-2.29-3.38z"
      />
      <Path
        fill={color}
        d="M14.96 6.2c.58-.71.97-1.69.86-2.67-.84.03-1.85.56-2.45 1.26-.54.62-1.01 1.62-.88 2.58.93.07 1.89-.47 2.47-1.17z"
      />
    </Svg>
  );
}

/**
 * Black "Sign in with Apple" button. Kept black in both themes, per Apple's
 * human-interface guidance for the dark button style.
 */
export function AppleButton({
  label = 'Sign in with Apple',
  onPress,
  disabled,
}: {
  label?: string;
  onPress(): void;
  disabled?: boolean;
}) {
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      activeScale={0.97}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        height: metric.formButton,
        borderRadius: radius.pill,
        // Apple's HIG fixes the sign-in button's black and white; they are not
        // ours to theme.
        backgroundColor: '#000000',
        borderWidth: 1,
        borderColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ marginTop: -2 }}>
          <AppleGlyph />
        </View>
        <Txt size={17} weight="semibold" color="#ffffff" tracking={-0.01}>
          {label}
        </Txt>
      </View>
    </Touchable>
  );
}
