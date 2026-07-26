/** Digital mark variants for each brand direction. */
import { color } from "../../theme";

function GlyphShell({ size, title, children }) {
  const s = Math.max(12, size);
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Lumen Deck — chrome portal frame + geometric R */
export function LumenGlyph({ size = 28, stroke = color.accent, title = "" }) {
  return (
    <GlyphShell size={size} title={title}>
      <rect x="4" y="4" width="24" height="24" rx="7" stroke={stroke} strokeWidth="1.2" />
      <path
        d="M7 7h4M21 7h4M7 25h4M21 25h4"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="square"
        opacity="0.55"
      />
      <path
        fill={stroke}
        d="M11.1 9.25H17.85C21.1 9.25 23.2 11.25 23.2 14.25C23.2 16.75 21.7 18.35 19.45 18.85L23.2 22.75H19.85L16.6 19.25H14.6V22.75H11.1ZM14.6 12.5V16H17.6C19 16 19.85 15.25 19.85 14.25C19.85 13.25 19 12.5 17.6 12.5Z"
      />
    </GlyphShell>
  );
}

/** Orbit Spatial — three orbital arcs around a listening node */
export function OrbitGlyph({ size = 28, stroke = color.accent, title = "" }) {
  return (
    <GlyphShell size={size} title={title}>
      <circle cx="16" cy="16" r="2.2" fill={stroke} />
      <path
        d="M16 6a10 10 0 0 1 9.2 6.2M26 16a10 10 0 0 1-6.2 9.2M16 26a10 10 0 0 1-9.2-6.2M6 16a10 10 0 0 1 6.2-9.2"
        stroke={stroke}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="16" cy="16" r="10.8" stroke={stroke} strokeWidth="0.6" opacity="0.35" />
    </GlyphShell>
  );
}

/** Signal Index — waveform ticks in a precision ring */
export function SignalGlyph({ size = 28, stroke = color.accent, title = "" }) {
  const bars = [5, 8, 11, 14, 11, 8, 5, 7, 10, 13, 10, 7];
  return (
    <GlyphShell size={size} title={title}>
      <circle cx="16" cy="16" r="11" stroke={stroke} strokeWidth="0.8" opacity="0.45" />
      {bars.map((h, i) => {
        const a = (i / bars.length) * Math.PI * 2 - Math.PI / 2;
        const x = 16 + Math.cos(a) * 8.2;
        const y = 16 + Math.sin(a) * 8.2;
        return (
          <rect
            key={i}
            x={x - 0.55}
            y={y - h / 2}
            width="1.1"
            height={h}
            fill={stroke}
            opacity={0.55 + (h / 14) * 0.45}
            transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`}
          />
        );
      })}
      <circle cx="16" cy="16" r="1.6" fill={stroke} />
    </GlyphShell>
  );
}

export function BrandGlyphByDirection({ direction = "lumen", ...props }) {
  if (direction === "orbit") return <OrbitGlyph {...props} />;
  if (direction === "signal") return <SignalGlyph {...props} />;
  return <LumenGlyph {...props} />;
}
