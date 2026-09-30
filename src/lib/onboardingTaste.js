/**
 * Onboarding → taste bag.
 *
 * Channel taps, artist faces, and this-or-that energy/stretch compile into
 * the same user-doc fields radio / Home / set builder already read.
 */

import { migratePreferredGenres } from "./genres";
import { normalizeTasteProfile, TASTE_AXIS_DEFAULT } from "./tasteProfile";
import {
  SCENE_CHANNELS,
  getSceneChannel,
  trackMatchesChannel,
  buildSceneChannelPool,
} from "./sceneChannels";
import { scoreTrackForRanking } from "./ranking";

export const ONBOARDING_MAX_CHANNELS = 3;
export const ONBOARDING_MIN_CHANNELS = 1;
export const ONBOARDING_ARTIST_LIMIT = 8;
export const ONBOARDING_VERSION = 2;

/** Genre seeds when a station's `genres` array is empty or incomplete. */
export const CHANNEL_GENRE_SEEDS = {
  "y2k-dance": ["Electronic", "Pop"],
  "psychedelic-rock": ["Rock"],
  "variety-mix": [],
  "local-pnw": [],
  house: ["Electronic"],
  techno: ["Electronic"],
  "electronic-underground": ["Electronic"],
  "uk-garage": ["Electronic"],
  dubstep: ["Electronic"],
  "drum-and-bass": ["Electronic"],
  shoegaze: ["Rock"],
  metal: ["Metal"],
  punk: ["Rock"],
  "country-folk": ["Country & Folk"],
  downtempo: ["Electronic"],
};

export const ENERGY_CHOICES = [
  {
    id: "late",
    label: "Late booth",
    hint: "Soft edges. Long blends.",
    energyBand: "soft",
    vibe: "chill",
    depth: 68,
    artChannelId: "downtempo",
  },
  {
    id: "peak",
    label: "Peak floor",
    hint: "Push it. Lights on.",
    energyBand: "peak",
    vibe: "night",
    depth: 28,
    artChannelId: "y2k-dance",
  },
];

export const STRETCH_CHOICES = [
  {
    id: "close",
    label: "Stick close",
    hint: "Play what already feels like me.",
    adventurous: 22,
    artChannelId: "local-pnw",
  },
  {
    id: "open",
    label: "Open it up",
    hint: "Leave a door cracked.",
    adventurous: 78,
    artChannelId: "variety-mix",
  },
];

export function onboardingChannels() {
  return SCENE_CHANNELS.slice();
}

export function genresFromChannelIds(channelIds = []) {
  const genres = [];
  const seen = new Set();
  (channelIds || []).forEach((id) => {
    const channel = getSceneChannel(id);
    const seeds = [
      ...(channel?.genres || []),
      ...(CHANNEL_GENRE_SEEDS[id] || []),
    ];
    seeds.forEach((g) => {
      if (!g || seen.has(g)) return;
      seen.add(g);
      genres.push(g);
    });
  });
  return migratePreferredGenres(genres);
}

export function trackHitsPreferredChannels(track, channelIds = []) {
  if (!track || !channelIds?.length) return false;
  return channelIds.some((id) => {
    const channel = getSceneChannel(id);
    return channel ? trackMatchesChannel(track, channel) : false;
  });
}

/**
 * Compile tuner taps into the persisted taste profile.
 * Skip still seeds Variety Mix so first play is a station, not a catalog dump.
 */
export function compileOnboardingTaste({
  channelIds = [],
  artistNames = [],
  energyId = null,
  stretchId = null,
  skip = false,
} = {}) {
  const energy = ENERGY_CHOICES.find((c) => c.id === energyId) || null;
  const stretch = STRETCH_CHOICES.find((c) => c.id === stretchId) || null;
  const picked = skip
    ? ["variety-mix"]
    : uniqueIds(channelIds).slice(0, ONBOARDING_MAX_CHANNELS);
  const seedChannelId = picked[0] || "variety-mix";
  const genres = skip ? [] : genresFromChannelIds(picked);

  return normalizeTasteProfile({
    genres,
    adventurous: stretch?.adventurous ?? TASTE_AXIS_DEFAULT,
    depth: energy?.depth ?? TASTE_AXIS_DEFAULT,
    channelIds: picked,
    artistNames: skip ? [] : uniqueIds(artistNames),
    energyBand: energy?.energyBand || null,
    vibe: energy?.vibe || null,
    seedChannelId,
  });
}

function uniqueIds(list = []) {
  const out = [];
  const seen = new Set();
  (Array.isArray(list) ? list : []).forEach((v) => {
    const s = String(v || "").trim();
    if (!s || seen.has(s.toLowerCase())) return;
    seen.add(s.toLowerCase());
    out.push(s);
  });
  return out;
}

/**
 * Rank Channel Surfing dials for this listener.
 * Picked stations lead; genre overlap next; showcase is a small pin, not a lock.
 */
export function rankChannelsForTaste(channels = SCENE_CHANNELS, taste = {}) {
  const profile = normalizeTasteProfile(taste);
  const picked = new Set(profile.channelIds);
  const genres = new Set(profile.genres);
  const scored = (channels || []).map((channel, index) => {
    let score = 0;
    if (picked.has(channel.id)) score += 24;
    if (profile.seedChannelId && channel.id === profile.seedChannelId) score += 8;
    const overlap = (channel.genres || []).filter((g) => genres.has(g)).length;
    score += overlap * 6;
    if (channel.showcase) score += 2;
    if (profile.energyBand === "peak" && ["y2k-dance", "house", "techno", "uk-garage", "dubstep", "drum-and-bass", "metal", "punk"].includes(channel.id)) {
      score += 3;
    }
    if (profile.energyBand === "soft" && ["downtempo", "country-folk"].includes(channel.id)) {
      score += 3;
    }
    return { channel, score, index };
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((row) => row.channel);
}

/** Artist faces from the stations you just tuned — album sleeves, not a form. */
export function artistFacesForChannels(tracks = [], channelIds = [], limit = ONBOARDING_ARTIST_LIMIT) {
  const ids = uniqueIds(channelIds);
  if (!ids.length) return [];
  const byArtist = new Map();
  ids.forEach((id) => {
    const channel = getSceneChannel(id);
    const pool = channel ? buildSceneChannelPool(tracks, channel) : [];
    pool.forEach((t) => {
      const name = String(t?.artist || "").trim();
      if (!name || /^unknown$/i.test(name)) return;
      const key = name.toLowerCase();
      const prev = byArtist.get(key);
      const heat = (t.playCount || 0) + (t.likeCount || 0) * 2;
      if (!prev || heat > prev.heat || (!prev.cover && t.albumCover)) {
        byArtist.set(key, {
          name,
          cover: t.albumCover || prev?.cover || "",
          heat,
          trackId: t.id,
        });
      }
    });
  });
  return [...byArtist.values()]
    .sort((a, b) => b.heat - a.heat || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function scoreOnboardingTrack(track, taste = {}, extras = {}) {
  const profile = normalizeTasteProfile(taste);
  return scoreTrackForRanking(track, profile, {
    ...extras,
    channelHit:
      extras.channelHit != null
        ? extras.channelHit
        : trackHitsPreferredChannels(track, profile.channelIds),
  });
}
