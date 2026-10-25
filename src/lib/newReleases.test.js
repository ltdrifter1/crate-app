import { newReleaseAlbums, newReleaseBays, arrivedAtMs, rankNewReleaseAlbums } from "./newReleases";

/** Separate drops sit hours apart; one bulk upload lands within seconds. */
const HOUR = 3600;

const cover = "sleeve.jpg";

function track(partial) {
  return {
    duration: 200,
    audioUrl: "u",
    albumCover: cover,
    ...partial,
  };
}

const catalog = [
  track({
    id: "old",
    title: "First Light",
    artist: "Willow",
    album: "Highways",
    genre: "Country & Folk",
    createdAt: { seconds: 10 * HOUR },
  }),
  track({
    id: "old-2",
    title: "Porch",
    artist: "Willow",
    album: "Highways",
    genre: "Country & Folk",
    createdAt: { seconds: 11 * HOUR },
  }),
  track({
    id: "mid",
    title: "Warehouse",
    artist: "Gridlock",
    album: "Night Shift",
    genre: "Techno",
    createdAt: { seconds: 50 * HOUR },
  }),
  track({
    id: "mid-2",
    title: "Concrete",
    artist: "Gridlock",
    album: "Night Shift",
    genre: "Techno",
    createdAt: { seconds: 51 * HOUR },
  }),
  track({
    id: "new",
    title: "Riff",
    artist: "Ash",
    album: "Gain",
    genre: "Metal",
    createdAt: { seconds: 90 * HOUR },
  }),
  track({
    id: "new-2",
    title: "Slag",
    artist: "Ash",
    album: "Gain",
    genre: "Metal",
    createdAt: { seconds: 91 * HOUR },
  }),
  track({
    id: "dump",
    title: "Loose",
    artist: "Nobody",
    album: "",
    albumCover: cover,
    genre: "Pop",
    createdAt: { seconds: 200 * HOUR },
  }),
  track({
    id: "blank",
    title: "No Art",
    artist: "Ghost",
    album: "Void",
    albumCover: "",
    genre: "Jazz",
    createdAt: { seconds: 300 * HOUR },
  }),
];

describe("newReleases", () => {
  test("arrivedAtMs reads Firestore-ish timestamps", () => {
    expect(arrivedAtMs({ seconds: 2 })).toBe(2000);
    expect(arrivedAtMs(new Date(5000))).toBe(5000);
    expect(arrivedAtMs("1970-01-01T00:00:08.000Z")).toBe(8000);
  });

  test("newest albums first, singles dump and coverless dropped", () => {
    const albums = newReleaseAlbums(catalog);
    expect(albums.map((a) => a.title)).toEqual(["Gain", "Night Shift", "Highways"]);
    expect(albums.every((a) => a.coverTrack?.albumCover)).toBe(true);
  });

  test("channel bay keeps metal and drops folk", () => {
    const metal = newReleaseAlbums(catalog, { channelId: "metal" });
    expect(metal.map((a) => a.title)).toEqual(["Gain"]);
    const folk = newReleaseAlbums(catalog, { channelId: "country-folk" });
    expect(folk.map((a) => a.title)).toEqual(["Highways"]);
  });

  test("bays omit empty channels and keep order by dial number", () => {
    const bays = newReleaseBays(catalog);
    const ids = bays.map((b) => b.id);
    expect(ids).toEqual(expect.arrayContaining(["metal", "techno", "country-folk"]));
    expect(ids).not.toContain("uk-garage");
    const metal = bays.find((b) => b.id === "metal");
    const techno = bays.find((b) => b.id === "techno");
    expect(metal.num).toBeGreaterThan(techno.num);
  });

  test("one bulk drop is not shelved A→Z: artists mixed, one sleeve each per pass", () => {
    const names = ["Zumpano", "Zoser", "Young Fresh Fellows", "XTC", "X-Ray Spex", "Yume Bitsu"];
    const drop = [];
    names.forEach((artist, i) => {
      drop.push(track({
        id: `${artist}-a`,
        title: "A",
        artist,
        album: `${artist} One`,
        genre: "Rock",
        createdAt: { seconds: 1000 * HOUR - i },
      }));
    });
    ["Two", "Three"].forEach((n, i) => {
      drop.push(track({
        id: `yff-${n}`,
        title: n,
        artist: "Young Fresh Fellows",
        album: `Young Fresh Fellows ${n}`,
        genre: "Rock",
        createdAt: { seconds: 1000 * HOUR - 10 - i },
      }));
    });
    const ranked = rankNewReleaseAlbums([...catalog, ...drop]);
    const head = ranked.slice(0, drop.length);
    // The whole drop still leads the older albums…
    expect(head.map((a) => a.title).sort()).toEqual(drop.map((t) => t.album).sort());
    expect(ranked.slice(drop.length).map((a) => a.title)).toEqual(["Gain", "Night Shift", "Highways"]);
    // …but not in arrival (alphabetical) order, and no artist repeats until every artist has had a turn.
    expect(head.map((a) => a.title)).not.toEqual(drop.map((t) => t.album));
    const firstPass = head.slice(0, names.length).map((a) => a.artist);
    expect(new Set(firstPass).size).toBe(names.length);
    // Stable for the same drop.
    expect(rankNewReleaseAlbums([...catalog, ...drop]).map((a) => a.title)).toEqual(ranked.map((a) => a.title));
  });

  test("unknown channel id falls back to the full floor", () => {
    expect(newReleaseAlbums(catalog, { channelId: "not-a-channel" }).map((a) => a.title)).toEqual([
      "Gain",
      "Night Shift",
      "Highways",
    ]);
  });
});
