import { useEffect, useMemo, useState, memo } from "react";
import { runAfterPaint, runWhenIdle } from "../lib/afterPaint";
import {
  chromeIconButton,
  color,
  font,
  fontDisplay,
  glass,
  homeSpace,
  motion,
  radio,
  radius,
  type,
  y2k,
} from "../theme";
import Icon from "../components/ui/Icon";
import { useCurrentTrack, useIsPlaying } from "../usePlayerTransport";
import MusicSection, { Rail } from "../components/home/MusicSection";
import TrackCard from "../components/home/TrackCard";
import CrateSpread from "../components/home/CrateSpread";
import { ReleasesBand } from "../components/home/ReleaseCard";
import CardContainer from "../components/home/CardContainer";
import ExploreHero from "../components/explore/ExploreHero";
import GenreMosaic, { MoodRail, SceneRail } from "../components/explore/GenreMosaic";
import ExploreFocus from "../components/explore/ExploreFocus";
import CamelotKeyRail from "../components/search/CamelotKeyRail";
import {
  buildExploreHero,
  exploreForYou,
  exploreGenrePlates,
  exploreMoodPlates,
  exploreReleases,
  exploreScenePlates,
  recentlyPlayedTracks,
  resolveExploreFocus,
} from "../lib/explore";

const EXPLORE_CSS = `
  .pmp-explore-hero { isolation: isolate; }
  .pmp-explore-hero-art {
    animation: pmpExploreKen 32s ease-in-out infinite alternate;
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
    border-color: rgba(61,70,84,0.2) !important;
    background: rgba(216,223,232,0.88) !important;
  }
  .pmp-releases {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 12px;
    padding: 0 ${"{gutter}"}px;
    align-items: start;
  }
  .pmp-releases .pmp-release-art {
    display: block;
    width: 100%;
  }
  @media (min-width: 720px) {
    .pmp-explore-mosaic { grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .pmp-explore-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .pmp-explore-hero { aspect-ratio: 2.15 / 1 !important; min-height: 280px; }
    .pmp-releases { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px 16px; }
  }
  @media (min-width: 1100px) {
    .pmp-explore-mosaic { grid-template-columns: 1fr 1fr 1fr 1fr; }
    .pmp-explore-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .pmp-releases { grid-template-columns: repeat(5, minmax(0, 1fr)); }
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
          border: "1px solid rgba(28,32,40,0.12)",
          background: "rgba(216,223,232,0.72)",
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

function EmptyExplore({ onOpenSearch }) {
  return (
    <div style={{ marginTop: homeSpace.sectionGap, padding: `0 ${homeSpace.gutter}px` }}>
      <CardContainer
        padding="22px 20px"
        style={{
          background: radio.moduleFace,
          border: `1px solid ${glass.borderSoft}`,
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
          When the catalog lands, scenes and sleeves show up here.
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
 * Editorial hero, genre mosaic, moods, scenes, sleeves.
 */
function ExploreScreen({
  tracks = [],
  catalogLoading = false,
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
  const [paintReady, setPaintReady] = useState(process.env.NODE_ENV === "test");
  const [deepReady, setDeepReady] = useState(process.env.NODE_ENV === "test");

  useEffect(() => {
    if (process.env.NODE_ENV === "test") return undefined;
    return runAfterPaint(() => setPaintReady(true));
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "test" || !paintReady) return undefined;
    return runWhenIdle(() => setDeepReady(true), { timeout: 400 });
  }, [paintReady]);

  const genres = useMemo(
    () => (paintReady ? exploreGenrePlates(tracks, 12) : []),
    [tracks, paintReady]
  );
  const releases = useMemo(
    () => (paintReady ? exploreReleases(tracks, 8) : []),
    [tracks, paintReady]
  );
  const moods = useMemo(
    () => (deepReady ? exploreMoodPlates(tracks) : []),
    [tracks, deepReady]
  );
  const scenes = useMemo(
    () => (deepReady ? exploreScenePlates(tracks, 8) : []),
    [tracks, deepReady]
  );
  const recents = useMemo(
    () => (deepReady ? recentlyPlayedTracks(tracks, recentTrackIds, 6) : []),
    [tracks, recentTrackIds, deepReady]
  );
  const forYou = useMemo(
    () =>
      deepReady
        ? exploreForYou(tracks, {
            preferredGenres,
            recentTrackIds,
            userKey,
            dayKey,
            limit: 5,
          })
        : { tracks: [], reasons: {}, coldStart: true },
    [tracks, preferredGenres, recentTrackIds, userKey, dayKey, deepReady]
  );
  const hero = useMemo(
    () =>
      buildExploreHero({
        tracks,
        channels: [],
        releases: [],
        countdown: [],
      }),
    [tracks]
  );

  const focus = useMemo(
    () => resolveExploreFocus(focusKey, tracks),
    [focusKey, tracks]
  );

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
    releases.length > 0 ||
    forYou.tracks.length > 0 ||
    recents.length > 0;

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
            radial-gradient(ellipse 80% 42% at 12% -8%, rgba(216,223,232,0.72) 0%, transparent 52%)
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
                Scenes, moods, and sleeves — start anywhere.
              </p>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          style={{
            marginTop: 16,
            height: 1,
            background: "rgba(28, 32, 40, 0.12)",
            boxShadow: "none",
          }}
        />
      </header>

      <SearchEntry onOpenSearch={onOpenSearch} />

      {deepReady && (
        <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
          <CamelotKeyRail tracks={tracks} onPlayPool={onPlayTrack} label="Keys" />
        </div>
      )}

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

      {releases.length > 0 && (
        <MusicSection
          title="Albums"
          subtitle="Sleeves on the wall"
          delay={0.07}
        >
          <ReleasesBand
            albums={releases}
            onOpenAlbum={onOpenAlbum}
            onPlayTrack={onPlayTrack}
          />
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

      {forYou.tracks.length > 0 && (
        <CrateSpread
          title={forYou.coldStart ? "Fresh picks" : "Selected for you"}
          subtitle={forYou.coldStart ? "A place to begin" : "Chosen for you"}
          tracks={forYou.tracks.slice(0, 5)}
          activeId={activeId}
          onPlayTrack={onPlayTrack}
        />
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

      {!hasBody && catalogLoading && (
        <div
          role="status"
          style={{
            marginTop: homeSpace.sectionGap,
            padding: `12px ${homeSpace.gutter}px`,
            color: color.muted,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Tuning the crate…
        </div>
      )}
      {!hasBody && !catalogLoading && <EmptyExplore onOpenSearch={onOpenSearch} />}
    </div>
  );
}

export default memo(ExploreScreen);
