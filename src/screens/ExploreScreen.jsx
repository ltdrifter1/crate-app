import { useEffect, useMemo, useState, memo } from "react";
import {
  chromeIconButton,
  color,
  font,
  fontDisplay,
  homeSpace,
  motion,
  radius,
  type,
  y2k,
} from "../theme";
import Icon from "../components/ui/Icon";
import CoverImage from "../components/ui/CoverImage";
import { useCurrentTrack, useIsPlaying } from "../usePlayerTransport";
import MusicSection, { Rail } from "../components/home/MusicSection";
import TrackCard from "../components/home/TrackCard";
import CrateSpread from "../components/home/CrateSpread";
import { ReleasesBand } from "../components/home/ReleaseCard";
import ChannelSurfingSection from "../components/home/ChannelSurfingSection";
import CardContainer from "../components/home/CardContainer";
import ExploreHero from "../components/explore/ExploreHero";
import GenreMosaic, { MoodRail, SceneRail } from "../components/explore/GenreMosaic";
import ExploreFocus from "../components/explore/ExploreFocus";
import {
  buildExploreHero,
  exploreChartsTeaser,
  exploreForYou,
  exploreGenrePlates,
  exploreMoodPlates,
  exploreReleases,
  exploreScenePlates,
  exploreStations,
  recentlyPlayedTracks,
  resolveExploreFocus,
} from "../lib/explore";

const EXPLORE_CSS = `
  .pmp-explore-hero { isolation: isolate; }
  .pmp-explore-hero-art {
    animation: pmpExploreKen 32s ease-in-out infinite alternate;
    will-change: transform;
  }
  @keyframes pmpExploreKen {
    from { transform: scale(1); }
    to { transform: scale(1.055); }
  }
  .pmp-explore-mosaic {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .pmp-explore-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 12px;
  }
  .pmp-explore-search {
    transition: border-color ${"{base}"} ${"{ease}"}, background ${"{base}"}, box-shadow ${"{base}"};
  }
  .pmp-explore-search:hover {
    border-color: rgba(255,255,255,0.16) !important;
    background: rgba(255,255,255,0.07) !important;
  }
  .pmp-explore-chart-row:hover { background: rgba(255,255,255,0.04) !important; }
  .pmp-explore-chart-row:active { transform: scale(0.992); }
  .pmp-releases {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px 12px;
    padding: 0 ${"{gutter}"}px;
    align-items: start;
  }
  .pmp-release--lead {
    grid-column: 1 / -1;
    display: flex !important;
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
  .pmp-release--lead .pmp-release-art {
    width: 132px;
    flex-shrink: 0;
  }
  .pmp-release--lead .pmp-release-copy { min-width: 0; }
  @media (min-width: 720px) {
    .pmp-explore-mosaic { grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .pmp-explore-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .pmp-explore-hero { aspect-ratio: 2.15 / 1 !important; min-height: 280px; }
    .pmp-releases { grid-template-columns: 1.2fr 1fr 1fr; gap: 20px 16px; }
    .pmp-release--lead {
      grid-column: 1;
      grid-row: 1 / span 2;
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .pmp-release--lead .pmp-release-art { width: 100%; }
  }
  @media (min-width: 1100px) {
    .pmp-explore-mosaic { grid-template-columns: 1fr 1fr 1fr 1fr; }
    .pmp-explore-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  }
  @media (prefers-reduced-motion: reduce) {
    .pmp-explore-hero-art { animation: none !important; }
  }
`.replaceAll("{base}", motion.base).replaceAll("{ease}", motion.ease).replaceAll("{gutter}", String(homeSpace.gutter));

function SearchEntry({ onOpenSearch }) {
  if (!onOpenSearch) return null;
  return (
    <div style={{ padding: `10px ${homeSpace.gutter}px 4px` }}>
      <button
        type="button"
        className="pmp-explore-search"
        onClick={onOpenSearch}
        aria-label="Search"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 44,
          padding: "0 14px",
          borderRadius: radius.lg,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.055)",
          color: color.muted,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: font,
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: -0.2,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{ color: color.faint, display: "flex" }}>
          <Icon name="search" size={16} />
        </span>
        Search artists, albums, scenes
      </button>
    </div>
  );
}

function ChartsTeaser({ rows = [], onPlayTrack, onOpenCharts, activeId }) {
  if (!rows.length) return null;
  return (
    <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
      {rows.map((entry, i) => {
        const track = entry.track || entry;
        const rank = entry.rank || i + 1;
        if (!track?.id) return null;
        return (
          <button
            key={track.id}
            type="button"
            className="pmp-explore-chart-row"
            onClick={() => onPlayTrack?.(track, rows.map((r) => r.track || r).filter(Boolean))}
            aria-label={`Play #${rank} ${track.title} by ${track.artist}`}
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "28px 48px minmax(0, 1fr)",
              alignItems: "center",
              gap: 12,
              padding: "8px 4px",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "transparent",
              color: color.ink,
              cursor: "pointer",
              textAlign: "left",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span
              style={{
                fontFamily: fontDisplay,
                fontSize: 15,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: -0.3,
                color: rank === 1 ? color.ink : color.muted,
                textShadow: "none",
              }}
            >
              {rank}
            </span>
            <span
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                overflow: "hidden",
                background: y2k.artGradient,
                boxShadow: activeId === track.id ? "0 0 0 1px rgba(247,248,250,0.7)" : "none",
              }}
            >
              {track.albumCover ? (
                <CoverImage src={track.albumCover} alt="" width={48} height={48} />
              ) : null}
            </span>
            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontFamily: fontDisplay,
                  fontSize: 15,
                  fontWeight: 650,
                  letterSpacing: -0.22,
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
                  fontSize: 13,
                  color: color.muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {track.artist}
              </span>
            </span>
          </button>
        );
      })}
      {onOpenCharts && (
        <button
          type="button"
          className="pmp-view-all"
          onClick={onOpenCharts}
          style={{
            marginTop: 10,
            background: "none",
            border: "none",
            color: color.accent,
            fontFamily: fontDisplay,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            padding: "6px 0",
          }}
        >
          Open Charts
        </button>
      )}
    </div>
  );
}

function EmptyExplore({ onOpenSearch }) {
  return (
    <div style={{ marginTop: homeSpace.sectionGap, padding: `0 ${homeSpace.gutter}px` }}>
      <CardContainer
        padding="22px 20px"
        style={{
          background: `
            radial-gradient(110% 120% at 0% 0%, ${y2k.chromeWash} 0%, transparent 55%),
            linear-gradient(165deg, ${y2k.charcoalRaised} 0%, #101116 100%)
          `,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: -0.3,
            color: y2k.offWhite,
            marginBottom: 6,
          }}
        >
          Nothing to dig yet
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: color.muted, lineHeight: 1.5 }}>
          When the catalog lands, stations, scenes, and sleeves show up here.
        </div>
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            style={{
              marginTop: 14,
              background: "none",
              border: "none",
              padding: 0,
              color: color.accent,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: fontDisplay,
              cursor: "pointer",
            }}
          >
            Search anyway
          </button>
        )}
      </CardContainer>
    </div>
  );
}

/**
 * Explore — world-class discovery destination.
 * Editorial hero, genre mosaic, moods, scenes, stations, sleeves, charts.
 */
function ExploreScreen({
  tracks = [],
  preferredGenres = [],
  recentTrackIds = [],
  userKey = "",
  countdown = [],
  sceneChannelsActiveId = null,
  onPlayTrack = null,
  onOpenSearch = null,
  onOpenAlbum = null,
  onOpenMenu = null,
  onOpenCharts = null,
  onTuneSceneChannel = null,
  onListenIntent = null,
}) {
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const activeId = currentTrack?.id;
  const dayKey = new Date().toISOString().slice(0, 10);
  const [focusKey, setFocusKey] = useState(null);

  const stations = useMemo(() => exploreStations(tracks), [tracks]);
  const releases = useMemo(() => exploreReleases(tracks, 6), [tracks]);
  const genres = useMemo(() => exploreGenrePlates(tracks), [tracks]);
  const moods = useMemo(() => exploreMoodPlates(tracks), [tracks]);
  const scenes = useMemo(() => exploreScenePlates(tracks, 10), [tracks]);
  const charts = useMemo(() => exploreChartsTeaser(countdown, 6), [countdown]);
  const recents = useMemo(
    () => recentlyPlayedTracks(tracks, recentTrackIds, 12),
    [tracks, recentTrackIds]
  );
  const forYou = useMemo(
    () =>
      exploreForYou(tracks, {
        preferredGenres,
        recentTrackIds,
        userKey,
        dayKey,
        limit: 16,
      }),
    [tracks, preferredGenres, recentTrackIds, userKey, dayKey]
  );
  const hero = useMemo(
    () =>
      buildExploreHero({
        tracks,
        channels: stations,
        releases,
        countdown,
      }),
    [tracks, stations, releases, countdown]
  );

  const focus = useMemo(
    () => resolveExploreFocus(focusKey, tracks),
    [focusKey, tracks]
  );

  useEffect(() => {
    import("../components/catalog/ArtistPage");
  }, []);

  const heroPlaying =
    hero?.kind === "channel" &&
    sceneChannelsActiveId &&
    hero.id === sceneChannelsActiveId &&
    isPlaying;

  const playHero = (h) => {
    if (!h) return;
    if (h.kind === "channel" && onTuneSceneChannel) {
      onTuneSceneChannel(h.channel);
      return;
    }
    if (h.kind === "release") {
      if (onOpenAlbum && h.album?.slug) onOpenAlbum(h.album.slug);
      else if (h.pool?.[0]) onPlayTrack?.(h.pool[0], h.pool);
      return;
    }
    if (h.pool?.[0]) onPlayTrack?.(h.pool[0], h.pool);
  };

  const playFocusPool = (track, pool, resolved) => {
    if (onListenIntent && resolved?.type === "genre") {
      onListenIntent({ genre: resolved.id, scene: null });
      return;
    }
    if (onListenIntent && resolved?.type === "scene") {
      onListenIntent({ genre: null, scene: resolved.id });
      return;
    }
    onPlayTrack?.(track, pool);
  };

  const hasBody =
    genres.length > 0 ||
    moods.length > 0 ||
    scenes.length > 0 ||
    stations.some((c) => c.ready) ||
    releases.length > 0 ||
    forYou.tracks.length > 0 ||
    recents.length > 0 ||
    charts.length > 0;

  if (focus) {
    return (
      <div style={{ maxWidth: 1120, margin: "0 auto", width: "100%" }}>
        <style>{EXPLORE_CSS}</style>
        <ExploreFocus
          focus={focus}
          onBack={() => setFocusKey(null)}
          onPlayPool={playFocusPool}
          onPlayTrack={onPlayTrack}
          activeId={activeId}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        paddingBottom: 56,
        maxWidth: 1120,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <style>{EXPLORE_CSS}</style>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 80% 42% at 12% -8%, rgba(255,255,255,0.04) 0%, transparent 52%)
          `,
        }}
      />

      <header
        style={{
          position: "relative",
          padding: `calc(12px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 4px`,
          animation: `rise 0.45s ${motion.ease} both`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
            {onOpenMenu && (
              <button
                type="button"
                aria-label="Browse"
                onClick={onOpenMenu}
                className="pmp-press"
                style={{ ...chromeIconButton(36), marginTop: 4 }}
              >
                <Icon name="menu" size={16} />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  ...type.largeTitle,
                  margin: 0,
                  color: y2k.offWhite,
                }}
              >
                Explore
              </h1>
              <p
                style={{
                  ...type.subhead,
                  margin: "4px 0 0",
                  color: color.muted,
                }}
              >
                Stations, scenes, and sleeves — start anywhere.
              </p>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          style={{
            marginTop: 16,
            height: 1,
            background: "rgba(84, 84, 88, 0.45)",
            boxShadow: "none",
          }}
        />
      </header>

      <SearchEntry onOpenSearch={onOpenSearch} />

      <ExploreHero
        hero={hero}
        onPlay={playHero}
        onOpen={(h) => h?.album?.slug && onOpenAlbum?.(h.album.slug)}
        playing={!!heroPlaying}
      />

      {genres.length > 0 && (
        <MusicSection
          title="Genres"
          subtitle="Pick a genre"
          first
          delay={0.06}
        >
          <GenreMosaic plates={genres} onOpen={setFocusKey} />
        </MusicSection>
      )}

      {moods.length > 0 && (
        <MusicSection
          title="Moods & moments"
          subtitle="For this hour"
          delay={0.08}
        >
          <MoodRail plates={moods} onOpen={setFocusKey} />
        </MusicSection>
      )}

      {scenes.length > 0 && (
        <MusicSection
          title="Scenes"
          subtitle="Where the music lives"
          delay={0.1}
        >
          <SceneRail plates={scenes} onOpen={setFocusKey} />
        </MusicSection>
      )}

      {stations.length > 0 && (
        <ChannelSurfingSection
          channels={stations}
          activeChannelId={sceneChannelsActiveId}
          onTuneChannel={onTuneSceneChannel}
          first={false}
          delay={0.12}
          title="Stations"
          subtitle="Live from here"
        />
      )}

      {forYou.tracks.length > 0 && (
        <CrateSpread
          title={forYou.coldStart ? "Fresh picks" : "Selected for you"}
          subtitle={forYou.coldStart ? "A place to begin" : "Chosen for you"}
          tracks={forYou.tracks.slice(0, 8)}
          activeId={activeId}
          onPlayTrack={onPlayTrack}
        />
      )}

      {releases.length > 0 && (
        <MusicSection
          title="Albums"
          delay={0.14}
        >
          <ReleasesBand
            albums={releases}
            onOpenAlbum={onOpenAlbum}
            onPlayTrack={onPlayTrack}
          />
        </MusicSection>
      )}

      {charts.length > 0 && (
        <MusicSection
          title="On the board"
          subtitle="Most requested"
          delay={0.18}
          action={onOpenCharts ? { label: "Charts", onClick: onOpenCharts } : null}
        >
          <ChartsTeaser
            rows={charts}
            onPlayTrack={onPlayTrack}
            onOpenCharts={onOpenCharts}
            activeId={activeId}
          />
        </MusicSection>
      )}

      {recents.length > 0 && (
        <MusicSection
          title="Recently played"
          subtitle="Back on the deck"
          delay={0.2}
        >
          <Rail gap={14}>
            {recents.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                active={activeId === track.id}
                onClick={() => onPlayTrack?.(track, recents)}
              />
            ))}
          </Rail>
        </MusicSection>
      )}

      {!hasBody && <EmptyExplore onOpenSearch={onOpenSearch} />}
    </div>
  );
}

export default memo(ExploreScreen);
