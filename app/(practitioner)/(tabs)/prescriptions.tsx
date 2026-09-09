import { FlatList, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Button, PressableFeedback, Text } from 'heroui-native';
import { ChevronRight, FileText } from 'lucide-react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { StatusChip } from '@/components/ui/StatusChip';
import { queryKeys } from '@/lib/api/keys';
import { fetchPrescriptionsByDoctor } from '@/lib/api/prescriptions';
import { formatDateShort } from '@/lib/format';
import { useSessionStore } from '@/lib/store/session';
import { BRAND_HEX } from '@/lib/theme';

export default function PractitionerPrescriptionsScreen() {
  const session = useSessionStore((state) => state.session);
  const doctorId = session?.profile.id ?? '';

  const prescriptionsQuery = useQuery({
    queryKey: queryKeys.prescriptionsByDoctor(doctorId),
    queryFn: () => fetchPrescriptionsByDoctor(doctorId),
    enabled: Boolean(doctorId),
  });

  const records = prescriptionsQuery.data ?? [];

  return (
    <Screen
      title="Prescriptions"
      subtitle="Everything you have issued, newest first"
      padded={false}
      headerRight={
        <Button size="sm" onPress={() => router.push('/(practitioner)/prescription/new')}>
          <Button.Label>New</Button.Label>
        </Button>
      }
    >
      {prescriptionsQuery.isPending ? (
        <LoadingState label="Loading issued prescriptions" />
      ) : prescriptionsQuery.isError ? (
        <ErrorState onRetry={() => void prescriptionsQuery.refetch()} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.prescription.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PressableFeedback
              accessibilityRole="button"
              accessibilityLabel={`Open prescription for ${item.patientName}`}
              onPress={() =>
                router.push({
                  pathname: '/(practitioner)/prescription/[id]',
                  params: { id: item.prescription.id },
                })
              }
            >
              <View className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border p-4">
                <View className="flex-1 gap-1">
                  <Text.Paragraph weight="semibold" className="text-foreground">
                    {item.patientName}
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted" numberOfLines={1}>
                    {item.prescription.items.map((entry) => entry.name).join(', ')}
                  </Text.Paragraph>
                  <View className="mt-1 flex-row items-center gap-2">
                    <StatusChip kind="prescription" status={item.prescription.status} />
                    <Text.Paragraph type="body-xs" color="muted">
                      {formatDateShort(item.prescription.issued_at)}
                    </Text.Paragraph>
                  </View>
                </View>
                <ChevronRight color={BRAND_HEX.barkSoft} size={18} />
              </View>
            </PressableFeedback>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<FileText color={BRAND_HEX.barkSoft} size={22} />}
              title="No prescriptions yet"
              message="Issue your first digital prescription and it will reach the patient's records straight away."
              action={
                <Button size="sm" onPress={() => router.push('/(practitioner)/prescription/new')}>
                  <Button.Label>New prescription</Button.Label>
                </Button>
              }
            />
          }
        />
      )}
    </Screen>
  );
}
