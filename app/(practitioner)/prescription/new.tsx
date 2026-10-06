import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Button,
  Chip,
  Input,
  Label,
  PressableFeedback,
  SearchField,
  Text,
  TextArea,
  TextField,
} from 'heroui-native';
import { Trash2 } from 'lucide-react-native';

import { EmptyState, LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Surface } from '@/components/ui/Surface';
import { queryKeys } from '@/lib/api/keys';
import { fetchPatient, fetchPatients } from '@/lib/api/patients';
import { createPrescription, searchFormulary } from '@/lib/api/prescriptions';
import { useSessionStore } from '@/lib/store/session';
import { BRAND_HEX } from '@/lib/theme';
import type { FormularyEntry, PrescriptionItem } from '@/lib/types';

type DraftItem = Omit<PrescriptionItem, 'id'> & { key: string };

const DEFAULT_DURATION = '7 days';

function draftFrom(entry: FormularyEntry): DraftItem {
  return {
    key: `${entry.id}-${Date.now()}`,
    name: entry.name,
    form: entry.form,
    dosage: entry.default_dosage,
    frequency: entry.default_frequency,
    duration: DEFAULT_DURATION,
    anupana: entry.default_anupana,
    instructions: '',
  };
}

export default function NewPrescriptionScreen() {
  const params = useLocalSearchParams<{ patientId?: string }>();
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();

  const [patientId, setPatientId] = useState(params.patientId ?? '');
  const [patientSearch, setPatientSearch] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [pathya, setPathya] = useState('');
  const [apathya, setApathya] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const patientQuery = useQuery({
    queryKey: queryKeys.patient(patientId),
    queryFn: () => fetchPatient(patientId),
    enabled: Boolean(patientId),
  });

  const directoryQuery = useQuery({
    queryKey: queryKeys.patients(patientSearch),
    queryFn: () => fetchPatients(patientSearch),
    enabled: !patientId,
    placeholderData: (previous) => previous,
  });

  const formularyQuery = useQuery({
    queryKey: queryKeys.formulary(search),
    queryFn: () => searchFormulary(search),
    placeholderData: (previous) => previous,
  });

  const issue = useMutation({
    mutationFn: createPrescription,
    onSuccess: (record) => {
      void queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      router.replace({
        pathname: '/(practitioner)/prescription/[id]',
        params: { id: record.prescription.id },
      });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const chosenNames = useMemo(() => new Set(items.map((item) => item.name)), [items]);
  const results = formularyQuery.data ?? [];

  const updateItem = (key: string, patch: Partial<DraftItem>) => {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const submit = () => {
    setError(null);

    if (!patientId) {
      setError('Pick the patient this prescription is for.');
      return;
    }
    if (items.length === 0) {
      setError('Add at least one medicine from the formulary.');
      return;
    }
    const incomplete = items.some(
      (item) => !item.dosage.trim() || !item.frequency.trim() || !item.duration.trim(),
    );
    if (incomplete) {
      setError('Fill dosage, frequency and duration for every medicine.');
      return;
    }
    if (!session) return;

    issue.mutate({
      patientId,
      doctorId: session.profile.id,
      items: items.map(({ key: _key, ...item }) => item),
      pathya: pathya.trim() || 'Warm, freshly cooked meals at regular hours.',
      apathya: apathya.trim() || 'Curd at night, fried and packaged food, cold drinks.',
      notes: notes.trim() || null,
    });
  };

  return (
    <Screen
      back
      backFallback="/(practitioner)/(tabs)/prescriptions"
      title="New prescription"
      subtitle={
        patientQuery.data
          ? patientQuery.data.patient.full_name
          : 'Search the formulary and set the dosage'
      }
      scroll
      keyboardAware
      contentClassName="gap-6"
      footer={
        <View className="gap-2">
          {error ? (
            <Text.Paragraph type="body-sm" className="text-danger">
              {error}
            </Text.Paragraph>
          ) : null}
          <Button isDisabled={issue.isPending} onPress={submit}>
            <Button.Label>{issue.isPending ? 'Issuing' : 'Issue prescription'}</Button.Label>
          </Button>
        </View>
      }
    >
      {patientId ? (
        <Surface className="flex-row items-center gap-3">
          <View className="flex-1">
            {patientQuery.isPending ? (
              <Text.Paragraph type="body-sm" color="muted">
                Loading patient
              </Text.Paragraph>
            ) : (
              <>
                <Text.Paragraph weight="semibold" className="text-foreground">
                  {patientQuery.data?.patient.full_name ?? 'Patient'}
                </Text.Paragraph>
                <Text.Paragraph type="body-xs" color="muted">
                  {patientQuery.data?.patient.chief_complaint ?? ''}
                </Text.Paragraph>
              </>
            )}
          </View>
          <Button size="sm" variant="tertiary" onPress={() => setPatientId('')}>
            <Button.Label>Change</Button.Label>
          </Button>
        </Surface>
      ) : (
        <View>
          <SectionHeader title="Patient" caption="Who is this prescription for?" />
          <SearchField value={patientSearch} onChange={setPatientSearch}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search patients by name or complaint" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <View className="mt-3 gap-2">
            {directoryQuery.isPending ? (
              <LoadingState label="Loading patients" />
            ) : (
              (directoryQuery.data ?? []).map((summary) => (
                <Surface
                  key={summary.patient.id}
                  accessibilityLabel={`Select ${summary.patient.full_name}`}
                  onPress={() => setPatientId(summary.patient.id)}
                >
                  <Text.Paragraph weight="semibold" className="text-foreground">
                    {summary.patient.full_name}
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted" numberOfLines={1}>
                    {summary.patient.chief_complaint}
                  </Text.Paragraph>
                </Surface>
              ))
            )}
          </View>
        </View>
      )}

      <View>
        <SectionHeader title="Formulary" caption="Classical formulations with their usual dosage" />
        <SearchField value={search} onChange={setSearch}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by name, category or indication" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <View className="mt-3 gap-2">
          {results.map((entry) => {
            const added = chosenNames.has(entry.name);
            return (
              <Surface
                key={entry.id}
                className="flex-row items-center gap-3"
                accessibilityLabel={added ? `Remove ${entry.name}` : `Add ${entry.name}`}
                onPress={() => {
                  if (added) {
                    setItems((current) => current.filter((item) => item.name !== entry.name));
                  } else {
                    setItems((current) => [...current, draftFrom(entry)]);
                  }
                }}
              >
                <View className="flex-1 gap-1">
                  <Text.Paragraph weight="semibold" className="text-foreground">
                    {entry.name}
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted">
                    {entry.form} · {entry.category}
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted" numberOfLines={1}>
                    {entry.indications.join(', ')}
                  </Text.Paragraph>
                </View>
                <Chip size="sm" variant={added ? 'primary' : 'secondary'}>
                  <Chip.Label>{added ? 'Added' : 'Add'}</Chip.Label>
                </Chip>
              </Surface>
            );
          })}
          {results.length === 0 ? (
            <EmptyState
              title="Nothing matched"
              message="Try a different name, category or indication."
              className="py-8"
            />
          ) : null}
        </View>
      </View>

      <View>
        <SectionHeader
          title={`Prescription (${items.length})`}
          caption="Adjust dosage, frequency, duration and anupana"
        />
        {items.length === 0 ? (
          <Surface>
            <Text.Paragraph type="body-sm" color="muted">
              No medicines added yet. Pick them from the formulary above.
            </Text.Paragraph>
          </Surface>
        ) : (
          <View className="gap-3">
            {items.map((item) => (
              <Surface key={item.key} className="gap-3">
                <View className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text.Paragraph weight="semibold" className="text-foreground">
                      {item.name}
                    </Text.Paragraph>
                    <Text.Paragraph type="body-xs" color="muted">
                      {item.form}
                    </Text.Paragraph>
                  </View>
                  <PressableFeedback
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name}`}
                    className="h-11 w-11 items-center justify-center rounded-full"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() =>
                      setItems((current) => current.filter((entry) => entry.key !== item.key))
                    }
                  >
                    <Trash2 color={BRAND_HEX.barkSoft} size={18} />
                  </PressableFeedback>
                </View>

                <View className="flex-row gap-3">
                  <TextField className="flex-1">
                    <Label>Dosage</Label>
                    <Input
                      value={item.dosage}
                      placeholder="1 tsp"
                      onChangeText={(value) => updateItem(item.key, { dosage: value })}
                    />
                  </TextField>
                  <TextField className="flex-1">
                    <Label>Frequency</Label>
                    <Input
                      value={item.frequency}
                      placeholder="Twice daily"
                      onChangeText={(value) => updateItem(item.key, { frequency: value })}
                    />
                  </TextField>
                </View>

                <View className="flex-row gap-3">
                  <TextField className="flex-1">
                    <Label>Duration</Label>
                    <Input
                      value={item.duration}
                      placeholder="7 days"
                      onChangeText={(value) => updateItem(item.key, { duration: value })}
                    />
                  </TextField>
                  <TextField className="flex-1">
                    <Label>Anupana</Label>
                    <Input
                      value={item.anupana}
                      placeholder="Warm water"
                      onChangeText={(value) => updateItem(item.key, { anupana: value })}
                    />
                  </TextField>
                </View>

                <TextField>
                  <Label>Instructions</Label>
                  <Input
                    value={item.instructions}
                    placeholder="Take 30 minutes before food"
                    onChangeText={(value) => updateItem(item.key, { instructions: value })}
                  />
                </TextField>
              </Surface>
            ))}
          </View>
        )}
      </View>

      <View className="gap-3">
        <TextField>
          <Label>Pathya · to follow</Label>
          <TextArea
            value={pathya}
            placeholder="Warm cooked meals, moong dal, ginger tea, early dinner."
            onChangeText={setPathya}
          />
        </TextField>
        <TextField>
          <Label>Apathya · to avoid</Label>
          <TextArea
            value={apathya}
            placeholder="Curd at night, fried food, cold drinks, day sleep."
            onChangeText={setApathya}
          />
        </TextField>
        <TextField>
          <Label>Notes for the patient</Label>
          <TextArea
            value={notes}
            placeholder="Review after seven days with the symptom log."
            onChangeText={setNotes}
          />
        </TextField>
      </View>
    </Screen>
  );
}
