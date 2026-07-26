import {
  sortTracksNewestFirst,
  countPlayableTracks,
  mapTrackDoc,
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
});
