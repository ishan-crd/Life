import { Easing } from 'react-native-reanimated';

/**
 * Motion curves lifted from the design's CSS transitions so React Native
 * animation feels identical to the web prototype.
 */
export const CURVE = {
  /** cubic-bezier(.22, 1, .36, 1) — the primary "settle" ease-out. */
  settle: Easing.bezier(0.22, 1, 0.36, 1),
  /** cubic-bezier(.34, 1.56, .64, 1) — the springy press/pop ease. */
  pop: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export const DURATION = {
  press: 180,
  quick: 300,
  base: 350,
  page: 620,
  bar: 700,
  rise: 500,
} as const;

/** Spring used for page snapping — tuned to match the .62s settle transition. */
export const PAGE_SPRING = {
  damping: 22,
  stiffness: 140,
  mass: 0.9,
  overshootClamping: false,
  restDisplacementThreshold: 0.2,
  restSpeedThreshold: 2,
} as const;

export const POP_SPRING = {
  damping: 14,
  stiffness: 260,
  mass: 0.6,
} as const;
