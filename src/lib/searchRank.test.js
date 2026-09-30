import { rankSearchResults } from "./searchRank";

describe("rankSearchResults", () => {
  const tracks = [
    { id: "1", title: "Pulse", artist: "Four Tet", album: "Rounds", genre: "House", liked: true, playCount: 4 },
    { id: "2", title: "Night Ride", artist: "Pulse", album: "Drive", genre: "Techno", energy: 7, bpm: 128 },
  ];

  test("ranks title prefix above artist substring", () => {
    const hits = rankSearchResults(tracks, "pulse");
    expect(hits[0].id).toBe("1");
  });

  test("energy query", () => {
    expect(rankSearchResults(tracks, "e7").map((t) => t.id)).toEqual(["2"]);
  });

  test("empty query", () => {
    expect(rankSearchResults(tracks, "")).toEqual([]);
  });
});
