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
import { DINACHARYA_ITEMS, type DailyLog, type DinacharyaKey } from '@/lib/types';
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
    onMutate: async (newLogInput) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.log(patientId, today) });
      const previousLog = queryClient.getQueryData<DailyLog | null>(
        queryKeys.log(patientId, today),
      );
      queryClient.setQueryData<DailyLog | null>(queryKeys.log(patientId, today), (old) => {
        const base: DailyLog = old ?? {
          id: 'temp-log',
          clinic_id: session?.clinic?.id ?? '',
          patient_id: patientId,
          log_date: today,
          digestion: 3,
          sleep_hours: 7,
          sleep_quality: 3,
          energy: 3,
          mood: 3,
          bowel: 'regular',
          symptoms: [],
          dinacharya: emptyDinacharya(),
          notes: null,
          created_at: new Date().toISOString(),
        };
        return {
          ...base,
          digestion: newLogInput.digestion,
          sleep_hours: newLogInput.sleepHours,
          sleep_quality: newLogInput.sleepQuality,
          energy: newLogInput.energy,
          mood: newLogInput.mood,
          bowel: newLogInput.bowel,
          symptoms: newLogInput.symptoms,
          dinacharya: newLogInput.dinacharya,
          notes: newLogInput.notes,
        };
      });
      return { previousLog };
    },
    onError: (_err, _newLog, context) => {
      if (context?.previousLog) {
        queryClient.setQueryData(queryKeys.log(patientId, today), context.previousLog);
      }
    },
    onSettled: () => {
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

  const now = appointmentsQuery.dataUpdatedAt;
  const upcoming = (appointmentsQuery.data ?? [])
    .filter(
      (entry) =>
        (entry.appointment.status === 'scheduled' ||
          entry.appointment.status === 'checked_in' ||
          entry.appointment.status === 'in_progress') &&
        new Date(entry.appointment.ends_at).getTime() >= now,
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
      subtitle={`${formatRelativeDay(today)} · Shanti Ayurvedic Bhavan`}
      scroll
      onRefresh={refresh}
      refreshing={refreshing}
      contentClassName="gap-6"
    >
      {/* Vitals & Regimen Overview */}
      <View className="flex-row gap-3">
        <Surface className="flex-1 gap-1 p-3.5">
          <View className="flex-row items-center justify-between">
            <Text.Paragraph type="body-xs" color="muted" weight="medium">
              Dinacharya
            </Text.Paragraph>
            <View className="rounded-full bg-amber-100 px-2 py-0.5">
              <Text.Paragraph
                type="body-xs"
                weight="semibold"
                className="text-[11px] text-amber-900"
              >
                {Math.round((doneCount / DINACHARYA_ITEMS.length) * 100)}%
              </Text.Paragraph>
            </View>
          </View>
          <Text.Heading type="h4" className="text-foreground mt-0.5">
            {doneCount} of {DINACHARYA_ITEMS.length}
          </Text.Heading>
          <Text.Paragraph type="body-xs" color="muted">
            {doneCount === DINACHARYA_ITEMS.length
              ? 'All daily rituals complete'
              : `${DINACHARYA_ITEMS.length - doneCount} remaining today`}
          </Text.Paragraph>
        </Surface>

        <Surface className="flex-1 gap-1 p-3.5">
          <Text.Paragraph type="body-xs" color="muted" weight="medium">
            Next Consultation
          </Text.Paragraph>
          <Text.Heading type="h4" className="text-foreground mt-0.5" numberOfLines={1}>
            {nextVisit ? formatRelativeDay(nextVisit.appointment.starts_at) : 'None'}
          </Text.Heading>
          <Text.Paragraph type="body-xs" color="muted" numberOfLines={1}>
            {nextVisit ? nextVisit.doctorName : 'Schedule follow-up'}
          </Text.Paragraph>
        </Surface>
      </View>

      {/* Prakriti Constitution Card */}
      {latestPrakriti ? (
        <Surface className="border-border gap-3.5 p-4.5">
          <View className="flex-row items-center justify-between gap-3">
            <View className="gap-0.5">
              <Text.Paragraph weight="semibold" className="text-foreground text-base">
                Your Prakriti Constitution
              </Text.Paragraph>
              <Text.Paragraph type="body-xs" color="muted">
                Classical Tri-Dosha Bio-Energy Balance
              </Text.Paragraph>
            </View>
            <DoshaBadge
              dosha={latestPrakriti.dominant}
              label={latestPrakriti.constitution}
              withElement
            />
          </View>
          <DoshaBar scores={latestPrakriti.scores} />
          <View className="bg-surface-secondary/70 border-border/50 rounded-xl border p-3">
            <Text.Paragraph type="body-xs" className="text-foreground leading-relaxed">
              {DOSHA_SUMMARY[latestPrakriti.dominant].guidance}
            </Text.Paragraph>
          </View>
          <Button size="sm" variant="tertiary" onPress={() => router.push('/(patient)/prakriti')}>
            <Button.Label>Retake Prakriti Assessment</Button.Label>
          </Button>
        </Surface>
      ) : (
        <Surface tone="accent" className="gap-3 p-4.5">
          <View className="flex-row items-center gap-2">
            <Leaf color={BRAND_HEX.saffron} size={20} />
            <Text.Paragraph weight="semibold" className="text-bark text-base">
              Discover Your Prakriti Constitution
            </Text.Paragraph>
          </View>
          <Text.Paragraph type="body-sm" className="text-bark leading-relaxed">
            Take our authentic 3-minute Ayurvedic questionnaire to determine your unique Vata, Pitta
            and Kapha constitution. Your Vaidya uses this to calibrate your diet and herbal therapy.
          </Text.Paragraph>
          <Button size="sm" onPress={() => router.push('/(patient)/prakriti')}>
            <Button.Label>Start Classical Assessment</Button.Label>
          </Button>
        </Surface>
      )}

      {/* Dinacharya Habits Section */}
      <View>
        <SectionHeader
          title="Daily Dinacharya"
          caption="Ayurvedic routine for optimal circadian balance"
          action={
            <Text.Paragraph type="body-xs" weight="semibold" color="muted">
              {doneCount}/{DINACHARYA_ITEMS.length}
            </Text.Paragraph>
          }
        />
        <Surface bare className="border-border overflow-hidden border">
          {DINACHARYA_ITEMS.map((item, index) => {
            const done = dinacharya[item.key];
            return (
              <PressableFeedback
                key={item.key}
                accessibilityRole="checkbox"
                accessibilityLabel={item.label}
                accessibilityState={{ checked: done }}
                onPress={() => toggleHabit(item.key)}
              >
                <View
                  className={cn(
                    'min-h-12 flex-row items-center gap-3.5 px-4 py-3.5',
                    index > 0 && 'border-border border-t',
                  )}
                >
                  <View
                    className={cn(
                      'h-6 w-6 items-center justify-center rounded-lg border transition-colors',
                      done ? 'border-amber-600 bg-amber-600' : 'border-border bg-surface-secondary',
                    )}
                  >
                    {done ? <Check color="#ffffff" size={14} /> : null}
                  </View>
                  <View className="flex-1">
                    <Text.Paragraph
                      type="body-sm"
                      weight={done ? 'normal' : 'medium'}
                      className={done ? 'text-muted line-through' : 'text-foreground'}
                    >
                      {item.label}
                    </Text.Paragraph>
                  </View>
                </View>
              </PressableFeedback>
            );
          })}
        </Surface>
      </View>

      {/* Therapy Today if Active Treatment Plan */}
      {todaySession ? (
        <View>
          <SectionHeader
            title="Therapy Session Today"
            caption={activeTreatment?.treatment.protocol_name}
          />
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

      {/* Upcoming Appointment */}
      <View>
        <SectionHeader
          title="Consultations"
          caption="Scheduled visits with your Ayurvedic doctor"
          action={
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => router.push('/(patient)/(tabs)/book')}
            >
              <Button.Label>Book New</Button.Label>
            </Button>
          }
        />
        {nextVisit ? (
          <AppointmentCard
            appointment={nextVisit.appointment}
            personName={nextVisit.doctorName}
            showChevron={false}
            showDate
          />
        ) : (
          <Surface className="p-4">
            <Text.Paragraph type="body-sm" color="muted">
              No consultations scheduled for upcoming days. Book a follow-up consultation with your
              Vaidya whenever needed.
            </Text.Paragraph>
          </Surface>
        )}
      </View>

      {/* Daily Symptom & Vitals Log */}
      <View>
        <SectionHeader title="Today's Health Log" caption="Agni, sleep, vitality and mood" />
        <Surface className="gap-3.5 p-4.5">
          {log ? (
            <View className="gap-2.5">
              <View className="flex-row flex-wrap gap-2">
                <View className="bg-surface-secondary border-border/60 rounded-lg border px-2.5 py-1.5">
                  <Text.Paragraph type="body-xs" className="text-foreground">
                    Agni (Digestion):{' '}
                    <Text.Paragraph weight="semibold">{log.digestion}/5</Text.Paragraph>
                  </Text.Paragraph>
                </View>
                <View className="bg-surface-secondary border-border/60 rounded-lg border px-2.5 py-1.5">
                  <Text.Paragraph type="body-xs" className="text-foreground">
                    Nidra (Sleep):{' '}
                    <Text.Paragraph weight="semibold">
                      {log.sleep_hours}h ({log.sleep_quality}/5)
                    </Text.Paragraph>
                  </Text.Paragraph>
                </View>
                <View className="bg-surface-secondary border-border/60 rounded-lg border px-2.5 py-1.5">
                  <Text.Paragraph type="body-xs" className="text-foreground">
                    Ojas (Energy): <Text.Paragraph weight="semibold">{log.energy}/5</Text.Paragraph>
                  </Text.Paragraph>
                </View>
                <View className="bg-surface-secondary border-border/60 rounded-lg border px-2.5 py-1.5">
                  <Text.Paragraph type="body-xs" className="text-foreground">
                    Manas (Mood): <Text.Paragraph weight="semibold">{log.mood}/5</Text.Paragraph>
                  </Text.Paragraph>
                </View>
              </View>
              {log.symptoms.length > 0 ? (
                <Text.Paragraph type="body-xs" color="muted">
                  Reported symptoms: {log.symptoms.join(', ')}
                </Text.Paragraph>
              ) : null}
            </View>
          ) : (
            <Text.Paragraph type="body-sm" color="muted">
              Nothing logged yet today. Recording how you feel helps your doctor monitor your
              healing progress.
            </Text.Paragraph>
          )}
          <Button
            variant={log ? 'secondary' : 'primary'}
            onPress={() =>
              router.push({ pathname: '/(patient)/log/[date]', params: { date: today } })
            }
          >
            <Button.Label>{log ? "Update Today's Health Log" : 'Record How You Feel'}</Button.Label>
          </Button>
        </Surface>
      </View>
    </Screen>
  );
}
