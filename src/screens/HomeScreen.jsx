import { useMemo, useState, useEffect, memo, lazy, Suspense } from "react";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  color,
  fontDisplay,
  homeSpace,
  motion,
  y2k,
} from "../theme";
import { countPlayableTracks } from "../lib/catalogLoad";
import { getSceneChannel, SCENE_CHANNELS } from "../lib/sceneChannels";
import { buildHomeCollections, tracksFromRecentIds } from "../lib/homeCollections";
import { rankChannelsForTaste } from "../lib/onboardingTaste";
import { runAfterPaint, runWhenIdle } from "../lib/afterPaint";
import { buildOnAirRotations, msUntilNextSlot, onAirNow, onAirSlot } from "../lib/onAir";
import { useCurrentTrack, useIsPlaying, useTransportTrackId } from "../usePlayerTransport";
import HomeHeader from "../components/home/HomeHeader";
import HomeBandHeader from "../components/home/HomeBandHeader";
import HeroPlayerCard from "../components/home/HeroPlayerCard";
import MusicSection, { Rail } from "../components/home/MusicSection";
import TrackCard from "../components/home/TrackCard";
import CardContainer from "../components/home/CardContainer";
import CrateSpread from "../components/home/CrateSpread";
import ChannelSurfingSection from "../components/home/ChannelSurfingSection";
import HomeBoard from "../components/home/HomeBoard";
import OnAirPanel from "../components/home/OnAirPanel";

/** Desktop Home splits the ruled sheet once it fits beside the sidebar. */
export const WIDE_HOME_QUERY = "(min-width: 1280px)";

function useMediaQuery(query) {
  const read = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(query).matches;
  const [matches, setMatches] = useState(read);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mql = window.matchMedia(query);
    const sync = () => setMatches(mql.matches);
    sync();
    mql.addEventListener?.("change", sync);
    return () => mql.removeEventListener?.("change", sync);
  }, [query]);
  return matches;
}

/**
 * { [channelId]: track } on air this slot; rotations build when the browser is idle.
 * Waits for the full catalog — picks from the lite shelf would flip once it lands.
 */
function useOnAirNow(tracks, channels, ready) {
  const [rotations, setRotations] = useState(null);
  useEffect(() => {
    if (!ready || !tracks.length || !channels.length) {
      setRotations(null);
      return undefined;
    }
    return runWhenIdle(() => setRotations(buildOnAirRotations(tracks, channels)));
  }, [tracks, channels, ready]);
  const [slot, setSlot] = useState(() => onAirSlot());
  useEffect(() => {
    const id = setTimeout(() => setSlot(onAirSlot()), msUntilNextSlot());
    return () => clearTimeout(id);
  }, [slot]);
  return useMemo(() => (rotations ? onAirNow(rotations, slot) : {}), [rotations, slot]);
}

const TonightDeck = lazy(() =>
  import("../components/station/ShowGuide").then((m) => ({ default: m.TonightDeck }))
);

function HomeCatalogStatus({ error, isEmpty, playableCount, totalCount, onRetry }) {
  if (!error && !isEmpty) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      style={{
        margin: `20px ${homeSpace.gutter}px 0`,
        padding: "18px 20px",
        borderRadius: 0,
        border: "2px solid #F1E5D7",
        background: "transparent",
        boxShadow: "4px 4px 0 #F1E5D7",
      }}
    >
      {error ? (
        <>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontFamily: fontDisplay,
              color: color.ink,
              marginBottom: 6,
            }}
          >
            Couldn&apos;t load
          </div>
          <div style={{ fontSize: 13, color: color.body, lineHeight: 1.45, marginBottom: 12 }}>
            Check your connection, then try again.
          </div>
          <button
            type="button"
            onClick={onRetry}
            style={{
              ...BTN_PRIMARY,
              width: "auto",
              padding: "10px 18px",
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: fontDisplay, color: color.ink, marginBottom: 6 }}>
            {totalCount > 0 && playableCount === 0
              ? "Audio isn’t ready"
              : "Nothing here yet"}
          </div>
          <div style={{ fontSize: 13, color: color.body, lineHeight: 1.45 }}>
            {totalCount > 0 && playableCount === 0
              ? "Titles loaded, but none have playable audio yet."
              : "New music will appear here."}
          </div>
          <button
            type="button"
            onClick={onRetry}
            style={{
              ...BTN_SECONDARY,
              width: "auto",
              marginTop: 12,
              padding: "10px 18px",
              fontSize: 14,
            }}
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}

function HomeStandBy() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading your player"
      style={{
        margin: `${homeSpace.sectionGap}px ${homeSpace.gutter}px 0`,
        padding: "18px 20px",
        borderRadius: 0,
        border: "2px solid #F1E5D7",
        background: "transparent",
        boxShadow: "none",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: -0.08,
            color: color.muted,
            marginBottom: 4,
          }}
        >
          Getting ready
        </div>
        <div style={{ fontSize: 14, fontWeight: 550, color: color.body, letterSpacing: -0.1 }}>
          Loading your player
        </div>
      </div>
    </div>
  );
}

function useAfterFirstPaint() {
  const [ready, setReady] = useState(false);
  useEffect(() => runAfterPaint(() => setReady(true)), []);
  return ready;
}

/** Quiet editorial empty state used by shelves with nothing to show yet. */
function EmptyShelfCard({ title, body, actionLabel = null, onAction = null }) {
  return (
    <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
      <CardContainer
        interactive={!!onAction}
        onClick={onAction}
        ariaLabel={actionLabel || title}
        padding="22px 20px"
        rounded={0}
        style={{
          background: "transparent",
          border: "2px solid #F1E5D7",
          boxShadow: "4px 4px 0 #F1E5D7",
          borderRadius: 0,
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
          {title}
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: color.muted, lineHeight: 1.45, maxWidth: 320 }}>
          {body}
        </div>
        {actionLabel && (
          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: -0.15,
              color: color.ink,
            }}
          >
            {actionLabel}
          </div>
        )}
      </CardContainer>
    </div>
  );
}

function HomeNowPlaying({
  radioPreview,
  radioNext,
  liveShow,
  activeChannel,
  daypart,
  isRadioMode,
  playDisabled,
  onPlayRadio,
  onTogglePlay,
  onSkipRadio,
  onPrevRadio,
  onOpenPlayer,
  onStageVisibilityChange,
  onSeek,
  tickerText,
  onDislike,
  onLike,
  onShare,
  onShowQueue,
}) {
  const currentTrack = useCurrentTrack();
  return (
    <HeroPlayerCard
      track={currentTrack}
      previewTrack={radioPreview}
      upNextTrack={radioNext}
      liveShow={liveShow}
      sceneChannel={activeChannel}
      daypart={daypart}
      isRadioMode={isRadioMode}
      playDisabled={playDisabled}
      onPlay={onPlayRadio}
      onTogglePlay={onTogglePlay}
      onSkip={onSkipRadio}
      onPrev={onPrevRadio}
      onLike={currentTrack ? onLike : null}
      onDislike={currentTrack ? onDislike : null}
      onShare={currentTrack ? onShare : null}
      onShowQueue={currentTrack ? onShowQueue : null}
      onOpen={onOpenPlayer}
      onVisibilityChange={onStageVisibilityChange}
      onSeek={onSeek}
      tickerText={tickerText}
    />
  );
}

function HomePersonal({
  tracks,
  recentTrackIds = [],
  onPlayTrack,
  onOpenLibrary,
  onOpenDiscover = null,
  signedIn = false,
}) {
  const activeId = useTransportTrackId();
  const recents = useMemo(
    () => tracksFromRecentIds(tracks, recentTrackIds, 12),
    [tracks, recentTrackIds]
  );
  if (recents.length === 0) {
    if (!signedIn) return null;
    return (
      <div data-testid="home-personal" style={{ marginTop: homeSpace.sectionGap }}>
        <EmptyShelfCard
          title="Your listening"
          body="Play a few tracks. Recents show up here. Likes live in Library."
          actionLabel={onOpenDiscover ? "Find music" : onOpenLibrary ? "Library" : null}
          onAction={onOpenDiscover || onOpenLibrary}
        />
      </div>
    );
  }

  return (
    <div data-testid="home-personal">
      {recents.length > 0 && (
        <MusicSection
          title="Recently played"
          subtitle="Just on the channel"
          poster
          first
          action={
            onOpenLibrary
              ? { label: "Library", onClick: onOpenLibrary }
              : null
          }
          delay={0.06}
        >
          <Rail gap={16}>
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
    </div>
  );
}

function HomeBoardShelf({ countdown, onPlayTrack, onOpenCharts, onTuneCountdown, onRequestTrack, first, side = false }) {
  const activeId = useTransportTrackId();
  const playing = useIsPlaying();
  return (
    <HomeBoard
      countdown={countdown}
      nowPlayingId={activeId}
      isPlaying={playing}
      onPlayTrack={onPlayTrack}
      onOpenCharts={onOpenCharts}
      onTune={onTuneCountdown}
      onRequest={onRequestTrack}
      first={first}
      columns={!side}
      flush={side}
    />
  );
}

const SHEET_RULE = "2px solid #F1E5D7";

/** Short dotted index for the ruled sheet — the broadsheet's third column. */
function HomeCrateIndex({ title, rows, onPlayTrack }) {
  if (!rows.length) return null;
  return (
    <section aria-label={title} style={{ padding: `4px ${homeSpace.gutter}px 0` }}>
      <HomeBandHeader title={title} meta={`${rows.length} cuts`} flush />
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((track) => (
          <li key={track.id} style={{ borderBottom: "1px dotted rgba(241,229,215,0.55)" }}>
            <button
              type="button"
              className="pmp-press"
              onClick={() => onPlayTrack?.(track, rows)}
              aria-label={`Play ${track.title} by ${track.artist || "unknown artist"}`}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                border: "none",
                background: "transparent",
                color: color.ink,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 700, letterSpacing: -0.1 }}>
                  {track.title}
                </span>
                {track.artist && (
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: color.muted,
                    }}
                  >
                    {track.artist}
                  </span>
                )}
              </span>
              <span aria-hidden="true">▸</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HomeEditorial({
  tracks,
  onPlayTrack,
}) {
  const activeId = useTransportTrackId();
  const editorial = useMemo(() => buildHomeCollections(tracks), [tracks]);
  const feature = editorial[0];
  if (!feature?.tracks?.length) return null;

  return (
    <CrateSpread
      title={feature.label}
      subtitle={feature.story}
      tracks={feature.tracks}
      activeId={activeId}
      onPlayTrack={onPlayTrack}
    />
  );
}

function HomeScreen({
  tracks,
  onPlayRadio,
  onTogglePlay,
  onPlayTrack,
  isRadioMode,
  radioPreview = null,
  radioNext = null,
  onSkipRadio,
  onPrevRadio,
  catalogError = null,
  onRetryCatalog,
  catalogLoading = false,
  /** Whole catalog in state (not just the Home lite shelf). */
  catalogComplete = false,
  onOpenPlayer,
  onStageVisibilityChange = null,
  onSeek = null,
  countdown = [],
  onTuneCountdown = null,
  daypart = null,
  tickerText = "",
  onDislike = null,
  onLike = null,
  onShare = null,
  onShowQueue = null,
  onOpenLibrary = null,
  recentTrackIds = [],
  signedIn = false,
  onOpenDiscover = null,
  airing = null,
  programGuide = [],
  activeShowId = null,
  onTuneShow = null,
  showBumper = null,
  channelShow = null,
  sceneChannelsActiveId = null,
  onTuneSceneChannel = null,
  onOpenSearch = null,
  onOpenCharts = null,
  onOpenMenu = null,
  onRequestTrack = null,
  taste = null,
}) {
  const playableCount = useMemo(() => countPlayableTracks(tracks), [tracks]);
  const catalogEmpty = !catalogLoading && !catalogError && tracks.length === 0;
  const catalogDepleted = !catalogLoading && !catalogError && tracks.length > 0 && playableCount === 0;
  const catalogReady = !catalogLoading && !catalogError && !catalogEmpty && !catalogDepleted;
  const shelvesReady = useAfterFirstPaint();

  const liveShow = channelShow || airing?.show || null;
  const activeChannel = sceneChannelsActiveId
    ? getSceneChannel(sceneChannelsActiveId)
    : null;
  const channels = useMemo(
    () => (onTuneSceneChannel ? rankChannelsForTaste(SCENE_CHANNELS, taste) : []),
    [taste, onTuneSceneChannel]
  );
  const hasTonight = !!(onTuneShow && (airing?.show || programGuide.length > 0));
  const wide = useMediaQuery(WIDE_HOME_QUERY);
  const onAir = useOnAirNow(tracks, channels, catalogComplete);
  const hasOnAir = Object.keys(onAir).length > 0;
  const showBoard = shelvesReady && catalogReady && countdown.length >= 3;
  const crate = useMemo(() => {
    const feature = buildHomeCollections(tracks)[0];
    return {
      title: feature?.label || "In the crate",
      rows: (feature?.tracks || []).filter((t) => t?.id && t?.title).slice(0, 4),
    };
  }, [tracks]);
  const scrollToChannels = () => {
    if (typeof document === "undefined") return;
    document.querySelector(".pmp-channel-surf")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const stage = (
    <HomeNowPlaying
      radioPreview={radioPreview}
      radioNext={radioNext}
      liveShow={liveShow}
      activeChannel={activeChannel}
      daypart={daypart}
      isRadioMode={isRadioMode}
      playDisabled={!catalogReady}
      onPlayRadio={onPlayRadio}
      onTogglePlay={onTogglePlay}
      onSkipRadio={onSkipRadio}
      onPrevRadio={onPrevRadio}
      onOpenPlayer={onOpenPlayer}
      onStageVisibilityChange={onStageVisibilityChange}
      onSeek={onSeek}
      tickerText={tickerText}
      onDislike={onDislike}
      onLike={onLike}
      onShare={onShare}
      onShowQueue={onShowQueue}
    />
  );

  const catalogStatus = (catalogError || catalogEmpty || catalogDepleted) && (
    <HomeCatalogStatus
      error={catalogError}
      isEmpty={catalogEmpty || catalogDepleted}
      playableCount={playableCount}
      totalCount={tracks.length}
      onRetry={onRetryCatalog}
    />
  );

  const tonight = shelvesReady && hasTonight && (
    <div style={{ contentVisibility: "auto", containIntrinsicSize: "320px" }}>
      <Suspense fallback={null}>
        <TonightDeck
          airing={airing}
          guide={programGuide}
          bumper={showBumper}
          activeShowId={activeShowId}
          tuned={false}
          first
          showNowPlaying={false}
          onTuneIn={() => onTuneShow?.(airing?.show)}
          onSelectShow={(show) => onTuneShow?.(show)}
        />
      </Suspense>
    </div>
  );

  const board = (side) =>
    showBoard && (
      <div style={side ? null : { contentVisibility: "auto", containIntrinsicSize: "520px" }}>
        <HomeBoardShelf
          countdown={countdown}
          onPlayTrack={onPlayTrack}
          onOpenCharts={onOpenCharts}
          onTuneCountdown={onTuneCountdown}
          onRequestTrack={onRequestTrack}
          first={side || (channels.length === 0 && !hasTonight)}
          side={side}
        />
      </div>
    );

  const surfing = channels.length > 0 && (
    <ChannelSurfingSection
      channels={channels}
      onAir={onAir}
      activeChannelId={sceneChannelsActiveId}
      onTuneChannel={onTuneSceneChannel}
      first={!hasTonight && !wide}
      delay={0.05}
    />
  );

  const sheetCells = [
    tonight ? { key: "tonight", node: tonight } : null,
    wide && channels.length > 0
      ? {
          key: "onair",
          node: (
            <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
              <OnAirPanel
                loading={!hasOnAir}
                channels={channels}
                onAir={onAir}
                activeChannelId={sceneChannelsActiveId}
                onTuneChannel={onTuneSceneChannel}
                onShowAll={scrollToChannels}
              />
            </div>
          ),
        }
      : null,
    crate.rows.length
      ? {
          key: "crate",
          node: (
            <HomeCrateIndex
              title={crate.title}
              rows={crate.rows}
              onPlayTrack={onPlayTrack}
            />
          ),
        }
      : null,
  ].filter(Boolean);

  return (
    <div
      className="pmp-home-mtv"
      style={{
        position: "relative",
        paddingBottom: 24,
        maxWidth: wide ? 1320 : 1100,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <HomeHeader
        onOpenSearch={onOpenSearch}
        onOpenMenu={onOpenMenu}
      />

      <div
        className="pmp-home-poster"
        style={{
          padding: `${homeSpace.sectionGapFirst}px ${homeSpace.gutter}px 18px`,
          borderBottom: SHEET_RULE,
          animation: `rise 0.5s ${motion.ease} 0.04s both`,
        }}
      >
        {stage}
      </div>
      {catalogStatus}

      {sheetCells.length > 0 && (
        <div
          className="pmp-home-sheet"
          style={{
            display: "grid",
            gridTemplateColumns: wide
              ? `repeat(${sheetCells.length}, minmax(0, 1fr))`
              : "minmax(0, 1fr)",
            borderBottom: SHEET_RULE,
          }}
        >
          {sheetCells.map((cell, i) => (
            <div
              key={cell.key}
              style={{
                minWidth: 0,
                padding: "12px 0 8px",
                borderRight: wide && i < sheetCells.length - 1 ? SHEET_RULE : "none",
                borderBottom: !wide && i < sheetCells.length - 1 ? SHEET_RULE : "none",
              }}
            >
              {cell.node}
            </div>
          ))}
        </div>
      )}

      {surfing}

      {board(false)}

      {shelvesReady && catalogReady && (
        <HomePersonal
          tracks={tracks}
          recentTrackIds={recentTrackIds}
          onPlayTrack={onPlayTrack}
          onOpenLibrary={onOpenLibrary}
          onOpenDiscover={onOpenDiscover}
          signedIn={signedIn}
        />
      )}

      {shelvesReady && catalogReady && (
        <HomeEditorial
          tracks={tracks}
          onPlayTrack={onPlayTrack}
        />
      )}

      {catalogLoading && <HomeStandBy />}
    </div>
  );
}

export default memo(HomeScreen);
