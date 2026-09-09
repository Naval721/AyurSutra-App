import { FORMULARY } from '@/lib/mock/formulary';
import { db, delay, findPatient, newId, profileName } from '@/lib/mock/db';
import type { FormularyEntry, Prescription, PrescriptionItem } from '@/lib/types';

export interface PrescriptionRecord {
  prescription: Prescription;
  patientName: string;
  doctorName: string;
}

function decorate(prescription: Prescription): PrescriptionRecord {
  return {
    prescription,
    patientName: findPatient(prescription.patient_id)?.full_name ?? 'Unknown patient',
    doctorName: profileName(prescription.doctor_id),
  };
}

export async function fetchPrescriptionsByDoctor(doctorId: string): Promise<PrescriptionRecord[]> {
  const records = db.prescriptions
    .filter((prescription) => prescription.doctor_id === doctorId)
    .sort((a, b) => b.issued_at.localeCompare(a.issued_at))
    .map(decorate);

  return delay(records);
}

export async function fetchPrescriptionsByPatient(
  patientId: string,
): Promise<PrescriptionRecord[]> {
  const records = db.prescriptions
    .filter((prescription) => prescription.patient_id === patientId)
    .sort((a, b) => b.issued_at.localeCompare(a.issued_at))
    .map(decorate);

  return delay(records);
}

export async function fetchPrescription(id: string): Promise<PrescriptionRecord | null> {
  const prescription = db.prescriptions.find((entry) => entry.id === id);
  return delay(prescription ? decorate(prescription) : null);
}

export interface CreatePrescriptionInput {
  patientId: string;
  doctorId: string;
  items: Omit<PrescriptionItem, 'id'>[];
  pathya: string;
  apathya: string;
  notes: string | null;
}

export async function createPrescription(
  input: CreatePrescriptionInput,
): Promise<PrescriptionRecord> {
  if (input.items.length === 0) {
    throw new Error('Add at least one medicine before issuing the prescription.');
  }

  const prescription: Prescription = {
    id: newId('rx'),
    clinic_id: db.clinic.id,
    patient_id: input.patientId,
    doctor_id: input.doctorId,
    issued_at: new Date().toISOString(),
    items: input.items.map((item) => ({ ...item, id: newId('rx-item') })),
    pathya: input.pathya.trim(),
    apathya: input.apathya.trim(),
    notes: input.notes?.trim() || null,
    status: 'active',
  };

  db.prescriptions.unshift(prescription);
  return delay(decorate(prescription), 420);
}

export async function markPrescriptionCompleted(id: string): Promise<Prescription> {
  const prescription = db.prescriptions.find((entry) => entry.id === id);
  if (!prescription) throw new Error('That prescription could not be found.');

  prescription.status = 'completed';
  return delay(prescription, 220);
}

/** Searches the bundled formulary; the clinic's own catalogue replaces it later. */
export async function searchFormulary(search: string): Promise<FormularyEntry[]> {
  const term = search.trim().toLowerCase();
  const matches = FORMULARY.filter((entry) => {
    if (!term) return true;
    return (
      entry.name.toLowerCase().includes(term) ||
      entry.category.toLowerCase().includes(term) ||
      entry.indications.some((indication) => indication.toLowerCase().includes(term))
    );
  });

  return delay(matches, 180);
}
