import { db, delay, findPatient, profileName } from '@/lib/mock/db';
import type { SessionStatus, TherapistTask, Treatment, TreatmentSession } from '@/lib/types';

export interface TreatmentRecord {
  treatment: Treatment;
  patientName: string;
  doctorName: string;
  completedSessions: number;
}

function decorate(treatment: Treatment): TreatmentRecord {
  return {
    treatment,
    patientName: findPatient(treatment.patient_id)?.full_name ?? 'Unknown patient',
    doctorName: profileName(treatment.doctor_id),
    completedSessions: treatment.sessions.filter((session) => session.status === 'completed')
      .length,
  };
}

/** A therapist's checklist: every session assigned to them on a given day. */
export async function fetchTherapistTasks(
  therapistId: string,
  date: string,
): Promise<TherapistTask[]> {
  const tasks: TherapistTask[] = [];

  for (const treatment of db.treatments) {
    if (treatment.status === 'completed') continue;
    const patient = findPatient(treatment.patient_id);
    if (!patient) continue;

    for (const session of treatment.sessions) {
      if (session.date !== date || session.therapist_id !== therapistId) continue;
      tasks.push({ session, treatment, patient });
    }
  }

  tasks.sort((a, b) => a.session.therapy_name.localeCompare(b.session.therapy_name));
  return delay(tasks);
}

export async function fetchTreatment(id: string): Promise<TreatmentRecord | null> {
  const treatment = db.treatments.find((entry) => entry.id === id);
  return delay(treatment ? decorate(treatment) : null);
}

export async function fetchTreatmentsByPatient(patientId: string): Promise<TreatmentRecord[]> {
  const records = db.treatments
    .filter((treatment) => treatment.patient_id === patientId)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map(decorate);

  return delay(records);
}

export interface UpdateSessionInput {
  treatmentId: string;
  sessionId: string;
  status: SessionStatus;
  notes?: string | null;
}

export async function updateTreatmentSession(input: UpdateSessionInput): Promise<TreatmentSession> {
  const treatment = db.treatments.find((entry) => entry.id === input.treatmentId);
  if (!treatment) throw new Error('That treatment could not be found.');

  const session = treatment.sessions.find((entry) => entry.id === input.sessionId);
  if (!session) throw new Error('That session could not be found.');

  session.status = input.status;
  if (input.notes !== undefined) session.notes = input.notes?.trim() || null;

  const allDone = treatment.sessions.every(
    (entry) => entry.status === 'completed' || entry.status === 'skipped',
  );
  if (allDone) treatment.status = 'completed';

  return delay(session, 240);
}
