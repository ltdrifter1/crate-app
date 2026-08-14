import { useMemo, memo } from "react";
import {
  color,
  fontDisplay,
  homeSpace,
  motion,
  sectionSubtitle,
  sectionTitle,
  y2k,
} from "../theme";
import { featuredReleases, recommendedPicks, trendingTracks } from "../lib/homeCollections";
import { useCurrentTrack, useIsPlaying } from "../usePlayerTransport";
import MusicSection, { Rail } from "../components/home/MusicSection";
import TrackCard from "../components/home/TrackCard";
import ReleaseCard from "../components/home/ReleaseCard";
import CardContainer from "../components/home/CardContainer";
import CoverFlow from "../components/listen/CoverFlow";

/**
 * Explore — Selected for you first, then Featured releases + Recently played.
 */
function ExploreScreen({
  tracks = [],
  preferredGenres = [],
  recentTrackIds = [],
  userKey = "",
  onPlayTrack = null,
  onOpenSearch = null,
  onOpenAlbum = null,
}) {
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const activeId = currentTrack?.id;
  const featuredSize = homeSpace.tileFeatured;
  const dayKey = new Date().toISOString().slice(0, 10);

  const { picks: recommended, coldStart } = useMemo(
    () =>
      recommendedPicks(tracks, {
        preferredGenres,
        recentTrackIds,
        limit: 25,
        excludeIds: [],
        userKey,
        dayKey,
      }),
    [tracks, preferredGenres, recentTrackIds, userKey, dayKey]
  );

  const trending = useMemo(() => trendingTracks(tracks, 25), [tracks]);

  const forYouTracks = useMemo(() => {
    const seen = new Set();
    const rail = [];
    const pushUnique = (list) => {
      for (const t of list) {
        if (!t?.id || seen.has(t.id)) continue;
        seen.add(t.id);
        rail.push(t);
        if (rail.length >= 25) return;
      }
    };
    pushUnique(recommended.map((p) => p.track));
    pushUnique(trending);
    pushUnique(
      [...new Set(recentTrackIds)]
        .map((id) => tracks.find((t) => t.id === id))
        .filter(Boolean)
    );
    pushUnique(tracks);
    return rail;
  }, [recommended, trending, recentTrackIds, tracks]);

  const forYouReasons = useMemo(() => {
    const map = {};
    for (const p of recommended) {
      if (p?.track?.id && p.reason) map[p.track.id] = p.reason;
    }
    return map;
  }, [recommended]);

  const releases = useMemo(() => featuredReleases(tracks, 10), [tracks]);

  const recentlyPlayed = useMemo(() => {
    if (!recentTrackIds.length) return [];
    const byId = new Map(tracks.map((t) => [t.id, t]));
    const seen = new Set();
    const out = [];
    for (const id of recentTrackIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      const t = byId.get(id);
      if (t) out.push(t);
      if (out.length >= 12) break;
    }
    return out;
  }, [recentTrackIds, tracks]);

  const hasAny =
    forYouTracks.length > 0 || releases.length > 0 || recentlyPlayed.length > 0;

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
      <header
        style={{
          padding: `${homeSpace.sectionGapFirst}px ${homeSpace.gutter}px 2px`,
          animation: `rise 0.45s ${motion.ease} both`,
        }}
      >
        <h1 style={{ ...sectionTitle, fontSize: 24, letterSpacing: -0.4, fontWeight: 650 }}>
          Explore
        </h1>
        <p style={{ ...sectionSubtitle, maxWidth: 380, whiteSpace: "normal" }}>
          Picks for you, featured sleeves, and what you spun last.
        </p>
      </header>

      {forYouTracks.length > 0 && (
        <MusicSection
          title={coldStart ? "Fresh picks" : "Selected for you"}
          subtitle={coldStart ? "Start anywhere — the dial learns fast" : "Tuned to your taste"}
          accent={y2k.chromeBright}
          first
          delay={0.04}
          action={onOpenSearch ? { label: "Search", onClick: onOpenSearch } : null}
        >
          <div style={{ margin: `0 -${homeSpace.gutter}px` }}>
            <CoverFlow
              tracks={forYouTracks}
              reasons={forYouReasons}
              onPlayTrack={(t) => onPlayTrack?.(t, forYouTracks)}
              activeId={activeId}
              isPlaying={isPlaying}
              size={200}
              limit={25}
            />
          </div>
        </MusicSection>
      )}

      {releases.length > 0 && (
        <MusicSection
          title="Featured releases"
          subtitle="Albums worth the needle"
          accent={y2k.chromeBright}
          first={forYouTracks.length === 0}
          delay={0.08}
        >
          <Rail gap={16}>
            {releases.map((album) => (
              <ReleaseCard
                key={album.slug}
                album={album}
                size={featuredSize}
                onClick={() => {
                  if (onOpenAlbum) onOpenAlbum(album.slug);
                  else if (album.coverTrack) onPlayTrack?.(album.coverTrack, album.tracks);
                }}
              />
            ))}
          </Rail>
        </MusicSection>
      )}

      {recentlyPlayed.length > 0 && (
        <MusicSection
          title="Recently played"
          subtitle="Back on the deck"
          accent={y2k.chromeMid}
          first={forYouTracks.length === 0 && releases.length === 0}
          delay={0.12}
        >
          <Rail gap={16}>
            {recentlyPlayed.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                active={activeId === track.id}
                onClick={() => onPlayTrack?.(track, recentlyPlayed)}
              />
            ))}
          </Rail>
        </MusicSection>
      )}

      {!hasAny && (
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
                fontSize: 16,
                fontWeight: 650,
                letterSpacing: -0.2,
                color: y2k.offWhite,
                marginBottom: 6,
              }}
            >
              Nothing to dig yet
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: color.muted, lineHeight: 1.5 }}>
              When the catalog lands, fresh picks and sleeves show up here.
            </div>
          </CardContainer>
        </div>
      )}
    </div>
  );
}

export default memo(ExploreScreen);
