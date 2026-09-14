import { color, fontDisplay, homeSpace, y2k } from "../../theme";
import CoverImage from "../ui/CoverImage";
import Icon from "../ui/Icon";

/**
 * ChannelCard — art-first station tile (Apple Music / YouTube Music).
 * Generic channel photo, name, blurb, play. No album-cover mosaic.
 */
function ChannelArt({ src, title, size, accent }) {
  const initial = (title || "?").trim().charAt(0).toUpperCase() || "?";

  if (src) {
    return (
      <CoverImage
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: accent
          ? `linear-gradient(160deg, ${accent} 0%, #10141A 78%)`
          : y2k.artGradient,
        fontFamily: fontDisplay,
        fontSize: Math.round(size * 0.34),
        fontWeight: 650,
        letterSpacing: -1.2,
        color: "rgba(244,246,248,0.82)",
      }}
    >
      {initial}
    </span>
  );
}

export default function ChannelCard({
  channel,
  covers = [],
  active = false,
  onClick = null,
  size = Math.round(homeSpace.tileTicket),
}) {
  const width = size;
  const title = channel.shortTitle || channel.title;
  const photo = channel.art || covers[0] || null;

  return (
    <button
      type="button"
      aria-label={`Tune ${channel.title} — ${channel.tagline}`}
      aria-pressed={active || undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className="pmp-lift pmp-channel-card"
      style={{
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        width,
        padding: 0,
        margin: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      <span
        style={{
          position: "relative",
          display: "block",
          width,
          height: width,
          borderRadius: 14,
          overflow: "hidden",
          background: y2k.artGradient,
          boxShadow: active
            ? "0 0 0 2px rgba(247,248,250,0.92), 0 12px 28px rgba(0,0,0,0.42)"
            : "0 10px 24px rgba(0,0,0,0.36)",
        }}
      >
        <ChannelArt src={photo} title={title} size={width} accent={channel.accent} />

        {active && (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 2,
              height: 22,
              padding: "0 8px",
              borderRadius: 980,
              background: "rgba(8,10,13,0.62)",
              color: y2k.offWhite,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: -0.1,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Playing
          </span>
        )}

        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#F7F8FA",
            color: "#0B0C0F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
            paddingLeft: active ? 0 : 1,
          }}
        >
          <Icon name={active ? "pause" : "play"} size={14} />
        </span>
      </span>

      <span
        style={{
          display: "block",
          marginTop: 10,
          fontFamily: fontDisplay,
          fontSize: 14,
          fontWeight: 650,
          letterSpacing: -0.22,
          lineHeight: 1.2,
          color: y2k.offWhite,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
      <span
        style={{
          display: "block",
          marginTop: 3,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: -0.08,
          lineHeight: 1.3,
          color: color.muted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {channel.tagline}
      </span>
    </button>
  );
}
