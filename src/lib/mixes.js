/**
 * Mixtape Club — shareable mixes + monthly Community Mix.
 */

export const COMMUNITY_MIX_TITLE = "The Community Mix";

/** Calendar month key: "2026-09" */
export function monthKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return monthKey(new Date());
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatMonthLabel(key) {
  const match = String(key || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return "This month";
  const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function communityMixId(key = monthKey()) {
  return `community-${key}`;
}

/**
 * Build a mix document from a user playlist.
 */
export function buildMixFromPlaylist(playlist, {
  ownerUid,
  ownerName = "Member",
  visibility = "public",
  kind = "user",
  now = new Date(),
} = {}) {
  const id = playlist?.id || `mix_${Date.now()}`;
  const iso = (now instanceof Date ? now : new Date(now)).toISOString();
  return {
    id,
    title: String(playlist?.name || "Untitled Mix").trim() || "Untitled Mix",
    trackIds: [...(playlist?.trackIds || [])],
    ownerUid: ownerUid || null,
    ownerName: ownerName || "Member",
    visibility,
    kind,
    monthKey: kind === "community_monthly" ? monthKey(now) : null,
    featuredCurator: null,
    createdAt: iso,
    updatedAt: iso,
    sourcePlaylistId: playlist?.id || null,
  };
}

/**
 * Promote a user mix into this month's Community Mix.
 */
export function buildCommunityMix({
  title = COMMUNITY_MIX_TITLE,
  trackIds = [],
  curatorUid = null,
  curatorName = "Member",
  sourceMixId = null,
  now = new Date(),
} = {}) {
  const key = monthKey(now);
  const iso = (now instanceof Date ? now : new Date(now)).toISOString();
  return {
    id: communityMixId(key),
    title: title || COMMUNITY_MIX_TITLE,
    trackIds: [...trackIds],
    ownerUid: curatorUid,
    ownerName: curatorName,
    visibility: "public",
    kind: "community_monthly",
    monthKey: key,
    featuredCurator: {
      uid: curatorUid,
      displayName: curatorName,
    },
    createdAt: iso,
    updatedAt: iso,
    sourceMixId: sourceMixId || null,
  };
}

/** Library playlist stub so every member "gets" the Community Mix. */
export function communityPlaylistStub(mix) {
  if (!mix?.id) return null;
  return {
    id: mix.id,
    name: mix.title || COMMUNITY_MIX_TITLE,
    trackIds: [...(mix.trackIds || [])],
    isCommunity: true,
    curatorName: mix.featuredCurator?.displayName || mix.ownerName || null,
    monthKey: mix.monthKey || null,
  };
}

export function isCommunityPlaylist(pl) {
  return !!(pl?.isCommunity || String(pl?.id || "").startsWith("community-"));
}
