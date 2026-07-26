/** Placeholder planet mark — replace with final logo later. */
import { color } from "../../theme";

export function PlaceholderPlanetGlyph({
  size = 28,
  color: stroke = color.accent,
  title = "Planet MP3",
}) {
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
      <ellipse
        cx="16"
        cy="16"
        rx="12"
        ry="4.2"
        stroke={stroke}
        strokeWidth="1.1"
        opacity="0.85"
      />
      <circle cx="16" cy="16" r="6.5" fill={stroke} />
      <path
        d="M10 14.5c2-1.2 4.5-1.8 6-1.8s4 .6 6 1.8"
        stroke={color.canvas}
        strokeWidth="0.9"
        opacity="0.35"
      />
    </svg>
  );
}

export function BrandGlyph({
  size = 28,
  color: stroke = color.accent,
  title = "Planet MP3",
}) {
  return <PlaceholderPlanetGlyph size={size} stroke={stroke} title={title} />;
}
