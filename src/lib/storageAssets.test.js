const {
  hashedObjectName,
  injectSizeSuffix,
  thumbObjectPath,
  AUDIO_CACHE_CONTROL,
  THUMB_SIZES,
} = require("../../scripts/storageAssets.cjs");

describe("storageAssets", () => {
  test("hashedObjectName prefixes sha1-12 and is stable", () => {
    const buf = Buffer.from("planet-mp3");
    const a = hashedObjectName("cut.mp3", buf);
    const b = hashedObjectName("cut.mp3", buf);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{12}-cut\.mp3$/);
    expect(hashedObjectName(a, buf)).toBe(a);
  });

  test("thumbObjectPath matches Firebase Resize Images convention", () => {
    expect(injectSizeSuffix("art.jpg", 200)).toBe("art_200x200.jpg");
    expect(thumbObjectPath("covers/art.jpg", 400)).toBe("covers/art_400x400.jpg");
    expect(THUMB_SIZES).toEqual([200, 400, 800]);
    expect(AUDIO_CACHE_CONTROL).toMatch(/immutable/);
  });
});
