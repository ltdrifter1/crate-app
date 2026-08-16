/**
 * Free-tier play meter — surface remaining plays before the wall.
 */
import { fontMono, color, y2k, glass, radius } from "../../theme";
import {
  freePlaysMeterLabel,
  shouldNudgeFreePlays,
  shouldShowFreePlaysMeter,
} from "../../lib/freePlays";

/**
 * Compact chip for dock / Club chrome.
 * @param {"chip"|"banner"} [variant]
 */
export default function FreePlaysMeter({
  remaining,
  access,
  onUpgrade = null,
  variant = "chip",
  style = null,
}) {
  if (!shouldShowFreePlaysMeter(access)) return null;
  const label = freePlaysMeterLabel(remaining, access);
  if (!label) return null;

  const left = Number(remaining);
  const blocked = Number.isFinite(left) && left <= 0;
  const nudge = shouldNudgeFreePlays(remaining, access);
  const accent = blocked || nudge ? y2k.chromeBright || color.accent : color.muted;

  if (variant === "banner") {
    if (!nudge && !blocked) return null;
    return (
      <button
        type="button"
        onClick={onUpgrade || undefined}
        disabled={!onUpgrade}
        aria-label={blocked ? "Free limit reached — join Club" : `${label}. Join Club for unlimited`}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 14px",
          marginBottom: 8,
          borderRadius: radius.md || 12,
          border: `1px solid ${glass.borderSoft}`,
          background: "rgba(27,31,37,0.72)",
          boxShadow: `inset 0 1px 0 ${glass.highlight}`,
          color: color.ink,
          cursor: onUpgrade ? "pointer" : "default",
          fontFamily: fontMono,
          pointerEvents: "auto",
          textAlign: "left",
          ...style,
        }}
      >
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          color: accent,
        }}>
          {blocked ? "Free limit reached" : label}
        </span>
        {onUpgrade && (
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: color.body,
            flexShrink: 0,
          }}>
            Club →
          </span>
        )}
      </button>
    );
  }

  const ChipTag = onUpgrade ? "button" : "div";
  return (
    <ChipTag
      type={onUpgrade ? "button" : undefined}
      onClick={onUpgrade || undefined}
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: radius.sm || 8,
        border: `1px solid ${glass.borderSoft}`,
        background: "rgba(22,24,30,0.45)",
        fontFamily: fontMono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.0,
        textTransform: "uppercase",
        color: accent,
        cursor: onUpgrade ? "pointer" : "default",
        ...style,
      }}
    >
      {label}
    </ChipTag>
  );
}
