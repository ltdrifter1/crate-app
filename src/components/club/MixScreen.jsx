/**
 * Mix detail — Mixtape Club shared playlist / Community Mix listener.
 */
import {
  font, fontDisplay, fontMono, color, radius, glass,
  BTN_PRIMARY, BTN_SECONDARY, homeSpace,
} from "../../theme";
import { formatMonthLabel, isCommunityPlaylist, COMMUNITY_MIX_TITLE } from "../../lib/mixes";

export default function MixScreen({
  mix,
  tracks = [],
  loading = false,
  notFound = false,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onBack,
  onShare,
  onSaveToLibrary,
  TrackRow,
  playlistCtx,
  onLike,
}) {
  const mixTracks = (mix?.trackIds || [])
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean);
  const isCommunity = mix?.kind === "community_monthly" || isCommunityPlaylist(mix);
  const curator = mix?.featuredCurator?.displayName || mix?.ownerName || null;
  const activeId = currentTrack?.id;

  if (loading) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", color: color.muted }}>
        Pulling the plate…
      </div>
    );
  }

  if (notFound || !mix) {
    return (
      <div style={{ padding: "32px 20px" }}>
        <button type="button" onClick={onBack} style={backBtn}>‹ Back</button>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: fontDisplay, color: color.ink, marginTop: 20 }}>
          Mix not found
        </div>
        <div style={{ fontSize: 15, color: color.muted, marginTop: 8 }}>
          This mixtape may be private or no longer shared.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 36px" }}>
      <div style={{ padding: `20px ${homeSpace.gutter}px 0` }}>
        <button type="button" onClick={onBack} style={backBtn}>‹ Back</button>

        <div style={{
          marginTop: 18,
          padding: "22px 20px",
          borderRadius: radius.lg,
          background: `
            linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(242,244,247,0.88) 100%)
          `,
          border: `1px solid ${glass.border}`,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 650,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: color.muted,
            fontFamily: fontMono,
            marginBottom: 10,
          }}>
            {isCommunity ? "Mixtape Club · Community" : "Mixtape Club"}
          </div>
          <div style={{
            fontSize: "clamp(26px, 6vw, 34px)",
            fontWeight: 700,
            letterSpacing: -0.9,
            fontFamily: fontDisplay,
            color: color.ink,
            lineHeight: 1.1,
            marginBottom: 10,
          }}>
            {mix.title || COMMUNITY_MIX_TITLE}
          </div>
          <div style={{ fontSize: 14, color: color.body, lineHeight: 1.45 }}>
            {isCommunity && mix.monthKey
              ? `${formatMonthLabel(mix.monthKey)} · curated by ${curator || "a member"}`
              : `Shared by ${curator || "a member"}`}
            {" · "}
            {mixTracks.length} cut{mixTracks.length === 1 ? "" : "s"}
          </div>
          {isCommunity && (
            <div style={{ fontSize: 13, color: color.muted, marginTop: 10, lineHeight: 1.45 }}>
              Featured curator — club stamp this month.
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          {mixTracks.length > 0 && onPlayTrack && (
            <button
              type="button"
              onClick={() => onPlayTrack(mixTracks[0], mixTracks)}
              style={{ ...BTN_PRIMARY, borderRadius: radius.md, flex: "1 1 140px" }}
            >
              Play
            </button>
          )}
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              style={{ ...BTN_SECONDARY, borderRadius: radius.md, flex: "1 1 120px" }}
            >
              Share
            </button>
          )}
          {onSaveToLibrary && !isCommunity && (
            <button
              type="button"
              onClick={onSaveToLibrary}
              style={{ ...BTN_SECONDARY, borderRadius: radius.md, flex: "1 1 140px" }}
            >
              Save to Library
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 22, padding: `0 ${homeSpace.gutter - 6}px` }}>
        {mixTracks.length === 0 ? (
          <div style={{ fontSize: 15, color: color.faint, padding: "28px 8px", textAlign: "center" }}>
            No playable tracks in this mix yet.
          </div>
        ) : (
          mixTracks.map((t) => (
            <TrackRow
              key={t.id}
              track={t}
              onPlay={() => onPlayTrack?.(t, mixTracks)}
              active={activeId === t.id}
              isPlaying={isPlaying}
              onLike={onLike}
              playlistCtx={playlistCtx}
            />
          ))
        )}
      </div>
    </div>
  );
}

const backBtn = {
  background: "none",
  border: "none",
  color: color.accent,
  fontSize: 17,
  cursor: "pointer",
  fontWeight: 400,
  fontFamily: font,
  padding: 0,
};
