import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Button, PressableFeedback, Text } from 'heroui-native';

import { DoshaBar, DoshaBadge } from '@/components/ui/Dosha';
import { LoadingState } from '@/components/ui/States';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { Surface } from '@/components/ui/Surface';
import { queryKeys } from '@/lib/api/keys';
import { savePrakritiAssessment } from '@/lib/api/patients';
import { tapSelection } from '@/lib/haptics';
import {
  DOSHA_SUMMARY,
  PRAKRITI_QUESTIONS,
  scorePrakriti,
  type PrakritiResult,
} from '@/lib/prakriti';
import { useSessionStore } from '@/lib/store/session';
import { DOSHA_ELEMENT } from '@/lib/theme';
import type { Dosha } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function PrakritiScreen() {
  const session = useSessionStore((state) => state.session);
  const refresh = useSessionStore((state) => state.refresh);
  const queryClient = useQueryClient();
  const patientId = session?.patient?.id ?? '';

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Dosha>>({});
  const [result, setResult] = useState<PrakritiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = PRAKRITI_QUESTIONS.length;
  const question = PRAKRITI_QUESTIONS[Math.min(step, total - 1)];
  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  const save = useMutation({
    mutationFn: savePrakritiAssessment,
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.patient(patientId) });
      await refresh();
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  if (!patientId) {
    return (
      <Screen back backFallback="/(patient)/(tabs)" title="Prakriti">
        <LoadingState label="Loading your record" />
      </Screen>
    );
  }

  const choose = (dosha: Dosha) => {
    tapSelection();
    const next = { ...answers, [question.id]: dosha };
    setAnswers(next);

    if (step + 1 < total) {
      setStep(step + 1);
      return;
    }

    const scored = scorePrakriti(next);
    setResult(scored);
    save.mutate({
      patientId,
      scores: scored.scores,
      dominant: scored.dominant,
      constitution: scored.constitution,
      assessedBy: 'self',
      notes: 'Self assessment from the patient app.',
    });
  };

  if (result) {
    const summary = DOSHA_SUMMARY[result.dominant];

    return (
      <Screen
        title="Your constitution"
        subtitle={save.isPending ? 'Saving to your record' : 'Saved to your clinic record'}
        scroll
        contentClassName="gap-6"
        footer={
          <Button isDisabled={save.isPending} onPress={() => router.replace('/(patient)/(tabs)')}>
            <Button.Label>{save.isPending ? 'Saving' : 'Done'}</Button.Label>
          </Button>
        }
      >
        <Surface className="gap-4 p-5">
          <View className="items-center gap-2">
            <Text.Heading type="h2" className="text-foreground">
              {result.constitution}
            </Text.Heading>
            <DoshaBadge dosha={result.dominant} label={DOSHA_ELEMENT[result.dominant]} />
          </View>
          <DoshaBar scores={result.scores} />
        </Surface>

        <Surface className="gap-2">
          <Text.Paragraph weight="semibold" className="text-foreground">
            {summary.headline}
          </Text.Paragraph>
          <Text.Paragraph type="body-sm" color="muted">
            {summary.guidance}
          </Text.Paragraph>
        </Surface>

        <Surface className="gap-2">
          <Text.Paragraph type="body-sm" weight="semibold" className="text-foreground">
            What happens next
          </Text.Paragraph>
          <Text.Paragraph type="body-sm" color="muted">
            Your doctor sees this result in your patient record and confirms it with Nadi Pariksha
            at your next consultation. Your treatment plan and diet advice are built from it.
          </Text.Paragraph>
        </Surface>

        {error ? (
          <Text.Paragraph type="body-sm" className="text-danger">
            {error}
          </Text.Paragraph>
        ) : null}

        <Button
          variant="secondary"
          onPress={() => {
            setResult(null);
            setAnswers({});
            setStep(0);
          }}
        >
          <Button.Label>Retake the questionnaire</Button.Label>
        </Button>
      </Screen>
    );
  }

  return (
    <Screen
      back
      backFallback="/(patient)/(tabs)"
      title="Prakriti assessment"
      subtitle={`Question ${step + 1} of ${total}`}
      scroll
      contentClassName="gap-6"
      footer={
        step > 0 ? (
          <Button variant="secondary" onPress={() => setStep(step - 1)}>
            <Button.Label>Previous question</Button.Label>
          </Button>
        ) : undefined
      }
    >
      <ProgressBar completed={answered} total={total} label="Questions answered" />

      <Text.Heading type="h4" className="text-foreground">
        {question.prompt}
      </Text.Heading>

      <View className="gap-3">
        {question.options.map((option) => {
          const selected = answers[question.id] === option.dosha;
          return (
            <PressableFeedback
              key={option.label}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => choose(option.dosha)}
            >
              <View
                className={cn(
                  'min-h-12 justify-center rounded-2xl border p-4',
                  selected ? 'border-accent bg-saffron-soft' : 'border-border bg-surface',
                )}
              >
                <Text.Paragraph
                  type="body-sm"
                  className={selected ? 'text-bark' : 'text-foreground'}
                >
                  {option.label}
                </Text.Paragraph>
              </View>
            </PressableFeedback>
          );
        })}
      </View>

      <Text.Paragraph type="body-xs" color="muted">
        Answer as you have been for most of your life, not just recently. There is no right or wrong
        answer.
      </Text.Paragraph>
    </Screen>
  );
}
