import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Button, Text } from 'heroui-native';

import { DoshaBar, DoshaBadge } from '@/components/ui/Dosha';
import { LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Surface } from '@/components/ui/Surface';
import { fetchStaff } from '@/lib/api/auth';
import { queryKeys } from '@/lib/api/keys';
import { fetchPatient } from '@/lib/api/patients';
import { formatDateShort, initials } from '@/lib/format';
import { useSessionStore } from '@/lib/store/session';
import { reversed } from '@/lib/utils';

export default function PatientProfileScreen() {
  const session = useSessionStore((state) => state.session);
  const signOut = useSessionStore((state) => state.signOut);
  const patientId = session?.patient?.id ?? '';

  const patientQuery = useQuery({
    queryKey: queryKeys.patient(patientId),
    queryFn: () => fetchPatient(patientId),
    enabled: Boolean(patientId),
  });

  const staffQuery = useQuery({ queryKey: queryKeys.staff, queryFn: fetchStaff });

  if (!session?.patient) {
    return (
      <Screen title="Profile">
        <LoadingState label="Loading your profile" />
      </Screen>
    );
  }

  const patient = patientQuery.data?.patient ?? session.patient;
  const clinic = session.clinic;
  const doctor = (staffQuery.data ?? []).find((member) => member.id === patient.primary_doctor_id);
  const history = reversed(patient.prakriti_history);

  return (
    <Screen
      title="Profile"
      subtitle="Your details and constitution history"
      scroll
      contentClassName="gap-6"
    >
      <Surface className="flex-row items-center gap-4">
        <View className="bg-saffron-soft h-14 w-14 items-center justify-center rounded-full">
          <Text.Heading type="h5" className="text-bark">
            {initials(patient.full_name)}
          </Text.Heading>
        </View>
        <View className="flex-1 gap-0.5">
          <Text.Paragraph weight="semibold" className="text-foreground">
            {patient.full_name}
          </Text.Paragraph>
          <Text.Paragraph type="body-sm" color="muted">
            {patient.age} years · {patient.gender}
          </Text.Paragraph>
          <Text.Paragraph type="body-xs" color="muted">
            {patient.phone}
            {patient.email ? ` · ${patient.email}` : ''}
          </Text.Paragraph>
        </View>
      </Surface>

      <View>
        <SectionHeader title="Health summary" />
        <Surface className="gap-3">
          <View className="gap-1">
            <Text.Paragraph type="body-xs" color="muted">
              Chief complaint
            </Text.Paragraph>
            <Text.Paragraph type="body-sm" className="text-foreground">
              {patient.chief_complaint}
            </Text.Paragraph>
          </View>
          <View className="gap-1">
            <Text.Paragraph type="body-xs" color="muted">
              Allergies
            </Text.Paragraph>
            {patient.allergies.length === 0 ? (
              <Text.Paragraph type="body-sm" className="text-foreground">
                None recorded
              </Text.Paragraph>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {patient.allergies.map((allergy) => (
                  <View key={allergy} className="bg-surface-secondary rounded-full px-2.5 py-1">
                    <Text.Paragraph type="body-xs" className="text-foreground">
                      {allergy}
                    </Text.Paragraph>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View className="gap-1">
            <Text.Paragraph type="body-xs" color="muted">
              Primary doctor
            </Text.Paragraph>
            <Text.Paragraph type="body-sm" className="text-foreground">
              {doctor
                ? `${doctor.full_name}${doctor.specialisation ? ` · ${doctor.specialisation}` : ''}`
                : 'Assigned at your first consultation'}
            </Text.Paragraph>
          </View>
        </Surface>
      </View>

      <View>
        <SectionHeader
          title="Prakriti history"
          caption="Every assessment recorded for you"
          action={
            <Button size="sm" variant="tertiary" onPress={() => router.push('/(patient)/prakriti')}>
              <Button.Label>Retake</Button.Label>
            </Button>
          }
        />
        {history.length === 0 ? (
          <Surface className="gap-3">
            <Text.Paragraph type="body-sm" color="muted">
              You have not taken the Prakriti assessment yet.
            </Text.Paragraph>
            <Button size="sm" onPress={() => router.push('/(patient)/prakriti')}>
              <Button.Label>Start assessment</Button.Label>
            </Button>
          </Surface>
        ) : (
          <View className="gap-3">
            {history.map((entry) => (
              <Surface key={entry.id} className="gap-3">
                <View className="flex-row items-center justify-between gap-3">
                  <Text.Paragraph type="body-sm" weight="semibold" className="text-foreground">
                    {formatDateShort(entry.assessed_on)}
                  </Text.Paragraph>
                  <DoshaBadge dosha={entry.dominant} label={entry.constitution} />
                </View>
                <DoshaBar scores={entry.scores} />
                <Text.Paragraph type="body-xs" color="muted">
                  Assessed by {entry.assessed_by === 'self' ? 'you' : 'your doctor'}
                </Text.Paragraph>
              </Surface>
            ))}
          </View>
        )}
      </View>

      <View>
        <SectionHeader title="Your clinic" caption={clinic.name} />
        <Surface className="gap-2">
          <Text.Paragraph type="body-sm" className="text-foreground">
            {clinic.address}
          </Text.Paragraph>
          <Text.Paragraph type="body-xs" color="muted">
            {clinic.phone}
          </Text.Paragraph>
          <Text.Paragraph type="body-xs" color="muted">
            Open {clinic.opening_hour}:00 to {clinic.closing_hour}:00
          </Text.Paragraph>
        </Surface>
      </View>

      <Button variant="secondary" onPress={signOut}>
        <Button.Label>Sign out</Button.Label>
      </Button>

      <Text.Paragraph type="body-xs" color="muted" className="text-center">
        AyurSutra patient app · your records are shared only with your clinic.
      </Text.Paragraph>
    </Screen>
  );
}
