import {
  CLIMB_GREEN,
  HEAT_SEGMENTS,
  NEUTRAL_INK,
  boardCrawl,
  boardMaxScore,
  boardStats,
  channelForTrack,
  entryFromCountdown,
  entryScore,
  heatLevel,
  inkForTrack,
  rankLabel,
} from "./board";
import { SCENE_CHANNELS } from "./sceneChannels";
import { enrichCountdownWithHistory } from "./chartHistory";
import { brandStoragePrefix } from "../brand/identity";

describe("channelForTrack / inkForTrack", () => {
  const techno = { id: "t", title: "Warehouse", artist: "Gridlock", genre: "Techno", bpm: 132, energy: 9 };

  test("finds the dial channel and returns its ink", () => {
    expect(channelForTrack(techno)?.id).toBe("techno");
    expect(inkForTrack(techno)).toBe(SCENE_CHANNELS.find((c) => c.id === "techno").accent);
    expect(channelForTrack({ id: "m", title: "Slag", artist: "Foundry", genre: "Metal" })?.id).toBe("metal");
  });

  test("a track no station claims gets the neutral ink, not a random colour", () => {
    const jazz = { id: "j", title: "Modal Room", artist: "Lumen", genre: "Jazz" };
    expect(channelForTrack(jazz)).toBeNull();
    expect(inkForTrack(jazz)).toBe(NEUTRAL_INK);
    expect(channelForTrack(null)).toBeNull();
  });

  test("the catch-all Variety channel never claims a track by itself", () => {
    for (const g of ["Techno", "Metal", "Punk", "Jazz", "Pop", "Rock"]) {
      expect(channelForTrack({ id: g, title: "x", artist: "y", genre: g })?.id).not.toBe("variety-mix");
    }
  });

  test("the answer is cached per track object", () => {
    expect(channelForTrack(techno)).toBe(channelForTrack(techno));
  });
});

describe("heat", () => {
  const e = (o) => ({ requestCount: 0, playCount: 0, likeCount: 0, ...o });

  test("score prefers the stored score, else the station formula (requests ×12, plays ×1.4, likes ×3.2)", () => {
    expect(entryScore({ score: 50, requestCount: 99 })).toBe(50);
    expect(entryScore(e({ requestCount: 1 }))).toBe(12);
    expect(entryScore(e({ playCount: 10 }))).toBeCloseTo(14);
    expect(entryScore(e({ likeCount: 5 }))).toBeCloseTo(16);
    expect(entryScore(null)).toBe(0);
  });

  test("the hottest entry lights every segment; others scale; anything with heat lights at least one", () => {
    const board = [e({ requestCount: 10 }), e({ requestCount: 5 }), e({ playCount: 1 }), e({})];
    const max = boardMaxScore(board);
    expect(max).toBe(120);
    expect(heatLevel(board[0], max)).toBe(HEAT_SEGMENTS);
    expect(heatLevel(board[1], max)).toBe(5);
    expect(heatLevel(board[2], max)).toBe(1);
    expect(heatLevel(board[3], max)).toBe(0);
    expect(heatLevel(board[0], 0)).toBe(0);
  });
});

describe("boardStats", () => {
  test("counts movement and sums real request/play totals", () => {
    const stats = boardStats([
      { movement: "up", requestCount: 3, playCount: 10 },
      { movement: "debut", requestCount: 1, playCount: 2 },
      { movement: "down", requestCount: 0, playCount: 4 },
      { movement: "same" },
    ]);
    expect(stats).toEqual({ size: 4, climbing: 1, fresh: 1, requests: 4, plays: 16 });
  });
});

describe("labels and crawl", () => {
  test("rankLabel pads and guards", () => {
    expect(rankLabel(1)).toBe("01");
    expect(rankLabel(12)).toBe("12");
    expect(rankLabel(0)).toBe("--");
    expect(rankLabel("x")).toBe("--");
  });

  test("the crawl is the top five, with request counts only when there are some", () => {
    const entries = [
      { rank: 1, title: "Warehouse", artist: "Gridlock", requestCount: 37 },
      { rank: 2, title: "Concrete", artist: "Gridlock", requestCount: 1 },
      { rank: 3, title: "Deep Floor", artist: "Sol Park", requestCount: 0 },
      { rank: 4, title: "D", artist: "D" },
      { rank: 5, title: "E", artist: "E" },
      { rank: 6, title: "F", artist: "F" },
    ];
    const crawl = boardCrawl(entries);
    expect(crawl).toHaveLength(5);
    expect(crawl[0]).toBe("#1 WAREHOUSE — GRIDLOCK · 37 REQUESTS");
    expect(crawl[1]).toBe("#2 CONCRETE — GRIDLOCK · 1 REQUEST");
    expect(crawl[2]).toBe("#3 DEEP FLOOR — SOL PARK");
  });
});

test("entryFromCountdown flattens a countdown row", () => {
  const track = { id: "a", title: "A", artist: "X", albumCover: "/a.png", requestCount: 4, playCount: 9, likeCount: 2, bpm: 128, camelot: "8A" };
  const entry = entryFromCountdown({ rank: 3, track, score: 77, movement: "up", delta: 2 });
  expect(entry).toMatchObject({ rank: 3, id: "a", title: "A", movement: "up", delta: 2, requestCount: 4, bpm: 128, camelot: "8A", score: 77 });
  expect(entry.track).toBe(track);
  expect(entryFromCountdown({ rank: 1, track })).toMatchObject({ movement: "same", delta: 0 });
});

test("climbing is the only semantic colour: a green, not the live red", () => {
  expect(CLIMB_GREEN).toMatch(/^#[0-9a-f]{6}$/i);
  expect(CLIMB_GREEN.toLowerCase()).not.toBe("#e0314a");
});

describe("chart movement is honest about missing history", () => {
  beforeEach(() => {
    const prefix = `${brandStoragePrefix()}:chart:`;
    Object.keys(localStorage).forEach((k) => k.startsWith(prefix) && localStorage.removeItem(k));
  });
  const countdown = [
    { rank: 1, track: { id: "a" } },
    { rank: 2, track: { id: "b" } },
  ];

  test("no board from yesterday → no movement claims at all", () => {
    const rows = enrichCountdownWithHistory(countdown, "2026-10-05");
    expect(rows.map((r) => r.movement)).toEqual(["none", "none"]);
    expect(rows.every((r) => r.delta === null && r.previousRank === null)).toBe(true);
  });

  test("with yesterday on file, a track that was not on it is a debut", () => {
    localStorage.setItem(
      `${brandStoragePrefix()}:chart:day:2026-10-04`,
      JSON.stringify({ dayKey: "2026-10-04", entries: [{ rank: 1, id: "a" }] })
    );
    const rows = enrichCountdownWithHistory(countdown, "2026-10-05");
    expect(rows.map((r) => r.movement)).toEqual(["same", "debut"]);
  });
});
