/**
 * Collections — what you own across digital + physical formats.
 * Supports "complete the copy" for artists with Club Copy editions.
 */
import { slugify } from "./catalog";
import { physicalStatusFor, canBuyPhysical } from "./physicalStatus";

export const COLLECTION_BUCKETS = [
  { id: "digital", label: "Digital" },
  { id: "vinyl", label: "Vinyl" },
  { id: "cassette", label: "Cassettes" },
  { id: "cd", label: "CD" },
  { id: "clubcopy", label: "Club Copy" },
  { id: "wishlist", label: "Wishlist" },
  { id: "owned", label: "Owned" },
];

export function emptyCollection() {
  return {
    digital: [],
    vinyl: [],
    cassette: [],
    cd: [],
    clubcopy: [],
    wishlist: [],
    owned: [],
  };
}

export function normalizeCollection(raw = {}) {
  const base = emptyCollection();
  COLLECTION_BUCKETS.forEach((b) => {
    const list = raw?.[b.id];
    base[b.id] = Array.isArray(list) ? list.filter(Boolean) : [];
  });
  return base;
}

/** Mark a digital track as owned in the member collection. */
export function addDigitalOwned(collection, trackId) {
  const next = normalizeCollection(collection);
  const id = String(trackId || "");
  if (!id) return next;
  if (!next.digital.includes(id)) next.digital = [...next.digital, id];
  if (!next.owned.includes(id)) next.owned = [...next.owned, id];
  return next;
}

/**
 * Artist collector status — how many Club Copy / physical editions you own
 * vs how many exist for that artist in the catalog.
 */
export function collectorStatusForArtist(artistTracks = [], collection = {}) {
  const col = normalizeCollection(collection);
  const ownedSet = new Set([...(col.clubcopy || []), ...(col.owned || []), ...(col.vinyl || [])]);

  const physical = [];
  const seen = new Set();
  (artistTracks || []).forEach((t) => {
    const key = t.clubCopyId || t.catalogNumber || `${t.album || t.title}:${t.id}`;
    const status = physicalStatusFor(t);
    const isPhysical =
      status.id !== "digital" || t.clubCopyId || t.catalogNumber || t.physicalEdition;
    if (!isPhysical) return;
    if (seen.has(key)) return;
    seen.add(key);
    physical.push({
      id: t.id,
      key,
      title: t.album || t.title,
      catalogNumber: t.catalogNumber || null,
      status,
      owned: ownedSet.has(t.id) || ownedSet.has(key),
      buyable: canBuyPhysical(status),
    });
  });

  const ownedCount = physical.filter((p) => p.owned).length;
  const total = physical.length;
  const missing = physical.filter((p) => !p.owned);

  return {
    total,
    owned: ownedCount,
    complete: total > 0 && ownedCount >= total,
    missing,
    label:
      total === 0
        ? "No physical editions yet"
        : ownedCount >= total
          ? "Collection complete"
          : `${ownedCount} / ${total} owned`,
    cta: missing[0]
      ? {
          trackId: missing[0].id,
          title: missing[0].title,
          line: total - ownedCount === 1 ? "One copy missing" : `${total - ownedCount} copies missing`,
        }
      : null,
  };
}

/**
 * Build collector rows for artists that have at least one physical/Club Copy edition.
 */
export function buildCollectorRows(tracks = [], collection = {}, { limit = 8 } = {}) {
  const byArtist = new Map();
  (tracks || []).forEach((t) => {
    const name = (t.artist || "").trim();
    if (!name) return;
    const slug = slugify(name);
    if (!byArtist.has(slug)) byArtist.set(slug, { slug, name, tracks: [] });
    byArtist.get(slug).tracks.push(t);
  });

  return [...byArtist.values()]
    .map((a) => {
      const status = collectorStatusForArtist(a.tracks, collection);
      return { ...a, collector: status };
    })
    .filter((a) => a.collector.total > 0)
    .sort(
      (a, b) =>
        b.collector.total - a.collector.total ||
        a.collector.owned - b.collector.owned ||
        a.name.localeCompare(b.name)
    )
    .slice(0, limit);
}
