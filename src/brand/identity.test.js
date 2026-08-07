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
    expect(BRAND_LOCKUP_SRC).toBe("/brand/planet-mp3-lockup.png");
    expect(BRAND_MARK_SRC).toBe("/brand/logo-mark.png");
    expect(BRAND_MARK_INVERSE_SRC).toBe("/brand/logo-mark-inverse.png");
  });
});

describe("design type + motion roles", () => {
  test("type roles expose editorial hierarchy", () => {
    const { type, motion, fontDisplay, fontMono } = require("../theme");
    expect(type.display.fontFamily).toBe(fontDisplay);
    expect(type.monoLabel.fontFamily).toBe(fontMono);
    expect(type.section.fontWeight).toBeGreaterThanOrEqual(600);
    expect(motion.settle).toBe("0.32s");
    expect(motion.ease).toMatch(/cubic-bezier/);
  });

  test("motion/tokens mirrors theme.motion", () => {
    const theme = require("../theme");
    const tokens = require("../motion/tokens");
    expect(tokens.motion.fast).toBe(theme.motion.fast);
    expect(tokens.motion.settle).toBe(theme.motion.settle);
  });
});
