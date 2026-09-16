import { normalizeGenre } from "./genres";
import { buildAlbums } from "./catalog";
import { scoreTrackForRanking, tasteFromProfile } from "./ranking";
import { hashSeed } from "./hashSeed";

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
      return e <= 4 && ["R&B & Soul", "Jazz", "Classical"].includes(g);
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
 * One curated rail so the wall doesn't sprawl (Late booth retired).
 */
export function buildHomeCollections(tracks = []) {
  const singles = tracks.filter((t) => (t.duration || 0) <= 900);
  const candidates = [
    {
      id: "rediscovered",
      label: "Played before",
      story: "Cuts you’ve spun — worth another drop",
      tracks: rediscoveredTracks(singles),
    },
  ];
  return candidates.filter((c) => c.tracks.length > 0).slice(0, 1);
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

/** UTC calendar day key — stable daily rotation boundary. */
export function forYouDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export { hashSeed } from "./hashSeed";

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
 * Featured album releases for Home — real sleeves only, no Singles dump.
 * Ranked by play/like heat, then track count.
 */
export function featuredReleases(tracks = [], limit = 10) {
  return buildAlbums(tracks)
    .filter(
      (a) =>
        a.title !== "Singles & Unknown" &&
        !!a.coverTrack?.albumCover &&
        (a.count || 0) >= 2
    )
    .map((a) => {
      const heat = (a.tracks || []).reduce(
        (s, t) => s + (t.playCount || 0) + (t.likeCount || 0) * 2 + (t._signal?.pull || 0),
        0
      );
      return { ...a, heat };
    })
    .sort((a, b) => b.heat - a.heat || b.count - a.count || a.title.localeCompare(b.title))
    .slice(0, limit);
}

/** Cap Home scoring so a full-catalog swap doesn't stall the main thread. */
export const HOME_SCORE_CANDIDATE_CAP = 160;

function heatOf(track = {}) {
  return (Number(track.playCount) || 0) + (Number(track.likeCount) || 0) * 2;
}

/**
 * Keep likes / recents / in-taste cuts, then fill by heat.
 * Small pools pass through unchanged.
 */
export function homeScoreCandidates(
  pool = [],
  { recentTrackIds = [], preferredGenres = [], cap = HOME_SCORE_CANDIDATE_CAP } = {}
) {
  const limit = Math.max(12, Number(cap) || HOME_SCORE_CANDIDATE_CAP);
  if (!Array.isArray(pool) || pool.length <= limit) return pool;
  const recentSet = new Set(recentTrackIds || []);
  const preferredSet = new Set(
    (preferredGenres || []).map((g) => normalizeGenre(g)).filter(Boolean)
  );
  const must = [];
  const rest = [];
  for (const t of pool) {
    const genre = normalizeGenre(t.genre);
    if (t.liked || recentSet.has(t.id) || (genre && preferredSet.has(genre))) must.push(t);
    else rest.push(t);
  }
  if (must.length >= limit) return must.slice(0, limit);
  rest.sort((a, b) => heatOf(b) - heatOf(a) || String(a.id).localeCompare(String(b.id)));
  return must.concat(rest.slice(0, limit - must.length));
}

/**
 * Top recommended from listening history, with a human-readable reason per pick.
 * Uses likes, play counts, preferred genres / full taste bag, and optional recents.
 * Cold start with onboarding: ranking formula owns the slate (not global heat).
 * Falls back to a stable catalog sample when there is no history and no taste.
 * Daily rotation: `userKey` + `dayKey` jitter the order so each listener gets a
 * fresh Selected for you slate every calendar day without random flicker mid-day.
 * Returns { picks: [{ track, reason }], coldStart }.
 */
export function recommendedPicks(
  tracks = [],
  {
    preferredGenres = [],
    recentTrackIds = [],
    limit = 10,
    excludeIds = [],
    userKey = "",
    dayKey = forYouDayKey(),
    taste = null,
    channelHit = null,
    dislikeTaste = null,
  } = {}
) {
  const singles = singlesOnly(tracks);
  const exclude = new Set(excludeIds);
  const pool = homeScoreCandidates(
    singles.filter((t) => !exclude.has(t.id)),
    { recentTrackIds, preferredGenres, cap: HOME_SCORE_CANDIDATE_CAP }
  );
  const rotateSeed = hashSeed(`${userKey || "guest"}:${dayKey || forYouDayKey()}`);
  const tasteBag = tasteFromProfile({
    ...(taste || {}),
    genres: (taste?.genres?.length ? taste.genres : preferredGenres) || [],
  });

  const liked = pool.filter((t) => t.liked);
  const recentSet = new Set(recentTrackIds || []);
  const preferredSet = new Set(
    (tasteBag.genres || []).map((g) => normalizeGenre(g)).filter(Boolean)
  );
  const tasteGenres = new Set([
    ...liked.map((t) => normalizeGenre(t.genre)).filter(Boolean),
    ...preferredSet,
  ]);

  const hasOnboarding =
    preferredSet.size > 0 ||
    (tasteBag.channelIds || []).length > 0 ||
    (tasteBag.artistNames || []).length > 0 ||
    !!tasteBag.energyBand;
  const hasPersonal = liked.length > 0 || recentSet.size > 0;
  const hasHistory = hasPersonal || hasOnboarding;
  // Mute global chart heat when onboarding is the only signal.
  const onboardingOwned = !hasPersonal && hasOnboarding;
  // Explore copy: "Fresh picks" only when there is no taste and no history.
  const coldStart = !hasPersonal && !hasOnboarding;

  /** Deterministic shuffle — same user+day always yields the same slate. */
  const seededShuffle = (list, seed) => {
    const out = [...list];
    let s = seed >>> 0;
    for (let i = out.length - 1; i > 0; i -= 1) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const rotateDaily = (ranked) => {
    // Cold start: don't widen into the global dump — only shuffle the top matches.
    const window = onboardingOwned
      ? Math.min(ranked.length, limit)
      : Math.min(ranked.length, Math.max(limit * 3, limit));
    return seededShuffle(ranked.slice(0, window), rotateSeed).slice(0, limit);
  };

  if (!hasHistory) {
    const ranked = pool
      .slice()
      .sort((a, b) => {
        const heat = (b.playCount || 0) - (a.playCount || 0);
        if (heat !== 0) return heat;
        const pull = (b._signal?.pull || 0) - (a._signal?.pull || 0);
        if (pull !== 0) return pull;
        return String(a.id).localeCompare(String(b.id));
      })
      .map((t) => ({ track: t, reason: "Fresh pick" }));
    return { coldStart: true, picks: rotateDaily(ranked) };
  }

  const hitFn = typeof channelHit === "function" ? channelHit : () => false;

  const scored = pool
    .map((t) => {
      const genre = normalizeGenre(t.genre);
      const inTaste = tasteGenres.has(genre);
      const discovery = !t.liked && (t.playCount || 0) === 0 && inTaste;
      let score = scoreTrackForRanking(t, tasteBag, {
        coldStart: onboardingOwned,
        channelHit: hitFn(t),
        dislikeTaste,
        liked: !!t.liked,
        recent: recentSet.has(t.id),
      });
      if (!onboardingOwned) {
        if (t.liked) score += 8;
        if (recentSet.has(t.id)) score += 10;
        score += Math.min(12, (t.playCount || 0) * 1.5);
        score += (t._signal?.pull || 0) * 0.6;
        score += (t._signal?.grip || 0) * 0.4;
      } else {
        score += (t._signal?.grip || 0) * 0.15;
      }
      if (discovery) score += onboardingOwned ? 4 : 3;

      let reason;
      if (t.liked) reason = "Saved";
      else if (recentSet.has(t.id)) reason = "Recent";
      else if (hitFn(t) && onboardingOwned) reason = "Your station";
      else if (discovery) reason = genre || "New";
      else if (inTaste) reason = genre || null;
      else if ((t.playCount || 0) > 0) reason = null;
      else reason = null;

      return { track: t, reason, score };
    })
    .sort((a, b) => b.score - a.score || String(a.track.id).localeCompare(String(b.track.id)));

  // Hard-suppressed (score 0) stays off Made for you unless it would empty the rail.
  const audible = scored.filter((row) => row.score > 0);
  const ranked = audible.length ? audible : scored;

  return {
    coldStart,
    picks: rotateDaily(ranked).map(({ track, reason }) => ({
      track,
      reason: reason || (onboardingOwned ? "Made for you" : "For you"),
    })),
  };
}

/**
 * Top recommended tracks (no reasons) — thin wrapper over recommendedPicks.
 */
export function recommendedTracks(tracks = [], opts = {}) {
  return recommendedPicks(tracks, opts).picks.map((p) => p.track);
}
