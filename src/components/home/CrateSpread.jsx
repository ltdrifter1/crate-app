import { color, fontDisplay, fontMono, homeSpace, type, y2k } from "../../theme";
import { trackLcdBits } from "../player/DeviceChrome";
import ArtFrame from "../ui/ArtFrame";

function RankPip({ rank }) {
  if (rank == null) return null;
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        minWidth: 28,
        height: 24,
        padding: "0 8px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 4,
        background: "rgba(58,66,80,0.55)",
        ...type.caption,
        fontWeight: 700,
        color: color.onDark,
        zIndex: 1,
      }}
    >
      #{rank}
    </span>
  );
}

function SpreadSleeve({
  track,
  rank = null,
  active = false,
  featured = false,
  onPlay,
  pool,
  priority = false,
}) {
  const bits = featured ? trackLcdBits(track) : [];
  return (
    <button
      type="button"
      className={featured ? "pmp-crate-lead pmp-press" : "pmp-crate-cell pmp-press"}
      onClick={() => onPlay?.(track, pool)}
      aria-label={
        rank != null
          ? `Play #${rank} ${track.title} by ${track.artist}`
          : `Play ${track.title} by ${track.artist}`
      }
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        minWidth: 0,
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
        <ArtFrame
          src={track.albumCover || null}
          size={featured ? 320 : 160}
          active={active}
          radius={6}
          priority={priority}
          style={{ width: "100%", height: "100%" }}
        >
          <RankPip rank={rank} />
        </ArtFrame>
      </div>
      <div
        style={{
          marginTop: featured ? 10 : 8,
          ...(featured ? type.headline : type.tileTitle),
          fontSize: featured ? 16 : type.tileTitle.fontSize,
          color: y2k.offWhite,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {track.title}
      </div>
      <div
        style={{
          marginTop: 2,
          ...type.tileMeta,
          fontSize: featured ? 13 : type.tileMeta.fontSize,
          color: featured ? color.body : color.muted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {track.artist}
      </div>
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
  );
}

/**
 * One crate spread: #1 sleeve spans 2×2, #2–5 fill the rest of that block,
 * remaining cuts continue on the same 4-column sleeve grid.
 */
export default function CrateSpread({
  title,
  subtitle = null,
  tracks = [],
  ranks = null,
  activeId = null,
  onPlayTrack = null,
  action = null,
}) {
  if (!tracks.length) return null;
  const shown = tracks.slice(0, 9);
  const rankAt = (i) => (Array.isArray(ranks) ? ranks[i] : null);

  return (
    <section
      aria-label={title}
      style={{
        marginTop: homeSpace.sectionGap,
        padding: `0 ${homeSpace.gutter}px`,
        contentVisibility: "auto",
        containIntrinsicSize: "320px",
      }}
    >
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2 style={{ ...type.title2, margin: 0, color: y2k.offWhite }}>{title}</h2>
          {subtitle ? (
            <p style={{ ...type.subhead, margin: "4px 0 0", color: color.muted }}>{subtitle}</p>
          ) : null}
        </div>
        {action?.onClick ? (
          <button
            type="button"
            onClick={action.onClick}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: fontDisplay,
              fontSize: 13,
              fontWeight: 650,
              color: color.accent,
              flexShrink: 0,
            }}
          >
            {action.label || "See All"}
          </button>
        ) : null}
      </div>
      <div className="pmp-crate-spread">
        {shown.map((track, i) => (
          <SpreadSleeve
            key={track.id || i}
            track={track}
            rank={rankAt(i)}
            featured={i === 0}
            priority={i === 0}
            active={activeId === track.id}
            onPlay={onPlayTrack}
            pool={tracks}
          />
        ))}
      </div>
    </section>
  );
}
