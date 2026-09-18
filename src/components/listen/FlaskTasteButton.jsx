import { color, glass, radius, aluminumGradient, fontMono } from "../../theme";
import FlaskMark from "./FlaskMark";

/**
 * Premium flask — interests mark for Club → Interests settings.
 * Optional labeled chrome pill for discoverability.
 */
export default function FlaskTasteButton({
  onClick = null,
  active = false,
  size = 46,
  labeled = false,
}) {
  const enabled = typeof onClick === "function";
  const icon = Math.round(labeled ? 24 : size * 0.56);

  return (
    <button
      type="button"
      className={`flask-taste-btn${active ? " is-active" : ""}${labeled ? " is-labeled" : ""}`}
      onClick={() => onClick?.()}
      disabled={!enabled}
      aria-label="Your interests"
      title="Your interests"
      style={{
        pointerEvents: "auto",
        width: labeled ? "auto" : size,
        height: labeled ? 42 : size,
        padding: labeled ? "0 14px 0 8px" : 0,
        gap: labeled ? 9 : 0,
        borderRadius: labeled ? radius.md : radius.sm,
        border: `1px solid ${active ? "rgba(216,223,232,0.2)" : glass.border}`,
        background: active
          ? `
            linear-gradient(180deg, rgba(216,223,232,0.22) 0%, transparent 48%),
            linear-gradient(180deg, #A8B2C0 0%, #5B6574 100%)
          `
          : aluminumGradient(),
        color: active ? color.onAccent : color.ink,
        cursor: enabled ? "pointer" : "default",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: active
          ? `inset 0 1px 0 rgba(216,223,232,0.22), 0 8px 20px rgba(91,101,116,0.22)`
          : `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
      }}
    >
      <span
        className="flask-taste-mark"
        aria-hidden="true"
        style={{
          width: icon,
          height: icon,
          display: "block",
          flexShrink: 0,
        }}
      >
        <FlaskMark size={icon} active={active} />
      </span>
      {labeled && (
        <span
          aria-hidden="true"
          style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.1,
            textTransform: "uppercase",
            color: "inherit",
            opacity: active ? 0.92 : 0.78,
            lineHeight: 1,
          }}
        >
          Interests
        </span>
      )}
    </button>
  );
}
