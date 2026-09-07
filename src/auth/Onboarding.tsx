import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { Icon } from '@/components/Icon';
import { Touchable } from '@/components/Touchable';
import { FONT, Txt } from '@/components/ui';
import { useAppStore } from '@/state/store';
import { useProfileStore, type OnboardingAnswers } from '@/state/profile';
import { Aurora } from './Aurora';
import { GoalIcon, type GoalKey } from './GoalIcon';
import { accent, CURVE, DURATION, POP_SPRING, radius, size as metric, space, tracking, useTheme, type as typeScale } from '@/theme';

const GOALS: { key: GoalKey; label: string; blurb: string; color: string }[] = [
  { key: 'focus', label: 'Deep work', blurb: 'Longer, quieter blocks', color: accent.violetSoft },
  { key: 'fitness', label: 'Get stronger', blurb: 'Train on a schedule', color: accent.lime },
  { key: 'sleep', label: 'Sleep better', blurb: 'Earlier, more of it', color: accent.cyan },
  { key: 'reading', label: 'Read more', blurb: 'Pages before bed', color: accent.violetSoft },
  { key: 'mind', label: 'Calmer mind', blurb: 'Journal and breathe', color: accent.cyan },
  { key: 'money', label: 'Money in order', blurb: 'Track and plan it', color: accent.lime },
  { key: 'people', label: 'Show up for people', blurb: 'Keep in touch', color: accent.violetSoft },
  { key: 'learning', label: 'Learn a craft', blurb: 'Practice daily', color: accent.cyan },
];

const RITUALS_BY_GOAL: Record<GoalKey, string[]> = {
  focus: ['Ship one small thing', 'Plan tomorrow'],
  fitness: ['Workout', 'Stretch 10 minutes'],
  sleep: ['No screens after 11', 'Lights out by midnight'],
  reading: ['Read 20 pages'],
  mind: ['Journal 5 minutes', 'Ten slow breaths'],
  money: ['Log today’s spend'],
  people: ['Message someone you love'],
  learning: ['Practice 30 minutes'],
};

const BASE_RITUALS = ['Inbox to zero', 'Walk outside', 'Drink a glass on waking'];

const FOCUS_CHOICES = [
  { hours: 1, label: '1 hour', blurb: 'Getting started' },
  { hours: 2, label: '2 hours', blurb: 'Steady and sane' },
  { hours: 4, label: '4 hours', blurb: 'Serious output' },
  { hours: 6, label: '6 hours', blurb: 'All-in season' },
];

const WATER_CHOICES = [6, 8, 10, 12];
const STEP_CHOICES = [6000, 8000, 10000, 12000];

const STEP_COUNT = 6;

export function Onboarding() {
  const t = useTheme();
  const { width, height } = useWindowDimensions();
  const profile = useProfileStore((s) => s.profile);
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding);
  const applyOnboarding = useAppStore((s) => s.applyOnboarding);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.name && profile.name !== 'there' ? profile.name : '');
  const [goals, setGoals] = useState<GoalKey[]>([]);
  const [focusHours, setFocusHours] = useState(2);
  const [rituals, setRituals] = useState<string[]>([]);
  const [waterGoal, setWaterGoal] = useState(8);
  const [stepGoal, setStepGoal] = useState(10000);
  const [wakeTime, setWakeTime] = useState('07:00');

  const suggestedRituals = useMemo(
    () => Array.from(new Set([...goals.flatMap((g) => RITUALS_BY_GOAL[g]), ...BASE_RITUALS])),
    [goals]
  );

  const canAdvance = useMemo(() => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return goals.length > 0;
    if (step === 3) return rituals.length > 0;
    return true;
  }, [step, name, goals, rituals]);

  const finish = useCallback(() => {
    const answers: OnboardingAnswers = {
      goals,
      focusHours,
      rituals,
      waterGoal,
      stepGoal,
      wakeTime,
    };
    applyOnboarding({ rituals, waterGoal, stepGoal, focusHours });
    completeOnboarding(answers, name.trim());
  }, [goals, focusHours, rituals, waterGoal, stepGoal, wakeTime, applyOnboarding, completeOnboarding, name]);

  const next = useCallback(() => {
    if (!canAdvance) return;
    if (step === STEP_COUNT - 1) finish();
    else setStep((s) => s + 1);
  }, [canAdvance, step, finish]);

  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  const progress = (step + 1) / STEP_COUNT;
  const progressStyle = useAnimatedStyle(
    () => ({ width: withTiming(`${progress * 100}%`, { duration: 520, easing: CURVE.settle }) }),
    [progress]
  );

  /**
   * Toggling a goal also pre-selects the rituals it implies, so step 4 opens
   * with a sensible checklist instead of an empty one.
   */
  const toggleGoal = useCallback((key: GoalKey) => {
    setGoals((current) => {
      const nextGoals = current.includes(key)
        ? current.filter((x) => x !== key)
        : [...current, key];
      const suggested = nextGoals.flatMap((g) => RITUALS_BY_GOAL[g]).slice(0, 5);
      setRituals((chosen) =>
        Array.from(
          new Set([...suggested, ...chosen.filter((r) => BASE_RITUALS.includes(r))])
        )
      );
      return nextGoals;
    });
  }, []);

  const toggleRitual = useCallback((label: string) => {
    setRituals((r) => (r.includes(label) ? r.filter((x) => x !== label) : [...r, label]));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={[StyleSheet.absoluteFill, { opacity: 0.62 }]} pointerEvents="none">
        <Aurora width={width} height={height} showOrbits={false} />
      </View>

      <View style={{ paddingHorizontal: 44, paddingTop: 34 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Touchable
            onPress={back}
            disabled={step === 0}
            activeScale={0.9}
            accessibilityLabel="Back"
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: t.btnLine,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: step === 0 ? 0.3 : 1,
            }}
          >
            <Icon name="chevronLeft" size={16} color={t.inkSoft} />
          </Touchable>
          <View
            style={{
              flex: 1,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: t.surface3,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={[
                { height: '100%', borderRadius: radius.pill, backgroundColor: accent.purple },
                progressStyle,
              ]}
            />
          </View>
          <Txt size={13} color={t.muted2}>
            {step + 1} / {STEP_COUNT}
          </Txt>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 44,
          paddingTop: 30,
          paddingBottom: 130,
          flexGrow: 1,
          justifyContent: step === 0 ? 'center' : 'flex-start',
        }}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 ? (
          <Step title="First things first" subtitle="What should the dashboard call you?">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Arnav"
              placeholderTextColor={t.muted3}
              autoCapitalize="words"
              autoCorrect={false}
              style={{
                marginTop: 8,
                maxWidth: 560,
                height: 68,
                borderRadius: 20,
                paddingHorizontal: 22,
                fontFamily: FONT.medium,
                fontSize: 28,
                letterSpacing: -0.6,
                color: t.ink,
                backgroundColor: t.surface2,
                borderWidth: 1,
                borderColor: t.pillLineSoft,
              }}
            />
            <Txt size={13} color={t.muted2} style={{ marginTop: 14 }}>
              Used in the greeting on your overview. You can change it any time.
            </Txt>
          </Step>
        ) : null}

        {step === 1 ? (
          <Step title="What are you actually chasing?" subtitle="Pick everything that matters this season.">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6, maxWidth: 964 }}>
              {GOALS.map((g, i) => (
                <GoalCard
                  key={g.key}
                  index={i}
                  goal={g}
                  selected={goals.includes(g.key)}
                  onPress={() => toggleGoal(g.key)}
                />
              ))}
            </View>
          </Step>
        ) : null}

        {step === 2 ? (
          <Step title="How much deep work, daily?" subtitle="We size your focus blocks from this.">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
              {FOCUS_CHOICES.map((c, i) => (
                <ChoiceCard
                  key={c.hours}
                  index={i}
                  title={c.label}
                  blurb={c.blurb}
                  selected={focusHours === c.hours}
                  onPress={() => setFocusHours(c.hours)}
                />
              ))}
            </View>
            <Txt size={13} color={t.muted2} style={{ marginTop: 18 }}>
              Your focus timer starts at {Math.max(15, Math.min(90, Math.round((focusHours * 60) / 2)))} minutes
              per block.
            </Txt>
          </Step>
        ) : null}

        {step === 3 ? (
          <Step title="Choose your daily rituals" subtitle="These become the checklist on your board.">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
              {suggestedRituals.map((label, i) => (
                <RitualChip
                  key={label}
                  index={i}
                  label={label}
                  selected={rituals.includes(label)}
                  onPress={() => toggleRitual(label)}
                />
              ))}
            </View>
            <Txt size={13} color={t.muted2} style={{ marginTop: 18 }}>
              {rituals.length} selected · you can add more from the board later.
            </Txt>
          </Step>
        ) : null}

        {step === 4 ? (
          <Step title="Set your health targets" subtitle="Water, steps and the hour you like to start.">
            <Txt size={14} weight="semibold" style={{ marginTop: 4, marginBottom: 10 }}>
              Glasses of water a day
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {WATER_CHOICES.map((n, i) => (
                <Pillet key={n} index={i} label={`${n}`} selected={waterGoal === n} onPress={() => setWaterGoal(n)} />
              ))}
            </View>

            <Txt size={14} weight="semibold" style={{ marginTop: 26, marginBottom: 10 }}>
              Daily step goal
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {STEP_CHOICES.map((n, i) => (
                <Pillet
                  key={n}
                  index={i}
                  label={`${(n / 1000).toFixed(0)}k`}
                  selected={stepGoal === n}
                  onPress={() => setStepGoal(n)}
                />
              ))}
            </View>

            <Txt size={14} weight="semibold" style={{ marginTop: 26, marginBottom: 10 }}>
              Usual wake-up
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {['05:30', '06:30', '07:00', '08:00', '09:00'].map((v, i) => (
                <Pillet key={v} index={i} label={v} selected={wakeTime === v} onPress={() => setWakeTime(v)} />
              ))}
            </View>
          </Step>
        ) : null}

        {step === 5 ? (
          <Step title={`You're set, ${name.trim().split(/\s+/)[0] || 'friend'}`} subtitle="Here is what we tuned for you.">
            <View style={{ flexDirection: 'row', gap: 18, marginTop: 8, flexWrap: 'wrap' }}>
              <SummaryCard title="Goals" value={`${goals.length} chosen`} detail={goals.map((g) => GOALS.find((x) => x.key === g)?.label).join(' · ')} />
              <SummaryCard title="Deep work" value={`${focusHours} h / day`} detail={`${Math.max(15, Math.min(90, Math.round((focusHours * 60) / 2)))} min focus blocks`} />
              <SummaryCard title="Rituals" value={`${rituals.length} daily`} detail={rituals.slice(0, 3).join(' · ')} />
              <SummaryCard title="Health" value={`${waterGoal} glasses · ${(stepGoal / 1000).toFixed(0)}k steps`} detail={`Wake around ${wakeTime}`} />
            </View>
            <View style={{ alignItems: 'center', marginTop: 34 }}>
              <SuccessMark />
            </View>
          </Step>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 44,
          paddingBottom: 30,
          paddingTop: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderTopColor: t.line,
          backgroundColor: t.bg,
        }}
      >
        <Txt size={13} color={t.muted2}>
          {step === STEP_COUNT - 1 ? 'Everything can be changed later.' : 'Takes about two minutes.'}
        </Txt>
        <Touchable
          onPress={next}
          disabled={!canAdvance}
          activeScale={0.96}
          haptic="light"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            height: metric.formButton,
            paddingHorizontal: space.gutter,
            borderRadius: radius.pill,
            backgroundColor: t.invBg,
            opacity: canAdvance ? 1 : 0.35,
          }}
        >
          <Txt size={16} weight="semibold" color={t.invInk}>
            {step === STEP_COUNT - 1 ? 'Enter your dashboard' : 'Continue'}
          </Txt>
          <Icon name="arrowRight" size={16} color={t.invInk} strokeWidth={2} />
        </Touchable>
      </View>
    </View>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(420)} exiting={FadeOutUp.duration(180)}>
      <Txt size={typeScale.heading} weight="medium" tracking={tracking.display} lineHeight={1.1}>
        {title}
      </Txt>
      <Txt size={typeScale.lead} color={t.muted} style={{ marginTop: 10, marginBottom: 26 }}>
        {subtitle}
      </Txt>
      {children}
    </Animated.View>
  );
}

function GoalCard({
  goal,
  selected,
  onPress,
  index,
}: {
  goal: (typeof GOALS)[number];
  selected: boolean;
  onPress(): void;
  index: number;
}) {
  const t = useTheme();
  const pop = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    pop.value = withSpring(selected ? 1 : 0, POP_SPRING);
  }, [selected, pop]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.02 * pop.value }],
    borderColor: selected ? accent.purple : t.line,
    backgroundColor: selected ? t.surface2 : t.card,
  }));

  return (
    <Animated.View entering={FadeIn.delay(index * 40).duration(320)}>
      <Touchable
        onPress={onPress}
        activeScale={0.97}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
      >
        <Animated.View
          style={[
            {
              width: 232,
              padding: space.cardPad,
              borderRadius: 20,
              borderWidth: 1.5,
            },
            style,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.surface3,
              }}
            >
              <GoalIcon name={goal.key} color={goal.color} />
            </View>
            <SelectDot selected={selected} />
          </View>
          <Txt size={16} weight="semibold" tracking={-0.01} style={{ marginTop: 14 }}>
            {goal.label}
          </Txt>
          <Txt size={13} color={t.muted2} style={{ marginTop: 3 }}>
            {goal.blurb}
          </Txt>
        </Animated.View>
      </Touchable>
    </Animated.View>
  );
}

function SelectDot({ selected }: { selected: boolean }) {
  const t = useTheme();
  const style = useAnimatedStyle(
    () => ({
      backgroundColor: withTiming(selected ? accent.purple : 'transparent', { duration: DURATION.quick }),
      borderColor: withTiming(selected ? accent.purple : t.btnLine, { duration: DURATION.quick }),
      transform: [{ scale: withSpring(selected ? 1 : 0.9, POP_SPRING) }],
    }),
    [selected, t.btnLine]
  );
  const tick = useAnimatedStyle(
    () => ({ opacity: withTiming(selected ? 1 : 0, { duration: 180 }) }),
    [selected]
  );
  return (
    <Animated.View
      style={[
        { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Animated.View style={tick}>
        <Icon name="check" size={12} color="#fff" strokeWidth={3.4} />
      </Animated.View>
    </Animated.View>
  );
}

function ChoiceCard({
  title,
  blurb,
  selected,
  onPress,
  index,
}: {
  title: string;
  blurb: string;
  selected: boolean;
  onPress(): void;
  index: number;
}) {
  const t = useTheme();
  return (
    <Animated.View entering={FadeIn.delay(index * 50).duration(320)}>
      <Touchable onPress={onPress} activeScale={0.97}>
        <View
          style={{
            width: 208,
            padding: space.cardPadWide,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: selected ? accent.purple : t.line,
            backgroundColor: selected ? t.surface2 : t.card,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt size={22} weight="semibold" tracking={-0.02}>
              {title}
            </Txt>
            <SelectDot selected={selected} />
          </View>
          <Txt size={13} color={t.muted2} style={{ marginTop: 6 }}>
            {blurb}
          </Txt>
        </View>
      </Touchable>
    </Animated.View>
  );
}

function RitualChip({
  label,
  selected,
  onPress,
  index,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
  index: number;
}) {
  const t = useTheme();
  return (
    <Animated.View entering={FadeIn.delay(index * 35).duration(280)}>
      <Touchable onPress={onPress} activeScale={0.95}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 13,
            borderRadius: radius.pill,
            borderWidth: 1.5,
            borderColor: selected ? accent.purple : t.line,
            backgroundColor: selected ? t.surface2 : t.card,
          }}
        >
          <SelectDot selected={selected} />
          <Txt size={14} weight="medium" color={selected ? t.ink : t.inkSoft}>
            {label}
          </Txt>
        </View>
      </Touchable>
    </Animated.View>
  );
}

function Pillet({
  label,
  selected,
  onPress,
  index,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
  index: number;
}) {
  const t = useTheme();
  return (
    <Animated.View entering={FadeIn.delay(index * 40).duration(280)}>
      <Touchable onPress={onPress} activeScale={0.95}>
        <View
          style={{
            minWidth: 84,
            alignItems: 'center',
            paddingHorizontal: space.cardPadWide,
            paddingVertical: 14,
            borderRadius: radius.pill,
            borderWidth: 1.5,
            borderColor: selected ? accent.purple : t.line,
            backgroundColor: selected ? t.surface2 : t.card,
          }}
        >
          <Txt size={16} weight="semibold" color={selected ? t.ink : t.inkSoft}>
            {label}
          </Txt>
        </View>
      </Touchable>
    </Animated.View>
  );
}

function SummaryCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 268,
        padding: space.cardPadWide,
        borderRadius: 20,
        backgroundColor: t.card,
        borderWidth: 1,
        borderColor: t.line,
      }}
    >
      <Txt size={13} color={t.muted2}>
        {title}
      </Txt>
      <Txt size={20} weight="semibold" tracking={-0.02} style={{ marginTop: 6 }}>
        {value}
      </Txt>
      <Txt size={13} color={t.muted2} style={{ marginTop: 6 }} lineHeight={1.4} numberOfLines={2}>
        {detail || '—'}
      </Txt>
    </View>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A ring that draws itself, then a tick that strokes on — the finish flourish. */
function SuccessMark() {
  const ring = useSharedValue(1);
  const tick = useSharedValue(1);

  useEffect(() => {
    ring.value = withTiming(0, { duration: 900, easing: CURVE.settle });
    tick.value = withDelay(520, withTiming(0, { duration: 520, easing: CURVE.settle }));
  }, [ring, tick]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: 300 * ring.value }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: 60 * tick.value }));

  return (
    <Svg width={104} height={104} viewBox="0 0 104 104">
      <AnimatedCircle
        cx={52}
        cy={52}
        r={46}
        fill="none"
        stroke={accent.purple}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={300}
        animatedProps={ringProps}
        transform="rotate(-90 52 52)"
      />
      <AnimatedPath
        d="M32 53.5 45.5 67 72 39"
        fill="none"
        stroke={accent.lime}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={60}
        animatedProps={tickProps}
      />
    </Svg>
  );
}
