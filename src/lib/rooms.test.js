import {
  CULTURE_ROOMS,
  allDestinationRooms,
  populateRoom,
  populateAllRooms,
  tonightRoom,
  roomsByKind,
  atmosphereGradient,
  roomPosterStyle,
  roomLabelForId,
  presencePhrase,
} from "./rooms";
import { CLUB_ROOMS } from "./club";

describe("CULTURE_ROOMS", () => {
  test("includes key destination rooms from the product vision", () => {
    const labels = CULTURE_ROOMS.map((r) => r.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "Sunday Morning",
        "Hidden Gems",
        "Warehouse",
        "Jazz Cafe",
        "Rain",
        "Summer 2026",
        "London",
        "Detroit",
        "Montreal",
      ])
    );
  });

  test("each room has kind, story, and filter", () => {
    CULTURE_ROOMS.forEach((r) => {
      expect(r.id).toBeTruthy();
      expect(r.kind).toBeTruthy();
      expect(r.story).toBeTruthy();
      expect(typeof r.filter).toBe("function");
    });
  });
});

describe("allDestinationRooms", () => {
  test("includes club floor rooms plus culture and scene rooms", () => {
    const all = allDestinationRooms();
    expect(all.length).toBeGreaterThan(CLUB_ROOMS.length + CULTURE_ROOMS.length);
    expect(all.some((r) => r.label === "Peak")).toBe(true);
    expect(all.some((r) => r.label === "Jazz Cafe")).toBe(true);
    expect(all.some((r) => r.id === "scene-techno" || r.label === "Techno")).toBe(true);
  });
});

describe("populateRoom", () => {
  const tracks = [
    { id: "1", title: "Soft", artist: "A", energy: 2, genre: "Jazz", duration: 200, liked: true },
    { id: "2", title: "Peak", artist: "B", energy: 9, genre: "House", duration: 220, playCount: 12 },
    { id: "3", title: "Long Mix", artist: "C", energy: 5, genre: "House", duration: 1200 },
  ];

  test("filters singles and scores featured", () => {
    const room = CULTURE_ROOMS.find((r) => r.id === "jazz-cafe");
    const populated = populateRoom(room, tracks);
    expect(populated.count).toBeGreaterThanOrEqual(1);
    expect(populated.featured.length).toBeGreaterThanOrEqual(1);
    expect(populated.tracks.every((t) => (t.duration || 0) <= 900)).toBe(true);
  });

  test("exposes quiet activity and cover", () => {
    const room = CLUB_ROOMS.find((r) => r.id === "peak");
    const populated = populateRoom(
      { ...room, kind: "time", story: room.desc, atmosphere: "peak" },
      tracks
    );
    expect(populated.coverTrack?.id).toBe("2");
    expect(populated.presence).toBe(0);
    expect(presencePhrase(populated)).toMatch(/Quiet|Ready|Yours/i);
  });
});

describe("populateAllRooms / tonightRoom / roomsByKind", () => {
  const tracks = [
    { id: "1", title: "A", artist: "X", energy: 3, genre: "Soul", duration: 180 },
    { id: "2", title: "B", artist: "Y", energy: 8, genre: "House", duration: 200, playCount: 5 },
    { id: "3", title: "C", artist: "Z", energy: 4, genre: "Jazz", duration: 210, liked: true, playCount: 0 },
  ];

  test("populateAllRooms drops empty rooms", () => {
    const rooms = populateAllRooms(tracks);
    expect(rooms.every((r) => r.count >= 1)).toBe(true);
  });

  test("tonightRoom returns a living floor destination", () => {
    const t = tonightRoom(tracks);
    expect(t.label).toBeTruthy();
    expect(t.floor).toBeTruthy();
    expect(Array.isArray(t.featured)).toBe(true);
  });

  test("roomsByKind nests taxonomy scenes under moreRooms", () => {
    const groups = roomsByKind(populateAllRooms(tracks));
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]).toHaveProperty("label");
    expect(groups[0]).toHaveProperty("rooms");
    const sceneGroup = groups.find((g) => g.kind === "scene");
    if (sceneGroup) {
      expect(Array.isArray(sceneGroup.moreRooms)).toBe(true);
      // Featured culture scenes stay visible; taxonomy nests
      const featuredAreCulture = sceneGroup.rooms.every(
        (r) => !String(r.id).startsWith("scene-")
      );
      expect(featuredAreCulture || sceneGroup.rooms.length <= 6).toBe(true);
    }
  });
});

describe("atmosphereGradient", () => {
  test("returns CSS gradients for known atmospheres", () => {
    expect(atmosphereGradient("amber-lamp")).toContain("radial-gradient");
    expect(atmosphereGradient("unknown-xyz")).toContain("radial-gradient");
  });
});

describe("roomLabelForId", () => {
  test("resolves culture and club room labels", () => {
    expect(roomLabelForId("jazz-cafe")).toBe("Jazz Cafe");
    expect(roomLabelForId("peak")).toBe("Peak");
    expect(roomLabelForId("missing-room-xyz")).toBeNull();
  });
});

describe("roomPosterStyle", () => {
  test("gives Sunday Morning and Warehouse distinct poster identities", () => {
    const dawn = roomPosterStyle("dawn-haze");
    const warehouse = roomPosterStyle("concrete");
    expect(dawn.gradient).not.toEqual(warehouse.gradient);
    expect(dawn.coverBlur).toBeGreaterThan(warehouse.coverBlur);
    expect(dawn.ambientDuration).toBeGreaterThan(warehouse.ambientDuration);
    expect(warehouse.texture).toBeTruthy();
    expect(dawn.titleSize).toBeTruthy();
  });

  test("accepts room objects and unknown atmospheres", () => {
    const fromRoom = roomPosterStyle({ atmosphere: "rain-glass", kind: "mood", id: "rain" });
    expect(fromRoom.texture).toBeTruthy();
    expect(fromRoom.letterSpacing).toBeLessThan(0);
    const fallback = roomPosterStyle("totally-unknown");
    expect(fallback.gradient).toContain("radial-gradient");
    expect(fallback.wash.size).toBeGreaterThan(0);
  });
});
