import { db, delay, newId } from '@/lib/mock/db';
import type { DailyLog, DinacharyaState, Rating } from '@/lib/types';

/** All Dinacharya habits unchecked: the starting point for a new day. */
export function emptyDinacharya(): DinacharyaState {
  return {
    wake_early: false,
    oil_pulling: false,
    abhyanga: false,
    yoga: false,
    warm_meals: false,
    early_dinner: false,
    sleep_early: false,
  };
}

export async function fetchLogs(patientId: string): Promise<DailyLog[]> {
  const logs = db.dailyLogs
    .filter((log) => log.patient_id === patientId)
    .sort((a, b) => b.log_date.localeCompare(a.log_date));

  return delay(logs);
}

export async function fetchLog(patientId: string, date: string): Promise<DailyLog | null> {
  const log = db.dailyLogs.find(
    (entry) => entry.patient_id === patientId && entry.log_date === date,
  );
  return delay(log ?? null, 200);
}

export interface SaveLogInput {
  patientId: string;
  logDate: string;
  digestion: Rating;
  sleepHours: number;
  sleepQuality: Rating;
  energy: Rating;
  mood: Rating;
  bowel: DailyLog['bowel'];
  symptoms: string[];
  dinacharya: DinacharyaState;
  notes: string | null;
}

/** One log per patient per day: saving again updates the existing entry. */
export async function saveDailyLog(input: SaveLogInput): Promise<DailyLog> {
  const existing = db.dailyLogs.find(
    (entry) => entry.patient_id === input.patientId && entry.log_date === input.logDate,
  );

  const payload = {
    digestion: input.digestion,
    sleep_hours: input.sleepHours,
    sleep_quality: input.sleepQuality,
    energy: input.energy,
    mood: input.mood,
    bowel: input.bowel,
    symptoms: input.symptoms,
    dinacharya: input.dinacharya,
    notes: input.notes?.trim() || null,
  };

  if (existing) {
    Object.assign(existing, payload);
    return delay(existing, 300);
  }

  const log: DailyLog = {
    id: newId('log'),
    clinic_id: db.clinic.id,
    patient_id: input.patientId,
    log_date: input.logDate,
    created_at: new Date().toISOString(),
    ...payload,
  };

  db.dailyLogs.unshift(log);
  return delay(log, 300);
}

export interface DinacharyaProgress {
  completed: number;
  total: number;
}

export function dinacharyaProgress(log: DailyLog | null, total: number): DinacharyaProgress {
  if (!log) return { completed: 0, total };
  const completed = Object.values(log.dinacharya).filter(Boolean).length;
  return { completed, total };
}
