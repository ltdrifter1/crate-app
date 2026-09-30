import { BRAND_NAME, BRAND_TAGLINE, brandStoragePrefix } from "./identity";
import {
  BRAND_LOCKUP_SRC,
  BRAND_MARK_SRC,
  BRAND_MARK_INVERSE_SRC,
} from "../components/brand/BrandGlyphs";

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

  test("exact logo assets are wired (no placeholders)", () => {
    expect(BRAND_LOCKUP_SRC).toBe("/brand/planet-mp3-lockup-512.png");
    expect(BRAND_MARK_SRC).toBe("/brand/logo-mark-128.png");
    expect(BRAND_MARK_INVERSE_SRC).toBe("/brand/logo-mark-inverse-128.png");
  });
});
