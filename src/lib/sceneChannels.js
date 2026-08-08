import { trackMatchesScene } from "./scenes";
import { normalizeGenre } from "./genres";
import { countdownScore } from "./station";

/**
 * Scene surfing — dial channels under the broad genres.
 * Numbers map to on-air CH-bugs (CH-02 UK GARAGE …).
 */

function singlesOnly(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900 && String(t.audioUrl || "").trim());
}

export const SCENE_CHANNELS = [
  {
    id: "ukg-block",
    num: 2,
    title: "UK Garage",
    shortTitle: "UK Garage",
    dialSlug: "UK GARAGE",
    tagline: "2-step and garage",
    accent: "#9AA3B0",
    scenes: ["uk-garage", "broken-beat"],
    genres: ["Electronic"],
    vibe: "UK Garage",
  },
  {
    id: "rap-city",
    num: 3,
    title: "Rap & Grime",
    shortTitle: "Rap City",
    dialSlug: "RAP CITY",
    tagline: "Hip-hop and UK grime",
    accent: "#C5CAD3",
    scenes: ["hip-hop", "grime"],
    genres: ["Hip-Hop"],
    vibe: "Rap & Grime",
  },
  {
    id: "techno-tunnel",
    num: 4,
    title: "Techno",
    shortTitle: "Techno",
    dialSlug: "TECHNO",
    tagline: "Techno and tech house",
    accent: "#6B7380",
    scenes: ["techno", "minimal", "tech-house", "industrial"],
    genres: ["Electronic"],
    vibe: "Techno",
  },
  {
    id: "bass-weight",
    num: 5,
    title: "DnB & Jungle",
    shortTitle: "Bass Weight",
    dialSlug: "BASS WT",
    tagline: "Drum & bass, jungle, dubstep",
    accent: "#7A8494",
    scenes: ["drum-and-bass", "jungle", "liquid", "dubstep", "breakbeat"],
    genres: ["Electronic"],
    vibe: "DnB & Jungle",
  },
  {
    id: "soul-continuum",
    num: 6,
    title: "Soul & R&B",
    shortTitle: "Soul Cont.",
    dialSlug: "SOUL",
    tagline: "Soul, neo-soul, funk",
    accent: "#8A919C",
    scenes: ["soul", "neo-soul", "funk", "rnb", "gospel"],
    genres: ["R&B & Soul"],
    vibe: "Soul & R&B",
  },
  {
    id: "alt-nation",
    num: 7,
    title: "Rock & Alt",
    shortTitle: "Alt Nation",
    dialSlug: "ALT NAT",
    tagline: "Rock, metal, left-field",
    accent: "#16181E",
    scenes: ["rock", "metal", "experimental"],
    genres: ["Rock", "Metal"],
    vibe: "Rock & Alt",
  },
  {
    id: "pop-crash",
    num: 8,
    title: "Pop & Disco",
    shortTitle: "Pop Crash",
    dialSlug: "POP CRASH",
    tagline: "Pop, disco, and house",
    accent: "#8B939F",
    scenes: ["disco", "house"],
    genres: ["Pop", "Latin"],
    vibe: "Pop & Disco",
  },
  {
    id: "afterhours-fog",
    num: 9,
    title: "Ambient & Downtempo",
    shortTitle: "Afterhours",
    dialSlug: "AFTER HRS",
    tagline: "Ambient, downtempo, deep house",
    accent: "#7A91A4",
    scenes: ["ambient", "downtempo", "deep-house"],
    genres: ["Electronic", "Jazz"],
    vibe: "Ambient & Downtempo",
  },
];

export function getSceneChannel(id) {
  return SCENE_CHANNELS.find((c) => c.id === id) || null;
}

function matchesChannel(track, channel) {
  if (!track || !channel) return false;
  if ((channel.scenes || []).some((id) => trackMatchesScene(track, id))) return true;
  const g = normalizeGenre(track.genre);
  return (channel.genres || []).includes(g);
}

export function buildSceneChannelPool(tracks = [], channel) {
  const singles = singlesOnly(tracks);
  if (!channel) return singles;
  const hits = singles.filter((t) => matchesChannel(t, channel));
  const ranked = (hits.length ? hits : singles)
    .slice()
    .sort((a, b) => countdownScore(b) - countdownScore(a));
  return ranked;
}

/** Channels that actually have catalog depth right now. */
export function availableSceneChannels(tracks = [], minTracks = 3) {
  return SCENE_CHANNELS.map((channel) => {
    const pool = buildSceneChannelPool(tracks, channel);
    const direct = singlesOnly(tracks).filter((t) => matchesChannel(t, channel));
    return {
      ...channel,
      count: direct.length,
      ready: direct.length >= minTracks || pool.length >= minTracks,
    };
  }).filter((c) => c.ready);
}

/**
 * Distinct album-cover URLs for a channel tile mosaic (up to `limit`).
 * Prefers direct channel matches, then the ranked pool.
 */
export function channelCoverUrls(tracks = [], channel, limit = 4) {
  const max = Math.max(1, limit);
  const seen = new Set();
  const out = [];
  const push = (list) => {
    for (const t of list || []) {
      const url = t?.albumCover;
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
      if (out.length >= max) return true;
    }
    return false;
  };
  const direct = singlesOnly(tracks).filter((t) => matchesChannel(t, channel));
  if (push(direct)) return out;
  push(buildSceneChannelPool(tracks, channel));
  return out;
}
