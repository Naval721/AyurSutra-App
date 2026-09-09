import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Label, Text, TextArea, TextField } from 'heroui-native';

import { DoshaBadge } from '@/components/ui/Dosha';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Surface } from '@/components/ui/Surface';
import {
  fetchAppointment,
  saveAppointmentNote,
  updateAppointmentStatus,
} from '@/lib/api/appointments';
import { queryKeys } from '@/lib/api/keys';
import { APPOINTMENT_TYPE_LABEL, formatDateLong, formatTimeRange, titleCase } from '@/lib/format';
import type { AppointmentStatus } from '@/lib/types';

const NEXT_STATUS: Partial<
  Record<AppointmentStatus, { label: string; status: AppointmentStatus }[]>
> = {
  scheduled: [
    { label: 'Check in', status: 'checked_in' },
    { label: 'No show', status: 'no_show' },
    { label: 'Cancel', status: 'cancelled' },
  ],
  checked_in: [
    { label: 'Start consultation', status: 'in_progress' },
    { label: 'Cancel', status: 'cancelled' },
  ],
  in_progress: [{ label: 'Complete visit', status: 'completed' }],
  completed: [{ label: 'Reopen', status: 'in_progress' }],
  cancelled: [{ label: 'Restore', status: 'scheduled' }],
  no_show: [{ label: 'Restore', status: 'scheduled' }],
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [notesOverride, setNotesOverride] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  const appointmentQuery = useQuery({
    queryKey: queryKeys.appointment(id),
    queryFn: () => fetchAppointment(id),
    enabled: Boolean(id),
  });

  const detail = appointmentQuery.data ?? null;
  const notes = notesOverride ?? detail?.appointment.notes ?? '';

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.appointment(id) });
    void queryClient.invalidateQueries({ queryKey: ['roster'] });
    void queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
  };

  const changeStatus = useMutation({
    mutationFn: (status: AppointmentStatus) => updateAppointmentStatus(id, status),
    onSuccess: invalidate,
  });

  const saveNote = useMutation({
    mutationFn: (value: string) => saveAppointmentNote(id, value),
    onSuccess: () => {
      setSavedNote(true);
      invalidate();
    },
  });

  if (appointmentQuery.isPending) {
    return (
      <Screen back backFallback="/(practitioner)/(tabs)" title="Appointment">
        <LoadingState label="Loading this appointment" />
      </Screen>
    );
  }

  if (appointmentQuery.isError || !detail) {
    return (
      <Screen back backFallback="/(practitioner)/(tabs)" title="Appointment">
        <ErrorState
          message="We could not open this appointment."
          onRetry={() => void appointmentQuery.refetch()}
        />
      </Screen>
    );
  }

  const { appointment, patient, doctorName } = detail;
  const latestPrakriti = patient.prakriti_history.at(-1);
  const actions = NEXT_STATUS[appointment.status] ?? [];

  return (
    <Screen
      back
      backFallback="/(practitioner)/(tabs)"
      title={patient.full_name}
      subtitle={`${formatDateLong(appointment.starts_at)} · ${formatTimeRange(
        appointment.starts_at,
        appointment.ends_at,
      )}`}
      scroll
      keyboardAware
      contentClassName="gap-6"
    >
      <Surface className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text.Paragraph weight="semibold" className="text-foreground">
            {APPOINTMENT_TYPE_LABEL[appointment.type]}
          </Text.Paragraph>
          <StatusChip kind="appointment" status={appointment.status} />
        </View>

        <Text.Paragraph type="body-sm" color="muted">
          {appointment.reason}
        </Text.Paragraph>

        <View className="border-border gap-1 border-t pt-3">
          <Text.Paragraph type="body-xs" color="muted">
            With {doctorName}
            {appointment.room ? ` · ${appointment.room}` : ''}
          </Text.Paragraph>
          <Text.Paragraph type="body-xs" color="muted">
            Booked by {appointment.booked_by === 'patient' ? 'the patient' : 'clinic staff'}
          </Text.Paragraph>
        </View>
      </Surface>

      <View>
        <SectionHeader title="Visit status" caption="Updates the clinic calendar instantly" />
        <View className="flex-row flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.status}
              size="sm"
              variant={
                action.status === 'completed' || action.status === 'checked_in'
                  ? 'primary'
                  : 'secondary'
              }
              isDisabled={changeStatus.isPending}
              onPress={() => changeStatus.mutate(action.status)}
            >
              <Button.Label>{action.label}</Button.Label>
            </Button>
          ))}
        </View>
        {changeStatus.isError ? (
          <Text.Paragraph type="body-sm" className="text-danger mt-2">
            {changeStatus.error.message}
          </Text.Paragraph>
        ) : null}
      </View>

      <View>
        <SectionHeader title="Patient" caption={patient.chief_complaint} />
        <Surface className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <Text.Paragraph type="body-sm" className="text-foreground">
              {patient.age} yrs · {titleCase(patient.gender)} · {patient.phone}
            </Text.Paragraph>
            {latestPrakriti ? (
              <DoshaBadge dosha={latestPrakriti.dominant} label={latestPrakriti.constitution} />
            ) : null}
          </View>
          <Text.Paragraph type="body-xs" color="muted">
            Allergies:{' '}
            {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'none recorded'}
          </Text.Paragraph>
          <View className="flex-row gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onPress={() =>
                router.push({
                  pathname: '/(practitioner)/patient/[id]',
                  params: { id: patient.id },
                })
              }
            >
              <Button.Label>Open record</Button.Label>
            </Button>
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
      </View>

      <View>
        <SectionHeader title="Consultation notes" caption="Visible to the clinic dashboard" />
        <Surface className="gap-3">
          <TextField>
            <Label>Notes</Label>
            <TextArea
              placeholder="Agni improving, advised Triphala at night and warm cooked meals for a week."
              value={notes}
              onChangeText={(value) => {
                setNotesOverride(value);
                setSavedNote(false);
              }}
            />
          </TextField>
          <Button isDisabled={saveNote.isPending} onPress={() => saveNote.mutate(notes)}>
            <Button.Label>{saveNote.isPending ? 'Saving' : 'Save notes'}</Button.Label>
          </Button>
          {savedNote ? (
            <Text.Paragraph type="body-xs" color="muted">
              Notes saved to this appointment.
            </Text.Paragraph>
          ) : null}
          {saveNote.isError ? (
            <Text.Paragraph type="body-sm" className="text-danger">
              {saveNote.error.message}
            </Text.Paragraph>
          ) : null}
        </Surface>
      </View>
    </Screen>
  );
}
