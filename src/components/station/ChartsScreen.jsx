import { color, fontDisplay, fontMono, homeSpace, chrome, glass } from "../../theme";
import ChartHistoryPanel from "./ChartHistoryPanel";
import CountdownRail from "./CountdownRail";

/**
 * Charts tab — live countdown + archive (climbers, weekly reveal, #1s, past days).
 * Kept off Home so the station hero stays fast and focused.
 */
export default function ChartsScreen({
  countdown = [],
  tracks = [],
  onPlayTrack = null,
  onTuneCountdown = null,
  onTuneWeekly = null,
  activeId = null,
  isPlaying = false,
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
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 0 0 1px rgba(18,20,26,0.18)",
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
          maxWidth: 360,
          lineHeight: 1.4,
        }}>
          Today&apos;s countdown, climbers, weekly reveal, and the archive.
        </p>
      </div>

      {countdown.length > 0 ? (
        <CountdownRail
          entries={countdown}
          onPlayTrack={onPlayTrack}
          onTuneIn={onTuneCountdown}
          activeId={activeId}
          isPlaying={isPlaying}
        />
      ) : (
        <div style={{
          margin: `12px ${homeSpace.gutter}px 0`,
          padding: "18px 16px",
          borderRadius: 2,
          border: `1px solid ${glass.border}`,
          background: glass.fillStrong,
          color: color.muted,
          fontSize: 13,
          lineHeight: 1.45,
        }}>
          Play and request cuts to build today&apos;s chart. History fills in as you listen.
        </div>
      )}

      <ChartHistoryPanel
        countdown={countdown}
        tracks={tracks}
        onPlayTrack={onPlayTrack}
        onTuneWeekly={onTuneWeekly}
      />
    </div>
  );
}
