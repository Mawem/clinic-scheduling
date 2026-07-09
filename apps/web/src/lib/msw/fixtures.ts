import type { Clinic, Sonographer } from "@clinic-scheduling/domain";

export const CLINICS: Clinic[] = [
  { id: "downtown", name: "Downtown Imaging Center", opensAt: "08:00", closesAt: "17:00" },
  { id: "westside", name: "Westside Women's Health", opensAt: "07:00", closesAt: "15:00" },
  { id: "northgate", name: "Northgate Diagnostics", opensAt: "10:00", closesAt: "18:00" },
];

export const SONOGRAPHERS: Sonographer[] = [
  { id: "s-nguyen", name: "Alice Nguyen", credentials: "RDMS", colorIndex: 0 },
  { id: "s-webb", name: "Marcus Webb", credentials: "RDCS", colorIndex: 1 },
  { id: "s-sharma", name: "Priya Sharma", credentials: "RDMS, RVT", colorIndex: 2 },
  { id: "s-alvarez", name: "Diego Alvarez", credentials: "RVT", colorIndex: 3 },
];

export const PATIENT_POOL = [
  "Emma Thompson",
  "Liam Rodriguez",
  "Olivia Chen",
  "Noah Patel",
  "Ava Johnson",
  "Sofia Marchetti",
  "Ethan Brooks",
  "Mia Kowalski",
  "Lucas Freeman",
  "Isabella Reyes",
  "Grace O'Donnell",
  "Henry Nakamura",
];
