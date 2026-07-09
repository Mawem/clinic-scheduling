/** Times are "HH:mm" strings in clinic-local time; dates are "YYYY-MM-DD". */

export interface Clinic {
  id: string;
  name: string;
  /** Opening time, e.g. "08:00". */
  opensAt: string;
  /** Closing time, e.g. "17:00". Appointments must end at or before this. */
  closesAt: string;
}

export interface Sonographer {
  id: string;
  name: string;
  credentials: string;
  /** Stable hue used to color-code this sonographer's column and cards. */
  colorIndex: number;
}

export type ExamType =
  | "OB Ultrasound"
  | "Echocardiogram"
  | "Abdominal Ultrasound"
  | "Carotid Doppler"
  | "Thyroid Ultrasound"
  | "MSK Ultrasound";

export const EXAM_TYPES: ExamType[] = [
  "OB Ultrasound",
  "Echocardiogram",
  "Abdominal Ultrasound",
  "Carotid Doppler",
  "Thyroid Ultrasound",
  "MSK Ultrasound",
];

export interface Appointment {
  id: string;
  patientName: string;
  examType: ExamType;
  clinicId: string;
  sonographerId: string;
  date: string;
  start: string;
  end: string;
  notes?: string;
}

/** Everything needed to create or reschedule an appointment (id present when editing). */
export type AppointmentInput = Omit<Appointment, "id"> & { id?: string };

export type ValidationErrorCode =
  | "INVALID_TIME_RANGE"
  | "OUTSIDE_OPERATING_HOURS"
  | "DOUBLE_BOOKED"
  | "UNKNOWN_CLINIC";

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
}
