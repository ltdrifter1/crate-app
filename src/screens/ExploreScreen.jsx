import { useMemo, useState, memo, lazy, Suspense } from "react";
import {
  chromeIconButton,
  color,
  font,
  fontDisplay,
  fontMono,
  glass,
  homeSpace,
  motion,
  radio,
  SEARCH_FIELD,
  type,
  y2k,
} from "../theme";
import Icon from "../components/ui/Icon";
import { useCurrentTrack } from "../usePlayerTransport";
import CardContainer from "../components/home/CardContainer";
import ExploreFocus from "../components/explore/ExploreFocus";
import ExploreModes from "../components/explore/ExploreModes";
import WorldAtlas from "../components/explore/WorldAtlas";
import EnergyRooms from "../components/explore/EnergyRooms";
import MixBoard from "../components/explore/MixBoard";
import NewReleases from "../components/explore/NewReleases";
import CrateDig from "../components/explore/CrateDig";
import TimeMachine from "../components/explore/TimeMachine";
import ChannelSurfingSection from "../components/home/ChannelSurfingSection";
import { SCENE_CHANNELS } from "../lib/sceneChannels";
import { rankChannelsForTaste } from "../lib/onboardingTaste";
import {
  exploreCatalogStats,
  exploreGenrePlates,
  exploreModesFor,
  exploreMoodPlates,
  exploreWorlds,
  resolveExploreFocus,
} from "../lib/explore";

const EXPLORE_CSS = `
  .pmp-explore-modes {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: 6px;
    padding: 8px ${"{gutter}"}px 4px;
  }
  .pmp-explore-modes button {
    white-space: normal;
    line-height: 1.15;
  }
  .pmp-new-releases-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 12px;
    padding: 0 ${"{gutter}"}px;
  }
  .pmp-explore-find {
    transition: border-color ${"{base}"} ${"{ease}"}, box-shadow ${"{base}"};
  }
  .pmp-explore-find:hover {
    border-color: rgba(110, 168, 255, 0.32) !important;
  }
  .pmp-world-tray {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 12px;
    padding: 0 ${"{gutter}"}px;
    align-items: start;
  }
  .pmp-world-tile--lead { grid-column: 1 / -1; max-width: 280px; }
  .pmp-mix-wheel {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .pmp-energy-strip {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px;
  }
  @media (min-width: 720px) {
    .pmp-world-tray {
      grid-template-columns: 1.35fr 1fr 1fr;
      gap: 18px 14px;
    }
    .pmp-world-tile--lead {
      grid-column: 1;
      grid-row: 1 / span 2;
      max-width: none;
    }
    .pmp-mix-wheel { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .pmp-energy-strip { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .pmp-new-releases-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
  @media (min-width: 1100px) {
    .pmp-mix-wheel { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    .pmp-new-releases-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  }
`.replaceAll("{base}", motion.base).replaceAll("{ease}", motion.ease).replaceAll("{gutter}", String(homeSpace.gutter));

const TonightDeck = lazy(() =>
  import("../components/station/ShowGuide").then((m) => ({ default: m.TonightDeck }))
);

function FindEntry({ onOpenSearch }) {
  if (!onOpenSearch) return null;
  return (
    <div style={{ padding: `8px ${homeSpace.gutter}px 2px` }}>
      <button
        type="button"
        className="pmp-explore-find"
        onClick={onOpenSearch}
        aria-label="Search"
        style={{
          ...SEARCH_FIELD,
          width: "100%",
          maxWidth: 520,
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 42,
          padding: "0 14px",
          color: color.muted,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: font,
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: -0.08,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{ color: color.lcdSignal, display: "flex" }}>
          <Icon name="search" size={14} />
        </span>
        Find a city, scene, or sleeve
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
          When the catalog lands, worlds, energy rooms, and sleeves show up here.
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

function ModeHint({ mode }) {
  const copy = {
    releases: "Newest sleeves, by channel.",
    worlds: "A planet of scenes — tap a disc, not a feed.",
    energy: "One strip. Pressure, not playlists.",
    mix: "Twelve keys. Neighbors mix.",
  };
  return (
    <p
      style={{
        margin: 0,
        padding: `4px ${homeSpace.gutter}px 0`,
        fontSize: 13,
        color: color.muted,
        lineHeight: 1.35,
      }}
    >
      {copy[mode] || ""}
    </p>
  );
}

/**
 * Explore — catalog directory. Home owns the player.
 * Channel Surfing / Tonight live here as demoted radio, not on the first Home screen.
 */
function ExploreScreen({
  tracks = [],
  catalogLoading = false,
  onPlayTrack = null,
  onOpenSearch = null,
  onOpenAlbum = null,
  onOpenMenu = null,
  onListenIntent = null,
  taste = null,
  sceneChannelsActiveId = null,
  onTuneSceneChannel = null,
  airing = null,
  programGuide = [],
  activeShowId = null,
  onTuneShow = null,
  showBumper = null,
}) {
  const currentTrack = useCurrentTrack();
  const activeId = currentTrack?.id;
  const [focusKey, setFocusKey] = useState(null);
  const [mode, setMode] = useState("releases");

  /** History only earns a tab once the crate carries release years. */
  const modes = useMemo(() => exploreModesFor(tracks), [tracks]);
  const activeMode = modes.some((m) => m.id === mode) ? mode : "releases";
  const stats = useMemo(() => exploreCatalogStats(tracks), [tracks]);
  const worlds = useMemo(
    () => (activeMode === "worlds" ? exploreWorlds(tracks) : []),
    [tracks, activeMode]
  );
  const lanes = useMemo(
    () => (activeMode === "worlds" ? exploreGenrePlates(tracks, 12) : []),
    [tracks, activeMode]
  );
  const rooms = useMemo(
    () => (activeMode === "energy" ? exploreMoodPlates(tracks) : []),
    [tracks, activeMode]
  );

  const focus = useMemo(
    () => resolveExploreFocus(focusKey, tracks),
    [focusKey, tracks]
  );

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

  const hasBody = stats.cuts > 0;
  const channels = useMemo(
    () => (onTuneSceneChannel ? rankChannelsForTaste(SCENE_CHANNELS, taste) : []),
    [taste, onTuneSceneChannel]
  );
  const hasTonight = !!(onTuneShow && (airing?.show || programGuide.length > 0));

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
                aria-label="More"
                onClick={onOpenMenu}
                className="pmp-press"
                style={{ ...chromeIconButton(44), marginTop: 4 }}
              >
                <Icon name="menu" size={16} />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: fontMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.16,
                  textTransform: "uppercase",
                  color: color.lcdMute,
                  marginBottom: 4,
                }}
              >
                Directory
              </div>
              <h1
                style={{
                  ...type.largeTitle,
                  margin: 0,
                  color: y2k.offWhite,
                }}
              >
                Discover
              </h1>
              <p
                style={{
                  margin: "6px 0 0",
                  fontFamily: font,
                  fontSize: 14,
                  color: color.muted,
                }}
              >
                {stats.cuts
                  ? `${stats.cuts} cut${stats.cuts === 1 ? "" : "s"} in the crate`
                  : "New music around what you play."}
              </p>
            </div>
          </div>
        </div>
      </header>

      <FindEntry onOpenSearch={onOpenSearch} />
      <ExploreModes mode={activeMode} modes={modes} onChange={setMode} />
      <ModeHint mode={activeMode} />

      {activeMode === "releases" && (
        <NewReleases
          tracks={tracks}
          onOpenAlbum={onOpenAlbum}
          onPlayTrack={onPlayTrack}
        />
      )}

      {activeMode === "worlds" && (worlds.length > 0 || lanes.length > 0) && (
        <WorldAtlas families={worlds} lanes={lanes} onOpen={setFocusKey} />
      )}

      {activeMode === "energy" && rooms.length > 0 && (
        <EnergyRooms
          rooms={rooms}
          onPlay={(track, pool) => playFocusPool(track, pool)}
        />
      )}

      {activeMode === "mix" && (
        <MixBoard tracks={tracks} onPlayPool={onPlayTrack} />
      )}

      {activeMode === "dig" && (
        <CrateDig tracks={tracks} onPlay={onPlayTrack} />
      )}

      {activeMode === "time-machine" && (
        <TimeMachine
          tracks={tracks}
          onPlayTrack={onPlayTrack}
          activeId={currentTrack?.id || null}
        />
      )}

      {activeMode === "energy" && rooms.length === 0 && hasBody && (
        <p style={{ padding: `16px ${homeSpace.gutter}px`, color: color.muted, fontSize: 14 }}>
          The pressure strip fills once cuts carry a pace.
        </p>
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

      {channels.length > 0 && (
        <ChannelSurfingSection
          channels={channels}
          activeChannelId={sceneChannelsActiveId}
          onTuneChannel={onTuneSceneChannel}
          first={false}
          delay={0.04}
        />
      )}

      {hasTonight && (
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "320px" }}>
          <Suspense fallback={null}>
            <TonightDeck
              airing={airing}
              guide={programGuide}
              bumper={showBumper}
              activeShowId={activeShowId}
              tuned={false}
              first={false}
              showNowPlaying={!!(airing?.show && activeShowId === airing.show.id)}
              onTuneIn={() => onTuneShow?.(airing?.show)}
              onSelectShow={(show) => onTuneShow?.(show)}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default memo(ExploreScreen);
