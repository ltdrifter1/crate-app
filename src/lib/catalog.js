/** Catalog entities — artists & albums derived from the track library. */

export function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";
}

function singles(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900);
}

/** Aggregate artists from tracks. */
export function buildArtists(tracks = []) {
  const map = new Map();
  singles(tracks).forEach((t) => {
    const name = (t.artist || "").trim();
    if (!name) return;
    const slug = slugify(name);
    if (!map.has(slug)) {
      map.set(slug, {
        slug,
        name,
        tracks: [],
        genres: new Map(),
        totalPlays: 0,
        liked: 0,
      });
    }
    const a = map.get(slug);
    a.tracks.push(t);
    a.totalPlays += t.playCount || 0;
    if (t.liked) a.liked += 1;
    const g = t.genre;
    if (g) a.genres.set(g, (a.genres.get(g) || 0) + 1);
  });

  return [...map.values()]
    .map((a) => {
      const topGenre = [...a.genres.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] || "";
      const coverTrack =
        [...a.tracks].sort((x, y) => {
          const score = (t) => (t.liked ? 4 : 0) + (t.playCount || 0) + (t.albumCover ? 2 : 0);
          return score(y) - score(x);
        })[0] || null;
      const avgEnergy =
        a.tracks.reduce((s, t) => s + (t.energy || 5), 0) / Math.max(a.tracks.length, 1);
      const albums = buildAlbumsForArtist(a.tracks, a.name);
      return {
        slug: a.slug,
        name: a.name,
        tracks: a.tracks,
        count: a.tracks.length,
        liked: a.liked,
        totalPlays: a.totalPlays,
        topGenre,
        coverTrack,
        avgEnergy: Math.round(avgEnergy * 10) / 10,
        albums,
        story: artistStory(a.name, topGenre, a.tracks.length),
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function buildAlbumsForArtist(tracks, artistName) {
  const map = new Map();
  tracks.forEach((t) => {
    const album = (t.album || "").trim() || "Singles & Unknown";
    const key = `${slugify(artistName)}__${slugify(album)}`;
    if (!map.has(key)) {
      map.set(key, { slug: key, title: album, artist: artistName, tracks: [] });
    }
    map.get(key).tracks.push(t);
  });
  return [...map.values()]
    .map((al) => enrichAlbum(al))
    .sort((a, b) => b.count - a.count);
}

function enrichAlbum(al) {
  const coverTrack =
    al.tracks.find((t) => t.albumCover) ||
    [...al.tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0] ||
    null;
  const avgEnergy =
    al.tracks.reduce((s, t) => s + (t.energy || 5), 0) / Math.max(al.tracks.length, 1);
  const bpm = al.tracks.map((t) => t.bpm).filter(Boolean);
  const avgBpm = bpm.length ? Math.round(bpm.reduce((s, v) => s + v, 0) / bpm.length) : null;
  const keys = [...new Set(al.tracks.map((t) => t.camelot).filter(Boolean))];
  return {
    ...al,
    count: al.tracks.length,
    coverTrack,
    avgEnergy: Math.round(avgEnergy * 10) / 10,
    avgBpm,
    keys,
    story: albumStory(al.title, al.artist, al.tracks.length),
  };
}

/** All albums across the catalog. */
export function buildAlbums(tracks = []) {
  const map = new Map();
  singles(tracks).forEach((t) => {
    const artist = (t.artist || "").trim() || "Unknown";
    const album = (t.album || "").trim() || "Singles & Unknown";
    const slug = `${slugify(artist)}__${slugify(album)}`;
    if (!map.has(slug)) {
      map.set(slug, { slug, title: album, artist, artistSlug: slugify(artist), tracks: [] });
    }
    map.get(slug).tracks.push(t);
  });
  return [...map.values()]
    .map(enrichAlbum)
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
}

/** Cache entity indexes by tracks array identity — rebuild only when catalog changes. */
let _entityCache = { tracksRef: null, artists: null, albums: null };

export function getCatalogEntities(tracks = []) {
  if (_entityCache.tracksRef === tracks && _entityCache.artists && _entityCache.albums) {
    return { artists: _entityCache.artists, albums: _entityCache.albums };
  }
  const artists = buildArtists(tracks);
  const albums = buildAlbums(tracks);
  _entityCache = { tracksRef: tracks, artists, albums };
  return { artists, albums };
}

export function findArtist(tracks, slug) {
  if (!slug) return null;
  return getCatalogEntities(tracks).artists.find((a) => a.slug === slug) || null;
}

export function findAlbum(tracks, slug) {
  if (!slug) return null;
  return getCatalogEntities(tracks).albums.find((a) => a.slug === slug) || null;
}

export function artistStory(name, genre, count) {
  const first = String(name || "This artist").split(/\s+/)[0];
  if (genre && count >= 8) {
    return `${first} keeps showing up in ${genre} — a crate you can live in for a while.`;
  }
  if (genre) {
    return `Most often filed under ${genre}. ${count} cut${count === 1 ? "" : "s"} worth knowing by name.`;
  }
  return `${count} track${count === 1 ? "" : "s"} in your rooms — follow the sleeve, not the folder.`;
}

export function albumStory(title, artist, count) {
  if (count <= 3) {
    return `A short release from ${artist} — treat it as one sitting.`;
  }
  return `“${title}” as an object: ${count} tracks from ${artist}, meant to be heard in order when you can.`;
}

/** Search hits that are entities, not only tracks. */
export function searchEntities(tracks, query) {
  const q = String(query || "").trim().toLowerCase();
  if (q.length < 2) return { artists: [], albums: [] };
  const { artists: allArtists, albums: allAlbums } = getCatalogEntities(tracks);
  const artists = allArtists
    .filter((a) => a.name.toLowerCase().includes(q))
    .slice(0, 6);
  const albums = allAlbums
    .filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q)
    )
    .slice(0, 6);
  return { artists, albums };
}

/** Soft liner notes from available metadata (until editorial CMS exists). */
export function linerNotesFor(track) {
  if (!track) return null;
  const notes = [];
  if (track.album) notes.push({ label: "Release", value: track.album });
  if (track.genre) notes.push({ label: "Lane", value: track.genre });
  if (track.bpm && track.camelot) {
    notes.push({ label: "Handoff", value: `${track.camelot} · ${track.bpm} BPM` });
  } else {
    if (track.bpm) notes.push({ label: "Tempo", value: `${track.bpm} BPM` });
    if (track.camelot) notes.push({ label: "Key", value: track.camelot });
  }
  if (track.liked) notes.push({ label: "Shelf", value: "Saved here" });

  const paragraphs = [
    track.album
      ? `From “${track.album}” — the sleeve is the doorway, not a filename.`
      : `A standalone cut from ${track.artist || "an unknown hand"}. File it by feel.`,
    track.camelot && track.bpm
      ? `Sits near ${track.camelot} at ${track.bpm} BPM — clean when the floor needs a handoff.`
      : null,
    track.energy != null
      ? track.energy >= 7
        ? "High pressure — peak-room weight. Give it space to land."
        : track.energy <= 3
          ? "Soft landing — closing-time energy, lights still warm."
          : "Mid-floor — builds without shouting."
      : null,
  ].filter(Boolean);

  return {
    title: track.title,
    artist: track.artist,
    paragraphs,
    credits: notes,
  };
}
