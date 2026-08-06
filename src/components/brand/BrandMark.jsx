/**
 * Planet MP3 — exact logo mark + optional wordmark.
 * Uses the identical Y2K lockup assets (not a placeholder glyph).
 */
import { fontDisplay, color, BRAND_NAME } from "../../theme";
import { brandWordmark } from "../../brand/identity";
import { BrandGlyph, BrandLockup } from "./BrandGlyphs";

export { BrandGlyph, BrandLockup };
// PlanetMascot is lazy-loaded by callers — do not re-export here (pulls Lottie into main).

export default function BrandMark({
  size = 40,
  showWordmark = true,
  light = false,
  layout = "row",
  /** "mark" = square icon · "lockup" = full planet lockup alone */
  variant = "mark",
}) {
  const ink = light ? color.onDark : color.ink;
  const compact = size < 36;
  const wordSize = Math.max(14, Math.round(size * (compact ? 0.44 : 0.4)));

  if (variant === "lockup") {
    return (
      <div aria-label={BRAND_NAME} style={{ userSelect: "none" }}>
        <BrandLockup size={size} glassHalo={size >= 200} />
      </div>
    );
  }

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
      <BrandGlyph size={size} inverse={light} />
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
            fontStyle: "italic",
          }}
        >
          {BRAND_NAME}
        </div>
      )}
    </div>
  );
}
