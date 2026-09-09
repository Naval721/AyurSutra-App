import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Button, Text } from 'heroui-native';
import { ChevronRight } from 'lucide-react-native';

import { AppointmentCard } from '@/components/ui/AppointmentCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Surface } from '@/components/ui/Surface';
import { fetchPatientAppointments } from '@/lib/api/appointments';
import { queryKeys } from '@/lib/api/keys';
import { fetchPrescriptionsByPatient } from '@/lib/api/prescriptions';
import { fetchTreatmentsByPatient } from '@/lib/api/treatments';
import { formatDateShort } from '@/lib/format';
import { useSessionStore } from '@/lib/store/session';
import { BRAND_HEX } from '@/lib/theme';

export default function PatientRecordsScreen() {
  const session = useSessionStore((state) => state.session);
  return <RecordsBody patientId={session?.patient?.id ?? ''} />;
}

function RecordsBody({ patientId }: { patientId: string }) {
  const prescriptionsQuery = useQuery({
    queryKey: queryKeys.prescriptionsByPatient(patientId),
    queryFn: () => fetchPrescriptionsByPatient(patientId),
    enabled: Boolean(patientId),
  });

  const treatmentsQuery = useQuery({
    queryKey: queryKeys.treatmentsByPatient(patientId),
    queryFn: () => fetchTreatmentsByPatient(patientId),
    enabled: Boolean(patientId),
  });

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.patientAppointments(patientId),
    queryFn: () => fetchPatientAppointments(patientId),
    enabled: Boolean(patientId),
  });

  if (!patientId) {
    return (
      <Screen title="Records">
        <LoadingState label="Loading your records" />
      </Screen>
    );
  }

  const loading =
    prescriptionsQuery.isPending || treatmentsQuery.isPending || appointmentsQuery.isPending;
  const failed = prescriptionsQuery.isError || treatmentsQuery.isError || appointmentsQuery.isError;

  if (failed) {
    return (
      <Screen title="Records">
        <ErrorState
          message="We could not load your records."
          onRetry={() => {
            void prescriptionsQuery.refetch();
            void treatmentsQuery.refetch();
            void appointmentsQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const prescriptions = prescriptionsQuery.data ?? [];
  const treatments = treatmentsQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];

  return (
    <Screen
      title="Records"
      subtitle="Prescriptions, treatment plans and past visits"
      scroll
      onRefresh={() => {
        void prescriptionsQuery.refetch();
        void treatmentsQuery.refetch();
        void appointmentsQuery.refetch();
      }}
      refreshing={
        prescriptionsQuery.isRefetching ||
        treatmentsQuery.isRefetching ||
        appointmentsQuery.isRefetching
      }
      contentClassName="gap-6"
    >
      {loading ? (
        <LoadingState label="Loading your records" />
      ) : (
        <>
          <View>
            <SectionHeader title="Treatment plans" caption="Your Panchakarma protocols" />
            {treatments.length === 0 ? (
              <Surface>
                <Text.Paragraph type="body-sm" color="muted">
                  No treatment plan yet. Your doctor will build one after your consultation.
                </Text.Paragraph>
              </Surface>
            ) : (
              <View className="gap-3">
                {treatments.map((record) => (
                  <Surface
                    key={record.treatment.id}
                    className="gap-2"
                    accessibilityLabel={`Open ${record.treatment.protocol_name}`}
                    onPress={() =>
                      router.push({
                        pathname: '/(patient)/treatment/[id]',
                        params: { id: record.treatment.id },
                      })
                    }
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="flex-1">
                        <Text.Paragraph weight="semibold" className="text-foreground">
                          {record.treatment.protocol_name}
                        </Text.Paragraph>
                        <Text.Paragraph type="body-xs" color="muted">
                          {record.treatment.karma} · {record.doctorName}
                        </Text.Paragraph>
                      </View>
                      <StatusChip kind="treatment" status={record.treatment.status} />
                    </View>
                    <Text.Paragraph type="body-xs" color="muted">
                      {record.completedSessions} of {record.treatment.sessions.length} sessions done
                      · started {formatDateShort(record.treatment.start_date)}
                    </Text.Paragraph>
                    <ProgressBar
                      completed={record.completedSessions}
                      total={record.treatment.sessions.length}
                      label="Sessions completed"
                    />
                  </Surface>
                ))}
              </View>
            )}
          </View>

          <View>
            <SectionHeader title="Prescriptions" caption="Medicines issued by your doctor" />
            {prescriptions.length === 0 ? (
              <EmptyState
                title="No prescriptions yet"
                message="Anything your doctor prescribes will appear here straight away."
                className="py-8"
              />
            ) : (
              <View className="gap-3">
                {prescriptions.map((record) => (
                  <Surface
                    key={record.prescription.id}
                    className="flex-row items-center gap-3"
                    accessibilityLabel={`Open prescription from ${formatDateShort(
                      record.prescription.issued_at,
                    )}`}
                    onPress={() =>
                      router.push({
                        pathname: '/(patient)/prescription/[id]',
                        params: { id: record.prescription.id },
                      })
                    }
                  >
                    <View className="flex-1 gap-1">
                      <Text.Paragraph weight="semibold" className="text-foreground">
                        {formatDateShort(record.prescription.issued_at)}
                      </Text.Paragraph>
                      <Text.Paragraph type="body-xs" color="muted" numberOfLines={1}>
                        {record.prescription.items.map((item) => item.name).join(', ')}
                      </Text.Paragraph>
                      <View className="mt-1 flex-row">
                        <StatusChip kind="prescription" status={record.prescription.status} />
                      </View>
                    </View>
                    <ChevronRight color={BRAND_HEX.barkSoft} size={18} />
                  </Surface>
                ))}
              </View>
            )}
          </View>

          <View>
            <SectionHeader
              title="Visits"
              caption="Every consultation and therapy booked for you"
              action={
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => router.push('/(patient)/(tabs)/book')}
                >
                  <Button.Label>Book</Button.Label>
                </Button>
              }
            />
            {appointments.length === 0 ? (
              <Surface>
                <Text.Paragraph type="body-sm" color="muted">
                  No visits recorded yet.
                </Text.Paragraph>
              </Surface>
            ) : (
              <View className="gap-3">
                {appointments.map((entry) => (
                  <AppointmentCard
                    key={entry.appointment.id}
                    appointment={entry.appointment}
                    personName={entry.doctorName}
                    showChevron={false}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}
