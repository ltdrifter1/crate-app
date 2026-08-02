import { font, fontDisplay, fontMono, color, radius, glass, aluminumGradient, artShadow } from "../../theme";

/** Artist destination — catalogue as a world, not a discography dump. */
export default function ArtistPage({
  artist,
  onBack,
  onPlay,
  onOpenAlbum,
  currentTrack,
  isPlaying,
  onLike,
  AlbumArt,
  TrackRow,
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

  return (
    <div style={{ minHeight: "100%", animation: "fadeIn 0.35s ease both", fontFamily: font }}>
      <EntityHero
        onBack={onBack}
        backLabel="Back"
        eyebrow="Artist"
        title={artist.name}
        story={artist.story}
        meta={`${artist.count} cut${artist.count === 1 ? "" : "s"}${artist.topGenre ? ` · ${artist.topGenre}` : ""}`}
        coverUrl={cover?.albumCover}
        atmosphere="amber-lamp"
        onPlay={() => cover && onPlay(cover, artist.tracks)}
        playLabel="Drop the needle"
      />

      {artist.albums?.length > 0 && (
        <section style={{ padding: "28px 20px 8px" }}>
          <SectionTitle sub="Albums as objects — not folders">Albums</SectionTitle>
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
                <div style={{ width: 140, height: 140, overflow: "hidden", marginBottom: 10, background: color.surfaceRaised }}>
                  {AlbumArt && al.coverTrack ? (
                    <AlbumArt track={al.coverTrack} size={140} borderRadius={0} />
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
        <SectionTitle sub="Everything filed under this name">Tracks</SectionTitle>
        {artist.tracks.map((t) =>
          TrackRow ? (
            <TrackRow
              key={t.id}
              track={t}
              onPlay={() => onPlay(t, artist.tracks)}
              active={currentTrack?.id === t.id}
              isPlaying={isPlaying}
              onLike={onLike}
              playlistCtx={playlistCtx}
            />
          ) : null
        )}
      </section>
    </div>
  );
}

export function AlbumPage({
  album,
  onBack,
  onPlay,
  onOpenArtist,
  currentTrack,
  isPlaying,
  onLike,
  AlbumArt,
  TrackRow,
  playlistCtx,
}) {
  if (!album) {
    return (
      <EmptyEntity
        title="Album not found"
        body="This release isn’t in the catalog yet."
        onBack={onBack}
      />
    );
  }

  const cover = album.coverTrack;

  return (
    <div style={{ minHeight: "100%", animation: "fadeIn 0.35s ease both", fontFamily: font }}>
      <EntityHero
        onBack={onBack}
        backLabel="Back"
        eyebrow="Album"
        title={album.title}
        story={album.story}
        meta={[
          album.count + (album.count === 1 ? " track" : " tracks"),
          album.avgBpm ? `${album.avgBpm} BPM` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        coverUrl={cover?.albumCover}
        atmosphere="vault"
        onPlay={() => cover && onPlay(cover, album.tracks)}
        playLabel="Play the record"
        subtitle={
          <button
            type="button"
            onClick={() => onOpenArtist?.(album.artistSlug || album.artist)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: color.accent,
              fontSize: 14,
              fontWeight: 600,
              cursor: onOpenArtist ? "pointer" : "default",
              marginTop: 8,
            }}
          >
            {album.artist}
          </button>
        }
      />

      <section style={{ padding: "8px 16px 40px" }}>
        <SectionTitle>Tracklist</SectionTitle>
        {album.tracks.map((t, i) =>
          TrackRow ? (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 28,
                  flexShrink: 0,
                  fontSize: 11,
                  fontFamily: fontMono,
                  color: color.faint,
                  textAlign: "right",
                  paddingRight: 4,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TrackRow
                  track={t}
                  onPlay={() => onPlay(t, album.tracks)}
                  active={currentTrack?.id === t.id}
                  isPlaying={isPlaying}
                  onLike={onLike}
                  playlistCtx={playlistCtx}
                />
              </div>
            </div>
          ) : null
        )}
      </section>
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 18, fontWeight: 750, fontFamily: fontDisplay, letterSpacing: -0.4, color: color.ink }}>
        {children}
      </div>
      {sub && <div style={{ fontSize: 12, color: color.muted, marginTop: 4 }}>{sub}</div>}
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
            marginTop: 20,
            padding: "12px 18px",
            borderRadius: radius.sm,
            border: `1px solid ${color.lineStrong}`,
            background: "none",
            color: color.body,
            cursor: "pointer",
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
  backLabel,
  eyebrow,
  title,
  story,
  meta,
  coverUrl,
  atmosphere,
  onPlay,
  playLabel,
  subtitle,
}) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "min(48vh, 380px)",
        padding: "20px 20px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: aluminumGradient() }} />
      {coverUrl && (
        <div aria-hidden="true" style={{
          position: "absolute", inset: "-8%",
          backgroundImage: `url(${coverUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(56px) saturate(1.05) brightness(1.15)",
          opacity: 0.2,
          transform: "scale(1.05)",
        }}/>
      )}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(230,233,239,0.2) 0%, transparent 40%, rgba(230,233,239,0.85) 100%)",
      }}/>

      <button
        type="button"
        onClick={onBack}
        style={{
          position: "relative",
          zIndex: 1,
          alignSelf: "flex-start",
          marginBottom: 24,
          background: glass.fillStrong,
          border: `1px solid ${glass.borderSoft}`,
          borderRadius: radius.sm,
          color: color.ink,
          fontSize: 13,
          cursor: "pointer",
          fontWeight: 600,
          padding: "8px 12px",
          boxShadow: `inset 0 1px 0 ${glass.highlight}`,
        }}
      >
        ← {backLabel}
      </button>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 440 }}>
        {coverUrl && (
          <div
            style={{
              width: 140,
              height: 140,
              overflow: "hidden",
              marginBottom: 20,
              borderRadius: radius.md,
              border: `1px solid ${glass.borderSoft}`,
              boxShadow: artShadow.raised,
            }}
          >
            <img src={coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        )}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.8,
            color: color.accent,
            fontFamily: fontMono,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 7vw, 40px)",
            fontWeight: 700,
            letterSpacing: -1.1,
            fontFamily: fontDisplay,
            color: color.ink,
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>
        {subtitle}
        <p style={{ margin: "14px 0 0", fontSize: 15, color: color.body, lineHeight: 1.5, maxWidth: 360 }}>
          {story}
        </p>
        {meta && (
          <div style={{ marginTop: 14, fontFamily: fontMono, fontSize: 11, color: color.faint, letterSpacing: 0.3 }}>
            {meta}
          </div>
        )}
        {onPlay && (
          <button
            type="button"
            className="play-primary"
            onClick={onPlay}
            style={{
              marginTop: 22,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 18px",
              borderRadius: radius.md,
              background: color.accent,
              border: "none",
              color: color.onAccent,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 650,
              boxShadow: "0 4px 14px rgba(10,124,255,0.28)",
            }}
          >
            {playLabel}
          </button>
        )}
      </div>
    </div>
  );
}
