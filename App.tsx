import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, useWindowDimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
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
import { useAppStore } from '@/state/store';
import { useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

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

function Dashboard() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { openSheet } = useSheet();
  useFocusTicker();

  const shellWidth = Math.max(320, width - insets.left - insets.right - 24);

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

  const noop = useCallback(() => {}, []);

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
          marginVertical: 12,
          borderRadius: 22,
          overflow: 'hidden',
          backgroundColor: t.bg,
        }}
      >
        <Header onSearch={onSearch} onNotifications={noop} onProfile={noop} hasNotifications />
        <View style={{ flex: 1 }}>
          <Pager width={shellWidth}>
            <Overview />
            <Board />
            <Calendar />
            <Habits />
            <Notes />
          </Pager>
        </View>
        <PageDots />
      </View>
    </View>
  );
}

function Root() {
  const t = useTheme();
  const hydrated = useAppStore((s) => s.hydrated);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: t.backdrop }} />;

  return (
    <SheetProvider>
      <Dashboard />
    </SheetProvider>
  );
}

export default function App() {
  const light = useAppStore((s) => s.light);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={light ? 'dark' : 'light'} />
        <Root />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
