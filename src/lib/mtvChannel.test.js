import { trackHasVideo, resolveVideoUrl } from "./video";
import {
  captureChartSnapshot,
  enrichCountdownWithHistory,
  ensureTodayChart,
  getChartSnapshot,
  weekKey,
} from "./chartHistory";
import { availableSceneChannels, buildSceneChannelPool, getSceneChannel } from "./sceneChannels";
import { pickTrackBumper, STATION_IDENTS } from "./bumpers";
import { brandStoragePrefix } from "../brand/identity";

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
    expect(buildSceneChannelPool(tracks, rap).length).toBeGreaterThanOrEqual(2);
    expect(availableSceneChannels(tracks, 2).some((c) => c.id === "rap-city")).toBe(true);
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
