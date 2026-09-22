/**
 * TimeMachine — era-based discovery. Pick a year, hear what was on.
 * Makes music history accessible — a unique PlanetMP3 differentiator.
 */
import { useMemo, useState } from "react";
import {
  color, fontDisplay, fontMono, glass, homeSpace,
  neons, radio, trim,
} from "../../theme";
import CoverImage from "../ui/CoverImage";
import { catalogSleeveUrl } from "../../lib/catalogSleeve";

const ERA_RANGES = [
  { id: "late-90s",   label: "Late 90s",   years: [1996, 1997, 1998, 1999], vibe: "Napster eve. The dial-up era." },
  { id: "y2k",        label: "Y2K",         years: [2000, 2001, 2002],       vibe: "The internet went weird. Music followed." },
  { id: "early-00s",  label: "Early 2000s", years: [2003, 2004, 2005, 2006], vibe: "MySpace. Blogs. Pirate radio." },
  { id: "late-00s",   label: "Late 2000s",  years: [2007, 2008, 2009],       vibe: "Bloghaus. Dubstep. Post-everything." },
  { id: "2010s",      label: "2010s",        years: [2010, 2011, 2012, 2013, 2014, 2015], vibe: "Streaming takes over. Weird survives." },
  { id: "recent",     label: "Recent",       years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024], vibe: "Post-algorithm. Still digging." },
];

function releaseYear(track) {
  if (!track) return null;
  const raw = track.year || track.releaseYear || track.releaseDate || "";
  const y = parseInt(String(raw).slice(0, 4), 10);
  return Number.isFinite(y) && y > 1950 && y < 2030 ? y : null;
}

function tracksForEra(tracks, era) {
  const yearSet = new Set(era.years);
  return tracks.filter((t) => {
    const y = releaseYear(t);
    return y && yearSet.has(y) && (t.duration || 0) <= 900;
  });
}

function EraButton({ era, active, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: active ? `1px solid ${neons.cyan}88` : "1px solid rgba(91,101,116,0.18)",
        background: active ? radio.lcdFace : "transparent",
        boxShadow: active
          ? `0 0 14px ${neons.cyanGlow}, inset 0 1px 0 rgba(216,223,232,0.1)`
          : "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.18s ease",
      }}
    >
      <div
        style={{
          fontFamily: fontMono,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.1,
          color: active ? neons.phosphor : color.ink,
        }}
      >
        {era.label}
      </div>
      <div
        style={{
          fontFamily: fontMono,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 0.12,
          textTransform: "uppercase",
          color: active ? neons.cyan : color.faint,
          marginTop: 2,
        }}
      >
        {count > 0 ? `${count} tracks` : "No tracks yet"}
      </div>
    </button>
  );
}

function TrackSliver({ track, active, onClick }) {
  const coverUrl = catalogSleeveUrl(track.albumCover);
  const year = releaseYear(track);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderBottom: "1px solid rgba(91,101,116,0.1)",
        background: active ? "rgba(90,168,184,0.08)" : "transparent",
        border: "none",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 4,
          overflow: "hidden",
          flexShrink: 0,
          background: "rgba(58,66,80,0.55)",
          border: "1px solid rgba(216,223,232,0.12)",
        }}
      >
        {coverUrl ? (
          <CoverImage
            src={track.albumCover}
            alt=""
            width={44}
            height={44}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fontDisplay,
              fontSize: 16,
              fontWeight: 700,
              color: "rgba(183,228,238,0.35)",
            }}
          >
            {(track.title || "?")[0]}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.04,
            color: active ? neons.phosphor : color.lcdInk,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.title}
        </div>
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.1,
            textTransform: "uppercase",
            color: color.lcdMute,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.artist}
          {year ? ` · ${year}` : ""}
        </div>
      </div>
    </button>
  );
}

export default function TimeMachine({ tracks = [], onPlayTrack = null, activeId = null }) {
  const [selectedEra, setSelectedEra] = useState("y2k");

  const eraData = useMemo(
    () =>
      ERA_RANGES.map((era) => ({
        ...era,
        tracks: tracksForEra(tracks, era),
      })),
    [tracks]
  );

  const current = eraData.find((e) => e.id === selectedEra) || eraData[0];
  const totalHistorical = eraData.reduce((n, e) => n + e.tracks.length, 0);

  return (
    <div style={{ margin: `${homeSpace.sectionGap}px 0 0` }}>
      {/* Header */}
      <div style={{ padding: `0 ${homeSpace.gutter}px`, marginBottom: 14 }}>
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.18,
            textTransform: "uppercase",
            color: neons.violet,
            marginBottom: 3,
          }}
        >
          Time Machine
        </div>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: -0.35,
            color: color.ink,
          }}
        >
          What were people listening to?
        </div>
        <div
          style={{
            fontSize: 13,
            color: color.muted,
            marginTop: 3,
          }}
        >
          {totalHistorical > 0
            ? `${totalHistorical} tracks across eras in the crate.`
            : "Tracks with release years will show up here."}
        </div>
      </div>

      {/* Era selector */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          padding: `0 ${homeSpace.gutter}px`,
          marginBottom: 16,
        }}
      >
        {eraData.map((era) => (
          <EraButton
            key={era.id}
            era={era}
            active={selectedEra === era.id}
            count={era.tracks.length}
            onClick={() => setSelectedEra(era.id)}
          />
        ))}
      </div>

      {/* Era content */}
      {current && (
        <div
          style={{
            margin: `0 ${homeSpace.gutter}px`,
            borderRadius: 14,
            background: radio.moduleFace,
            border: "1px solid rgba(91,101,116,0.18)",
            boxShadow:
              "inset 0 1px 0 rgba(216,223,232,0.45), 0 8px 24px rgba(58,66,80,0.14)",
            overflow: "hidden",
          }}
        >
          {/* Era header / LCD strip */}
          <div
            style={{
              padding: "10px 16px",
              background: radio.lcdFace,
              borderBottom: radio.lcdBorder,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              className="pmp-lcd-pip"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: neons.violet,
                boxShadow: `0 0 6px ${neons.violet}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.14,
                color: neons.phosphor,
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {current.label} — {current.vibe}
            </span>
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 9,
                color: neons.violet,
                flexShrink: 0,
              }}
            >
              {current.tracks.length} cuts
            </span>
          </div>

          {/* Track list */}
          {current.tracks.length > 0 ? (
            <div>
              {current.tracks.slice(0, 20).map((track) => (
                <TrackSliver
                  key={track.id}
                  track={track}
                  active={activeId === track.id}
                  onClick={() => onPlayTrack?.(track, current.tracks)}
                />
              ))}
              {current.tracks.length > 20 && (
                <div
                  style={{
                    padding: "10px 14px",
                    fontFamily: fontMono,
                    fontSize: 10,
                    color: color.muted,
                    letterSpacing: 0.1,
                    textTransform: "uppercase",
                  }}
                >
                  + {current.tracks.length - 20} more cuts in this era
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: "28px 18px",
                textAlign: "center",
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.14,
                textTransform: "uppercase",
                color: color.muted,
              }}
            >
              No tracks from this era yet.
              <br />
              <span style={{ color: neons.violet, marginTop: 4, display: "block" }}>
                Check back as the crate fills.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
