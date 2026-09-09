import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Chip, Input, Label, Text, TextArea, TextField } from 'heroui-native';

import { Surface } from '@/components/ui/Surface';
import { addClinicalNote } from '@/lib/api/patients';
import { queryKeys } from '@/lib/api/keys';
import { DOSHA_LABEL } from '@/lib/theme';
import type { ClinicalNoteKind, Dosha } from '@/lib/types';

const KINDS: { value: ClinicalNoteKind; label: string }[] = [
  { value: 'nadi', label: 'Nadi Pariksha' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'observation', label: 'Observation' },
];

const DOSHAS: Dosha[] = ['vata', 'pitta', 'kapha'];

export interface NoteComposerProps {
  patientId: string;
  authorId: string;
  authorName: string;
}

/** Records a clinical note; Nadi Pariksha adds pulse findings to the record. */
export function NoteComposer({ patientId, authorId, authorName }: NoteComposerProps) {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<ClinicalNoteKind>('nadi');
  const [body, setBody] = useState('');
  const [dominant, setDominant] = useState<Dosha>('vata');
  const [rate, setRate] = useState('');
  const [quality, setQuality] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: addClinicalNote,
    onSuccess: () => {
      setBody('');
      setRate('');
      setQuality('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.patient(patientId) });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const submit = () => {
    setError(null);
    if (body.trim().length < 4) {
      setError('Write a short note before saving.');
      return;
    }

    if (kind === 'nadi') {
      const bpm = Number(rate);
      if (!Number.isFinite(bpm) || bpm < 40 || bpm > 160) {
        setError('Enter the pulse rate in beats per minute.');
        return;
      }
      if (quality.trim().length < 3) {
        setError('Describe the pulse quality, for example "thin and irregular".');
        return;
      }

      save.mutate({
        patientId,
        authorId,
        authorName,
        kind,
        body,
        nadiFindings: { dominant, rate_bpm: Math.round(bpm), quality: quality.trim() },
      });
      return;
    }

    save.mutate({ patientId, authorId, authorName, kind, body });
  };

  return (
    <View className="border-border bg-surface gap-4 rounded-2xl border p-4">
      <View>
        <Label className="mb-2">Note type</Label>
        <View className="flex-row flex-wrap gap-2">
          {KINDS.map((option) => (
            <Chip
              key={option.value}
              size="sm"
              variant={kind === option.value ? 'primary' : 'secondary'}
              onPress={() => setKind(option.value)}
            >
              <Chip.Label>{option.label}</Chip.Label>
            </Chip>
          ))}
        </View>
      </View>

      {kind === 'nadi' ? (
        <View className="gap-4">
          <View>
            <Label className="mb-2">Dominant pulse</Label>
            <View className="flex-row gap-2">
              {DOSHAS.map((option) => (
                <Chip
                  key={option}
                  size="sm"
                  variant={dominant === option ? 'primary' : 'secondary'}
                  onPress={() => setDominant(option)}
                >
                  <Chip.Label>{DOSHA_LABEL[option]}</Chip.Label>
                </Chip>
              ))}
            </View>
          </View>

          <View className="flex-row gap-3">
            <TextField className="flex-1">
              <Label>Rate (bpm)</Label>
              <Input
                placeholder="76"
                value={rate}
                onChangeText={setRate}
                keyboardType="number-pad"
              />
            </TextField>
            <TextField className="flex-1">
              <Label>Quality</Label>
              <Input placeholder="Thin, fast" value={quality} onChangeText={setQuality} />
            </TextField>
          </View>
        </View>
      ) : null}

      <TextField>
        <Label>Findings</Label>
        <TextArea
          placeholder="Pulse felt at the index finger, Vata prominent. Advised warm oil abhyanga before bath."
          value={body}
          onChangeText={setBody}
        />
      </TextField>

      {error ? (
        <Text.Paragraph type="body-sm" className="text-danger">
          {error}
        </Text.Paragraph>
      ) : null}

      <Button isDisabled={save.isPending} onPress={submit}>
        <Button.Label>{save.isPending ? 'Saving' : 'Save note'}</Button.Label>
      </Button>
    </View>
  );
}
