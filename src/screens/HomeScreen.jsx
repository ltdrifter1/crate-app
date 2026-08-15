import { useMemo, memo } from "react";
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
import { availableSceneChannels, channelCoverUrls } from "../lib/sceneChannels";
import { buildHomeCollections } from "../lib/homeCollections";
import { TonightDeck } from "../components/station/ShowGuide";
import { useCurrentTrack } from "../usePlayerTransport";
import HomeHeader from "../components/home/HomeHeader";
import HeroPlayerCard from "../components/home/HeroPlayerCard";
import MusicSection, { Rail } from "../components/home/MusicSection";
import ChannelSurfingSection from "../components/home/ChannelSurfingSection";
import TrackCard from "../components/home/TrackCard";
import RequestSongCard from "../components/home/RequestSongCard";
import CardContainer from "../components/home/CardContainer";

function HomeCatalogStatus({ error, isEmpty, playableCount, totalCount, onRetry }) {
  if (!error && !isEmpty) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      style={{
        margin: `20px ${homeSpace.gutter}px 0`,
        padding: "18px 20px",
        borderRadius: radius.xl,
        border: `1px solid ${error ? color.lineStrong : color.line}`,
        background: glass.plate,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
      }}
    >
      {error ? (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: fontDisplay, color: color.ink, marginBottom: 6 }}>
            Couldn&apos;t pull the shelf
          </div>
          <div style={{ fontSize: 13, color: color.body, lineHeight: 1.45, marginBottom: 12 }}>
            Check your connection and try again. If this keeps happening, the catalog may need a moment to sync.
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
              ? "Tracks need audio"
              : "Shelf is empty"}
          </div>
          <div style={{ fontSize: 13, color: color.body, lineHeight: 1.45 }}>
            {totalCount > 0 && playableCount === 0
              ? "Catalog rows loaded, but none have a playable audio URL yet."
              : "Add cuts in Admin and they land on the dial."}
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

/** Quiet editorial empty state used by shelves with nothing to show yet. */
function EmptyShelfCard({ title, body, actionLabel = null, onAction = null }) {
  return (
    <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
      <CardContainer
        interactive={!!onAction}
        onClick={onAction}
        ariaLabel={actionLabel || title}
        padding="22px 20px"
        style={{
          background: `
            radial-gradient(110% 120% at 0% 0%, ${y2k.chromeWash} 0%, transparent 55%),
            linear-gradient(165deg, ${y2k.charcoalRaised} 0%, #101116 100%)
          `,
          border: `1px solid rgba(255,255,255,0.12)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.35), ${glass.shadowSoft}`,
        }}
      >
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: y2k.offWhite,
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: color.muted, lineHeight: 1.5, maxWidth: 300 }}>
          {body}
        </div>
        {actionLabel && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: y2k.chromeBright,
            }}
          >
            {actionLabel} →
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
  onOpenPlayer,
  onStageVisibilityChange = null,
  onSeek = null,
  countdown = [],
  onTuneCountdown = null,
  daypart = null,
  tickerText = "",
  onRequest = null,
  requested = false,
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
}) {
  const currentTrack = useCurrentTrack();
  const activeId = currentTrack?.id;
  const playableCount = countPlayableTracks(tracks);
  const catalogEmpty = !catalogError && tracks.length === 0;
  const catalogDepleted = !catalogError && tracks.length > 0 && playableCount === 0;
  const catalogReady = !catalogError && !catalogEmpty && !catalogDepleted;

  const channels = useMemo(() => availableSceneChannels(tracks), [tracks]);

  const channelCovers = useMemo(() => {
    const map = {};
    for (const channel of channels) {
      map[channel.id] = channelCoverUrls(tracks, channel, 4);
    }
    return map;
  }, [channels, tracks]);

  const editorial = useMemo(() => buildHomeCollections(tracks), [tracks]);

  const topRequested = useMemo(() => countdown.slice(0, 10), [countdown]);
  const liveShow = channelShow || airing?.show || null;
  const hasTonight = !!(airing?.show || programGuide.length > 0);
  const featuredSize = homeSpace.tileFeatured;
  const hasChannels = catalogReady && channels.length > 0;

  return (
    <div
      style={{
        position: "relative",
        paddingBottom: 56,
        maxWidth: 960,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <HomeHeader onOpenSearch={onOpenSearch} onOpenProfile={onOpenProfile} />

      {/* NOW PLAYING — broadcast hero */}
      <div
        style={{
          padding: `0 ${homeSpace.gutter}px`,
          animation: `rise 0.5s ${motion.ease} both`,
        }}
      >
        <HeroPlayerCard
          track={currentTrack}
          previewTrack={radioPreview}
          upNextTrack={radioNext}
          liveShow={liveShow}
          daypart={daypart}
          isRadioMode={isRadioMode}
          playDisabled={!catalogReady}
          onPlay={onPlayRadio}
          onTogglePlay={onTogglePlay}
          onSkip={onSkipRadio}
          onPrev={onPrevRadio}
          onLike={onLike}
          onOpen={onOpenPlayer}
          onRequest={currentTrack ? onRequest : null}
          requested={requested}
          onVisibilityChange={onStageVisibilityChange}
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

      {/* CHANNEL SURFING — premium dial band, top of Home */}
      {hasChannels && (
        <ChannelSurfingSection
          channels={channels}
          channelCovers={channelCovers}
          activeChannelId={sceneChannelsActiveId}
          onTuneChannel={onTuneSceneChannel}
          first
          delay={0.04}
        />
      )}

      {/* ON TONIGHT — EPG band, shared left edge with Channel surfing */}
      {catalogReady && hasTonight && (
        <TonightDeck
          airing={airing}
          guide={programGuide}
          bumper={showBumper}
          activeShowId={activeShowId}
          tuned={false}
          first={!hasChannels}
          showNowPlaying={!!(airing?.show && !(activeShowId === airing.show.id && currentTrack))}
          onTuneIn={() => onTuneShow?.(airing?.show)}
          onSelectShow={(show) => onTuneShow?.(show)}
        />
      )}

      {/* MOST REQUESTED — larger featured sleeves */}
      {catalogReady && topRequested.length > 0 && (
        <MusicSection
          title="Most requested"
          subtitle="Tonight's countdown"
          first={!hasChannels && !hasTonight}
          action={
            onOpenCharts
              ? { label: "View all", onClick: onOpenCharts }
              : onTuneCountdown
                ? { label: "Tune in", onClick: onTuneCountdown }
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
      )}

      {/* EDITORIAL — Played before */}
      {catalogReady &&
        editorial.map((col, i) => (
          <MusicSection
            key={col.id}
            title={col.label}
            subtitle={col.story}
            first={!hasChannels && !hasTonight && topRequested.length === 0 && i === 0}
            delay={0.08 + i * 0.02}
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
        ))}

      {/* REQUEST A SONG */}
      {catalogReady && onOpenSearch && (
        <div
          style={{
            marginTop: homeSpace.sectionGap,
            padding: `0 ${homeSpace.gutter}px`,
            animation: `rise 0.5s ${motion.ease} 0.12s both`,
          }}
        >
          <RequestSongCard onClick={onOpenSearch} />
        </div>
      )}

      {/* Catalog is fine but nothing editorial to show — quiet empty state */}
      {catalogReady &&
        channels.length === 0 &&
        !hasTonight &&
        topRequested.length === 0 &&
        editorial.length === 0 && (
          <div style={{ marginTop: 32 }}>
            <EmptyShelfCard
              title="Nothing on the shelf"
              body="Add cuts to the catalog and they land here."
            />
          </div>
        )}
    </div>
  );
}

export default memo(HomeScreen);
