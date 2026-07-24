/**
 * Brand mark — minimal note glyph + SF Pro wordmark.
 */
import { fontDisplay, color, BRAND_NAME } from "../../theme";

/** Minimal music-note glyph. */
export function BrandGlyph({
  size = 28,
  color: stroke = color.accent,
  title = BRAND_NAME,
  filled = true,
  fill = color.canvas,
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
      {filled && <rect width="32" height="32" rx="8" fill={fill} />}
      <path
        d="M12 22.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
        fill={stroke}
      />
      <path
        d="M15.5 19V9.5l8-1.5V18"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full brand lockup.
 */
export default function BrandMark({
  size = 40,
  showWordmark = true,
  light = false,
  layout = "row",
}) {
  const ink = light ? color.onDark : color.ink;
  const compact = size < 36;
  const wordSize = Math.max(13, Math.round(size * (compact ? 0.42 : 0.38)));

  return (
    <div
      aria-label={BRAND_NAME}
      style={{
        display: "inline-flex",
        flexDirection: layout === "stack" ? "column" : "row",
        alignItems: layout === "stack" ? "flex-start" : "center",
        gap: layout === "stack" ? Math.round(size * 0.22) : Math.round(size * 0.28),
        userSelect: "none",
      }}
    >
      <BrandGlyph size={size} color={color.accent} title="" />
      {showWordmark && (
        <div
          style={{
            fontSize: wordSize,
            fontWeight: 700,
            letterSpacing: size >= 48 ? -0.8 : -0.4,
            color: ink,
            lineHeight: 1,
            fontFamily: fontDisplay,
          }}
        >
          {BRAND_NAME}
        </div>
      )}
    </div>
  );
}
