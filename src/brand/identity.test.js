import { BRAND_NAME, BRAND_TAGLINE, brandStoragePrefix } from "./identity";

describe("Planet MP3 identity", () => {
  test("product name", () => {
    expect(BRAND_NAME).toBe("Planet MP3");
  });

  test("tagline unchanged", () => {
    expect(BRAND_TAGLINE).toMatch(/YOUR WORLD, YOUR MUSIC/i);
  });

  test("storage prefix", () => {
    expect(brandStoragePrefix()).toBe("planetmp3");
  });
});
