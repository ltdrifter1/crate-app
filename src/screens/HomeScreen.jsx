import { useMemo, useState, useEffect, memo } from "react";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  color,
  fontDisplay,
  glass,
  homeSpace,
  motion,
  radius,
  radio,
  y2k,
} from "../theme";
import { countPlayableTracks } from "../lib/catalogLoad";
import { getSceneChannel } from "../lib/sceneChannels";
import { buildHomeCollections, savedTracks, tracksFromRecentIds } from "../lib/homeCollections";
import { runAfterPaint } from "../lib/afterPaint";
import { useCurrentTrack, useTransportTrackId } from "../usePlayerTransport";
import HomeHeader from "../components/home/HomeHeader";
import HeroPlayerCard from "../components/home/HeroPlayerCard";
import MusicSection, { Rail } from "../components/home/MusicSection";
import TrackCard from "../components/home/TrackCard";
import CardContainer from "../components/home/CardContainer";
import CrateSpread from "../components/home/CrateSpread";

function HomeCatalogStatus({ error, isEmpty, playableCount, totalCount, onRetry }) {
  if (!error && !isEmpty) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      style={{
        margin: `20px ${homeSpace.gutter}px 0`,
        padding: "18px 20px",
        borderRadius: radius.xl,
        border: `1px solid ${error ? "rgba(255,51,79,0.22)" : "rgba(216,223,232,0.1)"}`,
        background: glass.plate,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
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
        borderRadius: radius.xl,
        border: "1px solid rgba(255,255,255,0.08)",
        background: glass.plate,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
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
        rounded={18}
        style={{
          background: radio.moduleFace,
          border: `1px solid ${glass.borderSoft}`,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 12px 28px rgba(58,66,80,0.18)`,
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
              color: color.accent,
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
  const liked = useMemo(() => savedTracks(tracks, 12), [tracks]);
  if (recents.length === 0 && liked.length === 0) {
    if (!signedIn) return null;
    return (
      <div data-testid="home-personal" style={{ marginTop: homeSpace.sectionGap }}>
        <EmptyShelfCard
          title="Your listening"
          body="Play a few tracks. Recents and likes show up here and in Library."
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
      {liked.length > 0 && (
        <MusicSection
          title="Liked"
          subtitle="Your favourites"
          poster
          first={recents.length === 0}
          action={
            onOpenLibrary
              ? { label: "See All", onClick: onOpenLibrary }
              : null
          }
          delay={0.08}
        >
          <Rail gap={16}>
            {liked.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                active={activeId === track.id}
                onClick={() => onPlayTrack?.(track, liked)}
              />
            ))}
          </Rail>
        </MusicSection>
      )}
    </div>
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

  return (
    <div
      className="pmp-home-mtv"
      style={{
        position: "relative",
        paddingBottom: 24,
        maxWidth: 1100,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <HomeHeader
        onOpenSearch={onOpenSearch}
        onOpenMenu={onOpenMenu}
      />

      <div
        style={{
          padding: `0 ${homeSpace.gutter}px`,
          marginTop: homeSpace.sectionGapFirst,
          animation: `rise 0.5s ${motion.ease} 0.04s both`,
        }}
      >
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
      </div>

      {(catalogError || catalogEmpty || catalogDepleted) && (
        <HomeCatalogStatus
          error={catalogError}
          isEmpty={catalogEmpty || catalogDepleted}
          playableCount={playableCount}
          totalCount={tracks.length}
          onRetry={onRetryCatalog}
        />
      )}

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
