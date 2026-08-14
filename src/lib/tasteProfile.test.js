import {
  clampTasteAxis,
  normalizeTasteProfile,
  tasteProfileStats,
  tasteMonthKey,
  scoreTrackForTaste,
  pickMonthlyTracks,
  tasteProfileBlurb,
  TASTE_AXIS_DEFAULT,
} from "./tasteProfile";

describe("tasteProfile", () => {
  test("clampTasteAxis bounds and rounds", () => {
    expect(clampTasteAxis(-10)).toBe(0);
    expect(clampTasteAxis(150)).toBe(100);
    expect(clampTasteAxis(33.6)).toBe(34);
    expect(clampTasteAxis("x")).toBe(TASTE_AXIS_DEFAULT);
  });

  test("normalizeTasteProfile fills defaults", () => {
    expect(normalizeTasteProfile({})).toEqual({
      genres: [],
      adventurous: 50,
      depth: 50,
    });
    expect(
      normalizeTasteProfile({ genres: ["Jazz"], adventurous: 80, depth: 20 })
    ).toEqual({ genres: ["Jazz"], adventurous: 80, depth: 20 });
  });

  test("tasteMonthKey is YYYY-MM UTC", () => {
    expect(tasteMonthKey(new Date("2026-08-14T12:00:00Z"))).toBe("2026-08");
  });

  test("tasteProfileStats includes axes and genres", () => {
    const rows = tasteProfileStats({
      genres: ["Jazz", "Electronic"],
      adventurous: 74,
      depth: 81,
    });
    expect(rows.find((r) => r.id === "adventurous")?.pct).toBe(74);
    expect(rows.find((r) => r.id === "depth")?.pct).toBe(81);
    expect(rows.some((r) => r.label === "Jazz")).toBe(true);
  });

  test("scoreTrackForTaste rewards in-genre when familiar", () => {
    const jazz = { id: "1", genre: "Jazz", playCount: 5, energy: 5 };
    const rock = { id: "2", genre: "Rock", playCount: 5, energy: 5 };
    const taste = { genres: ["Jazz"], adventurous: 10, depth: 50 };
    expect(scoreTrackForTaste(jazz, taste)).toBeGreaterThan(
      scoreTrackForTaste(rock, taste)
    );
  });

  test("scoreTrackForTaste rewards obscure when depth is high", () => {
    const hit = { id: "1", genre: "Jazz", playCount: 80, likeCount: 20, energy: 5 };
    const deep = { id: "2", genre: "Jazz", playCount: 0, likeCount: 0, energy: 5 };
    const taste = { genres: ["Jazz"], adventurous: 50, depth: 90 };
    expect(scoreTrackForTaste(deep, taste)).toBeGreaterThan(
      scoreTrackForTaste(hit, taste)
    );
  });

  test("pickMonthlyTracks is stable for same user+month", () => {
    const tracks = Array.from({ length: 30 }, (_, i) => ({
      id: `t${i}`,
      genre: i % 2 === 0 ? "Jazz" : "Rock",
      playCount: i,
      energy: 4 + (i % 4),
      duration: 200,
    }));
    const taste = { genres: ["Jazz"], adventurous: 40, depth: 60 };
    const a = pickMonthlyTracks(tracks, taste, {
      userKey: "u1",
      monthKey: "2026-08",
      limit: 3,
    });
    const b = pickMonthlyTracks(tracks, taste, {
      userKey: "u1",
      monthKey: "2026-08",
      limit: 3,
    });
    expect(a.picks.map((p) => p.track.id)).toEqual(b.picks.map((p) => p.track.id));
    expect(a.picks).toHaveLength(3);
  });

  test("pickMonthlyTracks rotates by month", () => {
    const tracks = Array.from({ length: 40 }, (_, i) => ({
      id: `t${i}`,
      genre: "Jazz",
      playCount: i % 7,
      energy: 5,
      duration: 180,
    }));
    const taste = { genres: ["Jazz"], adventurous: 50, depth: 50 };
    const aug = pickMonthlyTracks(tracks, taste, {
      userKey: "u1",
      monthKey: "2026-08",
      limit: 3,
    });
    const sep = pickMonthlyTracks(tracks, taste, {
      userKey: "u1",
      monthKey: "2026-09",
      limit: 3,
    });
    expect(aug.picks.map((p) => p.track.id)).not.toEqual(
      sep.picks.map((p) => p.track.id)
    );
  });

  test("tasteProfileBlurb summarizes", () => {
    expect(
      tasteProfileBlurb({ genres: ["Jazz"], adventurous: 80, depth: 20 })
    ).toMatch(/Jazz/);
    expect(tasteProfileBlurb({})).toMatch(/Set your genres/);
  });
});
