import type { Card, GameState } from "./types";
import { bestValidChain, scoreChain } from "./rules";
import { nextPhaseId } from "@/lib/phases";
import type { LevelConfig } from "@/lib/levels";

type Move = { chain: Card[]; points: number; removeUids: Set<string> };

export function generateMoves(hand: Card[]): Move[] {
  const moves: Move[] = [];

  for (const start of hand) {
    const used = new Set<string>();
    const chain: Card[] = [start];
    used.add(start.uid);

    let cur = start;
    while (true) {
      const want = nextPhaseId(cur.phase);
      const nxt = hand.find((c) => !used.has(c.uid) && c.phase === want);
      if (!nxt) break;

      chain.push(nxt);
      used.add(nxt.uid);
      cur = nxt;

      if (chain.length >= 2) {
        const cpy = [...chain];
        moves.push({
          chain: cpy,
          points: scoreChain(cpy),
          removeUids: new Set(cpy.map((x) => x.uid))
        });
      }
    }
  }

  const best = bestValidChain(hand);
  if (best) {
    moves.push({
      chain: best,
      points: scoreChain(best),
      removeUids: new Set(best.map((x) => x.uid))
    });
  }

  // unique by remove-set signature
  const seen = new Set<string>();
  const uniq: Move[] = [];
  for (const m of moves) {
    const sig = [...m.removeUids].sort().join("|");
    if (seen.has(sig)) continue;
    seen.add(sig);
    uniq.push(m);
  }

  return uniq.sort((a, b) => b.points - a.points);
}

function applyMoveToHand(hand: Card[], move: Move): Card[] {
  return hand.filter((c) => !move.removeUids.has(c.uid));
}

function evalState(
  params: LevelConfig["ai"],
  youScore: number,
  moonScore: number,
  youHand: Card[],
  moonHand: Card[]
): number {
  // Higher is better for MOON
  const scoreDiff = moonScore - youScore;

  const moonBest = bestValidChain(moonHand);
  const youBest = bestValidChain(youHand);

  const moonPotential = moonBest ? scoreChain(moonBest) : 0;
  const youPotential = youBest ? scoreChain(youBest) : 0;

  return (
    scoreDiff +
    params.greed * (moonPotential / 10) +
    params.denyWeight * (-(youPotential / 10))
  );
}

export function pickAiMove(state: GameState, level: LevelConfig): Move | null {
  const params = level.ai;
  const moves = generateMoves(state.moonHand);
  if (moves.length === 0) return null;

  const depth = params.lookahead;

  const recur = (
    youScore: number,
    moonScore: number,
    youHand: Card[],
    moonHand: Card[],
    ply: number,
    maximizingMoon: boolean
  ): number => {
    if (ply >= depth) return evalState(params, youScore, moonScore, youHand, moonHand);

    if (maximizingMoon) {
      const ms = generateMoves(moonHand);
      if (ms.length === 0) return evalState(params, youScore, moonScore, youHand, moonHand);

      let best = -Infinity;
      for (const m of ms.slice(0, 10)) {
        const nh = applyMoveToHand(moonHand, m);
        const v = recur(youScore, moonScore + m.points, youHand, nh, ply + 1, false);
        if (v > best) best = v;
      }
      return best;
    } else {
      const ys = generateMoves(youHand);
      if (ys.length === 0) return evalState(params, youScore, moonScore, youHand, moonHand);

      let worst = Infinity;
      for (const m of ys.slice(0, 10)) {
        const nh = applyMoveToHand(youHand, m);
        const v = recur(youScore + m.points, moonScore, nh, moonHand, ply + 1, true);
        if (v < worst) worst = v;
      }
      return worst;
    }
  };

  let bestMove: Move | null = null;
  let bestVal = -Infinity;

  for (const m of moves.slice(0, 12)) {
    const moonHand2 = applyMoveToHand(state.moonHand, m);
    const v = recur(
      state.youScore,
      state.moonScore + m.points,
      state.youHand,
      moonHand2,
      1,
      false
    );
    if (v > bestVal) {
      bestVal = v;
      bestMove = m;
    }
  }

  return bestMove;
}