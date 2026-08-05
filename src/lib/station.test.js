import {
  countdownScore,
  buildCountdown,
  stationDaypart,
  nowPlayingLowerThird,
  estimateLockedIn,
  buildStationTicker,
  addDedication,
  listDedications,
  hasRequestedToday,
  markRequestedToday,
  stationDayKey,
} from "./station";

describe("station", () => {
  const tracks = [
    { id: "1", title: "Quiet", artist: "A", duration: 180, playCount: 2, likeCount: 1 },
    { id: "2", title: "Hot", artist: "B", duration: 200, playCount: 20, likeCount: 8, requestCount: 5 },
    { id: "3", title: "Rising", artist: "C", duration: 190, playCount: 6, likeCount: 2, requestCount: 1 },
    { id: "4", title: "Long mix", artist: "D", duration: 1200, playCount: 99, requestCount: 99 },
  ];

  test("countdownScore weights requests hardest", () => {
    expect(countdownScore(tracks[1])).toBeGreaterThan(countdownScore(tracks[0]));
    expect(countdownScore({ requestCount: 2 })).toBeGreaterThan(countdownScore({ playCount: 10 }));
  });

  test("buildCountdown ranks by heat and skips long mixes", () => {
    const chart = buildCountdown(tracks, 10);
    expect(chart.map((c) => c.track.id)).toEqual(["2", "3", "1"]);
    expect(chart[0].rank).toBe(1);
    expect(chart[0].deltaLabel).toMatch(/HOT|↑/);
  });

  test("stationDaypart returns a labeled block", () => {
    const morning = stationDaypart(new Date("2024-06-01T10:00:00"));
    expect(morning.label).toBeTruthy();
    expect(morning.id).toBe("daytime");
  });

  test("nowPlayingLowerThird formats MTV-style graphic copy", () => {
    const line = nowPlayingLowerThird(
      { title: "Peak", artist: "Four Tet", genre: "House", year: 2003 },
      { rank: 3, daypart: { label: "After School Chaos" } }
    );
    expect(line.kicker).toContain("#3");
    expect(line.kicker).toContain("NOW PLAYING");
    expect(line.title).toBe("Peak");
    expect(line.meta).toContain("House");
  });

  test("estimateLockedIn stays in a believable band", () => {
    const n = estimateLockedIn(tracks[1], new Date("2024-06-01T20:00:00"));
    expect(n).toBeGreaterThanOrEqual(12);
    expect(n).toBeLessThan(600);
  });

  test("buildStationTicker includes on-air and countdown", () => {
    const chart = buildCountdown(tracks, 3);
    const ticker = buildStationTicker({
      countdown: chart,
      daypart: { label: "Prime Time Countdown" },
      communityMixTitle: "June Cut",
    });
    expect(ticker).toMatch(/ON AIR/);
    expect(ticker).toMatch(/MOST REQUESTED/);
    expect(ticker).toMatch(/June Cut/);
  });

  test("request ledger marks once per day", () => {
    const day = stationDayKey();
    const id = `req-test-${Date.now()}`;
    expect(hasRequestedToday(id, day)).toBe(false);
    expect(markRequestedToday(id, day)).toBe(true);
    expect(hasRequestedToday(id, day)).toBe(true);
    expect(markRequestedToday(id, day)).toBe(false);
  });

  test("dedications append to the feed", () => {
    const entry = addDedication({
      text: "For the night drive",
      fromName: "Test",
      trackTitle: "Hot",
    });
    expect(entry.text).toBe("For the night drive");
    expect(listDedications(5).some((d) => d.id === entry.id)).toBe(true);
  });
});
