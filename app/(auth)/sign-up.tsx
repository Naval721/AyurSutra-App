import { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Input, Label, Text, TextArea, TextField } from 'heroui-native';

import { Screen } from '@/components/ui/Screen';
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
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Patient['gender']>('female');
  const [complaint, setComplaint] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    setLocalError(null);
    clearError();

    const parsedAge = Number(age);
    if (fullName.trim().length < 2) {
      setLocalError('Please enter your full name.');
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
      setLocalError('Choose a password with at least 6 characters.');
      return;
    }
    if (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setLocalError('Please enter your age in years.');
      return;
    }

    void signUp({
      full_name: fullName,
      email,
      phone,
      password,
      age: Math.round(parsedAge),
      gender,
      chief_complaint: complaint,
    });
  };

  const message = localError ?? error;

  return (
    <Screen
      back
      backFallback="/(auth)/sign-in"
      title="Create your patient account"
      subtitle="Your clinic uses this to link your visits, prescriptions and daily logs."
      scroll
      keyboardAware
    >
      <View className="gap-4">
        <TextField>
          <Label>Full name</Label>
          <Input placeholder="Ananya Rao" value={fullName} onChangeText={setFullName} />
        </TextField>

        <TextField>
          <Label>Email</Label>
          <Input
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </TextField>

        <TextField>
          <Label>Phone</Label>
          <Input
            placeholder="+91 98xxxxxxx"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </TextField>

        <TextField>
          <Label>Password</Label>
          <Input
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </TextField>

        <TextField>
          <Label>Age</Label>
          <Input placeholder="34" value={age} onChangeText={setAge} keyboardType="number-pad" />
        </TextField>

        <View>
          <Label className="mb-2">Gender</Label>
          <View className="flex-row gap-2">
            {GENDERS.map((option) => (
              <Chip
                key={option.value}
                size="md"
                variant={gender === option.value ? 'primary' : 'secondary'}
                onPress={() => setGender(option.value)}
              >
                <Chip.Label>{option.label}</Chip.Label>
              </Chip>
            ))}
          </View>
        </View>

        <TextField>
          <Label>What brings you to the clinic?</Label>
          <TextArea
            placeholder="Bloating and irregular digestion for six months"
            value={complaint}
            onChangeText={setComplaint}
          />
        </TextField>

        {message ? (
          <Text.Paragraph type="body-sm" className="text-danger">
            {message}
          </Text.Paragraph>
        ) : null}

        <Button size="lg" isDisabled={pending} onPress={submit}>
          {pending ? 'Creating account' : 'Create account'}
        </Button>

        <Text.Paragraph type="body-xs" color="muted" align="center">
          You will be asked to complete a short Prakriti assessment next.
        </Text.Paragraph>
      </View>
    </Screen>
  );
}
