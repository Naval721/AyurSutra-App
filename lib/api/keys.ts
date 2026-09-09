/** Central React Query key factory so mutations can invalidate precisely. */
export const queryKeys = {
  clinic: ['clinic'] as const,
  staff: ['staff'] as const,
  roster: (doctorId: string, date: string) => ['roster', doctorId, date] as const,
  patients: (search: string) => ['patients', search] as const,
  patient: (patientId: string) => ['patient', patientId] as const,
  patientAppointments: (patientId: string) => ['patient-appointments', patientId] as const,
  appointment: (id: string) => ['appointment', id] as const,
  prescriptionsByDoctor: (doctorId: string) => ['prescriptions', 'doctor', doctorId] as const,
  prescriptionsByPatient: (patientId: string) => ['prescriptions', 'patient', patientId] as const,
  prescription: (id: string) => ['prescription', id] as const,
  therapistTasks: (therapistId: string, date: string) =>
    ['therapist-tasks', therapistId, date] as const,
  treatment: (id: string) => ['treatment', id] as const,
  treatmentsByPatient: (patientId: string) => ['treatments', 'patient', patientId] as const,
  slots: (doctorId: string, date: string) => ['slots', doctorId, date] as const,
  logs: (patientId: string) => ['logs', patientId] as const,
  log: (patientId: string, date: string) => ['log', patientId, date] as const,
  formulary: (search: string) => ['formulary', search] as const,
};
