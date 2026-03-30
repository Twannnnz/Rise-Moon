import type { PhaseId } from "@/lib/phases";

export type PlayerId = "YOU" | "MOON";

export type Card = {
  uid: string;
  phase: PhaseId;
};

export type GameState = {
  levelId: number;
  turn: number;
  maxTurn: number;

  deck: Card[];
  youHand: Card[];
  moonHand: Card[];

  youScore: number;
  moonScore: number;

  selected: number[];

  lastMove?: {
    by: PlayerId;
    chain: Card[];
    points: number;
  };

  log: { t: number; who: PlayerId; msg: string }[];

  gameOver: boolean;
  winner?: "YOU" | "MOON" | "DRAW";
};