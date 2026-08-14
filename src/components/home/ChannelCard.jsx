import { fontDisplay, fontMono, glassPill, homeSpace, y2k } from "../../theme";
import ArtFrame from "../ui/ArtFrame";

/**
 * ChannelCard — dial channel tile with sleeve mosaic + frosted CH bug.
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
        touchAction: "pan-x",
      }}
    >
      <ArtFrame
        covers={covers}
        size={size}
        width={size}
        height={h}
        active={active}
        radius={16}
      >
        {/* CH bug — frosted glass pill */}
        <span
          style={{
            ...glassPill({ active, compact: true }),
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1,
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.2,
            color: active ? y2k.neon : y2k.offWhite,
            padding: "6px 10px",
          }}
        >
          CH·{num}
        </span>

        {active && (
          <span
            style={{
              ...glassPill({ active: true, compact: true }),
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: fontMono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.4,
              color: y2k.neon,
              padding: "6px 9px",
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

        {/* Lower-third glass plate */}
        <span
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            bottom: 8,
            zIndex: 1,
            padding: "12px 12px 11px",
            borderRadius: 12,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%), rgba(10,11,13,0.55)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(16px) saturate(1.3)",
            WebkitBackdropFilter: "blur(16px) saturate(1.3)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.16), 0 8px 20px rgba(0,0,0,0.35)",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: fontDisplay,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: -0.2,
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
              letterSpacing: -0.05,
              color: "rgba(244,246,248,0.62)",
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
