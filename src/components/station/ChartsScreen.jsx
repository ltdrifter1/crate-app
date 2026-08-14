import { color, fontDisplay, fontMono, homeSpace, chrome, glass, radius } from "../../theme";
import ChartHistoryPanel from "./ChartHistoryPanel";

/**
 * Charts tab — monthly countdown, overall or by channel / genre.
 */
export default function ChartsScreen({
  countdown = [],
  tracks = [],
  onPlayTrack = null,
  onTuneMonthly = null,
}) {
  return (
    <div style={{ position: "relative", paddingBottom: 56 }}>
      <div style={{
        padding: `calc(16px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 8px`,
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}>
          <span aria-hidden="true" style={{
            width: 10, height: 10,
            background: `linear-gradient(145deg, ${chrome.signal} 0%, ${chrome.steel} 100%)`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(18,20,26,0.18)",
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          }} />
          <div style={{
            fontFamily: fontMono, fontSize: 10, fontWeight: 800,
            letterSpacing: 1.8, textTransform: "uppercase", color: chrome.steel,
          }}>
            Station charts
          </div>
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: fontDisplay,
          fontSize: "clamp(26px, 5vw, 32px)",
          fontWeight: 800,
          letterSpacing: -0.4,
          color: color.ink,
          textTransform: "uppercase",
          lineHeight: 1.05,
        }}>
          Charts
        </h1>
        <p style={{
          margin: "8px 0 0",
          fontSize: 14,
          fontWeight: 500,
          color: color.muted,
          maxWidth: 400,
          lineHeight: 1.4,
        }}>
          Monthly board — overall, or split by channel or genre.
        </p>
      </div>

      {tracks.length === 0 && countdown.length === 0 && (
        <div style={{
          margin: `12px ${homeSpace.gutter}px 0`,
          padding: "18px 16px",
          borderRadius: radius.xl,
          border: `1px solid rgba(255,255,255,0.12)`,
          background: `
            linear-gradient(165deg, rgba(38,43,51,0.8) 0%, rgba(28,32,38,0.48) 100%)
          `,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
          backdropFilter: glass.blurSoft,
          WebkitBackdropFilter: glass.blurSoft,
          color: color.muted,
          fontSize: 13,
          lineHeight: 1.45,
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
