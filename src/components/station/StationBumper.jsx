import { useEffect } from "react";
import { color, fontDisplay, fontMono, motion, chrome } from "../../theme";
import { BUMPER_DURATION_MS } from "../../lib/bumpers";

/**
 * Full-screen station bumper / ident interstitial.
 */
export default function StationBumper({ bumper = null, onDone = null, durationMs = BUMPER_DURATION_MS }) {
  useEffect(() => {
    if (!bumper) return undefined;
    const t = window.setTimeout(() => onDone?.(), durationMs);
    return () => window.clearTimeout(t);
  }, [bumper?.id, bumper?.title, durationMs, onDone]);

  if (!bumper) return null;
  const accent = bumper.accent || chrome.hot;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 140,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
        background: `
          radial-gradient(ellipse at 50% 40%, ${accent}33 0%, transparent 55%),
          linear-gradient(160deg, #0c0d11 0%, #16181E 55%, #0a0b0e 100%)
        `,
        animation: `stationBumperIn 0.35s ${motion.ease} both`,
      }}
    >
      {/* Scanlines */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.08,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.4) 3px)",
      }} />

      <div style={{
        position: "relative",
        width: "min(100%, 440px)",
        textAlign: "center",
        color: color.onDark,
      }}>
        <div style={{
          display: "inline-block",
          padding: "5px 10px",
          marginBottom: 14,
          background: accent,
          color: "#fff",
          fontFamily: fontMono,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          clipPath: "polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
        }}>
          {bumper.kicker || "STATION"}
        </div>
        <div style={{
          fontFamily: fontDisplay,
          fontSize: "clamp(28px, 7vw, 42px)",
          fontWeight: 800,
          letterSpacing: -1,
          lineHeight: 1.05,
          textShadow: `0 0 40px ${accent}66`,
        }}>
          {bumper.title}
        </div>
        {bumper.subtitle && (
          <div style={{
            marginTop: 12,
            fontSize: 15,
            fontWeight: 500,
            color: "rgba(242,244,247,0.7)",
            lineHeight: 1.35,
          }}>
            {bumper.subtitle}
          </div>
        )}
        <div aria-hidden="true" style={{
          margin: "22px auto 0",
          width: 120,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          animation: "stationBar 0.8s ease-in-out infinite alternate",
        }} />
      </div>
    </div>
  );
}
