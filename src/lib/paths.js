import { normalizeGenre } from "./genres";
import { populateAllRooms } from "./rooms";
import { findResonant } from "./engine";
import { sceneLineagePath, inferScene } from "./scenes";

/**
 * Listening paths — curated journeys across rooms, artists, and moods.
 * Community-built paths later; seeded journeys ship from catalog intuition.
 */

export const SEED_PATHS = [
  {
    id: "rain-to-warehouse",
    title: "Rain → Warehouse",
    story: "From grey windows to concrete pressure — a night that starts soft.",
    kind: "journey",
    steps: [
      { type: "room", id: "rain", note: "Open with weather" },
      { type: "room", id: "jazz-cafe", note: "Warm the table" },
      { type: "room", id: "afterhours", note: "Lights down" },
      { type: "room", id: "warehouse", note: "Arrive heavy" },
    ],
  },
  {
    id: "sunday-into-summer",
    title: "Sunday → Summer",
    story: "Slow morning into heat shimmer — no rush, then open windows.",
    kind: "journey",
    steps: [
      { type: "room", id: "sunday-morning", note: "Exhale" },
      { type: "room", id: "jazz-cafe", note: "Second cup" },
      { type: "room", id: "summer-2026", note: "Sun on the floor" },
    ],
  },
  {
    id: "city-hop",
    title: "City hop",
    story: "Three cities as rooms — listen as if you were there.",
    kind: "scene",
    steps: [
      { type: "room", id: "detroit", note: "Machines with soul" },
      { type: "room", id: "london", note: "Bass under grey sky" },
      { type: "room", id: "montreal", note: "Cold air, warm rooms" },
    ],
  },
  {
    id: "hidden-to-peak",
    title: "Hidden → Peak",
    story: "Crate dig first, then let the floor take over.",
    kind: "journey",
    steps: [
      { type: "room", id: "hidden-gems", note: "Quiet finds" },
      { type: "room", id: "warmup", note: "Ease in" },
      { type: "room", id: "peak", note: "Hands up" },
    ],
  },
  {
    id: "ukg-lineage",
    title: "UK Garage lineage",
    story: "2-step into broken beat, grime, and the bass family — a scene path.",
    kind: "scene",
    steps: sceneLineagePath("uk-garage", 4)?.steps || [
      { type: "room", id: "uk-garage", note: "Skip & shuffle" },
      { type: "room", id: "scene-broken-beat", note: "West London swing" },
      { type: "room", id: "scene-grime", note: "MC pressure" },
    ],
  },
  {
    id: "detroit-berlin",
    title: "Detroit → Berlin",
    story: "Techno’s machine soul across the Atlantic.",
    kind: "scene",
    steps: [
      { type: "room", id: "detroit", note: "Motor City" },
      { type: "room", id: "scene-techno", note: "Machines with intent" },
      { type: "room", id: "scene-minimal", note: "Reduction" },
      { type: "room", id: "warehouse", note: "Concrete" },
    ],
  },
  {
    id: "lineage-pocket",
    title: "Stay in the pocket",
    story: "Start from a seed track — Hypno-adjacent neighbours as a path.",
    kind: "lineage",
    steps: [{ type: "seed", note: "Uses your current or top saved track" }],
  },
];

/** Resolve a path into playable stops with tracks + copy. */
export function resolvePath(pathDef, tracks = [], { seedTrack = null } = {}) {
  if (!pathDef) return null;
  const rooms = populateAllRooms(tracks);
  const roomMap = Object.fromEntries(rooms.map((r) => [r.id, r]));

  if (pathDef.kind === "lineage") {
    const seed =
      seedTrack ||
      tracks.find((t) => t.liked) ||
      tracks.filter((t) => (t.duration || 0) <= 900)[0];
    if (!seed) {
      return { ...pathDef, stops: [], playlist: [], ready: false };
    }
    const resonant = findResonant(seed, tracks, 10);
    const playlist = [seed, ...resonant].filter(Boolean);
    return {
      ...pathDef,
      ready: true,
      stops: [
        {
          type: "track",
          label: seed.title,
          note: "Seed",
          track: seed,
        },
        ...resonant.slice(0, 5).map((t, i) => ({
          type: "track",
          label: t.title,
          note: i === 0 ? "Same pocket" : "Further in",
          track: t,
        })),
      ],
      playlist,
    };
  }

  const stops = [];
  const playlist = [];
  pathDef.steps.forEach((step) => {
    if (step.type === "room") {
      const room = roomMap[step.id];
      if (!room || !room.featured?.length) return;
      const pick = room.featured[0];
      stops.push({
        type: "room",
        id: room.id,
        label: room.label,
        note: step.note || room.desc,
        track: pick,
        room,
      });
      // Take a few from each room for a continuous journey
      room.featured.slice(0, 3).forEach((t) => {
        if (!playlist.find((x) => x.id === t.id)) playlist.push(t);
      });
    }
  });

  return {
    ...pathDef,
    ready: playlist.length > 0,
    stops,
    playlist,
  };
}

export function listPaths(tracks = [], opts = {}) {
  return SEED_PATHS.map((p) => resolvePath(p, tracks, opts)).filter(
    (p) => p && (p.ready || p.kind === "lineage")
  );
}

export function findPath(id, tracks = [], opts = {}) {
  const def = SEED_PATHS.find((p) => p.id === id);
  return def ? resolvePath(def, tracks, opts) : null;
}

/** Suggest a path based on preferred genres / hour. */
export function suggestPath(tracks = [], { preferredGenres = [], seedTrack = null } = {}) {
  const paths = listPaths(tracks, { seedTrack });
  if (!paths.length) return null;
  const scene = inferScene(seedTrack);
  if (scene?.id === "uk-garage" || scene?.id === "broken-beat") {
    return paths.find((p) => p.id === "ukg-lineage") || paths[0];
  }
  if (scene?.id === "techno" || scene?.id === "minimal") {
    return paths.find((p) => p.id === "detroit-berlin") || paths[0];
  }
  const houseLean = preferredGenres.some((g) =>
    normalizeGenre(g) === "Electronic" || g === "Electronic"
  );
  if (houseLean) {
    return paths.find((p) => p.id === "hidden-to-peak") || paths[0];
  }
  return paths.find((p) => p.id === "sunday-into-summer") || paths[0];
}
