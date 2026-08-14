import { trackHasVideo, resolveVideoUrl } from "./video";
import {
  captureChartSnapshot,
  enrichCountdownWithHistory,
  ensureTodayChart,
  getChartSnapshot,
  weekKey,
  buildMonthlyChart,
  buildMonthlyReveal,
  filterTracksForChartScope,
  chartScopeKey,
  monthKey,
} from "./chartHistory";
import { availableSceneChannels, buildSceneChannelPool, channelCoverUrls, getSceneChannel, SCENE_CHANNELS, CHANNEL_SOURCE_NOTES, CHANNEL_BATCH_PREFIXES, trackMatchesChannel, matchesChannelBatch } from "./sceneChannels";
import { pickTrackBumper, STATION_IDENTS } from "./bumpers";
import { brandStoragePrefix } from "../brand/identity";
import {
  MAIN_CHANNEL,
  STATION_CALLSIGN,
  channelBugLine,
  formatChannelNum,
  resolveChannelBug,
} from "./mtvChannel";

describe("video helpers", () => {
  test("detects videoUrl", () => {
    expect(trackHasVideo({ videoUrl: "https://x/v.mp4" })).toBe(true);
    expect(trackHasVideo({ videoUrl: "  " })).toBe(false);
    expect(resolveVideoUrl({ videoUrl: " https://x/v.mp4 " })).toBe("https://x/v.mp4");
  });
});

describe("chartHistory", () => {
  beforeEach(() => {
    const prefix = `${brandStoragePrefix()}:chart:`;
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(prefix)) localStorage.removeItem(k);
    });
  });

  const tracks = [
    { id: "a", title: "A", artist: "X", duration: 180, audioUrl: "u", playCount: 2, requestCount: 1, genre: "Rock" },
    { id: "b", title: "B", artist: "Y", duration: 180, audioUrl: "u", playCount: 20, requestCount: 8, genre: "Electronic" },
    { id: "c", title: "C", artist: "Z", duration: 180, audioUrl: "u", playCount: 5, genre: "Rock" },
  ];

  test("captures snapshot and enrich movements", () => {
    const snap = ensureTodayChart(tracks);
    expect(snap.entries[0].id).toBe("b");
    expect(getChartSnapshot(snap.dayKey).entries).toHaveLength(3);

    // Simulate yesterday with different order
    const y = new Date();
    y.setUTCDate(y.getUTCDate() - 1);
    const yKey = y.toISOString().slice(0, 10);
    localStorage.setItem(
      `${brandStoragePrefix()}:chart:day:${yKey}`,
      JSON.stringify({
        dayKey: yKey,
        entries: [
          { rank: 1, id: "a", title: "A", artist: "X" },
          { rank: 2, id: "b", title: "B", artist: "Y" },
        ],
      })
    );

    const { buildCountdown } = require("./station");
    const live = enrichCountdownWithHistory(buildCountdown(tracks, 10), snap.dayKey);
    const b = live.find((c) => c.track.id === "b");
    expect(b.movement).toBe("up");
    expect(b.delta).toBe(1);
  });

  test("weekKey formats", () => {
    expect(weekKey(new Date("2024-06-03T12:00:00Z"))).toMatch(/^\d{4}-W\d{2}$/);
  });

  test("monthly chart overall and by genre", () => {
    const overall = buildMonthlyChart(tracks, { limit: 10, scope: { mode: "overall" } });
    expect(overall[0].track.id).toBe("b");
    expect(overall[0].monthKey).toBe(monthKey());

    const rock = buildMonthlyChart(tracks, { limit: 10, scope: { mode: "genre", genre: "Rock" } });
    expect(rock.map((c) => c.track.id)).toEqual(["a", "c"]);
    expect(chartScopeKey({ mode: "genre", genre: "Rock" })).toBe("genre:Rock");
  });

  test("monthly chart by channel filters membership", () => {
    const shoeTracks = [
      { id: "1", title: "Haze", genre: "Shoegaze", duration: 180, audioUrl: "u", requestCount: 4 },
      { id: "2", title: "Metal", genre: "Metal", duration: 180, audioUrl: "u", requestCount: 9 },
      { id: "3", title: "Bleed", genre: "Emo", duration: 180, audioUrl: "u", requestCount: 2 },
    ];
    const scoped = filterTracksForChartScope(shoeTracks, { mode: "channel", channelId: "shoegaze" });
    expect(scoped.map((t) => t.id).sort()).toEqual(["1", "3"]);
    const chart = buildMonthlyChart(shoeTracks, { scope: { mode: "channel", channelId: "shoegaze" } });
    expect(chart[0].track.id).toBe("1");
    expect(trackMatchesChannel(shoeTracks[0], getSceneChannel("shoegaze"))).toBe(true);
  });

  test("monthly reveal peaks from day snaps in month", () => {
    const key = monthKey();
    const day1 = `${key}-01`;
    const day2 = `${key}-02`;
    localStorage.setItem(
      `${brandStoragePrefix()}:chart:day:${day1}`,
      JSON.stringify({
        dayKey: day1,
        entries: [
          { rank: 1, id: "a", title: "A", artist: "X", score: 1 },
          { rank: 2, id: "b", title: "B", artist: "Y", score: 2 },
        ],
      })
    );
    localStorage.setItem(
      `${brandStoragePrefix()}:chart:day:${day2}`,
      JSON.stringify({
        dayKey: day2,
        entries: [
          { rank: 1, id: "b", title: "B", artist: "Y", score: 5 },
          { rank: 3, id: "a", title: "A", artist: "X", score: 1 },
        ],
      })
    );
    localStorage.setItem(
      `${brandStoragePrefix()}:chart:index`,
      JSON.stringify([day2, day1])
    );

    const reveal = buildMonthlyReveal(10, { tracks });
    expect(reveal[0].id).toBe("b");
    expect(reveal[0].monthRank).toBe(1);
    expect(reveal.find((e) => e.id === "a").rank).toBe(1);
  });
});

describe("sceneChannels", () => {
  test("dials CH-01 through CH-09 with Channel Surfing names", () => {
    expect(SCENE_CHANNELS.map((c) => [c.num, c.title])).toEqual([
      [1, "Y2K Dance"],
      [2, "Variety Mix"],
      [3, "Local Pacific Northwest"],
      [4, "Electronic"],
      [5, "Drum & Bass"],
      [6, "Emo & Shoegaze"],
      [7, "Metal"],
      [8, "Punk"],
      [9, "Country & Folk"],
    ]);
    expect(CHANNEL_SOURCE_NOTES["y2k-dance"].source).toBe("genre");
    expect(CHANNEL_SOURCE_NOTES["local-pnw"].source).toBe("audioasis");
    expect(CHANNEL_SOURCE_NOTES["variety-mix"].source).toBe("variety");
    expect(CHANNEL_SOURCE_NOTES["electronic-underground"].source).toBe("expansions");
    expect(CHANNEL_SOURCE_NOTES.metal.source).toBe("metal");
    expect(CHANNEL_SOURCE_NOTES.punk.source).toBe("punk");
    expect(CHANNEL_SOURCE_NOTES["country-folk"].source).toBe("country-folk");
    expect(CHANNEL_BATCH_PREFIXES.metal).toContain("metal");
    expect(CHANNEL_BATCH_PREFIXES.punk).toContain("punk");
    expect(CHANNEL_BATCH_PREFIXES["country-folk"]).toContain("country-folk");
    expect(getSceneChannel("variety-mix").tagline.toLowerCase()).not.toContain("evie");
    expect(getSceneChannel("electronic-underground").tagline.toLowerCase()).not.toContain("expansions");
  });

  test("builds pools and lists ready channels", () => {
    const tracks = [
      { id: "1", title: "Garage", genre: "Electronic", duration: 180, audioUrl: "u", sceneId: "uk-garage" },
      { id: "2", title: "Rap", genre: "Hip-Hop", duration: 180, audioUrl: "u" },
      { id: "3", title: "Rap2", genre: "Hip-Hop", duration: 180, audioUrl: "u" },
      { id: "4", title: "Rock", genre: "Rock", duration: 180, audioUrl: "u" },
      { id: "5", title: "Rock2", genre: "Rock", duration: 180, audioUrl: "u" },
    ];
    const dance = getSceneChannel("y2k-dance");
    expect(dance.num).toBe(1);
    expect(formatChannelNum(dance.num)).toBe("CH-01");
    expect(buildSceneChannelPool(tracks, dance).length).toBeGreaterThanOrEqual(1);
    expect(availableSceneChannels(tracks, 1).some((c) => c.id === "y2k-dance")).toBe(true);
    expect(getSceneChannel("house-ukg")?.id).toBe("y2k-dance");

    const variety = getSceneChannel("variety-mix");
    expect(variety.num).toBe(2);
    expect(availableSceneChannels(tracks, 2).some((c) => c.id === "variety-mix")).toBe(true);
    expect(getSceneChannel("rap-city")?.id).toBe("variety-mix");
  });

  test("CH-03 Local is Pacific Northwest only", () => {
    const local = getSceneChannel("local-pnw");
    expect(local.num).toBe(3);
    expect(local.title).toBe("Local Pacific Northwest");
    expect(local.tagline.toLowerCase()).toContain("pacific northwest");
    expect(getSceneChannel("techno-tunnel")?.id).toBe("local-pnw");

    const tracks = [
      { id: "1", title: "Fog Cut", artist: "Seattle Dual", genre: "Electronic", duration: 180, audioUrl: "u" },
      { id: "2", title: "Rain City", artist: "A", region: "pnw", duration: 200, audioUrl: "u" },
      { id: "3", title: "Techno", artist: "Berlin", genre: "Electronic", duration: 180, audioUrl: "u", sceneId: "techno" },
      { id: "4", title: "Other", artist: "NYC", genre: "Hip-Hop", duration: 180, audioUrl: "u" },
      { id: "5", title: "Batch", artist: "B", batch: "audioasis-wave-1", duration: 180, audioUrl: "u" },
    ];
    const pool = buildSceneChannelPool(tracks, local);
    expect(pool.map((t) => t.id).sort()).toEqual(["1", "2", "5"]);
    expect(availableSceneChannels(tracks, 3).some((c) => c.id === "local-pnw")).toBe(true);
  });

  test("CH-06 Emo & Shoegaze matches genre keywords only", () => {
    const shoe = getSceneChannel("shoegaze");
    expect(shoe.num).toBe(6);
    expect(shoe.title).toBe("Emo & Shoegaze");
    const tracks = [
      { id: "1", title: "Haze", genre: "Shoegaze", duration: 180, audioUrl: "u" },
      { id: "2", title: "Slowdive Cover", artist: "X", duration: 180, audioUrl: "u" },
      { id: "3", title: "Metal", genre: "Metal", duration: 180, audioUrl: "u" },
      { id: "4", title: "Bleed", genre: "Emo", duration: 180, audioUrl: "u" },
    ];
    expect(buildSceneChannelPool(tracks, shoe).map((t) => t.id).sort()).toEqual(["1", "2", "4"]);
  });

  test("CH-07/08/09 Metal Punk Country & Folk match their lanes", () => {
    const metal = getSceneChannel("metal");
    const punk = getSceneChannel("punk");
    const country = getSceneChannel("country-folk");
    expect(metal.num).toBe(7);
    expect(punk.num).toBe(8);
    expect(country.num).toBe(9);
    expect(formatChannelNum(metal.num)).toBe("CH-07");

    const tracks = [
      { id: "1", title: "Riff", genre: "Metal", duration: 180, audioUrl: "u" },
      { id: "2", title: "Thrash Cut", artist: "X", duration: 180, audioUrl: "u" },
      { id: "3", title: "Riot", genre: "Punk", duration: 180, audioUrl: "u" },
      { id: "4", title: "Post Punk Night", artist: "Y", duration: 180, audioUrl: "u" },
      { id: "5", title: "Dust", genre: "Country", duration: 180, audioUrl: "u" },
      { id: "6", title: "Porch", genre: "Folk", duration: 180, audioUrl: "u" },
      { id: "7", title: "House", genre: "Electronic", duration: 180, audioUrl: "u" },
      { id: "8", title: "Indie", genre: "Rock", duration: 180, audioUrl: "u" },
    ];
    expect(buildSceneChannelPool(tracks, metal).map((t) => t.id).sort()).toEqual(["1", "2"]);
    expect(buildSceneChannelPool(tracks, punk).map((t) => t.id).sort()).toEqual(["3", "4"]);
    expect(buildSceneChannelPool(tracks, country).map((t) => t.id).sort()).toEqual(["5", "6"]);
    expect(availableSceneChannels(tracks, 1).some((c) => c.id === "metal")).toBe(true);
    expect(availableSceneChannels(tracks, 1).some((c) => c.id === "punk")).toBe(true);
    expect(availableSceneChannels(tracks, 1).some((c) => c.id === "country-folk")).toBe(true);
  });

  test("CH-07/08/09 accept Audioasis-style batch tags without genre", () => {
    const metal = getSceneChannel("metal");
    const punk = getSceneChannel("punk");
    const country = getSceneChannel("country-folk");
    const tracks = [
      { id: "m", title: "Batch Metal", artist: "A", duration: 180, audioUrl: "u", batch: "metal-wave-1" },
      { id: "p", title: "Batch Punk", artist: "B", duration: 180, audioUrl: "u", batch: "punk-wave-2" },
      { id: "c", title: "Batch Country", artist: "C", duration: 180, audioUrl: "u", batch: "country-folk-wave-1" },
      { id: "x", title: "Other", artist: "D", duration: 180, audioUrl: "u", batch: "audioasis-wave-1" },
    ];
    expect(matchesChannelBatch(tracks[0], CHANNEL_BATCH_PREFIXES.metal)).toBe(true);
    expect(buildSceneChannelPool(tracks, metal).map((t) => t.id)).toEqual(["m"]);
    expect(buildSceneChannelPool(tracks, punk).map((t) => t.id)).toEqual(["p"]);
    expect(buildSceneChannelPool(tracks, country).map((t) => t.id)).toEqual(["c"]);
    expect(trackMatchesChannel(tracks[3], metal)).toBe(false);
  });

  test("channelCoverUrls returns distinct sleeves for mosaics", () => {
    const tracks = [
      { id: "1", title: "A", genre: "Electronic", duration: 180, audioUrl: "u", albumCover: "a.jpg", energy: 8, bpm: 130 },
      { id: "2", title: "B", genre: "Electronic", duration: 180, audioUrl: "u", albumCover: "b.jpg", energy: 8, bpm: 132 },
      { id: "3", title: "C", genre: "Electronic", duration: 180, audioUrl: "u", albumCover: "a.jpg", energy: 9 },
      { id: "4", title: "D", genre: "Electronic", duration: 180, audioUrl: "u", albumCover: "c.jpg", energy: 7, bpm: 128 },
      { id: "5", title: "E", genre: "Electronic", duration: 180, audioUrl: "u", albumCover: "d.jpg", energy: 8 },
    ];
    const underground = getSceneChannel("electronic-underground");
    const covers = channelCoverUrls(tracks, underground, 4);
    expect(covers).toHaveLength(4);
    expect(new Set(covers).size).toBe(4);
  });
});

describe("mtvChannel", () => {
  test("formats dial numbers and resolves bugs", () => {
    expect(STATION_CALLSIGN).toBe("PMP3");
    expect(formatChannelNum(7)).toBe("CH-07");
    expect(formatChannelNum(MAIN_CHANNEL.num)).toBe("CH-01");

    const main = resolveChannelBug({});
    expect(main.ch).toBe("CH-01");
    expect(main.slug).toBe("LIVE");
    expect(channelBugLine(main)).toBe("CH-01 · LIVE");

    const scene = resolveChannelBug({
      sceneChannel: getSceneChannel("local-pnw"),
    });
    expect(scene.ch).toBe("CH-03");
    expect(scene.slug).toContain("LOCAL");
  });
});

describe("bumpers", () => {
  test("returns ident or contextual bumper", () => {
    expect(STATION_IDENTS.length).toBeGreaterThan(0);
    const b = pickTrackBumper({
      nextTrack: { title: "Next", artist: "A" },
      date: new Date("2024-06-03T16:04:00"),
    });
    expect(b.title).toBeTruthy();
    expect(b.kicker).toBeTruthy();
  });
});
