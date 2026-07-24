import { normalizeGenre } from "./genres";
import { displaySceneLabel, inferScene } from "./scenes";
import { getFloorPhase } from "./club";

/**
 * Human-readable "why this track" copy — trusted friend, not opaque algo.
 */

const HOUR_WORDS = [
  [5, 8, "early light"],
  [9, 11, "mid-morning"],
  [12, 16, "afternoon"],
  [17, 20, "evening warm-up"],
  [21, 23, "peak hours"],
  [0, 4, "after hours"],
];

function hourPhrase(date = new Date()) {
  const h = date.getHours();
  for (const [a, b, phrase] of HOUR_WORDS) {
    if (a <= b && h >= a && h <= b) return phrase;
    if (a > b && (h >= a || h <= b)) return phrase;
  }
  return "this hour";
}

/** Story for a track in a Room context. */
export function storyForRoomTrack(track, room) {
  if (!track) return "";
  const parts = [];
  if (room?.label) parts.push(`From ${room.label}`);
  if (track.liked) parts.push("one of yours");
  else if ((track.playCount || 0) === 0) parts.push("fresh ink");
  else if ((track._signal?.pull || 0) >= 6) parts.push("keeps pulling you back");
  else if ((track.playCount || 0) < 2) parts.push("quiet favourite");
  const scene = displaySceneLabel(track);
  if (scene && parts.length < 2) parts.push(scene);
  return parts.join(" · ") || "In this room";
}

/** Dig / floor lead blurb. */
export function digLeadStory(roomLabel, floor, track) {
  const phase = floor?.blurb || getFloorPhase().blurb;
  const bits = [];
  if (roomLabel) bits.push(roomLabel);
  bits.push(hourPhrase());
  if (track?.liked) bits.push("saved by you");
  else if (track && (track.playCount || 0) === 0) bits.push("unheard here");
  const scene = displaySceneLabel(track);
  if (scene) bits.push(scene);
  return {
    eyebrow: bits.join(" · "),
    body: phase,
  };
}

/** Explain a radio / engine pick. */
export function explainPick(track, { room, signalLabel, preferredGenres = [] } = {}) {
  if (!track) return "The floor is choosing";
  const reasons = [];
  if (room?.label) reasons.push(`fits ${room.label}`);
  const scene = inferScene(track);
  if (scene) reasons.push(`${scene.label} lane`);
  if (signalLabel) reasons.push(`session feels like ${signalLabel}`);
  const g = normalizeGenre(track.genre);
  if (g && preferredGenres.includes(g)) reasons.push(`${g} you keep near`);
  if (track.camelot) reasons.push(`key ${track.camelot}`);
  if (track.energy != null) reasons.push(`energy ${track.energy}`);
  if (!reasons.length) {
    return `Picked for ${hourPhrase()} — like a clerk handing you a record`;
  }
  return reasons.slice(0, 3).join(" · ");
}

/** Search empty-state curiosity prompts. */
export const SEARCH_PROMPTS = [
  { q: "UK Garage", label: "UK Garage", hint: "2-step & skip" },
  { q: "Techno", label: "Techno", hint: "Detroit → Berlin" },
  { q: "Ambient", label: "Ambient", hint: "Atmosphere as form" },
  { q: "Jungle", label: "Jungle", hint: "Chopped breaks" },
  { q: "e7", label: "Key e7", hint: "Harmonic neighbours" },
  { q: "120bpm", label: "120 BPM", hint: "Walking tempo" },
  { q: "Neo-Soul", label: "Neo-Soul", hint: "Quiet storm crates" },
  { q: "Amapiano", label: "Amapiano", hint: "Log drum Sundays" },
];

/** Hypno / similar framing. */
export function hypnoStory(sourceTrack) {
  if (!sourceTrack) return "Sounds in the same pocket";
  const scene = displaySceneLabel(sourceTrack);
  return scene
    ? `Sounds like “${sourceTrack.title}” — still in ${scene}`
    : `Sounds like “${sourceTrack.title}” — same grip, different door`;
}
