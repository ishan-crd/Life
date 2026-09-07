import React from 'react';
import Svg, { Circle, G, Path, type SvgProps } from 'react-native-svg';

export type IconName =
  | 'search'
  | 'sun'
  | 'moon'
  | 'bell'
  | 'arrowRight'
  | 'arrowLeft'
  | 'chevronLeft'
  | 'chevronRight'
  | 'dots'
  | 'smile'
  | 'globe'
  | 'clock'
  | 'expand'
  | 'plus'
  | 'check'
  | 'trash'
  | 'pencil'
  | 'close';

interface IconProps extends SvgProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Line icons transcribed from the design's inline SVG paths. */
export const Icon = React.memo(function Icon({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 2,
  ...rest
}: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...rest}>
      {name === 'search' && (
        <G {...stroke}>
          <Circle cx={11} cy={11} r={7} />
          <Path d="m20 20-3.8-3.8" />
        </G>
      )}
      {name === 'sun' && (
        <G {...stroke} strokeWidth={1.9}>
          <Circle cx={12} cy={12} r={4.2} />
          <Path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
        </G>
      )}
      {name === 'moon' && (
        <Path {...stroke} strokeWidth={1.9} d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" />
      )}
      {name === 'bell' && (
        <G {...stroke} strokeWidth={1.9}>
          <Path d="M18 16v-5a6 6 0 1 0-12 0v5l-1.6 2.2h15.2z" />
          <Path d="M10 20.4a2.2 2.2 0 0 0 4 0" />
        </G>
      )}
      {name === 'arrowRight' && (
        <G {...stroke} strokeWidth={1.9}>
          <Path d="M5 12h13" />
          <Path d="m13 6 6 6-6 6" />
        </G>
      )}
      {name === 'arrowLeft' && (
        <G {...stroke} strokeWidth={2.2}>
          <Path d="M19 12H6" />
          <Path d="m11 6-6 6 6 6" />
        </G>
      )}
      {name === 'chevronLeft' && <Path {...stroke} strokeWidth={2.2} d="M14 6l-6 6 6 6" />}
      {name === 'chevronRight' && <Path {...stroke} strokeWidth={2.2} d="M10 6l6 6-6 6" />}
      {name === 'dots' && (
        <G fill={color}>
          <Circle cx={12} cy={5.6} r={1.6} />
          <Circle cx={12} cy={12} r={1.6} />
          <Circle cx={12} cy={18.4} r={1.6} />
        </G>
      )}
      {name === 'smile' && (
        <G {...stroke} strokeWidth={1.7}>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M8.6 14.2a4 4 0 0 0 6.8 0" />
          <Circle cx={9.3} cy={10} r={0.9} fill={color} strokeWidth={0} />
          <Circle cx={14.7} cy={10} r={0.9} fill={color} strokeWidth={0} />
        </G>
      )}
      {name === 'globe' && (
        <G {...stroke} strokeWidth={1.7}>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M3 12h18" />
          <Path d="M12 3c2.6 2.5 2.6 15 0 18-2.6-3-2.6-15.5 0-18z" />
        </G>
      )}
      {name === 'clock' && (
        <G {...stroke} strokeWidth={1.7}>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 7.6V12l3 1.8" />
        </G>
      )}
      {name === 'expand' && (
        <G {...stroke}>
          <Path d="M8 16 16 8" />
          <Path d="M9 8h7v7" />
        </G>
      )}
      {name === 'plus' && <Path {...stroke} strokeWidth={2.2} d="M12 5v14M5 12h14" />}
      {name === 'close' && <Path {...stroke} strokeWidth={2.2} d="M6 6l12 12M18 6L6 18" />}
      {name === 'check' && <Path {...stroke} strokeWidth={3.4} d="M4 12.5 9.5 18 20 6.5" />}
      {name === 'trash' && (
        <G {...stroke} strokeWidth={1.8}>
          <Path d="M4 7h16" />
          <Path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
          <Path d="M6.5 7.8 7.3 19a1.4 1.4 0 0 0 1.4 1.3h6.6A1.4 1.4 0 0 0 16.7 19l.8-11.2" />
        </G>
      )}
      {name === 'pencil' && (
        <G {...stroke} strokeWidth={1.8}>
          <Path d="M4 20h4L19.2 8.8a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16z" />
        </G>
      )}
    </Svg>
  );
});
