import { normalizeGenre } from "./genres";

/**
 * Smart collections for Personal Home — record wall, not file folders.
 * Keep shelves few: Saved lives as its own Home section; collections stay quiet.
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


/**
 * Quiet home shelves — Saved is rendered separately on Home.
 * Cap at two curated rails so the wall doesn't sprawl.
 */
export function buildHomeCollections(tracks = []) {
  const singles = tracks.filter((t) => (t.duration || 0) <= 900);
  const candidates = [
    {
      id: "rediscovered",
      label: "Played before",
      story: "Songs you’ve heard — worth another listen",
      tracks: rediscoveredTracks(singles),
    },
    {
      id: "soft-evening",
      label: "Easy listening",
      story: "Calm, low-energy tracks",
      tracks: softEvening(singles),
    },
  ];
  return candidates.filter((c) => c.tracks.length > 0).slice(0, 2);
}

/** Saved shelf for Personal Home. */
export function savedTracks(tracks = [], limit = 24) {
  return tracks
    .filter((t) => (t.duration || 0) <= 900 && t.liked)
    .slice(0, limit);
}

function singlesOnly(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900);
}

/** Fisher–Yates shuffle — copy, never mutate. */
function shuffleCopy(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Top trending — global play heat, then likes, then signal pull.
 */
export function trendingTracks(tracks = [], limit = 10) {
  return singlesOnly(tracks)
    .slice()
    .sort((a, b) => {
      const plays = (b.playCount || 0) - (a.playCount || 0);
      if (plays !== 0) return plays;
      const likes = (b.likeCount || 0) - (a.likeCount || 0);
      if (likes !== 0) return likes;
      return (b._signal?.pull || 0) - (a._signal?.pull || 0);
    })
    .slice(0, limit);
}

/**
 * Top recommended from listening history.
 * Uses likes, play counts, preferred genres, and optional recent track ids.
 * Falls back to a shuffled sample when there is no history.
 */
export function recommendedTracks(
  tracks = [],
  { preferredGenres = [], recentTrackIds = [], limit = 10, excludeIds = [] } = {}
) {
  const singles = singlesOnly(tracks);
  const exclude = new Set(excludeIds);
  const pool = singles.filter((t) => !exclude.has(t.id));

  const liked = pool.filter((t) => t.liked);
  const played = pool.filter((t) => (t.playCount || 0) > 0);
  const recentSet = new Set(recentTrackIds || []);
  const preferredSet = new Set(
    (preferredGenres || []).map((g) => normalizeGenre(g)).filter(Boolean)
  );
  const tasteGenres = new Set([
    ...liked.map((t) => normalizeGenre(t.genre)).filter(Boolean),
    ...preferredSet,
  ]);

  const hasHistory =
    liked.length > 0 ||
    played.length > 0 ||
    recentSet.size > 0 ||
    preferredSet.size > 0;

  if (!hasHistory) {
    return shuffleCopy(pool).slice(0, limit);
  }

  const scored = pool
    .map((t) => {
      let score = 0;
      const genre = normalizeGenre(t.genre);
      if (t.liked) score += 8;
      if (recentSet.has(t.id)) score += 10;
      if (tasteGenres.has(genre)) score += 6;
      if (preferredSet.has(genre)) score += 4;
      score += Math.min(12, (t.playCount || 0) * 1.5);
      score += (t._signal?.pull || 0) * 0.6;
      score += (t._signal?.grip || 0) * 0.4;
      // Prefer unplayed-but-on-taste for discovery
      if (!t.liked && (t.playCount || 0) === 0 && tasteGenres.has(genre)) score += 3;
      return { t, score };
    })
    .sort((a, b) => b.score - a.score || Math.random() - 0.5);

  return scored.slice(0, limit).map((s) => s.t);
}
