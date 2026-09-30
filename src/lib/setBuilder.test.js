import {
  SET_DURATIONS,
  SET_VIBE_ORDER,
  formatSetDuration,
  vibeEntries,
  groupSessionPhases,
  sessionStats,
  stripSessionMeta,
  filterTracksForSet,
  genresInPool,
  sampleEnergyArc,
  sampleSessionEnergy,
  energyArcPath,
  energyWaveformBars,
  setTitle,
} from "./setBuilder";
import { SESSION_PROFILES } from "./engine";

const mk = (over = {}) => ({
  id: over.id || Math.random().toString(36).slice(2),
  title: "Cut",
  artist: "Signal",
  duration: 180,
  energy: 5,
  genre: "Electronic",
  ...over,
});

describe("setBuilder", () => {
  test("duration labels cover the booth keys", () => {
    expect(SET_DURATIONS.map((d) => d.minutes)).toEqual([30, 60, 120, 240, 480]);
    expect(formatSetDuration(30)).toBe("30 min");
    expect(formatSetDuration(60)).toBe("1 hour");
    expect(formatSetDuration(120)).toBe("2 hours");
    expect(formatSetDuration(480)).toBe("All night");
  });

  test("vibe order matches known session profiles", () => {
    SET_VIBE_ORDER.forEach((id) => {
      expect(SESSION_PROFILES[id]).toBeDefined();
    });
    expect(vibeEntries()).toHaveLength(SET_VIBE_ORDER.length);
  });

  test("groups tracks by _phase and strips meta for play", () => {
    const session = [
      mk({ id: "a", _phase: "Warm up" }),
      mk({ id: "b", _phase: "Warm up" }),
      mk({ id: "c", _phase: "Peak" }),
    ];
    const groups = groupSessionPhases(session);
    expect(groups.map((g) => g.name)).toEqual(["Warm up", "Peak"]);
    expect(groups[0].tracks).toHaveLength(2);
    expect(stripSessionMeta(session)[0]._phase).toBeUndefined();
    expect(stripSessionMeta(session)[0].id).toBe("a");
  });

  test("sessionStats counts minutes and unique covers", () => {
    const stats = sessionStats([
      mk({ duration: 60, albumCover: "/a.png" }),
      mk({ duration: 60, albumCover: "/a.png" }),
      mk({ duration: 60, albumCover: "/b.png" }),
    ]);
    expect(stats.tracks).toBe(3);
    expect(stats.minutes).toBe(3);
    expect(stats.covers).toEqual(["/a.png", "/b.png"]);
  });

  test("genre filter keeps a viable pool and lists canonical genres", () => {
    const lib = [
      mk({ id: "e1", genre: "Electronic" }),
      mk({ id: "e2", genre: "Electronic" }),
      mk({ id: "e3", genre: "Electronic" }),
      mk({ id: "r1", genre: "Rock" }),
    ];
    expect(filterTracksForSet(lib, "Electronic")).toHaveLength(3);
    expect(filterTracksForSet(lib, "Jazz")).toHaveLength(4);
    expect(genresInPool(lib)).toEqual(["Electronic", "Rock"]);
  });

  test("energy arc samples a party profile into a drawable path", () => {
    const points = sampleEnergyArc(SESSION_PROFILES.party, 24);
    expect(points).toHaveLength(25);
    expect(points[0].t).toBe(0);
    expect(points[points.length - 1].t).toBe(1);
    const peak = Math.max(...points.map((p) => p.energy));
    expect(peak).toBeGreaterThanOrEqual(8);
    const { line, area, xy } = energyArcPath(points, { width: 200, height: 80 });
    expect(line.startsWith("M")).toBe(true);
    expect(area.endsWith("Z")).toBe(true);
    expect(xy).toHaveLength(points.length);
    const bars = energyWaveformBars(points, 16);
    expect(bars).toHaveLength(16);
    expect(bars[0].height).toBeGreaterThan(0);
  });

  test("session energy follows track energies across time", () => {
    const points = sampleSessionEnergy([
      mk({ duration: 100, energy: 2 }),
      mk({ duration: 100, energy: 9 }),
    ], 10);
    expect(points[0].energy).toBe(2);
    expect(points[points.length - 1].energy).toBe(9);
  });

  test("setTitle is the booth headline", () => {
    expect(setTitle(SESSION_PROFILES.night, 60)).toBe("Night out · 1 hour");
  });
});
