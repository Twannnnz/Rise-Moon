"use client";

import { useMemo, useState } from "react";
import { LEVELS, type LevelConfig } from "@/lib/levels";
import { PHASES, type PhaseId, phaseById } from "@/lib/phases";
import type { Card, GameState } from "@/lib/game/types";
import { bestValidChain, describeChain, scoreChain } from "@/lib/game/rules";
import { pickAiMove } from "@/lib/game/ai";
import { MoonGlyph } from "./MoonGlyph";
import { LevelPicker } from "./LevelPicker";

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function makeDeck(deckSize: number): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < deckSize; i++) {
    const phase = PHASES[i % 8]!.id;
    cards.push({ uid: uid(), phase });
  }
  // shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards;
}

function draw(deck: Card[], n: number): { deck: Card[]; drawn: Card[] } {
  const drawn = deck.slice(0, n);
  const rest = deck.slice(n);
  return { deck: rest, drawn };
}

function initGame(level: LevelConfig): GameState {
  const deck0 = makeDeck(level.deckSize);
  const d1 = draw(deck0, level.handSize);
  const d2 = draw(d1.deck, level.handSize);

  return {
    levelId: level.id,
    turn: 1,
    maxTurn: level.maxTurn,

    deck: d2.deck,
    youHand: d1.drawn,
    moonHand: d2.drawn,

    youScore: 0,
    moonScore: 0,

    selected: [],

    log: [{ t: Date.now(), who: "YOU", msg: `Level ${level.id} started.` }],
    gameOver: false
  };
}

export function Game() {
  const [level, setLevel] = useState<LevelConfig>(LEVELS[0]!);
  const [state, setState] = useState<GameState>(() => initGame(LEVELS[0]!));

  const selectedCards = useMemo(
    () => state.selected.map((i) => state.youHand[i]!).filter(Boolean),
    [state.selected, state.youHand]
  );

  const proposed = useMemo(() => bestValidChain(selectedCards), [selectedCards]);
  const proposedPoints = proposed ? scoreChain(proposed) : 0;

  const reset = (lvl: LevelConfig = level) => {
    setLevel(lvl);
    setState(initGame(lvl));
  };

  const toggleSelect = (idx: number) => {
    if (state.gameOver) return;
    setState((s) => {
      const has = s.selected.includes(idx);
      const selected = has ? s.selected.filter((x) => x !== idx) : [...s.selected, idx];
      return { ...s, selected };
    });
  };

  const endIfNeeded = (s: GameState): GameState => {
    if (s.turn > s.maxTurn) {
      const winner =
        s.youScore > s.moonScore ? "YOU" : s.moonScore > s.youScore ? "MOON" : "DRAW";
      return { ...s, gameOver: true, winner };
    }
    return s;
  };

  const moonTurn = (s: GameState): GameState => {
    const move = pickAiMove(s, lvlToUse(level, s.levelId));
    if (!move) {
      return {
        ...s,
        log: [{ t: Date.now(), who: "MOON", msg: "Moon passes (no chain available)." }, ...s.log]
      };
    }

    const remove = new Set(move.chain.map((c) => c.uid));
    const moonHand2 = s.moonHand.filter((c) => !remove.has(c.uid));

    const need = Math.max(0, level.handSize - moonHand2.length);
    const d = draw(s.deck, need);

    return {
      ...s,
      moonHand: [...moonHand2, ...d.drawn],
      deck: d.deck,
      moonScore: s.moonScore + move.points,
      lastMove: { by: "MOON", chain: move.chain, points: move.points },
      log: [{ t: Date.now(), who: "MOON", msg: `Moon played ${describeChain(move.chain)} (+${move.points})` }, ...s.log]
    };
  };

  const youPlay = () => {
    if (state.gameOver) return;

    if (!proposed) {
      setState((s) => ({
        ...s,
        log: [{ t: Date.now(), who: "YOU", msg: "Invalid move. Build a chain of 2+ next-phase cards." }, ...s.log]
      }));
      return;
    }

    const remove = new Set(proposed.map((c) => c.uid));
    const youHand2 = state.youHand.filter((c) => !remove.has(c.uid));
    const pts = scoreChain(proposed);

    const need = Math.max(0, level.handSize - youHand2.length);
    const d = draw(state.deck, need);

    let s2: GameState = {
      ...state,
      youHand: [...youHand2, ...d.drawn],
      deck: d.deck,
      youScore: state.youScore + pts,
      selected: [],
      lastMove: { by: "YOU", chain: proposed, points: pts },
      log: [{ t: Date.now(), who: "YOU", msg: `Played ${describeChain(proposed)} (+${pts})` }, ...state.log]
    };

    s2 = moonTurn(s2);
    s2 = { ...s2, turn: s2.turn + 1 };
    s2 = endIfNeeded(s2);

    setState(s2);
  };

  return (
    <div className="grid2">
      <div className="panel">
        <div className="panelTitle">
          <div className="h1">MATCH</div>
          <div className="small">
            Turn <span className="kbd">{state.turn}</span> / <span className="kbd">{state.maxTurn}</span>{" "}
            · Deck <span className="kbd">{state.deck.length}</span>
          </div>
        </div>

        <div className="scoreRow">
          <div className="scoreBox">
            <div className="scoreLabel">YOU</div>
            <div className="scoreValue">{state.youScore}</div>
          </div>
          <div className="scoreBox">
            <div className="scoreLabel">MOON</div>
            <div className="scoreValue">{state.moonScore}</div>
          </div>
          <div className="scoreBox">
            <div className="scoreLabel">LEVEL</div>
            <div className="scoreValue">{level.id}</div>
          </div>
        </div>

        <div className="btnRow" style={{ marginBottom: 10 }}>
          <button className="primary" onClick={youPlay}>
            Play selected chain
          </button>
          <button onClick={() => setState((s) => ({ ...s, selected: [] }))}>Clear</button>
          <button onClick={() => reset(level)}>Restart level</button>
        </div>

        <div className="small" style={{ marginBottom: 10 }}>
          Rule: select <span className="kbd">2+</span> cards that form a{" "}
          <span className="kbd">next-phase</span> sequence (wrap allowed). Current:{" "}
          {proposed ? (
            <span style={{ color: "var(--good)" }}>
              {describeChain(proposed)} (+{proposedPoints})
            </span>
          ) : (
            <span style={{ color: "var(--bad)" }}>no valid chain</span>
          )}
        </div>

        <div className="hand">
          {state.youHand.map((c, idx) => {
            const sel = state.selected.includes(idx);
            return (
              <div
                key={c.uid}
                className={`card ${sel ? "selected" : ""}`}
                onClick={() => toggleSelect(idx)}
                role="button"
                tabIndex={0}
              >
                <div className="cardTop">
                  <div className="badge">You</div>
                  <div className="badge">{phaseById(c.phase).order + 1}/8</div>
                </div>
                <MoonGlyph phase={c.phase as PhaseId} size={44} />
                <div className="cardName">{phaseById(c.phase).name}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <LevelPicker value={level.id} onChange={(lvl) => reset(lvl)} />

        <div className="panel">
          <div className="panelTitle">
            <div className="h1">MOON (AI)</div>
            <div className="small">
              Depth <span className="kbd">{level.ai.lookahead}</span> · Greed{" "}
              <span className="kbd">{level.ai.greed.toFixed(2)}</span> · Deny{" "}
              <span className="kbd">{level.ai.denyWeight.toFixed(2)}</span>
            </div>
          </div>

          <div className="small" style={{ marginBottom: 10 }}>
            Moon hand size: <span className="kbd">{state.moonHand.length}</span>
          </div>

          <div className="hand" style={{ opacity: 0.9 }}>
            {state.moonHand.map((c) => (
              <div key={c.uid} className="card" style={{ cursor: "default" }}>
                <div className="cardTop">
                  <div className="badge">Moon</div>
                  <div className="badge">?</div>
                </div>
                <MoonGlyph phase={c.phase as PhaseId} size={44} />
                <div className="cardName">{phaseById(c.phase).name}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            <div className="panelTitle">
              <div className="h1">LOG</div>
              <div className="small">
                {state.gameOver ? (
                  <span>
                    Result: <span className="kbd">{state.winner}</span>
                  </span>
                ) : (
                  <span>Play a chain each turn</span>
                )}
              </div>
            </div>

            <div className="log">
              {state.log.map((it) => (
                <div key={it.t + it.msg} className="logItem">
                  <div className="logHead" style={{ display: "flex", justifyContent: "space-between" }}>
                    <div className="small" style={{ fontWeight: 800, letterSpacing: "0.05em" }}>{it.who}</div>
                    <div className="small">{new Date(it.t).toLocaleTimeString()}</div>
                  </div>
                  <div className="small" style={{ marginTop: 4 }}>{it.msg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelTitle">
            <div className="h1">SCORING</div>
            <div className="small">original</div>
          </div>
          <div className="small">
            <div>
              Points = <span className="kbd">length²</span> (+ bonus if chain includes Full Moon).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function lvlToUse(level: LevelConfig, levelId: number): LevelConfig {
  // simple safety if state is out of sync
  return level.id === levelId ? level : LEVELS[Math.max(0, Math.min(LEVELS.length - 1, levelId - 1))]!;
}