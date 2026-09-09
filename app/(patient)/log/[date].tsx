import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Input, Label, PressableFeedback, Text, TextArea, TextField } from 'heroui-native';
import { Check } from 'lucide-react-native';

import { RatingScale } from '@/components/ui/RatingScale';
import { LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { queryKeys } from '@/lib/api/keys';
import { emptyDinacharya, fetchLog, saveDailyLog } from '@/lib/api/logs';
import { formatRelativeDay, toYmd } from '@/lib/format';
import { useSessionStore } from '@/lib/store/session';
import { BRAND_HEX } from '@/lib/theme';
import { DINACHARYA_ITEMS, type DailyLog, type DinacharyaState, type Rating } from '@/lib/types';
import { cn } from '@/lib/utils';

const BOWEL_OPTIONS: DailyLog['bowel'][] = ['regular', 'sluggish', 'loose', 'irregular'];

const SYMPTOM_OPTIONS = [
  'Bloating',
  'Acidity',
  'Constipation',
  'Headache',
  'Joint pain',
  'Fatigue',
  'Poor sleep',
  'Anxiety',
  'Skin rash',
  'Cough',
];

export default function DailyLogScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? toYmd(new Date());
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patient?.id ?? '';
  const queryClient = useQueryClient();

  const logQuery = useQuery({
    queryKey: queryKeys.log(patientId, date),
    queryFn: () => fetchLog(patientId, date),
    enabled: Boolean(patientId),
  });

  const [digestion, setDigestion] = useState<Rating>(3);
  const [sleepHours, setSleepHours] = useState('7');
  const [sleepQuality, setSleepQuality] = useState<Rating>(3);
  const [energy, setEnergy] = useState<Rating>(3);
  const [mood, setMood] = useState<Rating>(3);
  const [bowel, setBowel] = useState<DailyLog['bowel']>('regular');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [dinacharya, setDinacharya] = useState<DinacharyaState>(emptyDinacharya);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [syncedLog, setSyncedLog] = useState<DailyLog | null>(null);

  const existing = logQuery.data ?? null;

  if (existing && existing !== syncedLog) {
    setSyncedLog(existing);
    setDigestion(existing.digestion);
    setSleepHours(String(existing.sleep_hours));
    setSleepQuality(existing.sleep_quality);
    setEnergy(existing.energy);
    setMood(existing.mood);
    setBowel(existing.bowel);
    setSymptoms(existing.symptoms);
    setDinacharya(existing.dinacharya);
    setNotes(existing.notes ?? '');
  }

  const save = useMutation({
    mutationFn: saveDailyLog,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.log(patientId, date) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.logs(patientId) });
      router.back();
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  if (!patientId) {
    return (
      <Screen back backFallback="/(patient)/(tabs)/journal" title="Daily log">
        <LoadingState label="Loading your log" />
      </Screen>
    );
  }

  const submit = () => {
    setError(null);
    const hours = Number(sleepHours.replace(',', '.'));
    if (!Number.isFinite(hours) || hours < 0 || hours > 16) {
      setError('Enter your sleep in hours, between 0 and 16.');
      return;
    }

    save.mutate({
      patientId,
      logDate: date,
      digestion,
      sleepHours: hours,
      sleepQuality,
      energy,
      mood,
      bowel,
      symptoms,
      dinacharya,
      notes: notes.trim() || null,
    });
  };

  return (
    <Screen
      back
      backFallback="/(patient)/(tabs)/journal"
      title="How are you today?"
      subtitle={formatRelativeDay(date)}
      scroll
      keyboardAware
      contentClassName="gap-6"
      footer={
        <Button isDisabled={save.isPending || logQuery.isPending} onPress={submit}>
          <Button.Label>
            {save.isPending ? 'Saving' : existing ? 'Update log' : 'Save log'}
          </Button.Label>
        </Button>
      }
    >
      {logQuery.isPending ? (
        <LoadingState label="Loading your entry" />
      ) : (
        <>
          <View className="gap-5">
            <RatingScale
              label="Agni · digestion"
              value={digestion}
              onChange={setDigestion}
              hint="1 = heavy and sluggish, 5 = light and strong"
            />
            <RatingScale
              label="Sleep quality"
              value={sleepQuality}
              onChange={setSleepQuality}
              hint="1 = broken sleep, 5 = deep and restful"
            />
            <RatingScale
              label="Energy"
              value={energy}
              onChange={setEnergy}
              hint="1 = drained, 5 = fully energetic"
            />
            <RatingScale
              label="Mood"
              value={mood}
              onChange={setMood}
              hint="1 = restless or low, 5 = calm and steady"
            />
          </View>

          <TextField>
            <Label>Hours slept</Label>
            <Input
              value={sleepHours}
              keyboardType="decimal-pad"
              placeholder="7"
              onChangeText={setSleepHours}
            />
          </TextField>

          <View>
            <SectionHeader title="Bowel movement" />
            <View className="flex-row flex-wrap gap-2">
              {BOWEL_OPTIONS.map((option) => {
                const selected = option === bowel;
                return (
                  <PressableFeedback
                    key={option}
                    accessibilityRole="radio"
                    accessibilityLabel={option}
                    accessibilityState={{ selected }}
                    onPress={() => setBowel(option)}
                  >
                    <View
                      className={cn(
                        'rounded-full border px-4 py-2',
                        selected ? 'bg-accent border-accent' : 'border-border bg-surface',
                      )}
                    >
                      <Text.Paragraph
                        type="body-sm"
                        className={selected ? 'text-accent-foreground' : 'text-foreground'}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text.Paragraph>
                    </View>
                  </PressableFeedback>
                );
              })}
            </View>
          </View>

          <View>
            <SectionHeader title="Symptoms" caption="Tap anything you felt today" />
            <View className="flex-row flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((symptom) => {
                const selected = symptoms.includes(symptom);
                return (
                  <PressableFeedback
                    key={symptom}
                    accessibilityRole="checkbox"
                    accessibilityLabel={symptom}
                    accessibilityState={{ checked: selected }}
                    onPress={() =>
                      setSymptoms((current) =>
                        current.includes(symptom)
                          ? current.filter((entry) => entry !== symptom)
                          : [...current, symptom],
                      )
                    }
                  >
                    <View
                      className={cn(
                        'rounded-full border px-3.5 py-2',
                        selected ? 'border-accent bg-saffron-soft' : 'border-border bg-surface',
                      )}
                    >
                      <Text.Paragraph
                        type="body-sm"
                        className={selected ? 'text-bark' : 'text-foreground'}
                      >
                        {symptom}
                      </Text.Paragraph>
                    </View>
                  </PressableFeedback>
                );
              })}
            </View>
          </View>

          <View>
            <SectionHeader title="Dinacharya" caption="Which routines did you keep?" />
            <View className="border-border bg-surface overflow-hidden rounded-2xl border">
              {DINACHARYA_ITEMS.map((item, index) => {
                const done = dinacharya[item.key];
                return (
                  <PressableFeedback
                    key={item.key}
                    accessibilityRole="checkbox"
                    accessibilityLabel={item.label}
                    accessibilityState={{ checked: done }}
                    onPress={() =>
                      setDinacharya((current) => ({ ...current, [item.key]: !current[item.key] }))
                    }
                  >
                    <View
                      className={cn(
                        'flex-row items-center gap-3 px-4 py-3',
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
                      <Text.Paragraph type="body-sm" className="text-foreground flex-1">
                        {item.label}
                      </Text.Paragraph>
                    </View>
                  </PressableFeedback>
                );
              })}
            </View>
          </View>

          <TextField>
            <Label>Anything else for your doctor?</Label>
            <TextArea
              value={notes}
              placeholder="Felt heaviness after lunch, mild headache in the evening."
              onChangeText={setNotes}
            />
          </TextField>

          {error ? (
            <Text.Paragraph type="body-sm" className="text-danger">
              {error}
            </Text.Paragraph>
          ) : null}
        </>
      )}
    </Screen>
  );
}
