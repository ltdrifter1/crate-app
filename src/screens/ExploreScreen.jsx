import { useMemo, memo } from "react";
import {
  homeSpace,
  motion,
  sectionSubtitle,
  sectionTitle,
  y2k,
} from "../theme";
import { featuredReleases, recommendedPicks } from "../lib/homeCollections";
import { useCurrentTrack } from "../usePlayerTransport";
import MusicSection, { Rail } from "../components/home/MusicSection";
import TrackCard from "../components/home/TrackCard";
import ReleaseCard from "../components/home/ReleaseCard";
import CardContainer from "../components/home/CardContainer";

/**
 * Explore — dig shelf: Discover, Featured releases, Recently played.
 * Home stays broadcast-first.
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
  const activeId = currentTrack?.id;
  const featuredSize = homeSpace.tileFeatured;

  const discover = useMemo(
    () =>
      recommendedPicks(tracks, {
        preferredGenres,
        recentTrackIds,
        userKey,
        excludeIds: recentTrackIds.slice(0, 8),
        limit: 24,
      }),
    [tracks, preferredGenres, recentTrackIds, userKey]
  );

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
    discover.picks.length > 0 || releases.length > 0 || recentlyPlayed.length > 0;

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
        <h1 style={{ ...sectionTitle, fontSize: 28, letterSpacing: -0.55 }}>
          Explore
        </h1>
        <p style={{ ...sectionSubtitle, maxWidth: 360, whiteSpace: "normal" }}>
          Discover new music, featured sleeves, and what you spun last.
        </p>
      </header>

      {discover.picks.length > 0 && (
        <MusicSection
          title="Discover new music"
          subtitle={discover.coldStart ? "Fresh off the dial" : "Selected for you"}
          accent={y2k.chromeBright}
          first
          delay={0.04}
          action={onOpenSearch ? { label: "Dig deeper", onClick: onOpenSearch } : null}
        >
          <Rail gap={16}>
            {discover.picks.map(({ track, reason }) => (
              <TrackCard
                key={track.id}
                track={track}
                reason={reason}
                active={activeId === track.id}
                onClick={() => onPlayTrack?.(track, discover.picks.map((p) => p.track))}
              />
            ))}
          </Rail>
        </MusicSection>
      )}

      {releases.length > 0 && (
        <MusicSection
          title="Featured releases"
          subtitle="Albums worth the needle"
          accent={y2k.chromeBright}
          first={discover.picks.length === 0}
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
          first={discover.picks.length === 0 && releases.length === 0}
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
              border: "1px solid rgba(255,255,255,0.12)",
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
