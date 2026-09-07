import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type GoalKey =
  | 'focus'
  | 'fitness'
  | 'sleep'
  | 'reading'
  | 'mind'
  | 'money'
  | 'people'
  | 'learning';

/** Purpose-drawn glyphs for the onboarding goal picker. */
export function GoalIcon({ name, size = 22, color }: { name: GoalKey; size?: number; color: string }) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'focus' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...stroke} />
          <Circle cx={12} cy={12} r={4.5} {...stroke} />
          <Circle cx={12} cy={12} r={1.4} fill={color} />
        </>
      )}
      {name === 'fitness' && (
        <>
          <Path d="M4 9v6M20 9v6" {...stroke} />
          <Rect x={6.5} y={7} width={3.2} height={10} rx={1.4} {...stroke} />
          <Rect x={14.3} y={7} width={3.2} height={10} rx={1.4} {...stroke} />
          <Path d="M9.7 12h4.6" {...stroke} />
        </>
      )}
      {name === 'sleep' && (
        <>
          <Path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" {...stroke} />
          <Circle cx={16.5} cy={6} r={0.9} fill={color} />
        </>
      )}
      {name === 'reading' && (
        <>
          <Path d="M12 6.6C10.4 5.3 8.2 4.8 5 5.1v12c3.2-.3 5.4.2 7 1.5 1.6-1.3 3.8-1.8 7-1.5v-12c-3.2-.3-5.4.2-7 1.5z" {...stroke} />
          <Path d="M12 6.6v12.4" {...stroke} />
        </>
      )}
      {name === 'mind' && (
        <>
          <Path d="M9 20v-2.2A6 6 0 1 1 15 6.4" {...stroke} />
          <Path d="M15 4.4a4.6 4.6 0 0 1 3.4 7.7c-.7.8-1 1.6-1 2.6V20" {...stroke} />
          <Path d="M9 20h8" {...stroke} />
        </>
      )}
      {name === 'money' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...stroke} />
          <Path d="M14.6 9.2a3 3 0 0 0-5.2 1.9c0 2.6 5.2 1.4 5.2 3.9a3 3 0 0 1-5.2 1.7" {...stroke} />
          <Path d="M12 6.6v10.8" {...stroke} />
        </>
      )}
      {name === 'people' && (
        <>
          <Circle cx={9} cy={9} r={3.2} {...stroke} />
          <Path d="M3.6 19.4a5.6 5.6 0 0 1 10.8 0" {...stroke} />
          <Path d="M16 6.2a3.2 3.2 0 0 1 0 6M17.2 14.3a5.6 5.6 0 0 1 3.2 5.1" {...stroke} />
        </>
      )}
      {name === 'learning' && (
        <>
          <Path d="M12 4.4 21 9l-9 4.6L3 9z" {...stroke} />
          <Path d="M6.8 11.2v4.4c0 1.6 2.3 2.9 5.2 2.9s5.2-1.3 5.2-2.9v-4.4" {...stroke} />
        </>
      )}
    </Svg>
  );
}
