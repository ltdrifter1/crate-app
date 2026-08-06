import { useEffect } from "react";
import { color, fontDisplay, fontMono, motion, chrome, glass, radius, aluminumGradient } from "../../theme";
import { BUMPER_DURATION_MS } from "../../lib/bumpers";

/**
 * Full-screen station bumper / ident interstitial — frosted Y2K plate.
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
          ${aluminumGradient()},
          radial-gradient(ellipse at 50% 40%, ${accent}28 0%, transparent 55%),
          linear-gradient(160deg, #16191F 0%, #101318 55%, #0B0C0F 100%)
        `,
        animation: `stationBumperIn 0.35s ${motion.ease} both`,
      }}
    >
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.06,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.35) 3px)",
      }} />

      <div style={{
        position: "relative",
        width: "min(100%, 440px)",
        textAlign: "center",
        color: color.ink,
        padding: "28px 24px",
        borderRadius: 28,
        background: `
          linear-gradient(165deg, rgba(42,47,55,0.85) 0%, rgba(28,32,38,0.55) 100%)
        `,
        border: `1px solid rgba(255,255,255,0.16)`,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
        backdropFilter: glass.blurHeavy,
        WebkitBackdropFilter: glass.blurHeavy,
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          marginBottom: 16,
          borderRadius: radius.pill,
          background: glass.chrome,
          border: `1px solid ${glass.border}`,
          boxShadow: `inset 0 1px 0 ${glass.highlight}`,
          fontFamily: fontMono,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: color.ink,
        }}>
          <span aria-hidden="true" style={{
            width: 6, height: 6, borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 0 3px ${accent}33`,
          }} />
          {bumper.kicker || "STATION"}
        </div>
        <div style={{
          fontFamily: fontDisplay,
          fontSize: "clamp(28px, 7vw, 42px)",
          fontWeight: 800,
          letterSpacing: -1,
          lineHeight: 1.05,
        }}>
          {bumper.title}
        </div>
        {bumper.subtitle && (
          <div style={{
            marginTop: 12,
            fontSize: 15,
            fontWeight: 500,
            color: color.body,
            lineHeight: 1.35,
          }}>
            {bumper.subtitle}
          </div>
        )}
        <div aria-hidden="true" style={{
          margin: "22px auto 0",
          width: 120,
          height: 3,
          borderRadius: 999,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          animation: "stationBar 0.8s ease-in-out infinite alternate",
        }} />
      </div>
    </div>
  );
}
