import { color, font, fontDisplay, fontMono, homeSpace, chromeIconButton, glass, neons, radius, radio, sectionTitle } from "../../theme";
import ChartHistoryPanel from "./ChartHistoryPanel";
import Icon from "../ui/Icon";

/**
 * Charts — monthly countdown board.
 * Full Y2K countdown-board header + ChartHistoryPanel board.
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
  const topEntry = countdown[0]?.track || countdown[0] || null;
  const climberCount = countdown.filter((c) => (c.movement || c.delta) && c.movement === "up").length;

  return (
    <div style={{ position: "relative", paddingBottom: 56, overflow: "hidden" }}>

      {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
      <header
        style={{
          position: "relative",
          padding: `calc(12px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 16px`,
          overflow: "hidden",
        }}
      >
        {/* Background scanline wash */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `repeating-linear-gradient(
              to bottom,
              transparent 0px, transparent 3px,
              rgba(58,66,80,0.04) 3px, rgba(58,66,80,0.04) 4px
            )`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Neon glow bloom */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${neons.cyanGlow} 0%, transparent 70%)`,
            animation: "pmpNeonPulse 5s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span
                    className="pmp-lcd-pip"
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: neons.red,
                      boxShadow: `0 0 8px ${neons.red}`,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: fontMono,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.22,
                      textTransform: "uppercase",
                      color: neons.phosphor,
                    }}
                  >
                    Live · Monthly Countdown
                  </span>
                </div>
                <h1
                  style={{
                    ...sectionTitle,
                    fontSize: 38,
                    letterSpacing: -1.0,
                    fontWeight: 800,
                    lineHeight: 1,
                    margin: 0,
                  }}
                >
                  Charts
                </h1>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: font,
                    letterSpacing: -0.05,
                    color: color.muted,
                    lineHeight: 1.4,
                  }}
                >
                  Play and request tracks to climb the board.
                  {climberCount > 0 && ` ${climberCount} tracks moving up this month.`}
                </p>
              </div>
            </div>
          </div>

          {/* LCD status bar with marquee */}
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: radio.radiusLcd,
              background: radio.lcdFace,
              border: radio.lcdBorder,
              boxShadow: radio.lcdShadow,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              className="pmp-lcd-pip"
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: neons.cyan,
                boxShadow: `0 0 5px ${neons.cyan}`,
                flexShrink: 0,
              }}
            />
            <div className="pmp-lcd-marquee" style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.16,
                  textTransform: "uppercase",
                  color: color.lcdSignal,
                }}
              >
                {topEntry
                  ? `#1 ${topEntry.title || "Unknown"} — ${topEntry.artist || "Unknown"} · Top 20 · Play & request to climb · `
                  : "Top 20 · Play & request to climb · PlanetMP3 Charts · "}
                {topEntry
                  ? `#1 ${topEntry.title || "Unknown"} — ${topEntry.artist || "Unknown"} · Top 20 · Play & request to climb · `
                  : "Top 20 · Play & request to climb · PlanetMP3 Charts · "}
              </span>
            </div>
          </div>

          {/* Stat pills */}
          {countdown.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <StatPill label="Tracks" value={countdown.length} accent={neons.cyan} />
              {climberCount > 0 && (
                <StatPill label="Climbing" value={climberCount} accent={neons.lime} />
              )}
              {countdown.filter((c) => c.movement === "debut" || c.movement === "new").length > 0 && (
                <StatPill
                  label="New entries"
                  value={countdown.filter((c) => c.movement === "debut" || c.movement === "new").length}
                  accent={neons.violet}
                />
              )}
            </div>
          )}
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

function StatPill({ label, value, accent }) {
  return (
    <div
      style={{
        padding: "5px 10px",
        borderRadius: 6,
        background: radio.lcdFace,
        border: `1px solid ${accent}44`,
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span
        style={{
          fontFamily: fontMono,
          fontSize: 13,
          fontWeight: 700,
          color: neons.phosphor,
          letterSpacing: 0.1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: fontMono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.18,
          textTransform: "uppercase",
          color: accent,
        }}
      >
        {label}
      </span>
    </div>
  );
}
