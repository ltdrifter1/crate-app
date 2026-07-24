import {
  slugify,
  buildArtists,
  buildAlbums,
  findArtist,
  findAlbum,
  searchEntities,
  linerNotesFor,
} from "./catalog";
import { listPaths, findPath, resolvePath, SEED_PATHS } from "./paths";
import { parsePath, buildPath, documentTitleFor } from "./routes";

describe("catalog", () => {
  const tracks = [
    { id: "1", title: "A", artist: "Four Tet", album: "Rounds", genre: "House", energy: 5, duration: 200, albumCover: "x", playCount: 3, liked: true, bpm: 120, camelot: "8A" },
    { id: "2", title: "B", artist: "Four Tet", album: "Rounds", genre: "House", energy: 6, duration: 210, playCount: 1 },
    { id: "3", title: "C", artist: "Burial", album: "Untrue", genre: "House", energy: 3, duration: 240, liked: false },
  ];

  test("slugify", () => {
    expect(slugify("Four Tet")).toBe("four-tet");
    expect(slugify("R&B")).toBe("r-and-b");
  });

  test("buildArtists aggregates", () => {
    const artists = buildArtists(tracks);
    const ft = artists.find((a) => a.slug === "four-tet");
    expect(ft.count).toBe(2);
    expect(ft.albums.length).toBeGreaterThanOrEqual(1);
  });

  test("findAlbum by composite slug", () => {
    const al = findAlbum(tracks, "four-tet__rounds");
    expect(al.title).toBe("Rounds");
    expect(al.count).toBe(2);
  });

  test("searchEntities", () => {
    const { artists, albums } = searchEntities(tracks, "four");
    expect(artists.some((a) => a.slug === "four-tet")).toBe(true);
    expect(albums.some((a) => a.slug === "four-tet__rounds")).toBe(true);
  });

  test("linerNotesFor", () => {
    const notes = linerNotesFor(tracks[0]);
    expect(notes.paragraphs.length).toBeGreaterThan(0);
    expect(notes.credits.some((c) => c.label === "Key")).toBe(true);
  });

  test("findArtist missing", () => {
    expect(findArtist(tracks, "nope")).toBeNull();
  });
});

describe("paths", () => {
  const tracks = [
    { id: "1", title: "Soft", artist: "A", genre: "Jazz", energy: 2, duration: 180, liked: true },
    { id: "2", title: "Peak", artist: "B", genre: "House", energy: 9, duration: 200, playCount: 5 },
    { id: "3", title: "Rain", artist: "C", genre: "Soul", energy: 3, duration: 190 },
  ];

  test("seed paths resolve when rooms have tracks", () => {
    const paths = listPaths(tracks);
    expect(paths.length).toBeGreaterThan(0);
    expect(SEED_PATHS.length).toBeGreaterThanOrEqual(4);
  });

  test("findPath returns journey playlist", () => {
    const p = findPath("hidden-to-peak", tracks);
    expect(p).toBeTruthy();
    if (p.ready) expect(p.playlist.length).toBeGreaterThan(0);
  });

  test("lineage path uses seed", () => {
    const seed = { ...tracks[0], _signal: { grip: 7, hold: 6, pull: 8, gravity: 5, lift: 4, descent: 3 } };
    const enriched = tracks.map((t) => ({
      ...t,
      _signal: t._signal || { grip: 5, hold: 5, pull: 5, gravity: 5, lift: 5, descent: 5 },
    }));
    const p = resolvePath(SEED_PATHS.find((x) => x.id === "lineage-pocket"), enriched, { seedTrack: seed });
    expect(p.ready).toBe(true);
    expect(p.playlist[0].id).toBe(seed.id);
  });
});

describe("routes entities", () => {
  test("parse artist album paths", () => {
    expect(parsePath("/artist/four-tet")).toEqual(
      expect.objectContaining({ screen: "artist", artistSlug: "four-tet" })
    );
    expect(parsePath("/album/four-tet__rounds")).toEqual(
      expect.objectContaining({ screen: "album", albumSlug: "four-tet__rounds" })
    );
    expect(parsePath("/paths/city-hop")).toEqual(
      expect.objectContaining({ screen: "paths", pathId: "city-hop" })
    );
  });

  test("buildPath for entities", () => {
    expect(buildPath("artist", { artistSlug: "burial" })).toBe("/artist/burial");
    expect(buildPath("album", { albumSlug: "burial__untrue" })).toBe("/album/burial__untrue");
    expect(buildPath("paths", { pathId: "city-hop" })).toBe("/paths/city-hop");
    expect(buildPath("paths")).toBe("/paths");
  });

  test("documentTitleFor with label", () => {
    expect(documentTitleFor("artist", "Four Tet")).toContain("Four Tet");
  });
});
