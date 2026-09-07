import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { PAGE_COUNT, useAppStore } from '@/state/store';
import { CURVE, DURATION } from '@/theme';

/** Distance the design requires before a swipe commits to the next page. */
const SNAP_THRESHOLD = 90;
/** Resistance applied when dragging past the first or last page. */
const RUBBER = 0.28;

interface PagerContextValue {
  /** Continuous page position (e.g. 1.4 mid-swipe) for parallax + dots. */
  position: Readonly<SharedValue<number>>;
  panRef: GestureType | undefined;
}

const PagerContext = createContext<PagerContextValue | null>(null);

export function usePager(): PagerContextValue {
  const ctx = useContext(PagerContext);
  if (!ctx) throw new Error('usePager must be used inside <Pager>');
  return ctx;
}

export function Pager({
  width,
  children,
  overlay,
}: {
  width: number;
  children: React.ReactNode;
  /** Rendered above the track but inside the pager context (e.g. page dots). */
  overlay?: React.ReactNode;
}) {
  const page = useAppStore((s) => s.page);
  const setPage = useAppStore((s) => s.setPage);

  const translateX = useSharedValue(-page * width);
  const pageSV = useSharedValue(page);

  useEffect(() => {
    pageSV.value = page;
    translateX.value = withTiming(-page * width, {
      duration: DURATION.page,
      easing: CURVE.settle,
    });
  }, [page, width, translateX, pageSV]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-18, 18])
        .onUpdate((e) => {
          const p = pageSV.value;
          let dx = e.translationX;
          if ((p === 0 && dx > 0) || (p === PAGE_COUNT - 1 && dx < 0)) dx *= RUBBER;
          translateX.value = -p * width + dx;
        })
        .onEnd((e) => {
          const p = pageSV.value;
          const dx = e.translationX;
          const flung = Math.abs(e.velocityX) > 700;
          let next = p;
          if (dx < -SNAP_THRESHOLD || (flung && e.velocityX < 0)) next = Math.min(PAGE_COUNT - 1, p + 1);
          else if (dx > SNAP_THRESHOLD || (flung && e.velocityX > 0)) next = Math.max(0, p - 1);
          pageSV.value = next;
          translateX.value = withTiming(-next * width, {
            duration: DURATION.page,
            easing: CURVE.settle,
          });
          if (next !== p) runOnJS(setPage)(next);
        }),
    [width, setPage, pageSV, translateX]
  );

  const position = useDerivedValue(() => -translateX.value / width, [width]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const ctx = useMemo<PagerContextValue>(() => ({ position, panRef: pan }), [position, pan]);

  return (
    <PagerContext.Provider value={ctx}>
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <Animated.View
            style={[
              { flex: 1, flexDirection: 'row', width: width * PAGE_COUNT },
              trackStyle,
            ]}
          >
            {React.Children.map(children, (child, i) => (
              <View key={i} style={{ width, height: '100%' }}>
                {child}
              </View>
            ))}
          </Animated.View>
          {overlay}
        </View>
      </GestureDetector>
    </PagerContext.Provider>
  );
}
