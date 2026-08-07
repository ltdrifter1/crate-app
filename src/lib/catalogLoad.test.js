import {
  sortTracksNewestFirst,
  countPlayableTracks,
  mapTrackDoc,
  isCatalogCacheFresh,
  CATALOG_CACHE_TTL_MS,
} from "./catalogLoad";

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
});
