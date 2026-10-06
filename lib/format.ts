import { format, isSameDay, isToday, isTomorrow, parseISO } from 'date-fns';

import type { AppointmentType, TreatmentStage } from '@/lib/types';

/** yyyy-MM-dd key used across the API layer. */
export function toYmd(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromYmd(ymd: string): Date {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'h:mm a');
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

export function formatDateLong(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'EEEE, d MMMM');
}

export function formatDateShort(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'd MMM yyyy');
}

/** "Today", "Tomorrow", else "Mon 14 Apr". */
export function formatRelativeDay(value: string | Date): string {
  const date =
    typeof value === 'string' ? (value.length === 10 ? fromYmd(value) : parseISO(value)) : value;
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE d MMM');
}

export function isSameYmd(iso: string, ymd: string): boolean {
  return isSameDay(parseISO(iso), fromYmd(ymd));
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const APPOINTMENT_TYPE_LABEL: Record<AppointmentType, string> = {
  consultation: 'Consultation',
  follow_up: 'Follow-up',
  therapy: 'Therapy',
};

export const TREATMENT_STAGE_LABEL: Record<TreatmentStage, string> = {
  purva_karma: 'Purva Karma',
  pradhana_karma: 'Pradhana Karma',
  paschat_karma: 'Paschat Karma',
};

export function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

export function formatHourRange(startHour: number, endHour: number): string {
  return `${formatHour(startHour)} – ${formatHour(endHour)}`;
}

export function titleCase(value: string): string {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
