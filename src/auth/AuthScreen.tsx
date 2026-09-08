import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
  type ReturnKeyTypeOptions,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { ConicDisc } from '@/components/ConicDisc';
import { Touchable } from '@/components/Touchable';
import { FONT, Txt } from '@/components/ui';
import { useProfileStore } from '@/state/profile';
import { AppleButton } from './AppleButton';
import { Aurora } from './Aurora';
import {
  accent,
  BRAND_STOPS,
  radius,
  scaleType,
  size as metric,
  space,
  tracking,
  useLayout,
  useTheme,
  type as typeScale,
} from '@/theme';

const HIGHLIGHTS = [
  { title: 'One canvas for the whole week', body: 'Plan, board, calendar, health and notes — a swipe apart.' },
  { title: 'Rituals that actually stick', body: 'Streaks, focus blocks and habit dots you can log in a tap.' },
  { title: 'Yours, on this device', body: 'Everything is stored locally. No dashboards but your own.' },
];

/** The hero's height on a phone, where it shares one scroll with the form. */
const HERO_MIN_HEIGHT = 320;

function emailLooksValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function hashId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return `local_${h.toString(36)}`;
}

/** Small check mark used by the highlight list. */
function Tick({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill="none" stroke={color} strokeWidth={1.4} opacity={0.5} />
      <Path
        d="M7 12.4 10.5 16 17 8.8"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AuthScreen() {
  const t = useTheme();
  const { width, height } = useWindowDimensions();
  const signIn = useProfileStore((s) => s.signIn);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    let alive = true;
    AppleAuthentication.isAvailableAsync()
      .then((ok) => alive && setAppleAvailable(ok))
      .catch(() => alive && setAppleAvailable(false));
    return () => {
      alive = false;
    };
  }, []);

  const handleApple = useCallback(async () => {
    setError(null);
    if (!appleAvailable) {
      setError(
        Platform.OS === 'ios'
          ? 'Sign in with Apple is unavailable on this device. Use email instead.'
          : 'Sign in with Apple needs an iOS build. Use email instead.'
      );
      return;
    }
    try {
      setBusy(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const full = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ');
      signIn({
        name: full || 'there',
        email: credential.email ?? null,
        provider: 'apple',
        accountId: credential.user,
      });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== 'ERR_REQUEST_CANCELED') setError('Apple sign-in did not complete. Try again.');
    } finally {
      setBusy(false);
    }
  }, [appleAvailable, signIn]);

  const handleEmail = useCallback(() => {
    setError(null);
    if (mode === 'signup' && name.trim().length < 2) {
      setError('Tell us what to call you.');
      return;
    }
    if (!emailLooksValid(email)) {
      setError('That email does not look right.');
      return;
    }
    if (password.length < 6) {
      setError('Passwords need at least 6 characters.');
      return;
    }
    const derived = email.trim().split('@')[0].replace(/[._-]+/g, ' ');
    signIn({
      name: mode === 'signup' ? name.trim() : derived.charAt(0).toUpperCase() + derived.slice(1),
      email: email.trim(),
      provider: 'email',
      accountId: hashId(email.trim().toLowerCase()),
    });
  }, [mode, name, email, password, signIn]);

  const compact = width < 900;

  const hero = (
    <View
      style={{
        flex: compact ? undefined : 1,
        minHeight: compact ? HERO_MIN_HEIGHT : undefined,
        overflow: 'hidden',
        justifyContent: 'center',
        padding: compact ? 28 : 48,
      }}
    >
      <Aurora width={width * (compact ? 1 : 0.6)} height={compact ? HERO_MIN_HEIGHT : height} />
      <Animated.View entering={FadeInUp.duration(600)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 42, height: 42, borderRadius: 21, overflow: 'hidden' }}>
            <ConicDisc size={42} from={200} stops={BRAND_STOPS} />
          </View>
          <Txt size={26} weight="semibold" tracking={-0.02}>
            Life
          </Txt>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(120).duration(600)} style={{ marginTop: 34 }}>
        <Txt
          size={compact ? 38 : 50}
          weight="medium"
          tracking={tracking.display}
          lineHeight={1.08}
        >
          Your whole life,
        </Txt>
        <Txt
          size={compact ? 38 : 50}
          weight="medium"
          tracking={tracking.display}
          lineHeight={1.08}
          color={t.inkDim}
        >
          one swipe wide.
        </Txt>
      </Animated.View>

      <View style={{ marginTop: 36, gap: space.gap, maxWidth: 460 }}>
        {HIGHLIGHTS.map((h, i) => (
          <Animated.View
            key={h.title}
            entering={FadeInUp.delay(240 + i * 110).duration(560)}
            style={{ flexDirection: 'row', gap: 14 }}
          >
            <View style={{ paddingTop: 2 }}>
              <Tick color={[accent.violetSoft, accent.cyan, accent.lime][i]} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={16} weight="semibold" tracking={-0.01}>
                {h.title}
              </Txt>
              <Txt size={14} color={t.muted} lineHeight={1.4} style={{ marginTop: 3 }}>
                {h.body}
              </Txt>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const form = (
    <>
      <Txt size={30} weight="semibold" tracking={tracking.title}>
        {mode === 'signin' ? 'Welcome back' : 'Make it yours'}
      </Txt>
      <Txt size={typeScale.body} color={t.muted} style={{ marginTop: 8 }} lineHeight={1.45}>
        {mode === 'signin'
          ? 'Sign in to pick up exactly where you left off.'
          : 'Two minutes of setup and the dashboard is tuned to you.'}
      </Txt>

      <View style={{ marginTop: 26 }}>
        <AppleButton
          label={mode === 'signin' ? 'Sign in with Apple' : 'Sign up with Apple'}
          onPress={handleApple}
          disabled={busy}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 22 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
        <Txt size={12} color={t.muted3}>
          or continue with email
        </Txt>
        <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
      </View>

      {mode === 'signup' ? (
        <Field
          label="Name"
          value={name}
          onChange={setName}
          placeholder="Arnav"
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      ) : null}
      <Field
        ref={emailRef}
        label="Email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Field
        ref={passwordRef}
        label="Password"
        value={password}
        onChange={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
        autoCapitalize="none"
        textContentType={mode === 'signup' ? 'newPassword' : 'password'}
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        returnKeyType="go"
        onSubmitEditing={handleEmail}
      />

      {error ? (
        <Animated.View entering={FadeIn.duration(200)} style={{ marginTop: 12 }}>
          <Txt size={13} color={accent.rose}>
            {error}
          </Txt>
        </Animated.View>
      ) : null}

      <Touchable
        onPress={handleEmail}
        activeScale={0.97}
        haptic="light"
        style={{
          height: metric.formButton,
          marginTop: 20,
          borderRadius: radius.pill,
          backgroundColor: t.invBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt size={16} weight="semibold" color={t.invInk}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </Txt>
      </Touchable>

      <Touchable
        onPress={() => {
          setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
          setError(null);
        }}
        activeScale={0.98}
        haptic={false}
        style={{ marginTop: 18, alignItems: 'center' }}
      >
        <Txt size={14} color={t.muted}>
          {mode === 'signin' ? 'New here? ' : 'Already have an account? '}
          <Txt size={14} weight="semibold" color={t.ink}>
            {mode === 'signin' ? 'Create an account' : 'Sign in'}
          </Txt>
        </Txt>
      </Touchable>

      <Txt size={11} color={t.muted3} style={{ marginTop: 22, textAlign: 'center' }} lineHeight={1.5}>
        Accounts are stored on this device only. Nothing leaves your iPad.
      </Txt>
    </>
  );

  /**
   * On a phone the hero and the form share one scroll, so a landscape phone
   * — where the form alone is taller than the screen — still reaches the
   * bottom of it.
   */
  if (compact) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {hero}
        <Animated.View
          entering={FadeInDown.duration(560)}
          style={{ padding: 28, borderTopWidth: 1, borderColor: t.line, backgroundColor: t.card }}
        >
          {form}
        </Animated.View>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {hero}
      <Animated.View
        entering={FadeInDown.duration(560)}
        style={{ width: 476, borderLeftWidth: 1, borderColor: t.line, backgroundColor: t.card }}
      >
        {/*
          * The form is its own scroll so the keyboard only moves the panel it
          * belongs to: iOS insets the scroll by the keyboard's overlap and
          * brings the focused field above it, and the hero stays put.
          */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 44 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {form}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange(v: string): void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
  textContentType?: React.ComponentProps<typeof TextInput>['textContentType'];
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  /** What the keyboard's action key says, and what it does. */
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?(): void;
}

/** A labelled input; the ref lets the previous field's Return key focus it. */
const Field = forwardRef<TextInput, FieldProps>(function Field(
  {
    label,
    value,
    onChange,
    placeholder,
    secureTextEntry,
    keyboardType = 'default',
    autoCapitalize = 'none',
    textContentType,
    autoComplete,
    returnKeyType,
    onSubmitEditing,
  },
  ref
) {
  const t = useTheme();
  const { fontScale } = useLayout();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Txt size={typeScale.meta} color={t.muted2} style={{ marginBottom: 7 }}>
        {label}
      </Txt>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.muted3}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        textContentType={textContentType}
        autoComplete={autoComplete}
        returnKeyType={returnKeyType}
        // Return moves on to the next field, so the keyboard stays up.
        blurOnSubmit={returnKeyType !== 'next'}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: metric.input,
          borderRadius: radius.cell,
          paddingHorizontal: 16,
          fontFamily: FONT.medium,
          fontSize: scaleType(15, fontScale),
          color: t.ink,
          backgroundColor: t.surface2,
          borderWidth: 1,
          borderColor: focused ? accent.purple : t.pillLineSoft,
        }}
      />
    </View>
  );
});
