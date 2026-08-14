/**
 * Dual-ended range control for taste axes (Familiar ↔ Adventurous, etc.).
 */
import { color, fontDisplay, fontMono, glass, radius } from "../../theme";
import { clampTasteAxis, TASTE_AXIS_DEFAULT } from "../../lib/tasteProfile";

export default function TasteAxisSlider({
  id,
  title,
  hint = null,
  lowLabel,
  highLabel,
  value = TASTE_AXIS_DEFAULT,
  onChange,
}) {
  const v = clampTasteAxis(value);

  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: color.accent,
          fontFamily: fontMono,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {hint && (
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 14,
            color: color.body,
            lineHeight: 1.45,
          }}
        >
          {hint}
        </p>
      )}
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        aria-label={title}
        onChange={(e) => onChange?.(clampTasteAxis(e.target.value))}
        style={{
          width: "100%",
          accentColor: color.accent,
          cursor: "pointer",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 10,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 650,
            color: v <= 40 ? color.ink : color.muted,
            fontFamily: fontDisplay,
          }}
        >
          {lowLabel}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            fontFamily: fontMono,
            color: color.faint,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {v}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 650,
            color: v >= 60 ? color.ink : color.muted,
            fontFamily: fontDisplay,
            textAlign: "right",
          }}
        >
          {highLabel}
        </span>
      </div>
      <div
        aria-hidden="true"
        style={{
          marginTop: 12,
          height: 4,
          borderRadius: radius.sm,
          background: glass.borderSoft,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${v}%`,
            background: `linear-gradient(90deg, ${color.accent} 0%, #7FA3C4 100%)`,
            borderRadius: radius.sm,
          }}
        />
      </div>
    </div>
  );
}
