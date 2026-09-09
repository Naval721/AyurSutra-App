import { Chip } from 'heroui-native';
import type { ChipColor, ChipSize } from 'heroui-native';

import type { AppointmentStatus, SessionStatus, Treatment } from '@/lib/types';

type ChipTone = { label: string; color: ChipColor };

const APPOINTMENT: Record<AppointmentStatus, ChipTone> = {
  scheduled: { label: 'Scheduled', color: 'default' },
  checked_in: { label: 'Checked in', color: 'accent' },
  in_progress: { label: 'In session', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'danger' },
  no_show: { label: 'No show', color: 'danger' },
};

const SESSION: Record<SessionStatus, ChipTone> = {
  pending: { label: 'Pending', color: 'default' },
  in_progress: { label: 'In progress', color: 'warning' },
  completed: { label: 'Done', color: 'success' },
  skipped: { label: 'Skipped', color: 'danger' },
};

const TREATMENT: Record<Treatment['status'], ChipTone> = {
  planned: { label: 'Planned', color: 'default' },
  active: { label: 'Active', color: 'accent' },
  completed: { label: 'Completed', color: 'success' },
  paused: { label: 'Paused', color: 'warning' },
};

const PRESCRIPTION: Record<'active' | 'completed', ChipTone> = {
  active: { label: 'Active', color: 'accent' },
  completed: { label: 'Completed', color: 'success' },
};

export type StatusChipProps =
  | { kind: 'appointment'; status: AppointmentStatus; size?: ChipSize }
  | { kind: 'session'; status: SessionStatus; size?: ChipSize }
  | { kind: 'treatment'; status: Treatment['status']; size?: ChipSize }
  | { kind: 'prescription'; status: 'active' | 'completed'; size?: ChipSize };

function resolve(props: StatusChipProps): ChipTone {
  switch (props.kind) {
    case 'appointment':
      return APPOINTMENT[props.status];
    case 'session':
      return SESSION[props.status];
    case 'treatment':
      return TREATMENT[props.status];
    case 'prescription':
      return PRESCRIPTION[props.status];
    default: {
      const exhaustiveCheck: never = props;
      throw new Error(`Unhandled StatusChip kind: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}

/** Read-only status pill shared by roster, treatment and prescription lists. */
export function StatusChip(props: StatusChipProps) {
  const { label, color } = resolve(props);

  return (
    <Chip variant="soft" color={color} size={props.size ?? 'sm'} disabled>
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
}
