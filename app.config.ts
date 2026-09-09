import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

/** Cream background from global.css (--background), so the shell matches the app. */
const BACKGROUND = '#faf3e7';

export default ({ config }: ConfigContext): ExpoConfig => {
  const nativePlugins: ExpoPlugins =
    process.env.EXPO_PLATFORM === 'native'
      ? [['expo-dev-client', { launchMode: 'most-recent' }]]
      : [];

  return {
    ...config,
    name: 'AyurSutra',
    slug: 'ayursutra',
    version: process.env.AYURSUTRA_APP_VERSION ?? '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'ayursutra',
    backgroundColor: BACKGROUND,
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      supportsTablet: true,
      bundleIdentifier: process.env.AYURSUTRA_IOS_BUNDLE_ID ?? 'in.ayursutra.app',
    },
    android: {
      package: process.env.AYURSUTRA_ANDROID_PACKAGE ?? 'in.ayursutra.app',
      adaptiveIcon: {
        foregroundImage: './public/icons/icon-512-maskable.png',
        backgroundColor: BACKGROUND,
      },
    },
    web: {
      bundler: 'metro',
      // 'single' = SPA export: one index.html + client routing, so edge serving
      // needs only a single 404→index.html fallback rule.
      output: 'single',
      favicon: './public/icons/icon-192.png',
    },
    extra: {
      appStoreAppId: process.env.AYURSUTRA_APP_STORE_APP_ID,
    },
    plugins: ['expo-router', 'expo-font', ...nativePlugins],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
