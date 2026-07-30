import {
  tracksForMixLane,
  mixLaneById,
  mixLaneForDate,
  MIX_LANES,
  trackFitsDaytime,
  trackFitsNighttime,
} from "./mixLanes";

const tracks = [
  { id: "1", genre: "Jazz", energy: 3, duration: 200 },
  { id: "2", genre: "House", energy: 8, duration: 220 },
  { id: "3", genre: "Rock", energy: 7, duration: 210 },
  { id: "4", genre: "Hip-Hop", energy: 6, duration: 190 },
  { id: "5", genre: "Metal", energy: 9, duration: 1200 },
  { id: "6", genre: "Soul", energy: 4, duration: 195 },
  { id: "7", genre: "Classical", energy: 2, duration: 240 },
];

describe("mixLanes", () => {
  test("exports daytime and nighttime", () => {
    expect(MIX_LANES.map((m) => m.id)).toEqual(["daytime", "nighttime"]);
  });

  test("mixLaneForDate maps hours to mix lanes", () => {
    expect(mixLaneForDate(9).id).toBe("daytime");
    expect(mixLaneForDate(12).id).toBe("daytime");
    expect(mixLaneForDate(17).id).toBe("daytime");
    expect(mixLaneForDate(18).id).toBe("nighttime");
    expect(mixLaneForDate(23).id).toBe("nighttime");
    expect(mixLaneForDate(3).id).toBe("nighttime");
  });

  test("playable singles only", () => {
    const pool = tracksForMixLane(tracks, "daytime");
    expect(pool.some((t) => t.id === "5")).toBe(false);
  });

  test("Electronic and Hip-Hop fit both mix lanes", () => {
    const house = tracks.find((t) => t.id === "2");
    const hip = tracks.find((t) => t.id === "4");
    expect(trackFitsDaytime(house)).toBe(true);
    expect(trackFitsNighttime(house)).toBe(true);
    expect(trackFitsDaytime(hip)).toBe(true);
    expect(trackFitsNighttime(hip)).toBe(true);
  });

  test("soft jazz leans nighttime; bright rock leans daytime", () => {
    expect(trackFitsNighttime(tracks.find((t) => t.id === "1"))).toBe(true);
    expect(trackFitsDaytime(tracks.find((t) => t.id === "1"))).toBe(false);
    expect(trackFitsDaytime(tracks.find((t) => t.id === "3"))).toBe(true);
  });

  test("daytime and nighttime pools overlap", () => {
    const day = new Set(tracksForMixLane(tracks, "daytime").map((t) => t.id));
    const night = new Set(tracksForMixLane(tracks, "nighttime").map((t) => t.id));
    const overlap = [...day].filter((id) => night.has(id));
    expect(overlap.length).toBeGreaterThan(0);
    expect(overlap).toEqual(expect.arrayContaining(["2", "4", "6"]));
  });

  test("mixLaneById falls back to daytime", () => {
    expect(mixLaneById("unknown").id).toBe("daytime");
  });

  test("legacy lane ids resolve via current mix lane", () => {
    const pool = tracksForMixLane(tracks, "main");
    expect(pool.length).toBeGreaterThan(0);
  });
});
