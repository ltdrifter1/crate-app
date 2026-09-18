import { readFileSync } from "fs";
import { join } from "path";
import { CHANNEL_ART, CHANNEL_ART_FOCUS, HERO_IDLE_ART, HERO_IDLE_FOCUS, resolveChannelArt } from "./channelArt";
import { SCENE_CHANNELS } from "./sceneChannels";

const CREDITS = readFileSync(join(__dirname, "../../docs/IMAGE_CREDITS.md"), "utf8");

describe("original channel icons", () => {
  test("every channel ships a bundled icon and a crop focus", () => {
    SCENE_CHANNELS.forEach((channel) => {
      const art = resolveChannelArt(channel);
      expect(art.src).toBeTruthy();
      expect(CHANNEL_ART[channel.id]).toBeTruthy();
      expect(art.focus).toMatch(/%/);
      expect(CHANNEL_ART_FOCUS[channel.id]).toBe(art.focus);
      expect(channel.art).toBeUndefined();
    });
  });

  test("idle hero is an original iPod stencil", () => {
    expect(HERO_IDLE_ART).toBeTruthy();
    expect(HERO_IDLE_FOCUS).toMatch(/%/);
  });

  test("IMAGE_CREDITS records original icons, not magazine scans", () => {
    expect(CREDITS).toMatch(/original illustrated icons/i);
    expect(CREDITS).toMatch(/coloured studio plates/i);
    expect(CREDITS).not.toMatch(/mixmag\.com/i);
    expect(CREDITS).not.toMatch(/xlr8r\.com/i);
    expect(CREDITS).not.toMatch(/djmag\.com/i);
    SCENE_CHANNELS.forEach((channel) => {
      const file = `${channel.id}.png`;
      expect(CREDITS).toContain(file);
    });
  });
});
