import { nextPhaseId, phaseById } from "@/lib/phases";
import type { Card } from "./types";

/**
 * Rule (sequence-only):
 * A play is valid if selected cards form a chain where each next card is the next phase in lunar order.
 * Wraparound allowed (WAN_CRES -> NEW).
 *
 * We allow selecting cards in any order; we find the best valid chain from them.
 */
export function bestValidChain(cards: Card[]): Card[] | null {
  if (cards.length < 2) return null;

  let best: Card[] = [];

  for (let i = 0; i < cards.length; i++) {
    const used = new Set<string>();
    const chain: Card[] = [];

    let current = cards[i]!;
    chain.push(current);
    used.add(current.uid);

    while (true) {
      const want = nextPhaseId(current.phase);
      const nxt = cards.find((c) => !used.has(c.uid) && c.phase === want);
      if (!nxt) break;
      chain.push(nxt);
      used.add(nxt.uid);
      current = nxt;
    }

    if (chain.length > best.length) best = chain;
  }

  return best.length >= 2 ? best : null;
}

export function scoreChain(chain: Card[]): number {
  const len = chain.length;
  const base = len * len;

  // small bonus if the chain includes FULL
  const includesFull = chain.some((c) => phaseById(c.phase).order === 4);
  const bonus = includesFull ? Math.ceil(len * 0.8) : 0;

  return base + bonus;
}

export function describeChain(chain: Card[]): string {
  const names = chain.map((c) => phaseById(c.phase).name);
  return `${chain.length} link(s): ${names.join(" → ")}`;
}