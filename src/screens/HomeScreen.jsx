import { useMemo, useState, useEffect, memo, lazy, Suspense } from "react";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  color,
  fontDisplay,
  glass,
  homeSpace,
  motion,
  radius,
  y2k,
} from "../theme";
import { countPlayableTracks } from "../lib/catalogLoad";
import { getSceneChannel, SCENE_CHANNELS } from "../lib/sceneChannels";
import { buildHomeCollections } from "../lib/homeCollections";
import { rankChannelsForTaste } from "../lib/onboardingTaste";
import { runAfterPaint } from "../lib/afterPaint";
import { useCurrentTrack } from "../usePlayerTransport";
import HomeHeader from "../components/home/HomeHeader";
import HeroPlayerCard from "../components/home/HeroPlayerCard";
import MusicSection, { Rail } from "../components/home/MusicSection";
import ChannelSurfingSection from "../components/home/ChannelSurfingSection";
import TrackCard from "../components/home/TrackCard";
import CardContainer from "../components/home/CardContainer";
import CrateSpread from "../components/home/CrateSpread";

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
        borderRadius: radius.xl,
        border: `1px solid ${error ? "rgba(255,51,79,0.22)" : "rgba(255,255,255,0.1)"}`,
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
      aria-label="Pulling the shelf"
      style={{
        margin: `${homeSpace.sectionGap}px ${homeSpace.gutter}px 0`,
        padding: "18px 20px",
        borderRadius: radius.xl,
        border: "1px solid rgba(255,255,255,0.12)",
        background: glass.plate,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span
        aria-hidden="true"
        className="pmp-live-led"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: y2k.live,
          boxShadow: "none",
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: -0.08,
            textTransform: "none",
            color: color.muted,
            marginBottom: 4,
          }}
        >
          Stand by
        </div>
        <div style={{ fontSize: 14, fontWeight: 550, color: color.body, letterSpacing: -0.1 }}>
          Pulling the station
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
          background: `
            linear-gradient(135deg, rgba(30,111,232,0.08) 0%, transparent 50%),
            linear-gradient(165deg, #1A1D24 0%, #101218 100%)
          `,
          border: `1px solid rgba(232,234,238,0.1)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 28px rgba(0,0,0,0.35)`,
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

function HomeScreen({
  tracks, onPlayRadio, onTogglePlay, onPlayTrack, onLike,
  isRadioMode, playlistCtx, signalLabel, hypnoPocket = false,
  mixLane, radioPreview = null, radioNext = null, onSkipRadio, onPrevRadio,
  catalogError = null, onRetryCatalog,
  catalogLoading = false,
  onOpenPlayer,
  onStageVisibilityChange = null,
  onSeek = null,
  countdown = [],
  onTuneCountdown = null,
  daypart = null,
  tickerText = "",
  onDislike = null,
  onDedicate = null,
  dedicationFlash = null,
  onClearDedication = null,
  airing = null,
  programGuide = [],
  activeShowId = null,
  onTuneShow = null,
  showBumper = null,
  channelShow = null,
  sceneChannelsActiveId = null,
  onTuneSceneChannel = null,
  // Navigation (broadcast home)
  onOpenSearch = null,
  onOpenProfile = null,
  onOpenCharts = null,
  onOpenMenu = null,
  taste = null,
  userKey = "",
  recentTrackIds = [],
  dislikeTaste = null,
}) {
  const currentTrack = useCurrentTrack();
  const activeId = currentTrack?.id;
  const playableCount = countPlayableTracks(tracks);
  const catalogEmpty = !catalogLoading && !catalogError && tracks.length === 0;
  const catalogDepleted = !catalogLoading && !catalogError && tracks.length > 0 && playableCount === 0;
  const catalogReady = !catalogLoading && !catalogError && !catalogEmpty && !catalogDepleted;
  const shelvesReady = useAfterFirstPaint();

  const channels = useMemo(
    () => rankChannelsForTaste(SCENE_CHANNELS, taste),
    [taste]
  );

  const editorial = useMemo(() => buildHomeCollections(tracks), [tracks]);

  const topRequested = useMemo(() => countdown.slice(0, 10), [countdown]);
  const liveShow = channelShow || airing?.show || null;
  const activeChannel = sceneChannelsActiveId
    ? getSceneChannel(sceneChannelsActiveId)
    : null;
  const hasTonight = !!(airing?.show || programGuide.length > 0);
  const featuredSize = homeSpace.tileFeatured;
  const hasChannels = channels.length > 0;

  return (
    <div
      className="pmp-home-mtv"
      style={{
        position: "relative",
        paddingBottom: 56,
        maxWidth: 960,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <HomeHeader
        onOpenSearch={onOpenSearch}
        onOpenProfile={onOpenProfile}
        onOpenMenu={onOpenMenu}
      />

      {/* CHANNEL SURFING — top of Home */}
      {hasChannels && (
        <ChannelSurfingSection
          channels={channels}
          activeChannelId={sceneChannelsActiveId}
          onTuneChannel={onTuneSceneChannel}
          first
          delay={0.02}
        />
      )}

      {/* NOW PLAYING — device stage */}
      <div
        style={{
          padding: `0 ${homeSpace.gutter}px`,
          marginTop: hasChannels ? homeSpace.sectionGap : homeSpace.sectionGapFirst,
          animation: `rise 0.5s ${motion.ease} 0.04s both`,
        }}
      >
        <HeroPlayerCard
          track={currentTrack}
          previewTrack={radioPreview}
          upNextTrack={radioNext}
          liveShow={liveShow}
          sceneChannel={activeChannel}
          daypart={daypart}
          isRadioMode={isRadioMode}
          playDisabled={!catalogReady}
          onPlay={onPlayRadio}
          onTogglePlay={onTogglePlay}
          onSkip={onSkipRadio}
          onPrev={onPrevRadio}
          onLike={onLike}
          onDislike={currentTrack ? onDislike : null}
          onOpen={onOpenPlayer}
          onVisibilityChange={onStageVisibilityChange}
          onSeek={onSeek}
          tickerText={tickerText}
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

      {/* ON TONIGHT — EPG band (below-fold; wait a frame so channel photos win the network) */}
      {shelvesReady && catalogReady && hasTonight && (
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "320px" }}>
          <Suspense fallback={null}>
            <TonightDeck
              airing={airing}
              guide={programGuide}
              bumper={showBumper}
              activeShowId={activeShowId}
              tuned={false}
              first={false}
              showNowPlaying={!!(airing?.show && !(activeShowId === airing.show.id && currentTrack))}
              onTuneIn={() => onTuneShow?.(airing?.show)}
              onSelectShow={(show) => onTuneShow?.(show)}
            />
          </Suspense>
        </div>
      )}

      {/* One crate spread per Home — countdown if that's the only band, else first editorial */}
      {shelvesReady && catalogReady && (editorial[0]?.tracks?.length > 0 || topRequested.length > 0) && (
        <CrateSpread
          title={editorial[0]?.tracks?.length ? editorial[0].label : "Most Requested"}
          subtitle={editorial[0]?.tracks?.length ? editorial[0].story : "Tonight's countdown"}
          tracks={
            editorial[0]?.tracks?.length
              ? editorial[0].tracks
              : topRequested.map((e) => e.track)
          }
          activeId={activeId}
          onPlayTrack={onPlayTrack}
          action={
            !editorial[0]?.tracks?.length && onOpenCharts
              ? { label: "See All", onClick: onOpenCharts }
              : !editorial[0]?.tracks?.length && onTuneCountdown
                ? { label: "Tune In", onClick: onTuneCountdown }
                : null
          }
        />
      )}

      {shelvesReady && catalogReady && editorial[0]?.tracks?.length > 0 && topRequested.length > 0 && (
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "280px" }}>
        <MusicSection
          title="Most Requested"
          subtitle="Tonight's countdown"
          poster
          first={false}
          action={
            onOpenCharts
              ? { label: "See All", onClick: onOpenCharts }
              : onTuneCountdown
                ? { label: "Tune In", onClick: onTuneCountdown }
                : null
          }
          delay={0.06}
        >
          <Rail gap={16}>
            {topRequested.map(({ rank, track }) => (
              <TrackCard
                key={track.id}
                track={track}
                rank={rank}
                size={featuredSize}
                active={activeId === track.id}
                onClick={() => onPlayTrack?.(track, topRequested.map((e) => e.track))}
              />
            ))}
          </Rail>
        </MusicSection>
        </div>
      )}

      {shelvesReady && catalogReady &&
        editorial.slice(editorial[0]?.tracks?.length ? 1 : 0).map((col, i) => (
          <div key={col.id} style={{ contentVisibility: "auto", containIntrinsicSize: "280px" }}>
          <MusicSection
            title={col.label}
            subtitle={col.story}
            poster
            delay={0.1 + i * 0.02}
          >
            <Rail gap={16}>
              {col.tracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  active={activeId === track.id}
                  onClick={() => onPlayTrack?.(track, col.tracks)}
                />
              ))}
            </Rail>
          </MusicSection>
          </div>
        ))}

      {catalogLoading && <HomeStandBy />}

      {/* Catalog is fine but nothing editorial to show — quiet empty state */}
      {catalogReady &&
        channels.length === 0 &&
        !hasTonight &&
        topRequested.length === 0 &&
        editorial.length === 0 && (
          <div style={{ marginTop: 32 }}>
            <EmptyShelfCard
              title="Nothing here yet"
              body="New music will appear here."
            />
          </div>
        )}
    </div>
  );
}

export default memo(HomeScreen);
