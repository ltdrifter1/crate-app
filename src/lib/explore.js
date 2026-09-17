/**
 * Explore destination — editorial collections for discovery.
 * Photography comes from licensed Channel Surfing stills (channelArt),
 * never generated plates. Catalog sleeves fill gaps with no honest photo.
 */

import { CHANNEL_ART, CHANNEL_ART_FOCUS, HERO_IDLE_ART, HERO_IDLE_FOCUS } from "./channelArt";
import { genreBrowseRows, genreStory, tracksForGenreLane, tracksForScenePool } from "./browse";
import {
  buildSceneChannelPool,
  decorateSceneChannels,
  SCENE_CHANNELS,
} from "./sceneChannels";
import { featuredReleases, recommendedPicks, trendingTracks } from "./homeCollections";
import { buildArtists } from "./catalog";
import { SCENE_FAMILIES, getScene } from "./scenes";

/** Canonical lane → Channel Surfing photo when the match is honest. */
export const GENRE_CHANNEL_ART = {
  Electronic: "techno",
  "Hip-Hop": "variety-mix",
  "R&B & Soul": "downtempo",
  Pop: "y2k-dance",
  Rock: "psychedelic-rock",
  Metal: "metal",
  "Country & Folk": "country-folk",
};

/** Scene family → documentary still (same licensed set). */
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

export function coverUrlsForTracks(list = [], limit = 4) {
  const max = Math.max(1, limit);
  const seen = new Set();
  const out = [];
  for (const t of list) {
    const url = t?.albumCover;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= max) break;
  }
  return out;
}

export function artForChannelId(channelId) {
  if (!channelId) return { src: null, focus: "center" };
  return {
    src: CHANNEL_ART[channelId] || null,
    focus: CHANNEL_ART_FOCUS[channelId] || "center",
  };
}

export function visualForGenre(lane, pool = []) {
  const channelId = GENRE_CHANNEL_ART[lane] || null;
  const photo = artForChannelId(channelId);
  const covers = coverUrlsForTracks(pool, 4);
  return {
    photo: photo.src,
    photoFocus: photo.focus,
    covers,
    usePhoto: !!photo.src,
  };
}

export function visualForFamily(familyId, pool = []) {
  const channelId = FAMILY_CHANNEL_ART[familyId] || null;
  const photo = artForChannelId(channelId);
  return {
    photo: photo.src,
    photoFocus: photo.focus,
    covers: coverUrlsForTracks(pool, 4),
    usePhoto: !!photo.src,
  };
}

/** Genre mosaic rows — only lanes that have catalog, plus art. */
export function exploreGenrePlates(tracks = []) {
  return genreBrowseRows(tracks)
    .filter((row) => row.trackCount > 0)
    .map((row) => {
    const pool = tracksForGenreLane(tracks, row.lane);
    const visual = visualForGenre(row.lane, pool);
    return {
      ...row,
      ...visual,
      story: genreStory(row.lane),
    };
  });
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
    const art = artForChannelId(def.channelId);
    return {
      ...def,
      pool,
      count: pool.length,
      photo: art.src,
      photoFocus: art.focus,
    };
  }).filter((m) => m.count >= minTracks);
}

/** Culture scenes with live counts — ranked by depth, photography from family. */
export function exploreScenePlates(tracks = [], limit = 10) {
  const scored = [];
  for (const family of SCENE_FAMILIES) {
    const channelId = FAMILY_CHANNEL_ART[family.id];
    const art = artForChannelId(channelId);
    const familyScenes = [];
    // Pull from browse rows' scene lists so we don't re-scan the whole graph blindly
    for (const row of genreBrowseRows(tracks)) {
      for (const scene of row.scenes || []) {
        if (scene.familyId !== family.id) continue;
        const pool = tracksForScenePool(tracks, scene.id);
        if (!pool.length) continue;
        familyScenes.push({
          id: scene.id,
          label: scene.label,
          familyId: family.id,
          familyLabel: family.label,
          story: scene.story,
          cities: scene.cities || [],
          count: pool.length,
          pool,
          photo: art.src,
          photoFocus: art.focus,
          covers: coverUrlsForTracks(pool, 4),
        });
      }
    }
    scored.push(...familyScenes);
  }
  return scored
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function recentlyPlayedTracks(tracks = [], recentTrackIds = [], limit = 12) {
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
  const { preferredGenres = [], recentTrackIds = [], userKey = "", dayKey, limit = 16 } = opts;
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
 * Editorial hero — photography first.
 * Featured station when the dial is live; else a featured sleeve; else idle club still.
 * No “showcase station / N on the dial” chrome — title and tagline only.
 */
export function buildExploreHero({
  tracks = [],
  channels = [],
  releases = [],
  countdown = [],
} = {}) {
  const ready = (channels || []).filter((c) => c.ready !== false && (c.art || CHANNEL_ART[c.id]));
  const showcase = ready.find((c) => c.showcase) || ready[0] || null;

  if (showcase) {
    const channel = SCENE_CHANNELS.find((c) => c.id === showcase.id) || showcase;
    const pool = buildSceneChannelPool(tracks, channel);
    const art = artForChannelId(showcase.id);
    return {
      kind: "channel",
      id: showcase.id,
      eyebrow: "",
      title: showcase.title,
      subtitle: showcase.tagline,
      kicker: null,
      art: showcase.art || art.src,
      artFocus: showcase.artFocus || art.focus,
      channel: showcase,
      album: null,
      track: pool[0] || null,
      pool,
    };
  }

  const featured = (releases || [])[0];
  if (featured?.coverTrack?.albumCover) {
    return {
      kind: "release",
      id: featured.slug,
      eyebrow: "",
      title: featured.title,
      subtitle: featured.artist,
      kicker: featured.count ? `${featured.count} tracks` : null,
      art: featured.coverTrack.albumCover,
      artFocus: "center",
      channel: null,
      album: featured,
      track: featured.coverTrack,
      pool: featured.tracks || [],
    };
  }

  const chartTop = countdown?.[0]?.track;
  if (chartTop) {
    return {
      kind: "chart",
      id: chartTop.id,
      eyebrow: "On the board",
      title: chartTop.title,
      subtitle: chartTop.artist,
      kicker: "#1 this month",
      art: chartTop.albumCover || HERO_IDLE_ART,
      artFocus: chartTop.albumCover ? "center" : HERO_IDLE_FOCUS,
      channel: null,
      album: null,
      track: chartTop,
      pool: (countdown || []).map((c) => c.track).filter(Boolean),
    };
  }

  return {
    kind: "idle",
    id: "idle",
    eyebrow: "Explore",
    title: "Start anywhere",
    subtitle: "Stations, scenes, and sleeves — dig the catalog.",
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

export function exploreReleases(tracks = [], limit = 6) {
  return featuredReleases(tracks, limit);
}

/**
 * Artist faces for Explore — Home stays broadcast-only.
 * Prefer sleeves + more than one cut so the rail isn't a dump of unknowns.
 */
export function exploreArtists(tracks = [], limit = 16) {
  return buildArtists(tracks)
    .filter((a) => {
      const name = String(a.name || "").trim();
      if (!name || /^unknown$/i.test(name)) return false;
      return !!(a.coverTrack?.albumCover) && (a.count || 0) >= 1;
    })
    .slice(0, Math.max(1, limit));
}

export function exploreChartsTeaser(countdown = [], limit = 8) {
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
    const art = artForChannelId(def.channelId);
    return {
      type: "mood",
      id: def.id,
      label: def.label,
      eyebrow: "Mood",
      story: def.blurb,
      pool,
      photo: art.src,
      photoFocus: art.focus,
      covers: coverUrlsForTracks(pool, 4),
      usePhoto: !!art.src,
    };
  }
  return null;
}
