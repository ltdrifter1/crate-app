// src/useUserData.js
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { auth, db } from "./firebase";

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

// ── RECORD A PLAY ─────────────────────────────────────────────────────────
// 1. Updates the user's personal recent plays list
// 2. Increments the global playCount on the track (powers Top Tracks)
export async function recordPlay(trackId, currentRecentTracks = []) {
  const entry = { trackId, playedAt: new Date().toISOString() };
  const updated = [
    entry,
    ...currentRecentTracks.filter(r => r.trackId !== trackId),
  ].slice(0, 50);

  // User's personal history
  await updateDoc(userRef(), { recentTracks: updated });

  // Global play count on the track document — used for Top Tracks across all users
  try {
    await updateDoc(doc(db, "tracks", trackId), { playCount: increment(1) });
  } catch (e) {
    // Non-critical — don't break playback if this fails
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

// ── FREE PLAY METER ───────────────────────────────────────────────────────
export async function savePlayMeter({ playsDayKey, playsToday }) {
  await updateDoc(userRef(), { playsDayKey, playsToday });
}

// ── SAVE SETTINGS ─────────────────────────────────────────────────────────
export async function saveSettings(settings) {
  await updateDoc(userRef(), { settings });
}
