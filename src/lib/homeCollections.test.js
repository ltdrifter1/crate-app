import {
  buildHomeCollections,
  savedTracks,
  rediscoveredTracks,
  trendingTracks,
  recommendedTracks,
  recommendedPicks,
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

  test("recommendedTracks falls back to stable sample with no history", () => {
    const cold = [
      { id: "a", title: "A", genre: "Rock", duration: 180, playCount: 2 },
      { id: "b", title: "B", genre: "Pop", duration: 180, playCount: 0 },
      { id: "c", title: "C", genre: "Soul", duration: 180 },
    ];
    const recs = recommendedTracks(cold, { limit: 2 });
    expect(recs).toHaveLength(2);
    const again = recommendedTracks(cold, { limit: 2 });
    expect(again.map((t) => t.id)).toEqual(recs.map((t) => t.id));
  });

  test("recommendedPicks marks cold start and labels fresh picks", () => {
    const cold = [
      { id: "a", title: "A", genre: "Rock", duration: 180 },
      { id: "b", title: "B", genre: "Pop", duration: 180 },
    ];
    const { picks, coldStart } = recommendedPicks(cold, { limit: 2 });
    expect(coldStart).toBe(true);
    expect(picks.every((p) => p.reason === "Fresh pick")).toBe(true);
  });

  test("recommendedPicks explains picks when history exists", () => {
    const { picks, coldStart } = recommendedPicks(tracks, { preferredGenres: ["Jazz"], limit: 4 });
    expect(coldStart).toBe(false);
    expect(picks.every((p) => typeof p.reason === "string" && p.reason.length > 0)).toBe(true);
    const likedPick = picks.find((p) => p.track.liked);
    if (likedPick) expect(likedPick.reason).toBe("Saved");
  });

  test("recommendedPicks honors excludeIds", () => {
    const { picks } = recommendedPicks(tracks, { preferredGenres: ["Jazz"], excludeIds: ["1", "2"], limit: 10 });
    expect(picks.some((p) => p.track.id === "1" || p.track.id === "2")).toBe(false);
  });
});
