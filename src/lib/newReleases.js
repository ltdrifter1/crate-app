/**
 * New Releases — newest sleeves on the Planet, filtered by channel.
 * Arrival = catalog ingest (`createdAt`), not street date.
 */
import { getCatalogEntities } from "./catalog";
import { hashSeed } from "./hashSeed";
import { getSceneChannel, SCENE_CHANNELS, trackMatchesChannel } from "./sceneChannels";

export const NEW_RELEASES_LIMIT = 24;
/**
 * Albums that land within this window of a drop's newest sleeve are one drop.
 * Bulk uploads stamp `createdAt` in file order, so inside a drop arrival time
 * is just the alphabet — shuffle it instead of shelving A→Z.
 */
export const DROP_WINDOW_MS = 6 * 60 * 60 * 1000;
const SINGLE_DUMP = "Singles & Unknown";

export function arrivedAtMs(value) {
  if (!value && value !== 0) return 0;
  if (typeof value === "number") return value > 1e12 ? value : value * 1000;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function trackArrivedAt(track) {
  return arrivedAtMs(track?.createdAt);
}

function albumArrivedAt(album) {
  let max = 0;
  for (const track of album.tracks || []) {
    const ms = trackArrivedAt(track);
    if (ms > max) max = ms;
  }
  return max;
}

function isShopAlbum(album) {
  return (
    !!album &&
    album.title !== SINGLE_DUMP &&
    !!(album.coverTrack?.albumCover)
  );
}

function catalogIndexMap(tracks = []) {
  const map = new Map();
  tracks.forEach((track, i) => {
    if (track?.id != null && !map.has(track.id)) map.set(track.id, i);
  });
  return map;
}

function albumCatalogIndex(album, indexMap) {
  let min = Number.POSITIVE_INFINITY;
  for (const track of album.tracks || []) {
    const i = indexMap.get(track.id);
    if (i != null && i < min) min = i;
  }
  return Number.isFinite(min) ? min : 9999;
}

function albumInChannel(album, channel) {
  if (!channel) return true;
  return (album.tracks || []).some((track) => trackMatchesChannel(track, channel));
}

function artistKey(album) {
  return String(album.artist || album.coverTrack?.artist || album.title || "")
    .trim()
    .toLowerCase();
}

/**
 * One drop, shelved like a record shop would: artists in a seeded mixed order,
 * one sleeve per artist per pass, so a three-album artist doesn't fill a row.
 */
function spreadDrop(drop) {
  if (drop.length < 3) return drop;
  const seed = drop[0].arrivedAt;
  const byArtist = new Map();
  for (const album of drop) {
    const key = artistKey(album);
    if (!byArtist.has(key)) byArtist.set(key, []);
    byArtist.get(key).push(album);
  }
  const groups = [...byArtist.entries()]
    .map(([key, list]) => ({ order: hashSeed(`${seed}:${key}`), list }))
    .sort((a, b) => a.order - b.order)
    .map((g) => g.list);
  const out = [];
  for (let pass = 0; out.length < drop.length; pass += 1) {
    for (const list of groups) {
      if (list[pass]) out.push(list[pass]);
    }
  }
  return out;
}

export function rankNewReleaseAlbums(tracks = []) {
  const indexMap = catalogIndexMap(tracks);
  const sorted = getCatalogEntities(tracks).albums
    .filter(isShopAlbum)
    .map((album) => ({
      ...album,
      arrivedAt: albumArrivedAt(album),
      catalogIndex: albumCatalogIndex(album, indexMap),
    }))
    .sort(
      (a, b) =>
        b.arrivedAt - a.arrivedAt ||
        a.catalogIndex - b.catalogIndex ||
        a.title.localeCompare(b.title)
    );

  const out = [];
  let drop = [];
  for (const album of sorted) {
    if (drop.length && drop[0].arrivedAt - album.arrivedAt > DROP_WINDOW_MS) {
      out.push(...spreadDrop(drop));
      drop = [];
    }
    drop.push(album);
  }
  out.push(...spreadDrop(drop));
  return out;
}

/** Newest shop albums, optionally in one channel bay. */
export function newReleaseAlbums(
  tracks = [],
  { channelId = null, limit = NEW_RELEASES_LIMIT, ranked = null } = {}
) {
  const channel = channelId ? getSceneChannel(channelId) : null;
  const list = (ranked || rankNewReleaseAlbums(tracks)).filter((album) =>
    albumInChannel(album, channel)
  );
  return list.slice(0, Math.max(0, Number(limit) || NEW_RELEASES_LIMIT));
}

/** Channel hanging signs that currently have a new sleeve. */
export function newReleaseBays(tracks = [], ranked = null) {
  const list = ranked || rankNewReleaseAlbums(tracks);
  if (!list.length) return [];
  return SCENE_CHANNELS.filter((channel) =>
    list.some((album) => albumInChannel(album, channel))
  ).map((channel) => ({
    id: channel.id,
    num: channel.num,
    title: channel.shortTitle || channel.title,
    accent: channel.accent || null,
  }));
}
