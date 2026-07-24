/**
 * ROOMS brand mark — threshold glyph + Syne wordmark.
 * Door ajar on charcoal; brass stroke. Works at favicon and hero scale.
 */
import { fontDisplay, color, BRAND_NAME } from "../../theme";

/** Minimal doorway glyph — open door = inhabit. */
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
      {filled && <rect width="32" height="32" rx="6" fill={fill} />}
      <g stroke={stroke} strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M8 7h16v18H8z" />
        <path d="M11 10h7.2l1.8 12H11z" fill={filled ? fill : "transparent"} />
      </g>
      <circle cx="17.2" cy="16" r="1.15" fill={stroke} />
    </svg>
  );
}

/**
 * Full brand lockup.
 * @param {object} props
 * @param {number} [props.size=40] glyph pixel size
 * @param {boolean} [props.showWordmark=true]
 * @param {boolean} [props.light] brighter ink for dark heroes
 * @param {"row"|"stack"} [props.layout="row"]
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
            fontWeight: 800,
            letterSpacing: size >= 48 ? -1.4 : -0.7,
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
