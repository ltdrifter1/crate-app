import { color, fontDisplay, homeSpace, y2k } from "../../theme";
import CoverImage from "../ui/CoverImage";
import Icon from "../ui/Icon";

/**
 * ChannelCard — art-first station tile (Apple Music / YouTube Music).
 * Cover, name, blurb, play. No ticket stub, perforation, or novelty stamp.
 */
function ChannelArt({ covers = [], title, size }) {
  const tiles = [...new Set(covers.filter(Boolean))].slice(0, 4);
  const cell = Math.ceil(size / 2);
  const initial = (title || "?").trim().charAt(0).toUpperCase() || "?";

  if (tiles.length >= 4) {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          width: "100%",
          height: "100%",
        }}
      >
        {tiles.map((src, i) => (
          <CoverImage
            key={`${src}-${i}`}
            src={src}
            alt=""
            width={cell}
            height={cell}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ))}
      </span>
    );
  }

  if (tiles[0]) {
    return (
      <CoverImage
        src={tiles[0]}
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
        background: y2k.artGradient,
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

  return (
    <button
      type="button"
      aria-label={`Tune ${channel.title} — ${channel.tagline}`}
      aria-pressed={active || undefined}
      onClick={onClick || undefined}
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
        touchAction: "pan-x",
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
        <ChannelArt covers={covers} title={title} size={width} />

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
