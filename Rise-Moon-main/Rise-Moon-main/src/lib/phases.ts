export type PhaseId =
  | "NEW"
  | "WAX_CRES"
  | "FIRST_Q"
  | "WAX_GIBB"
  | "FULL"
  | "WAN_GIBB"
  | "THIRD_Q"
  | "WAN_CRES";

export type Phase = {
  id: PhaseId;
  name: string;
  order: number; // 0..7
};

export const PHASES: Phase[] = [
  { id: "NEW", name: "New Moon", order: 0 },
  { id: "WAX_CRES", name: "Waxing Crescent", order: 1 },
  { id: "FIRST_Q", name: "First Quarter", order: 2 },
  { id: "WAX_GIBB", name: "Waxing Gibbous", order: 3 },
  { id: "FULL", name: "Full Moon", order: 4 },
  { id: "WAN_GIBB", name: "Waning Gibbous", order: 5 },
  { id: "THIRD_Q", name: "Third Quarter", order: 6 },
  { id: "WAN_CRES", name: "Waning Crescent", order: 7 }
];

export const phaseById = (id: PhaseId): Phase => {
  const p = PHASES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown phase id: ${id}`);
  return p;
};

export const nextPhaseId = (id: PhaseId): PhaseId => {
  const o = phaseById(id).order;
  const n = (o + 1) % 8;
  return PHASES[n]!.id;
};