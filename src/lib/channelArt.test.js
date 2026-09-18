import { readFileSync } from "fs";
import { join } from "path";
import { CHANNEL_ART, CHANNEL_ART_FOCUS, HERO_IDLE_ART, HERO_IDLE_FOCUS, resolveChannelArt, catalogSleeveUrl, isChannelPictogram } from "./channelArt";
import { SCENE_CHANNELS } from "./sceneChannels";

const CREDITS = readFileSync(join(__dirname, "../../docs/IMAGE_CREDITS.md"), "utf8");

describe("channel icons", () => {
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

  test("catalogSleeveUrl rejects channel pictograms and the idle cassette", () => {
    expect(isChannelPictogram(CHANNEL_ART.techno)).toBe(true);
    expect(catalogSleeveUrl(CHANNEL_ART.techno)).toBeNull();
    expect(catalogSleeveUrl(HERO_IDLE_ART)).toBeNull();
    expect(catalogSleeveUrl("/channels/house.png")).toBeNull();
    expect(catalogSleeveUrl("https://cdn.example/sleeves/night.jpg")).toBe("https://cdn.example/sleeves/night.jpg");
  });

  test("idle hero is a cassette drawing on steel", () => {
    expect(HERO_IDLE_ART).toBeTruthy();
    expect(HERO_IDLE_FOCUS).toMatch(/%/);
  });

  test("IMAGE_CREDITS records Game Icons drawings on steel plates", () => {
    expect(CREDITS).toMatch(/published music drawings/i);
    expect(CREDITS).toMatch(/brushed aluminum/i);
    expect(CREDITS).toMatch(/CC BY 3\.0/i);
    expect(CREDITS).not.toMatch(/mixmag\.com/i);
    expect(CREDITS).not.toMatch(/xlr8r\.com/i);
    expect(CREDITS).not.toMatch(/djmag\.com/i);
    SCENE_CHANNELS.forEach((channel) => {
      const file = `${channel.id}.png`;
      expect(CREDITS).toContain(file);
    });
  });
});
