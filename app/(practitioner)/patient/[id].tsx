import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Text } from 'heroui-native';
import { ChevronRight, NotebookPen } from 'lucide-react-native';

import { NoteComposer } from '@/components/practitioner/NoteComposer';
import { DoshaBadge, DoshaBar } from '@/components/ui/Dosha';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Surface } from '@/components/ui/Surface';
import { queryKeys } from '@/lib/api/keys';
import { fetchPatient } from '@/lib/api/patients';
import { fetchPrescriptionsByPatient } from '@/lib/api/prescriptions';
import { fetchTreatmentsByPatient } from '@/lib/api/treatments';
import { formatDateShort, titleCase } from '@/lib/format';
import { useSessionStore } from '@/lib/store/session';
import { BRAND_HEX, DOSHA_LABEL } from '@/lib/theme';
import { reversed } from '@/lib/utils';

export default function PatientRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSessionStore((state) => state.session);

  const patientQuery = useQuery({
    queryKey: queryKeys.patient(id),
    queryFn: () => fetchPatient(id),
    enabled: Boolean(id),
  });

  const treatmentsQuery = useQuery({
    queryKey: queryKeys.treatmentsByPatient(id),
    queryFn: () => fetchTreatmentsByPatient(id),
    enabled: Boolean(id),
  });

  const prescriptionsQuery = useQuery({
    queryKey: queryKeys.prescriptionsByPatient(id),
    queryFn: () => fetchPrescriptionsByPatient(id),
    enabled: Boolean(id),
  });

  if (patientQuery.isPending) {
    return (
      <Screen back backFallback="/(practitioner)/(tabs)/patients" title="Patient record">
        <LoadingState label="Opening the patient record" />
      </Screen>
    );
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <Screen back backFallback="/(practitioner)/(tabs)/patients" title="Patient record">
        <ErrorState
          message="We could not open this patient record."
          onRetry={() => void patientQuery.refetch()}
        />
      </Screen>
    );
  }

  const { patient } = patientQuery.data;
  const history = reversed(patient.prakriti_history);
  const latest = history[0];
  const notes = [...patient.clinical_notes].sort((a, b) =>
    b.recorded_on.localeCompare(a.recorded_on),
  );
  const treatments = treatmentsQuery.data ?? [];
  const prescriptions = prescriptionsQuery.data ?? [];

  return (
    <Screen
      back
      backFallback="/(practitioner)/(tabs)/patients"
      title={patient.full_name}
      subtitle={`${patient.age} yrs · ${titleCase(patient.gender)} · ${patient.phone}`}
      scroll
      keyboardAware
      contentClassName="gap-6"
    >
      <Surface className="gap-3">
        <View className="gap-1">
          <Text.Paragraph type="body-xs" color="muted">
            Chief complaint
          </Text.Paragraph>
          <Text.Paragraph className="text-foreground">{patient.chief_complaint}</Text.Paragraph>
        </View>

        <View className="gap-1">
          <Text.Paragraph type="body-xs" color="muted">
            Allergies
          </Text.Paragraph>
          <Text.Paragraph type="body-sm" className="text-foreground">
            {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None recorded'}
          </Text.Paragraph>
        </View>

        <View className="flex-row gap-2">
          <Button
            size="sm"
            className="flex-1"
            onPress={() =>
              router.push({
                pathname: '/(practitioner)/prescription/new',
                params: { patientId: patient.id },
              })
            }
          >
            <Button.Label>Prescribe</Button.Label>
          </Button>
        </View>
      </Surface>

      <View>
        <SectionHeader
          title="Prakriti"
          caption={latest ? `Last assessed ${formatDateShort(latest.assessed_on)}` : undefined}
        />
        {latest ? (
          <Surface className="gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <DoshaBadge dosha={latest.dominant} label={latest.constitution} withElement />
              <Text.Paragraph type="body-xs" color="muted">
                {latest.assessed_by === 'self' ? 'Self assessed' : 'Practitioner assessed'}
              </Text.Paragraph>
            </View>
            <DoshaBar scores={latest.scores} />
            {latest.notes ? (
              <Text.Paragraph type="body-sm" color="muted">
                {latest.notes}
              </Text.Paragraph>
            ) : null}
            {history.length > 1 ? (
              <View className="border-border gap-2 border-t pt-3">
                <Text.Paragraph type="body-xs" color="muted">
                  Earlier assessments
                </Text.Paragraph>
                {history.slice(1).map((entry) => (
                  <View key={entry.id} className="flex-row items-center justify-between gap-3">
                    <Text.Paragraph type="body-sm" className="text-foreground">
                      {formatDateShort(entry.assessed_on)}
                    </Text.Paragraph>
                    <Text.Paragraph type="body-xs" color="muted">
                      {entry.constitution} · V {entry.scores.vata} / P {entry.scores.pitta} / K{' '}
                      {entry.scores.kapha}
                    </Text.Paragraph>
                  </View>
                ))}
              </View>
            ) : null}
          </Surface>
        ) : (
          <Surface>
            <Text.Paragraph type="body-sm" color="muted">
              No Prakriti assessment on record yet. The patient can complete one from their app, or
              you can record findings as a Nadi Pariksha note below.
            </Text.Paragraph>
          </Surface>
        )}
      </View>

      <View>
        <SectionHeader title="Treatments" caption="Panchakarma protocols and their progress" />
        {treatments.length === 0 ? (
          <Surface>
            <Text.Paragraph type="body-sm" color="muted">
              No Panchakarma protocol assigned yet.
            </Text.Paragraph>
          </Surface>
        ) : (
          <View className="gap-3">
            {treatments.map((record) => (
              <Surface
                key={record.treatment.id}
                className="flex-row items-center gap-3"
                accessibilityLabel={`Open ${record.treatment.protocol_name}`}
                onPress={() =>
                  router.push({
                    pathname: '/(practitioner)/treatment/[id]',
                    params: { id: record.treatment.id },
                  })
                }
              >
                <View className="flex-1 gap-1">
                  <Text.Paragraph weight="semibold" className="text-foreground">
                    {record.treatment.protocol_name}
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted">
                    {record.treatment.karma} · {record.completedSessions} of{' '}
                    {record.treatment.sessions.length} sessions done
                  </Text.Paragraph>
                </View>
                <StatusChip kind="treatment" status={record.treatment.status} />
                <ChevronRight color={BRAND_HEX.barkSoft} size={18} />
              </Surface>
            ))}
          </View>
        )}
      </View>

      <View>
        <SectionHeader title="Prescriptions" caption="Issued by the clinic, newest first" />
        {prescriptions.length === 0 ? (
          <Surface>
            <Text.Paragraph type="body-sm" color="muted">
              Nothing prescribed yet.
            </Text.Paragraph>
          </Surface>
        ) : (
          <View className="gap-3">
            {prescriptions.map((record) => (
              <Surface
                key={record.prescription.id}
                className="flex-row items-center gap-3"
                accessibilityLabel={`Open prescription from ${formatDateShort(
                  record.prescription.issued_at,
                )}`}
                onPress={() =>
                  router.push({
                    pathname: '/(practitioner)/prescription/[id]',
                    params: { id: record.prescription.id },
                  })
                }
              >
                <View className="flex-1 gap-1">
                  <Text.Paragraph weight="semibold" className="text-foreground">
                    {formatDateShort(record.prescription.issued_at)}
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted" numberOfLines={1}>
                    {record.prescription.items.map((item) => item.name).join(', ')}
                  </Text.Paragraph>
                </View>
                <StatusChip kind="prescription" status={record.prescription.status} />
                <ChevronRight color={BRAND_HEX.barkSoft} size={18} />
              </Surface>
            ))}
          </View>
        )}
      </View>

      <View>
        <SectionHeader title="Clinical notes" caption="Nadi Pariksha and consultation findings" />
        {notes.length === 0 ? (
          <EmptyState
            icon={<NotebookPen color={BRAND_HEX.barkSoft} size={22} />}
            title="No notes yet"
            message="Record the first Nadi Pariksha or consultation note below."
            className="py-8"
          />
        ) : (
          <View className="mb-4 gap-3">
            {notes.map((note) => (
              <Surface key={note.id} className="gap-2">
                <View className="flex-row items-center justify-between gap-3">
                  <Text.Paragraph type="body-sm" weight="semibold" className="text-foreground">
                    {note.kind === 'nadi' ? 'Nadi Pariksha' : titleCase(note.kind)}
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted">
                    {formatDateShort(note.recorded_on)}
                  </Text.Paragraph>
                </View>
                {note.nadi_findings ? (
                  <View className="flex-row items-center gap-2">
                    <DoshaBadge dosha={note.nadi_findings.dominant} />
                    <Text.Paragraph type="body-xs" color="muted">
                      {note.nadi_findings.rate_bpm} bpm · {note.nadi_findings.quality}
                    </Text.Paragraph>
                  </View>
                ) : null}
                <Text.Paragraph type="body-sm" className="text-foreground">
                  {note.body}
                </Text.Paragraph>
                <Text.Paragraph type="body-xs" color="muted">
                  {note.author_name}
                </Text.Paragraph>
              </Surface>
            ))}
          </View>
        )}

        {session ? (
          <NoteComposer
            patientId={patient.id}
            authorId={session.profile.id}
            authorName={session.profile.full_name}
          />
        ) : null}
      </View>

      <Text.Paragraph type="body-xs" color="muted">
        {DOSHA_LABEL.vata}, {DOSHA_LABEL.pitta} and {DOSHA_LABEL.kapha} percentages come from the
        patient{"'"}s most recent assessment.
      </Text.Paragraph>
    </Screen>
  );
}
