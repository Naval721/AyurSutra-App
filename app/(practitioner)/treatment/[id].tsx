import { FlatList, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'heroui-native';

import { ErrorState, LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SessionCard } from '@/components/ui/SessionCard';
import { StatTile } from '@/components/ui/StatTile';
import { StatusChip } from '@/components/ui/StatusChip';
import { queryKeys } from '@/lib/api/keys';
import { fetchTreatment, updateTreatmentSession } from '@/lib/api/treatments';
import { formatDateShort } from '@/lib/format';
import { profileName } from '@/lib/mock/db';
import type { SessionStatus } from '@/lib/types';

export default function TreatmentPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const treatmentQuery = useQuery({
    queryKey: queryKeys.treatment(id),
    queryFn: () => fetchTreatment(id),
    enabled: Boolean(id),
  });

  const updateSession = useMutation({
    mutationFn: updateTreatmentSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.treatment(id) });
      void queryClient.invalidateQueries({ queryKey: ['therapist-tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['treatments'] });
    },
  });

  if (treatmentQuery.isPending) {
    return (
      <Screen back backFallback="/(practitioner)/(tabs)" title="Treatment plan">
        <LoadingState label="Loading the protocol" />
      </Screen>
    );
  }

  if (treatmentQuery.isError || !treatmentQuery.data) {
    return (
      <Screen back backFallback="/(practitioner)/(tabs)" title="Treatment plan">
        <ErrorState
          message="We could not open this treatment plan."
          onRetry={() => void treatmentQuery.refetch()}
        />
      </Screen>
    );
  }

  const { treatment, patientName, doctorName, completedSessions } = treatmentQuery.data;
  const sessions = [...treatment.sessions].sort((a, b) => a.day - b.day);

  return (
    <Screen
      back
      backFallback="/(practitioner)/(tabs)"
      title={treatment.protocol_name}
      subtitle={`${patientName} · ${treatment.karma}`}
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
                Started {formatDateShort(treatment.start_date)} · Supervised by {doctorName}
              </Text.Paragraph>
            </View>

            <View className="flex-row gap-3">
              <StatTile label="Sessions" value={sessions.length} />
              <StatTile label="Completed" value={completedSessions} />
              <StatTile
                label="Remaining"
                value={
                  sessions.filter(
                    (entry) => entry.status === 'pending' || entry.status === 'in_progress',
                  ).length
                }
              />
            </View>

            <Text.Paragraph type="body-xs" color="muted">
              Tap a session to mark it started, done or skipped. Therapists see the same status in
              their daily checklist.
            </Text.Paragraph>
          </View>
        }
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            showDate
            caption={`${item.therapy_name} · ${profileName(item.therapist_id)}`}
            busy={updateSession.isPending}
            onStatusChange={(status: SessionStatus) =>
              updateSession.mutate({ treatmentId: treatment.id, sessionId: item.id, status })
            }
            onOpenPlan={() =>
              router.push({
                pathname: '/(practitioner)/patient/[id]',
                params: { id: treatment.patient_id },
              })
            }
          />
        )}
      />
    </Screen>
  );
}
