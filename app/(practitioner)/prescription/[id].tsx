import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Text } from 'heroui-native';

import { ErrorState, LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Surface } from '@/components/ui/Surface';
import { queryKeys } from '@/lib/api/keys';
import { fetchPrescription, markPrescriptionCompleted } from '@/lib/api/prescriptions';
import { formatDateLong } from '@/lib/format';
import { useSessionStore } from '@/lib/store/session';

export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();
  const isTherapist = session?.profile.role === 'therapist';

  const prescriptionQuery = useQuery({
    queryKey: queryKeys.prescription(id),
    queryFn: () => fetchPrescription(id),
    enabled: Boolean(id),
  });

  const complete = useMutation({
    mutationFn: () => markPrescriptionCompleted(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.prescription(id) });
      void queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });

  if (prescriptionQuery.isPending) {
    return (
      <Screen back backFallback="/(practitioner)/(tabs)/prescriptions" title="Prescription">
        <LoadingState label="Loading the prescription" />
      </Screen>
    );
  }

  if (prescriptionQuery.isError || !prescriptionQuery.data) {
    return (
      <Screen back backFallback="/(practitioner)/(tabs)/prescriptions" title="Prescription">
        <ErrorState
          message="We could not open this prescription."
          onRetry={() => void prescriptionQuery.refetch()}
        />
      </Screen>
    );
  }

  const { prescription, patientName, doctorName } = prescriptionQuery.data;

  return (
    <Screen
      back
      backFallback="/(practitioner)/(tabs)/prescriptions"
      title={patientName}
      subtitle={formatDateLong(prescription.issued_at)}
      scroll
      contentClassName="gap-6"
      footer={
        isTherapist ? undefined : prescription.status === 'active' ? (
          <Button isDisabled={complete.isPending} onPress={() => complete.mutate()}>
            <Button.Label>{complete.isPending ? 'Updating' : 'Mark course completed'}</Button.Label>
          </Button>
        ) : (
          <Button
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/(practitioner)/prescription/new',
                params: { patientId: prescription.patient_id },
              })
            }
          >
            <Button.Label>Issue a new prescription</Button.Label>
          </Button>
        )
      }
    >
      <Surface className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text.Paragraph type="body-sm" className="text-foreground">
            Issued by {doctorName}
          </Text.Paragraph>
          <Text.Paragraph type="body-xs" color="muted">
            {prescription.items.length} {prescription.items.length === 1 ? 'medicine' : 'medicines'}
          </Text.Paragraph>
        </View>
        <StatusChip kind="prescription" status={prescription.status} />
      </Surface>

      <View>
        <SectionHeader title="Medicines" caption="Dosage, timing and anupana" />
        <View className="gap-3">
          {prescription.items.map((item) => (
            <Surface key={item.id} className="gap-2">
              <View className="flex-row items-baseline justify-between gap-3">
                <Text.Paragraph weight="semibold" className="text-foreground">
                  {item.name}
                </Text.Paragraph>
                <Text.Paragraph type="body-xs" color="muted">
                  {item.form}
                </Text.Paragraph>
              </View>
              <Text.Paragraph type="body-sm" className="text-foreground">
                {item.dosage} · {item.frequency} · {item.duration}
              </Text.Paragraph>
              <Text.Paragraph type="body-xs" color="muted">
                Anupana: {item.anupana}
              </Text.Paragraph>
              {item.instructions ? (
                <Text.Paragraph
                  type="body-xs"
                  color="muted"
                  className="bg-surface-secondary rounded-xl p-3"
                >
                  {item.instructions}
                </Text.Paragraph>
              ) : null}
            </Surface>
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Surface className="gap-1">
          <Text.Paragraph type="body-xs" color="muted">
            Pathya · foods and habits to follow
          </Text.Paragraph>
          <Text.Paragraph type="body-sm" className="text-foreground">
            {prescription.pathya}
          </Text.Paragraph>
        </Surface>
        <Surface className="gap-1">
          <Text.Paragraph type="body-xs" color="muted">
            Apathya · foods and habits to avoid
          </Text.Paragraph>
          <Text.Paragraph type="body-sm" className="text-foreground">
            {prescription.apathya}
          </Text.Paragraph>
        </Surface>
        {prescription.notes ? (
          <Surface className="gap-1">
            <Text.Paragraph type="body-xs" color="muted">
              Notes for the patient
            </Text.Paragraph>
            <Text.Paragraph type="body-sm" className="text-foreground">
              {prescription.notes}
            </Text.Paragraph>
          </Surface>
        ) : null}
      </View>

      <Button
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: '/(practitioner)/patient/[id]',
            params: { id: prescription.patient_id },
          })
        }
      >
        <Button.Label>Open patient record</Button.Label>
      </Button>
    </Screen>
  );
}
