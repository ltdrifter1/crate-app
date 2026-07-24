import {
  SCENES,
  SCENE_FAMILIES,
  matchSceneFromText,
  inferScene,
  inferSceneTags,
  enrichTracksWithScenes,
  trackMatchesScene,
  relatedScenes,
  sceneLineagePath,
  scenesByFamily,
  sceneGraph,
  displaySceneLabel,
  allSceneRooms,
} from "./scenes";

describe("scene taxonomy", () => {
  test("has rich scene set across families", () => {
    expect(SCENES.length).toBeGreaterThanOrEqual(20);
    expect(SCENE_FAMILIES.length).toBeGreaterThanOrEqual(5);
    expect(SCENES.map((s) => s.id)).toEqual(
      expect.arrayContaining(["uk-garage", "techno", "ambient", "jungle", "neo-soul"])
    );
  });

  test("matchSceneFromText restores labels normalizeGenre flattens", () => {
    expect(matchSceneFromText("UK Garage")?.id).toBe("uk-garage");
    expect(matchSceneFromText("techno")?.id).toBe("techno");
    expect(matchSceneFromText("ambient")?.id).toBe("ambient");
    expect(matchSceneFromText("2-step")?.id).toBe("uk-garage");
    expect(matchSceneFromText("DnB")?.id).toBe("drum-and-bass");
  });

  test("inferScene recovers techno from House + high energy/bpm", () => {
    const t = { genre: "House", energy: 9, bpm: 132, title: "Pulse", artist: "X" };
    expect(inferScene(t)?.id).toBe("techno");
  });

  test("inferScene recovers deep house from soft House", () => {
    const t = { genre: "House", energy: 3, bpm: 120, title: "Warm", artist: "Y" };
    expect(inferScene(t)?.id).toBe("deep-house");
  });

  test("inferScene uses keywords even when genre is coarse", () => {
    const t = { genre: "House", energy: 6, bpm: 132, artist: "DJ EZ", title: "Garage Set", album: "UKG" };
    expect(inferScene(t)?.id).toBe("uk-garage");
  });

  test("enrichTracksWithScenes attaches _scene", () => {
    const enriched = enrichTracksWithScenes([
      { id: "1", genre: "Jazz", energy: 3, duration: 200 },
    ]);
    expect(enriched[0]._scene.label).toBe("Jazz");
    expect(enriched[0]._scenes.length).toBeGreaterThan(0);
  });

  test("trackMatchesScene + relatedScenes", () => {
    const t = { genre: "UK Garage", energy: 6, bpm: 132 };
    expect(trackMatchesScene(t, "uk-garage")).toBe(true);
    expect(relatedScenes("uk-garage").map((s) => s.id)).toEqual(
      expect.arrayContaining(["broken-beat", "grime"])
    );
  });

  test("sceneLineagePath walks related graph", () => {
    const path = sceneLineagePath("uk-garage", 4);
    expect(path.title).toMatch(/UK Garage/);
    expect(path.steps.length).toBeGreaterThanOrEqual(2);
    expect(path.steps[0].id).toBe("uk-garage");
  });

  test("richer scenes restore culture normalizeGenre flattens", () => {
    expect(matchSceneFromText("Amapiano")?.id).toBe("amapiano");
    expect(matchSceneFromText("Footwork")?.id).toBe("footwork");
    expect(matchSceneFromText("Liquid DnB")?.id).toBe("liquid");
    expect(matchSceneFromText("Dub")?.id).toBe("dub");
    expect(SCENES.length).toBeGreaterThanOrEqual(35);
  });

  test("scenesByFamily groups with counts", () => {
    const tracks = [
      { id: "1", genre: "Techno", energy: 8, bpm: 135, duration: 200 },
      { id: "2", genre: "Jazz", energy: 3, duration: 180 },
    ];
    const families = scenesByFamily(tracks);
    expect(families.some((f) => f.id === "dancefloor")).toBe(true);
    const dance = families.find((f) => f.id === "dancefloor");
    expect(dance.scenes.some((s) => s.id === "techno" && s.count >= 1)).toBe(true);
  });

  test("sceneGraph has nodes and edges", () => {
    const g = sceneGraph();
    expect(g.nodes.length).toBe(SCENES.length);
    expect(g.edges.length).toBeGreaterThan(10);
  });

  test("allSceneRooms produce filters", () => {
    const rooms = allSceneRooms();
    expect(rooms[0].id).toMatch(/^scene-/);
    expect(typeof rooms[0].filter).toBe("function");
  });

  test("displaySceneLabel prefers inferred scene", () => {
    expect(displaySceneLabel({ genre: "House", energy: 9, bpm: 140 })).toBe("Techno");
  });
});
