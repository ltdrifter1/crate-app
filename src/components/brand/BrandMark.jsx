/**
 * Brand lockup — direction-aware digital mark + product wordmark.
 */
import { fontDisplay, color, BRAND_NAME } from "../../theme";
import { ACTIVE_BRAND_DIRECTION, activeBrandDirection, activeBrandName } from "../../brand/identity";
import { BrandGlyphByDirection } from "./BrandGlyphs";
import { LumenGlyph } from "./BrandGlyphs";

export function BrandGlyph({
  size = 28,
  color: stroke = color.accent,
  title = BRAND_NAME,
  direction = ACTIVE_BRAND_DIRECTION,
  variant,
  filled,
  fill,
}) {
  void variant;
  void filled;
  void fill;
  const name = activeBrandName();
  if (name.mark === "letter-r") {
    return <LumenGlyph size={size} stroke={stroke} title={title || name.name} />;
  }
  return (
    <BrandGlyphByDirection
      direction={direction}
      size={size}
      stroke={stroke}
      title={title || name.name}
    />
  );
}

export default function BrandMark({
  size = 40,
  showWordmark = true,
  light = false,
  layout = "row",
  direction = ACTIVE_BRAND_DIRECTION,
}) {
  const dir = activeBrandDirection();
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
      <BrandGlyph size={size} color={color.accent} title="" direction={direction} />
      {showWordmark && (
        <div
          style={{
            fontSize: wordSize,
            fontWeight: dir.wordmark.weight,
            letterSpacing: dir.wordmark.letterSpacing,
            color: ink,
            lineHeight: 1,
            fontFamily: fontDisplay,
            textTransform: dir.wordmark.transform,
          }}
        >
          {BRAND_NAME}
        </div>
      )}
    </div>
  );
}
