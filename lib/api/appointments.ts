import { db, delay, findPatient, newId, profileName } from '@/lib/mock/db';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  BookingSlot,
  Patient,
  RosterEntry,
} from '@/lib/types';

const SLOT_MINUTES = 30;

function sameDay(isoDate: string, ymd: string): boolean {
  const date = new Date(isoDate);
  const local = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  return local === ymd;
}

/** Chronological consultations and therapies for one practitioner on one day. */
export async function fetchRoster(doctorId: string, date: string): Promise<RosterEntry[]> {
  const entries = db.appointments
    .filter(
      (appointment) => appointment.doctor_id === doctorId && sameDay(appointment.starts_at, date),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .flatMap((appointment) => {
      const patient = findPatient(appointment.patient_id);
      return patient ? [{ appointment, patient }] : [];
    });

  return delay(entries);
}

export interface AppointmentDetail {
  appointment: Appointment;
  patient: Patient;
  doctorName: string;
}

export async function fetchAppointment(id: string): Promise<AppointmentDetail | null> {
  const appointment = db.appointments.find((entry) => entry.id === id);
  const patient = appointment ? findPatient(appointment.patient_id) : null;
  if (!appointment || !patient) return delay(null, 200);

  return delay({ appointment, patient, doctorName: profileName(appointment.doctor_id) }, 200);
}

export interface PatientAppointment {
  appointment: Appointment;
  doctorName: string;
}

export async function fetchPatientAppointments(patientId: string): Promise<PatientAppointment[]> {
  const entries = db.appointments
    .filter((appointment) => appointment.patient_id === patientId)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
    .map((appointment) => ({ appointment, doctorName: profileName(appointment.doctor_id) }));

  return delay(entries);
}

/** Live availability for the clinic calendar, honouring hours and breaks. */
export async function fetchSlots(doctorId: string, date: string): Promise<BookingSlot[]> {
  const { opening_hour, closing_hour, break_window, closed_weekdays } = db.clinic;
  const [year, month, day] = date.split('-').map(Number);
  const base = new Date(year, month - 1, day);

  if (closed_weekdays.includes(base.getDay())) return delay([]);

  const taken = db.appointments.filter(
    (appointment) =>
      appointment.doctor_id === doctorId &&
      sameDay(appointment.starts_at, date) &&
      appointment.status !== 'cancelled',
  );

  const slots: BookingSlot[] = [];
  const now = Date.now();

  for (let hour = opening_hour; hour < closing_hour; hour += 1) {
    if (hour >= break_window[0] && hour < break_window[1]) continue;

    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      const start = new Date(year, month - 1, day, hour, minute, 0, 0);
      const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
      const clash = taken.some((appointment) => {
        const takenStart = new Date(appointment.starts_at).getTime();
        const takenEnd = new Date(appointment.ends_at).getTime();
        return start.getTime() < takenEnd && end.getTime() > takenStart;
      });

      slots.push({
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        available: !clash && start.getTime() > now,
      });
    }
  }

  return delay(slots);
}

export interface BookAppointmentInput {
  patientId: string;
  doctorId: string;
  startsAt: string;
  endsAt: string;
  type: AppointmentType;
  reason: string;
  bookedBy: Appointment['booked_by'];
}

/** The clash check below has to move server-side before this goes live. */
export async function bookAppointment(input: BookAppointmentInput): Promise<Appointment> {
  const clash = db.appointments.some(
    (appointment) =>
      appointment.doctor_id === input.doctorId &&
      appointment.status !== 'cancelled' &&
      new Date(input.startsAt).getTime() < new Date(appointment.ends_at).getTime() &&
      new Date(input.endsAt).getTime() > new Date(appointment.starts_at).getTime(),
  );

  if (clash) {
    throw new Error('That slot was just taken. Please pick another time.');
  }

  const appointment: Appointment = {
    id: newId('appt'),
    clinic_id: db.clinic.id,
    patient_id: input.patientId,
    doctor_id: input.doctorId,
    room: null,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    type: input.type,
    status: 'scheduled',
    reason: input.reason.trim() || 'Consultation',
    booked_by: input.bookedBy,
    notes: null,
    created_at: new Date().toISOString(),
  };

  db.appointments.push(appointment);
  return delay(appointment, 380);
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const appointment = db.appointments.find((entry) => entry.id === appointmentId);
  if (!appointment) throw new Error('That appointment could not be found.');

  appointment.status = status;
  return delay(appointment, 220);
}

export async function saveAppointmentNote(
  appointmentId: string,
  notes: string,
): Promise<Appointment> {
  const appointment = db.appointments.find((entry) => entry.id === appointmentId);
  if (!appointment) throw new Error('That appointment could not be found.');

  appointment.notes = notes.trim() || null;
  return delay(appointment, 220);
}
