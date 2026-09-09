import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'heroui-native';

import { ErrorState, LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Surface } from '@/components/ui/Surface';
import { queryKeys } from '@/lib/api/keys';
import { fetchPrescription } from '@/lib/api/prescriptions';
import { formatDateLong } from '@/lib/format';

export default function PatientPrescriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const prescriptionQuery = useQuery({
    queryKey: queryKeys.prescription(id),
    queryFn: () => fetchPrescription(id),
    enabled: Boolean(id),
  });

  if (prescriptionQuery.isPending) {
    return (
      <Screen back backFallback="/(patient)/(tabs)/records" title="Prescription">
        <LoadingState label="Loading your prescription" />
      </Screen>
    );
  }

  if (prescriptionQuery.isError || !prescriptionQuery.data) {
    return (
      <Screen back backFallback="/(patient)/(tabs)/records" title="Prescription">
        <ErrorState
          message="We could not open this prescription."
          onRetry={() => void prescriptionQuery.refetch()}
        />
      </Screen>
    );
  }

  const { prescription, doctorName } = prescriptionQuery.data;

  return (
    <Screen
      back
      backFallback="/(patient)/(tabs)/records"
      title="Your prescription"
      subtitle={`${formatDateLong(prescription.issued_at)} · ${doctorName}`}
      scroll
      contentClassName="gap-6"
    >
      <Surface className="flex-row items-center justify-between gap-3">
        <Text.Paragraph type="body-sm" className="text-foreground">
          {prescription.items.length} {prescription.items.length === 1 ? 'medicine' : 'medicines'}
        </Text.Paragraph>
        <StatusChip kind="prescription" status={prescription.status} />
      </Surface>

      <View>
        <SectionHeader title="How to take them" />
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
                Take with {item.anupana}
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
            Pathya · foods and habits that help
          </Text.Paragraph>
          <Text.Paragraph type="body-sm" className="text-foreground">
            {prescription.pathya}
          </Text.Paragraph>
        </Surface>
        <Surface className="gap-1">
          <Text.Paragraph type="body-xs" color="muted">
            Apathya · what to avoid
          </Text.Paragraph>
          <Text.Paragraph type="body-sm" className="text-foreground">
            {prescription.apathya}
          </Text.Paragraph>
        </Surface>
        {prescription.notes ? (
          <Surface className="gap-1">
            <Text.Paragraph type="body-xs" color="muted">
              Note from your doctor
            </Text.Paragraph>
            <Text.Paragraph type="body-sm" className="text-foreground">
              {prescription.notes}
            </Text.Paragraph>
          </Surface>
        ) : null}
      </View>
    </Screen>
  );
}
