import { color, font, homeSpace, chrome, chromeIconButton, glass, radius, motion, sectionTitle } from "../../theme";
import ChartHistoryPanel from "./ChartHistoryPanel";
import Icon from "../ui/Icon";

const CHART_CSS = `
  .pmp-chart-row { transition: background ${"{base}"} ${"{ease}"}, box-shadow ${"{base}"}; }
  .pmp-chart-row:hover { background: rgba(91,101,116,0.08) !important; }
  .pmp-chart-row:active { transform: scale(0.992); }
  .pmp-chart-scan {
    position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px, transparent 2px,
      rgba(91,101,116,0.05) 2px, rgba(91,101,116,0.05) 3px
    );
    mix-blend-mode: multiply; opacity: 0.12;
  }
  @keyframes pmpRankUp {
    from { transform: translateY(7px); opacity: 0.25; }
    to { transform: none; opacity: 1; }
  }
  @keyframes pmpRankDown {
    from { transform: translateY(-7px); opacity: 0.25; }
    to { transform: none; opacity: 1; }
  }
  .pmp-rank-up { animation: pmpRankUp 0.55s ${"{ease}"} both; }
  .pmp-rank-down { animation: pmpRankDown 0.55s ${"{ease}"} both; }
  @media (prefers-reduced-motion: reduce) {
    .pmp-rank-up, .pmp-rank-down, .pmp-chart-row { animation: none !important; transform: none !important; }
  }
`.replaceAll("{base}", motion.base).replaceAll("{ease}", motion.ease);

/**
 * Charts — monthly countdown board.
 * Premium iOS type, tactile filters, restrained Y2K glass/chrome.
 */
export default function ChartsScreen({
  countdown = [],
  tracks = [],
  onPlayTrack = null,
  onTuneMonthly = null,
  onAddToQueue = null,
  playlistCtx = null,
  nowPlayingId = null,
  onOpenMenu = null,
}) {
  const empty = tracks.length === 0 && countdown.length === 0;

  return (
    <div style={{
      position: "relative",
      paddingBottom: 56,
      overflow: "hidden",
      animation: `rise 0.5s ${motion.ease} both`,
    }}>
      <style>{CHART_CSS}</style>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 80% 48% at 8% -10%, rgba(91,101,116,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 36% at 100% 8%, rgba(111,191,58,0.06) 0%, transparent 46%)
          `,
        }}
      />

      <header style={{
        position: "relative",
        padding: `calc(12px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 8px`,
      }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
            {onOpenMenu && (
              <button
                type="button"
                aria-label="Browse"
                onClick={onOpenMenu}
                className="pmp-press"
                style={{ ...chromeIconButton(36), marginTop: 4 }}
              >
                <Icon name="menu" size={16} />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <h1 style={{
                ...sectionTitle,
                fontSize: 32,
                letterSpacing: -0.7,
                fontWeight: 700,
              }}>
                Charts
              </h1>
              <p style={{
                margin: "4px 0 0",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: font,
                letterSpacing: -0.08,
                color: color.muted,
                lineHeight: 1.4,
              }}>
                Monthly board — ranks, climbers, and the cuts on top.
              </p>
            </div>
          </div>
        </div>

        <div aria-hidden="true" style={{
          marginTop: 16,
          height: 1,
          background: `linear-gradient(90deg, rgba(${chrome.cyanRgb},0.4) 0%, rgba(216,223,232,0.1) 42%, transparent 100%)`,
          boxShadow: `0 0 10px rgba(${chrome.cyanRgb},0.16)`,
        }} />
      </header>

      {empty && (
        <div
          role="status"
          style={{
            position: "relative",
            margin: `8px ${homeSpace.gutter}px 0`,
            padding: "22px 18px",
            borderRadius: radius.lg,
            border: `1px solid ${glass.borderSoft}`,
            background: `
              linear-gradient(180deg, rgba(91,101,116,0.06) 0%, transparent 44%),
              ${glass.fill}
            `,
            boxShadow: `inset 0 1px 0 ${glass.highlight}`,
            backdropFilter: glass.blurSoft,
            WebkitBackdropFilter: glass.blurSoft,
            color: color.body,
            fontSize: 15,
            lineHeight: 1.5,
            fontFamily: font,
          }}
        >
          Play and request cuts to build this month&apos;s chart. History fills in as you listen.
        </div>
      )}

      <ChartHistoryPanel
        countdown={countdown}
        tracks={tracks}
        onPlayTrack={onPlayTrack}
        onTuneMonthly={onTuneMonthly}
        onAddToQueue={onAddToQueue}
        playlistCtx={playlistCtx}
        nowPlayingId={nowPlayingId}
      />
    </div>
  );
}
