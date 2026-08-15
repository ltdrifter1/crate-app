import { color, fontDisplay, fontMono, homeSpace, chrome, glass, radius, y2k, motion } from "../../theme";
import ChartHistoryPanel from "./ChartHistoryPanel";

/**
 * Charts tab — monthly countdown, overall or by channel / genre.
 * Broadcast-hardware surface: graphite chassis, LCD cyan signal, machined list.
 */
export default function ChartsScreen({
  countdown = [],
  tracks = [],
  onPlayTrack = null,
  onTuneMonthly = null,
}) {
  return (
    <div style={{
      position: "relative",
      paddingBottom: 56,
      overflow: "hidden",
      animation: `rise 0.5s ${motion.ease} both`,
    }}>
      {/* Studio atmosphere — cyan tuner bloom + graphite wash */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 90% 55% at 12% -8%, rgba(${chrome.cyanRgb},0.14) 0%, transparent 52%),
            radial-gradient(ellipse 70% 40% at 100% 18%, rgba(123,167,255,0.06) 0%, transparent 48%),
            linear-gradient(180deg, rgba(18,22,28,0.55) 0%, transparent 42%)
          `,
        }}
      />

      <header style={{
        position: "relative",
        padding: `calc(18px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 14px`,
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          padding: "5px 10px 5px 8px",
          borderRadius: 4,
          border: `1px solid ${glass.border}`,
          background: glass.chrome,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.45)`,
        }}>
          <span aria-hidden="true" style={{
            width: 9, height: 9,
            background: `linear-gradient(145deg, ${chrome.signal} 0%, ${y2k.techBlue} 100%)`,
            boxShadow: `0 0 10px rgba(${chrome.cyanRgb},0.45), inset 0 1px 0 rgba(255,255,255,0.25)`,
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          }} />
          <div style={{
            fontFamily: fontMono, fontSize: 10, fontWeight: 800,
            letterSpacing: 1.8, textTransform: "uppercase", color: y2k.chromeBright,
          }}>
            Station charts
          </div>
        </div>

        <h1 style={{
          margin: 0,
          fontFamily: fontDisplay,
          fontSize: "clamp(34px, 8vw, 48px)",
          fontWeight: 800,
          letterSpacing: -1.2,
          color: color.ink,
          textTransform: "uppercase",
          lineHeight: 0.95,
          textShadow: `0 0 40px rgba(${chrome.cyanRgb},0.12)`,
        }}>
          Charts
        </h1>

        <p style={{
          margin: "10px 0 0",
          fontSize: 14,
          fontWeight: 500,
          color: color.muted,
          maxWidth: 380,
          lineHeight: 1.45,
        }}>
          Monthly board — overall, or split by channel or genre.
        </p>

        {/* LCD hairline under hero */}
        <div aria-hidden="true" style={{
          marginTop: 18,
          height: 1,
          background: `linear-gradient(90deg, rgba(${chrome.cyanRgb},0.45) 0%, rgba(255,255,255,0.12) 40%, transparent 100%)`,
          boxShadow: `0 0 12px rgba(${chrome.cyanRgb},0.2)`,
        }} />
      </header>

      {tracks.length === 0 && countdown.length === 0 && (
        <div style={{
          position: "relative",
          margin: `4px ${homeSpace.gutter}px 0`,
          padding: "18px 16px",
          borderRadius: radius.lg,
          border: "1px solid rgba(101,230,255,0.18)",
          background: `
            linear-gradient(180deg, rgba(101,230,255,0.06) 0%, transparent 40%),
            linear-gradient(165deg, rgba(38,43,51,0.85) 0%, rgba(18,22,28,0.72) 100%)
          `,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 2px 8px rgba(0,0,0,0.35), ${glass.shadowSoft}`,
          backdropFilter: glass.blurSoft,
          WebkitBackdropFilter: glass.blurSoft,
          color: color.body,
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          Play and request cuts to build this month&apos;s chart. History fills in as you listen.
        </div>
      )}

      <ChartHistoryPanel
        countdown={countdown}
        tracks={tracks}
        onPlayTrack={onPlayTrack}
        onTuneMonthly={onTuneMonthly}
      />
    </div>
  );
}
