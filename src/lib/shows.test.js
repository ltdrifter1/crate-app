import {
  STATION_SHOWS,
  VJ_HOSTS,
  buildDailyGuide,
  buildShowPool,
  enrichShow,
  formatRemaining,
  formatShowClock,
  formatShowRange,
  getHost,
  getShowById,
  minutesUntilHour,
  nextShowAfter,
  pickShowBumper,
  resolveShowAt,
  showCoversHour,
  showHostCredit,
  showOnAirLabel,
  buildShowTickerBits,
} from "./shows";

describe("shows programming", () => {
  test("schedule covers a full day without gaps", () => {
    for (let h = 0; h < 24; h += 0.5) {
      const hit = STATION_SHOWS.find((s) => showCoversHour(s, h));
      expect(hit).toBeTruthy();
    }
  });

  test("resolveShowAt returns live show + next + remaining", () => {
    const afternoon = resolveShowAt(new Date("2024-06-03T16:30:00"));
    expect(afternoon.show.id).toBe("after-school-chaos");
    expect(afternoon.host.id).toBe("maya");
    expect(afternoon.nextShow.id).toBe("most-requested-live");
    expect(afternoon.remainingMinutes).toBeGreaterThan(0);
    expect(afternoon.progress).toBeGreaterThan(0);
    expect(afternoon.progress).toBeLessThan(1);
  });

  test("prime time is Most Requested with Dez", () => {
    const prime = resolveShowAt(new Date("2024-06-03T20:00:00"));
    expect(prime.show.id).toBe("most-requested-live");
    expect(prime.host.name).toBe("Dez Rivera");
  });

  test("night crash wraps past midnight", () => {
    const late = resolveShowAt(new Date("2024-06-03T02:15:00"));
    expect(late.show.id).toBe("night-crash");
    expect(late.host.id).toBe("jules");
  });

  test("buildDailyGuide flags live and up-next", () => {
    const guide = buildDailyGuide(new Date("2024-06-03T16:00:00"));
    expect(guide).toHaveLength(STATION_SHOWS.length);
    expect(guide.filter((g) => g.status === "live")).toHaveLength(1);
    expect(guide.find((g) => g.status === "live").id).toBe("after-school-chaos");
    expect(guide.find((g) => g.status === "up-next").id).toBe("most-requested-live");
  });

  test("buildShowPool countdown mode ranks by request heat", () => {
    const tracks = [
      { id: "a", title: "A", genre: "Pop", duration: 180, audioUrl: "x", playCount: 1 },
      { id: "b", title: "B", genre: "Pop", duration: 180, audioUrl: "x", playCount: 2, requestCount: 9 },
      { id: "c", title: "C", genre: "Pop", duration: 180, audioUrl: "x", playCount: 50 },
    ];
    const show = getShowById("most-requested-live");
    const pool = buildShowPool(tracks, show);
    expect(pool[0].id).toBe("b");
  });

  test("buildShowPool genre mode prefers show genres then falls back", () => {
    const tracks = [
      { id: "1", title: "Latin hit", genre: "Latin", duration: 180, audioUrl: "x", energy: 7 },
      { id: "2", title: "Jazz soft", genre: "Jazz", duration: 180, audioUrl: "x", energy: 3 },
      { id: "3", title: "Pop", genre: "Pop", duration: 180, audioUrl: "x", energy: 6 },
    ];
    const show = getShowById("lunch-frequency");
    const pool = buildShowPool(tracks, show);
    expect(pool.map((t) => t.id)).toContain("1");
    expect(pool.map((t) => t.id)).toContain("3");
  });

  test("buildShowPool never dead-airs on sparse catalog", () => {
    const tracks = [
      { id: "only", title: "Only", genre: "Classical", duration: 180, audioUrl: "x", energy: 2 },
    ];
    const show = getShowById("after-school-chaos");
    expect(buildShowPool(tracks, show)).toHaveLength(1);
  });

  test("formatters and host helpers", () => {
    expect(formatShowClock(15)).toBe("3:00 PM");
    expect(formatShowClock(0)).toBe("12:00 AM");
    expect(formatShowRange(15, 19)).toMatch(/3:00 PM/);
    expect(formatRemaining(42)).toBe("42 min left");
    expect(formatRemaining(1)).toBe("switching soon");
    expect(getHost("maya").monogram).toBe("MC");
    expect(getHost("nope").id).toBe("desk");
    const show = enrichShow(getShowById("alt-frequency"));
    expect(showOnAirLabel(show)).toBe("Alt Freq");
    expect(showHostCredit(show)).toBe("with Jules Okonkwo");
    expect(nextShowAfter(show).id).toBe("night-crash");
    expect(pickShowBumper(show, new Date("2024-06-03T22:10:00"))).toBeTruthy();
    expect(minutesUntilHour(19, new Date("2024-06-03T18:00:00"))).toBe(60);
  });

  test("buildShowTickerBits includes now and up next", () => {
    const live = resolveShowAt(new Date("2024-06-03T16:00:00"));
    const bits = buildShowTickerBits({
      show: live.show,
      nextShow: live.nextShow,
      bumper: "Maya’s running After School Chaos — send it.",
    });
    expect(bits.some((b) => b.includes("AFTER SCHOOL"))).toBe(true);
    expect(bits.some((b) => b.includes("MAYA"))).toBe(true);
    expect(bits.some((b) => b.includes("UP NEXT"))).toBe(true);
  });

  test("every show has a known host", () => {
    for (const show of STATION_SHOWS) {
      expect(VJ_HOSTS[show.hostId]).toBeTruthy();
      expect(show.bumpers.length).toBeGreaterThan(0);
      expect(show.intro).toBeTruthy();
    }
  });
});
