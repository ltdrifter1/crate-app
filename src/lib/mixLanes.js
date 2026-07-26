import { normalizeGenre } from "./genres";

/** Home radio mix lanes — pick a vibe before you play. */
export const MIX_LANES = [
  { id: "main", label: "Main", blurb: "The full floor — balanced and open." },
  { id: "mellow", label: "Mellow", blurb: "Soft energy, late hours, easy breath." },
  { id: "electronic", label: "Electronic", blurb: "House, bass, and pulse-forward picks." },
  { id: "rock", label: "Rock", blurb: "Guitars, drive, and weight." },
  { id: "global", label: "Global", blurb: "Soul, hip-hop, jazz, and roots worldwide." },
];

export function mixLaneById(id) {
  return MIX_LANES.find((m) => m.id === id) || MIX_LANES[0];
}

const MELLOW_GENRES = new Set(["Jazz", "Soul", "Classical"]);
const ELECTRONIC_GENRES = new Set(["House", "Drum and Bass"]);
const ROCK_GENRES = new Set(["Rock", "Metal"]);
const GLOBAL_GENRES = new Set(["Hip-Hop", "R&B", "Soul", "Jazz", "Country"]);

function playableSingles(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900);
}

/**
 * Filter catalog for a home mix lane. Falls back to all playable singles if empty.
 */
export function tracksForMixLane(tracks = [], laneId = "main") {
  const singles = playableSingles(tracks);
  if (!singles.length) return [];

  let pool = singles;
  switch (laneId) {
    case "mellow":
      pool = singles.filter((t) => {
        const g = normalizeGenre(t.genre);
        return (t.energy || 5) <= 5 || MELLOW_GENRES.has(g);
      });
      break;
    case "electronic":
      pool = singles.filter((t) => {
        const g = normalizeGenre(t.genre);
        return ELECTRONIC_GENRES.has(g) || (t.energy || 5) >= 7;
      });
      break;
    case "rock":
      pool = singles.filter((t) => ROCK_GENRES.has(normalizeGenre(t.genre)));
      break;
    case "global":
      pool = singles.filter((t) => GLOBAL_GENRES.has(normalizeGenre(t.genre)));
      break;
    case "main":
    default:
      pool = singles;
      break;
  }

  return pool.length ? pool : singles;
}
