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
} = {}) {
  const payload = {};
  if (genres != null) payload.genres = genres;
  if (adventurous != null) payload.adventurous = adventurous;
  if (depth != null) payload.depth = depth;
  if (!Object.keys(payload).length) return;
  await updateDoc(userRef(), payload);
}

// ── COMPLETE ONBOARDING ───────────────────────────────────────────────────
export async function completeOnboarding({
  homeRooms = [],
  genres = null,
  adventurous = null,
  depth = null,
} = {}) {
  const payload = {
    onboarded: true,
    homeRooms,
  };
  if (genres) payload.genres = genres;
  if (adventurous != null) payload.adventurous = adventurous;
  if (depth != null) payload.depth = depth;
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
