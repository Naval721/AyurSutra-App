import { FlatList, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'heroui-native';

import { ErrorState, LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SessionCard } from '@/components/ui/SessionCard';
import { StatTile } from '@/components/ui/StatTile';
import { StatusChip } from '@/components/ui/StatusChip';
import { queryKeys } from '@/lib/api/keys';
import { fetchTreatment } from '@/lib/api/treatments';
import { formatDateShort } from '@/lib/format';

export default function PatientTreatmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const treatmentQuery = useQuery({
    queryKey: queryKeys.treatment(id),
    queryFn: () => fetchTreatment(id),
    enabled: Boolean(id),
  });

  if (treatmentQuery.isPending) {
    return (
      <Screen back backFallback="/(patient)/(tabs)/records" title="Treatment plan">
        <LoadingState label="Loading your plan" />
      </Screen>
    );
  }

  if (treatmentQuery.isError || !treatmentQuery.data) {
    return (
      <Screen back backFallback="/(patient)/(tabs)/records" title="Treatment plan">
        <ErrorState
          message="We could not open this treatment plan."
          onRetry={() => void treatmentQuery.refetch()}
        />
      </Screen>
    );
  }

  const { treatment, doctorName, completedSessions } = treatmentQuery.data;
  const sessions = [...treatment.sessions].sort((a, b) => a.day - b.day);

  return (
    <Screen
      back
      backFallback="/(patient)/(tabs)/records"
      title={treatment.protocol_name}
      subtitle={`${treatment.karma} · ${doctorName}`}
      padded={false}
    >
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-4 pb-1">
            <View className="border-border bg-surface gap-2 rounded-2xl border p-4">
              <View className="flex-row items-center justify-between gap-3">
                <Text.Paragraph weight="semibold" className="text-foreground">
                  {treatment.total_days}-day protocol
                </Text.Paragraph>
                <StatusChip kind="treatment" status={treatment.status} />
              </View>
              <Text.Paragraph type="body-sm" color="muted">
                {treatment.goal}
              </Text.Paragraph>
              <Text.Paragraph type="body-xs" color="muted">
                Started {formatDateShort(treatment.start_date)}
              </Text.Paragraph>
            </View>

            <View className="flex-row gap-3">
              <StatTile label="Sessions" value={sessions.length} />
              <StatTile label="Done" value={completedSessions} />
              <StatTile
                label="Left"
                value={
                  sessions.filter(
                    (entry) => entry.status === 'pending' || entry.status === 'in_progress',
                  ).length
                }
              />
            </View>

            <Text.Paragraph type="body-xs" color="muted">
              Your therapist updates each session as it happens, so this list always shows where you
              are in the protocol.
            </Text.Paragraph>
          </View>
        }
        renderItem={({ item }) => <SessionCard session={item} showDate />}
      />
    </Screen>
  );
}
