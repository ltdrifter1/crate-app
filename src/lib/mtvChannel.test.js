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
import { availableSceneChannels, decorateSceneChannels, buildSceneChannelPool, channelCoverUrls, getSceneChannel, getShowcaseChannel, SHOWCASE_CHANNEL_ID, SCENE_CHANNELS, CHANNEL_SOURCE_NOTES, CHANNEL_BATCH_PREFIXES, trackMatchesChannel, matchesChannelBatch, isVarietyCuratorTrack, buildCrossGenreVarietyPool, isElectronicUndergroundTrack } from "./sceneChannels";
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
  test("dials CH-01 through CH-10 with Channel Surfing names", () => {
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
      [10, "Downtempo"],
    ]);
    expect(CHANNEL_SOURCE_NOTES["y2k-dance"].source).toBe("genre");
    expect(CHANNEL_SOURCE_NOTES["local-pnw"].source).toBe("audioasis");
    expect(CHANNEL_SOURCE_NOTES["local-pnw"].showcase).toBe(true);
    expect(SHOWCASE_CHANNEL_ID).toBe("local-pnw");
    expect(getShowcaseChannel()?.id).toBe("local-pnw");
    expect(getSceneChannel("showcase")?.id).toBe("local-pnw");
    expect(getSceneChannel("local-pnw").showcase).toBe(true);
    expect(CHANNEL_SOURCE_NOTES["variety-mix"].source).toBe("variety");
    expect(CHANNEL_SOURCE_NOTES["electronic-underground"].source).toBe("expansions");
    expect(CHANNEL_SOURCE_NOTES.metal.source).toBe("metal");
    expect(CHANNEL_SOURCE_NOTES.punk.source).toBe("punk");
    expect(CHANNEL_SOURCE_NOTES["country-folk"].source).toBe("country-folk");
    expect(CHANNEL_SOURCE_NOTES.downtempo.source).toBe("genre");
    expect(CHANNEL_BATCH_PREFIXES.metal).toContain("metal");
    expect(CHANNEL_BATCH_PREFIXES.punk).toContain("punk");
    expect(CHANNEL_BATCH_PREFIXES["country-folk"]).toContain("country-folk");
    expect(CHANNEL_BATCH_PREFIXES.downtempo).toContain("downtempo");
    expect(SCENE_CHANNELS).toHaveLength(10);
    expect(SCENE_CHANNELS.every((c) => Boolean(c.id))).toBe(true);
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
    const varietyPool = buildSceneChannelPool(tracks, variety);
    expect(varietyPool.length).toBeGreaterThanOrEqual(2);
    expect(varietyPool.length).toBeLessThanOrEqual(tracks.length);
    // Cross-genre mix should not dump a single-genre shelf first
    const genres = new Set(varietyPool.map((t) => t.genre));
    expect(genres.size).toBeGreaterThanOrEqual(2);
  });

  test("CH-02 Variety Mix prefers curator batch when present", () => {
    const variety = getSceneChannel("variety-mix");
    const tracks = [
      { id: "1", title: "A", genre: "Rock", duration: 180, audioUrl: "u", batch: "variety-wave-1" },
      { id: "2", title: "B", genre: "Jazz", duration: 180, audioUrl: "u", curated: true },
      { id: "3", title: "C", genre: "Pop", duration: 180, audioUrl: "u" },
      { id: "4", title: "D", genre: "Metal", duration: 180, audioUrl: "u" },
    ];
    expect(isVarietyCuratorTrack(tracks[0])).toBe(true);
    expect(isVarietyCuratorTrack(tracks[2])).toBe(false);
    expect(CHANNEL_BATCH_PREFIXES["variety-mix"]).toContain("variety");
    const pool = buildSceneChannelPool(tracks, variety);
    expect(pool.map((t) => t.id).sort()).toEqual(["1", "2"]);
    expect(buildCrossGenreVarietyPool(tracks, 3).length).toBe(3);
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
    expect(decorateSceneChannels(tracks, 1)[0].id).toBe("local-pnw");
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

  test("CH-04 Electronic matches expansions batch waves", () => {
    const electronic = getSceneChannel("electronic-underground");
    expect(electronic.preferMatch).toBe(true);
    const tracks = [
      { id: "e1", title: "Warehouse", artist: "A", duration: 180, audioUrl: "u", batch: "expansions-wave-1" },
      { id: "e2", title: "Soft Pop", artist: "B", genre: "Pop", duration: 180, audioUrl: "u", energy: 3 },
      { id: "e3", title: "Techno", artist: "C", duration: 180, audioUrl: "u", sceneId: "techno" },
    ];
    expect(isElectronicUndergroundTrack(tracks[0])).toBe(true);
    expect(isElectronicUndergroundTrack(tracks[1])).toBe(false);
    expect(buildSceneChannelPool(tracks, electronic).map((t) => t.id).sort()).toEqual(["e1", "e3"]);
  });

  test("channelCoverUrls prefers explicit art, not webpack photos", () => {
    const underground = getSceneChannel("electronic-underground");
    expect(underground.art).toBeUndefined();
    expect(channelCoverUrls([], underground, 4)).toEqual([]);
    expect(channelCoverUrls([], { ...underground, art: "/channels/electronic.jpg" }, 4)).toEqual([
      "/channels/electronic.jpg",
    ]);
    expect(decorateSceneChannels([], 1)).toHaveLength(10);
    expect(decorateSceneChannels([], 1).some((c) => c.id === "downtempo")).toBe(true);
  });

  test("CH-10 Downtempo matches trip-hop, chill, and ambient", () => {
    const ch = getSceneChannel("downtempo");
    expect(ch.num).toBe(10);
    expect(ch.title).toBe("Downtempo");
    const tracks = [
      { id: "1", title: "Slow", genre: "Downtempo", duration: 180, audioUrl: "u" },
      { id: "2", title: "Trip Hop Night", artist: "X", duration: 180, audioUrl: "u" },
      { id: "3", title: "Haze", genre: "Ambient", duration: 180, audioUrl: "u" },
      { id: "4", title: "Riff", genre: "Metal", duration: 180, audioUrl: "u" },
      { id: "5", title: "Batch Chill", artist: "Y", duration: 180, audioUrl: "u", batch: "downtempo-wave-1" },
    ];
    expect(buildSceneChannelPool(tracks, ch).map((t) => t.id).sort()).toEqual(["1", "2", "3", "5"]);
    expect(availableSceneChannels(tracks, 1).some((c) => c.id === "downtempo")).toBe(true);
  });

  test("channel keywords use whole tokens, not substrings", () => {
    const local = getSceneChannel("local-pnw");
    const metal = getSceneChannel("metal");
    const punk = getSceneChannel("punk");
    const shoe = getSceneChannel("shoegaze");
    const country = getSceneChannel("country-folk");
    const y2k = getSceneChannel("y2k-dance");
    const dnb = getSceneChannel("drum-and-bass");

    expect(trackMatchesChannel({ title: "The Bends", artist: "Radiohead", genre: "Rock", duration: 180, audioUrl: "u" }, local)).toBe(false);
    expect(trackMatchesChannel({ title: "Just The Two Of Us", artist: "Grover Washington Jr.", genre: "R&B & Soul", duration: 180, audioUrl: "u" }, local)).toBe(false);
    expect(trackMatchesChannel({ title: "Fog Cut", artist: "Seattle Dual", genre: "Electronic", duration: 180, audioUrl: "u" }, local)).toBe(true);

    expect(trackMatchesChannel({ title: "Rhymes Like Dimes", artist: "MF DOOM", genre: "Hip-Hop", duration: 180, audioUrl: "u" }, metal)).toBe(false);
    expect(trackMatchesChannel({ title: "Honey Bucket", artist: "Melvins", genre: "Metal", duration: 180, audioUrl: "u" }, metal)).toBe(true);
    expect(trackMatchesChannel({ title: "Electrified Teenybop!", artist: "Stereolab", album: "Instant Holograms On Metal Film", genre: "Rock", duration: 180, audioUrl: "u" }, metal)).toBe(false);

    expect(trackMatchesChannel({ title: "One More Time", artist: "Daft Punk", genre: "Electronic", duration: 180, audioUrl: "u" }, punk)).toBe(false);
    expect(trackMatchesChannel({ title: "Sheena Is a Punk Rocker", artist: "Ramones", genre: "Rock", duration: 180, audioUrl: "u" }, punk)).toBe(true);

    expect(trackMatchesChannel({ title: "Ceremony", artist: "Wussy", genre: "Rock", duration: 180, audioUrl: "u" }, shoe)).toBe(false);
    expect(trackMatchesChannel({ title: "Sleigh Ride", artist: "The Ventures", genre: "Rock", duration: 180, audioUrl: "u" }, shoe)).toBe(false);
    expect(trackMatchesChannel({ title: "Only Shallow", artist: "My Bloody Valentine", duration: 180, audioUrl: "u" }, shoe)).toBe(true);

    expect(trackMatchesChannel({ title: "Star/Pointro", artist: "The Roots", genre: "Hip-Hop", duration: 180, audioUrl: "u" }, country)).toBe(false);

    const fastElectronic = { title: "Break Science", artist: "X", genre: "Electronic", duration: 180, audioUrl: "u", bpm: 174, energy: 6 };
    const midElectronic = { title: "Pad Job", artist: "Y", genre: "Electronic", duration: 180, audioUrl: "u", bpm: 145, energy: 5 };
    const garage = { title: "Garage", artist: "Z", genre: "Electronic", duration: 180, audioUrl: "u", bpm: 132, energy: 6 };
    expect(trackMatchesChannel(fastElectronic, dnb)).toBe(true);
    expect(trackMatchesChannel(midElectronic, dnb)).toBe(false);
    expect(trackMatchesChannel(midElectronic, y2k)).toBe(false);
    expect(trackMatchesChannel(garage, y2k)).toBe(true);
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
  test("returns ident or null — never a modal on every cut", () => {
    expect(STATION_IDENTS.length).toBeGreaterThan(0);
    const ident = pickTrackBumper({
      nextTrack: { title: "Next", artist: "A" },
      date: new Date("2024-06-03T16:00:00"),
    });
    expect(ident?.kicker).toBeTruthy();
    const quiet = pickTrackBumper({
      nextTrack: { title: "Next", artist: "A" },
      date: new Date("2024-06-03T16:04:00"),
    });
    expect(quiet).toBeNull();
  });
});
