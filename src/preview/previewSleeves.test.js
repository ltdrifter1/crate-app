import { existsSync } from "fs";
import { join } from "path";
import { CHANNEL_ART, isChannelPictogram } from "../lib/channelArt";
import { PREVIEW_SLEEVE_LIST, PREVIEW_SLEEVES } from "./previewSleeves";

describe("preview catalog sleeves", () => {
  test("are local geometric plates, not Channel Surfing pictograms", () => {
    expect(Object.keys(PREVIEW_SLEEVES).length).toBeGreaterThanOrEqual(12);
    const pictograms = new Set(Object.values(CHANNEL_ART));
    for (const url of PREVIEW_SLEEVE_LIST) {
      expect(url).toMatch(/^\/preview\/sleeves\/[\w-]+\.svg$/);
      expect(isChannelPictogram(url)).toBe(false);
      expect(pictograms.has(url)).toBe(false);
      expect(existsSync(join(__dirname, "../../public", url.replace(/^\//, "")))).toBe(true);
    }
  });
});
