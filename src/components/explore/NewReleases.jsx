import { useMemo, useState } from "react";
import { color, fontDisplay, fontMono, homeSpace, motion, neons, radio } from "../../theme";
import { newReleaseAlbums, newReleaseBays, rankNewReleaseAlbums } from "../../lib/newReleases";
import ReleaseCard from "../home/ReleaseCard";

const ALL = { id: null, num: 0, title: "All" };

/**
 * New Releases — hanging signs + sleeve grid.
 * One filter. No magazine end-cap, no stacked aisles.
 */
export default function NewReleases({
  tracks = [],
  onOpenAlbum = null,
  onPlayTrack = null,
}) {
  const [channelId, setChannelId] = useState(null);
  const ranked = useMemo(() => rankNewReleaseAlbums(tracks), [tracks]);
  const bays = useMemo(() => newReleaseBays(tracks, ranked), [tracks, ranked]);
  const albums = useMemo(
    () => newReleaseAlbums(tracks, { channelId, ranked }),
    [tracks, channelId, ranked]
  );

  if (!albums.length && !bays.length) {
    if (!tracks.length) return null;
    return (
      <p
        style={{
          margin: 0,
          padding: `16px ${homeSpace.gutter}px`,
          fontSize: 14,
          color: color.muted,
        }}
      >
        New sleeves land here when albums hit the crate.
      </p>
    );
  }

  const signs = [ALL, ...bays];
  const open = (album) => {
    if (onOpenAlbum) onOpenAlbum(album.slug);
    else if (album.coverTrack) onPlayTrack?.(album.coverTrack, album.tracks);
  };

  return (
    <section aria-label="New Releases" style={{ marginTop: 12 }}>
      <div style={{ padding: `0 ${homeSpace.gutter}px 12px` }}>
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.18,
            textTransform: "uppercase",
            color: neons.cyan,
            marginBottom: 3,
          }}
        >
          New Releases
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
          Just landed in the crate.
        </div>
      </div>

      {signs.length > 1 && (
        <div
          className="hide-scroll"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: `0 ${homeSpace.gutter}px 14px`,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {signs.map((bay) => {
            const selected = channelId === bay.id;
            const ident = bay.num
              ? `CH-${String(bay.num).padStart(2, "0")}  ${bay.title}`
              : bay.title;
            return (
              <button
                key={bay.id || "all"}
                type="button"
                aria-pressed={selected}
                aria-label={ident}
                className="pmp-press"
                onClick={() => setChannelId(bay.id)}
                style={{
                  flex: "0 0 auto",
                  height: 32,
                  padding: bay.accent ? "0 10px 0 13px" : "0 10px",
                  borderRadius: radio.radiusLcd,
                  border: selected ? radio.lcdBorder : radio.borderQuiet,
                  background: selected ? radio.lcdFace : radio.moduleFace,
                  boxShadow: bay.accent
                    ? `${selected ? radio.lcdShadow + ", " : ""}inset 3px 0 0 ${bay.accent}`
                    : selected ? radio.lcdShadow : "none",
                  color: selected ? color.lcdSignal : color.body,
                  cursor: "pointer",
                  fontFamily: fontMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.1,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  transition: `background ${motion.base}, color ${motion.base}`,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {ident}
              </button>
            );
          })}
        </div>
      )}

      {albums.length > 0 ? (
        <div className="pmp-new-releases-grid">
          {albums.map((album) => (
            <ReleaseCard
              key={album.slug}
              album={album}
              variant="tile"
              onClick={() => open(album)}
            />
          ))}
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            padding: `8px ${homeSpace.gutter}px 0`,
            fontSize: 14,
            color: color.muted,
          }}
        >
          Nothing new in this bay yet.
        </p>
      )}
    </section>
  );
}
