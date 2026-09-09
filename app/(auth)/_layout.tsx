import { Redirect, Stack } from 'expo-router';

import { homeHrefFor, useSessionStore } from '@/lib/store/session';

export default function AuthLayout() {
  const status = useSessionStore((state) => state.status);
  const session = useSessionStore((state) => state.session);

  if (status === 'loading') return null;
  if (session) return <Redirect href={homeHrefFor(session)} />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
