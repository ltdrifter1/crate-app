import {
  DISLIKE_HARD_THRESHOLD,
  DISLIKE_SOFT_WEIGHTS,
  energyBandId,
  adjacentEnergyBands,
  neighborhoodKey,
  trackNeighborhood,
  emptyDislikeTaste,
  recordDislikeEvent,
  countSimilarDislikes,
  dislikeWeightForTrack,
  isNeighborhoodSuppressed,
  applyDislikeToPool,
  applyDislikeWeight,
} from "./dislikeTaste";

const houseMid = { id: "a", genre: "House", energy: 5 };
const housePeak = { id: "b", genre: "Techno", energy: 8 };
const houseLift = { id: "c", genre: "Electronic", energy: 6.5 };
const jazzSoft = { id: "d", genre: "Jazz", energy: 2 };

describe("energy neighborhoods", () => {
  test("bands match listenInsights cut points", () => {
    expect(energyBandId(2)).toBe("soft");
    expect(energyBandId(4)).toBe("steady");
    expect(energyBandId(6)).toBe("lift");
    expect(energyBandId(9)).toBe("peak");
  });

  test("House / Techno normalize to the same Electronic neighborhood", () => {
    const a = trackNeighborhood(houseMid);
    const b = trackNeighborhood(housePeak);
    expect(a.genre).toBe("Electronic");
    expect(b.genre).toBe("Electronic");
    expect(neighborhoodKey("House", "steady")).toBe("electronic|steady");
    expect(a.overlappingKeys).toEqual(
      expect.arrayContaining(["electronic|steady", "electronic|soft", "electronic|lift"])
    );
  });

  test("adjacent bands overlap but skip the far side", () => {
    expect(adjacentEnergyBands("soft")).toEqual(["soft", "steady"]);
    expect(adjacentEnergyBands("peak")).toEqual(["peak", "lift"]);
  });
});

describe("recordDislikeEvent — soft then hard", () => {
  test("first dislike soft-downweights that genre + band", () => {
    const { taste, similarCount, hard } = recordDislikeEvent(emptyDislikeTaste(), houseMid);
    expect(hard).toBe(false);
    expect(similarCount).toBe(1);
    expect(dislikeWeightForTrack(houseMid, taste)).toBe(DISLIKE_SOFT_WEIGHTS[1]);
    expect(dislikeWeightForTrack(housePeak, taste)).toBe(1);
    expect(dislikeWeightForTrack(jazzSoft, taste)).toBe(1);
  });

  test("second similar dislike tightens the weight", () => {
    let taste = emptyDislikeTaste();
    taste = recordDislikeEvent(taste, houseMid).taste;
    const second = recordDislikeEvent(taste, { ...houseMid, id: "a2", energy: 4.8 });
    expect(second.hard).toBe(false);
    expect(second.similarCount).toBe(2);
    expect(dislikeWeightForTrack(houseMid, second.taste)).toBe(DISLIKE_SOFT_WEIGHTS[2]);
  });

  test(`${DISLIKE_HARD_THRESHOLD} overlapping genre+energy dislikes hard-suppress the neighborhood`, () => {
    let taste = emptyDislikeTaste();
    taste = recordDislikeEvent(taste, houseMid).taste;
    taste = recordDislikeEvent(taste, { id: "a2", genre: "House", energy: 5 }).taste;
    const third = recordDislikeEvent(taste, houseLift);
    expect(third.similarCount).toBe(DISLIKE_HARD_THRESHOLD);
    expect(third.hard).toBe(true);
    expect(isNeighborhoodSuppressed(houseMid, third.taste)).toBe(true);
    expect(isNeighborhoodSuppressed(houseLift, third.taste)).toBe(true);
    expect(dislikeWeightForTrack(houseMid, third.taste)).toBe(0);
    expect(dislikeWeightForTrack(jazzSoft, third.taste)).toBe(1);
  });

  test("same track is idempotent", () => {
    let taste = emptyDislikeTaste();
    taste = recordDislikeEvent(taste, houseMid).taste;
    const again = recordDislikeEvent(taste, houseMid);
    expect(again.similarCount).toBe(1);
    expect(again.taste.events).toHaveLength(1);
    expect(again.taste.neighborhoods["electronic|steady"].count).toBe(1);
  });

  test("a far energy band of the same genre is not similar enough to escalate alone", () => {
    let taste = emptyDislikeTaste();
    taste = recordDislikeEvent(taste, houseMid).taste;
    const peak = recordDislikeEvent(taste, housePeak);
    expect(peak.hard).toBe(false);
    expect(countSimilarDislikes(peak.taste, trackNeighborhood(housePeak))).toBe(1);
    expect(dislikeWeightForTrack(housePeak, peak.taste)).toBe(DISLIKE_SOFT_WEIGHTS[1]);
  });
});

describe("applyDislikeToPool", () => {
  test("filters hard-suppressed tracks from an open pool", () => {
    let taste = emptyDislikeTaste();
    taste = recordDislikeEvent(taste, houseMid).taste;
    taste = recordDislikeEvent(taste, { id: "a2", genre: "House", energy: 5 }).taste;
    taste = recordDislikeEvent(taste, houseLift).taste;
    const pool = applyDislikeToPool([houseMid, houseLift, jazzSoft], taste);
    expect(pool.map((t) => t.id)).toEqual(["d"]);
  });

  test("preserveFocus keeps the pool when suppression would empty a channel", () => {
    let taste = emptyDislikeTaste();
    taste = recordDislikeEvent(taste, houseMid).taste;
    taste = recordDislikeEvent(taste, { id: "a2", genre: "House", energy: 5 }).taste;
    taste = recordDislikeEvent(taste, houseLift).taste;
    const focused = [houseMid, houseLift];
    expect(applyDislikeToPool(focused, taste, { preserveFocus: true })).toEqual(focused);
  });

  test("applyDislikeWeight multiplies pick weights", () => {
    const { taste } = recordDislikeEvent(emptyDislikeTaste(), houseMid);
    expect(applyDislikeWeight(10, houseMid, taste)).toBeCloseTo(3.5);
    expect(applyDislikeWeight(10, jazzSoft, taste)).toBe(10);
  });
});
