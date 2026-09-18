import { color, fontDisplay, fontMono, homeSpace, type, y2k } from "../../theme";
import { trackLcdBits } from "../player/DeviceChrome";
import ArtFrame from "../ui/ArtFrame";
import TrackCard from "./TrackCard";

/**
 * One magazine/crate spread: oversized lead sleeve + stacked cuts.
 * Reuses TrackCard for the remaining rail so we don't add a second tile system.
 */
export default function CrateSpread({
  title,
  subtitle = null,
  tracks = [],
  activeId = null,
  onPlayTrack = null,
  leadSize = 220,
}) {
  if (!tracks.length) return null;
  const [lead, ...rest] = tracks;
  const bits = trackLcdBits(lead);
  const side = rest.slice(0, 4);

  return (
    <section
      aria-label={title}
      style={{
        marginTop: homeSpace.sectionGap,
        padding: `0 ${homeSpace.gutter}px`,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ ...type.title2, margin: 0, color: y2k.offWhite }}>{title}</h2>
        {subtitle ? (
          <p style={{ ...type.subhead, margin: "4px 0 0", color: color.muted }}>{subtitle}</p>
        ) : null}
      </div>
      <div
        className="pmp-crate-spread"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 220px) minmax(0, 1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <button
          type="button"
          className="pmp-press"
          onClick={() => onPlayTrack?.(lead, tracks)}
          aria-label={`Play ${lead.title} by ${lead.artist}`}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
            maxWidth: leadSize,
          }}
        >
          <ArtFrame
            src={lead.albumCover || null}
            size={leadSize}
            active={activeId === lead.id}
            radius={6}
            priority
          />
          <div
            style={{
              marginTop: 10,
              fontFamily: fontDisplay,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: -0.3,
              color: y2k.offWhite,
            }}
          >
            {lead.title}
          </div>
          <div style={{ marginTop: 3, fontSize: 13, color: color.body }}>{lead.artist}</div>
          {bits.length > 0 && (
            <div
              style={{
                marginTop: 6,
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.12,
                textTransform: "uppercase",
                color: color.accent,
              }}
            >
              {bits.join(" · ")}
            </div>
          )}
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          {side.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => onPlayTrack?.(track, tracks)}
              aria-label={`Play ${track.title} by ${track.artist}`}
              style={{
                display: "grid",
                gridTemplateColumns: "56px minmax(0, 1fr)",
                gap: 10,
                alignItems: "center",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <ArtFrame
                src={track.albumCover || null}
                size={56}
                active={activeId === track.id}
                radius={4}
              />
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    ...type.tileTitle,
                    color: y2k.offWhite,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {track.title}
                </span>
                <span
                  style={{
                    display: "block",
                    marginTop: 2,
                    fontSize: 12,
                    color: color.muted,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {track.artist}
                  {track.bpm ? ` · ${Math.round(Number(track.bpm))} BPM` : ""}
                  {track.camelot ? ` · ${track.camelot}` : ""}
                </span>
              </span>
            </button>
          ))}
          {rest.length > 4 ? (
            <div style={{ overflowX: "auto", display: "flex", gap: 12, paddingTop: 6 }}>
              {rest.slice(4).map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  size={120}
                  active={activeId === track.id}
                  onClick={() => onPlayTrack?.(track, tracks)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
