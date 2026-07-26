/**
 * Planet MP3 — placeholder logo + wordmark.
 */
import { fontDisplay, color, BRAND_NAME } from "../../theme";
import { brandWordmark } from "../../brand/identity";
import { BrandGlyph } from "./BrandGlyphs";

export { BrandGlyph };

export default function BrandMark({
  size = 40,
  showWordmark = true,
  light = false,
  layout = "row",
}) {
  const ink = light ? color.onDark : color.ink;
  const compact = size < 36;
  const wordSize = Math.max(14, Math.round(size * (compact ? 0.44 : 0.4)));

  return (
    <div
      aria-label={BRAND_NAME}
      style={{
        display: "inline-flex",
        flexDirection: layout === "stack" ? "column" : "row",
        alignItems: layout === "stack" ? "flex-start" : "center",
        gap: layout === "stack" ? Math.round(size * 0.22) : Math.round(size * 0.3),
        userSelect: "none",
      }}
    >
      <BrandGlyph size={size} color={color.accent} title="" />
      {showWordmark && (
        <div
          style={{
            fontSize: wordSize,
            fontWeight: brandWordmark.weight,
            letterSpacing: brandWordmark.letterSpacing,
            color: ink,
            lineHeight: 1.05,
            fontFamily: fontDisplay,
            textTransform: brandWordmark.transform,
          }}
        >
          {BRAND_NAME}
        </div>
      )}
    </div>
  );
}
