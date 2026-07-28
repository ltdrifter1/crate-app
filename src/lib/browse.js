/**
 * Genre → Scene browse helpers for Search.
 * Canonical lanes open culture scenes; selecting filters a real pool.
 */

import { CANONICAL_GENRES, normalizeGenre } from "./genres";
import { SCENES, trackMatchesScene } from "./scenes";

/** Short editorial lines for the 10 store lanes. */
export const GENRE_STORIES = {
  Rock: "Guitars, dirt, and the long road.",
  "R&B": "Voice craft — quiet storm to gloss.",
  Country: "Songs that travel by porch and highway.",
  "Hip-Hop": "Sample archaeology and voice as drum.",
  House: "Four-to-the-floor pressure and its cousins.",
  "Drum and Bass": "Break science at velocity.",
  Soul: "Gospel heat, funk pocket, late-night warmth.",
  Jazz: "Improvisation as architecture.",
  Classical: "Composed weight — hall to cinema.",
  Metal: "Distortion as cathedral.",
};

export function genreStory(lane) {
  return GENRE_STORIES[lane] || "A listening lane.";
}

/** Scenes that store under a canonical genre lane. */
export function scenesForLane(lane) {
  if (!lane) return [];
  return SCENES.filter((s) => s.lane === lane);
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
