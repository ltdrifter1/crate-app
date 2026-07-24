import {
  buildHomeCollections,
  savedTracks,
  rediscoveredTracks,
} from "./homeCollections";

describe("homeCollections", () => {
  const tracks = [
    { id: "1", title: "A", energy: 3, genre: "Jazz", duration: 180, liked: true, playCount: 2 },
    { id: "2", title: "B", energy: 8, genre: "House", duration: 200, liked: true, playCount: 0 },
    { id: "3", title: "C", energy: 2, genre: "Soul", duration: 210, liked: false, playCount: 1, _signal: { pull: 6 } },
    { id: "4", title: "D", energy: 9, genre: "House", duration: 190 },
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
});
