import React, { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';

interface Stop {
  color: string;
  /** Sweep end in degrees, measured from the `from` angle. */
  to: number;
}

/**
 * Pie-slice equivalent of the design's `conic-gradient(...)` brand mark —
 * react-native-svg has no conic gradient, so hard stops are drawn as arcs.
 */
export function ConicDisc({
  size,
  from = 0,
  stops,
}: {
  size: number;
  from?: number;
  stops: Stop[];
}) {
  const paths = useMemo(() => {
    const r = size / 2;
    const point = (deg: number) => {
      // CSS conic gradients start at 12 o'clock and sweep clockwise.
      const rad = ((deg - 90) * Math.PI) / 180;
      return [r + r * Math.cos(rad), r + r * Math.sin(rad)] as const;
    };
    let start = 0;
    return stops.map((stop) => {
      const a0 = from + start;
      const a1 = from + stop.to;
      start = stop.to;
      const [x0, y0] = point(a0);
      const [x1, y1] = point(a1);
      const large = a1 - a0 > 180 ? 1 : 0;
      return {
        color: stop.color,
        d: `M ${r} ${r} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`,
      };
    });
  }, [size, from, stops]);

  return (
    <Svg width={size} height={size}>
      {paths.map((p, i) => (
        <Path key={i} d={p.d} fill={p.color} />
      ))}
    </Svg>
  );
}
