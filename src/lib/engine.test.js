import {
  computeHumanState,
  computeSignalTraits,
  pickNextTrack,
  buildRoute,
  buildSession,
  SESSION_PROFILES,
} from "./engine";

const mkTrack = (over = {}) => ({
  id: Math.random().toString(36).slice(2),
  title: "t", artist: "a", genre: "House",
  energy: 5, camelot: "8A", duration: 200,
  playCount: 0, skipCount: 0, likeCount: 0,
  ...over,
});

describe("computeHumanState", () => {
  test("returns a neutral 'warming up' state with no history", () => {
    const s = computeHumanState([], null);
    expect(s.label).toBe("arrival");
    expect(s.intensity).toBeCloseTo(0.5);
  });

  test("high recent energy yields high intensity", () => {
    const now = Date.now();
    const plays = [9, 9, 9, 9, 9].map((e, i) => ({ id: `x${i}`, genre: "House", energy: e, ts: now - i * 60000 }));
    const s = computeHumanState(plays, now - 60000);
    expect(s.intensity).toBeGreaterThan(0.7);
  });

  test("always returns the full vector shape", () => {
    const s = computeHumanState([{ id: "a", genre: "House", energy: 5, ts: Date.now() }], Date.now());
    expect(s).toEqual(expect.objectContaining({
      intensity: expect.any(Number), openness: expect.any(Number),
      momentum: expect.any(Number), depth: expect.any(Number),
      direction: expect.any(Number), label: expect.any(String),
    }));
  });
});

describe("computeSignalTraits", () => {
  test("enriches each track with a _signal in 1..10 and a label", () => {
    const tracks = [mkTrack({ playCount: 10, likeCount: 2 }), mkTrack({ skipCount: 20, playCount: 5 })];
    const out = computeSignalTraits(tracks);
    expect(out).toHaveLength(2);
    for (const t of out) {
      expect(t._signal).toBeDefined();
      for (const k of ["grip", "hold", "pull", "gravity", "lift", "descent"]) {
        expect(t._signal[k]).toBeGreaterThanOrEqual(1);
        expect(t._signal[k]).toBeLessThanOrEqual(10);
      }
      expect(typeof t._signal.label).toBe("string");
    }
  });

  test("a frequently-skipped track has low grip", () => {
    const [t] = computeSignalTraits([mkTrack({ playCount: 10, skipCount: 9 })]);
    expect(t._signal.grip).toBeLessThan(4);
  });
});

describe("pickNextTrack", () => {
  test("returns null for an empty library", () => {
    expect(pickNextTrack([], null)).toBeNull();
  });

  test("never returns the current track", () => {
    const cur = mkTrack({ id: "cur" });
    const lib = [cur, mkTrack({ id: "a" }), mkTrack({ id: "b" })];
    for (let i = 0; i < 20; i++) {
      expect(pickNextTrack(lib, cur).id).not.toBe("cur");
    }
  });

  test("excludes long mixtapes (>900s) from radio", () => {
    const lib = [mkTrack({ id: "short", duration: 200 }), mkTrack({ id: "long", duration: 5000 })];
    for (let i = 0; i < 20; i++) {
      expect(pickNextTrack(lib, null).id).toBe("short");
    }
  });

  test("preferred genres bias the pick when energy/camelot match", () => {
    const cur = mkTrack({ id: "cur", camelot: "8A", energy: 5, genre: "House" });
    const house = mkTrack({ id: "house", camelot: "8A", energy: 5, genre: "House" });
    const rock = mkTrack({ id: "rock", camelot: "8A", energy: 5, genre: "Rock" });
    const lib = [cur, house, rock];
    const counts = { house: 0, rock: 0 };
    for (let i = 0; i < 80; i++) {
      const next = pickNextTrack(lib, cur, null, { preferredGenres: ["House"] });
      counts[next.id] += 1;
    }
    expect(counts.house).toBeGreaterThan(counts.rock);
  });

  test("seedTrack pocket mode stays near seed energy", () => {
    const seed = mkTrack({
      id: "seed", camelot: "8A", energy: 8, genre: "House",
      _signal: { grip: 8, hold: 7, pull: 6, gravity: 5, lift: 8, descent: 3, label: "build" },
    });
    const near = mkTrack({
      id: "near", camelot: "8A", energy: 8, genre: "House",
      _signal: { grip: 8, hold: 7, pull: 6, gravity: 5, lift: 8, descent: 3, label: "build" },
    });
    const far = mkTrack({
      id: "far", camelot: "3A", energy: 2, genre: "Jazz",
      _signal: { grip: 2, hold: 2, pull: 2, gravity: 2, lift: 2, descent: 8, label: "closer" },
    });
    const lib = [seed, near, far];
    const counts = { near: 0, far: 0 };
    for (let i = 0; i < 40; i++) {
      const next = pickNextTrack(lib, seed, null, { seedTrack: seed });
      counts[next.id] += 1;
    }
    expect(counts.near).toBeGreaterThan(counts.far);
  });
});

describe("buildRoute", () => {
  test("starts at the start track and ends at the end track", () => {
    const start = mkTrack({ id: "s", energy: 3, camelot: "8A" });
    const end = mkTrack({ id: "e", energy: 9, camelot: "9A" });
    const mids = [mkTrack({ id: "m1", energy: 5, camelot: "8A" }), mkTrack({ id: "m2", energy: 7, camelot: "9A" })];
    const route = buildRoute([start, end, ...mids], start, end);
    expect(route[0].id).toBe("s");
    expect(route[route.length - 1].id).toBe("e");
  });

  test("handles identical start/end without throwing", () => {
    const t = mkTrack({ id: "s" });
    const route = buildRoute([t], t, t);
    expect(route.every(x => x.id === "s")).toBe(true);
  });
});

describe("buildSession", () => {
  test("returns [] for an unknown activity", () => {
    expect(buildSession([mkTrack()], 30, "nope")).toEqual([]);
  });

  test("builds a non-empty set for a known activity with a pool", () => {
    const lib = Array.from({ length: 40 }, (_, i) =>
      mkTrack({ id: `t${i}`, energy: (i % 10) + 1, camelot: `${(i % 12) + 1}A` }));
    const set = buildSession(lib, 30, "party");
    expect(set.length).toBeGreaterThan(0);
    expect(set[0]._phase).toBeDefined();
  });

  test("every activity profile has phases summing to ~1", () => {
    for (const key of Object.keys(SESSION_PROFILES)) {
      const total = SESSION_PROFILES[key].phases.reduce((s, p) => s + p.p, 0);
      expect(total).toBeGreaterThan(0.9);
      expect(total).toBeLessThan(1.1);
    }
  });
});
