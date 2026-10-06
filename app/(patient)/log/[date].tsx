import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Button, Input, Label, PressableFeedback, Text, TextArea, TextField } from 'heroui-native';
import { Check } from 'lucide-react-native';

import { LoadingState } from '@/components/ui/States';
import { RatingScale } from '@/components/ui/RatingScale';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { queryKeys } from '@/lib/api/keys';
import { emptyDinacharya, fetchLog, saveDailyLog } from '@/lib/api/logs';
import { formatRelativeDay, toYmd } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { useSessionStore } from '@/lib/store/session';
import { DINACHARYA_ITEMS, type DailyLog, type DinacharyaState, type Rating } from '@/lib/types';
import { cn } from '@/lib/utils';

const COMMON_SYMPTOMS = [
  'Headache',
  'Acidity',
  'Bloating',
  'Joint stiffness',
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

  const logQuery = useQuery({
    queryKey: queryKeys.log(patientId, date),
    queryFn: () => fetchLog(patientId, date),
    enabled: Boolean(patientId),
  });

  if (!patientId || logQuery.isPending) {
    return (
      <Screen back backFallback="/(patient)/(tabs)/journal" title="Daily log">
        <LoadingState label="Loading your log" />
      </Screen>
    );
  }

  return (
    <DailyLogForm key={date} initialLog={logQuery.data ?? null} date={date} patientId={patientId} />
  );
}

interface DailyLogFormProps {
  initialLog: DailyLog | null;
  date: string;
  patientId: string;
}

function DailyLogForm({ initialLog, date, patientId }: DailyLogFormProps) {
  const queryClient = useQueryClient();

  const [digestion, setDigestion] = useState<Rating>(() => initialLog?.digestion ?? 3);
  const [sleepHours, setSleepHours] = useState(() => String(initialLog?.sleep_hours ?? '7'));
  const [sleepQuality, setSleepQuality] = useState<Rating>(() => initialLog?.sleep_quality ?? 3);
  const [energy, setEnergy] = useState<Rating>(() => initialLog?.energy ?? 3);
  const [mood, setMood] = useState<Rating>(() => initialLog?.mood ?? 3);
  const [bowel, setBowel] = useState<DailyLog['bowel']>(() => initialLog?.bowel ?? 'regular');
  const [symptoms, setSymptoms] = useState<string[]>(() => initialLog?.symptoms ?? []);
  const [dinacharya, setDinacharya] = useState<DinacharyaState>(
    () => initialLog?.dinacharya ?? emptyDinacharya(),
  );
  const [notes, setNotes] = useState(() => initialLog?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: saveDailyLog,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.log(patientId, date) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.logs(patientId) });
      goBackOrReplace('/(patient)/(tabs)/journal');
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

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

  const toggleSymptom = (symptom: string) => {
    setSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom],
    );
  };

  const toggleDinacharya = (key: keyof DinacharyaState) => {
    setDinacharya((current) => ({ ...current, [key]: !current[key] }));
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
        <Button isDisabled={save.isPending} onPress={submit}>
          <Button.Label>
            {save.isPending ? 'Saving' : initialLog ? 'Update log' : 'Save log'}
          </Button.Label>
        </Button>
      }
    >
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
          hint="1 = broken and restless, 5 = deep and refreshing"
        />
        <RatingScale
          label="Energy level"
          value={energy}
          onChange={setEnergy}
          hint="1 = exhausted, 5 = vibrant"
        />
        <RatingScale
          label="Mood & mind"
          value={mood}
          onChange={setMood}
          hint="1 = anxious or irritable, 5 = calm and clear"
        />
      </View>

      <TextField>
        <Label>Sleep duration (hours)</Label>
        <Input
          placeholder="7"
          value={sleepHours}
          onChangeText={setSleepHours}
          keyboardType="numeric"
        />
      </TextField>

      <View className="gap-2">
        <Label>Bowel movement</Label>
        <View className="flex-row gap-2">
          {(['regular', 'sluggish', 'loose', 'irregular'] as const).map((option) => {
            const selected = bowel === option;
            return (
              <PressableFeedback
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={`Bowel movement: ${option}`}
                accessibilityState={{ selected }}
                onPress={() => setBowel(option)}
                className={cn(
                  'h-10 flex-1 items-center justify-center rounded-xl border',
                  selected ? 'bg-accent border-accent' : 'bg-surface border-border',
                )}
              >
                <Text.Paragraph
                  type="body-xs"
                  weight="semibold"
                  className={selected ? 'text-accent-foreground' : 'text-foreground'}
                >
                  {option[0].toUpperCase() + option.slice(1)}
                </Text.Paragraph>
              </PressableFeedback>
            );
          })}
        </View>
      </View>

      <View>
        <SectionHeader title="Symptoms" caption="Select anything you noticed today" />
        <View className="flex-row flex-wrap gap-2">
          {COMMON_SYMPTOMS.map((symptom) => {
            const selected = symptoms.includes(symptom);
            return (
              <PressableFeedback
                key={symptom}
                accessibilityRole="checkbox"
                accessibilityLabel={symptom}
                accessibilityState={{ checked: selected }}
                onPress={() => toggleSymptom(symptom)}
                className={cn(
                  'rounded-full border px-3 py-1.5',
                  selected ? 'bg-accent border-accent' : 'bg-surface border-border',
                )}
              >
                <Text.Paragraph
                  type="body-xs"
                  className={selected ? 'text-accent-foreground' : 'text-foreground'}
                >
                  {symptom}
                </Text.Paragraph>
              </PressableFeedback>
            );
          })}
        </View>
      </View>

      <View>
        <SectionHeader title="Dinacharya" caption="Daily Ayurvedic practices completed today" />
        <View className="gap-2">
          {DINACHARYA_ITEMS.map((item) => {
            const checked = dinacharya[item.key];
            return (
              <PressableFeedback
                key={item.key}
                accessibilityRole="checkbox"
                accessibilityLabel={item.label}
                accessibilityState={{ checked }}
                onPress={() => toggleDinacharya(item.key)}
                className="bg-surface border-border flex-row items-center gap-3 rounded-2xl border p-3.5"
              >
                <View
                  className={cn(
                    'h-5 w-5 items-center justify-center rounded border',
                    checked ? 'bg-forest border-forest' : 'border-border',
                  )}
                >
                  {checked ? <Check color="#ffffff" size={14} /> : null}
                </View>
                <View className="flex-1">
                  <Text.Paragraph type="body-sm" weight="medium" className="text-foreground">
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
    </Screen>
  );
}
