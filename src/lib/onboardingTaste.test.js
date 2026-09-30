import {
  compileOnboardingTaste,
  genresFromChannelIds,
  rankChannelsForTaste,
  artistFacesForChannels,
  trackHitsPreferredChannels,
  ONBOARDING_VERSION,
} from "./onboardingTaste";
import { SCENE_CHANNELS } from "./sceneChannels";

describe("onboardingTaste", () => {
  test("channel taps compile into genres, seed station, and axes", () => {
    const taste = compileOnboardingTaste({
      channelIds: ["metal", "downtempo"],
      energyId: "peak",
      stretchId: "close",
      artistNames: ["Riff City"],
    });
    expect(taste.genres).toContain("Metal");
    expect(taste.genres).toContain("Electronic");
    expect(taste.seedChannelId).toBe("metal");
    expect(taste.channelIds).toEqual(["metal", "downtempo"]);
    expect(taste.energyBand).toBe("peak");
    expect(taste.vibe).toBe("night");
    expect(taste.adventurous).toBe(22);
    expect(taste.depth).toBe(28);
    expect(taste.artistNames).toEqual(["Riff City"]);
  });

  test("skip seeds Variety Mix instead of an empty catalog dump", () => {
    const taste = compileOnboardingTaste({ skip: true });
    expect(taste.seedChannelId).toBe("variety-mix");
    expect(taste.channelIds).toEqual(["variety-mix"]);
    expect(taste.genres).toEqual([]);
    expect(taste.adventurous).toBe(50);
  });

  test("Local does not fake a genre lane", () => {
    expect(genresFromChannelIds(["local-pnw"])).toEqual([]);
    const taste = compileOnboardingTaste({ channelIds: ["local-pnw"] });
    expect(taste.genres).toEqual([]);
    expect(taste.seedChannelId).toBe("local-pnw");
  });

  test("rankChannelsForTaste leads with tuned stations, not only the showcase pin", () => {
    const ranked = rankChannelsForTaste(SCENE_CHANNELS, {
      channelIds: ["downtempo"],
      seedChannelId: "downtempo",
      genres: ["Electronic"],
    });
    expect(ranked[0].id).toBe("downtempo");
    expect(ranked.some((c) => c.id === "local-pnw")).toBe(true);
  });

  test("artist faces come from the tuned channel pool", () => {
    const tracks = [
      { id: "1", artist: "Riff", genre: "Metal", duration: 180, audioUrl: "a.mp3", playCount: 4, albumCover: "r.jpg" },
      { id: "2", artist: "Riff", genre: "Metal", duration: 180, audioUrl: "b.mp3", playCount: 1 },
      { id: "3", artist: "Soft", genre: "Jazz", duration: 180, audioUrl: "c.mp3", playCount: 9, albumCover: "s.jpg" },
    ];
    const faces = artistFacesForChannels(tracks, ["metal"], 8);
    expect(faces.some((f) => f.name === "Riff")).toBe(true);
    expect(faces.find((f) => f.name === "Riff")?.cover).toBe("r.jpg");
  });

  test("trackHitsPreferredChannels uses station membership", () => {
    const metal = { id: "m", genre: "Metal", duration: 180, audioUrl: "m.mp3" };
    const jazz = { id: "j", genre: "Jazz", duration: 180, audioUrl: "j.mp3" };
    expect(trackHitsPreferredChannels(metal, ["metal"])).toBe(true);
    expect(trackHitsPreferredChannels(jazz, ["metal"])).toBe(false);
  });

  test("onboarding version is stamped for future migrations", () => {
    expect(ONBOARDING_VERSION).toBe(2);
  });
});
