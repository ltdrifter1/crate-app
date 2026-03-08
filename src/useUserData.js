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

// ── SAVE SETTINGS ─────────────────────────────────────────────────────────
export async function saveSettings(settings) {
  await updateDoc(userRef(), { settings });
}
