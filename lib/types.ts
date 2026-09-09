/**
 * AyurSutra shared data model.
 *
 * These types mirror the seven relational tables of the AyurSutra backend
 * (clinics, profiles, patients, appointments, prescriptions, treatments,
 * daily_logs). Field names use snake_case so the same shapes can be returned
 * straight from the real API once it is connected.
 */

export type Dosha = 'vata' | 'pitta' | 'kapha';

export type UserRole = 'admin' | 'doctor' | 'therapist' | 'patient';

export type PractitionerRole = Extract<UserRole, 'doctor' | 'therapist'>;

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  timezone: string;
  therapy_rooms: string[];
  opening_hour: number;
  closing_hour: number;
  /** Hours the clinic is closed midday, e.g. [13, 16] means 13:00–16:00 break. */
  break_window: [number, number];
  /** 0 = Sunday. Days the clinic does not operate. */
  closed_weekdays: number[];
}

export interface Profile {
  id: string;
  clinic_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  /** Doctors: specialisation. Therapists: therapy focus. */
  specialisation: string | null;
  qualification: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface DoshaScores {
  vata: number;
  pitta: number;
  kapha: number;
}

export interface PrakritiAssessment {
  id: string;
  assessed_on: string;
  /** Percentage split, sums to 100. */
  scores: DoshaScores;
  dominant: Dosha;
  /** Present when the top two doshas are close, e.g. "Vata-Pitta". */
  constitution: string;
  assessed_by: 'self' | 'practitioner';
  notes: string | null;
}

export type ClinicalNoteKind = 'nadi' | 'consultation' | 'observation';

export interface ClinicalNote {
  id: string;
  kind: ClinicalNoteKind;
  recorded_on: string;
  author_id: string;
  author_name: string;
  body: string;
  /** Nadi Pariksha only: which pulse qualities were felt. */
  nadi_findings?: {
    dominant: Dosha;
    rate_bpm: number;
    quality: string;
  };
}

export interface Patient {
  id: string;
  clinic_id: string;
  /** Links to the patient's login profile, null for walk-ins added by staff. */
  profile_id: string | null;
  full_name: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  phone: string;
  email: string | null;
  chief_complaint: string;
  allergies: string[];
  primary_doctor_id: string | null;
  prakriti_history: PrakritiAssessment[];
  clinical_notes: ClinicalNote[];
  created_at: string;
}

export type AppointmentType = 'consultation' | 'follow_up' | 'therapy';

export type AppointmentStatus =
  | 'scheduled'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  room: string | null;
  /** ISO 8601 timestamps. */
  starts_at: string;
  ends_at: string;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  booked_by: 'patient' | 'clinic';
  notes: string | null;
  created_at: string;
}

export interface PrescriptionItem {
  id: string;
  name: string;
  form: string;
  dosage: string;
  frequency: string;
  duration: string;
  /** The carrier the medicine is taken with (honey, warm water, ghee...). */
  anupana: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  issued_at: string;
  items: PrescriptionItem[];
  pathya: string;
  apathya: string;
  notes: string | null;
  status: 'active' | 'completed';
}

export type TreatmentStage = 'purva_karma' | 'pradhana_karma' | 'paschat_karma';

export type SessionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface TreatmentSession {
  id: string;
  /** 1-based day within the protocol. */
  day: number;
  date: string;
  stage: TreatmentStage;
  therapy_name: string;
  therapist_id: string | null;
  room: string | null;
  duration_min: number;
  status: SessionStatus;
  notes: string | null;
}

export interface Treatment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  protocol_name: string;
  /** e.g. Virechana, Vamana, Basti, Nasya, Raktamokshana. */
  karma: string;
  start_date: string;
  total_days: number;
  status: 'planned' | 'active' | 'completed' | 'paused';
  goal: string;
  sessions: TreatmentSession[];
  created_at: string;
}

export type Rating = 1 | 2 | 3 | 4 | 5;

export const DINACHARYA_ITEMS = [
  { key: 'wake_early', label: 'Woke before sunrise' },
  { key: 'oil_pulling', label: 'Gandusha / oil pulling' },
  { key: 'abhyanga', label: 'Self abhyanga' },
  { key: 'yoga', label: 'Yoga or pranayama' },
  { key: 'warm_meals', label: 'Warm cooked meals only' },
  { key: 'early_dinner', label: 'Dinner before sunset' },
  { key: 'sleep_early', label: 'Asleep by 10 pm' },
] as const;

export type DinacharyaKey = (typeof DINACHARYA_ITEMS)[number]['key'];

export type DinacharyaState = Record<DinacharyaKey, boolean>;

export interface DailyLog {
  id: string;
  clinic_id: string;
  patient_id: string;
  /** yyyy-MM-dd */
  log_date: string;
  digestion: Rating;
  sleep_hours: number;
  sleep_quality: Rating;
  energy: Rating;
  mood: Rating;
  bowel: 'regular' | 'sluggish' | 'loose' | 'irregular';
  symptoms: string[];
  dinacharya: DinacharyaState;
  notes: string | null;
  created_at: string;
}

/** A treatment session flattened with the context a therapist needs. */
export interface TherapistTask {
  session: TreatmentSession;
  treatment: Treatment;
  patient: Patient;
}

export interface RosterEntry {
  appointment: Appointment;
  patient: Patient;
}

export interface BookingSlot {
  starts_at: string;
  ends_at: string;
  available: boolean;
}

export interface FormularyEntry {
  id: string;
  name: string;
  form: string;
  category: string;
  indications: string[];
  default_dosage: string;
  default_frequency: string;
  default_anupana: string;
}

export interface AuthSession {
  profile: Profile;
  /** Present only for role === 'patient'. */
  patient: Patient | null;
  clinic: Clinic;
}
