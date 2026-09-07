import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '@/components/Icon';
import { PageHeader } from '@/components/PageHeader';
import { Panes } from '@/components/Panes';
import { RiseIn } from '@/components/RiseIn';
import { useSheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { Pill, PrimaryButton, ProgressRing, StatChip, Txt } from '@/components/ui';
import { useAppStore } from '@/state/store';
import type { BoardCard, ColumnKey } from '@/state/types';
import { accent, CURVE, DURATION, elevation, layer, radius, useLayout, useTheme } from '@/theme';

interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

const TAG_OPTIONS = [
  { label: 'Design', value: 'Design', color: accent.violet },
  { label: 'Build', value: 'Build', color: accent.cyan },
  { label: 'Content', value: 'Content', color: accent.lime },
  { label: 'Life', value: 'Life', color: accent.cyan },
];

function dotForTag(tag: string): string {
  return TAG_OPTIONS.find((o) => o.value === tag)?.color ?? accent.violet;
}

export function Board() {
  const t = useTheme();
  const { compact, gutter, cardPad } = useLayout();
  const { openSheet } = useSheet();
  const columns = useAppStore((s) => s.columns);
  const tasks = useAppStore((s) => s.tasks);
  const setPage = useAppStore((s) => s.setPage);
  const addCard = useAppStore((s) => s.addCard);
  const updateCard = useAppStore((s) => s.updateCard);
  const removeCard = useAppStore((s) => s.removeCard);
  const moveCard = useAppStore((s) => s.moveCard);
  const toggleTask = useAppStore((s) => s.toggleTask);
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const removeTask = useAppStore((s) => s.removeTask);

  const frames = useRef<Record<string, Frame>>({});
  const columnRefs = useRef<Record<string, View | null>>({});
  const framesSV = useSharedValue<Record<string, Frame>>({});
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragW = useSharedValue(0);
  const dragActive = useSharedValue(0);
  const overSV = useSharedValue<string | null>(null);
  /** Window-space origin of the board area, so the ghost can use absolute coords. */
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const boardRef = useRef<View | null>(null);

  const [dragCard, setDragCard] = useState<{ card: BoardCard; from: ColumnKey } | null>(null);
  const [over, setOver] = useState<string | null>(null);

  useAnimatedReaction(
    () => overSV.value,
    (next, prev) => {
      if (next !== prev) runOnJS(setOver)(next);
    }
  );

  /**
   * Column hit-boxes must be in window space because the drag gesture reports
   * absolute coordinates, so re-measure on every layout pass.
   */
  const measureColumn = useCallback(
    (key: string) => {
      columnRefs.current[key]?.measureInWindow((x, y, width, height) => {
        frames.current[key] = { x, y, w: width, h: height };
        framesSV.value = { ...frames.current };
      });
    },
    [framesSV]
  );

  const onColumnLayout = useCallback(
    (key: string) => (_e: LayoutChangeEvent) => measureColumn(key),
    [measureColumn]
  );

  /** Stacked columns move under the finger as the page scrolls. */
  const remeasureColumns = useCallback(() => {
    for (const key of Object.keys(columnRefs.current)) measureColumn(key);
  }, [measureColumn]);

  const beginDrag = useCallback((card: BoardCard, from: ColumnKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDragCard({ card, from });
  }, []);

  const endDrag = useCallback(
    (target: string | null) => {
      setDragCard((current) => {
        if (current && target && target !== current.from) {
          moveCard(current.card.id, current.from, target as ColumnKey);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return null;
      });
      setOver(null);
    },
    [moveCard]
  );

  const doneCards = columns.find((c) => c.key === 'done')?.cards.length ?? 0;
  const allCards = columns.reduce((n, c) => n + c.cards.length, 0);
  const wip = columns.find((c) => c.key === 'doing')?.cards.length ?? 0;
  const doneTasks = tasks.filter((x) => x.done).length;
  const taskPct = tasks.length ? doneTasks / tasks.length : 0;

  const openCardSheet = useCallback(
    (column: ColumnKey, card?: BoardCard) => {
      openSheet({
        title: card ? 'Edit card' : 'New card',
        submitLabel: card ? 'Save' : 'Add card',
        fields: [
          { key: 'title', label: 'Title', placeholder: 'Storyboard the swipe transition', initial: card?.title, required: true },
          { key: 'meta', label: 'Detail', placeholder: 'Today', initial: card?.meta },
          { key: 'tag', label: 'Tag', kind: 'select', initial: card?.tag ?? 'Design', options: TAG_OPTIONS },
        ],
        onSubmit: (v) => {
          const payload = { title: v.title, meta: v.meta || 'Just now', tag: v.tag, dot: dotForTag(v.tag) };
          if (card) updateCard(card.id, payload);
          else addCard(column, payload);
        },
        onDelete: card ? () => removeCard(card.id) : undefined,
      });
    },
    [openSheet, addCard, updateCard, removeCard]
  );

  const openTaskSheet = useCallback(
    (task?: { id: string; label: string; meta: string }) => {
      openSheet({
        title: task ? 'Edit ritual' : 'New ritual',
        submitLabel: task ? 'Save' : 'Add',
        fields: [
          { key: 'label', label: 'Ritual', placeholder: 'Read 20 pages', initial: task?.label, required: true },
          { key: 'meta', label: 'Detail', placeholder: 'Before bed', initial: task?.meta },
        ],
        onSubmit: (v) => {
          if (task) updateTask(task.id, { label: v.label, meta: v.meta });
          else addTask({ label: v.label, meta: v.meta });
        },
        onDelete: task ? () => removeTask(task.id) : undefined,
      });
    },
    [openSheet, addTask, updateTask, removeTask]
  );

  const ghostStyle = useAnimatedStyle(() => ({
    opacity: dragActive.value,
    width: dragW.value,
    transform: [
      { translateX: dragX.value - originX.value },
      { translateY: dragY.value - originY.value },
      { rotate: '-2deg' },
      { scale: 1.03 * dragActive.value + (1 - dragActive.value) },
    ],
  }));

  return (
    <View style={{ flex: 1, paddingHorizontal: gutter }}>
      <PageHeader
        title="Everything"
        accent="in flight"
        right={
          <>
            <StatChip left={`${doneCards}/${allCards} done`} right={`${wip} in progress`} />
            <PrimaryButton label="Overview" icon="arrowLeft" onPress={() => setPage(0)} />
          </>
        }
      />

      <RiseIn
        delay={80}
        ref={boardRef}
        onLayout={() => {
          boardRef.current?.measureInWindow((x, y) => {
            originX.value = x;
            originY.value = y;
          });
        }}
        style={{
          flex: 1,
          borderTopWidth: 1,
          borderTopColor: t.lineSoft,
          paddingTop: compact ? 14 : 20,
        }}
      >
        <Panes onScroll={remeasureColumns}>
        {columns.map((col) => {
          const active = over === col.key && dragCard?.from !== col.key && !!dragCard;
          return (
            <View
              key={col.key}
              ref={(node) => {
                columnRefs.current[col.key] = node;
              }}
              onLayout={onColumnLayout(col.key)}
              style={{
                flex: compact ? undefined : 1,
                minWidth: 0,
                padding: cardPad,
                borderRadius: radius.card,
                borderWidth: active ? 2 : 1,
                borderColor: active ? accent.purple : t.line,
                backgroundColor: active ? t.boardColActiveBg : t.boardColBg,
                transform: [{ scale: active ? 1.008 : 1 }],
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col.dot }} />
                <Txt size={17} weight="medium" tracking={-0.02} style={{ flex: 1 }}>
                  {col.title}
                </Txt>
                <View
                  style={{
                    paddingHorizontal: 11,
                    paddingVertical: 4,
                    borderRadius: radius.pill,
                    backgroundColor: t.pill,
                    borderWidth: 1,
                    borderColor: t.pillLine,
                  }}
                >
                  <Txt size={13} weight="semibold" color={t.inkSoft}>
                    {col.cards.length}
                  </Txt>
                </View>
              </View>

              <CardColumnList compact={compact}>
                {col.cards.map((card) => (
                  <DraggableCard
                    key={card.id}
                    card={card}
                    columnKey={col.key}
                    dimmed={dragCard?.card.id === card.id}
                    framesSV={framesSV}
                    dragX={dragX}
                    dragY={dragY}
                    dragW={dragW}
                    dragActive={dragActive}
                    overSV={overSV}
                    onBegin={beginDrag}
                    onEnd={endDrag}
                    onPress={() => openCardSheet(col.key, card)}
                  />
                ))}
                <Touchable
                  onPress={() => openCardSheet(col.key)}
                  activeScale={0.98}
                  style={{
                    padding: 12,
                    borderRadius: radius.cell,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: t.btnLineDash,
                    alignItems: 'center',
                  }}
                >
                  <Txt size={13} color={t.muted2}>
                    + Add card
                  </Txt>
                </Touchable>
              </CardColumnList>
            </View>
          );
        })}

        <View
          style={{
            width: compact ? '100%' : 320,
            padding: cardPad,
            borderRadius: radius.card,
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.line,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <View>
              <Txt size={17} weight="medium" tracking={-0.02}>
                Every day
              </Txt>
              <Txt size={13} color={t.muted2} style={{ marginTop: 3 }}>
                {doneTasks} of {tasks.length} kept
              </Txt>
            </View>
            <ProgressRing
              progress={taskPct}
              color={accent.purple}
              label={`${Math.round(taskPct * 100)}%`}
            />
          </View>
          <CardColumnList compact={compact} style={{ marginHorizontal: -8 }}>
            {tasks.map((task) => (
              <Touchable
                key={task.id}
                onPress={() => toggleTask(task.id)}
                onLongPress={() => openTaskSheet(task)}
                activeScale={0.99}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 11,
                  paddingHorizontal: 8,
                  borderRadius: radius.cell,
                }}
              >
                <Checkbox checked={task.done} />
                <View
                  style={{ flex: 1, minWidth: 0, opacity: task.done && t.name === 'dark' ? 0.42 : 1 }}
                >
                  <Txt
                    size={14}
                    weight="medium"
                    tracking={-0.01}
                    color={task.done && t.name === 'light' ? t.muted : t.ink}
                    style={task.done ? { textDecorationLine: 'line-through' } : undefined}
                  >
                    {task.label}
                  </Txt>
                  <Txt size={12} color={t.muted2} style={{ marginTop: 2 }}>
                    {task.meta}
                  </Txt>
                </View>
              </Touchable>
            ))}
            <Touchable
              onPress={() => openTaskSheet()}
              activeScale={0.98}
              style={{
                marginTop: 6,
                marginHorizontal: 8,
                padding: 12,
                borderRadius: radius.cell,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: t.btnLineDash,
                alignItems: 'center',
              }}
            >
              <Txt size={13} color={t.muted2}>
                + Add ritual
              </Txt>
            </Touchable>
          </CardColumnList>
        </View>
        </Panes>

        {dragCard ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: layer.dragGhost,
                padding: 14,
                borderRadius: radius.tile,
                backgroundColor: t.name === 'light' ? '#ffffff' : '#1c1b22',
                borderWidth: 1,
                borderColor: t.btnLineSoft,
                ...elevation.dragGhost,
              },
              ghostStyle,
            ]}
          >
            <Txt size={14} weight="semibold" tracking={-0.01} lineHeight={1.35}>
              {dragCard.card.title}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 11 }}>
              <Pill dot={dragCard.card.dot} paddingH={11} paddingV={5} style={{ backgroundColor: t.surface3 }}>
                <Txt size={12} color={t.inkSoft}>
                  {dragCard.card.tag}
                </Txt>
              </Pill>
              <Txt size={12} color={t.muted2}>
                {dragCard.card.meta}
              </Txt>
            </View>
          </Animated.View>
        ) : null}
      </RiseIn>
    </View>
  );
}

/**
 * A column's cards scroll inside the column when the three sit side by side,
 * and flow into the page's own scroll once they are stacked.
 */
function CardColumnList({
  compact,
  style,
  children,
}: {
  compact: boolean;
  style?: object;
  children: React.ReactNode;
}) {
  if (compact) return <View style={[{ gap: 10 }, style]}>{children}</View>;
  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  const t = useTheme();
  const style = useAnimatedStyle(
    () => ({
      backgroundColor: withTiming(checked ? accent.purple : 'transparent', { duration: 300 }),
      borderColor: withTiming(checked ? accent.purple : t.btnLineSoft, { duration: 300 }),
      transform: [{ scale: withTiming(checked ? 1.04 : 1, { duration: 400, easing: CURVE.pop }) }],
    }),
    [checked, t.btnLineSoft]
  );
  const tick = useAnimatedStyle(
    () => ({
      opacity: withTiming(checked ? 1 : 0, { duration: DURATION.quick }),
      transform: [{ scale: withTiming(checked ? 1 : 0.5, { duration: 400, easing: CURVE.pop }) }],
    }),
    [checked]
  );
  return (
    <Animated.View
      style={[
        {
          width: 21,
          height: 21,
          borderRadius: radius.check,
          borderWidth: 1.5,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Animated.View style={tick}>
        <Icon name="check" size={12} color="#fff" strokeWidth={3.4} />
      </Animated.View>
    </Animated.View>
  );
}

interface DraggableCardProps {
  card: BoardCard;
  columnKey: ColumnKey;
  dimmed: boolean;
  framesSV: { value: Record<string, Frame> };
  dragX: { value: number };
  dragY: { value: number };
  dragW: { value: number };
  dragActive: { value: number };
  overSV: { value: string | null };
  onBegin(card: BoardCard, from: ColumnKey): void;
  onEnd(target: string | null): void;
  onPress(): void;
}

/**
 * A board card that lifts after a long press and reports the column beneath the
 * finger, mirroring the prototype's pointer-based kanban drag.
 */
function DraggableCard({
  card,
  columnKey,
  dimmed,
  framesSV,
  dragX,
  dragY,
  dragW,
  dragActive,
  overSV,
  onBegin,
  onEnd,
  onPress,
}: DraggableCardProps) {
  const t = useTheme();
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const width = useSharedValue(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(200)
        .onStart((e) => {
          dragW.value = width.value;
          dragX.value = e.absoluteX - offsetX.value;
          dragY.value = e.absoluteY - offsetY.value;
          dragActive.value = withTiming(1, { duration: 160, easing: CURVE.pop });
          runOnJS(onBegin)(card, columnKey);
        })
        .onUpdate((e) => {
          dragX.value = e.absoluteX - offsetX.value;
          dragY.value = e.absoluteY - offsetY.value;
          let hit: string | null = null;
          const f = framesSV.value;
          for (const key in f) {
            const r = f[key];
            if (
              e.absoluteX >= r.x &&
              e.absoluteX <= r.x + r.w &&
              e.absoluteY >= r.y &&
              e.absoluteY <= r.y + r.h
            ) {
              hit = key;
            }
          }
          overSV.value = hit;
        })
        .onFinalize(() => {
          const target = overSV.value;
          dragActive.value = withTiming(0, { duration: 140 });
          overSV.value = null;
          runOnJS(onEnd)(target);
        }),
    [card, columnKey, dragActive, dragW, dragX, dragY, framesSV, offsetX, offsetY, onBegin, onEnd, overSV, width]
  );

  const style = useAnimatedStyle(
    () => ({ opacity: withTiming(dimmed ? 0.25 : 1, { duration: DURATION.quick }) }),
    [dimmed]
  );

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={(e) => {
          width.value = e.nativeEvent.layout.width;
        }}
        style={style}
      >
        <Touchable
          onPress={onPress}
          activeScale={0.98}
          haptic="light"
          onLayout={(e) => {
            offsetX.value = e.nativeEvent.layout.width / 2;
            offsetY.value = e.nativeEvent.layout.height / 2;
          }}
          style={{
            padding: 14,
            borderRadius: radius.tile,
            backgroundColor: t.surface2,
            borderWidth: 1,
            borderColor: t.pillLineSoft,
          }}
        >
          <Txt size={14} weight="semibold" tracking={-0.01} lineHeight={1.35}>
            {card.title}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 11 }}>
            <Pill dot={card.dot} paddingH={11} paddingV={5}>
              <Txt size={12} color={t.inkSoft}>
                {card.tag}
              </Txt>
            </Pill>
            <Txt size={12} color={t.muted2} numberOfLines={1} style={{ flex: 1 }}>
              {card.meta}
            </Txt>
          </View>
        </Touchable>
      </Animated.View>
    </GestureDetector>
  );
}
