import { useState } from "react";
import { color, fontDisplay, fontMono, homeSpace, motion, radio, y2k } from "../../theme";
import ArtFrame from "../ui/ArtFrame";

/**
 * CD wallet — one open jewel case, the rest as selectable spines.
 */
export default function SleeveWallet({
  albums = [],
  onOpenAlbum = null,
  onPlayTrack = null,
}) {
  const [open, setOpen] = useState(0);
  if (!albums.length) return null;
  const current = albums[Math.min(open, albums.length - 1)];
  const cover = current?.coverTrack?.albumCover || null;

  const openAlbum = (album) => {
    if (onOpenAlbum) onOpenAlbum(album.slug);
    else if (album.coverTrack) onPlayTrack?.(album.coverTrack, album.tracks);
  };

  return (
    <div className="pmp-sleeve-wallet" style={{ padding: `8px ${homeSpace.gutter}px 0` }}>
      <button
        type="button"
        className="pmp-lift pmp-release pmp-release--lead"
        aria-label={`Open album ${current.title}${current.artist ? ` by ${current.artist}` : ""}`}
        onClick={() => openAlbum(current)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          width: "100%",
          padding: 12,
          borderRadius: radio.radius,
          border: radio.border,
          background: radio.moduleFace,
          boxShadow: radio.moduleShadow,
          cursor: "pointer",
          textAlign: "left",
          animation: `rise 0.4s ${motion.ease} both`,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span className="pmp-release-art" style={{ flex: "0 0 148px" }}>
          <ArtFrame
            src={cover}
            size={148}
            radius={8}
            eager
            style={{ width: 148, height: 148 }}
          />
        </span>
        <span className="pmp-release-copy" style={{ minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontFamily: fontMono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.14,
              textTransform: "uppercase",
              color: color.muted,
              marginBottom: 6,
            }}
          >
            Open case
          </span>
          <span
            style={{
              display: "block",
              fontFamily: fontDisplay,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: -0.4,
              color: y2k.offWhite,
              lineHeight: 1.15,
            }}
          >
            {current.title}
          </span>
          <span
            style={{
              display: "block",
              marginTop: 6,
              fontSize: 14,
              color: color.muted,
            }}
          >
            {current.artist}
            {current.count ? ` · ${current.count} tracks` : ""}
          </span>
        </span>
      </button>

      {albums.length > 1 && (
        <div
          className="hide-scroll pmp-rail"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            padding: "14px 2px 6px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {albums.map((album, i) => {
            const selected = i === open;
            return (
              <button
                key={album.slug || i}
                type="button"
                className="pmp-press"
                aria-label={`Select album ${album.title}`}
                aria-pressed={selected}
                onClick={() => {
                  if (selected) openAlbum(album);
                  else setOpen(i);
                }}
                style={{
                  flex: "0 0 auto",
                  width: selected ? 72 : 28,
                  height: 96,
                  padding: 0,
                  border: selected ? radio.borderChrome : radio.borderQuiet,
                  borderRadius: 4,
                  overflow: "hidden",
                  background: radio.moduleFace,
                  cursor: "pointer",
                  boxShadow: selected ? radio.moduleShadow : "none",
                }}
              >
                <ArtFrame
                  src={album.coverTrack?.albumCover || null}
                  width={selected ? 72 : 28}
                  height={96}
                  radius={3}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 3,
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
