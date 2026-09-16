import { enrichShow, getShowById } from "./shows";
import {
  pickTrackBumper,
  shouldFireTrackBumper,
  STATION_IDENTS,
  BUMPER_COOLDOWN_MS,
} from "./bumpers";

const mostRequested = enrichShow(getShowById("most-requested-live"));

describe("pickTrackBumper", () => {
  test("returns a station ident on slot 0", () => {
    const b = pickTrackBumper({
      nextTrack: { title: "Next", artist: "A" },
      date: new Date("2024-06-03T19:00:00"),
    });
    expect(STATION_IDENTS).toContainEqual(b);
  });

  test("returns the live show sting on slot 1 — not on every cut", () => {
    const b = pickTrackBumper({
      show: mostRequested,
      nextTrack: { title: "Next", artist: "A" },
      date: new Date("2024-06-03T19:11:00"),
    });
    expect(b.kicker).toBe("Most Requested");
    expect(b.title).toBe("What’s #1 tonight? We’re finding out live.");
    expect(b.subtitle).toBe("with Dez Rivera");
  });

  test("does not pop a full-screen Up Next on ordinary minutes", () => {
    const b = pickTrackBumper({
      show: mostRequested,
      nextTrack: { title: "Next", artist: "A" },
      countdownTop: { track: { title: "Heat", artist: "B" } },
      date: new Date("2024-06-03T19:04:00"),
    });
    expect(b).toBeNull();
  });
});

describe("shouldFireTrackBumper", () => {
  test("blocks restaging inside the cooldown window", () => {
    expect(shouldFireTrackBumper({ lastFiredAt: 1_000, now: 1_000 })).toBe(false);
    expect(shouldFireTrackBumper({
      lastFiredAt: 1_000,
      now: 1_000 + BUMPER_COOLDOWN_MS - 1,
    })).toBe(false);
    expect(shouldFireTrackBumper({
      lastFiredAt: 1_000,
      now: 1_000 + BUMPER_COOLDOWN_MS,
    })).toBe(true);
  });

  test("allows the first bumper of a session", () => {
    expect(shouldFireTrackBumper({ lastFiredAt: 0, now: 50 })).toBe(true);
  });
});
