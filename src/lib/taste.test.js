import {
  TASTE_IN_RATIO,
  trackInTaste,
  splitTastePool,
  tasteCandidatePool,
  vibeForDaypart,
  blendPoolForSession,
} from "./taste";

const catalog = [
  { id: "1", genre: "Jazz", duration: 180 },
  { id: "2", genre: "Jazz", duration: 190 },
  { id: "3", genre: "House", duration: 200 },
  { id: "4", genre: "Rock", duration: 210 },
  { id: "5", genre: "Techno", duration: 220 }, // → House
];

describe("taste blend", () => {
  test("splitTastePool groups by preferred genres", () => {
    const { inTaste, outTaste } = splitTastePool(catalog, ["Jazz", "House"]);
    expect(inTaste.map((t) => t.id).sort()).toEqual(["1", "2", "3", "5"]);
    expect(outTaste.map((t) => t.id)).toEqual(["4"]);
  });

  test("trackInTaste normalizes aliases", () => {
    expect(trackInTaste({ genre: "Techno" }, ["House"])).toBe(true);
    expect(trackInTaste({ genre: "Rock" }, ["House"])).toBe(false);
  });

  test("tasteCandidatePool hits in-taste at ~95%", () => {
    let inHits = 0;
    const n = 200;
    for (let i = 0; i < n; i++) {
      const { bucket } = tasteCandidatePool(catalog, ["Jazz"], {
        random: () => i / n, // 0..0.995 → first 190 in, last 10 out
      });
      if (bucket === "in") inHits += 1;
    }
    // With deterministic random i/n: in when i/n < 0.95 → i < 190
    expect(inHits).toBe(190);
  });

  test("tasteCandidatePool falls back when out-taste empty", () => {
    const onlyJazz = catalog.filter((t) => t.genre === "Jazz");
    const { tracks, bucket } = tasteCandidatePool(onlyJazz, ["Jazz"], { random: () => 0.99 });
    expect(bucket).toBe("in-only");
    expect(tracks).toHaveLength(2);
  });

  test("no prefs returns full pool", () => {
    const { tracks, bucket } = tasteCandidatePool(catalog, [], { random: () => 0 });
    expect(bucket).toBe("all");
    expect(tracks).toHaveLength(catalog.length);
  });

  test("vibeForDaypart maps clock quietly", () => {
    expect(vibeForDaypart("daytime")).toBe("drive");
    expect(vibeForDaypart("nighttime")).toBe("night");
  });

  test("blendPoolForSession keeps ~95% in-taste", () => {
    const big = [
      ...Array.from({ length: 95 }, (_, i) => ({ id: `j${i}`, genre: "Jazz" })),
      ...Array.from({ length: 95 }, (_, i) => ({ id: `r${i}`, genre: "Rock" })),
    ];
    const blended = blendPoolForSession(big, ["Jazz"]);
    const jazz = blended.filter((t) => t.genre === "Jazz").length;
    const rock = blended.filter((t) => t.genre === "Rock").length;
    expect(jazz).toBe(95);
    expect(rock).toBeGreaterThan(0);
    expect(rock).toBeLessThanOrEqual(Math.ceil((95 * 0.05) / 0.95) + 1);
  });
});
