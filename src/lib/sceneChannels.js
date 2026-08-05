import { trackMatchesScene } from "./scenes";
import { normalizeGenre } from "./genres";
import { countdownScore } from "./station";

/**
 * Scene channels — simple style pickers (UK Garage, Hip-Hop, Techno…).
 */

function singlesOnly(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900 && String(t.audioUrl || "").trim());
}

export const SCENE_CHANNELS = [
  {
    id: "ukg-block",
    title: "UK Garage",
    shortTitle: "UK Garage",
    tagline: "2-step and garage cuts",
    accent: "#FF5C8A",
    scenes: ["uk-garage", "broken-beat"],
    genres: ["Electronic"],
    vibe: "UK Garage",
  },
  {
    id: "rap-city",
    title: "Hip-Hop",
    shortTitle: "Hip-Hop",
    tagline: "Rap and hip-hop",
    accent: "#FFB020",
    scenes: ["hip-hop", "grime"],
    genres: ["Hip-Hop"],
    vibe: "Hip-Hop",
  },
  {
    id: "techno-tunnel",
    title: "Techno",
    shortTitle: "Techno",
    tagline: "Techno and club electronics",
    accent: "#5C8CFF",
    scenes: ["techno", "minimal", "tech-house", "industrial"],
    genres: ["Electronic"],
    vibe: "Techno",
  },
  {
    id: "bass-weight",
    title: "Bass",
    shortTitle: "Bass",
    tagline: "DnB, jungle, and bass music",
    accent: "#2ED3A4",
    scenes: ["drum-and-bass", "jungle", "liquid", "dubstep", "breakbeat"],
    genres: ["Electronic"],
    vibe: "Bass",
  },
  {
    id: "soul-continuum",
    title: "R&B and Soul",
    shortTitle: "R&B / Soul",
    tagline: "Soul, funk, and R&B",
    accent: "#C45C3E",
    scenes: ["soul", "neo-soul", "funk", "rnb", "gospel"],
    genres: ["R&B & Soul"],
    vibe: "R&B and Soul",
  },
  {
    id: "alt-nation",
    title: "Rock",
    shortTitle: "Rock",
    tagline: "Rock and alternative",
    accent: "#B07CFF",
    scenes: ["rock", "metal", "experimental"],
    genres: ["Rock", "Metal"],
    vibe: "Rock",
  },
  {
    id: "pop-crash",
    title: "Pop",
    shortTitle: "Pop",
    tagline: "Pop and dance hits",
    accent: "#FF3B4E",
    scenes: ["disco", "house"],
    genres: ["Pop", "Latin"],
    vibe: "Pop",
  },
  {
    id: "afterhours-fog",
    title: "Chill",
    shortTitle: "Chill",
    tagline: "Ambient and downtempo",
    accent: "#7A91A4",
    scenes: ["ambient", "downtempo", "deep-house"],
    genres: ["Electronic", "Jazz"],
    vibe: "Chill",
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
