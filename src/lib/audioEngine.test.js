import {
  READY_TO_FADE,
  READY_TO_PLAY,
  canInstantPromote,
  configureAudioElement,
  createAudioPair,
  elementSrc,
  equalPowerVolumes,
  fadeSecondsForMode,
  isWarmForUrl,
  preloadSrc,
  QUEUE_CROSSFADE_SECS,
  RADIO_CROSSFADE_SECS,
  remainingSeconds,
  shouldStartFade,
  shouldStartPreload,
  swapDeck,
} from "./audioEngine";

function fakeAudio({ src = "", readyState = 0 } = {}) {
  const attrs = { src };
  return {
    src,
    volume: 1,
    readyState,
    paused: true,
    duration: 180,
    currentTime: 0,
    getAttribute: (k) => (k === "src" ? attrs.src : null),
    setAttribute: (k, v) => {
      if (k === "src") attrs.src = v;
    },
    pause: jest.fn(),
    load: jest.fn(),
    play: jest.fn(() => Promise.resolve()),
  };
}

describe("audioEngine", () => {
  test("equalPowerVolumes is silent-out / full-in at the ends", () => {
    const start = equalPowerVolumes(0, 1);
    expect(start.out).toBeCloseTo(1, 5);
    expect(start.in).toBeCloseTo(0, 5);
    const end = equalPowerVolumes(1, 1);
    expect(end.out).toBeCloseTo(0, 5);
    expect(end.in).toBeCloseTo(1, 5);
    const mid = equalPowerVolumes(0.5, 0.8);
    expect(mid.out).toBeCloseTo(0.8 * Math.SQRT1_2, 5);
    expect(mid.in).toBeCloseTo(0.8 * Math.SQRT1_2, 5);
  });

  test("fadeSecondsForMode matches radio vs queue blend", () => {
    expect(fadeSecondsForMode(true)).toBe(RADIO_CROSSFADE_SECS);
    expect(fadeSecondsForMode(false)).toBe(QUEUE_CROSSFADE_SECS);
  });

  test("preloadSrc skips when the element already has the url", () => {
    const el = fakeAudio({ src: "https://cdn.example/a.mp3", readyState: 3 });
    el.src = "https://cdn.example/a.mp3";
    expect(preloadSrc(el, "https://cdn.example/a.mp3")).toBe(false);
    expect(el.load).not.toHaveBeenCalled();
  });

  test("preloadSrc loads a new url at volume 0", () => {
    const el = fakeAudio({ src: "" });
    expect(preloadSrc(el, "https://cdn.example/b.mp3")).toBe(true);
    expect(el.src).toBe("https://cdn.example/b.mp3");
    expect(el.volume).toBe(0);
    expect(el.load).toHaveBeenCalled();
  });

  test("canInstantPromote requires matching src and HAVE_CURRENT_DATA", () => {
    const url = "https://cdn.example/c.mp3";
    const cold = fakeAudio({ src: url, readyState: 1 });
    cold.src = url;
    expect(canInstantPromote(cold, url)).toBe(false);
    const warm = fakeAudio({ src: url, readyState: READY_TO_PLAY });
    warm.src = url;
    expect(canInstantPromote(warm, url)).toBe(true);
    expect(isWarmForUrl(warm, url, READY_TO_FADE)).toBe(false);
  });

  test("swapDeck exchanges primary and standby", () => {
    const pair = { primary: "A", standby: "B" };
    swapDeck(pair);
    expect(pair).toEqual({ primary: "B", standby: "A" });
  });

  test("shouldStartPreload / shouldStartFade use remaining time", () => {
    const el = { duration: 100, currentTime: 70 };
    expect(remainingSeconds(el)).toBe(30);
    expect(shouldStartPreload(el, 15, 20)).toBe(true);
    expect(shouldStartFade(el, 15)).toBe(false);
    el.currentTime = 90;
    expect(shouldStartFade(el, 15)).toBe(true);
  });

  test("configureAudioElement sets playsinline + preload auto", () => {
    const el = fakeAudio();
    configureAudioElement(el);
    expect(el.preload).toBe("auto");
    expect(el.playsInline).toBe(true);
  });

  test("createAudioPair returns configured A/B decks", () => {
    const orig = global.Audio;
    global.Audio = function AudioStub() {
      return fakeAudio();
    };
    try {
      const pair = createAudioPair();
      expect(pair.primary.preload).toBe("auto");
      expect(pair.standby.volume).toBe(0);
    } finally {
      global.Audio = orig;
    }
  });
});
