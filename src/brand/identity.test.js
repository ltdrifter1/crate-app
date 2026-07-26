import {
  BRAND_NAME,
  BRAND_TAGLINE,
  BRAND_NAME_OPTIONS,
  activeBrandName,
} from "./identity";

describe("brand identity", () => {
  test("tagline is YOUR WORLD, YOUR MUSIC.", () => {
    expect(BRAND_TAGLINE).toMatch(/YOUR WORLD, YOUR MUSIC/i);
  });

  test("offers three product name options (not ROOMS)", () => {
    const names = Object.values(BRAND_NAME_OPTIONS).map((o) => o.name);
    expect(names).toEqual(["RESONANCE", "RADIUS", "SIGNAL"]);
    expect(names).not.toContain("ROOMS");
  });

  test("active name resolves", () => {
    expect(activeBrandName().name).toBe(BRAND_NAME);
  });
});
