import { View } from 'react-native';
import { PressableFeedback, Text } from 'heroui-native';
import { ChevronRight } from 'lucide-react-native';

import { StatusChip } from '@/components/ui/StatusChip';
import { Surface } from '@/components/ui/Surface';
import { APPOINTMENT_TYPE_LABEL, formatTime } from '@/lib/format';
import { BRAND_HEX } from '@/lib/theme';
import type { Appointment, Patient } from '@/lib/types';

export interface AppointmentCardProps {
  appointment: Appointment;
  /** Practitioner view passes the patient, patient view passes the doctor name. */
  patient?: Patient;
  personName?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

export function AppointmentCard({
  appointment,
  patient,
  personName,
  onPress,
  showChevron = true,
}: AppointmentCardProps) {
  const name = patient?.full_name ?? personName ?? 'Appointment';
  const dimmed = appointment.status === 'cancelled' || appointment.status === 'no_show';

  const body = (
    <Surface className="flex-row items-center gap-3">
      <View className="border-border w-[74px] border-r pr-3">
        <Text.Paragraph type="body-sm" weight="semibold" className="text-foreground">
          {formatTime(appointment.starts_at)}
        </Text.Paragraph>
        <Text.Paragraph type="body-xs" color="muted">
          {formatTime(appointment.ends_at)}
        </Text.Paragraph>
      </View>

      <View className="flex-1 gap-1">
        <Text.Paragraph weight="semibold" className="text-foreground" numberOfLines={1}>
          {name}
        </Text.Paragraph>
        <Text.Paragraph type="body-xs" color="muted" numberOfLines={1}>
          {APPOINTMENT_TYPE_LABEL[appointment.type]}
          {appointment.room ? ` · ${appointment.room}` : ''} · {appointment.reason}
        </Text.Paragraph>
        <View className="mt-1 flex-row">
          <StatusChip kind="appointment" status={appointment.status} />
        </View>
      </View>

      {showChevron ? <ChevronRight color={BRAND_HEX.barkSoft} size={18} /> : null}
    </Surface>
  );

  const wrapped = <View style={dimmed ? { opacity: 0.55 } : undefined}>{body}</View>;

  if (!onPress) return wrapped;

  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`Open ${name}`}
      onPress={onPress}
    >
      {wrapped}
    </PressableFeedback>
  );
}
