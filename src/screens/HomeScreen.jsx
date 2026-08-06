import { useMemo, memo } from "react";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  chrome,
  chromeFrame,
  color,
  fontDisplay,
  fontMono,
  glass,
  homeSpace,
  motion,
  radius,
} from "../theme";
import { countPlayableTracks } from "../lib/catalogLoad";
import { getSceneChannel } from "../lib/sceneChannels";
import CoverStage from "../components/station/CoverStage";
import CountdownRail from "../components/station/CountdownRail";
import SceneSurfRail from "../components/station/SceneSurfRail";
import { NowOnAirCard, ShowGuideRail } from "../components/station/ShowGuide";
import { useCurrentTrack } from "../usePlayerTransport";

function HomeCatalogStatus({ error, isEmpty, playableCount, totalCount, onRetry }) {
  if (!error && !isEmpty) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      style={{
        margin: `0 ${homeSpace.gutter}px ${homeSpace.sectionPadTopFirst}px`,
        padding: "16px 18px",
        borderRadius: radius.lg,
        border: `1px solid ${error ? color.lineStrong : color.line}`,
        background: glass.fillStrong,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
      }}
    >
      {error ? (
        <>
          <div style={{ fontSize: 15, fontWeight: 650, color: color.ink, marginBottom: 6 }}>
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
          <div style={{ fontSize: 15, fontWeight: 650, color: color.ink, marginBottom: 6 }}>
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

function HomeScreen({
  tracks, onPlayRadio, onTogglePlay, onPlayTrack, onLike,
  isRadioMode, playlistCtx, signalLabel, hypnoPocket = false,
  mixLane, radioPreview = null, radioNext = null, onSkipRadio, onPrevRadio,
  catalogError = null, onRetryCatalog,
  onOpenPlayer,
  onBrowse = null,
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
}) {
  const currentTrack = useCurrentTrack();
  const activeId = currentTrack?.id;
  const playableCount = countPlayableTracks(tracks);
  const catalogEmpty = !catalogError && tracks.length === 0;
  const catalogDepleted = !catalogError && tracks.length > 0 && playableCount === 0;

  const countdownRank = useMemo(() => {
    if (!currentTrack?.id || !countdown.length) return null;
    const hit = countdown.find((c) => c.track.id === currentTrack.id);
    return hit?.rank ?? null;
  }, [countdown, currentTrack?.id]);

  const riseStyle = (delay = 0) => ({
    animation: `rise 0.45s ${motion.ease} ${delay}s both`,
  });

  return (
    <div style={{ position: "relative", paddingBottom: 48 }}>
      <CoverStage
        onPlay={onPlayRadio}
        onTogglePlay={onTogglePlay}
        onSkip={onSkipRadio}
        onPrev={onPrevRadio}
        onOpen={onOpenPlayer}
        currentTrack={currentTrack}
        isRadioMode={isRadioMode}
        hypnoPocket={hypnoPocket}
        previewTrack={radioPreview}
        mixLane={mixLane}
        playDisabled={catalogEmpty || catalogDepleted || !!catalogError}
        onStageVisibilityChange={onStageVisibilityChange}
        onSeek={onSeek}
        upNextTrack={radioNext}
        countdownRank={countdownRank}
        daypart={daypart}
        tickerText={tickerText}
        onRequest={onRequest}
        requested={requested}
        onDedicate={onDedicate}
        dedicationFlash={dedicationFlash}
        onClearDedication={onClearDedication}
        stationMode
        liveShow={channelShow || airing?.show || null}
        sceneChannel={sceneChannelsActiveId ? getSceneChannel(sceneChannelsActiveId) : null}
      />

      {(catalogError || catalogEmpty || catalogDepleted) && (
        <HomeCatalogStatus
          error={catalogError}
          isEmpty={catalogEmpty || catalogDepleted}
          playableCount={playableCount}
          totalCount={tracks.length}
          onRetry={onRetryCatalog}
        />
      )}

      <div style={{
        position: "relative",
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 18%),
          ${color.canvas}
        `,
      }}>
        {!catalogEmpty && !catalogError && (airing?.show || programGuide.length > 0 || countdown.length > 0) && (
          <section
            aria-label="Tonight"
            style={{ paddingTop: 16, paddingBottom: 4, ...riseStyle(0) }}
          >
            <div style={{ padding: `0 ${homeSpace.gutter}px 12px` }}>
              <div style={{
                fontFamily: fontMono, fontSize: 10, fontWeight: 800,
                letterSpacing: 1.6, textTransform: "uppercase", color: chrome.steel,
                marginBottom: 6,
              }}>
                Tonight
              </div>
              <h2 style={{
                margin: 0,
                fontFamily: fontDisplay,
                fontSize: "clamp(18px, 3.4vw, 22px)",
                fontWeight: 700,
                letterSpacing: -0.3,
                color: color.ink,
                lineHeight: 1.15,
              }}>
                What’s on
              </h2>
            </div>

            {airing?.show && !(activeShowId === airing.show.id && currentTrack) && (
              <div style={{ paddingBottom: 10 }}>
                <NowOnAirCard
                  airing={airing}
                  bumper={showBumper}
                  tuned={false}
                  onTuneIn={() => onTuneShow?.(airing.show)}
                />
              </div>
            )}

            {programGuide.length > 0 && (
              <ShowGuideRail
                guide={programGuide}
                activeShowId={activeShowId}
                onSelectShow={(show) => onTuneShow?.(show)}
                embedded
              />
            )}

            {countdown.length > 0 && (
              <CountdownRail
                entries={countdown}
                onPlayTrack={onPlayTrack}
                onTuneIn={onTuneCountdown}
                activeId={activeId}
                compact
              />
            )}

            <SceneSurfRail
              tracks={tracks}
              activeChannelId={sceneChannelsActiveId}
              onTuneChannel={onTuneSceneChannel}
              quiet
            />
          </section>
        )}

        {!catalogEmpty && !catalogError && !(airing?.show || programGuide.length > 0 || countdown.length > 0) && (
          <div style={riseStyle(0.06)}>
            <SceneSurfRail
              tracks={tracks}
              activeChannelId={sceneChannelsActiveId}
              onTuneChannel={onTuneSceneChannel}
              quiet
            />
          </div>
        )}

        {!catalogEmpty && !catalogError && onBrowse && (
          <div
            style={{
              marginTop: 8,
              paddingTop: 18,
              borderTop: `1px solid ${glass.borderSoft}`,
              background: `
                linear-gradient(180deg, rgba(184,192,204,0.12) 0%, transparent 40%)
              `,
              ...riseStyle(0.1),
            }}
          >
            <div style={{ padding: `0 ${homeSpace.gutter}px 6px` }}>
              <div style={{
                fontFamily: fontMono, fontSize: 10, fontWeight: 800,
                letterSpacing: 1.5, textTransform: "uppercase", color: chrome.steel,
              }}>
                More from the station
              </div>
            </div>

            <section
              aria-label="Station links"
              style={{
                padding: `8px ${homeSpace.gutter}px 10px`,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={onBrowse}
                aria-label="Browse the library"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: radius.xl,
                  border: `1px solid rgba(255,255,255,0.12)`,
                  background: `
                    linear-gradient(165deg, rgba(38,43,51,0.8) 0%, rgba(28,32,38,0.5) 100%)
                  `,
                  boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
                  backdropFilter: glass.blurSoft,
                  WebkitBackdropFilter: glass.blurSoft,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    fontFamily: fontMono,
                    color: chrome.steel,
                    marginBottom: 4,
                  }}>
                    Catalog
                  </div>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: fontDisplay,
                    letterSpacing: -0.1,
                    color: color.ink,
                    textTransform: "uppercase",
                  }}>
                    Browse the catalog
                  </div>
                </div>
                <span aria-hidden="true" style={{ color: chrome.steel, fontSize: 18 }}>→</span>
              </button>
            </section>
          </div>
        )}

        {!catalogError && !catalogEmpty && countdown.length === 0 && !airing?.show && (
          <div style={{ padding: `28px ${homeSpace.gutter}px 56px` }}>
            <div className="glass-surface" style={{ padding: "28px 22px", ...chromeFrame() }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fontDisplay, color: color.ink, marginBottom: 8, letterSpacing: -0.3, textTransform: "uppercase" }}>
                Nothing on the shelf
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: color.muted, lineHeight: 1.5, maxWidth: 280 }}>
                Add cuts to the catalog and they land here.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(HomeScreen);
