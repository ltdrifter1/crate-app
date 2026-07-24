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
    // Presence is quiet until real multiplayer — no synthetic headcounts
    presence: 0,
    lastActivity: matched.some((t) => t.liked)
      ? "Yours are here"
      : coverTrack
        ? "Ready when you are"
        : "Quiet tonight",
  };
}

/** Activity line for a Room — never invents a crowd. */
export function presencePhrase(room) {
  return room?.lastActivity || "Quiet tonight";
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
  return roomPosterStyle(atmosphere).gradient;
}

/**
 * Per-Room poster identity — distinct light, texture, type, and motion.
 * Sunday Morning should not look like Warehouse.
 * Accepts atmosphere id string or a room-like object `{ atmosphere, id, kind }`.
 */
export function roomPosterStyle(atmosphereOrRoom) {
  const atmosphere =
    typeof atmosphereOrRoom === "string"
      ? atmosphereOrRoom
      : atmosphereOrRoom?.atmosphere || atmosphereOrRoom?.id || "vault";
  const kind =
    typeof atmosphereOrRoom === "object" && atmosphereOrRoom
      ? atmosphereOrRoom.kind
      : null;

  const base = {
    atmosphere,
    kind,
    gradient: `radial-gradient(ellipse at 50% 0%, #161412 0%, #0C0B0A 50%, #090808 100%)`,
    overlay:
      "linear-gradient(180deg, rgba(12,11,10,0.22) 0%, rgba(12,11,10,0.58) 42%, rgba(12,11,10,0.96) 100%)",
    wash: {
      top: "-12%",
      right: "-6%",
      left: "auto",
      size: 320,
      color: "rgba(168,146,106,0.16)",
    },
    coverBlur: 36,
    coverSat: 115,
    coverBright: 0.42,
    coverScale: 1.15,
    coverOpacity: 0.85,
    coverAnim: "fadeIn 1s cubic-bezier(0.33,1,0.68,1) both",
    titleSize: "clamp(44px, 13vw, 64px)",
    fontWeight: 800,
    letterSpacing: -1.8,
    lineHeight: 0.94,
    ambientDuration: 6,
    texture: null,
    textureOpacity: 0.35,
    textureSize: "auto",
    textureBlend: "soft-light",
    enterName: "roomEnter",
  };

  const grain =
    "repeating-linear-gradient(0deg, rgba(237,232,225,0.03) 0 1px, transparent 1px 3px)";
  const rain =
    "repeating-linear-gradient(105deg, rgba(180,200,220,0.045) 0 1px, transparent 1px 7px)";
  const concrete =
    "repeating-linear-gradient(90deg, rgba(237,232,225,0.04) 0 1px, transparent 1px 18px), repeating-linear-gradient(0deg, rgba(237,232,225,0.025) 0 1px, transparent 1px 22px)";
  const heat =
    "repeating-linear-gradient(180deg, rgba(220,170,100,0.05) 0 2px, transparent 2px 10px)";
  const snow =
    "radial-gradient(circle at 20% 30%, rgba(220,230,240,0.08) 0 1px, transparent 1.5px), radial-gradient(circle at 70% 55%, rgba(220,230,240,0.06) 0 1px, transparent 1.5px)";

  const presets = {
    "dawn-haze": {
      gradient: `radial-gradient(ellipse at 28% 0%, #2A2218 0%, #16120E 42%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.12) 0%, rgba(18,14,10,0.45) 40%, rgba(12,11,10,0.96) 100%)",
      wash: { top: "-6%", left: "8%", right: "auto", size: 420, color: "rgba(212,176,120,0.22)" },
      coverBlur: 44,
      coverSat: 108,
      coverBright: 0.52,
      coverOpacity: 0.72,
      titleSize: "clamp(48px, 14vw, 72px)",
      fontWeight: 750,
      letterSpacing: -2.2,
      lineHeight: 0.92,
      ambientDuration: 9,
      texture: grain,
      textureOpacity: 0.4,
    },
    "night-fog": {
      gradient: `radial-gradient(ellipse at 50% -8%, #1A1C22 0%, #101218 48%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.35) 0%, rgba(12,11,10,0.62) 45%, rgba(12,11,10,0.97) 100%)",
      wash: { top: "10%", right: "-10%", left: "auto", size: 380, color: "rgba(140,150,170,0.12)" },
      coverBlur: 40,
      coverBright: 0.36,
      coverSat: 110,
      titleSize: "clamp(42px, 12vw, 60px)",
      letterSpacing: -1.6,
      ambientDuration: 8,
      texture: grain,
      textureOpacity: 0.28,
    },
    vault: {
      gradient: `radial-gradient(ellipse at 72% 18%, #1A1612 0%, #0E0C0A 55%, #090808 100%)`,
      overlay:
        "linear-gradient(165deg, rgba(12,11,10,0.4) 0%, rgba(12,11,10,0.7) 50%, rgba(12,11,10,0.98) 100%)",
      wash: { top: "30%", left: "-8%", right: "auto", size: 260, color: "rgba(168,146,106,0.1)" },
      coverBlur: 28,
      coverBright: 0.38,
      coverScale: 1.08,
      titleSize: "clamp(40px, 11vw, 56px)",
      letterSpacing: -1.2,
      fontWeight: 800,
      ambientDuration: 7,
      texture: concrete,
      textureOpacity: 0.22,
      textureSize: "48px 48px",
    },
    shopfront: {
      gradient: `radial-gradient(ellipse at 18% 0%, #241C14 0%, #120F0C 50%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.18) 0%, rgba(12,11,10,0.55) 48%, rgba(12,11,10,0.96) 100%)",
      wash: { top: "-10%", left: "20%", right: "auto", size: 340, color: "rgba(200,160,100,0.18)" },
      coverBlur: 32,
      coverBright: 0.48,
      coverSat: 120,
      titleSize: "clamp(44px, 12vw, 62px)",
      letterSpacing: -1.7,
      ambientDuration: 5.5,
      texture: grain,
    },
    concrete: {
      gradient: `radial-gradient(ellipse at 62% 0%, #1C1E20 0%, #101214 48%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.45) 0%, rgba(12,11,10,0.72) 40%, rgba(12,11,10,0.98) 100%)",
      wash: { top: "25%", right: "-12%", left: "auto", size: 240, color: "rgba(170,175,185,0.08)" },
      coverBlur: 14,
      coverBright: 0.32,
      coverSat: 95,
      coverScale: 1.06,
      coverOpacity: 0.9,
      titleSize: "clamp(40px, 11vw, 58px)",
      fontWeight: 800,
      letterSpacing: -0.6,
      lineHeight: 0.98,
      ambientDuration: 4,
      texture: concrete,
      textureOpacity: 0.45,
      textureSize: "36px 36px",
      textureBlend: "overlay",
    },
    "amber-lamp": {
      gradient: `radial-gradient(ellipse at 38% -5%, #2C2216 0%, #14100C 48%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.15) 0%, rgba(20,14,8,0.5) 45%, rgba(12,11,10,0.96) 100%)",
      wash: { top: "-4%", left: "30%", right: "auto", size: 400, color: "rgba(220,160,80,0.2)" },
      coverBlur: 38,
      coverBright: 0.46,
      coverSat: 125,
      titleSize: "clamp(46px, 13vw, 66px)",
      fontWeight: 750,
      letterSpacing: -1.9,
      ambientDuration: 7.5,
      texture: grain,
      textureOpacity: 0.3,
    },
    "rain-glass": {
      gradient: `radial-gradient(ellipse at 50% 0%, #181C20 0%, #0E1014 50%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.3) 0%, rgba(12,14,16,0.65) 48%, rgba(12,11,10,0.97) 100%)",
      wash: { top: "0%", left: "40%", right: "auto", size: 360, color: "rgba(150,170,190,0.1)" },
      coverBlur: 48,
      coverBright: 0.4,
      coverSat: 90,
      coverOpacity: 0.7,
      titleSize: "clamp(44px, 13vw, 64px)",
      fontWeight: 700,
      letterSpacing: -2,
      ambientDuration: 10,
      texture: rain,
      textureOpacity: 0.55,
      textureSize: "12px 12px",
      textureBlend: "screen",
    },
    "heat-haze": {
      gradient: `radial-gradient(ellipse at 82% 8%, #2A1E14 0%, #14100C 45%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(200deg, rgba(12,11,10,0.1) 0%, rgba(24,16,10,0.5) 42%, rgba(12,11,10,0.96) 100%)",
      wash: { top: "-15%", right: "0%", left: "auto", size: 440, color: "rgba(230,160,70,0.22)" },
      coverBlur: 30,
      coverBright: 0.5,
      coverSat: 130,
      titleSize: "clamp(48px, 14vw, 70px)",
      fontWeight: 800,
      letterSpacing: -2.4,
      ambientDuration: 5,
      texture: heat,
      textureOpacity: 0.4,
    },
    "neon-damp": {
      gradient: `radial-gradient(ellipse at 8% 28%, #1A1C28 0%, #101218 50%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(135deg, rgba(12,11,10,0.25) 0%, rgba(12,11,10,0.6) 50%, rgba(12,11,10,0.97) 100%)",
      wash: { top: "40%", left: "-5%", right: "auto", size: 300, color: "rgba(168,146,106,0.14)" },
      coverBlur: 26,
      coverBright: 0.4,
      coverSat: 118,
      titleSize: "clamp(42px, 12vw, 60px)",
      letterSpacing: -1.4,
      ambientDuration: 4.5,
      texture: rain,
      textureOpacity: 0.35,
    },
    "factory-glow": {
      gradient: `radial-gradient(ellipse at 70% 0%, #22181C 0%, #120E10 48%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.35) 0%, rgba(12,11,10,0.68) 45%, rgba(12,11,10,0.98) 100%)",
      wash: { top: "-8%", right: "5%", left: "auto", size: 320, color: "rgba(180,100,90,0.12)" },
      coverBlur: 18,
      coverBright: 0.34,
      coverSat: 105,
      titleSize: "clamp(40px, 11vw, 56px)",
      letterSpacing: -0.8,
      ambientDuration: 4.2,
      texture: concrete,
      textureOpacity: 0.35,
      textureSize: "40px 40px",
    },
    "tube-hum": {
      gradient: `radial-gradient(ellipse at 40% 0%, #1A1C22 0%, #101214 50%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.32) 0%, rgba(12,11,10,0.66) 48%, rgba(12,11,10,0.97) 100%)",
      wash: { top: "15%", left: "50%", right: "auto", size: 280, color: "rgba(160,170,190,0.1)" },
      coverBlur: 34,
      coverBright: 0.38,
      titleSize: "clamp(42px, 12vw, 60px)",
      letterSpacing: -1.5,
      ambientDuration: 6.5,
      texture: grain,
    },
    "snow-window": {
      gradient: `radial-gradient(ellipse at 50% 0%, #1C2228 0%, #101418 48%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.2) 0%, rgba(14,16,18,0.55) 45%, rgba(12,11,10,0.96) 100%)",
      wash: { top: "-10%", left: "25%", right: "auto", size: 400, color: "rgba(200,210,220,0.12)" },
      coverBlur: 40,
      coverBright: 0.44,
      coverSat: 95,
      titleSize: "clamp(44px, 13vw, 64px)",
      fontWeight: 750,
      letterSpacing: -1.8,
      ambientDuration: 9,
      texture: snow,
      textureOpacity: 0.65,
      textureSize: "120px 120px",
      textureBlend: "screen",
    },
    peak: {
      gradient: `radial-gradient(ellipse at 50% -10%, #221C28 0%, #121018 42%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.28) 0%, rgba(12,11,10,0.6) 40%, rgba(12,11,10,0.97) 100%)",
      wash: { top: "-18%", right: "-4%", left: "auto", size: 380, color: "rgba(168,146,106,0.18)" },
      coverBlur: 22,
      coverBright: 0.4,
      coverSat: 120,
      titleSize: "clamp(48px, 14vw, 72px)",
      letterSpacing: -2.2,
      ambientDuration: 3.8,
      texture: grain,
      textureOpacity: 0.25,
    },
    afterhours: {
      gradient: `radial-gradient(ellipse at 60% 0%, #181A22 0%, #101218 45%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.38) 0%, rgba(12,11,10,0.68) 48%, rgba(12,11,10,0.98) 100%)",
      wash: { top: "20%", right: "-8%", left: "auto", size: 300, color: "rgba(140,150,180,0.1)" },
      coverBlur: 36,
      coverBright: 0.34,
      titleSize: "clamp(42px, 12vw, 60px)",
      letterSpacing: -1.4,
      ambientDuration: 7,
    },
    closing: {
      gradient: `radial-gradient(ellipse at 30% 10%, #1C1814 0%, #120E0C 48%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.25) 0%, rgba(12,11,10,0.62) 50%, rgba(12,11,10,0.97) 100%)",
      wash: { top: "5%", left: "10%", right: "auto", size: 340, color: "rgba(168,146,106,0.12)" },
      coverBlur: 42,
      coverBright: 0.36,
      titleSize: "clamp(40px, 11vw, 56px)",
      fontWeight: 750,
      letterSpacing: -1.6,
      ambientDuration: 8.5,
      texture: grain,
    },
    warmup: {
      gradient: `radial-gradient(ellipse at 40% 0%, #1E1A16 0%, #120F0C 48%, #0C0B0A 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.2) 0%, rgba(12,11,10,0.55) 48%, rgba(12,11,10,0.96) 100%)",
      wash: { top: "-8%", left: "35%", right: "auto", size: 360, color: "rgba(190,160,110,0.16)" },
      coverBlur: 34,
      coverBright: 0.44,
      titleSize: "clamp(44px, 12vw, 62px)",
      letterSpacing: -1.7,
      ambientDuration: 6,
    },
    dark: {
      gradient: `radial-gradient(ellipse at 50% 20%, #141018 0%, #0C0A0E 50%, #0A090B 100%)`,
      overlay:
        "linear-gradient(180deg, rgba(12,11,10,0.5) 0%, rgba(12,11,10,0.78) 45%, rgba(12,11,10,0.98) 100%)",
      wash: { top: "35%", left: "40%", right: "auto", size: 220, color: "rgba(120,110,140,0.08)" },
      coverBlur: 20,
      coverBright: 0.28,
      coverSat: 100,
      titleSize: "clamp(40px, 11vw, 56px)",
      letterSpacing: -1,
      ambientDuration: 5,
      texture: grain,
      textureOpacity: 0.2,
    },
  };

  const preset = presets[atmosphere] || {};
  return { ...base, ...preset, wash: { ...base.wash, ...(preset.wash || {}) } };
}
