import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Text } from 'heroui-native';
import { CalendarOff } from 'lucide-react-native';

import { AppointmentCard } from '@/components/ui/AppointmentCard';
import { DateStrip } from '@/components/ui/DateStrip';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SessionCard } from '@/components/ui/SessionCard';
import { StatTile } from '@/components/ui/StatTile';
import { fetchRoster } from '@/lib/api/appointments';
import { queryKeys } from '@/lib/api/keys';
import { fetchTherapistTasks, updateTreatmentSession } from '@/lib/api/treatments';
import { formatRelativeDay, toYmd } from '@/lib/format';
import { useSessionStore } from '@/lib/store/session';
import { BRAND_HEX } from '@/lib/theme';
import type { SessionStatus } from '@/lib/types';

export default function PractitionerHomeScreen() {
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => toYmd(new Date()));

  const profileId = session?.profile.id ?? '';
  const isTherapist = session?.profile.role === 'therapist';

  const rosterQuery = useQuery({
    queryKey: queryKeys.roster(profileId, date),
    queryFn: () => fetchRoster(profileId, date),
    enabled: Boolean(profileId) && !isTherapist,
  });

  const tasksQuery = useQuery({
    queryKey: queryKeys.therapistTasks(profileId, date),
    queryFn: () => fetchTherapistTasks(profileId, date),
    enabled: Boolean(profileId) && isTherapist,
  });

  const updateSession = useMutation({
    mutationFn: updateTreatmentSession,
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.therapistTasks(profileId, date) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.treatment(variables.treatmentId) });
    },
  });

  const query = isTherapist ? tasksQuery : rosterQuery;

  const roster = rosterQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const stats = isTherapist
    ? [
        { label: 'Sessions', value: tasks.length },
        {
          label: 'Done',
          value: tasks.filter((task) => task.session.status === 'completed').length,
        },
        {
          label: 'Pending',
          value: tasks.filter((task) => task.session.status === 'pending').length,
        },
      ]
    : [
        { label: 'Appointments', value: roster.length },
        {
          label: 'Completed',
          value: roster.filter((entry) => entry.appointment.status === 'completed').length,
        },
        {
          label: 'Therapies',
          value: roster.filter((entry) => entry.appointment.type === 'therapy').length,
        },
      ];

  return (
    <Screen
      title={isTherapist ? 'Therapy Schedule' : 'Clinical Consultations'}
      subtitle={`${session?.profile.full_name ?? ''} · ${formatRelativeDay(date)}`}
      padded={false}
    >
      <View className="pb-3">
        <DateStrip value={date} onChange={setDate} />
      </View>

      <View className="flex-row gap-3 px-5 pb-4">
        {stats.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </View>

      {query.isPending ? (
        <LoadingState label={isTherapist ? 'Loading your sessions' : 'Loading your day'} />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : isTherapist ? (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.session.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SessionCard
              session={item.session}
              caption={`${item.patient.full_name} · ${item.treatment.protocol_name}`}
              busy={updateSession.isPending}
              onStatusChange={(status: SessionStatus) =>
                updateSession.mutate({
                  treatmentId: item.treatment.id,
                  sessionId: item.session.id,
                  status,
                })
              }
              onOpenPlan={() =>
                router.push({
                  pathname: '/(practitioner)/treatment/[id]',
                  params: { id: item.treatment.id },
                })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<CalendarOff color={BRAND_HEX.barkSoft} size={22} />}
              title="No sessions assigned"
              message="Nothing is scheduled for you on this day. Pick another date to review your week."
            />
          }
        />
      ) : (
        <FlatList
          data={roster}
          keyExtractor={(item) => item.appointment.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item.appointment}
              patient={item.patient}
              onPress={() =>
                router.push({
                  pathname: '/(practitioner)/appointment/[id]',
                  params: { id: item.appointment.id },
                })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<CalendarOff color={BRAND_HEX.barkSoft} size={22} />}
              title="A clear day"
              message="No consultations booked for this date yet. Patient bookings appear here as soon as they are made."
            />
          }
          ListFooterComponent={
            roster.length > 0 ? (
              <Text.Paragraph type="body-xs" color="muted" className="pt-2 text-center">
                Tap an appointment to check the patient in, add notes or prescribe.
              </Text.Paragraph>
            ) : null
          }
        />
      )}
    </Screen>
  );
}
