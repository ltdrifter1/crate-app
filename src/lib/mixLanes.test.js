import { tracksForMixLane, mixLaneById, MIX_LANES } from "./mixLanes";

const tracks = [
  { id: "1", genre: "Jazz", energy: 3, duration: 200 },
  { id: "2", genre: "House", energy: 8, duration: 220 },
  { id: "3", genre: "Rock", energy: 7, duration: 210 },
  { id: "4", genre: "Hip-Hop", energy: 6, duration: 190 },
  { id: "5", genre: "Metal", energy: 9, duration: 1200 },
];

describe("mixLanes", () => {
  test("exports five lanes", () => {
    expect(MIX_LANES.map((m) => m.id)).toEqual([
      "main", "mellow", "electronic", "rock", "global",
    ]);
  });

  test("main returns playable singles", () => {
    const pool = tracksForMixLane(tracks, "main");
    expect(pool.some((t) => t.id === "5")).toBe(false);
    expect(pool.length).toBe(4);
  });

  test("mellow prefers low energy and soft genres", () => {
    const pool = tracksForMixLane(tracks, "mellow");
    expect(pool.some((t) => t.id === "1")).toBe(true);
  });

  test("rock filters rock and metal", () => {
    const pool = tracksForMixLane(tracks, "rock");
    expect(pool.map((t) => t.id)).toEqual(["3"]);
  });

  test("mixLaneById falls back to main", () => {
    expect(mixLaneById("unknown").id).toBe("main");
  });
});
