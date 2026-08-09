import { trackHasVideo, resolveVideoUrl } from "./video";
import {
  captureChartSnapshot,
  enrichCountdownWithHistory,
  ensureTodayChart,
  getChartSnapshot,
  weekKey,
} from "./chartHistory";
import { availableSceneChannels, buildSceneChannelPool, channelCoverUrls, getSceneChannel } from "./sceneChannels";
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
    { id: "a", title: "A", artist: "X", duration: 180, audioUrl: "u", playCount: 2, requestCount: 1 },
    { id: "b", title: "B", artist: "Y", duration: 180, audioUrl: "u", playCount: 20, requestCount: 8 },
    { id: "c", title: "C", artist: "Z", duration: 180, audioUrl: "u", playCount: 5 },
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
});

describe("sceneChannels", () => {
  test("builds pools and lists ready channels", () => {
    const tracks = [
      { id: "1", title: "Garage", genre: "Electronic", duration: 180, audioUrl: "u", sceneId: "uk-garage" },
      { id: "2", title: "Rap", genre: "Hip-Hop", duration: 180, audioUrl: "u" },
      { id: "3", title: "Rap2", genre: "Hip-Hop", duration: 180, audioUrl: "u" },
      { id: "4", title: "Rock", genre: "Rock", duration: 180, audioUrl: "u" },
      { id: "5", title: "Rock2", genre: "Rock", duration: 180, audioUrl: "u" },
    ];
    const rap = getSceneChannel("rap-city");
    expect(rap.num).toBe(3);
    expect(formatChannelNum(rap.num)).toBe("CH-03");
    expect(buildSceneChannelPool(tracks, rap).length).toBeGreaterThanOrEqual(2);
    expect(availableSceneChannels(tracks, 2).some((c) => c.id === "rap-city")).toBe(true);
  });

  test("CH-04 Local is Pacific Northwest only", () => {
    const local = getSceneChannel("local-pnw");
    expect(local.num).toBe(4);
    expect(local.title).toBe("Local");
    expect(local.tagline.toLowerCase()).toContain("pacific northwest");
    expect(getSceneChannel("techno-tunnel")?.id).toBe("local-pnw");

    const tracks = [
      { id: "1", title: "Fog Cut", artist: "Seattle Dual", genre: "Electronic", duration: 180, audioUrl: "u" },
      { id: "2", title: "Rain City", artist: "A", region: "pnw", duration: 200, audioUrl: "u" },
      { id: "3", title: "Techno", artist: "Berlin", genre: "Electronic", duration: 180, audioUrl: "u", sceneId: "techno" },
      { id: "4", title: "Other", artist: "NYC", genre: "Hip-Hop", duration: 180, audioUrl: "u" },
    ];
    const pool = buildSceneChannelPool(tracks, local);
    expect(pool.map((t) => t.id).sort()).toEqual(["1", "2"]);
    expect(availableSceneChannels(tracks, 3).some((c) => c.id === "local-pnw")).toBe(true);
  });

  test("channelCoverUrls returns distinct sleeves for mosaics", () => {
    const tracks = [
      { id: "1", title: "A", genre: "Hip-Hop", duration: 180, audioUrl: "u", albumCover: "a.jpg" },
      { id: "2", title: "B", genre: "Hip-Hop", duration: 180, audioUrl: "u", albumCover: "b.jpg" },
      { id: "3", title: "C", genre: "Hip-Hop", duration: 180, audioUrl: "u", albumCover: "a.jpg" },
      { id: "4", title: "D", genre: "Hip-Hop", duration: 180, audioUrl: "u", albumCover: "c.jpg" },
      { id: "5", title: "E", genre: "Hip-Hop", duration: 180, audioUrl: "u", albumCover: "d.jpg" },
    ];
    const rap = getSceneChannel("rap-city");
    const covers = channelCoverUrls(tracks, rap, 4);
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
      sceneChannel: getSceneChannel("rap-city"),
    });
    expect(scene.ch).toBe("CH-03");
    expect(scene.slug).toContain("RAP");
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
