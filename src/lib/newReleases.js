/**
 * New Releases — newest sleeves on the Planet, filtered by channel.
 * Arrival = catalog ingest (`createdAt`), not street date.
 */
import { buildAlbums } from "./catalog";
import { getSceneChannel, SCENE_CHANNELS, trackMatchesChannel } from "./sceneChannels";

export const NEW_RELEASES_LIMIT = 24;
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

function rankAlbums(tracks = []) {
  const indexMap = catalogIndexMap(tracks);
  return buildAlbums(tracks)
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
}

/** Newest shop albums, optionally in one channel bay. */
export function newReleaseAlbums(
  tracks = [],
  { channelId = null, limit = NEW_RELEASES_LIMIT } = {}
) {
  const channel = channelId ? getSceneChannel(channelId) : null;
  const ranked = rankAlbums(tracks).filter((album) => albumInChannel(album, channel));
  return ranked.slice(0, Math.max(0, Number(limit) || NEW_RELEASES_LIMIT));
}

/** Channel hanging signs that currently have a new sleeve. */
export function newReleaseBays(tracks = []) {
  const ranked = rankAlbums(tracks);
  if (!ranked.length) return [];
  return SCENE_CHANNELS.filter((channel) =>
    ranked.some((album) => albumInChannel(album, channel))
  ).map((channel) => ({
    id: channel.id,
    num: channel.num,
    title: channel.shortTitle || channel.title,
  }));
}
