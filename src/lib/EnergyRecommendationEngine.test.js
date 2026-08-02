import {
  camelotDistance,
  moodDistance,
  stepTarget,
  scoreCandidate,
  rankEnergyCandidates,
  pickEnergyTrack,
} from "./EnergyRecommendationEngine";

const shiftUp = { active: true, direction: 1, bpmDelta: 10, energyDelta: 1.5, camelotDelta: 2 };
const shiftDown = { active: true, direction: -1, bpmDelta: -10, energyDelta: -1.5, camelotDelta: -2 };

describe("camelotDistance", () => {
  test("same slot is 0; relative major/minor is a cheap half-step", () => {
    expect(camelotDistance("8A", "8A")).toBe(0);
    expect(camelotDistance("8A", "8B")).toBe(0.5);
  });
  test("wraps the wheel and penalizes mode crossing", () => {
    expect(camelotDistance("12A", "1A")).toBe(1);
    expect(camelotDistance("8A", "10A")).toBe(2);
    expect(camelotDistance("8A", "10B")).toBe(3);
  });
  test("missing keys are neutral, not zero", () => {
    expect(camelotDistance(null, "8A")).toBe(1.5);
  });
});

describe("moodDistance", () => {
  test("uses mood strings when present", () => {
    expect(moodDistance({ mood: "Dark" }, { mood: "dark" })).toBe(0);
    expect(moodDistance({ mood: "Dark" }, { mood: "Euphoric" })).toBe(1);
  });
  test("falls back to energy proximity", () => {
    expect(moodDistance({ energy: 5 }, { energy: 5 })).toBe(0);
    expect(moodDistance({ energy: 1 }, { energy: 10 })).toBe(1);
  });
});

describe("stepTarget — lawnmower sweep", () => {
  test("caps each step at +10 BPM even with a large pending shift", () => {
    const t = stepTarget({ bpm: 120, energy: 5, camelot: "8A" }, { ...shiftUp, bpmDelta: 30 });
    expect(t.bpm).toBe(130);
  });
  test("moves camelot at most 2 steps and keeps mode", () => {
    const t = stepTarget({ bpm: 124, energy: 6, camelot: "8A" }, { ...shiftUp, camelotDelta: 5 });
    expect(t.camelotNum).toBe(10);
    expect(t.camelotMode).toBe("A");
  });
  test("wraps around the wheel", () => {
    const t = stepTarget({ bpm: 124, energy: 6, camelot: "12A" }, shiftUp);
    expect(t.camelotNum).toBe(2);
  });
  test("descends for turtle", () => {
    const t = stepTarget({ bpm: 128, energy: 7, camelot: "9A" }, shiftDown);
    expect(t.bpm).toBe(118);
    expect(t.camelotNum).toBe(7);
    expect(t.energy).toBeCloseTo(5.5);
  });
});

describe("scoreCandidate / rankEnergyCandidates", () => {
  const current = { id: "cur", bpm: 120, energy: 6, camelot: "8A", genre: "House" };

  test("prefers the DJ lift (+6 BPM adjacent key) over a giant jump", () => {
    const gentle = { id: "a", bpm: 126, energy: 7, camelot: "9A", genre: "House" };
    const jump = { id: "b", bpm: 145, energy: 9, camelot: "3B", genre: "House" };
    const target = stepTarget(current, shiftUp);
    expect(scoreCandidate(gentle, current, target, shiftUp))
      .toBeLessThan(scoreCandidate(jump, current, target, shiftUp));
  });

  test("penalizes moving against the sweep direction", () => {
    const withSweep = { id: "a", bpm: 128, energy: 7, camelot: "8A", genre: "House" };
    const against = { id: "b", bpm: 112, energy: 7, camelot: "8A", genre: "House" };
    const target = stepTarget(current, shiftUp);
    expect(scoreCandidate(withSweep, current, target, shiftUp))
      .toBeLessThan(scoreCandidate(against, current, target, shiftUp));
  });

  test("harmonically incompatible tracks sink to the bottom", () => {
    const pool = [
      { id: "far", bpm: 130, energy: 7, camelot: "2B", genre: "House" },
      { id: "near", bpm: 130, energy: 7, camelot: "9A", genre: "House" },
    ];
    const ranked = rankEnergyCandidates(pool, current, shiftUp);
    expect(ranked[0].track.id).toBe("near");
  });

  test("ranking follows the rabbit example (same-mode lifts first, 130/8B mode-cross last)", () => {
    const cur = { id: "c", bpm: 120, energy: 6, camelot: "8A", genre: "House" };
    const pool = [
      { id: "d130-8B", bpm: 130, energy: 8, camelot: "8B", genre: "House" },
      { id: "d126-8A", bpm: 126, energy: 7, camelot: "8A", genre: "House" },
      { id: "d126-9A", bpm: 126, energy: 7, camelot: "9A", genre: "House" },
    ];
    const ids = rankEnergyCandidates(pool, cur, shiftUp).map((r) => r.track.id);
    // 9A sits on the sweep path toward the 10A step target; 8A is the safe
    // same-key lift; the 8B mode-cross jump ranks last.
    expect(ids[0]).toBe("d126-9A");
    expect(ids[1]).toBe("d126-8A");
    expect(ids[2]).toBe("d130-8B");
  });
});

describe("pickEnergyTrack", () => {
  test("returns null when the shift is inactive or the pool is empty", () => {
    expect(pickEnergyTrack([], { bpm: 120 }, shiftUp)).toBeNull();
    expect(pickEnergyTrack([{ id: "x", bpm: 126 }], { bpm: 120 }, { ...shiftUp, active: false })).toBeNull();
  });
  test("picks from the top-ranked candidates deterministically with a seeded rng", () => {
    const current = { id: "cur", bpm: 120, energy: 6, camelot: "8A", genre: "House" };
    const pool = [
      { id: "best", bpm: 128, energy: 7, camelot: "8A", genre: "House" },
      { id: "meh", bpm: 150, energy: 9, camelot: "3B", genre: "Trance" },
    ];
    expect(pickEnergyTrack(pool, current, shiftUp, () => 0).id).toBe("best");
  });
});
