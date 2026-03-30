import type { PhaseId } from "@/lib/phases";

export function MoonGlyph({ phase, size = 40 }: { phase: PhaseId; size?: number }) {
  // Original monochrome SVG interpretation using a mask.
  const r = size / 2;
  const id = `m-${phase}-${size}`;

  const illumination = (() => {
    switch (phase) {
      case "NEW": return 0;
      case "WAX_CRES": return 0.25;
      case "FIRST_Q": return 0.5;
      case "WAX_GIBB": return 0.75;
      case "FULL": return 1;
      case "WAN_GIBB": return 0.75;
      case "THIRD_Q": return 0.5;
      case "WAN_CRES": return 0.25;
    }
  })();

  const waxing = phase === "WAX_CRES" || phase === "FIRST_Q" || phase === "WAX_GIBB";
  const waning = phase === "WAN_CRES" || phase === "THIRD_Q" || phase === "WAN_GIBB";

  const shift = (1 - illumination) * r * 0.9;
  const cx = waxing ? r - shift : waning ? r + shift : r;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={phase}>
      <defs>
        <mask id={id}>
          <rect width={size} height={size} fill="black" />
          <circle cx={r} cy={r} r={r - 1} fill="white" />
          {illumination < 1 && (
            <ellipse cx={cx} cy={r} rx={r} ry={r} fill="black" />
          )}
        </mask>
      </defs>

      <circle
        cx={r}
        cy={r}
        r={r - 1}
        fill="rgba(255,255,255,0.10)"
        stroke="rgba(255,255,255,0.20)"
      />
      <circle cx={r} cy={r} r={r - 1} fill="rgba(255,255,255,0.92)" mask={`url(#${id})`} />
    </svg>
  );
}