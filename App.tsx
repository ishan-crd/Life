import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, useWindowDimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SheetHost } from 'insyd-bottom-sheet';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { LayoutProvider, ThemeProvider, useLayout, useTheme } from '@/theme';
// Subpath imports keep only the four weights we use in the bundle.
import PlusJakartaSans_400Regular from '@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf';
import PlusJakartaSans_500Medium from '@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf';
import PlusJakartaSans_600SemiBold from '@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf';
import PlusJakartaSans_700Bold from '@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf';
import { Header } from '@/components/Header';
import { PageDots } from '@/components/PageDots';
import { Pager } from '@/components/Pager';
import { SheetProvider, useSheet } from '@/components/Sheet';
import { Board } from '@/pages/Board';
import { Calendar } from '@/pages/Calendar';
import { Habits } from '@/pages/Habits';
import { Notes } from '@/pages/Notes';
import { Overview } from '@/pages/Overview';
import { AuthScreen } from '@/auth/AuthScreen';
import { Onboarding } from '@/auth/Onboarding';
import { useProfileStore } from '@/state/profile';
import { PAGE_TITLES, useAppStore } from '@/state/store';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** On web, `#board`, `#calendar`, … deep-link straight to a page. */
function useHashRoute() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const apply = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const index = PAGE_TITLES.findIndex((p) => p.toLowerCase() === hash);
      if (index >= 0) useAppStore.getState().setPage(index);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);
}

/** Drives the focus countdown from a single interval for the whole app. */
function useFocusTicker() {
  const running = useAppStore((s) => s.focusRunning);
  const tick = useAppStore((s) => s.tickTimer);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, tick]);
}

/**
 * The canvas every screen lives inside: a rounded, inset card on a tablet, and
 * edge-to-edge on a phone where 12px of backdrop is 12px wasted.
 */
function Shell({ children }: { children: (shellWidth: number) => React.ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { shellInset, shellRadius } = useLayout();
  const shellWidth = Math.max(280, width - insets.left - insets.right - shellInset * 2);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.backdrop,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flex: 1,
          width: shellWidth,
          marginVertical: shellInset,
          borderRadius: shellRadius,
          overflow: 'hidden',
          backgroundColor: t.bg,
        }}
      >
        {children(shellWidth)}
      </View>
    </View>
  );
}

function Dashboard() {
  const { openSheet } = useSheet();
  useFocusTicker();
  useHashRoute();

  const onSearch = useCallback(() => {
    openSheet({
      title: 'Search',
      subtitle: 'Jump to a page.',
      submitLabel: 'Go',
      fields: [
        {
          key: 'page',
          label: 'Page',
          kind: 'select',
          options: [
            { label: 'Overview', value: '0' },
            { label: 'Board', value: '1' },
            { label: 'Calendar', value: '2' },
            { label: 'Habits', value: '3' },
            { label: 'Notes', value: '4' },
          ],
        },
      ],
      onSubmit: (v) => useAppStore.getState().setPage(Number(v.page)),
    });
  }, [openSheet]);

  const openProfile = useCallback(() => {
    const profile = useProfileStore.getState().profile;
    openSheet({
      title: profile?.name ? `Hey, ${profile.name}` : 'Your account',
      subtitle: profile?.email ?? 'Signed in on this device',
      submitLabel: 'Save name',
      fields: [{ key: 'name', label: 'Display name', initial: profile?.name ?? '', required: true }],
      onSubmit: (v) => useProfileStore.getState().setName(v.name.trim()),
      onDelete: () => {
        // A device can hold more than one local account, so leave nothing behind.
        useAppStore.getState().resetAll();
        useProfileStore.getState().signOut();
      },
      deleteLabel: 'Sign out',
    });
  }, [openSheet]);

  const noop = useCallback(() => {}, []);

  return (
    <Shell>
      {(shellWidth) => (
        <>
          <Header onSearch={onSearch} onNotifications={noop} onProfile={openProfile} hasNotifications />
          <View style={{ flex: 1 }}>
            <Pager width={shellWidth} overlay={<PageDots />}>
              <Overview />
              <Board />
              <Calendar />
              <Habits />
              <Notes />
            </Pager>
          </View>
        </>
      )}
    </Shell>
  );
}

function Root() {
  const t = useTheme();
  const hydrated = useAppStore((s) => s.hydrated);
  const profileHydrated = useProfileStore((s) => s.hydrated);
  const profile = useProfileStore((s) => s.profile);
  const onboarded = useProfileStore((s) => s.onboarded);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const ready = fontsLoaded && hydrated && profileHydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: t.backdrop }} />;

  return (
    <SheetProvider>
      {!profile ? (
        <Shell>{() => <AuthScreen />}</Shell>
      ) : !onboarded ? (
        <Shell>{() => <Onboarding />}</Shell>
      ) : (
        <Dashboard />
      )}
    </SheetProvider>
  );
}

export default function App() {
  const light = useAppStore((s) => s.light);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LayoutProvider>
          <ThemeProvider>
            {/*
             * SheetHost is the in-app portal every SmoothSheet renders into. It
             * sits below ThemeProvider so sheet content resolves the palette, and
             * inside GestureHandlerRootView so drag-to-dismiss works.
             */}
            <SheetHost>
              <StatusBar style={light ? 'dark' : 'light'} />
              <Root />
            </SheetHost>
          </ThemeProvider>
        </LayoutProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
