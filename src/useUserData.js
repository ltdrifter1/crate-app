// src/useUserData.js
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { recordListeningEvent } from "./lib/listeningApi";

function userRef() {
  return doc(db, "users", auth.currentUser.uid);
}

// ── TOGGLE A LIKED TRACK ──────────────────────────────────────────────────
export async function toggleLike(trackId, currentlyLiked) {
  await updateDoc(userRef(), {
    likedTracks: currentlyLiked
      ? arrayRemove(trackId)
      : arrayUnion(trackId),
  });
}

/** Persist dislike taste + the disliked track id list. */
export async function saveDislikeTaste(dislikeTaste, dislikedTracks) {
  const payload = {};
  if (dislikeTaste != null) payload.dislikeTaste = dislikeTaste;
  if (Array.isArray(dislikedTracks)) payload.dislikedTracks = dislikedTracks;
  if (!Object.keys(payload).length) return;
  await updateDoc(userRef(), payload);
}

/**
 * Record a play — prefers Cloud Function (trusted meter + playCount).
 * Falls back to recentTracks-only if the function is unreachable.
 */
export async function recordPlay(trackId, currentRecentTracks = []) {
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
      await updateDoc(userRef(), { recentTracks: updated });
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

// ── SAVE GENRE PREFERENCES ────────────────────────────────────────────────
export async function saveGenres(genres) {
  await updateDoc(userRef(), { genres });
}

// ── SAVE TASTE PROFILE (genres + adventurous + depth) ─────────────────────
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
  await updateDoc(userRef(), payload);
}

// ── COMPLETE ONBOARDING ───────────────────────────────────────────────────
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
  await updateDoc(userRef(), payload);
}

// ── MONTHLY PICK CHOICE ───────────────────────────────────────────────────
export async function saveMonthlyChoice(monthKey, choice) {
  const key = String(monthKey || "");
  if (!key || !choice) return;
  await updateDoc(userRef(), {
    [`monthlyChoices.${key}`]: choice,
  });
}

/**
 * @deprecated Prefer recordListeningEvent / recordPlay — meter is server-owned.
 * Kept as a no-op-friendly helper for older call sites.
 */
export async function savePlayMeter({ playsDayKey, playsToday }) {
  // Intentionally unused: firestore rules block client meter writes.
  // Optimistic UI still updates local profile from recordPlay results.
  void playsDayKey;
  void playsToday;
}

// ── SAVE SETTINGS ─────────────────────────────────────────────────────────
export async function saveSettings(settings) {
  await updateDoc(userRef(), { settings });
}

/** Persist first-login tour seen + guide version (auto-show once per version). */
export async function saveFeatureGuideSeen({
  tutorialSeen = true,
  featureGuideVersion = null,
} = {}) {
  const payload = {};
  if (tutorialSeen != null) payload.tutorialSeen = tutorialSeen;
  if (featureGuideVersion != null) payload.featureGuideVersion = featureGuideVersion;
  if (!Object.keys(payload).length) return;
  await updateDoc(userRef(), payload);
}
