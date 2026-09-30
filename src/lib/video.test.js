import { resolveVideoUrl, syncVideoToProgress, trackHasVideo } from "./video";

describe("video helpers", () => {
  test("trackHasVideo requires a non-empty videoUrl", () => {
    expect(trackHasVideo(null)).toBe(false);
    expect(trackHasVideo({})).toBe(false);
    expect(trackHasVideo({ videoUrl: "  " })).toBe(false);
    expect(trackHasVideo({ videoUrl: "https://cdn.example/cut.mp4" })).toBe(true);
  });

  test("resolveVideoUrl trims or returns null", () => {
    expect(resolveVideoUrl({ videoUrl: " https://cdn.example/cut.mp4 " })).toBe(
      "https://cdn.example/cut.mp4"
    );
    expect(resolveVideoUrl({ videoUrl: "" })).toBe(null);
  });

  test("syncVideoToProgress seeks when drift exceeds tolerance", () => {
    const el = { currentTime: 0, paused: true, play: jest.fn(() => Promise.resolve()), pause: jest.fn() };
    syncVideoToProgress(el, 12, { playing: true, tolerance: 0.45 });
    expect(el.currentTime).toBe(12);
    expect(el.play).toHaveBeenCalled();
  });
});
