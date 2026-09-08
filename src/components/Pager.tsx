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
/** Velocity, in px/s, above which a short swipe still counts as a fling. */
const FLING_VELOCITY = 700;
/**
 * A trackpad swipe has no "fingers lifted" moment — the browser only ever
 * says "moved". macOS keeps sending decaying momentum deltas for up to a
 * second after the fingers leave, spaced well under this; when the wheel has
 * been quiet this long, the swipe is over.
 */
const WHEEL_IDLE_MS = 80;
/** Firefox reports some wheels in lines rather than pixels; this is one line. */
const LINE_PX = 16;

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
        // On iPadOS and Catalyst a two-finger trackpad swipe arrives as an
        // indirect pan with real begin/end phases, so the touch physics apply
        // as they are. The web gives no such phases — gesture-handler's own
        // wheel emulation reads natural scrolling inverted and ends the
        // gesture after 30ms of quiet — so there the wheel is handled below.
        .enableTrackpadTwoFingerGesture(Platform.OS !== 'web')
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
   * The same swipe from a trackpad in the browser.
   *
   * The track follows the accumulated horizontal delta one-to-one — exactly
   * what the touch pan does with the finger — and nothing is decided until the
   * wheel goes quiet. Only then does the swipe snap, by the same rule as a
   * lifted finger: past 90px, or flung. Momentum cannot run ahead because the
   * offset is capped at one page, so a hard swipe slides fully across and
   * stays there until the momentum dies, then commits.
   */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = trackRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;

    let offset = 0;
    let velocity = 0;
    let lastTime = 0;
    let active = false;
    let idle: ReturnType<typeof setTimeout> | undefined;

    /** Past the first or last page the track gives, but only a fraction. */
    const shownFor = (p: number, raw: number) =>
      (p === 0 && raw > 0) || (p === PAGE_COUNT - 1 && raw < 0) ? raw * RUBBER : raw;

    const finish = () => {
      const p = pageSV.value;
      const shown = shownFor(p, offset);
      const flung = Math.abs(velocity) > FLING_VELOCITY;
      let next = p;
      if (shown < -SNAP_THRESHOLD || (flung && velocity < 0)) next = Math.min(PAGE_COUNT - 1, p + 1);
      else if (shown > SNAP_THRESHOLD || (flung && velocity > 0)) next = Math.max(0, p - 1);

      offset = 0;
      velocity = 0;
      active = false;
      pageSV.value = next;
      translateX.value = withTiming(-next * width, {
        duration: DURATION.page,
        easing: CURVE.settle,
      });
      if (next !== p) setPage(next);
    };

    const onWheel = (e: WheelEvent) => {
      const scale = e.deltaMode === 1 ? LINE_PX : 1;
      const dx = e.deltaX * scale;
      const dy = e.deltaY * scale;
      // Until a swipe is under way, vertical intent belongs to whatever the
      // cursor is over. Once it is, every event is part of it.
      if (!active && Math.abs(dx) <= Math.abs(dy)) return;
      // Otherwise the browser reads a horizontal swipe as back/forward.
      e.preventDefault();

      const now = e.timeStamp;
      const dt = active ? Math.max(1, now - lastTime) : 16;
      lastTime = now;

      // Natural scrolling: fingers moving left push the content left, which is
      // a positive deltaX and a negative translation, the same as a finger.
      const step = -dx;
      offset = Math.max(-width, Math.min(width, offset + step));
      // Velocity is smoothed so one uneven delta cannot decide the fling, but
      // seeded from the first sample so a short, quick flick is not averaged
      // down from zero and lost.
      const sample = (step / dt) * 1000;
      velocity = active ? velocity * 0.5 + sample * 0.5 : sample;
      active = true;

      translateX.value = -pageSV.value * width + shownFor(pageSV.value, offset);

      if (idle) clearTimeout(idle);
      idle = setTimeout(finish, WHEEL_IDLE_MS);
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
