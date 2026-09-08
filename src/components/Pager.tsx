import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
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
/**
 * A trackpad swipe has no "finger lifted" moment — macOS keeps sending
 * momentum deltas after the fingers leave. This is how long the wheel has to
 * stay quiet before the gesture counts as over.
 */
const WHEEL_IDLE_MS = 90;

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
  const trackRef = useRef<View>(null);

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
        // A two-finger trackpad swipe on a Mac or an iPad with a Magic
        // Keyboard arrives as an indirect pan; without this it is ignored.
        .enableTrackpadTwoFingerGesture(true)
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

  /**
   * The same swipe on a trackpad in the browser. A wheel event is all the web
   * gives us — there is no gesture to hand to the pan — so the accumulated
   * horizontal delta drives the track directly, snapping at the same 90px the
   * touch gesture uses.
   */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = trackRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;

    let offset = 0;
    /** Set once a swipe has committed, to swallow the momentum tail behind it. */
    let spent = false;
    let idle: ReturnType<typeof setTimeout> | undefined;

    const settle = () => {
      offset = 0;
      spent = false;
      translateX.value = withTiming(-pageSV.value * width, {
        duration: DURATION.page,
        easing: CURVE.settle,
      });
    };

    const onWheel = (e: WheelEvent) => {
      // Vertical intent belongs to whatever the cursor is over.
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      // Otherwise the browser takes a horizontal swipe as back/forward.
      e.preventDefault();

      if (idle) clearTimeout(idle);
      idle = setTimeout(settle, WHEEL_IDLE_MS);
      if (spent) return;

      const p = pageSV.value;
      offset -= e.deltaX;
      const atEnd = (p === 0 && offset > 0) || (p === PAGE_COUNT - 1 && offset < 0);
      const shown = atEnd ? offset * RUBBER : offset;
      translateX.value = -p * width + shown;

      if (Math.abs(shown) <= SNAP_THRESHOLD) return;
      const next = shown < 0 ? Math.min(PAGE_COUNT - 1, p + 1) : Math.max(0, p - 1);
      if (next === p) return;
      // Commit as soon as the threshold is crossed — a trackpad never tells us
      // the fingers lifted, so waiting for that would feel late.
      spent = true;
      offset = 0;
      pageSV.value = next;
      translateX.value = withTiming(-next * width, {
        duration: DURATION.page,
        easing: CURVE.settle,
      });
      setPage(next);
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      if (idle) clearTimeout(idle);
      node.removeEventListener('wheel', onWheel);
    };
  }, [width, setPage, pageSV, translateX]);

  const position = useDerivedValue(() => -translateX.value / width, [width]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const ctx = useMemo<PagerContextValue>(() => ({ position, panRef: pan }), [position, pan]);

  return (
    <PagerContext.Provider value={ctx}>
      <GestureDetector gesture={pan}>
        <View ref={trackRef} style={{ flex: 1, overflow: 'hidden' }}>
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
