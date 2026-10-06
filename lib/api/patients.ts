import { db, delay, findPatient, newId } from '@/lib/mock/db';
import type { ClinicalNote, Dosha, DoshaScores, Patient } from '@/lib/types';

export interface PatientSummary {
  patient: Patient;
  activeTreatmentName: string | null;
  nextVisit: string | null;
  dominantDosha: Dosha | null;
  constitution: string | null;
}

function summarise(patient: Patient): PatientSummary {
  const treatment = db.treatments.find(
    (entry) => entry.patient_id === patient.id && entry.status === 'active',
  );
  const now = Date.now();
  const upcoming = db.appointments
    .filter(
      (entry) =>
        entry.patient_id === patient.id &&
        (entry.status === 'scheduled' ||
          entry.status === 'checked_in' ||
          entry.status === 'in_progress') &&
        new Date(entry.ends_at).getTime() >= now,
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  const latest = patient.prakriti_history.at(-1) ?? null;

  return {
    patient,
    activeTreatmentName: treatment?.protocol_name ?? null,
    nextVisit: upcoming?.starts_at ?? null,
    dominantDosha: latest?.dominant ?? null,
    constitution: latest?.constitution ?? null,
  };
}

/** Filters in memory for now; belongs in a query param once there is a server. */
export async function fetchPatients(search: string): Promise<PatientSummary[]> {
  const term = search.trim().toLowerCase();
  const matches = db.patients.filter((patient) => {
    if (!term) return true;
    return (
      patient.full_name.toLowerCase().includes(term) ||
      patient.chief_complaint.toLowerCase().includes(term) ||
      patient.phone.includes(term)
    );
  });

  const sorted = [...matches].sort((a, b) => a.full_name.localeCompare(b.full_name));
  return delay(sorted.map(summarise));
}

export async function fetchPatient(patientId: string): Promise<PatientSummary | null> {
  const patient = findPatient(patientId);
  return delay(patient ? summarise(patient) : null);
}

export interface AddNoteInput {
  patientId: string;
  authorId: string;
  authorName: string;
  kind: ClinicalNote['kind'];
  body: string;
  nadiFindings?: {
    dominant: Dosha;
    rate_bpm: number;
    quality: string;
  };
}

export async function addClinicalNote(input: AddNoteInput): Promise<ClinicalNote> {
  const patient = findPatient(input.patientId);
  if (!patient) throw new Error('That patient record could not be found.');

  const note: ClinicalNote = {
    id: newId('note'),
    kind: input.kind,
    recorded_on: new Date().toISOString().slice(0, 10),
    author_id: input.authorId,
    author_name: input.authorName,
    body: input.body.trim(),
    nadi_findings: input.nadiFindings,
  };

  patient.clinical_notes = [note, ...patient.clinical_notes];
  return delay(note, 260);
}

export interface SavePrakritiInput {
  patientId: string;
  scores: DoshaScores;
  dominant: Dosha;
  constitution: string;
  assessedBy: 'self' | 'practitioner';
  notes?: string | null;
}

export async function savePrakritiAssessment(input: SavePrakritiInput): Promise<Patient> {
  const patient = findPatient(input.patientId);
  if (!patient) throw new Error('That patient record could not be found.');

  patient.prakriti_history = [
    ...patient.prakriti_history,
    {
      id: newId('prakriti'),
      assessed_on: new Date().toISOString().slice(0, 10),
      scores: input.scores,
      dominant: input.dominant,
      constitution: input.constitution,
      assessed_by: input.assessedBy,
      notes: input.notes ?? null,
    },
  ];

  return delay(patient, 300);
}
