import { daypartIntents, vibeIntents, listenIntentById, suggestedDaypart } from "./listenIntent";
import { MIX_LANES } from "./mixLanes";
import { SESSION_PROFILES } from "./engine";

describe("listen intent", () => {
  test("daypartIntents mirrors MIX_LANES", () => {
    const d = daypartIntents();
    expect(d).toHaveLength(MIX_LANES.length);
    expect(d.every((x) => x.kind === "daypart")).toBe(true);
    expect(d.map((x) => x.id)).toEqual(["daytime", "nighttime"]);
  });

  test("vibeIntents mirrors SESSION_PROFILES", () => {
    const v = vibeIntents();
    expect(v.length).toBe(Object.keys(SESSION_PROFILES).length);
    expect(v.every((x) => x.kind === "vibe")).toBe(true);
    expect(v.map((x) => x.id)).toEqual(expect.arrayContaining(["drive", "chill", "focus"]));
  });

  test("listenIntentById resolves both kinds", () => {
    expect(listenIntentById("nighttime")?.kind).toBe("daypart");
    expect(listenIntentById("workout")?.label).toBe("Workout");
    expect(listenIntentById("nope")).toBeNull();
  });

  test("suggestedDaypart follows clock", () => {
    expect(suggestedDaypart(10).id).toBe("daytime");
    expect(suggestedDaypart(22).id).toBe("nighttime");
  });
});
