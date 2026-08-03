import { color, glass, radius, aluminumGradient } from "../../theme";

/**
 * Premium square genre control — icon-only flask with steam, bubbles, and hover shake.
 * Opens genre taste; no label text on the face.
 */
export default function FlaskTasteButton({
  onClick = null,
  active = false,
  size = 46,
}) {
  const enabled = typeof onClick === "function";

  return (
    <button
      type="button"
      className={`flask-taste-btn${active ? " is-active" : ""}`}
      onClick={() => onClick?.()}
      disabled={!enabled}
      aria-label="Genres — change what we play most"
      title="Genres"
      style={{
        pointerEvents: "auto",
        width: size,
        height: size,
        padding: 0,
        borderRadius: radius.sm,
        border: `1px solid ${active ? "rgba(22,24,30,0.28)" : glass.border}`,
        background: active
          ? `
            linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 48%),
            linear-gradient(165deg, #3A404C 0%, #1A1D24 100%)
          `
          : aluminumGradient(),
        color: active ? color.onDark : color.ink,
        cursor: enabled ? "pointer" : "default",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: active
          ? `inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 20px rgba(26,29,36,0.22)`
          : `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
      }}
    >
      <span className="flask-taste-mark" aria-hidden="true" style={{ width: 26, height: 26, display: "block" }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          {/* Steam wisps */}
          <path
            className="flask-steam flask-steam-a"
            d="M10.2 5.2c0.4-1.2 0.1-2.2-0.5-2.8"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            className="flask-steam flask-steam-b"
            d="M12.1 4.8c0.15-1.1 0.55-1.9 1.2-2.35"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
            opacity="0.28"
          />
          <path
            className="flask-steam flask-steam-c"
            d="M13.7 5.35c0.55-1 0.85-1.75 0.55-2.55"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.22"
          />

          {/* Flask body */}
          <path d="M9 4.2h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path
            d="M10 4.2v4.6L5.85 16.1A3.15 3.15 0 0 0 8.6 20.7h6.8a3.15 3.15 0 0 0 2.75-4.6L14 8.8V4.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Liquid line */}
          <path d="M8.15 14.35h7.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
          {/* Liquid fill hint */}
          <path
            d="M8.35 14.55c0.55 2.1 1.9 3.55 3.65 3.55s3.1-1.45 3.65-3.55"
            fill="currentColor"
            opacity="0.12"
          />

          {/* Bubbles */}
          <circle className="flask-bubble flask-bubble-a" cx="10.4" cy="17.1" r="1.05" fill="currentColor" opacity="0.75" />
          <circle className="flask-bubble flask-bubble-b" cx="13.5" cy="16.35" r="0.78" fill="currentColor" opacity="0.55" />
          <circle className="flask-bubble flask-bubble-c" cx="12" cy="17.85" r="0.62" fill="currentColor" opacity="0.65" />
        </svg>
      </span>
    </button>
  );
}
