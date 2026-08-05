import { trackMatchesScene } from "./scenes";
import { normalizeGenre } from "./genres";
import { countdownScore } from "./station";

/**
 * Scene surfing — MTV/MuchMusic-style specialty channels.
 * Named blocks you flip between like cable.
 */

function singlesOnly(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900 && String(t.audioUrl || "").trim());
}

export const SCENE_CHANNELS = [
  {
    id: "ukg-block",
    title: "UKG Block",
    shortTitle: "UKG",
    tagline: "2-step, late bus, pirate heat",
    accent: "#FF5C8A",
    scenes: ["uk-garage", "broken-beat"],
    genres: ["Electronic"],
    vibe: "MuchMusic late — shuffle & chrome",
  },
  {
    id: "rap-city",
    title: "Rap City",
    shortTitle: "Rap City",
    tagline: "Bars, bounce, and countdown heat",
    accent: "#FFB020",
    scenes: ["hip-hop", "grime"],
    genres: ["Hip-Hop"],
    vibe: "Appointment rap hour",
  },
  {
    id: "techno-tunnel",
    title: "Techno Tunnel",
    shortTitle: "Techno",
    tagline: "Concrete pressure · no vocals needed",
    accent: "#5C8CFF",
    scenes: ["techno", "minimal", "tech-house", "industrial"],
    genres: ["Electronic"],
    vibe: "Berlin-via-cable",
  },
  {
    id: "bass-weight",
    title: "Bass Weight",
    shortTitle: "Bass",
    tagline: "DnB, jungle, half-time gravity",
    accent: "#2ED3A4",
    scenes: ["drum-and-bass", "jungle", "liquid", "dubstep", "breakbeat"],
    genres: ["Electronic"],
    vibe: "Pirate frequency",
  },
  {
    id: "soul-continuum",
    title: "Soul Continuum",
    shortTitle: "Soul",
    tagline: "Neo-soul, funk pocket, late R&B",
    accent: "#C45C3E",
    scenes: ["soul", "neo-soul", "funk", "rnb", "gospel"],
    genres: ["R&B & Soul"],
    vibe: "Afterglow hour",
  },
  {
    id: "alt-nation",
    title: "Alt Nation",
    shortTitle: "Alt",
    tagline: "Guitars, edges, left-of-dial",
    accent: "#B07CFF",
    scenes: ["rock", "metal", "experimental"],
    genres: ["Rock", "Metal"],
    vibe: "120 Minutes energy",
  },
  {
    id: "pop-crash",
    title: "Pop Crash",
    shortTitle: "Pop",
    tagline: "Chrome hooks · TRL sugar",
    accent: "#FF3B4E",
    scenes: ["disco", "house"],
    genres: ["Pop", "Latin"],
    vibe: "Total Request adjacent",
  },
  {
    id: "afterhours-fog",
    title: "Afterhours Fog",
    shortTitle: "Fog",
    tagline: "Ambient, downtempo, soft close",
    accent: "#7A91A4",
    scenes: ["ambient", "downtempo", "deep-house"],
    genres: ["Electronic", "Jazz"],
    vibe: "Lights up / never left",
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
