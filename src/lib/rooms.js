// ROOMS — living destinations built around music.
// Extends the club floor model into culture, place, mood, and community.

import { CLUB_ROOMS, getFloorPhase, roomForFloorPhase } from "./club";
import { normalizeGenre } from "./genres";
import { allSceneRooms, trackMatchesScene, inferScene } from "./scenes";

export { CLUB_ROOMS, getFloorPhase, roomForFloorPhase };

/** Room kinds — how a Room earns its identity. */
export const ROOM_KINDS = [
  "time",
  "mood",
  "genre",
  "city",
  "scene",
  "label",
  "artist",
  "community",
  "season",
  "memory",
];

/**
 * Cultural + atmospheric Rooms beyond the nightclub floor.
 * Filters are soft invitations — curiosity over precision.
 */
export const CULTURE_ROOMS = [
  {
    id: "sunday-morning",
    label: "Sunday Morning",
    kind: "mood",
    desc: "Slow light. Soft edges. No rush.",
    story: "The room that opens when the week exhales.",
    atmosphere: "dawn-haze",
    filter: (t) => {
      const e = t.energy || 5;
      const g = normalizeGenre(t.genre);
      return e <= 4 && ["Soul", "Jazz", "R&B", "Classical"].includes(g);
    },
  },
  {
    id: "after-hours",
    label: "After Hours",
    kind: "time",
    desc: "When the city thins and the speakers stay warm.",
    story: "Borrowed from closing time — deep, patient, unlocked.",
    atmosphere: "night-fog",
    filter: (t) => {
      const e = t.energy || 5;
      return e >= 2 && e <= 5;
    },
  },
  {
    id: "hidden-gems",
    label: "Hidden Gems",
    kind: "community",
    desc: "Quiet favourites the algorithm would bury.",
    story: "Tracks with grip but low play count — crate diggers' finds.",
    atmosphere: "vault",
    filter: (t) => {
      const plays = t.playCount || 0;
      const liked = !!t.liked;
      const grip = t._signal?.grip || 5;
      return (liked || grip >= 6) && plays < 3;
    },
  },
  {
    id: "new-this-week",
    label: "New This Week",
    kind: "community",
    desc: "Fresh ink on the chalkboard.",
    story: "Recently added or rarely heard — the front table at the shop.",
    atmosphere: "shopfront",
    filter: (t) => (t.playCount || 0) === 0 || !!(t.addedAt && Date.now() - t.addedAt < 7 * 86400000),
  },
  {
    id: "warehouse",
    label: "Warehouse",
    kind: "scene",
    desc: "Concrete, pressure, long blends.",
    story: "A room that remembers freight elevators and 4am load-outs.",
    atmosphere: "concrete",
    filter: (t) => {
      const e = t.energy || 5;
      const g = normalizeGenre(t.genre);
      return e >= 6 && (
        ["House", "Drum and Bass", "Hip-Hop"].includes(g) ||
        trackMatchesScene(t, "techno") ||
        trackMatchesScene(t, "tech-house")
      );
    },
  },
  {
    id: "jazz-cafe",
    label: "Jazz Cafe",
    kind: "scene",
    desc: "Low light, liner notes, second cups.",
    story: "Where conversation and melody share the same table.",
    atmosphere: "amber-lamp",
    filter: (t) => {
      const g = normalizeGenre(t.genre);
      return g === "Jazz" || (g === "Soul" && (t.energy || 5) <= 5);
    },
  },
  {
    id: "rain",
    label: "Rain",
    kind: "mood",
    desc: "Window glass. Soft percussion. Distance.",
    story: "Weather as curator — music for grey afternoons.",
    atmosphere: "rain-glass",
    filter: (t) => {
      const e = t.energy || 5;
      const g = normalizeGenre(t.genre);
      return e <= 5 && ["Soul", "Jazz", "R&B", "Classical", "Rock"].includes(g);
    },
  },
  {
    id: "summer-2026",
    label: "Summer 2026",
    kind: "season",
    desc: "Heat shimmer and open windows.",
    story: "A seasonal crate — bright edges, long evenings.",
    atmosphere: "heat-haze",
    filter: (t) => {
      const e = t.energy || 5;
      const g = normalizeGenre(t.genre);
      return e >= 5 && ["House", "Soul", "R&B", "Hip-Hop", "Rock"].includes(g);
    },
  },
  {
    id: "uk-garage",
    label: "UK Garage",
    kind: "scene",
    desc: "Skip, shuffle, late bus home.",
    story: "A scene room — not a playlist tagged garage.",
    atmosphere: "neon-damp",
    filter: (t) => trackMatchesScene(t, "uk-garage"),
  },
  {
    id: "detroit",
    label: "Detroit",
    kind: "city",
    desc: "Motor City pulse — machines with soul.",
    story: "A city as Room: techno lineage filtered through the house floor.",
    atmosphere: "factory-glow",
    filter: (t) => {
      const scene = inferScene(t);
      const a = String(t.artist || "").toLowerCase();
      const al = String(t.album || "").toLowerCase();
      return (
        scene?.id === "techno" ||
        a.includes("detroit") ||
        al.includes("detroit") ||
        (normalizeGenre(t.genre) === "House" && (t.energy || 5) >= 6)
      );
    },
  },
  {
    id: "london",
    label: "London",
    kind: "city",
    desc: "Bass weight under grey sky.",
    story: "Pirate frequencies, club basements, morning trains.",
    atmosphere: "tube-hum",
    filter: (t) => {
      const scene = inferScene(t);
      return ["uk-garage", "drum-and-bass", "jungle", "grime", "broken-beat", "dubstep"].includes(scene?.id) ||
        ["Drum and Bass", "Hip-Hop"].includes(normalizeGenre(t.genre));
    },
  },
  {
    id: "montreal",
    label: "Montreal",
    kind: "city",
    desc: "Cold air, warm rooms, bilingual nights.",
    story: "A northern listening city — house, jazz, and afterhours.",
    atmosphere: "snow-window",
    filter: (t) => {
      const scene = inferScene(t);
      return ["house", "deep-house", "jazz", "soul", "ambient"].includes(scene?.id) ||
        ["Jazz", "Soul"].includes(normalizeGenre(t.genre));
    },
  },
];

/** Floor (club) rooms as first-class Room destinations. */
export function clubRoomsAsDestinations() {
  return CLUB_ROOMS.map((r) => ({
    ...r,
    kind: "time",
    story: r.desc,
    atmosphere: r.id,
    living: true,
  }));
}

/** All browseable Rooms for the Rooms destination. */
export function allDestinationRooms() {
  // Culture + floor rooms keep editorial ids (uk-garage, detroit…).
  // Scene taxonomy adds scene-* rooms for the full graph; skip duplicates.
  const cultureIds = new Set(CULTURE_ROOMS.map((r) => r.id));
  const sceneRooms = allSceneRooms().filter((r) => {
    if (cultureIds.has(r.id)) return false;
    // Avoid scene-uk-garage alongside culture uk-garage
    if (r.sceneId && cultureIds.has(r.sceneId)) return false;
    return true;
  });
  return [...clubRoomsAsDestinations(), ...CULTURE_ROOMS, ...sceneRooms];
}

/**
 * Match tracks into a Room. Returns enriched room with tracks + presence cues.
 */
export function populateRoom(room, tracks = []) {
  const singles = tracks.filter((t) => (t.duration || 0) <= 900);
  const matched = singles.filter((t) => {
    try {
      return room.filter(t);
    } catch {
      return false;
    }
  });
  const featured = [...matched]
    .sort((a, b) => {
      const score = (t) =>
        (t.liked ? 4 : 0) +
        (t._signal?.pull || 0) * 0.4 +
        (t.playCount || 0) * 0.15 +
        (t.energy || 5) * 0.05;
      return score(b) - score(a);
    })
    .slice(0, 24);

  const coverTrack = featured[0] || matched[0] || null;
  const avgEnergy =
    matched.length > 0
      ? matched.reduce((s, t) => s + (t.energy || 5), 0) / matched.length
      : 5;

  return {
    ...room,
    tracks: matched,
    featured,
    coverTrack,
    count: matched.length,
    avgEnergy: Math.round(avgEnergy * 10) / 10,
    // Soft presence — placeholder until real multiplayer
    presence: matched.length > 0 ? Math.min(48, 3 + Math.floor(matched.length / 4)) : 0,
    lastActivity: coverTrack ? "Someone just played here" : "Quiet tonight",
  };
}

/** Soft presence copy — never a raw headcount in the UI. */
export function presencePhrase(room) {
  const n = room?.presence || 0;
  if (n <= 0) return "Quiet tonight";
  if (n < 8) return "A few listening";
  if (n < 20) return "Warming up";
  return "Busy tonight";
}

/** Populate every destination Room that has at least one track. */
export function populateAllRooms(tracks = [], { minTracks = 1 } = {}) {
  return allDestinationRooms()
    .map((r) => populateRoom(r, tracks))
    .filter((r) => r.count >= minTracks);
}

/** Tonight's featured Room from floor phase + populated catalog. */
export function tonightRoom(tracks = []) {
  const floor = getFloorPhase();
  const label = roomForFloorPhase(floor.id);
  const club = CLUB_ROOMS.find((r) => r.label === label) || CLUB_ROOMS[0];
  const asDest = {
    ...club,
    kind: "time",
    story: floor.blurb,
    atmosphere: floor.id,
    living: true,
    floor,
  };
  return populateRoom(asDest, tracks);
}

/** Group rooms by kind for editorial browsing. Taxonomy scenes nest under moreRooms. */
export function roomsByKind(populated) {
  const order = ["time", "mood", "scene", "city", "season", "community", "genre"];
  const groups = {};
  populated.forEach((r) => {
    const k = r.kind || "community";
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });
  return order.filter((k) => groups[k]?.length).map((k) => {
    const list = groups[k];
    if (k === "scene") {
      const featured = list.filter((r) => !String(r.id).startsWith("scene-"));
      const taxonomy = list.filter((r) => String(r.id).startsWith("scene-"));
      return {
        kind: k,
        label: KIND_LABELS[k] || k,
        rooms: featured.length ? featured : taxonomy.slice(0, 6),
        moreRooms: featured.length ? taxonomy : taxonomy.slice(6),
      };
    }
    return {
      kind: k,
      label: KIND_LABELS[k] || k,
      rooms: list,
      moreRooms: [],
    };
  });
}

export const KIND_LABELS = {
  time: "Tonight",
  mood: "Mood",
  scene: "Scenes",
  city: "Cities",
  season: "Seasons",
  community: "Finds",
  genre: "Lanes",
  label: "Labels",
  artist: "Artists",
  memory: "Memories",
};

/** Atmosphere → soft background gradient hints (CSS-ready). */
export function atmosphereGradient(atmosphere, accent = "#A8926A") {
  const map = {
    "dawn-haze": `radial-gradient(ellipse at 30% 0%, #1A1612 0%, #0C0B0A 55%, #090808 100%)`,
    "night-fog": `radial-gradient(ellipse at 50% -10%, #141820 0%, #0C0E12 45%, #090B0D 100%)`,
    vault: `radial-gradient(ellipse at 70% 20%, #161412 0%, #0B0A09 60%, #080707 100%)`,
    shopfront: `radial-gradient(ellipse at 20% 0%, #1C1814 0%, #0E0C0A 50%, #090808 100%)`,
    concrete: `radial-gradient(ellipse at 60% 0%, #181A1C 0%, #0C0D0E 50%, #090A0B 100%)`,
    "amber-lamp": `radial-gradient(ellipse at 40% -5%, #221C14 0%, #100E0B 48%, #0A0908 100%)`,
    "rain-glass": `radial-gradient(ellipse at 50% 0%, #14181C 0%, #0B0D0F 50%, #090A0B 100%)`,
    "heat-haze": `radial-gradient(ellipse at 80% 10%, #1E1812 0%, #100E0B 45%, #0A0908 100%)`,
    "neon-damp": `radial-gradient(ellipse at 10% 30%, #161820 0%, #0C0D12 50%, #090A0C 100%)`,
    "factory-glow": `radial-gradient(ellipse at 70% 0%, #1A1618 0%, #0E0C0E 48%, #090808 100%)`,
    "tube-hum": `radial-gradient(ellipse at 40% 0%, #14161A 0%, #0B0C0E 50%, #090A0B 100%)`,
    "snow-window": `radial-gradient(ellipse at 50% 0%, #161A1E 0%, #0C0E10 48%, #090A0B 100%)`,
    peak: `radial-gradient(ellipse at 50% -10%, #1A1820 0%, #0C0E12 42%, #090B0D 100%)`,
    afterhours: `radial-gradient(ellipse at 60% 0%, #14161C 0%, #0C0E12 45%, #090B0D 100%)`,
    closing: `radial-gradient(ellipse at 30% 10%, #161410 0%, #0E0C0A 48%, #090808 100%)`,
    warmup: `radial-gradient(ellipse at 40% 0%, #181614 0%, #0E0C0B 48%, #090808 100%)`,
    dark: `radial-gradient(ellipse at 50% 20%, #121018 0%, #0A0A0E 50%, #080809 100%)`,
  };
  return map[atmosphere] || `radial-gradient(ellipse at 50% 0%, #161412 0%, #0C0B0A 50%, #090808 100%)`;
}
