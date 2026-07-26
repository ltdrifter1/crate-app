import { BRAND_DIRECTIONS, BRAND_TAGLINE, activeBrandDirection } from "./identity";

describe("brand identity", () => {
  test("tagline is YOUR WORLD, YOUR MUSIC.", () => {
    expect(BRAND_TAGLINE).toMatch(/YOUR WORLD, YOUR MUSIC/i);
  });

  test("exposes three digital directions", () => {
    expect(Object.keys(BRAND_DIRECTIONS).sort()).toEqual(["lumen", "orbit", "signal"]);
  });

  test("active direction resolves", () => {
    expect(activeBrandDirection().name).toBeTruthy();
  });
});
