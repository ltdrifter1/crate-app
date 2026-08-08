import { color, fontDisplay, fontMono, y2k } from "../../theme";

/**
 * ChannelCard — dial channel tile for the Featured Channels rail.
 * Consistent aspect, big CH number as the Y2K "artwork", short title + tagline.
 */
export default function ChannelCard({ channel, active = false, onClick = null }) {
  const num = String(channel.num ?? 0).padStart(2, "0");
  return (
    <button
      type="button"
      aria-label={`Tune ${channel.title} — ${channel.tagline}`}
      aria-pressed={active || undefined}
      onClick={onClick || undefined}
      className="pmp-lift"
      style={{
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        width: 150,
        height: 178,
        borderRadius: 18,
        border: `1px solid ${active ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.08)"}`,
        background: `
          radial-gradient(120% 80% at 80% -10%, ${active ? "rgba(139,92,246,0.28)" : "rgba(139,92,246,0.1)"} 0%, transparent 60%),
          linear-gradient(165deg, ${y2k.charcoalRaised} 0%, #101116 100%)
        `,
        boxShadow: active
          ? `0 0 22px ${y2k.purpleGlow}, 0 12px 28px rgba(0,0,0,0.4)`
          : "inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 24px rgba(0,0,0,0.35)",
        cursor: "pointer",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Oversized channel number — the artwork */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          right: -8,
          top: -14,
          fontFamily: fontDisplay,
          fontSize: 88,
          fontWeight: 800,
          fontStyle: "italic",
          letterSpacing: -4,
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: active
            ? "1.5px rgba(167,139,250,0.55)"
            : "1.5px rgba(255,255,255,0.1)",
          userSelect: "none",
        }}
      >
        {num}
      </span>

      <span
        style={{
          fontFamily: fontMono,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 1.8,
          color: active ? y2k.purpleBright : color.faint,
          padding: "4px 8px",
          borderRadius: 6,
          border: `1px solid ${active ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.1)"}`,
          background: active ? y2k.purpleSoft : "rgba(255,255,255,0.04)",
        }}
      >
        CH·{num}
      </span>

      <span style={{ flex: 1 }} />

      {active && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: fontMono,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 1.6,
            color: y2k.neon,
            marginBottom: 6,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: y2k.neon,
              boxShadow: `0 0 6px ${y2k.neon}`,
              animation: "stageLiveDot 1.6s ease-in-out infinite",
            }}
          />
          ON AIR
        </span>
      )}

      <span
        style={{
          fontFamily: fontDisplay,
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: y2k.offWhite,
          lineHeight: 1.15,
        }}
      >
        {channel.shortTitle || channel.title}
      </span>
      <span
        style={{
          marginTop: 4,
          fontSize: 11,
          fontWeight: 500,
          color: color.faint,
          lineHeight: 1.3,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {channel.tagline}
      </span>
    </button>
  );
}
