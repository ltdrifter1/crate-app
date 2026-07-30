import {
  classifyRelease,
  collectionStats,
  collectionStatsLabel,
} from "./collectionStats";

describe("collectionStats", () => {
  test("classifyRelease uses track counts", () => {
    expect(classifyRelease(1, "Hit")).toBe("single");
    expect(classifyRelease(3, "Short Run")).toBe("ep");
    expect(classifyRelease(7, "Long Play")).toBe("album");
    expect(classifyRelease(4, "")).toBe("single");
    expect(classifyRelease(2, "Singles & Unknown")).toBe("single");
  });

  test("aggregates albums eps singles from liked tracks", () => {
    const tracks = [
      { id: "1", artist: "A", album: "Big LP" },
      { id: "2", artist: "A", album: "Big LP" },
      { id: "3", artist: "A", album: "Big LP" },
      { id: "4", artist: "A", album: "Big LP" },
      { id: "5", artist: "A", album: "Big LP" },
      { id: "6", artist: "A", album: "Big LP" },
      { id: "7", artist: "A", album: "Big LP" },
      { id: "8", artist: "B", album: "Mini" },
      { id: "9", artist: "B", album: "Mini" },
      { id: "10", artist: "C", album: "" },
      { id: "11", artist: "D", album: "One Shot" },
    ];
    const stats = collectionStats(tracks);
    expect(stats.albums).toBe(1);
    expect(stats.eps).toBe(1);
    expect(stats.singles).toBe(2);
    expect(collectionStatsLabel(stats)).toContain("Album");
  });

  test("empty collection", () => {
    expect(collectionStats([])).toEqual({ albums: 0, eps: 0, singles: 0, releases: [] });
    expect(collectionStatsLabel(collectionStats([]))).toBe("No collection yet");
  });
});
