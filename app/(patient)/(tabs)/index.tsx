import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Button, PressableFeedback, Text } from 'heroui-native';
import { Check, Leaf } from 'lucide-react-native';

import { AppointmentCard } from '@/components/ui/AppointmentCard';
import { DoshaBar, DoshaBadge } from '@/components/ui/Dosha';
import { LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SessionCard } from '@/components/ui/SessionCard';
import { StatTile } from '@/components/ui/StatTile';
import { Surface } from '@/components/ui/Surface';
import { fetchPatientAppointments } from '@/lib/api/appointments';
import { queryKeys } from '@/lib/api/keys';
import { emptyDinacharya, fetchLog, saveDailyLog } from '@/lib/api/logs';
import { fetchPatient } from '@/lib/api/patients';
import { fetchTreatmentsByPatient } from '@/lib/api/treatments';
import { formatRelativeDay, toYmd } from '@/lib/format';
import { tapToggle } from '@/lib/haptics';
import { DOSHA_SUMMARY } from '@/lib/prakriti';
import { useSessionStore } from '@/lib/store/session';
import { BRAND_HEX } from '@/lib/theme';
import { DINACHARYA_ITEMS, type DinacharyaKey } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function PatientTodayScreen() {
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patient?.id ?? '';
  const today = toYmd(new Date());
  const queryClient = useQueryClient();

  const patientQuery = useQuery({
    queryKey: queryKeys.patient(patientId),
    queryFn: () => fetchPatient(patientId),
    enabled: Boolean(patientId),
  });

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.patientAppointments(patientId),
    queryFn: () => fetchPatientAppointments(patientId),
    enabled: Boolean(patientId),
  });

  const treatmentsQuery = useQuery({
    queryKey: queryKeys.treatmentsByPatient(patientId),
    queryFn: () => fetchTreatmentsByPatient(patientId),
    enabled: Boolean(patientId),
  });

  const logQuery = useQuery({
    queryKey: queryKeys.log(patientId, today),
    queryFn: () => fetchLog(patientId, today),
    enabled: Boolean(patientId),
  });

  const saveLog = useMutation({
    mutationFn: saveDailyLog,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.log(patientId, today) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.logs(patientId) });
    },
  });

  if (!session?.patient || !patientId) {
    return (
      <Screen title="Today">
        <LoadingState label="Loading your care plan" />
      </Screen>
    );
  }

  const patient = patientQuery.data?.patient ?? session.patient;
  const latestPrakriti = patient.prakriti_history.at(-1) ?? null;
  const log = logQuery.data ?? null;
  const dinacharya = log?.dinacharya ?? emptyDinacharya();
  const doneCount = Object.values(dinacharya).filter(Boolean).length;

  const upcoming = (appointmentsQuery.data ?? [])
    .filter(
      (entry) =>
        entry.appointment.status !== 'cancelled' &&
        new Date(entry.appointment.starts_at).getTime() >= appointmentsQuery.dataUpdatedAt,
    )
    .sort((a, b) => a.appointment.starts_at.localeCompare(b.appointment.starts_at));
  const nextVisit = upcoming[0] ?? null;

  const activeTreatment =
    (treatmentsQuery.data ?? []).find((record) => record.treatment.status === 'active') ?? null;
  const todaySession =
    activeTreatment?.treatment.sessions.find((entry) => entry.date === today) ?? null;

  const refreshing =
    patientQuery.isRefetching ||
    appointmentsQuery.isRefetching ||
    treatmentsQuery.isRefetching ||
    logQuery.isRefetching;

  const refresh = () => {
    void patientQuery.refetch();
    void appointmentsQuery.refetch();
    void treatmentsQuery.refetch();
    void logQuery.refetch();
  };

  const toggleHabit = (key: DinacharyaKey) => {
    tapToggle();
    saveLog.mutate({
      patientId,
      logDate: today,
      digestion: log?.digestion ?? 3,
      sleepHours: log?.sleep_hours ?? 7,
      sleepQuality: log?.sleep_quality ?? 3,
      energy: log?.energy ?? 3,
      mood: log?.mood ?? 3,
      bowel: log?.bowel ?? 'regular',
      symptoms: log?.symptoms ?? [],
      dinacharya: { ...dinacharya, [key]: !dinacharya[key] },
      notes: log?.notes ?? null,
    });
  };

  return (
    <Screen
      title={`Namaste, ${patient.full_name.split(' ')[0]}`}
      subtitle={formatRelativeDay(today)}
      scroll
      onRefresh={refresh}
      refreshing={refreshing}
      contentClassName="gap-6"
    >
      <View className="flex-row gap-3">
        <StatTile
          label="Dinacharya"
          value={`${doneCount}/${DINACHARYA_ITEMS.length}`}
          caption="Habits today"
        />
        <StatTile
          label="Next visit"
          value={nextVisit ? formatRelativeDay(nextVisit.appointment.starts_at) : 'None'}
          caption={nextVisit ? nextVisit.doctorName : 'Nothing booked'}
        />
      </View>

      {latestPrakriti ? (
        <Surface className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <Text.Paragraph weight="semibold" className="text-foreground">
              Your Prakriti
            </Text.Paragraph>
            <DoshaBadge dosha={latestPrakriti.dominant} label={latestPrakriti.constitution} />
          </View>
          <DoshaBar scores={latestPrakriti.scores} />
          <Text.Paragraph type="body-xs" color="muted">
            {DOSHA_SUMMARY[latestPrakriti.dominant].guidance}
          </Text.Paragraph>
          <Button size="sm" variant="tertiary" onPress={() => router.push('/(patient)/prakriti')}>
            <Button.Label>Retake the assessment</Button.Label>
          </Button>
        </Surface>
      ) : (
        <Surface tone="accent" className="gap-3">
          <View className="flex-row items-center gap-2">
            <Leaf color={BRAND_HEX.saffron} size={18} />
            <Text.Paragraph weight="semibold" className="text-bark">
              Find your constitution
            </Text.Paragraph>
          </View>
          <Text.Paragraph type="body-sm" className="text-bark">
            A short guided questionnaire works out your Vata-Pitta-Kapha balance so your doctor can
            tailor your treatment.
          </Text.Paragraph>
          <Button size="sm" onPress={() => router.push('/(patient)/prakriti')}>
            <Button.Label>Start Prakriti assessment</Button.Label>
          </Button>
        </Surface>
      )}

      <View>
        <SectionHeader title="Dinacharya" caption="Your daily routine. Tap to tick off." />
        <Surface bare className="overflow-hidden">
          {DINACHARYA_ITEMS.map((item, index) => {
            const done = dinacharya[item.key];
            return (
              <PressableFeedback
                key={item.key}
                accessibilityRole="checkbox"
                accessibilityLabel={item.label}
                accessibilityState={{ checked: done, disabled: saveLog.isPending }}
                isDisabled={saveLog.isPending}
                onPress={() => toggleHabit(item.key)}
              >
                <View
                  className={cn(
                    'min-h-12 flex-row items-center gap-3 px-4 py-3',
                    index > 0 && 'border-border border-t',
                  )}
                >
                  <View
                    className={cn(
                      'h-6 w-6 items-center justify-center rounded-full border',
                      done ? 'bg-accent border-accent' : 'border-border bg-surface-secondary',
                    )}
                  >
                    {done ? <Check color={BRAND_HEX.cream} size={14} /> : null}
                  </View>
                  <Text.Paragraph
                    type="body-sm"
                    className={done ? 'text-muted flex-1 line-through' : 'text-foreground flex-1'}
                  >
                    {item.label}
                  </Text.Paragraph>
                </View>
              </PressableFeedback>
            );
          })}
        </Surface>
      </View>

      {todaySession ? (
        <View>
          <SectionHeader title="Therapy today" caption={activeTreatment?.treatment.protocol_name} />
          <SessionCard
            session={todaySession}
            caption={`Supervised by ${activeTreatment?.doctorName ?? 'your doctor'}`}
            onOpenPlan={() =>
              activeTreatment
                ? router.push({
                    pathname: '/(patient)/treatment/[id]',
                    params: { id: activeTreatment.treatment.id },
                  })
                : undefined
            }
          />
        </View>
      ) : null}

      <View>
        <SectionHeader
          title="Next appointment"
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
        {nextVisit ? (
          <AppointmentCard
            appointment={nextVisit.appointment}
            personName={nextVisit.doctorName}
            showChevron={false}
          />
        ) : (
          <Surface>
            <Text.Paragraph type="body-sm" color="muted">
              You have no upcoming visits. Pick a slot from the clinic calendar whenever you are
              ready.
            </Text.Paragraph>
          </Surface>
        )}
      </View>

      <View>
        <SectionHeader title="Today's log" caption="Digestion, sleep, energy and mood" />
        <Surface className="gap-3">
          {log ? (
            <>
              <Text.Paragraph type="body-sm" className="text-foreground">
                Digestion {log.digestion}/5 · Sleep {log.sleep_hours} h · Energy {log.energy}/5 ·
                Mood {log.mood}/5
              </Text.Paragraph>
              {log.symptoms.length > 0 ? (
                <Text.Paragraph type="body-xs" color="muted">
                  Symptoms: {log.symptoms.join(', ')}
                </Text.Paragraph>
              ) : null}
            </>
          ) : (
            <Text.Paragraph type="body-sm" color="muted">
              Nothing recorded yet today. Your doctor reads this before your next visit.
            </Text.Paragraph>
          )}
          <Button
            variant={log ? 'secondary' : 'primary'}
            onPress={() =>
              router.push({ pathname: '/(patient)/log/[date]', params: { date: today } })
            }
          >
            <Button.Label>{log ? "Update today's log" : 'Log how you feel'}</Button.Label>
          </Button>
        </Surface>
      </View>
    </Screen>
  );
}
