import { LEVELS, type LevelConfig } from "@/lib/levels";

export function LevelPicker({
  value,
  onChange
}: {
  value: number;
  onChange: (lvl: LevelConfig) => void;
}) {
  return (
    <div className="panel">
      <div className="panelTitle">
        <div className="h1">LEVEL</div>
        <div className="small">20 stages</div>
      </div>

      <div className="btnRow">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            className={l.id === value ? "primary" : ""}
            onClick={() => onChange(l)}
            title={`Hand ${l.handSize} • Deck ${l.deckSize} • Turns ${l.maxTurn} • AI depth ${l.ai.lookahead}`}
          >
            {l.id}
          </button>
        ))}
      </div>
    </div>
  );
}