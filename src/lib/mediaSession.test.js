import {
  artworkForTrack,
  bindMediaSessionHandlers,
  mediaMetadataForTrack,
  syncMediaSession,
  syncMediaPosition,
} from "./mediaSession";

describe("mediaSession", () => {
  test("artworkForTrack is empty without a cover", () => {
    expect(artworkForTrack({})).toEqual([]);
    expect(artworkForTrack({ albumCover: "https://cdn.example/a.jpg" })).toHaveLength(3);
  });

  test("mediaMetadataForTrack fills title / artist / album", () => {
    const meta = mediaMetadataForTrack({
      title: "Gridlock",
      artist: "Warehouse",
      album: "Nights",
    });
    expect(meta.title).toBe("Gridlock");
    expect(meta.artist).toBe("Warehouse");
    expect(meta.album).toBe("Nights");
  });

  test("syncMediaSession is a no-op without the API", () => {
    expect(syncMediaSession({ title: "A" }, { playing: true })).toBe(false);
  });

  test("bindMediaSessionHandlers wires play/pause/next/prev/seek", () => {
    const calls = [];
    const handlers = {};
    const session = {
      setActionHandler: jest.fn((action, fn) => {
        handlers[action] = fn;
      }),
    };
    const win = { navigator: { mediaSession: session } };
    const unbind = bindMediaSessionHandlers(
      {
        play: () => calls.push("play"),
        pause: () => calls.push("pause"),
        next: () => calls.push("next"),
        prev: () => calls.push("prev"),
        seek: (t) => calls.push(`seek:${t}`),
      },
      win
    );
    handlers.play();
    handlers.nexttrack();
    handlers.seekto({ seekTime: 12 });
    expect(calls).toEqual(["play", "next", "seek:12"]);
    unbind();
    expect(session.setActionHandler).toHaveBeenCalledWith("play", null);
  });

  test("syncMediaPosition writes duration and clock", () => {
    const session = { setPositionState: jest.fn() };
    const win = { navigator: { mediaSession: session } };
    expect(syncMediaPosition({ duration: 120, position: 12, playbackRate: 1 }, win)).toBe(true);
    expect(session.setPositionState).toHaveBeenCalledWith({
      duration: 120,
      position: 12,
      playbackRate: 1,
    });
    expect(syncMediaPosition({ duration: 0, position: 0 }, win)).toBe(false);
  });
});
