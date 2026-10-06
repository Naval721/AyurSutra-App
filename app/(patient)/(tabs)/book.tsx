import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Button, Chip, Input, Label, PressableFeedback, Text, TextField } from 'heroui-native';

import { DateStrip } from '@/components/ui/DateStrip';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Surface } from '@/components/ui/Surface';
import { bookAppointment, fetchSlots } from '@/lib/api/appointments';
import { fetchStaff } from '@/lib/api/auth';
import { queryKeys } from '@/lib/api/keys';
import { APPOINTMENT_TYPE_LABEL, formatDateLong, formatTime, initials, toYmd } from '@/lib/format';
import { tapError, tapSelection, tapSuccess } from '@/lib/haptics';
import { useSessionStore } from '@/lib/store/session';
import type { AppointmentType, BookingSlot } from '@/lib/types';
import { cn } from '@/lib/utils';

const TYPES: AppointmentType[] = ['consultation', 'follow_up', 'therapy'];

export default function PatientBookScreen() {
  const session = useSessionStore((state) => state.session);
  const patient = session?.patient ?? null;
  const queryClient = useQueryClient();

  const [date, setDate] = useState(toYmd(new Date()));
  const [doctorId, setDoctorId] = useState(patient?.primary_doctor_id ?? '');
  const [type, setType] = useState<AppointmentType>('consultation');
  const [slot, setSlot] = useState<BookingSlot | null>(null);
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const staffQuery = useQuery({ queryKey: queryKeys.staff, queryFn: fetchStaff });

  const doctors = useMemo(
    () => (staffQuery.data ?? []).filter((member) => member.role === 'doctor'),
    [staffQuery.data],
  );
  const activeDoctorId = doctorId || doctors[0]?.id || '';

  const slotsQuery = useQuery({
    queryKey: queryKeys.slots(activeDoctorId, date),
    queryFn: () => fetchSlots(activeDoctorId, date),
    enabled: Boolean(activeDoctorId),
  });

  const book = useMutation({
    mutationFn: bookAppointment,
    onSuccess: (appointment) => {
      tapSuccess();
      setConfirmation(
        `${formatDateLong(appointment.starts_at)} at ${formatTime(appointment.starts_at)}`,
      );
      setSlot(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.slots(activeDoctorId, date) });
      if (patient) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.patientAppointments(patient.id),
        });
        void queryClient.invalidateQueries({ queryKey: queryKeys.patient(patient.id) });
      }
      void queryClient.invalidateQueries({ queryKey: ['roster'] });
    },
    onError: (mutationError: Error) => {
      tapError();
      setError(mutationError.message);
    },
  });

  if (!patient) {
    return (
      <Screen title="Book">
        <LoadingState label="Loading the clinic calendar" />
      </Screen>
    );
  }

  const slots = slotsQuery.data ?? [];
  const available = slots.filter((entry) => entry.available);

  const submit = () => {
    setError(null);
    setConfirmation(null);

    if (!activeDoctorId) {
      setError('Pick a doctor to book with.');
      return;
    }
    if (!slot) {
      setError('Choose a time slot first.');
      return;
    }

    book.mutate({
      patientId: patient.id,
      doctorId: activeDoctorId,
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
      type,
      reason,
      bookedBy: 'patient',
    });
  };

  return (
    <Screen
      title="Book a visit"
      subtitle="Live availability from the clinic calendar"
      scroll
      keyboardAware
      padded={false}
      contentClassName="gap-6"
      footer={
        <Button isDisabled={book.isPending || !slot} onPress={submit}>
          <Button.Label>
            {book.isPending
              ? 'Booking'
              : slot
                ? `Confirm ${formatTime(slot.starts_at)}`
                : 'Select a time'}
          </Button.Label>
        </Button>
      }
    >
      <View>
        <SectionHeader title="Day" className="mb-3 px-5" />
        <DateStrip
          value={date}
          onChange={(value) => {
            setDate(value);
            setSlot(null);
          }}
          offsetDays={0}
        />
      </View>

      <View className="px-5">
        <SectionHeader title="Doctor" caption="Who would you like to see?" />
        {staffQuery.isPending ? (
          <LoadingState label="Loading doctors" />
        ) : (
          <View className="gap-2.5">
            {doctors.map((doctor) => {
              const selected = doctor.id === activeDoctorId;
              return (
                <PressableFeedback
                  key={doctor.id}
                  accessibilityRole="radio"
                  accessibilityLabel={doctor.full_name}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    tapSelection();
                    setDoctorId(doctor.id);
                    setSlot(null);
                  }}
                >
                  <View
                    className={cn(
                      'flex-row items-center gap-3.5 rounded-2xl border p-4 shadow-xs',
                      selected ? 'border-accent bg-amber-50/70' : 'border-border bg-surface',
                    )}
                  >
                    <View className="h-11 w-11 items-center justify-center rounded-full border border-amber-300 bg-amber-100">
                      <Text.Paragraph type="body-sm" weight="bold" className="text-amber-900">
                        {initials(doctor.full_name)}
                      </Text.Paragraph>
                    </View>
                    <View className="flex-1">
                      <Text.Paragraph weight="semibold" className="text-foreground">
                        {doctor.full_name}
                      </Text.Paragraph>
                      <Text.Paragraph type="body-xs" color="muted">
                        {doctor.qualification ? `${doctor.qualification} · ` : ''}
                        {doctor.specialisation ?? 'Ayurvedic physician'}
                      </Text.Paragraph>
                    </View>
                    {doctor.id === patient.primary_doctor_id ? (
                      <Chip size="sm" variant="soft">
                        <Chip.Label>Primary</Chip.Label>
                      </Chip>
                    ) : null}
                  </View>
                </PressableFeedback>
              );
            })}
          </View>
        )}
      </View>

      <View className="px-5">
        <SectionHeader title="Visit type" />
        <View className="flex-row gap-2">
          {TYPES.map((option) => {
            const selected = option === type;
            return (
              <PressableFeedback
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={APPOINTMENT_TYPE_LABEL[option]}
                accessibilityState={{ selected }}
                className="flex-1"
                onPress={() => {
                  tapSelection();
                  setType(option);
                }}
              >
                <View
                  className={cn(
                    'min-h-11 items-center justify-center rounded-xl border px-3 py-2.5',
                    selected ? 'bg-accent border-accent' : 'border-border bg-surface',
                  )}
                >
                  <Text.Paragraph
                    type="body-sm"
                    weight="medium"
                    className={selected ? 'text-accent-foreground' : 'text-foreground'}
                  >
                    {APPOINTMENT_TYPE_LABEL[option]}
                  </Text.Paragraph>
                </View>
              </PressableFeedback>
            );
          })}
        </View>
      </View>

      <View className="px-5">
        <SectionHeader
          title="Available times"
          caption={
            available.length > 0
              ? `${available.length} open on ${formatDateLong(date)}`
              : `All slots booked or passed for ${formatDateLong(date)}`
          }
        />
        {slotsQuery.isPending ? (
          <LoadingState label="Checking availability" />
        ) : slots.length === 0 ? (
          <EmptyState
            title="Clinic closed"
            message="The clinic does not take bookings on this day. Please pick another date."
            className="py-8"
          />
        ) : available.length === 0 ? (
          <Surface className="mb-2">
            <Text.Paragraph type="body-sm" color="muted">
              No open slots remain for {formatDateLong(date)}. Please select another day above to
              see available appointments.
            </Text.Paragraph>
          </Surface>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {slots.map((entry) => {
              const selected = slot?.starts_at === entry.starts_at;
              return (
                <PressableFeedback
                  key={entry.starts_at}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatTime(entry.starts_at)}${
                    entry.available ? '' : ' unavailable'
                  }`}
                  accessibilityState={{ selected, disabled: !entry.available }}
                  isDisabled={!entry.available}
                  onPress={() => {
                    tapSelection();
                    setSlot(entry);
                  }}
                >
                  <View
                    className={cn(
                      'min-h-11 w-[104px] items-center justify-center rounded-xl border py-2.5',
                      selected
                        ? 'bg-accent border-accent'
                        : entry.available
                          ? 'border-border bg-surface'
                          : 'border-border bg-surface-secondary',
                    )}
                  >
                    <Text.Paragraph
                      type="body-sm"
                      weight={selected ? 'semibold' : 'normal'}
                      className={
                        selected
                          ? 'text-accent-foreground'
                          : entry.available
                            ? 'text-foreground'
                            : 'text-muted line-through'
                      }
                    >
                      {formatTime(entry.starts_at)}
                    </Text.Paragraph>
                  </View>
                </PressableFeedback>
              );
            })}
          </View>
        )}
      </View>

      <View className="gap-3 px-5">
        <TextField>
          <Label>Reason for the visit</Label>
          <Input
            value={reason}
            placeholder="e.g. acidity and disturbed sleep"
            onChangeText={setReason}
          />
        </TextField>

        {confirmation ? (
          <Surface tone="accent" className="gap-2">
            <Text.Paragraph type="body-sm" weight="semibold" className="text-bark">
              Appointment confirmed
            </Text.Paragraph>
            <Text.Paragraph type="body-xs" className="text-bark">
              {confirmation}. It is now on the clinic calendar and your doctor&apos;s roster.
            </Text.Paragraph>
            <View className="mt-1 flex-row gap-2">
              <Button
                size="sm"
                variant="secondary"
                onPress={() => router.push('/(patient)/(tabs)/records')}
              >
                <Button.Label>View in Records</Button.Label>
              </Button>
            </View>
          </Surface>
        ) : null}

        {error ? (
          <Text.Paragraph type="body-sm" className="text-danger" accessibilityLiveRegion="polite">
            {error}
          </Text.Paragraph>
        ) : null}
      </View>
    </Screen>
  );
}
