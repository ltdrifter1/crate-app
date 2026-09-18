import { y2k, chrome, fontMono } from "../../theme";
import { energyArcPath, energyWaveformBars } from "../../lib/setBuilder";

/**
 * Mix-booth energy stage — LCD waveform + glow arc.
 * Uses the sculpted profile until a live set exists, then follows track energy.
 */
export default function EnergyArc({
  points = [],
  phases = [],
  tintRgb = chrome.cyanRgb,
  width = 640,
  height = 92,
}) {
  const { line, area } = energyArcPath(points, { width, height, padX: 8, padY: 12 });
  const bars = energyWaveformBars(points, Math.max(48, Math.round(width / 7)));
  const innerW = width - 16;
  let acc = 0;
  const phaseMarks = (phases || []).map((ph) => {
    const x = 8 + acc * innerW;
    acc += ph.p;
    return { name: ph.name, x, p: ph.p };
  });

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: 8,
        overflow: "hidden",
        background: `
          linear-gradient(180deg, rgba(111,191,58,0.1) 0%, transparent 42%),
          linear-gradient(160deg, #6A7482 0%, #5B6574 55%, #4A5360 100%)
        `,
        border: "1px solid rgba(18, 22, 16, 0.45)",
        boxShadow: "inset 0 2px 8px rgba(58,66,80,0.45), inset 0 1px 0 rgba(111,191,58,0.12), 0 0 0 1px rgba(216,223,232,0.4)",
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="pmpSetArcFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`rgba(${tintRgb},0.38)`} />
            <stop offset="100%" stopColor={`rgba(${tintRgb},0)`} />
          </linearGradient>
          <linearGradient id="pmpSetArcStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={`rgba(${tintRgb},0.35)`} />
            <stop offset="45%" stopColor={y2k.cyan} />
            <stop offset="100%" stopColor={y2k.chromeBright} />
          </linearGradient>
        </defs>
        {bars.map((bar, i) => {
          const x = 8 + bar.t * innerW;
          const h = Math.max(4, bar.height * (height - 28));
          const y = height - 14 - h;
          return (
            <rect
              key={i}
              x={x - 1.1}
              y={y}
              width="2.2"
              height={h}
              rx="0.7"
              fill={`rgba(${tintRgb},${0.18 + bar.height * 0.55})`}
            />
          );
        })}
        {area && <path d={area} fill="url(#pmpSetArcFill)" />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke="url(#pmpSetArcStroke)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px rgba(${tintRgb},0.55))` }}
          />
        )}
      </svg>
      <div style={{
        position: "absolute",
        left: 8,
        right: 8,
        bottom: 3,
        display: "flex",
        pointerEvents: "none",
      }}>
        {phaseMarks.map((ph) => (
          <div key={ph.name + ph.x} style={{ flex: ph.p, minWidth: 0 }}>
            <div style={{
              fontFamily: fontMono,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: y2k.cyan,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {ph.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
