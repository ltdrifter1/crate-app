import { fontDisplay, fontMono, homeSpace, y2k } from "../../theme";
import ArtFrame from "../ui/ArtFrame";

/**
 * ChannelCard — dial channel tile with sleeve mosaic + CH bug overlay.
 */
export default function ChannelCard({
  channel,
  covers = [],
  active = false,
  onClick = null,
  size = Math.round(homeSpace.tile * 1.05),
}) {
  const num = String(channel.num ?? 0).padStart(2, "0");
  const h = Math.round(size * 1.12);

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
        width: size,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <ArtFrame
        covers={covers}
        size={size}
        width={size}
        height={h}
        active={active}
        radius={14}
      >
        {/* CH bug — MTV-style channel ident */}
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1,
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.6,
            color: active ? y2k.neon : y2k.offWhite,
            padding: "5px 9px",
            borderRadius: 6,
            border: `1px solid ${active ? "rgba(200,242,65,0.45)" : "rgba(255,255,255,0.18)"}`,
            background: "rgba(10,8,16,0.72)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: active ? `0 0 12px ${y2k.neonSoft}` : "none",
          }}
        >
          CH·{num}
        </span>

        {active && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: fontMono,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 1.6,
              color: y2k.neon,
              padding: "5px 8px",
              borderRadius: 6,
              background: "rgba(10,8,16,0.72)",
              border: "1px solid rgba(200,242,65,0.35)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
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

        {/* Lower-third title plate */}
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            padding: "28px 12px 12px",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(8,6,14,0.55) 40%, rgba(8,6,14,0.92) 100%)",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: fontDisplay,
              fontSize: 14,
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
              display: "block",
              marginTop: 3,
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(242,239,230,0.62)",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {channel.tagline}
          </span>
        </span>
      </ArtFrame>
    </button>
  );
}
