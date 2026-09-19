import { catalogSleeveUrl, isChannelPictogram } from "./catalogSleeve";

describe("catalogSleeve", () => {
  test("rejects channel paths, webpack media, and jest file stubs", () => {
    expect(isChannelPictogram("/channels/house.png")).toBe(true);
    expect(isChannelPictogram("/static/media/techno.abc123.png")).toBe(true);
    expect(isChannelPictogram("hero-idle.png")).toBe(true);
    expect(isChannelPictogram("techno.png")).toBe(true);
    expect(catalogSleeveUrl("/channels/house.png")).toBeNull();
    expect(catalogSleeveUrl("https://cdn.example/sleeves/night.jpg")).toBe(
      "https://cdn.example/sleeves/night.jpg"
    );
    expect(catalogSleeveUrl("https://storage.googleapis.com/b/covers/metal.jpg")).toBe(
      "https://storage.googleapis.com/b/covers/metal.jpg"
    );
  });
});
