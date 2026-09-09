import { Redirect } from 'expo-router';
import { Spinner } from 'heroui-native';
import { View } from 'react-native';

import { homeHrefFor, useSessionStore } from '@/lib/store/session';

/** Entry gate: sends each signed-in role to its own stack. */
export default function Index() {
  const status = useSessionStore((state) => state.status);
  const session = useSessionStore((state) => state.session);

  if (status === 'loading') {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return <Redirect href={homeHrefFor(session)} />;
}
