import {
  sortTracksNewestFirst,
  countPlayableTracks,
  mapTrackDoc,
  isCatalogCacheFresh,
  toLiteTrack,
  fetchHomeLite,
  HOME_LITE_LIMIT,
  HOME_LITE_HEAT_LIMIT,
  CATALOG_CACHE_TTL_MS,
  mergeHomeLiteTracks,
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
    getDocs.mockResolvedValue({
      docs: [
        { id: "z", data: () => ({ title: "Z", createdAt: { seconds: 3 }, audioUrl: "https://x/z.mp3" }) },
      ],
    });
    const result = await fetchHomeLite({});
    expect(result.source).toBe("lite-query");
    expect(result.tracks).toHaveLength(1);
    expect(HOME_LITE_LIMIT).toBe(48);
    expect(HOME_LITE_HEAT_LIMIT).toBe(16);
    expect(getDocs).toHaveBeenCalled();
  });

  test("mergeHomeLiteTracks reserves hottest cuts then fills with newest", () => {
    const newest = [
      { id: "n1", title: "New" },
      { id: "hot", title: "Also new" },
    ];
    const hottest = [{ id: "hot", title: "Heat", playCount: 40 }];
    const merged = mergeHomeLiteTracks(newest, hottest, 3);
    expect(merged[0].id).toBe("hot");
    expect(merged.map((t) => t.id)).toEqual(["hot", "n1"]);
  });

  test("parseCatalogCdnPayload sorts and requires ids", () => {
    const { parseCatalogCdnPayload, catalogCdnEnabled, defaultCatalogCdnUrl } = require("./catalogLoad");
    expect(parseCatalogCdnPayload({ tracks: [] })).toBeNull();
    const parsed = parseCatalogCdnPayload({
      ts: 9,
      tracks: [
        { id: "a", title: "A", createdAt: { seconds: 1 } },
        { id: "b", title: "B", createdAt: { seconds: 8 } },
        { title: "no-id" },
      ],
    });
    expect(parsed.source).toBe("cdn");
    expect(parsed.tracks.map((t) => t.id)).toEqual(["b", "a"]);
    expect(parsed.version).toBe(9);
    expect(catalogCdnEnabled()).toBe(true);
    expect(defaultCatalogCdnUrl()).toContain("catalog%2Fv1.json");
  });

  test("isNewerCatalog compares versions", () => {
    const { isNewerCatalog } = require("./catalogLoad");
    expect(isNewerCatalog(null, { tracks: [{ id: "a" }], version: 1 })).toBe(false);
    expect(isNewerCatalog({ tracks: [{ id: "a" }], version: 2 }, { tracks: [{ id: "a" }], version: 1 })).toBe(true);
    expect(isNewerCatalog({ tracks: [{ id: "a" }], version: 1 }, { tracks: [{ id: "a" }], version: 2 })).toBe(false);
  });

  test("loadCatalogFirstPaint prefers IDB then CDN and never touches Firestore", async () => {
    const { loadCatalogFirstPaint } = require("./catalogLoad");
    const fetchCdn = jest.fn(async () => ({
      source: "cdn",
      version: 3,
      tracks: [{ id: "cdn" }],
    }));
    const fromCdn = await loadCatalogFirstPaint({ fetchCdn });
    expect(fromCdn.source).toBe("cdn");
    expect(fetchCdn).toHaveBeenCalled();
    expect(getDocs).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
  });

  test("fetchCatalogCdn returns null on 404", async () => {
    const { fetchCatalogCdn } = require("./catalogLoad");
    const fetchImpl = jest.fn(async () => ({ ok: false }));
    expect(await fetchCatalogCdn({ fetchImpl, timeoutMs: 50 })).toBeNull();
  });

  test("fetchCatalogTracks prefers CDN JSON over Firestore", async () => {
    const { fetchCatalogTracks } = require("./catalogLoad");
    const orig = global.fetch;
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        ts: 1,
        tracks: [{ id: "cdn", title: "From CDN", createdAt: { seconds: 2 } }],
      }),
    }));
    try {
      const tracks = await fetchCatalogTracks({});
      expect(tracks.map((t) => t.id)).toEqual(["cdn"]);
      expect(getDocs).not.toHaveBeenCalled();
    } finally {
      global.fetch = orig;
    }
  });
});
