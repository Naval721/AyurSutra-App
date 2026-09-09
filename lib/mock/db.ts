import {
  SEED_APPOINTMENTS,
  SEED_CLINIC,
  SEED_DAILY_LOGS,
  SEED_PATIENTS,
  SEED_PRESCRIPTIONS,
  SEED_PROFILES,
  SEED_TREATMENTS,
} from '@/lib/mock/seed';
import type {
  Appointment,
  Clinic,
  DailyLog,
  Patient,
  Prescription,
  Profile,
  Treatment,
} from '@/lib/types';

/**
 * In-memory store standing in for the clinic backend. Mutations live for the
 * lifetime of the JS runtime, which is enough to exercise every screen.
 */
interface Database {
  clinic: Clinic;
  profiles: Profile[];
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  treatments: Treatment[];
  dailyLogs: DailyLog[];
}

function clone<T>(value: T): T {
  const json: string = JSON.stringify(value);
  return JSON.parse(json);
}

export const db: Database = {
  clinic: clone(SEED_CLINIC),
  profiles: clone(SEED_PROFILES),
  patients: clone(SEED_PATIENTS),
  appointments: clone(SEED_APPOINTMENTS),
  prescriptions: clone(SEED_PRESCRIPTIONS),
  treatments: clone(SEED_TREATMENTS),
  dailyLogs: clone(SEED_DAILY_LOGS),
};

let counter = 1000;

/** Stable-enough id generator for locally created records. */
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** Simulates the round trip so loading and error states are exercised. */
export function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(clone(value)), ms);
  });
}

export function findProfile(id: string): Profile | undefined {
  return db.profiles.find((profile) => profile.id === id);
}

export function findPatient(id: string): Patient | undefined {
  return db.patients.find((patient) => patient.id === id);
}

export function profileName(id: string | null): string {
  if (!id) return 'Unassigned';
  return findProfile(id)?.full_name ?? 'Unassigned';
}
