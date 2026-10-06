import { View } from 'react-native';
import { Text } from 'heroui-native';
import { ChevronRight } from 'lucide-react-native';

import { StatusChip } from '@/components/ui/StatusChip';
import { Surface } from '@/components/ui/Surface';
import { APPOINTMENT_TYPE_LABEL, formatRelativeDay, formatTime, initials } from '@/lib/format';
import { BRAND_HEX } from '@/lib/theme';
import type { Appointment, Patient } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface AppointmentCardProps {
  appointment: Appointment;
  /** Practitioner view passes the patient, patient view passes the doctor name. */
  patient?: Patient;
  personName?: string;
  onPress?: () => void;
  showChevron?: boolean;
  /** Displays relative date (e.g. Today, Tomorrow, Mon 14 Apr) above the time slot. */
  showDate?: boolean;
}

export function AppointmentCard({
  appointment,
  patient,
  personName,
  onPress,
  showChevron = true,
  showDate = false,
}: AppointmentCardProps) {
  const name = patient?.full_name ?? personName ?? 'Appointment';
  const dimmed = appointment.status === 'cancelled' || appointment.status === 'no_show';

  return (
    <Surface
      onPress={onPress}
      accessibilityLabel={`Open appointment with ${name}`}
      className={cn('flex-row items-center gap-3.5 p-3.5', dimmed && 'opacity-60')}
    >
      {/* Time & Date Column */}
      <View className={cn('border-border border-r pr-3', showDate ? 'w-[92px]' : 'w-[76px]')}>
        {showDate ? (
          <Text.Paragraph
            type="body-xs"
            weight="semibold"
            className="mb-0.5 text-amber-800"
            numberOfLines={1}
          >
            {formatRelativeDay(appointment.starts_at)}
          </Text.Paragraph>
        ) : null}
        <Text.Paragraph type="body-sm" weight="semibold" className="text-foreground">
          {formatTime(appointment.starts_at)}
        </Text.Paragraph>
        <Text.Paragraph type="body-xs" color="muted">
          {formatTime(appointment.ends_at)}
        </Text.Paragraph>
      </View>

      {/* Patient / Doctor Avatar Ring */}
      <View className="h-10 w-10 items-center justify-center rounded-full border border-amber-200/80 bg-amber-100">
        <Text.Paragraph type="body-xs" weight="bold" className="text-amber-900">
          {initials(name)}
        </Text.Paragraph>
      </View>

      {/* Details & Status */}
      <View className="flex-1 gap-0.5">
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

      {showChevron && onPress ? <ChevronRight color={BRAND_HEX.barkSoft} size={18} /> : null}
    </Surface>
  );
}
