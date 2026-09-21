import { color, font, fontMono, homeSpace, chromeIconButton, glass, radius, radio, sectionTitle } from "../../theme";
import ChartHistoryPanel from "./ChartHistoryPanel";
import Icon from "../ui/Icon";

/**
 * Charts — monthly countdown board.
 * Device masthead + one LCD well; the board itself is in ChartHistoryPanel.
 */
export default function ChartsScreen({
  countdown = [],
  tracks = [],
  catalogLoading = false,
  onPlayTrack = null,
  onTuneMonthly = null,
  onAddToQueue = null,
  playlistCtx = null,
  nowPlayingId = null,
  onOpenMenu = null,
}) {
  const empty = !catalogLoading && tracks.length === 0 && countdown.length === 0;

  return (
    <div style={{
      position: "relative",
      paddingBottom: 56,
      overflow: "hidden",
    }}>
      <header style={{
        position: "relative",
        padding: `calc(12px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 10px`,
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
                aria-label="More"
                onClick={onOpenMenu}
                className="pmp-press"
                style={{ ...chromeIconButton(44), marginTop: 4 }}
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
                The monthly board — jewel cases, climbers, and the cuts on top.
              </p>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            marginTop: 14,
            padding: "8px 12px",
            borderRadius: radio.radiusLcd,
            background: radio.lcdFace,
            border: radio.lcdBorder,
            boxShadow: radio.lcdShadow,
            color: color.lcdSignal,
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.14,
            textTransform: "uppercase",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          Chart · Top 20 · Play &amp; request to climb
        </div>
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
        catalogLoading={catalogLoading}
        onPlayTrack={onPlayTrack}
        onTuneMonthly={onTuneMonthly}
        onAddToQueue={onAddToQueue}
        playlistCtx={playlistCtx}
        nowPlayingId={nowPlayingId}
      />
    </div>
  );
}
