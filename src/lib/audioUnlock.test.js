import { canAttemptPlay, finishAudioUnlock, isUnlockStubSrc } from "./audioUnlock";

describe("audio unlock handshake", () => {
  test("treats empty and data: URLs as unlock stubs", () => {
    expect(isUnlockStubSrc("")).toBe(true);
    expect(isUnlockStubSrc("data:audio/wav;base64,AAA")).toBe(true);
    expect(isUnlockStubSrc("https://cdn.example/cut.mp3")).toBe(false);
  });

  test("canAttemptPlay requires a real src", () => {
    expect(canAttemptPlay(null)).toBe(false);
    expect(canAttemptPlay({ getAttribute: () => "", src: "" })).toBe(false);
    expect(canAttemptPlay({
      getAttribute: () => "https://cdn.example/cut.mp3",
      src: "https://cdn.example/cut.mp3",
    })).toBe(true);
  });

  test("finishAudioUnlock does not pause a real cut that loaded mid-handshake", () => {
    const pause = jest.fn();
    const load = jest.fn();
    const el = {
      src: "https://cdn.example/cut.mp3",
      muted: true,
      getAttribute: () => "https://cdn.example/cut.mp3",
      pause,
      load,
      removeAttribute: jest.fn(),
    };
    const result = finishAudioUnlock(el, { wasMuted: false });
    expect(result.tookOver).toBe(true);
    expect(pause).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
    expect(el.muted).toBe(false);
  });

  test("finishAudioUnlock clears the silent stub", () => {
    const pause = jest.fn();
    const load = jest.fn();
    const removeAttribute = jest.fn();
    const el = {
      src: "data:audio/wav;base64,AAA",
      muted: true,
      currentTime: 1,
      getAttribute: () => "data:audio/wav;base64,AAA",
      pause,
      load,
      removeAttribute,
    };
    const result = finishAudioUnlock(el, { wasMuted: false });
    expect(result.tookOver).toBe(false);
    expect(pause).toHaveBeenCalled();
    expect(removeAttribute).toHaveBeenCalledWith("src");
    expect(el.src).toBe("");
    expect(load).toHaveBeenCalled();
  });
});
