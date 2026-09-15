import { readFileSync } from "fs";
import { join } from "path";
import { CHANNEL_ART, CHANNEL_ART_FOCUS, HERO_IDLE_ART, HERO_IDLE_FOCUS, resolveChannelArt } from "./channelArt";
import { SCENE_CHANNELS } from "./sceneChannels";

const CREDITS = readFileSync(join(__dirname, "../../docs/IMAGE_CREDITS.md"), "utf8");

describe("licensed editorial photography", () => {
  test("every channel ships a bundled photo and a crop focus", () => {
    SCENE_CHANNELS.forEach((channel) => {
      const art = resolveChannelArt(channel);
      expect(art.src).toBeTruthy();
      expect(CHANNEL_ART[channel.id]).toBeTruthy();
      expect(art.focus).toMatch(/%/);
      expect(CHANNEL_ART_FOCUS[channel.id]).toBe(art.focus);
      expect(channel.art).toBeUndefined();
    });
  });

  test("idle hero is a real photo, not a generated gradient plate", () => {
    expect(HERO_IDLE_ART).toBeTruthy();
    expect(HERO_IDLE_FOCUS).toMatch(/%/);
  });

  test("IMAGE_CREDITS records source URLs and licenses", () => {
    expect(CREDITS).toMatch(/Unsplash License/);
    expect(CREDITS).toMatch(/Pexels License/);
    expect(CREDITS).not.toMatch(/mixmag\.com/i);
    expect(CREDITS).not.toMatch(/djmag\.com/i);
    [
      "Marcela Laskoski",
      "Szymon Shields",
      "Josh Hild",
      "Austin Neill",
      "Laszlo Barta",
      "Brett Sayles",
      "Josh Sorenson",
    ].forEach((name) => {
      expect(CREDITS).toContain(name);
    });
    SCENE_CHANNELS.forEach((channel) => {
      const file = channel.id === "electronic-underground" ? "electronic.jpg" : `${channel.id}.jpg`;
      expect(CREDITS).toContain(file);
    });
  });
});
