import { useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import {
  Button,
  Chip,
  Input,
  Label,
  PressableFeedback,
  Text,
  TextArea,
  TextField,
} from 'heroui-native';
import {
  Eye,
  EyeOff,
  HeartHandshake,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react-native';

import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Surface } from '@/components/ui/Surface';
import { tapSelection } from '@/lib/haptics';
import { BRAND_HEX } from '@/lib/theme';
import type { Patient } from '@/lib/types';
import { useSessionStore } from '@/lib/store/session';

const GENDERS: { value: Patient['gender']; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

export default function SignUpScreen() {
  const signUp = useSessionStore((state) => state.signUp);
  const pending = useSessionStore((state) => state.pending);
  const error = useSessionStore((state) => state.error);
  const clearError = useSessionStore((state) => state.clearError);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Patient['gender']>('female');
  const [complaint, setComplaint] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    setLocalError(null);
    clearError();

    const parsedAge = Number(age);
    if (fullName.trim().length < 2) {
      setLocalError('Please enter your full legal name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (phone.trim().length < 8) {
      setLocalError('Please enter a phone number the clinic can reach you on.');
      return;
    }
    if (password.trim().length < 6) {
      setLocalError('Choose a security password with at least 6 characters.');
      return;
    }
    if (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setLocalError('Please enter your age in years.');
      return;
    }

    void signUp({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      age: Math.round(parsedAge),
      gender,
      chief_complaint: complaint.trim() || 'General Ayurvedic wellness and Prakriti balance.',
    });
  };

  const message = localError ?? error;

  return (
    <Screen
      back
      backFallback="/(auth)/sign-in"
      title="Patient Registration"
      subtitle="Create your health record with Shanti Ayurvedic Bhavan"
      scroll
      keyboardAware
      contentClassName="gap-6 pb-12"
    >
      {/* Intro Notice Banner */}
      <Surface tone="accent" className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-2xs">
          <HeartHandshake color={BRAND_HEX.saffron} size={22} />
        </View>
        <View className="flex-1">
          <Text.Paragraph weight="semibold" className="text-bark">
            Holistic Care Network
          </Text.Paragraph>
          <Text.Paragraph type="body-xs" className="text-barkSoft">
            Your profile links your clinical consultations, Prakriti score, Dinacharya and herbal
            prescriptions.
          </Text.Paragraph>
        </View>
      </Surface>

      {/* Section 1: Patient Identity & Demographics */}
      <View>
        <SectionHeader
          title="Personal Information"
          caption="Legal name and contact details for medical records"
        />
        <Surface className="gap-4 p-4.5">
          <TextField>
            <Label>
              <View className="mb-1 flex-row items-center gap-1.5">
                <User size={14} color={BRAND_HEX.barkSoft} />
                <Text.Paragraph type="body-xs" weight="medium" color="muted">
                  Full Name
                </Text.Paragraph>
              </View>
            </Label>
            <Input placeholder="e.g. Ananya Rao" value={fullName} onChangeText={setFullName} />
          </TextField>

          <View className="flex-row gap-3">
            <TextField className="flex-1">
              <Label>
                <Text.Paragraph type="body-xs" weight="medium" color="muted" className="mb-1">
                  Age (years)
                </Text.Paragraph>
              </Label>
              <Input placeholder="32" value={age} onChangeText={setAge} keyboardType="number-pad" />
            </TextField>

            <View className="flex-1 justify-end">
              <Label>
                <Text.Paragraph type="body-xs" weight="medium" color="muted" className="mb-2">
                  Gender
                </Text.Paragraph>
              </Label>
              <View className="flex-row gap-1.5">
                {GENDERS.map((option) => (
                  <Chip
                    key={option.value}
                    size="sm"
                    variant={gender === option.value ? 'primary' : 'secondary'}
                    onPress={() => {
                      tapSelection();
                      setGender(option.value);
                    }}
                  >
                    <Chip.Label>{option.label}</Chip.Label>
                  </Chip>
                ))}
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TextField className="flex-1">
              <Label>
                <View className="mb-1 flex-row items-center gap-1.5">
                  <Phone size={14} color={BRAND_HEX.barkSoft} />
                  <Text.Paragraph type="body-xs" weight="medium" color="muted">
                    Phone Number
                  </Text.Paragraph>
                </View>
              </Label>
              <Input
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </TextField>
          </View>
        </Surface>
      </View>

      {/* Section 2: Account Credentials */}
      <View>
        <SectionHeader title="Portal Security" caption="Used to sign in to your health records" />
        <Surface className="gap-4 p-4.5">
          <TextField>
            <Label>
              <View className="mb-1 flex-row items-center gap-1.5">
                <Mail size={14} color={BRAND_HEX.barkSoft} />
                <Text.Paragraph type="body-xs" weight="medium" color="muted">
                  Email Address
                </Text.Paragraph>
              </View>
            </Label>
            <Input
              placeholder="ananya.rao@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </TextField>

          <TextField>
            <Label>
              <View className="mb-1 flex-row items-center gap-1.5">
                <Lock size={14} color={BRAND_HEX.barkSoft} />
                <Text.Paragraph type="body-xs" weight="medium" color="muted">
                  Password (6+ characters)
                </Text.Paragraph>
              </View>
            </Label>
            <View className="relative justify-center">
              <Input
                placeholder="Choose a strong security password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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
        </Surface>
      </View>

      {/* Section 3: Clinical Concern / Intake */}
      <View>
        <SectionHeader
          title="Clinical Intake"
          caption="Initial health goals or symptoms for the Vaidya"
        />
        <Surface className="gap-3 p-4.5">
          <TextField>
            <Label>
              <Text.Paragraph type="body-xs" weight="medium" color="muted" className="mb-1">
                What brings you to the clinic?
              </Text.Paragraph>
            </Label>
            <TextArea
              placeholder="e.g. Sluggish digestion, sleep disturbance, joint stiffness for three months..."
              value={complaint}
              onChangeText={setComplaint}
            />
          </TextField>
          <Text.Paragraph type="body-xs" color="muted">
            Your treating Ayurvedic doctor reviews this prior to your consultation and pulse
            examination (Nadi Pariksha).
          </Text.Paragraph>
        </Surface>
      </View>

      {/* Error notification */}
      {message ? (
        <View className="bg-danger/10 border-danger/30 rounded-xl border p-3.5">
          <Text.Paragraph type="body-sm" className="text-danger font-medium">
            {message}
          </Text.Paragraph>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View className="gap-3">
        <Button size="lg" isDisabled={pending} onPress={submit} className="shadow-sm">
          <Button.Label>{pending ? 'Registering...' : 'Register Patient Record'}</Button.Label>
        </Button>

        <View className="flex-row items-center justify-center gap-1.5">
          <Text.Paragraph type="body-sm" color="muted">
            Already registered with us?
          </Text.Paragraph>
          <Link href="/(auth)/sign-in" asChild>
            <Text.Paragraph type="body-sm" className="text-accent underline" weight="semibold">
              Sign In
            </Text.Paragraph>
          </Link>
        </View>
      </View>

      {/* Security Reassurance */}
      <View className="flex-row items-center justify-center gap-2 pt-2">
        <ShieldCheck size={16} color="#3f9c92" />
        <Text.Paragraph type="body-xs" color="muted" className="text-center">
          Encrypted Health Records · Protected under Medical Confidentiality & DPDP
        </Text.Paragraph>
      </View>
    </Screen>
  );
}
