import { resolvePlaceAtmosphere, placeKey, trackAtmosphere } from "./placeAtmosphere";

describe("resolvePlaceAtmosphere", () => {
  test("booth wins when immersive with a track", () => {
    const atm = resolvePlaceAtmosphere({
      screen: "home",
      immersive: true,
      track: { id: "t1", color: "#C4A574", energy: 7 },
    });
    expect(atm.key).toBe("booth-t1");
    expect(atm.tone).toBe("booth");
    expect(atm.energy).toBe(7);
    expect(atm.gradient).toContain("#C4A574");
  });

  test("nested room uses room tone", () => {
    const atm = resolvePlaceAtmosphere({
      screen: "rooms",
      roomId: "peak",
      track: { energy: 8 },
    });
    expect(atm.key).toBe("room-peak");
    expect(atm.tone).toBe("room");
  });

  test("rooms floor without roomId uses floor tone", () => {
    const atm = resolvePlaceAtmosphere({ screen: "rooms" });
    expect(atm.key).toMatch(/^floor-/);
    expect(atm.tone).toBe("floor");
  });

  test("home uses time-of-day tone", () => {
    const atm = resolvePlaceAtmosphere({ screen: "home" });
    expect(atm.key).toBe("home-tod");
    expect(["dawn", "day", "dusk", "night"]).toContain(atm.tone);
  });

  test("dig / favorites uses floor tone", () => {
    const atm = resolvePlaceAtmosphere({ screen: "favorites" });
    expect(atm.key).toMatch(/^dig-/);
    expect(atm.tone).toBe("floor");
  });

  test("search uses night vault", () => {
    const atm = resolvePlaceAtmosphere({ screen: "search" });
    expect(atm.key).toBe("search");
    expect(atm.tone).toBe("night");
  });
});

describe("placeKey", () => {
  test("stable keys for screens and rooms", () => {
    expect(placeKey({ screen: "home" })).toBe("home");
    expect(placeKey({ screen: "rooms", roomId: "peak" })).toBe("rooms:peak");
    expect(placeKey({ screen: "rooms", immersive: true, trackId: "t1" })).toBe("booth:t1");
  });
});

describe("trackAtmosphere", () => {
  test("falls back without color", () => {
    expect(typeof trackAtmosphere(null)).toBe("string");
    expect(trackAtmosphere({ color: "#abc" })).toContain("#abc");
  });
});
