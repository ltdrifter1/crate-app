import {
  font,
  fontDisplay,
  fontMono,
  color,
  radius,
  glass,
  artShadow,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from "../../theme";
import { AlbumArt } from "../listen/AlbumArt";
import { TrackMoreButton, TrackRow, useTrackMenu, TrackActionsMenu } from "../listen/TrackRow";
import CoverImage from "../ui/CoverImage";
import Icon from "../ui/Icon";
import { useIsPlaying } from "../../usePlayerTransport";

/** Artist destination — name, albums, tracks. No generated copy. */
export default function ArtistPage({
  artist,
  onBack,
  onPlay,
  onOpenAlbum,
  currentTrack,
  isPlaying,
  onLike,
  playlistCtx,
}) {
  if (!artist) {
    return (
      <EmptyEntity
        title="Artist not found"
        body="This name isn’t in the catalog yet."
        onBack={onBack}
      />
    );
  }

  const cover = artist.coverTrack;
  const n = artist.count || 0;

  return (
    <div style={{ minHeight: "100%", animation: "fadeIn 0.28s ease both", fontFamily: font }}>
      <EntityHero
        onBack={onBack}
        title={artist.name}
        meta={`${n} track${n === 1 ? "" : "s"}${artist.topGenre ? ` · ${artist.topGenre}` : ""}`}
        coverUrl={cover?.albumCover}
        onPlay={() => cover && onPlay(cover, artist.tracks)}
      />

      {artist.albums?.length > 0 && (
        <section style={{ padding: "24px 20px 8px" }}>
          <SectionTitle>Albums</SectionTitle>
          <div className="hide-scroll" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
            {artist.albums.map((al) => (
              <button
                key={al.slug}
                type="button"
                onClick={() => onOpenAlbum?.(al.slug)}
                style={{
                  flexShrink: 0,
                  width: 140,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: onOpenAlbum ? "pointer" : "default",
                  textAlign: "left",
                  color: color.ink,
                }}
              >
                <div style={{ width: 140, height: 140, overflow: "hidden", marginBottom: 10, background: color.surfaceRaised, borderRadius: 8 }}>
                  {al.coverTrack ? (
                    <AlbumArt track={al.coverTrack} size={140} borderRadius={8} />
                  ) : null}
                </div>
                <div style={{ fontSize: 13, fontWeight: 650, fontFamily: fontDisplay, letterSpacing: -0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {al.title}
                </div>
                <div style={{ fontSize: 11, color: color.muted, marginTop: 3 }}>{al.count} tracks</div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section style={{ padding: "20px 16px 40px" }}>
        <SectionTitle>Tracks</SectionTitle>
        {artist.tracks.map((t) => (
          <TrackRow
            key={t.id}
            track={t}
            onPlay={() => onPlay(t, artist.tracks)}
            active={currentTrack?.id === t.id}
            isPlaying={isPlaying}
            onLike={onLike}
            playlistCtx={playlistCtx}
          />
        ))}
      </section>
    </div>
  );
}

function formatClock(sec) {
  const n = Math.max(0, Math.round(Number(sec) || 0));
  if (!n) return "";
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function albumMeta(album) {
  const tracks = album?.tracks || [];
  const n = album?.count || tracks.length || 0;
  const bits = [`${n} track${n === 1 ? "" : "s"}`];
  const total = tracks.reduce((s, t) => s + (Number(t.duration) || 0), 0);
  if (total >= 60) bits.push(`${Math.round(total / 60)} min`);
  if (album?.avgBpm) bits.push(`${album.avgBpm} BPM`);
  const year = tracks.map((t) => t.year || t.releaseYear).find(Boolean);
  if (year) bits.push(String(year));
  return bits.join(" · ");
}

/**
 * Album page — one sleeve, title, play, tracklist.
 * No blur wash, no generated story, no repeated cover on every row.
 */
export function AlbumPage({
  album,
  onBack,
  onPlay,
  onOpenArtist,
  currentTrack,
  isPlaying: isPlayingProp,
  onLike,
  playlistCtx,
}) {
  const transportPlaying = useIsPlaying();
  const isPlaying = isPlayingProp ?? transportPlaying;
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();

  if (!album) {
    return (
      <EmptyEntity
        title="Album not found"
        body="This album isn’t in the catalog yet."
        onBack={onBack}
      />
    );
  }

  const cover = album.coverTrack;
  const coverUrl = cover?.albumCover || null;
  const tracks = album.tracks || [];
  const albumArtist = album.artist || "";

  return (
    <div style={{ minHeight: "100%", animation: "fadeIn 0.22s ease both", fontFamily: font }}>
      <div style={{ padding: "16px 20px 20px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            padding: "8px 0",
            marginBottom: 16,
            color: color.body,
            fontFamily: font,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-end",
          }}
        >
          {coverUrl ? (
            <div
              style={{
                width: 132,
                height: 132,
                flexShrink: 0,
                borderRadius: 8,
                overflow: "hidden",
                background: color.surfaceRaised,
                border: `1px solid ${glass.border}`,
                boxShadow: artShadow.quiet,
              }}
            >
              <CoverImage src={coverUrl} alt="" width={132} height={132} priority />
            </div>
          ) : null}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(22px, 6vw, 32px)",
                fontWeight: 700,
                letterSpacing: -0.8,
                fontFamily: fontDisplay,
                color: color.ink,
                lineHeight: 1.08,
              }}
            >
              {album.title}
            </h1>
            {albumArtist ? (
              <button
                type="button"
                onClick={() => onOpenArtist?.(album.artistSlug || albumArtist)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  marginTop: 8,
                  color: color.accent,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: onOpenArtist ? "pointer" : "default",
                }}
              >
                {albumArtist}
              </button>
            ) : null}
            <div style={{ marginTop: 8, fontSize: 13, color: color.muted }}>
              {albumMeta(album)}
            </div>
            {cover && (
              <button
                type="button"
                className="play-primary"
                onClick={() => onPlay(cover, tracks)}
                style={{
                  ...BTN_PRIMARY,
                  width: "auto",
                  marginTop: 14,
                  minHeight: 40,
                  padding: "0 16px",
                  borderRadius: 980,
                  fontSize: 14,
                  fontWeight: 650,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon name="play" size={14} />
                Play
              </button>
            )}
          </div>
        </div>
      </div>

      <ol style={{ listStyle: "none", margin: 0, padding: "4px 8px 40px" }}>
        {tracks.map((t, i) => {
          const active = currentTrack?.id === t.id;
          const guest = t.artist && albumArtist && t.artist !== albumArtist ? t.artist : "";
          const clock = formatClock(t.duration);
          return (
            <li key={t.id} style={{ position: "relative" }}>
              <div
                role="button"
                tabIndex={0}
                aria-label={`Play ${t.title}`}
                onClick={() => onPlay(t, tracks)}
                onContextMenu={(e) => openFromContext(e, t)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPlay(t, tracks);
                  }
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: `28px minmax(0, 1fr) ${clock ? "44px" : "0px"} auto auto`,
                  alignItems: "center",
                  gap: 4,
                  minHeight: 44,
                  padding: "6px 8px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: active ? "rgba(255,255,255,0.06)" : "transparent",
                  color: color.ink,
                }}
              >
                <span
                  style={{
                    fontFamily: fontMono,
                    fontSize: 11,
                    fontVariantNumeric: "tabular-nums",
                    color: active ? color.accent : color.faint,
                    textAlign: "right",
                    paddingRight: 6,
                  }}
                >
                  {active && isPlaying ? "▶" : String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: active ? 650 : 500,
                      letterSpacing: -0.15,
                      color: active ? color.accent : color.ink,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.title}
                  </span>
                  {guest ? (
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
                      {guest}
                    </span>
                  ) : null}
                </span>
                {clock ? (
                  <span
                    style={{
                      fontFamily: fontMono,
                      fontSize: 11,
                      fontVariantNumeric: "tabular-nums",
                      color: color.faint,
                      textAlign: "right",
                    }}
                  >
                    {clock}
                  </span>
                ) : null}
                {onLike ? (
                  <button
                    type="button"
                    aria-label={t.liked ? "Unlike" : "Like"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLike(t.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: t.liked ? color.accent : color.faint,
                      padding: 8,
                    }}
                  >
                    <Icon name={t.liked ? "heart" : "heartempty"} size={16} />
                  </button>
                ) : (
                  <span />
                )}
                <TrackMoreButton onClick={(e) => openFromButton(e, t)} />
              </div>
            </li>
          );
        })}
      </ol>

      {menu && (
        <TrackActionsMenu
          track={menu.track}
          playlistCtx={playlistCtx}
          activePlaylistId={menu.activePlaylistId}
          x={menu.x}
          y={menu.y}
          onClose={close}
        />
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        marginBottom: 14,
        fontSize: 18,
        fontWeight: 750,
        fontFamily: fontDisplay,
        letterSpacing: -0.4,
        color: color.ink,
      }}
    >
      {children}
    </div>
  );
}

function EmptyEntity({ title, body, onBack }) {
  return (
    <div style={{ padding: "48px 20px", textAlign: "center", fontFamily: font }}>
      <div style={{ fontSize: 20, fontWeight: 750, fontFamily: fontDisplay, color: color.ink }}>{title}</div>
      <div style={{ fontSize: 14, color: color.muted, marginTop: 8 }}>{body}</div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            ...BTN_SECONDARY,
            width: "auto",
            marginTop: 20,
            padding: "12px 18px",
            borderRadius: radius.lg,
            fontWeight: 600,
          }}
        >
          Go back
        </button>
      )}
    </div>
  );
}

function EntityHero({
  onBack,
  title,
  meta,
  coverUrl,
  onPlay,
  subtitle,
}) {
  return (
    <div style={{ padding: "16px 20px 24px" }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          padding: "8px 0",
          marginBottom: 16,
          color: color.body,
          fontFamily: font,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        ← Back
      </button>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
        {coverUrl && (
          <div
            style={{
              width: 132,
              height: 132,
              overflow: "hidden",
              borderRadius: 8,
              border: `1px solid ${glass.border}`,
              boxShadow: artShadow.quiet,
              flexShrink: 0,
              background: color.surfaceRaised,
            }}
          >
            <CoverImage src={coverUrl} alt="" width={132} height={132} priority />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(22px, 6vw, 32px)",
              fontWeight: 700,
              letterSpacing: -0.8,
              fontFamily: fontDisplay,
              color: color.ink,
              lineHeight: 1.08,
            }}
          >
            {title}
          </h1>
          {subtitle}
          {meta && (
            <div style={{ marginTop: 8, fontSize: 13, color: color.muted }}>
              {meta}
            </div>
          )}
          {onPlay && (
            <button
              type="button"
              className="play-primary"
              onClick={onPlay}
              style={{
                ...BTN_PRIMARY,
                width: "auto",
                marginTop: 14,
                minHeight: 40,
                padding: "0 16px",
                borderRadius: 980,
                fontSize: 14,
                fontWeight: 650,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="play" size={14} />
              Play
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
