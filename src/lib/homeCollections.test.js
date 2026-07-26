import {
  buildHomeCollections,
  savedTracks,
  rediscoveredTracks,
  trendingTracks,
  recommendedTracks,
} from "./homeCollections";

describe("homeCollections", () => {
  const tracks = [
    { id: "1", title: "A", energy: 3, genre: "Jazz", duration: 180, liked: true, playCount: 2 },
    { id: "2", title: "B", energy: 8, genre: "House", duration: 200, liked: true, playCount: 0 },
    { id: "3", title: "C", energy: 2, genre: "Soul", duration: 210, liked: false, playCount: 1, _signal: { pull: 6 } },
    { id: "4", title: "D", energy: 9, genre: "House", duration: 190, playCount: 12, likeCount: 3 },
    { id: "5", title: "E", energy: 5, genre: "Jazz", duration: 200, playCount: 0 },
  ];

  test("savedTracks returns likes only", () => {
    expect(savedTracks(tracks).map((t) => t.id)).toEqual(["1", "2"]);
  });

  test("buildHomeCollections stays quiet — no Saved shelf, max two rails", () => {
    const cols = buildHomeCollections(tracks);
    expect(cols.every((c) => c.id !== "saved")).toBe(true);
    expect(cols.length).toBeLessThanOrEqual(2);
  });

  test("rediscoveredTracks finds quiet favourites", () => {
    expect(rediscoveredTracks(tracks).some((t) => t.id === "1" || t.id === "3")).toBe(true);
  });

  test("trendingTracks ranks by play heat", () => {
    expect(trendingTracks(tracks, 3).map((t) => t.id)[0]).toBe("4");
  });

  test("recommendedTracks uses taste when history exists", () => {
    const recs = recommendedTracks(tracks, { preferredGenres: ["Jazz"], limit: 3 });
    expect(recs.length).toBeLessThanOrEqual(3);
    expect(recs.some((t) => t.genre === "Jazz" || t.liked)).toBe(true);
  });

  test("recommendedTracks falls back to random sample with no history", () => {
    const cold = [
      { id: "a", title: "A", genre: "Rock", duration: 180 },
      { id: "b", title: "B", genre: "Pop", duration: 180 },
      { id: "c", title: "C", genre: "Soul", duration: 180 },
    ];
    const recs = recommendedTracks(cold, { limit: 2 });
    expect(recs).toHaveLength(2);
  });
});
