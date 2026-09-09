// oxlint-disable-next-line eslint-plugin-import/no-unassigned-import
import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { useEffect } from 'react';
import * as DevClient from 'expo-dev-client';
import { HeroUINativeProvider } from 'heroui-native';
import { Uniwind } from 'uniwind';
import { type ErrorBoundaryProps, SplashScreen, Stack } from 'expo-router';

import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/lib/query';
import { registerServiceWorker } from '@/lib/registerServiceWorker';
import { BRAND_HEX } from '@/lib/theme';
import { InstallPrompt } from '@/components/InstallPrompt';

/**
 * Whole-app fallback for render errors. Rendered outside the theme providers, so
 * it styles itself from BRAND_HEX rather than semantic tokens.
 */
function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 32,
        backgroundColor: BRAND_HEX.cream,
      }}
    >
      <RNText style={{ fontSize: 20, fontWeight: '700', color: BRAND_HEX.bark }}>
        AyurSutra hit a problem
      </RNText>
      <RNText style={{ fontSize: 14, textAlign: 'center', color: BRAND_HEX.barkSoft }}>
        The screen could not be shown. Your records are safe, nothing was lost.
      </RNText>
      {__DEV__ ? (
        <RNText style={{ fontSize: 12, textAlign: 'center', color: BRAND_HEX.barkSoft }}>
          {error.message}
        </RNText>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={retry}
        style={{
          marginTop: 8,
          borderRadius: 12,
          backgroundColor: BRAND_HEX.saffron,
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <RNText style={{ fontSize: 15, fontWeight: '600', color: BRAND_HEX.cream }}>
          Try again
        </RNText>
      </Pressable>
    </View>
  );
}

export { ErrorBoundary };

// Locked to light: the palette is tuned for the cream/saffron light theme. The
// dark variant in global.css exists so tokens still resolve if that changes.
Uniwind.setTheme('light');

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Registers the Inter family names for native. On web the same faces come from
  // the @import at the top of global.css.
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (__DEV__ && Platform.OS !== 'web' && !isExpoGo) {
      const timer = setTimeout(() => {
        DevClient.closeMenu();
        DevClient.hideMenu();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(practitioner)" />
            <Stack.Screen name="(patient)" />
          </Stack>
          <InstallPrompt />
        </QueryClientProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
