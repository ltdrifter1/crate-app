import { color, font, fontDisplay, glassPill, homeSpace, motion, type, y2k } from "../../theme";
import ArtFrame from "../ui/ArtFrame";

function WorldTile({ tile, onOpen, delay = 0, lead = false }) {
  const city = tile.cities?.[0] || tile.familyLabel;
  return (
    <button
      type="button"
      className={`pmp-lift pmp-world-tile${lead ? " pmp-world-tile--lead" : ""}`}
      onClick={() => onOpen?.({ type: "scene", id: tile.id })}
      aria-label={`${tile.label} — ${tile.count} ${tile.count === 1 ? "track" : "tracks"}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 8,
        width: "100%",
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        animation: `rise 0.45s ${motion.ease} ${delay}s both`,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <ArtFrame
        src={tile.photo}
        size={lead ? 220 : 148}
        radius={lead ? 10 : 8}
        eager={lead}
        style={{ width: "100%", height: "auto", aspectRatio: "1 / 1" }}
      />
      <span>
        <span
          style={{
            display: "block",
            fontFamily: fontDisplay,
            fontSize: lead ? 18 : 14,
            fontWeight: 700,
            letterSpacing: -0.25,
            lineHeight: 1.15,
            color: y2k.offWhite,
          }}
        >
          {tile.label}
        </span>
        <span
          style={{
            display: "block",
            marginTop: 3,
            fontFamily: font,
            fontSize: 13,
            fontWeight: 500,
            color: color.muted,
            letterSpacing: -0.08,
          }}
        >
          {city}
          {" · "}
          {tile.count} {tile.count === 1 ? "track" : "tracks"}
        </span>
      </span>
    </button>
  );
}

function LaneIndex({ lanes = [], onOpen = null }) {
  if (!lanes.length) return null;
  return (
    <div style={{ padding: `18px ${homeSpace.gutter}px 0` }}>
      <div
        style={{
          ...type.headline,
          marginBottom: 8,
          color: color.ink,
        }}
      >
        All genres
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {lanes.map((plate) => (
          <button
            key={plate.lane}
            type="button"
            className="pmp-press pmp-explore-genre"
            onClick={() => onOpen?.({ type: "genre", id: plate.lane })}
            aria-label={`${plate.lane} — ${plate.trackCount} ${plate.trackCount === 1 ? "track" : "tracks"}`}
            style={{
              ...glassPill({ compact: true }),
              minHeight: 34,
              padding: "0 12px",
              cursor: "pointer",
              fontFamily: fontDisplay,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: -0.12,
              color: color.ink,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {plate.lane}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Disc tray — one lead jewel case per family, siblings smaller.
 * Captions live under the sleeve. No wash over artwork.
 */
export default function WorldAtlas({ families = [], lanes = [], onOpen = null }) {
  if (!families.length && !lanes.length) return null;
  let i = 0;
  return (
    <div>
      {families.map((family) => (
        <section
          key={family.id}
          aria-label={family.label}
          style={{ marginTop: i === 0 ? 12 : 26 }}
        >
          <div style={{ padding: `0 ${homeSpace.gutter}px 10px` }}>
            <h2
              style={{
                margin: 0,
                ...type.title3,
                color: color.ink,
              }}
            >
              {family.label}
            </h2>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 13,
                color: color.muted,
                lineHeight: 1.4,
                maxWidth: 420,
              }}
            >
              {family.story}
            </p>
          </div>
          <div className="pmp-world-tray">
            {family.tiles.map((tile, idx) => {
              const delay = Math.min(i, 12) * 0.03;
              i += 1;
              return (
                <WorldTile
                  key={tile.id}
                  tile={tile}
                  onOpen={onOpen}
                  delay={delay}
                  lead={idx === 0}
                />
              );
            })}
          </div>
        </section>
      ))}
      <LaneIndex lanes={lanes} onOpen={onOpen} />
    </div>
  );
}
