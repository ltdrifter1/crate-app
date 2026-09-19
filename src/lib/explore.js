/**
 * Explore destination — editorial collections for discovery.
 * Catalog sleeves lead. Pictograms stay off this module so Explore
 * does not pull the Channel Surfing PNG graph onto first paint.
 */

import { catalogSleeveUrl } from "./catalogSleeve";
import { HERO_IDLE_ART, HERO_IDLE_FOCUS } from "./heroIdle";
import { genreStory, tracksForGenreLane, tracksForScenePool } from "./browse";
import { CANONICAL_GENRES, normalizeGenre } from "./genres";
import { decorateSceneChannels } from "./sceneChannels";
import { featuredReleases, recommendedPicks, trendingTracks } from "./homeCollections";
import { SCENE_FAMILIES, getScene, inferScene, inferSceneTags } from "./scenes";

/** Canonical lane → Channel Surfing icon when the match is honest. */
export const GENRE_CHANNEL_ART = {
  Electronic: "techno",
  "Hip-Hop": "variety-mix",
  "R&B & Soul": "downtempo",
  Pop: "y2k-dance",
  Rock: "psychedelic-rock",
  Metal: "metal",
  "Country & Folk": "country-folk",
};

/** Scene family → Channel Surfing icon (same original set). */
export const FAMILY_CHANNEL_ART = {
  dancefloor: "house",
  bass: "drum-and-bass",
  afterhours: "downtempo",
  "soul-continuum": "downtempo",
  "jazz-world": "shoegaze",
  "rock-roots": "psychedelic-rock",
  "classical-score": "country-folk",
};

const PLAYABLE = (t) => (t?.duration || 0) <= 900;

function singles(tracks = []) {
  return tracks.filter(PLAYABLE);
}

export function coverUrlsForTracks(list = [], limit = 1) {
  const max = Math.max(1, limit);
  const seen = new Set();
  const out = [];
  for (const t of list) {
    const url = catalogSleeveUrl(t?.albumCover);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= max) break;
  }
  return out;
}

export function artForChannelId(channelId) {
  if (!channelId) return { src: null, focus: "center", channelId: null };
  return {
    src: null,
    focus: "center",
    channelId,
  };
}

function sleeveFirstVisual(pool = []) {
  const covers = coverUrlsForTracks(pool, 1);
  const sleeve = covers[0] || null;
  return {
    photo: sleeve,
    photoFocus: "center",
    covers,
    usePhoto: !!sleeve,
    bug: null,
  };
}

export function visualForGenre(lane, pool = []) {
  return sleeveFirstVisual(pool);
}

export function visualForFamily(familyId, pool = []) {
  return sleeveFirstVisual(pool);
}

/** Genre mosaic rows — only lanes that have catalog, plus art. */
export function exploreGenrePlates(tracks = [], limit = Infinity) {
  const playable = singles(tracks);
  const byLane = new Map();
  for (const t of playable) {
    const lane = normalizeGenre(t.genre);
    if (!lane) continue;
    const list = byLane.get(lane);
    if (list) list.push(t);
    else byLane.set(lane, [t]);
  }
  const plates = CANONICAL_GENRES.filter((lane) => (byLane.get(lane) || []).length > 0).map((lane) => {
    const pool = byLane.get(lane) || [];
    const visual = visualForGenre(lane, pool);
    return {
      lane,
      story: genreStory(lane),
      trackCount: pool.length,
      ...visual,
    };
  });
  if (Number.isFinite(limit)) return plates.slice(0, Math.max(0, limit));
  return plates;
}

/**
 * Mood / moment plates — energy rooms, not chip filters.
 * Photography is always a licensed channel still.
 */
export const MOOD_DEFS = [
  {
    id: "after-hours",
    label: "After hours",
    blurb: "Soft edges when the lights come up.",
    channelId: "downtempo",
    minEnergy: 0,
    maxEnergy: 4,
  },
  {
    id: "peak-time",
    label: "Peak time",
    blurb: "The floor at full pressure.",
    channelId: "techno",
    minEnergy: 7,
    maxEnergy: 10,
  },
  {
    id: "drive",
    label: "Drive",
    blurb: "Steady music for the road.",
    channelId: "local-pnw",
    minEnergy: 4,
    maxEnergy: 7,
  },
  {
    id: "late-booth",
    label: "Late booth",
    blurb: "Y2K dancefloor after midnight.",
    channelId: "y2k-dance",
    minEnergy: 5,
    maxEnergy: 9,
    genres: ["Electronic", "Pop"],
  },
];

export function tracksForMood(tracks = [], moodId) {
  const def = MOOD_DEFS.find((m) => m.id === moodId);
  if (!def) return [];
  let pool = singles(tracks).filter((t) => {
    const e = t.energy ?? 5;
    return e >= def.minEnergy && e <= def.maxEnergy;
  });
  if (def.genres?.length) {
    const focused = def.genres.flatMap((lane) => tracksForGenreLane(pool, lane));
    const seen = new Set();
    pool = focused.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }
  return pool.sort((a, b) => (b.playCount || 0) + (b.likeCount || 0) - ((a.playCount || 0) + (a.likeCount || 0)));
}

export function exploreMoodPlates(tracks = [], minTracks = 2) {
  return MOOD_DEFS.map((def) => {
    const pool = tracksForMood(tracks, def.id);
    const covers = coverUrlsForTracks(pool, 1);
    const sleeve = covers[0] || null;
    return {
      ...def,
      pool,
      count: pool.length,
      photo: sleeve,
      photoFocus: "center",
      covers,
      bug: null,
    };
  }).filter((m) => m.count >= minTracks);
}

/** Culture scenes — one catalog pass, then rank by depth. */
export function exploreScenePlates(tracks = [], limit = 8) {
  const playable = singles(tracks);
  const familyLabel = Object.fromEntries(SCENE_FAMILIES.map((f) => [f.id, f.label]));
  const buckets = new Map();
  for (const t of playable) {
    const tagged = [];
    if (t._scene?.id) {
      const s = getScene(t._scene.id);
      if (s) tagged.push(s);
    }
    const extras = t._scenes?.length
      ? t._scenes.map((id) => getScene(id)).filter(Boolean)
      : inferSceneTags(t, 4);
    for (const s of extras) {
      if (s && !tagged.some((x) => x.id === s.id)) tagged.push(s);
    }
    if (!tagged.length) {
      const inferred = inferScene(t);
      if (inferred) tagged.push(inferred);
    }
    for (const scene of tagged) {
      let bucket = buckets.get(scene.id);
      if (!bucket) {
        bucket = { scene, pool: [] };
        buckets.set(scene.id, bucket);
      }
      bucket.pool.push(t);
    }
  }
  const scored = [];
  for (const { scene, pool } of buckets.values()) {
    if (!pool.length) continue;
    const covers = coverUrlsForTracks(pool, 1);
    const sleeve = covers[0] || null;
    scored.push({
      id: scene.id,
      label: scene.label,
      familyId: scene.familyId,
      familyLabel: familyLabel[scene.familyId] || scene.familyId,
      story: scene.story,
      cities: scene.cities || [],
      count: pool.length,
      pool,
      photo: sleeve,
      photoFocus: "center",
      covers,
      bug: null,
    });
  }
  return scored
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function recentlyPlayedTracks(tracks = [], recentTrackIds = [], limit = 6) {
  if (!recentTrackIds.length) return [];
  const byId = new Map(tracks.map((t) => [t.id, t]));
  const seen = new Set();
  const out = [];
  for (const id of recentTrackIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const t = byId.get(id);
    if (t) out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

export function exploreForYou(tracks = [], opts = {}) {
  const { preferredGenres = [], recentTrackIds = [], userKey = "", dayKey, limit = 8 } = opts;
  const { picks, coldStart } = recommendedPicks(tracks, {
    preferredGenres,
    recentTrackIds,
    limit,
    excludeIds: [],
    userKey,
    dayKey,
  });
  const trending = trendingTracks(tracks, limit);
  const seen = new Set();
  const rail = [];
  const reasons = {};
  const push = (list, asPicks = false) => {
    for (const item of list) {
      const t = asPicks ? item.track : item;
      if (!t?.id || seen.has(t.id)) continue;
      seen.add(t.id);
      rail.push(t);
      if (asPicks && item.reason) reasons[t.id] = item.reason;
      if (rail.length >= limit) return true;
    }
    return false;
  };
  if (push(picks, true)) return { tracks: rail, reasons, coldStart };
  if (push(trending)) return { tracks: rail, reasons, coldStart };
  push(recentlyPlayedTracks(tracks, recentTrackIds, 8));
  push(singles(tracks));
  return { tracks: rail, reasons, coldStart };
}

/**
 * Editorial hero — catalog sleeves only. Fast: no scene-pool builds.
 * Channel pictograms stay bugs. Idle cassette is the device fallback.
 */
export function buildExploreHero({
  tracks = [],
  channels = [],
  releases = [],
  countdown = [],
} = {}) {
  const chartTop = countdown?.[0]?.track;
  const chartSleeve = catalogSleeveUrl(chartTop?.albumCover);
  if (chartTop && chartSleeve) {
    return {
      kind: "chart",
      id: chartTop.id,
      eyebrow: "On the board",
      title: chartTop.title,
      subtitle: chartTop.artist,
      kicker: "#1 this month",
      art: chartSleeve,
      artFocus: "center",
      channel: null,
      album: null,
      track: chartTop,
      pool: (countdown || []).map((c) => c.track).filter(Boolean),
    };
  }

  const featured = (releases || [])[0];
  const releaseSleeve = catalogSleeveUrl(featured?.coverTrack?.albumCover);
  if (featured && releaseSleeve) {
    return {
      kind: "release",
      id: featured.slug,
      eyebrow: "",
      title: featured.title,
      subtitle: featured.artist,
      kicker: featured.count ? `${featured.count} tracks` : null,
      art: releaseSleeve,
      artFocus: "center",
      channel: null,
      album: featured,
      track: featured.coverTrack,
      pool: featured.tracks || [],
    };
  }

  const ready = (channels || []).filter((c) => c.ready !== false);
  const showcase = ready.find((c) => c.showcase) || ready[0] || null;
  if (showcase) {
    const preCovers = (showcase.covers || []).map(catalogSleeveUrl).filter(Boolean);
    const sleeve = preCovers[0] || catalogSleeveUrl(showcase.art);
    if (sleeve) {
      return {
        kind: "channel",
        id: showcase.id,
        eyebrow: "",
        title: showcase.title,
        subtitle: showcase.tagline,
        kicker: null,
        art: sleeve,
        artFocus: "center",
        channel: showcase,
        album: null,
        track: showcase.track || null,
        pool: showcase.pool || [],
      };
    }
  }

  const best = singles(tracks)
    .filter((t) => catalogSleeveUrl(t.albumCover))
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0];
  if (best) {
    return {
      kind: "sleeve",
      id: best.id,
      eyebrow: "",
      title: best.title,
      subtitle: best.artist,
      kicker: best.album || null,
      art: catalogSleeveUrl(best.albumCover),
      artFocus: "center",
      channel: null,
      album: null,
      track: best,
      pool: [best],
    };
  }

  return {
    kind: "idle",
    id: "idle",
    eyebrow: "Explore",
    title: "Start anywhere",
    subtitle: "Scenes and sleeves — dig the catalog.",
    kicker: null,
    art: HERO_IDLE_ART,
    artFocus: HERO_IDLE_FOCUS,
    channel: null,
    album: null,
    track: null,
    pool: [],
  };
}

export function exploreStations(tracks = []) {
  return decorateSceneChannels(tracks);
}

export function exploreReleases(tracks = [], limit = 4) {
  return featuredReleases(tracks, limit);
}

export function exploreChartsTeaser(countdown = [], limit = 5) {
  return (countdown || []).slice(0, limit);
}

export function resolveExploreFocus(focus, tracks = []) {
  if (!focus?.type) return null;
  if (focus.type === "genre") {
    const pool = tracksForGenreLane(tracks, focus.id);
    const visual = visualForGenre(focus.id, pool);
    return {
      type: "genre",
      id: focus.id,
      label: focus.id,
      eyebrow: "Genre",
      story: genreStory(focus.id),
      pool,
      ...visual,
    };
  }
  if (focus.type === "scene") {
    const scene = getScene(focus.id);
    if (!scene) return null;
    const pool = tracksForScenePool(tracks, scene.id);
    const visual = visualForFamily(scene.familyId, pool);
    const family = SCENE_FAMILIES.find((f) => f.id === scene.familyId);
    return {
      type: "scene",
      id: scene.id,
      label: scene.label,
      eyebrow: family?.label || "Scene",
      story: scene.story,
      pool,
      cities: scene.cities || [],
      ...visual,
    };
  }
  if (focus.type === "mood") {
    const def = MOOD_DEFS.find((m) => m.id === focus.id);
    if (!def) return null;
    const pool = tracksForMood(tracks, def.id);
    const visual = sleeveFirstVisual(pool);
    return {
      type: "mood",
      id: def.id,
      label: def.label,
      eyebrow: "Mood",
      story: def.blurb,
      pool,
      ...visual,
    };
  }
  return null;
}
