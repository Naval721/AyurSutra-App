import { Redirect, Stack } from 'expo-router';
import { Spinner, useThemeColor } from 'heroui-native';
import { View } from 'react-native';

import { useSessionStore } from '@/lib/store/session';

/** Doctors, therapists and clinic admins. Patients are redirected out. */
export default function PractitionerLayout() {
  const status = useSessionStore((state) => state.status);
  const session = useSessionStore((state) => state.session);
  const [background, foreground] = useThemeColor(['background', 'foreground']);

  if (status === 'loading') {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (session.profile.role === 'patient') return <Redirect href="/(patient)/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: background },
        headerStyle: { backgroundColor: background },
        headerTintColor: foreground,
      }}
    />
  );
}
