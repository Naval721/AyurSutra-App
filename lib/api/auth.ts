import { db, delay, findPatient, newId } from '@/lib/mock/db';
import type { AuthSession, Patient, Profile, UserRole } from '@/lib/types';

export interface DemoAccount {
  email: string;
  role: UserRole;
  roleLabel: string;
  name: string;
  description: string;
}

/** Password the seeded accounts sign in with. Development shortcut only. */
export const DEMO_PASSWORD = 'ayursutra';

/** Listed on the sign-in screen under __DEV__ so any role can be opened quickly. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'doctor@ayursutra.in',
    role: 'doctor',
    roleLabel: 'Doctor',
    name: 'Dr. Anand Kulkarni',
    description: 'Roster, patients, prescriptions',
  },
  {
    email: 'therapist@ayursutra.in',
    role: 'therapist',
    roleLabel: 'Therapist',
    name: 'Ravi Shankar',
    description: 'Panchakarma task checklist',
  },
  {
    email: 'patient@ayursutra.in',
    role: 'patient',
    roleLabel: 'Patient',
    name: 'Ananya Rao',
    description: 'Dinacharya, booking, symptom log',
  },
];

export class AuthError extends Error {}

function sessionFor(profile: Profile): AuthSession {
  const patient =
    profile.role === 'patient'
      ? (db.patients.find((entry) => entry.profile_id === profile.id) ?? null)
      : null;

  return { profile, patient, clinic: db.clinic };
}

/**
 * Accepts any password of 4+ characters for a known email, so every role can be
 * opened while the clinic's identity provider is not wired up yet.
 */
export async function signIn(email: string, password: string): Promise<AuthSession> {
  await delay(null, 420);
  const normalised = email.trim().toLowerCase();

  if (!normalised || !password.trim()) {
    throw new AuthError('Enter your email and password to continue.');
  }

  const profile = db.profiles.find((entry) => entry.email.toLowerCase() === normalised);
  if (!profile) {
    throw new AuthError('We could not find an account with that email.');
  }
  if (password.trim().length < 4) {
    throw new AuthError('Your password should be at least 4 characters.');
  }

  return sessionFor(profile);
}

export interface SignUpInput {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  age: number;
  gender: Patient['gender'];
  chief_complaint: string;
}

/** Patient self-registration: creates the profile and its patient record. */
export async function signUp(input: SignUpInput): Promise<AuthSession> {
  await delay(null, 480);
  const normalised = input.email.trim().toLowerCase();

  if (db.profiles.some((entry) => entry.email.toLowerCase() === normalised)) {
    throw new AuthError('An account already exists with this email. Try signing in.');
  }

  const now = new Date().toISOString();
  const profile: Profile = {
    id: newId('profile'),
    clinic_id: db.clinic.id,
    full_name: input.full_name.trim(),
    email: normalised,
    phone: input.phone.trim(),
    role: 'patient',
    specialisation: null,
    qualification: null,
    avatar_url: null,
    created_at: now,
  };

  const patient: Patient = {
    id: newId('patient'),
    clinic_id: db.clinic.id,
    profile_id: profile.id,
    full_name: profile.full_name,
    age: input.age,
    gender: input.gender,
    phone: profile.phone,
    email: profile.email,
    chief_complaint: input.chief_complaint.trim() || 'General wellness',
    allergies: [],
    primary_doctor_id: db.profiles.find((entry) => entry.role === 'doctor')?.id ?? null,
    prakriti_history: [],
    clinical_notes: [],
    created_at: now,
  };

  db.profiles.push(profile);
  db.patients.push(patient);

  return sessionFor(profile);
}

/** Rehydrates a persisted session against the current records. */
export async function restoreSession(profileId: string): Promise<AuthSession | null> {
  await delay(null, 120);
  const profile = db.profiles.find((entry) => entry.id === profileId);
  return profile ? sessionFor(profile) : null;
}

export async function fetchStaff(): Promise<Profile[]> {
  return delay(db.profiles.filter((profile) => profile.role !== 'patient'));
}

export async function fetchPatientProfileRecord(patientId: string): Promise<Patient | null> {
  return delay(findPatient(patientId) ?? null);
}
