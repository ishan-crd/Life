import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  cancelAnimation,
  FadeOut,
  ZoomIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Touchable } from './Touchable';
import { Txt } from './ui';
import type { WidgetKey } from '@/state/types';
import { DURATION, elevation, layer, radius, useLayout, useTheme } from '@/theme';

export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetSize {
  /** Columns the widget prefers, clamped to the grid. */
  span: number;
  /** Height in grid rows. */
  rows: number;
}

/**
 * Shelf packing, the way the iOS home screen fills a page: walk the order,
 * place each widget on the current line while it fits, then start a new line
 * whose height is the tallest widget on the line above.
 */
export function packWidgets(
  order: WidgetKey[],
  sizeOf: (key: WidgetKey) => WidgetSize,
  columns: number,
  colWidth: number,
  rowHeight: number,
  gap: number
): { slots: Slot[]; height: number } {
  const slots: Slot[] = [];
  let col = 0;
  let y = 0;
  let shelfRows = 0;

  for (const key of order) {
    const { span: rawSpan, rows } = sizeOf(key);
    const span = Math.max(1, Math.min(columns, rawSpan));
    if (col + span > columns) {
      y += shelfRows * rowHeight + (shelfRows - 1) * gap + gap;
      col = 0;
      shelfRows = 0;
    }
    slots.push({
      x: col * (colWidth + gap),
      y,
      w: span * colWidth + (span - 1) * gap,
      h: rows * rowHeight + (rows - 1) * gap,
    });
    col += span;
    shelfRows = Math.max(shelfRows, rows);
  }

  return { slots, height: shelfRows ? y + shelfRows * rowHeight + (shelfRows - 1) * gap : 0 };
}

/** Moves one entry, the way a dragged widget pushes the others along. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

interface WidgetGridProps {
  order: WidgetKey[];
  sizeOf(key: WidgetKey): WidgetSize;
  render(key: WidgetKey): React.ReactNode;
  editing: boolean;
  /** Long-pressing a widget outside edit mode enters it, as on iOS. */
  onRequestEdit(): void;
  onReorder(order: WidgetKey[]): void;
  onRemove(key: WidgetKey): void;
}

/**
 * The home page's widgets: a packed grid you can pick a widget up out of and
 * drop somewhere else, with the rest springing out of the way as it passes.
 *
 * Slots are computed rather than laid out by flexbox, so a dragged widget can
 * keep following the finger from where it started while the order underneath
 * it changes.
 */
export function WidgetGrid({
  order,
  sizeOf,
  render,
  editing,
  onRequestEdit,
  onReorder,
  onRemove,
}: WidgetGridProps) {
  const { columns, gap, rowHeight } = useLayout();
  const [width, setWidth] = useState(0);
  /** The order as the finger sees it — committed to the store on drop. */
  const [live, setLive] = useState(order);
  const [seen, setSeen] = useState(order);
  const [dragKey, setDragKey] = useState<WidgetKey | null>(null);

  // Adjusting during render rather than in an effect: the store is the source
  // of the order, and a change to it should not cost a second paint.
  if (order !== seen) {
    setSeen(order);
    setLive(order);
  }

  const colWidth = width ? (width - gap * (columns - 1)) / columns : 0;
  const { slots, height } = useMemo(
    () => packWidgets(live, sizeOf, columns, colWidth, rowHeight, gap),
    [live, sizeOf, columns, colWidth, rowHeight, gap]
  );

  /** Slot rectangles on the UI thread, so the hit test never crosses to JS. */
  const slotsSV = useSharedValue<Slot[]>([]);
  const dragIndexSV = useSharedValue(-1);
  const liveRef = useRef(live);

  useEffect(() => {
    slotsSV.value = slots;
    liveRef.current = live;
  }, [slots, live, slotsSV]);

  const beginDrag = useCallback((key: WidgetKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDragKey(key);
  }, []);

  const hoverTo = useCallback((from: number, to: number) => {
    setLive((current) => {
      const next = moveItem(current, from, to);
      liveRef.current = next;
      return next;
    });
    Haptics.selectionAsync();
  }, []);

  const endDrag = useCallback(() => {
    setDragKey(null);
    onReorder(liveRef.current);
  }, [onReorder]);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ width: '100%', height }}
    >
      {width
        ? live.map((key, index) => (
            <WidgetCell
              key={key}
              widgetKey={key}
              index={index}
              slot={slots[index]}
              slotsSV={slotsSV}
              dragIndexSV={dragIndexSV}
              dragging={dragKey === key}
              anyDragging={dragKey !== null}
              editing={editing}
              onRequestEdit={onRequestEdit}
              onBeginDrag={beginDrag}
              onHover={hoverTo}
              onEndDrag={endDrag}
              onRemove={onRemove}
            >
              {render(key)}
            </WidgetCell>
          ))
        : null}
    </View>
  );
}

interface WidgetCellProps {
  widgetKey: WidgetKey;
  index: number;
  slot: Slot;
  slotsSV: SharedValue<Slot[]>;
  dragIndexSV: SharedValue<number>;
  dragging: boolean;
  anyDragging: boolean;
  editing: boolean;
  onRequestEdit(): void;
  onBeginDrag(key: WidgetKey): void;
  onHover(from: number, to: number): void;
  onEndDrag(): void;
  onRemove(key: WidgetKey): void;
  children: React.ReactNode;
}

/** How far the wiggle swings, in degrees. */
const WIGGLE = 0.55;

function WidgetCell({
  widgetKey,
  index,
  slot,
  slotsSV,
  dragIndexSV,
  dragging,
  anyDragging,
  editing,
  onRequestEdit,
  onBeginDrag,
  onHover,
  onEndDrag,
  onRemove,
  children,
}: WidgetCellProps) {
  const t = useTheme();
  const { compact } = useLayout();

  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const lift = useSharedValue(0);
  const wiggle = useSharedValue(0);
  /** Where the widget sat when it was picked up; the finger moves it from there. */
  const originX = useSharedValue(slot.x);
  const originY = useSharedValue(slot.y);
  const indexSV = useSharedValue(index);

  useEffect(() => {
    indexSV.value = index;
  }, [index, indexSV]);

  useEffect(() => {
    if (!editing) {
      cancelAnimation(wiggle);
      wiggle.value = withTiming(0, { duration: DURATION.quick });
      return;
    }
    // Every widget swings out of phase with its neighbours, as on iOS.
    wiggle.value = withDelay(
      index * 60,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 130 }),
          withTiming(-1, { duration: 260 }),
          withTiming(0, { duration: 130 })
        ),
        -1,
        false
      )
    );
  }, [editing, index, wiggle]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(editing ? 90 : 260)
        .onStart(() => {
          originX.value = slotsSV.value[indexSV.value]?.x ?? 0;
          originY.value = slotsSV.value[indexSV.value]?.y ?? 0;
          dragX.value = 0;
          dragY.value = 0;
          dragIndexSV.value = indexSV.value;
          lift.value = withSpring(1, { damping: 16, stiffness: 220 });
          runOnJS(onBeginDrag)(widgetKey);
          if (!editing) runOnJS(onRequestEdit)();
        })
        .onUpdate((e) => {
          dragX.value = e.translationX;
          dragY.value = e.translationY;

          const slots = slotsSV.value;
          const from = dragIndexSV.value;
          if (from < 0 || !slots.length) return;
          const self = slots[from];
          if (!self) return;
          // Hit-test the dragged widget's own centre against every slot.
          const cx = originX.value + e.translationX + self.w / 2;
          const cy = originY.value + e.translationY + self.h / 2;
          for (let i = 0; i < slots.length; i += 1) {
            const s = slots[i];
            if (i !== from && cx >= s.x && cx <= s.x + s.w && cy >= s.y && cy <= s.y + s.h) {
              dragIndexSV.value = i;
              runOnJS(onHover)(from, i);
              return;
            }
          }
        })
        .onFinalize(() => {
          lift.value = withSpring(0, { damping: 18, stiffness: 200 });
          dragIndexSV.value = -1;
          runOnJS(onEndDrag)();
        }),
    [editing, widgetKey, dragIndexSV, dragX, dragY, indexSV, lift, onBeginDrag, onEndDrag, onHover, onRequestEdit, originX, originY, slotsSV]
  );

  const animated = useAnimatedStyle(() => {
    // A widget being dragged tracks the finger from where it was picked up; the
    // rest spring to whatever slot the reordering has just given them.
    const x = dragging ? originX.value + dragX.value : withSpring(slot.x, SLOT_SPRING);
    const y = dragging ? originY.value + dragY.value : withSpring(slot.y, SLOT_SPRING);
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${wiggle.value * WIGGLE}deg` },
        { scale: 1 + lift.value * 0.04 },
      ],
      shadowOpacity: lift.value * 0.55,
      zIndex: dragging ? layer.dragGhost : 1,
      opacity: anyDragging && !dragging ? 0.94 : 1,
    };
  }, [slot.x, slot.y, dragging, anyDragging]);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={ZoomIn.springify().damping(17).stiffness(180)}
        exiting={FadeOut.duration(160)}
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: slot.w,
            height: slot.h,
            borderRadius: radius.card,
            shadowColor: '#000',
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 18 },
          },
          animated,
        ]}
      >
        {children}
        {editing ? (
          <Touchable
            onPress={() => onRemove(widgetKey)}
            activeScale={0.86}
            haptic="medium"
            accessibilityLabel={`Remove ${widgetKey} widget`}
            style={{
              position: 'absolute',
              left: -6,
              top: -6,
              width: compact ? 24 : 26,
              height: compact ? 24 : 26,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: t.invBg,
              borderWidth: 1,
              borderColor: t.line,
              ...elevation.sheet,
            }}
          >
            <Txt size={15} weight="bold" color={t.invInk} lineHeight={1}>
              −
            </Txt>
          </Touchable>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

/** Matches the design's settle: quick, barely overshooting. */
const SLOT_SPRING = { damping: 20, stiffness: 210, mass: 0.85 } as const;
