import { newReleaseAlbums, newReleaseBays, arrivedAtMs } from "./newReleases";

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
    createdAt: { seconds: 10 },
  }),
  track({
    id: "old-2",
    title: "Porch",
    artist: "Willow",
    album: "Highways",
    genre: "Country & Folk",
    createdAt: { seconds: 11 },
  }),
  track({
    id: "mid",
    title: "Warehouse",
    artist: "Gridlock",
    album: "Night Shift",
    genre: "Techno",
    createdAt: { seconds: 50 },
  }),
  track({
    id: "mid-2",
    title: "Concrete",
    artist: "Gridlock",
    album: "Night Shift",
    genre: "Techno",
    createdAt: { seconds: 51 },
  }),
  track({
    id: "new",
    title: "Riff",
    artist: "Ash",
    album: "Gain",
    genre: "Metal",
    createdAt: { seconds: 90 },
  }),
  track({
    id: "new-2",
    title: "Slag",
    artist: "Ash",
    album: "Gain",
    genre: "Metal",
    createdAt: { seconds: 91 },
  }),
  track({
    id: "dump",
    title: "Loose",
    artist: "Nobody",
    album: "",
    albumCover: cover,
    genre: "Pop",
    createdAt: { seconds: 200 },
  }),
  track({
    id: "blank",
    title: "No Art",
    artist: "Ghost",
    album: "Void",
    albumCover: "",
    genre: "Jazz",
    createdAt: { seconds: 300 },
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

  test("unknown channel id falls back to the full floor", () => {
    expect(newReleaseAlbums(catalog, { channelId: "not-a-channel" }).map((a) => a.title)).toEqual([
      "Gain",
      "Night Shift",
      "Highways",
    ]);
  });
});
