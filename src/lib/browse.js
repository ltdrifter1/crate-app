/**
 * Genre → Scene browse helpers for Search.
 * Canonical lanes open culture scenes; selecting filters a real pool.
 */

import { CANONICAL_GENRES, normalizeGenre } from "./genres";
import { SCENES, trackMatchesScene } from "./scenes";

/** Short editorial lines for the 11 taste lanes. */
export const GENRE_STORIES = {
  Electronic: "Four-to-the-floor, breaks, and the wider dance floor.",
  "Hip-Hop": "Sample archaeology and voice as drum.",
  "R&B & Soul": "Gospel heat, funk pocket, quiet storm to gloss.",
  Pop: "Hooks built for the room — local and global.",
  Rock: "Guitars, dirt, and the long road.",
  Metal: "Distortion as cathedral.",
  Jazz: "Improvisation as architecture.",
  Classical: "Composed weight — hall to cinema.",
  "Country & Folk": "Cuts that travel by porch and highway.",
  Reggae: "One drop, dub space, sound-system heat.",
  Latin: "Clave, montuno, and diaspora floor music.",
};

export function genreStory(lane) {
  return GENRE_STORIES[lane] || "A listening lane.";
}

/** Scenes that store under a canonical genre lane. */
export function scenesForLane(lane) {
  if (!lane) return [];
  const g = normalizeGenre(lane) || lane;
  return SCENES.filter((s) => s.lane === g);
}

function playable(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900);
}

/** Tracks matching a coarse genre lane. */
export function tracksForGenreLane(tracks = [], lane) {
  const g = normalizeGenre(lane) || lane;
  if (!g) return [];
  return playable(tracks).filter((t) => normalizeGenre(t.genre) === g);
}

/** Tracks matching a culture scene. */
export function tracksForScenePool(tracks = [], sceneId) {
  if (!sceneId) return [];
  return playable(tracks).filter((t) => trackMatchesScene(t, sceneId));
}

/** Genre rows with scene + track counts for browse empty state. */
export function genreBrowseRows(tracks = []) {
  return CANONICAL_GENRES.map((lane) => {
    const scenes = scenesForLane(lane);
    const pool = tracksForGenreLane(tracks, lane);
    return {
      lane,
      story: genreStory(lane),
      sceneCount: scenes.length,
      trackCount: pool.length,
      scenes,
    };
  }).filter((row) => row.trackCount > 0 || tracks.length === 0);
}
