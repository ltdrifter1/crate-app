// src/useUserData.js
import { loadFirebaseSdk } from "./lib/firebaseSdk";
import { recordListeningEvent } from "./lib/listeningApi";

async function userRef() {
  const { auth, db, fsMod } = await loadFirebaseSdk();
  if (!auth.currentUser) return null;
  return { ref: fsMod.doc(db, "users", auth.currentUser.uid), fsMod, auth };
}

export async function toggleLike(trackId, currentlyLiked) {
  const ctx = await userRef();
  if (!ctx) return;
  await ctx.fsMod.updateDoc(ctx.ref, {
    likedTracks: currentlyLiked
      ? ctx.fsMod.arrayRemove(trackId)
      : ctx.fsMod.arrayUnion(trackId),
  });
}

export async function saveDislikeTaste(dislikeTaste, dislikedTracks) {
  const payload = {};
  if (dislikeTaste != null) payload.dislikeTaste = dislikeTaste;
  if (Array.isArray(dislikedTracks)) payload.dislikedTracks = dislikedTracks;
  if (!Object.keys(payload).length) return;
  const ctx = await userRef();
  if (!ctx) return;
  await ctx.fsMod.updateDoc(ctx.ref, payload);
}

export async function recordPlay(trackId, currentRecentTracks = []) {
  const { auth } = await loadFirebaseSdk();
  if (!auth.currentUser) {
    return { allowed: true, offline: true };
  }

  try {
    const data = await recordListeningEvent(trackId);
    return data;
  } catch (err) {
    console.warn("recordListeningEvent failed; recentTracks-only fallback", err);
    const entry = { trackId, playedAt: new Date().toISOString() };
    const updated = [
      entry,
      ...currentRecentTracks.filter((r) => r.trackId !== trackId),
    ].slice(0, 50);
    try {
      const ctx = await userRef();
      if (ctx) await ctx.fsMod.updateDoc(ctx.ref, { recentTracks: updated });
    } catch {
      /* ignore */
    }
    return {
      allowed: true,
      fallback: true,
      recentTracks: updated,
      error: err?.message || "function_unavailable",
    };
  }
}

export async function saveGenres(genres) {
  const ctx = await userRef();
  if (!ctx) return;
  await ctx.fsMod.updateDoc(ctx.ref, { genres });
}

export async function saveTasteProfile({
  genres = null,
  adventurous = null,
  depth = null,
  channelIds = null,
  artistNames = null,
  energyBand = null,
  vibe = null,
  seedChannelId = null,
} = {}) {
  const payload = {};
  if (genres != null) payload.genres = genres;
  if (adventurous != null) payload.adventurous = adventurous;
  if (depth != null) payload.depth = depth;
  if (channelIds != null) payload.channelIds = channelIds;
  if (artistNames != null) payload.artistNames = artistNames;
  if (energyBand != null) payload.energyBand = energyBand;
  if (vibe != null) payload.vibe = vibe;
  if (seedChannelId != null) payload.seedChannelId = seedChannelId;
  if (!Object.keys(payload).length) return;
  const ctx = await userRef();
  if (!ctx) return;
  await ctx.fsMod.updateDoc(ctx.ref, payload);
}

export async function completeOnboarding({
  homeRooms = [],
  genres = null,
  adventurous = null,
  depth = null,
  channelIds = null,
  artistNames = null,
  energyBand = null,
  vibe = null,
  seedChannelId = null,
} = {}) {
  const payload = {
    onboarded: true,
    homeRooms,
  };
  if (genres) payload.genres = genres;
  if (adventurous != null) payload.adventurous = adventurous;
  if (depth != null) payload.depth = depth;
  if (channelIds) payload.channelIds = channelIds;
  if (artistNames) payload.artistNames = artistNames;
  if (energyBand != null) payload.energyBand = energyBand;
  if (vibe != null) payload.vibe = vibe;
  if (seedChannelId != null) payload.seedChannelId = seedChannelId;
  payload.onboardingVersion = 2;
  const ctx = await userRef();
  if (!ctx) return;
  await ctx.fsMod.updateDoc(ctx.ref, payload);
}

export async function saveMonthlyChoice(monthKey, choice) {
  const key = String(monthKey || "");
  if (!key || !choice) return;
  const ctx = await userRef();
  if (!ctx) return;
  await ctx.fsMod.updateDoc(ctx.ref, {
    [`monthlyChoices.${key}`]: choice,
  });
}

export async function savePlayMeter({ playsDayKey, playsToday }) {
  void playsDayKey;
  void playsToday;
}

export async function saveSettings(settings) {
  const ctx = await userRef();
  if (!ctx) return;
  await ctx.fsMod.updateDoc(ctx.ref, { settings });
}

export async function saveFeatureGuideSeen({
  tutorialSeen = true,
  featureGuideVersion = null,
} = {}) {
  const payload = {};
  if (tutorialSeen != null) payload.tutorialSeen = tutorialSeen;
  if (featureGuideVersion != null) payload.featureGuideVersion = featureGuideVersion;
  if (!Object.keys(payload).length) return;
  const ctx = await userRef();
  if (!ctx) return;
  await ctx.fsMod.updateDoc(ctx.ref, payload);
}
