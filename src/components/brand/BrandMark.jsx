/**
 * Brand mark — concentric R seal + wordmark.
 * Matches the black / bone logo set.
 */
import { fontDisplay, color, BRAND_NAME } from "../../theme";

/** Concentric R seal glyph. */
export function BrandGlyph({
  size = 28,
  color: stroke = color.accent,
  title = BRAND_NAME,
  filled = true,
  fill = color.canvas,
  variant = "mark",
}) {
  const s = Math.max(12, size);
  const ink = stroke;
  const disc = variant === "inverse" ? color.accent : "none";
  const letter = variant === "inverse" ? fill : ink;
  const ring = variant === "inverse" ? fill : ink;

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
      {variant === "inverse" ? (
        <>
          <circle cx="16" cy="16" r="11" fill={disc} />
          <circle cx="16" cy="16" r="10" fill="none" stroke={ring} strokeWidth="0.9" />
        </>
      ) : (
        <>
          <circle cx="16" cy="16" r="10.6" fill="none" stroke={ink} strokeWidth="1.1" />
          <circle cx="16" cy="16" r="9.2" fill="none" stroke={ink} strokeWidth="0.7" />
        </>
      )}
      <path
        fill={letter}
        d="M11.1 9.25H17.85C21.1 9.25 23.2 11.25 23.2 14.25C23.2 16.75 21.7 18.35 19.45 18.85L23.2 22.75H19.85L16.6 19.25H14.6V22.75H11.1ZM14.6 12.5V16H17.6C19 16 19.85 15.25 19.85 14.25C19.85 13.25 19 12.5 17.6 12.5Z"
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
  variant = "mark",
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
      <BrandGlyph size={size} color={color.accent} title="" variant={variant} />
      {showWordmark && (
        <div
          style={{
            fontSize: wordSize,
            fontWeight: 700,
            letterSpacing: size >= 48 ? 1.6 : 1.1,
            color: ink,
            lineHeight: 1,
            fontFamily: fontDisplay,
            textTransform: "uppercase",
          }}
        >
          {BRAND_NAME}
        </div>
      )}
    </div>
  );
}
