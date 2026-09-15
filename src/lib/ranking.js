/**
 * Ranking formula (v2 — onboarding-aware)
 *
 * One score for Home shelves, Channel Surfing first-cut, radio picks,
 * monthly slates, and set-builder defaults. Higher is better.
 *
 *   score =
 *     GENRE_IN  * (1 − adventurous·0.55)     if track is in preferred genres
 *   + GENRE_OUT * adventurous                 if out of taste (stretch)
 *   + CHANNEL                                 if track matches a tuned station
 *   + ENERGY_BAND                             if energy sits in the onboard band
 *   + VIBE                                    if energy/bpm fit the vibe pick
 *   + DEPTH                                   well-known ↔ deep cuts
 *   + ARTIST                                  tapped artist during onboarding
 *   + COLD_START                              extra genre/channel when no history
 *   + LISTEN_TRUST                            personal like / recent play
 *   × DISLIKE_WEIGHT                          1 → 0.35 → 0.12 → 0 (hard suppress)
 *
 * Cold start (no likes / personal recents, but onboarding exists):
 * global play-heat is muted so a new account is not a generic dump.
 * Adventurous also widens the 95/5 in-taste blend (see inRatioForTaste).
 *
 * Weights are documented here — change RANKING_WEIGHTS, not call sites.
 */

import { normalizeGenre } from "./genres";
import {
  clampTasteAxis,
  normalizeTasteProfile,
  TASTE_AXIS_DEFAULT,
} from "./tasteProfile";
import {
  ENERGY_BANDS,
  energyBandId,
  dislikeWeightForTrack,
} from "./dislikeTaste";
import { SESSION_PROFILES } from "./engineSession";

export const RANKING_WEIGHTS = {
  genreIn: 12,
  genreOut: 10,
  channel: 9,
  energy: 5,
  vibe: 3,
  depth: 8,
  artist: 8,
  coldStart: 7,
  listenTrust: 5,
  midEnergy: 1.5,
};

/** Familiar (0) → 98% in-taste. Adventurous (100) → 62% in-taste. */
export function inRatioForTaste(adventurous = TASTE_AXIS_DEFAULT) {
  const adv = clampTasteAxis(adventurous) / 100;
  return Math.max(0.62, Math.min(0.98, 0.98 - adv * 0.36));
}

export function tasteFromProfile(profile = {}) {
  return normalizeTasteProfile(profile);
}

export function isColdStartTaste(taste = {}, { recentTrackIds = [], likedCount = 0 } = {}) {
  const recents = Array.isArray(recentTrackIds) ? recentTrackIds.filter(Boolean) : [];
  return recents.length === 0 && (Number(likedCount) || 0) === 0;
}

function popularityScore(track) {
  const plays = Number(track?.playCount) || 0;
  const likes = Number(track?.likeCount) || 0;
  return plays + likes * 2;
}

function artistKey(name) {
  return String(name || "").trim().toLowerCase();
}

function vibeEnergyTarget(vibe) {
  const phases = SESSION_PROFILES[vibe]?.phases;
  if (!phases?.length) return null;
  const peak = phases.reduce((m, p) => (p.e > m ? p.e : m), phases[0].e);
  return peak;
}

function energyBandWindow(bandId) {
  return ENERGY_BANDS.find((b) => b.id === bandId) || null;
}

/**
 * Score a track against the member's taste bag.
 * `channelHit` is precomputed by the caller (Channel Surfing membership).
 */
export function scoreTrackForRanking(track, taste = {}, extras = {}) {
  const profile = normalizeTasteProfile(taste);
  const preferred = new Set(
    profile.genres.map((g) => normalizeGenre(g) || g).filter(Boolean)
  );
  const genre = normalizeGenre(track?.genre) || "";
  const inTaste = preferred.size === 0 ? true : preferred.has(genre);
  const adv = profile.adventurous / 100;
  const depth = profile.depth / 100;
  const popNorm = Math.min(1, popularityScore(track) / 40);
  const coldStart = !!extras.coldStart;
  const W = RANKING_WEIGHTS;

  let score = 0;

  if (preferred.size === 0) {
    score += 4;
  } else if (inTaste) {
    score += W.genreIn * (1 - adv * 0.55);
    if (coldStart) score += W.coldStart;
  } else {
    score += W.genreOut * (adv * 0.95);
  }

  if (extras.channelHit) {
    score += W.channel;
    if (coldStart) score += W.coldStart * 0.6;
  }

  const band = profile.energyBand || extras.energyBand || null;
  if (band) {
    const window = energyBandWindow(band);
    const energy = Number(track?.energy);
    if (window && Number.isFinite(energy)) {
      const inBand = energy >= window.min && energy < window.max;
      const adjacent =
        energy >= window.min - 1.5 && energy < window.max + 1.5;
      if (inBand) score += W.energy;
      else if (adjacent) score += W.energy * 0.35;
      else if (coldStart) score -= W.energy * 0.4;
    }
  } else {
    const energy = Number(track?.energy);
    if (Number.isFinite(energy)) {
      const mid = 1 - Math.abs(energy - 5.5) / 5.5;
      score += mid * W.midEnergy;
    }
  }

  const vibe = profile.vibe || extras.vibe || null;
  const vibeTarget = vibeEnergyTarget(vibe);
  if (vibeTarget != null) {
    const energy = Number(track?.energy) || 5;
    score += W.vibe * (1 - Math.min(1, Math.abs(energy - vibeTarget) / 6));
  }

  score += (1 - depth) * popNorm * W.depth;
  score += depth * (1 - popNorm) * W.depth;
  if (coldStart) {
    // Mute community heat so onboarding, not global charts, owns first session.
    score -= popNorm * W.depth * 0.65;
  }

  const artists = new Set((profile.artistNames || []).map(artistKey).filter(Boolean));
  if (artists.size && artists.has(artistKey(track?.artist))) {
    score += W.artist;
  }

  if (extras.liked || track?.liked) score += W.listenTrust;
  if (extras.recent) score += W.listenTrust * 0.8;

  if (!track?.liked && (track?.playCount || 0) === 0 && inTaste) {
    score += coldStart ? 2.4 : 1.2;
  }

  const dislikeTaste = extras.dislikeTaste || null;
  if (dislikeTaste) {
    const dw = dislikeWeightForTrack(track, dislikeTaste, {
      allowHard: extras.allowHard !== false,
    });
    score *= dw;
  }

  return score;
}

/** Default set-builder vibe + optional genre from onboarding. */
export function defaultSetPrefs(taste = {}) {
  const profile = normalizeTasteProfile(taste);
  let vibe = profile.vibe && SESSION_PROFILES[profile.vibe] ? profile.vibe : null;
  if (!vibe) {
    const band = profile.energyBand;
    if (band === "peak") vibe = "night";
    else if (band === "lift") vibe = "predrinks";
    else if (band === "soft") vibe = "chill";
    else vibe = "drive";
  }
  const genre = profile.genres.length === 1 ? profile.genres[0] : null;
  return { vibe, genre, genres: profile.genres };
}

/** Soft energy window for radio when cold-start energy band is set. */
export function energyWindowForTaste(taste = {}, fallback = [1, 10], { coldStart = false } = {}) {
  const band = normalizeTasteProfile(taste).energyBand;
  if (!band || !coldStart) return fallback;
  const window = energyBandWindow(band);
  if (!window) return fallback;
  const min = Math.max(1, Math.floor(window.min));
  const max = Math.min(10, Math.ceil(window.max));
  return [min, Math.max(min + 1, max)];
}
