import {
  sortTracksNewestFirst,
  countPlayableTracks,
  mapTrackDoc,
  isCatalogCacheFresh,
  toLiteTrack,
  fetchHomeLite,
  HOME_LITE_LIMIT,
  CATALOG_CACHE_TTL_MS,
} from "./catalogLoad";

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((...path) => ({ path })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  collection: jest.fn((...args) => ({ args })),
  query: jest.fn((ref, ...rest) => ({ ref, rest })),
  orderBy: jest.fn((...args) => ({ orderBy: args })),
  limit: jest.fn((n) => ({ limit: n })),
}));

const { getDoc, getDocs } = require("firebase/firestore");

beforeEach(() => {
  getDoc.mockReset();
  getDocs.mockReset();
});

describe("catalogLoad", () => {
  test("sortTracksNewestFirst orders by createdAt", () => {
    const sorted = sortTracksNewestFirst([
      { id: "a", title: "A", createdAt: { seconds: 10 } },
      { id: "b", title: "B", createdAt: { seconds: 100 } },
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["b", "a"]);
  });

  test("countPlayableTracks requires audioUrl", () => {
    expect(countPlayableTracks([
      { audioUrl: "https://x/a.mp3" },
      { audioUrl: "" },
      {},
    ])).toBe(1);
  });

  test("mapTrackDoc sets id and liked default", () => {
    const t = mapTrackDoc({
      id: "doc1",
      data: () => ({ title: "Hi" }),
    });
    expect(t.id).toBe("doc1");
    expect(t.title).toBe("Hi");
    expect(t.liked).toBe(false);
  });

  test("isCatalogCacheFresh respects TTL", () => {
    const now = 1_000_000;
    expect(isCatalogCacheFresh(null, now)).toBe(false);
    expect(isCatalogCacheFresh({ ts: now, tracks: [] }, now)).toBe(false);
    expect(isCatalogCacheFresh({ ts: now - 1000, tracks: [{ id: "a" }] }, now)).toBe(true);
    expect(isCatalogCacheFresh({
      ts: now - CATALOG_CACHE_TTL_MS - 1,
      tracks: [{ id: "a" }],
    }, now)).toBe(false);
  });

  test("toLiteTrack keeps play fields and drops unknown extras", () => {
    const lite = toLiteTrack({
      id: "x",
      title: "Hi",
      audioUrl: "https://x/a.mp3",
      mysteryBlob: "nope",
    });
    expect(lite.id).toBe("x");
    expect(lite.title).toBe("Hi");
    expect(lite.audioUrl).toBe("https://x/a.mp3");
    expect(lite.mysteryBlob).toBeUndefined();
  });

  test("fetchHomeLite prefers catalog/homeLite doc over a full scan", async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        tracks: [
          { id: "a", title: "A", createdAt: { seconds: 1 }, audioUrl: "https://x/a.mp3" },
          { id: "b", title: "B", createdAt: { seconds: 9 }, audioUrl: "https://x/b.mp3" },
        ],
      }),
    });
    const result = await fetchHomeLite({});
    expect(result.source).toBe("lite-doc");
    expect(result.tracks.map((t) => t.id)).toEqual(["b", "a"]);
    expect(getDocs).not.toHaveBeenCalled();
  });

  test("fetchHomeLite falls back to a limited query", async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    getDocs.mockResolvedValueOnce({
      docs: [
        { id: "z", data: () => ({ title: "Z", createdAt: { seconds: 3 }, audioUrl: "https://x/z.mp3" }) },
      ],
    });
    const result = await fetchHomeLite({});
    expect(result.source).toBe("lite-query");
    expect(result.tracks).toHaveLength(1);
    expect(HOME_LITE_LIMIT).toBe(48);
  });
});
