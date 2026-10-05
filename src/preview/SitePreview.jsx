/**
 * Dev-only whole-site preview — hash #site-preview.
 *
 * The screens behind auth (Library, Charts, Club, Search, Artist, Album) had no
 * way to be reviewed without signing in, so they never got a design pass. This
 * mounts the real components with fixture data and a switcher.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import FavoritesScreen from "../screens/FavoritesScreen";
import SearchScreen from "../screens/SearchScreen";
import ChartsScreen from "../components/station/ChartsScreen";
import ArtistPage, { AlbumPage } from "../components/catalog/ArtistPage";
import ClubScreen from "../components/club/ClubScreen";
import { buildArtists, buildAlbums } from "../lib/catalog";
import { playerTransportStore } from "../lib/playerTransportStore";
import { buildCountdown } from "../lib/station";
import { brandStoragePrefix } from "../brand/identity";
import { playerPlaybackStore } from "../lib/playerPlaybackStore";
import { color, fontMono, radio } from "../theme";
import {
  PREVIEW_TRACKS,
  PREVIEW_COUNTDOWN,
  PREVIEW_PLAYLISTS,
  PREVIEW_USER,
  PREVIEW_PROFILE,
} from "./fixtures";

const SCREENS = [
  { id: "library", label: "Library" },
  { id: "charts", label: "Charts" },
  { id: "artist", label: "Artist" },
  { id: "album", label: "Album" },
  { id: "club", label: "Club" },
  { id: "search", label: "Search" },
];

const noop = () => {};

/**
 * Write a "yesterday" board so the Charts preview shows real movement
 * (climbers, fallers, a debut) instead of an empty history. Dev preview only.
 */
function seedPreviewHistory(tracks) {
  try {
    const today = buildCountdown(tracks, 20);
    if (today.length < 6) return;
    const y = new Date();
    y.setUTCDate(y.getUTCDate() - 1);
    const dayKey = y.toISOString().slice(0, 10);
    const order = today.map((c) => c.track);
    // yesterday: 2 and 1 swapped, 3 was 6th (a big climber), 4 was off the board (debut), the rest shifted
    const prior = [order[1], order[0], order[3], order[4], order[5], order[2], ...order.slice(6, 12)].filter(Boolean);
    prior.splice(3, 0, order[12] || order[11]);
    const entries = prior.slice(0, 19).filter((t) => t && t.id !== order[3]?.id).map((t, i) => ({
      rank: i + 1, id: t.id, title: t.title, artist: t.artist, albumCover: t.albumCover, score: 100 - i, requestCount: t.requestCount || 0, playCount: t.playCount || 0,
    }));
    localStorage.setItem(`${brandStoragePrefix()}:chart:day:${dayKey}`, JSON.stringify({ dayKey, capturedAt: Date.now(), entries }));
    const index = JSON.parse(localStorage.getItem(`${brandStoragePrefix()}:chart:index`) || "[]");
    if (!index.includes(dayKey)) localStorage.setItem(`${brandStoragePrefix()}:chart:index`, JSON.stringify([dayKey, ...index]));
  } catch {
    /* private mode */
  }
}

export default function SitePreview() {
  const [screen, setScreen] = useState("library");
  const [tracks, setTracks] = useState(PREVIEW_TRACKS);
  const [query, setQuery] = useState("night");

  useEffect(() => {
    seedPreviewHistory(PREVIEW_TRACKS);
    playerPlaybackStore.setDuration(214);
    playerPlaybackStore.setProgress(48);
    playerTransportStore.sync({ isPlaying: false, track: PREVIEW_TRACKS[0] });
  }, []);

  const toggleLike = (id) =>
    setTracks((list) => list.map((t) => (t.id === id ? { ...t, liked: !t.liked } : t)));

  const requestedRef = useRef(new Set());
  const requestTrack = (id) => {
    if (requestedRef.current.has(id)) return;
    requestedRef.current.add(id);
    setTracks((list) => list.map((t) => (t.id === id ? { ...t, requestCount: (t.requestCount || 0) + 1 } : t)));
  };

  const playlistCtx = useMemo(
    () => ({
      onRequest: requestTrack,
      onQueue: noop,
      hasRequested: (id) => requestedRef.current.has(id),
      playlists: PREVIEW_PLAYLISTS,
      onCreate: noop,
      onAdd: noop,
      onRemove: noop,
      onToast: noop,
      onResonance: noop,
      onHypnoRadio: noop,
      onLike: toggleLike,
      onOpenArtist: noop,
      onOpenAlbum: noop,
    }),
    []
  );

  const artist = useMemo(() => buildArtists(tracks)[0] || null, [tracks]);
  const album = useMemo(() => buildAlbums(tracks)[0] || null, [tracks]);

  return (
    <div style={{ minHeight: "100dvh", background: color.canvas }}>
      <div
        role="tablist"
        aria-label="Preview screen"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 90,
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
          padding: 8,
          background: color.canvasEdge,
          borderBottom: "1px solid rgba(91,101,116,0.2)",
        }}
      >
        {SCREENS.map((s) => {
          const on = screen === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setScreen(s.id)}
              style={{
                padding: "7px 12px",
                borderRadius: radio.radiusLcd,
                border: on ? radio.lcdBorder : radio.borderChrome,
                background: on ? radio.lcdFace : radio.moduleFace,
                color: on ? color.lcdSignal : color.body,
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.14,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {screen === "library" && (
          <FavoritesScreen
            tracks={tracks}
            onPlay={noop}
            onPlayTrack={noop}
            onLike={toggleLike}
            playlistCtx={playlistCtx}
            userPlaylists={PREVIEW_PLAYLISTS}
            onCreatePlaylist={noop}
            onDeletePlaylist={noop}
            onRenamePlaylist={noop}
            onOpenCharts={noop}
            onOpenMenu={noop}
            preferredGenres={PREVIEW_USER.genres}
            recentTrackIds={["e1", "d1"]}
            userKey="preview-uid"
          />
        )}

        {screen === "charts" && (
          <ChartsScreen
            countdown={PREVIEW_COUNTDOWN}
            tracks={tracks}
            onPlayTrack={noop}
            onTuneMonthly={noop}
            onAddToQueue={noop}
            playlistCtx={playlistCtx}
            nowPlayingId={tracks[0]?.id || null}
            onOpenMenu={noop}
          />
        )}

        {screen === "artist" && (
          <ArtistPage
            artist={artist}
            onBack={noop}
            onPlay={noop}
            onOpenAlbum={noop}
            currentTrack={tracks[0]}
            isPlaying={false}
            onLike={toggleLike}
            playlistCtx={playlistCtx}
          />
        )}

        {screen === "album" && (
          <AlbumPage
            album={album}
            onBack={noop}
            onPlay={noop}
            onOpenArtist={noop}
            currentTrack={tracks[0]}
            isPlaying={false}
            onLike={toggleLike}
            playlistCtx={playlistCtx}
          />
        )}

        {screen === "club" && (
          <ClubScreen
            user={PREVIEW_USER}
            profile={PREVIEW_PROFILE}
            tracks={tracks}
            onLogout={noop}
            onEditGenres={noop}
            recentTracks={tracks.slice(0, 3)}
            onPlayTrack={noop}
            onReplayTour={noop}
          />
        )}

        {screen === "search" && (
          <SearchScreen
            query={query}
            setQuery={setQuery}
            tracks={tracks}
            onPlay={noop}
            onLike={toggleLike}
            playlistCtx={playlistCtx}
            onOpenArtist={noop}
            onOpenAlbum={noop}
            recentSearches={["techno", "shoegaze", "rain city"]}
            onPickRecent={setQuery}
            onClearRecent={noop}
            onBack={noop}
          />
        )}
      </div>
    </div>
  );
}
