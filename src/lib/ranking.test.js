import {
  RANKING_WEIGHTS,
  inRatioForTaste,
  scoreTrackForRanking,
  defaultSetPrefs,
  energyWindowForTaste,
  isColdStartTaste,
  tasteFromProfile,
} from "./ranking";
import { pickNextTrack, buildSession } from "./engine";
import { recommendedPicks } from "./homeCollections";
import { emptyDislikeTaste, recordDislikeEvent } from "./dislikeTaste";

const mk = (over = {}) => ({
  id: over.id || "t",
  title: "Cut",
  artist: "Signal",
  genre: "Jazz",
  energy: 5,
  camelot: "8A",
  duration: 180,
  playCount: 0,
  likeCount: 0,
  ...over,
});

describe("ranking formula", () => {
  test("inRatioForTaste widens as adventurous rises", () => {
    expect(inRatioForTaste(0)).toBeCloseTo(0.98);
    expect(inRatioForTaste(50)).toBeGreaterThan(inRatioForTaste(100));
    expect(inRatioForTaste(100)).toBeCloseTo(0.62);
  });

  test("familiar taste scores in-genre above out-of-genre", () => {
    const taste = tasteFromProfile({ genres: ["Jazz"], adventurous: 12, depth: 40 });
    const jazz = mk({ id: "j", genre: "Jazz", playCount: 2 });
    const rock = mk({ id: "r", genre: "Rock", playCount: 2 });
    expect(scoreTrackForRanking(jazz, taste)).toBeGreaterThan(
      scoreTrackForRanking(rock, taste)
    );
  });

  test("cold start mutes global play heat versus onboarding genre", () => {
    const taste = tasteFromProfile({ genres: ["Metal"], adventurous: 20, depth: 40 });
    const metal = mk({ id: "m", genre: "Metal", playCount: 0, energy: 8 });
    const popHit = mk({ id: "p", genre: "Pop", playCount: 90, likeCount: 40, energy: 6 });
    expect(
      scoreTrackForRanking(metal, taste, { coldStart: true })
    ).toBeGreaterThan(scoreTrackForRanking(popHit, taste, { coldStart: true }));
  });

  test("energy band and artist taps add score", () => {
    const taste = tasteFromProfile({
      genres: ["Electronic"],
      energyBand: "peak",
      artistNames: ["Floorwork"],
      adventurous: 40,
      depth: 40,
    });
    const peak = mk({
      id: "peak",
      genre: "Electronic",
      artist: "Floorwork",
      energy: 9,
    });
    const soft = mk({
      id: "soft",
      genre: "Electronic",
      artist: "Other",
      energy: 2,
    });
    expect(scoreTrackForRanking(peak, taste, { coldStart: true })).toBeGreaterThan(
      scoreTrackForRanking(soft, taste, { coldStart: true })
    );
  });

  test("dislike taste zeroes a neighborhood", () => {
    let dislike = emptyDislikeTaste();
    dislike = recordDislikeEvent(dislike, { id: "d1", genre: "House", energy: 5 }).taste;
    dislike = recordDislikeEvent(dislike, { id: "d2", genre: "House", energy: 5 }).taste;
    dislike = recordDislikeEvent(dislike, { id: "d3", genre: "Electronic", energy: 6 }).taste;
    const house = mk({ id: "h", genre: "House", energy: 5 });
    const jazz = mk({ id: "j", genre: "Jazz", energy: 5 });
    const taste = tasteFromProfile({ genres: ["Electronic", "Jazz"] });
    expect(scoreTrackForRanking(house, taste, { dislikeTaste: dislike })).toBe(0);
    expect(scoreTrackForRanking(jazz, taste, { dislikeTaste: dislike })).toBeGreaterThan(0);
  });

  test("defaultSetPrefs maps peak → night and a single genre", () => {
    expect(defaultSetPrefs({ energyBand: "peak", genres: ["Metal"] })).toEqual({
      vibe: "night",
      genre: "Metal",
      genres: ["Metal"],
    });
    expect(defaultSetPrefs({ vibe: "chill", genres: ["Jazz", "Electronic"] }).vibe).toBe("chill");
  });

  test("energyWindowForTaste only clamps on cold start", () => {
    expect(energyWindowForTaste({ energyBand: "peak" }, [1, 10], { coldStart: false })).toEqual([1, 10]);
    const [min, max] = energyWindowForTaste({ energyBand: "peak" }, [1, 10], { coldStart: true });
    expect(min).toBeGreaterThanOrEqual(7);
    expect(max).toBe(10);
  });

  test("isColdStartTaste is true with onboarding and no recents", () => {
    expect(isColdStartTaste({ genres: ["Jazz"] }, { recentTrackIds: [], likedCount: 0 })).toBe(true);
    expect(isColdStartTaste({ genres: ["Jazz"] }, { recentTrackIds: ["a"], likedCount: 0 })).toBe(false);
  });

  test("weights stay documented", () => {
    expect(RANKING_WEIGHTS.genreIn).toBe(12);
    expect(RANKING_WEIGHTS.channel).toBe(9);
    expect(RANKING_WEIGHTS.coldStart).toBe(7);
  });
});

describe("onboarding → radio / shelves / sets", () => {
  test("pickNextTrack cold-start prefers onboarded Metal over a Jazz hit", () => {
    const cur = mk({ id: "cur", genre: "Rock", camelot: "8A", energy: 8 });
    const metal = mk({ id: "metal", genre: "Metal", camelot: "8A", energy: 8, playCount: 0 });
    const jazzHit = mk({ id: "jazz", genre: "Jazz", camelot: "8A", energy: 8, playCount: 80, likeCount: 20 });
    const lib = [cur, metal, jazzHit];
    const taste = tasteFromProfile({ genres: ["Metal"], adventurous: 18, depth: 40, energyBand: "peak" });
    const counts = { metal: 0, jazz: 0 };
    for (let i = 0; i < 60; i += 1) {
      const next = pickNextTrack(lib, cur, null, {
        taste,
        preferredGenres: ["Metal"],
        tasteBlend: true,
        coldStart: true,
      });
      counts[next.id] += 1;
    }
    expect(counts.metal).toBeGreaterThan(counts.jazz);
  });

  test("recommendedPicks cold start does not dump the global hit", () => {
    const tracks = [
      mk({ id: "hit", genre: "Pop", playCount: 200, likeCount: 40 }),
      mk({ id: "mine-a", genre: "Jazz", playCount: 0 }),
      mk({ id: "mine-b", genre: "Jazz", playCount: 1 }),
      mk({ id: "other", genre: "Rock", playCount: 90 }),
    ];
    const { picks, coldStart } = recommendedPicks(tracks, {
      preferredGenres: ["Jazz"],
      taste: { genres: ["Jazz"], adventurous: 20, depth: 50 },
      limit: 2,
      userKey: "fresh",
      dayKey: "2026-09-15",
    });
    expect(coldStart).toBe(true);
    expect(picks.some((p) => p.track.genre === "Jazz")).toBe(true);
    expect(picks[0].track.id).not.toBe("hit");
  });

  test("buildSession with taste still returns a set in the requested lane", () => {
    const lib = [
      ...Array.from({ length: 16 }, (_, i) =>
        mk({ id: `e${i}`, genre: "Electronic", energy: (i % 10) + 1, duration: 180 })),
      ...Array.from({ length: 16 }, (_, i) =>
        mk({ id: `r${i}`, genre: "Rock", energy: (i % 10) + 1, duration: 180 })),
    ];
    const set = buildSession(lib, 30, "night", {
      genre: "Electronic",
      taste: { genres: ["Electronic"], adventurous: 30, energyBand: "peak" },
      coldStart: true,
    });
    expect(set.length).toBeGreaterThan(0);
    expect(set.every((t) => t.genre === "Electronic")).toBe(true);
  });
});
