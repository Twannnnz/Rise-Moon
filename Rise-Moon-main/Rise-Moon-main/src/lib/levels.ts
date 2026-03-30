export type LevelConfig = {
  id: number; // 1..20
  handSize: number;
  deckSize: number;
  maxTurn: number;
  ai: {
    lookahead: number; // 1..4
    greed: number; // 0..1
    denyWeight: number; // 0..1
  };
};

export const LEVELS: LevelConfig[] = Array.from({ length: 20 }, (_, i) => {
  const id = i + 1;

  // Basic ramp: bigger hand later, longer matches, deeper AI.
  const handSize = id < 6 ? 7 : id < 13 ? 8 : 9;
  const deckSize = 50 + id * 6; // 56..170
  const maxTurn = 14 + id; // 15..34

  // lookahead ramps (both depth + evaluation weights = "both")
  const lookahead = id < 6 ? 1 : id < 12 ? 2 : id < 17 ? 3 : 4;

  const greed = Math.min(0.35 + id * 0.02, 0.8);
  const denyWeight = Math.min(0.1 + id * 0.03, 0.85);

  return {
    id,
    handSize,
    deckSize,
    maxTurn,
    ai: { lookahead, greed, denyWeight }
  };
});