import { useEffect, useMemo, useState, memo } from "react";
import { runAfterDelay } from "../lib/afterPaint";
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
import SleeveWallet from "../components/explore/SleeveWallet";
import {
  exploreCatalogStats,
  exploreGenrePlates,
  exploreMoodPlates,
  exploreReleases,
  exploreWorlds,
  resolveExploreFocus,
} from "../lib/explore";

const EXPLORE_CSS = `
  .pmp-explore-modes {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    padding: 8px ${"{gutter}"}px 4px;
  }
  .pmp-explore-find {
    transition: border-color ${"{base}"} ${"{ease}"}, box-shadow ${"{base}"};
  }
  .pmp-explore-find:hover {
    border-color: rgba(90, 196, 214, 0.45) !important;
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
  }
  @media (min-width: 1100px) {
    .pmp-mix-wheel { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  }
`.replaceAll("{base}", motion.base).replaceAll("{ease}", motion.ease).replaceAll("{gutter}", String(homeSpace.gutter));

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
          width: "100%",
          maxWidth: 520,
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 42,
          padding: "0 12px",
          borderRadius: radio.radiusLcd,
          border: radio.lcdBorder,
          background: radio.lcdFace,
          boxShadow: radio.lcdShadow,
          color: color.lcdMute,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: fontMono,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 0.04,
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
    worlds: "A planet of scenes — tap a disc, not a feed.",
    energy: "One strip. Pressure, not playlists.",
    sleeves: "Open a jewel case. Flip the wallet.",
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
 * Explore — catalog directory. Home owns the live device;
 * this screen is crate geography, not another Channel Surfing page.
 */
function ExploreScreen({
  tracks = [],
  catalogLoading = false,
  onPlayTrack = null,
  onOpenSearch = null,
  onOpenAlbum = null,
  onOpenMenu = null,
  onListenIntent = null,
}) {
  const currentTrack = useCurrentTrack();
  const activeId = currentTrack?.id;
  const [focusKey, setFocusKey] = useState(null);
  const [mode, setMode] = useState("worlds");
  const [deepReady, setDeepReady] = useState(process.env.NODE_ENV === "test");

  useEffect(() => {
    if (process.env.NODE_ENV === "test") return undefined;
    return runAfterDelay(() => setDeepReady(true), 2400);
  }, []);

  const worlds = useMemo(() => exploreWorlds(tracks), [tracks]);
  const lanes = useMemo(() => exploreGenrePlates(tracks, 12), [tracks]);
  const rooms = useMemo(
    () => (mode === "energy" || deepReady ? exploreMoodPlates(tracks) : []),
    [tracks, deepReady, mode]
  );
  const releases = useMemo(
    () => (mode === "sleeves" || deepReady ? exploreReleases(tracks, 6) : []),
    [tracks, deepReady, mode]
  );
  const stats = useMemo(() => exploreCatalogStats(tracks), [tracks]);

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

  const hasBody =
    worlds.some((f) => f.tiles.length) ||
    rooms.length > 0 ||
    releases.length > 0 ||
    lanes.length > 0;

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
                Explore
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
                  ? `${stats.worlds} worlds · ${stats.cuts} cuts`
                  : "A crate, not a feed."}
              </p>
            </div>
          </div>
        </div>
      </header>

      <FindEntry onOpenSearch={onOpenSearch} />
      <ExploreModes mode={mode} onChange={setMode} />
      <ModeHint mode={mode} />

      {mode === "worlds" && (worlds.length > 0 || lanes.length > 0) && (
        <WorldAtlas families={worlds} lanes={lanes} onOpen={setFocusKey} />
      )}

      {mode === "energy" && rooms.length > 0 && (
        <EnergyRooms
          rooms={rooms}
          onPlay={(track, pool) => playFocusPool(track, pool)}
        />
      )}

      {mode === "sleeves" && releases.length > 0 && (
        <section aria-label="Albums" style={{ marginTop: 16 }}>
          <SleeveWallet
            albums={releases}
            onOpenAlbum={onOpenAlbum}
            onPlayTrack={onPlayTrack}
          />
        </section>
      )}

      {mode === "mix" && (
        <MixBoard tracks={tracks} onPlayPool={onPlayTrack} />
      )}

      {mode === "energy" && rooms.length === 0 && hasBody && (
        <p style={{ padding: `16px ${homeSpace.gutter}px`, color: color.muted, fontSize: 14 }}>
          The pressure strip fills once cuts carry a pace.
        </p>
      )}
      {mode === "sleeves" && releases.length === 0 && hasBody && (
        <p style={{ padding: `16px ${homeSpace.gutter}px`, color: color.muted, fontSize: 14 }}>
          Sleeves land when albums have more than one cut.
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
    </div>
  );
}

export default memo(ExploreScreen);
