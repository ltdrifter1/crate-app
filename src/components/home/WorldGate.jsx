import { BRAND_NAME, BRAND_TAGLINE, fontLcd, fontPoster, y2k } from "../../theme";

/**
 * Click-to-enter ritual — Balming Tiger's "best experienced with audio / CLICK TO ENTER".
 * Session-only; after enter, the world is the Home stage.
 */
export default function WorldGate({ onEnter, loading = false }) {
  return (
    <div
      className="pmp-world-gate"
      role="dialog"
      aria-modal="true"
      aria-label="Enter Planet MP3"
      onClick={onEnter}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEnter?.();
        }
      }}
      tabIndex={0}
    >
      <div className="pmp-world-gate-inner">
        <img
          src="/brand/planet-mp3-lockup-512.png"
          alt=""
          width={220}
          height={220}
          decoding="async"
          className="pmp-world-gate-mark"
        />
        <div className="pmp-world-gate-name" style={{ fontFamily: fontPoster }}>
          {BRAND_NAME}
        </div>
        <div className="pmp-world-gate-tag" style={{ fontFamily: fontLcd }}>
          {BRAND_TAGLINE}
        </div>
        <p className="pmp-world-gate-copy">
          {loading ? (
            <>
              LOADING
              <span className="pmp-world-gate-pct"> the dial</span>
            </>
          ) : (
            <>
              Best experienced with your device&apos;s audio enabled.
            </>
          )}
        </p>
        <button
          type="button"
          className="pmp-world-gate-enter"
          onClick={(e) => {
            e.stopPropagation();
            onEnter?.();
          }}
          style={{ fontFamily: fontPoster, color: y2k.nearBlack }}
        >
          {loading ? "Hold…" : "Enter the world"}
        </button>
      </div>
    </div>
  );
}
