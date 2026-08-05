import { trackMatchesScene } from "./scenes";
import { normalizeGenre } from "./genres";
import { countdownScore } from "./station";

/**
 * Scene surfing — restrained scene names under the broad genres.
 */

function singlesOnly(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900 && String(t.audioUrl || "").trim());
}

export const SCENE_CHANNELS = [
  {
    id: "ukg-block",
    title: "UK Garage",
    shortTitle: "UK Garage",
    tagline: "2-step and garage",
    accent: "#FF5C8A",
    scenes: ["uk-garage", "broken-beat"],
    genres: ["Electronic"],
    vibe: "UK Garage",
  },
  {
    id: "rap-city",
    title: "Rap & Grime",
    shortTitle: "Rap & Grime",
    tagline: "Hip-hop and UK grime",
    accent: "#FFB020",
    scenes: ["hip-hop", "grime"],
    genres: ["Hip-Hop"],
    vibe: "Rap & Grime",
  },
  {
    id: "techno-tunnel",
    title: "Techno",
    shortTitle: "Techno",
    tagline: "Techno and tech house",
    accent: "#5C8CFF",
    scenes: ["techno", "minimal", "tech-house", "industrial"],
    genres: ["Electronic"],
    vibe: "Techno",
  },
  {
    id: "bass-weight",
    title: "DnB & Jungle",
    shortTitle: "DnB & Jungle",
    tagline: "Drum & bass, jungle, dubstep",
    accent: "#2ED3A4",
    scenes: ["drum-and-bass", "jungle", "liquid", "dubstep", "breakbeat"],
    genres: ["Electronic"],
    vibe: "DnB & Jungle",
  },
  {
    id: "soul-continuum",
    title: "Soul & R&B",
    shortTitle: "Soul & R&B",
    tagline: "Soul, neo-soul, funk",
    accent: "#C45C3E",
    scenes: ["soul", "neo-soul", "funk", "rnb", "gospel"],
    genres: ["R&B & Soul"],
    vibe: "Soul & R&B",
  },
  {
    id: "alt-nation",
    title: "Rock & Alt",
    shortTitle: "Rock & Alt",
    tagline: "Rock, metal, left-field",
    accent: "#B07CFF",
    scenes: ["rock", "metal", "experimental"],
    genres: ["Rock", "Metal"],
    vibe: "Rock & Alt",
  },
  {
    id: "pop-crash",
    title: "Pop & Disco",
    shortTitle: "Pop & Disco",
    tagline: "Pop, disco, and house",
    accent: "#FF3B4E",
    scenes: ["disco", "house"],
    genres: ["Pop", "Latin"],
    vibe: "Pop & Disco",
  },
  {
    id: "afterhours-fog",
    title: "Ambient & Downtempo",
    shortTitle: "Ambient",
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
