import { useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { Button, Chip, Input, Label, Text, TextField } from 'heroui-native';
import { Leaf } from 'lucide-react-native';

import { Screen } from '@/components/ui/Screen';
import { Surface } from '@/components/ui/Surface';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/api/auth';
import { tapSelection } from '@/lib/haptics';
import { BRAND_HEX } from '@/lib/theme';
import { useSessionStore } from '@/lib/store/session';

export default function SignInScreen() {
  const signIn = useSessionStore((state) => state.signIn);
  const pending = useSessionStore((state) => state.pending);
  const error = useSessionStore((state) => state.error);
  const clearError = useSessionStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    void signIn(email, password);
  };

  const fillDemoAccount = (demoEmail: string) => {
    tapSelection();
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    clearError();
    void signIn(demoEmail, DEMO_PASSWORD);
  };

  return (
    <Screen scroll keyboardAware>
      <View className="pt-safe-offset-10 pb-8">
        <View className="bg-saffron-soft h-14 w-14 items-center justify-center rounded-2xl">
          <Leaf color={BRAND_HEX.saffron} size={28} />
        </View>
        <Text.Heading type="h1" className="mt-5">
          AyurSutra
        </Text.Heading>
        <Text.Paragraph color="muted" className="mt-2">
          One clinic, one record. Sign in to your practice or your own care plan.
        </Text.Paragraph>
      </View>

      <View className="gap-4">
        <TextField isInvalid={Boolean(error)}>
          <Label>Email</Label>
          <Input
            placeholder="you@clinic.in"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (error) clearError();
            }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
            textContentType="username"
          />
        </TextField>

        <TextField isInvalid={Boolean(error)}>
          <Label>Password</Label>
          <Input
            placeholder="Your password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (error) clearError();
            }}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
        </TextField>

        {error ? (
          <Text.Paragraph type="body-sm" className="text-danger" accessibilityLiveRegion="polite">
            {error}
          </Text.Paragraph>
        ) : null}

        <Button size="lg" isDisabled={pending} onPress={submit}>
          <Button.Label>{pending ? 'Signing in' : 'Sign in'}</Button.Label>
        </Button>

        <View className="flex-row items-center justify-center gap-1">
          <Text.Paragraph type="body-sm" color="muted">
            New patient?
          </Text.Paragraph>
          <Link href="/(auth)/sign-up" asChild>
            <Text.Paragraph type="body-sm" className="text-accent" weight="semibold">
              Create an account
            </Text.Paragraph>
          </Link>
        </View>
      </View>

      {/* Development shortcut only. Metro strips this branch from release bundles,
          so no seeded credentials ship to a store build. */}
      {__DEV__ ? (
        <View className="mt-10">
          <Text.Paragraph type="body-xs" color="muted" weight="semibold" className="mb-3 uppercase">
            Demo logins (development only)
          </Text.Paragraph>
          <View className="gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <Surface
                key={account.email}
                tone="muted"
                onPress={() => fillDemoAccount(account.email)}
                accessibilityLabel={`Sign in as ${account.name}, ${account.roleLabel}`}
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <Text.Paragraph weight="semibold">{account.name}</Text.Paragraph>
                    <Text.Paragraph type="body-xs" color="muted">
                      {account.roleLabel} · {account.description}
                    </Text.Paragraph>
                  </View>
                  <Chip size="sm" variant="soft">
                    <Chip.Label>Open</Chip.Label>
                  </Chip>
                </View>
              </Surface>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
