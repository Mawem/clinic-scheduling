import type { Appointment, ExamType } from "@clinic-scheduling/domain";
import { EXAM_TYPES, toMinutes, toTimeString } from "@clinic-scheduling/domain";
import { CLINICS, PATIENT_POOL, SONOGRAPHERS } from "./fixtures";

/**
 * In-memory backing store for the mock REST API. Any date that gets requested
 * is lazily seeded with a deterministic schedule (same date -> same data), so
 * the demo always has content no matter which day the user navigates to.
 */
const appointments = new Map<string, Appointment>();
const seededDates = new Set<string>();
let idCounter = 0;

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)]!;
}

export function nextId(): string {
  return `appt-${++idCounter}`;
}

function seedDate(date: string): void {
  if (seededDates.has(date)) return;
  seededDates.add(date);
  const rand = mulberry32(hashString(date));

  for (const sonographer of SONOGRAPHERS) {
    // Each sonographer covers one clinic per day, mirroring field assignments.
    const clinic = pick(CLINICS, rand);
    let cursor = toMinutes(clinic.opensAt) + pick([0, 30, 60], rand);
    const target = 2 + Math.floor(rand() * 3);

    for (let i = 0; i < target; i++) {
      const duration = pick([30, 30, 45, 60], rand);
      if (cursor + duration > toMinutes(clinic.closesAt)) break;
      const appointment: Appointment = {
        id: nextId(),
        patientName: pick(PATIENT_POOL, rand),
        examType: pick(EXAM_TYPES, rand) as ExamType,
        clinicId: clinic.id,
        sonographerId: sonographer.id,
        date,
        start: toTimeString(cursor),
        end: toTimeString(cursor + duration),
      };
      appointments.set(appointment.id, appointment);
      cursor += duration + pick([15, 30, 45, 90], rand);
    }
  }
}

export function listByDate(date: string): Appointment[] {
  seedDate(date);
  return [...appointments.values()]
    .filter((a) => a.date === date)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

export function getById(id: string): Appointment | undefined {
  return appointments.get(id);
}

export function insert(appointment: Appointment): Appointment {
  appointments.set(appointment.id, appointment);
  return appointment;
}

export function update(id: string, patch: Partial<Appointment>): Appointment | undefined {
  const current = appointments.get(id);
  if (!current) return undefined;
  const next = { ...current, ...patch, id };
  appointments.set(id, next);
  return next;
}

export function remove(id: string): boolean {
  return appointments.delete(id);
}

/** Test hook: wipe all state so each test starts from a clean store. */
export function resetDb(): void {
  appointments.clear();
  seededDates.clear();
  idCounter = 0;
}
