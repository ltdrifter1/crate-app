import {
  getFloorPhase,
  CLUB_ROOMS,
  roomForFloorPhase,
  getArrivalSoundEnabled,
  setArrivalSoundEnabled,
  enterRoomCue,
  hapticTap,
} from "./club";

describe("getFloorPhase", () => {
  test("maps peak hours", () => {
    expect(getFloorPhase(23).id).toBe("peak");
    expect(getFloorPhase(0).id).toBe("peak");
  });

  test("maps afterhours and closing", () => {
    expect(getFloorPhase(3).id).toBe("afterhours");
    expect(getFloorPhase(7).id).toBe("closing");
  });

  test("maps warmup and floor open", () => {
    expect(getFloorPhase(18).id).toBe("warmup");
    expect(getFloorPhase(12).id).toBe("floor");
  });
});

describe("CLUB_ROOMS", () => {
  test("has five rooms", () => {
    expect(CLUB_ROOMS.map((r) => r.label)).toEqual([
      "Warmup",
      "Peak",
      "Dark Room",
      "Afterhours",
      "Closing",
    ]);
  });

  test("filters by energy bands", () => {
    const peak = CLUB_ROOMS.find((r) => r.id === "peak");
    expect(peak.filter({ energy: 8 })).toBe(true);
    expect(peak.filter({ energy: 4 })).toBe(false);
  });
});

describe("roomForFloorPhase", () => {
  test("maps phase ids to room labels", () => {
    expect(roomForFloorPhase("peak")).toBe("Peak");
    expect(roomForFloorPhase("floor")).toBe("Warmup");
  });
});

describe("arrival sound preference", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("defaults to off", () => {
    expect(getArrivalSoundEnabled()).toBe(false);
  });

  test("persists on/off", () => {
    setArrivalSoundEnabled(true);
    expect(getArrivalSoundEnabled()).toBe(true);
    setArrivalSoundEnabled(false);
    expect(getArrivalSoundEnabled()).toBe(false);
  });

  test("enterRoomCue and hapticTap are safe no-ops when muted", () => {
    expect(() => enterRoomCue()).not.toThrow();
    expect(() => hapticTap()).not.toThrow();
  });
});
