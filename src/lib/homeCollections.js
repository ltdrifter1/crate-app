import { normalizeGenre } from "./genres";
import { populateAllRooms } from "./rooms";

/**
 * Smart collections for Personal Home — record wall, not file folders.
 */

export function rediscoveredTracks(tracks = [], limit = 12) {
  return tracks
    .filter((t) => (t.duration || 0) <= 900)
    .filter((t) => {
      const plays = t.playCount || 0;
      const pull = t._signal?.pull || 0;
      const liked = !!t.liked;
      // Heard before, not recently dominating — rediscovery candidates
      return (liked || pull >= 5) && plays >= 1 && plays <= 4;
    })
    .sort((a, b) => (b._signal?.pull || 0) - (a._signal?.pull || 0))
    .slice(0, limit);
}

export function softEvening(tracks = [], limit = 12) {
  return tracks
    .filter((t) => (t.duration || 0) <= 900)
    .filter((t) => {
      const e = t.energy || 5;
      const g = normalizeGenre(t.genre);
      return e <= 4 && ["Soul", "Jazz", "R&B", "Classical"].includes(g);
    })
    .slice(0, limit);
}

export function highPressure(tracks = [], limit = 12) {
  return tracks
    .filter((t) => (t.duration || 0) <= 900)
    .filter((t) => (t.energy || 5) >= 7)
    .sort((a, b) => (b.energy || 0) - (a.energy || 0))
    .slice(0, limit);
}

export function wishlistish(tracks = [], limit = 12) {
  // Unplayed likes + zero-play gems with grip — stand-in until true wishlist
  return tracks
    .filter((t) => (t.duration || 0) <= 900)
    .filter((t) => t.liked && (t.playCount || 0) === 0)
    .slice(0, limit);
}

/** Rooms the user "lives in" — preferred from onboarding or inferred. */
export function livedInRooms(tracks = [], homeRoomIds = [], limit = 6) {
  const all = populateAllRooms(tracks);
  if (homeRoomIds?.length) {
    const set = new Set(homeRoomIds);
    const preferred = all.filter((r) => set.has(r.id));
    const rest = all.filter((r) => !set.has(r.id));
    return [...preferred, ...rest].slice(0, limit);
  }
  // Infer from listening: rooms with most liked/played overlap
  return [...all]
    .sort((a, b) => {
      const score = (r) =>
        r.tracks.reduce(
          (s, t) => s + (t.liked ? 3 : 0) + Math.min(t.playCount || 0, 5),
          0
        );
      return score(b) - score(a);
    })
    .slice(0, limit);
}

export function buildHomeCollections(tracks = []) {
  const singles = tracks.filter((t) => (t.duration || 0) <= 900);
  const saved = singles.filter((t) => t.liked);
  return [
    {
      id: "saved",
      label: "Saved",
      story: "The records you keep close",
      tracks: saved.slice(0, 16),
    },
    {
      id: "rediscovered",
      label: "Rediscovered",
      story: "Heard before — waiting again",
      tracks: rediscoveredTracks(singles),
    },
    {
      id: "soft-evening",
      label: "Soft evening",
      story: "Low light, unhurried",
      tracks: softEvening(singles),
    },
    {
      id: "high-pressure",
      label: "High pressure",
      story: "When the room needs weight",
      tracks: highPressure(singles),
    },
    {
      id: "unplayed-saves",
      label: "Still unplayed",
      story: "Liked, not yet lived with",
      tracks: wishlistish(singles),
    },
  ].filter((c) => c.tracks.length > 0);
}
