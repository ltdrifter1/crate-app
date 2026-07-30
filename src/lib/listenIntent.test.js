import { mixLaneIntents, vibeIntents, listenIntentById, suggestedMixLane } from "./listenIntent";

describe("listenIntent", () => {
  test("mixLaneIntents mirrors MIX_LANES", () => {
    const d = mixLaneIntents();
    expect(d.map((x) => x.id)).toEqual(["daytime", "nighttime"]);
    expect(d.every((x) => x.kind === "mixLane")).toBe(true);
  });

  test("vibeIntents exposes session profiles", () => {
    const v = vibeIntents();
    expect(v.length).toBeGreaterThan(0);
    expect(v.every((x) => x.kind === "vibe")).toBe(true);
  });

  test("listenIntentById resolves lanes and vibes", () => {
    expect(listenIntentById("nighttime")?.kind).toBe("mixLane");
    expect(listenIntentById("drive")?.kind).toBe("vibe");
    expect(listenIntentById("nope")).toBeNull();
  });

  test("suggestedMixLane follows clock", () => {
    expect(suggestedMixLane(10).id).toBe("daytime");
    expect(suggestedMixLane(22).id).toBe("nighttime");
  });
});
