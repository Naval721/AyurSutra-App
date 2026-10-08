import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Link } from 'expo-router';
import { Button, Chip, Input, Label, PressableFeedback, Text, TextField } from 'heroui-native';
import {
  Building2,
  ChevronRight,
  Eye,
  EyeOff,
  HeartHandshake,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react-native';

import { Screen } from '@/components/ui/Screen';
import { Surface } from '@/components/ui/Surface';
import { Logo } from '@/components/ui/Logo';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/api/auth';
import { tapSelection } from '@/lib/haptics';
import { BRAND_HEX } from '@/lib/theme';
import { useSessionStore } from '@/lib/store/session';
import { cn } from '@/lib/utils';

export default function SignInScreen() {
  const signIn = useSessionStore((state) => state.signIn);
  const pending = useSessionStore((state) => state.pending);
  const error = useSessionStore((state) => state.error);
  const clearError = useSessionStore((state) => state.clearError);

  const [portalType, setPortalType] = useState<'patient' | 'practitioner'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const accountsForPortal = DEMO_ACCOUNTS.filter((acc) =>
    portalType === 'patient' ? acc.role === 'patient' : acc.role !== 'patient',
  );

  return (
    <Screen scroll keyboardAware contentClassName="gap-6 pb-12">
      {/* Clinic Masthead & Heritage Emblem */}
      <View className="pt-safe-offset-4 items-center text-center">
        <View className="relative items-center justify-center">
          <View className="h-24 w-24 items-center justify-center rounded-3xl border border-emerald-100/60 bg-emerald-50/30 shadow-md">
            <Logo size={56} />
          </View>
          <View className="absolute -bottom-2 rounded-full border border-emerald-200 bg-white px-3 py-0.5 shadow-sm">
            <Text.Paragraph
              type="body-xs"
              weight="bold"
              className="tracking-widest text-emerald-800 uppercase"
            >
              आयुःसूत्र
            </Text.Paragraph>
          </View>
        </View>

        <Text.Heading type="h2" className="text-foreground mt-4 font-semibold tracking-tight">
          AyurSutra
        </Text.Heading>

        <Text.Paragraph
          type="body-xs"
          weight="semibold"
          className="mt-1 tracking-wider text-amber-800 uppercase"
        >
          Shanti Ayurvedic Bhavan · Bengaluru
        </Text.Paragraph>

        <Text.Paragraph
          type="body-sm"
          color="muted"
          className="mt-1.5 max-w-xs text-center leading-relaxed"
        >
          Integrated Ayurvedic EMR, Dinacharya & Panchakarma Clinical Management
        </Text.Paragraph>
      </View>

      {/* Segmented Portal Switcher */}
      <View className="bg-surface-secondary border-border flex-row rounded-2xl border p-1.5">
        <PressableFeedback
          accessibilityRole="tab"
          accessibilityLabel="Patient Portal"
          accessibilityState={{ selected: portalType === 'patient' }}
          onPress={() => {
            tapSelection();
            setPortalType('patient');
            clearError();
          }}
          className={cn(
            'flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5',
            portalType === 'patient'
              ? 'bg-surface border-border/80 border shadow-xs'
              : 'opacity-70',
          )}
        >
          <HeartHandshake
            color={portalType === 'patient' ? BRAND_HEX.saffron : BRAND_HEX.barkSoft}
            size={18}
          />
          <Text.Paragraph
            type="body-sm"
            weight={portalType === 'patient' ? 'semibold' : 'medium'}
            className={portalType === 'patient' ? 'text-foreground' : 'text-muted'}
          >
            Patient Portal
          </Text.Paragraph>
        </PressableFeedback>

        <PressableFeedback
          accessibilityRole="tab"
          accessibilityLabel="Practitioner Suite"
          accessibilityState={{ selected: portalType === 'practitioner' }}
          onPress={() => {
            tapSelection();
            setPortalType('practitioner');
            clearError();
          }}
          className={cn(
            'flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5',
            portalType === 'practitioner'
              ? 'bg-surface border-border/80 border shadow-xs'
              : 'opacity-70',
          )}
        >
          <Stethoscope
            color={portalType === 'practitioner' ? BRAND_HEX.saffron : BRAND_HEX.barkSoft}
            size={18}
          />
          <Text.Paragraph
            type="body-sm"
            weight={portalType === 'practitioner' ? 'semibold' : 'medium'}
            className={portalType === 'practitioner' ? 'text-foreground' : 'text-muted'}
          >
            Practitioner Suite
          </Text.Paragraph>
        </PressableFeedback>
      </View>

      {/* Main Sign-In Card */}
      <Surface className="gap-4 p-5 shadow-xs">
        <View className="border-border/60 gap-1 border-b pb-3">
          <Text.Paragraph weight="semibold" className="text-foreground text-base">
            {portalType === 'patient' ? 'Patient Sign In' : 'Vaidya & Clinical Staff Login'}
          </Text.Paragraph>
          <Text.Paragraph type="body-xs" color="muted">
            {portalType === 'patient'
              ? 'Access your Dinacharya routine, Prakriti balance and prescription history.'
              : 'Secure access for treating Doctors, Panchakarma Therapists and Clinic Desk.'}
          </Text.Paragraph>
        </View>

        <TextField isInvalid={Boolean(error)}>
          <Label>
            <View className="mb-1 flex-row items-center gap-1.5">
              <Mail size={14} color={BRAND_HEX.barkSoft} />
              <Text.Paragraph type="body-xs" weight="medium" color="muted">
                {portalType === 'patient' ? 'Registered Email' : 'Clinic Email ID'}
              </Text.Paragraph>
            </View>
          </Label>
          <Input
            placeholder={
              portalType === 'patient' ? 'ananya.rao@example.com' : 'doctor@ayursutra.in'
            }
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
          <Label>
            <View className="mb-1 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Lock size={14} color={BRAND_HEX.barkSoft} />
                <Text.Paragraph type="body-xs" weight="medium" color="muted">
                  Password
                </Text.Paragraph>
              </View>
            </View>
          </Label>
          <View className="relative justify-center">
            <Input
              placeholder="Enter your security password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (error) clearError();
              }}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            <PressableFeedback
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => {
                tapSelection();
                setShowPassword((prev) => !prev);
              }}
              className="absolute right-3 h-8 w-8 items-center justify-center rounded-full"
            >
              {showPassword ? (
                <EyeOff size={18} color={BRAND_HEX.barkSoft} />
              ) : (
                <Eye size={18} color={BRAND_HEX.barkSoft} />
              )}
            </PressableFeedback>
          </View>
        </TextField>

        {error ? (
          <View className="bg-danger/10 border-danger/30 rounded-xl border p-3">
            <Text.Paragraph
              type="body-sm"
              className="text-danger font-medium"
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text.Paragraph>
          </View>
        ) : null}

        <Button size="lg" isDisabled={pending} onPress={submit} className="mt-1 shadow-sm">
          <Button.Label>
            {pending
              ? 'Authenticating...'
              : portalType === 'patient'
                ? 'Sign In to Health Portal'
                : 'Sign In to Practitioner Suite'}
          </Button.Label>
        </Button>

        {portalType === 'patient' ? (
          <View className="flex-row items-center justify-center gap-1.5 pt-1">
            <Text.Paragraph type="body-sm" color="muted">
              First time visiting Shanti Bhavan?
            </Text.Paragraph>
            <Link href="/(auth)/sign-up" asChild>
              <Text.Paragraph type="body-sm" className="text-accent underline" weight="semibold">
                Register as Patient
              </Text.Paragraph>
            </Link>
          </View>
        ) : null}
      </Surface>

      {/* Verified Clinic Demonstrations / 1-Tap Fast Switch */}
      {__DEV__ || Platform.OS === 'web' ? (
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between px-1">
            <Text.Paragraph
              type="body-xs"
              color="muted"
              weight="semibold"
              className="tracking-wider uppercase"
            >
              {portalType === 'patient'
                ? 'Quick Access · Verified Patient'
                : 'Quick Access · Verified Clinical Staff'}
            </Text.Paragraph>
            <View className="flex-row items-center gap-1">
              <ShieldCheck size={14} color="#3f9c92" />
              <Text.Paragraph type="body-xs" className="font-medium text-teal-700">
                Demo Accounts
              </Text.Paragraph>
            </View>
          </View>

          <View className="gap-2">
            {accountsForPortal.map((account) => (
              <Surface
                key={account.email}
                onPress={() => fillDemoAccount(account.email)}
                accessibilityLabel={`Sign in as ${account.name}, ${account.roleLabel}`}
                className="bg-surface hover:bg-surface-secondary border-border/80 flex-row items-center gap-3.5 p-3.5"
              >
                <View
                  className={cn(
                    'h-11 w-11 items-center justify-center rounded-full font-bold',
                    account.role === 'doctor'
                      ? 'border border-amber-300 bg-amber-100 text-amber-900'
                      : account.role === 'therapist'
                        ? 'border border-emerald-300 bg-emerald-100 text-emerald-900'
                        : 'border border-blue-300 bg-blue-100 text-blue-900',
                  )}
                >
                  <Text.Paragraph weight="bold" type="body-sm" className="text-bark">
                    {account.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </Text.Paragraph>
                </View>

                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text.Paragraph weight="semibold" className="text-foreground">
                      {account.name}
                    </Text.Paragraph>
                    <Chip
                      size="sm"
                      variant={
                        account.role === 'doctor'
                          ? 'primary'
                          : account.role === 'therapist'
                            ? 'secondary'
                            : 'soft'
                      }
                    >
                      <Chip.Label>{account.roleLabel}</Chip.Label>
                    </Chip>
                  </View>
                  <Text.Paragraph type="body-xs" color="muted">
                    {account.description}
                  </Text.Paragraph>
                </View>

                <ChevronRight color={BRAND_HEX.barkSoft} size={18} />
              </Surface>
            ))}
          </View>
        </View>
      ) : null}

      {/* Institutional Compliance & Clinical Standards Footer */}
      <View className="border-border/50 gap-3 border-t pt-4">
        <View className="flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <View className="flex-row items-center gap-1.5">
            <Building2 size={13} color={BRAND_HEX.barkSoft} />
            <Text.Paragraph type="body-xs" color="muted">
              AYUSH Standard Guidelines
            </Text.Paragraph>
          </View>
          <View className="flex-row items-center gap-1.5">
            <ShieldCheck size={13} color={BRAND_HEX.barkSoft} />
            <Text.Paragraph type="body-xs" color="muted">
              NABH Accredited Procedures
            </Text.Paragraph>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Lock size={13} color={BRAND_HEX.barkSoft} />
            <Text.Paragraph type="body-xs" color="muted">
              256-Bit Encrypted EMR
            </Text.Paragraph>
          </View>
        </View>

        <Text.Paragraph
          type="body-xs"
          color="muted"
          className="text-center text-[11px] leading-relaxed"
        >
          AyurSutra Clinical Suite v1.0 · Dedicated to authentic holistic wellness · Shanti
          Ayurvedic Bhavan, Bengaluru
        </Text.Paragraph>
      </View>
    </Screen>
  );
}
