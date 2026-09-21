/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import GlassDock from "./GlassDock";

jest.mock("../../usePlayerPlayback", () => ({
  usePlayerPlayback: () => ({ progress: 45, duration: 261 }),
}));

jest.mock("../../usePlayerTransport", () => ({
  useIsPlaying: () => true,
  useIsBuffering: () => false,
}));

const TRACK = {
  id: "t1",
  title: "Sleeping In",
  artist: "The Postal Service",
  albumCover: "/brand/planet-mp3-lockup-on-black.png",
  bpm: 129,
  camelot: "8B",
  energy: 6,
  bitrate: 320,
};

describe("GlassDock mini player", () => {
  let div;
  let root;

  beforeEach(() => {
    div = document.createElement("div");
    document.body.appendChild(div);
    root = createRoot(div);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });

  test("collapsed bar is cover + title + play, without seek or pace", async () => {
    await act(async () => {
      root.render(
        React.createElement(GlassDock, {
          screen: "home",
          setScreen: () => {},
          track: TRACK,
          onTogglePlay: () => {},
          onSkip: () => {},
          onPrev: () => {},
          onLike: () => {},
          onSeek: () => {},
          isRadioMode: true,
          onOpen: () => {},
        })
      );
    });

    const mini = div.querySelector('[data-testid="mini-player"]');
    expect(mini).toBeTruthy();
    expect(mini.getAttribute("data-expanded")).toBe("false");
    expect(div.textContent).toMatch(/Sleeping In/);
    expect(div.textContent).toMatch(/The Postal Service/);
    expect(div.querySelector('[aria-label="Pause"]')).toBeTruthy();
    expect(div.querySelector('[aria-label="Next"]')).toBeTruthy();
    expect(div.querySelector('[data-testid="mini-player-sheet"]')).toBeNull();
    expect(div.querySelector('[aria-label="Seek"]')).toBeNull();
    expect(div.querySelector('[data-testid="pace-slot"]')).toBeNull();
    expect(div.textContent).not.toMatch(/Slow/);
    expect(div.querySelector('[aria-label="Home"]')).toBeTruthy();
    const play = div.querySelector('[aria-label="Pause"]');
    expect(play.style.width).toBe("44px");
    expect(play.style.height).toBe("44px");
  });

  test("expanding reveals seek, BPM, and pace without covering the collapsed bar", async () => {
    const onOpen = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(GlassDock, {
          screen: "home",
          setScreen: () => {},
          track: TRACK,
          onTogglePlay: () => {},
          onSkip: () => {},
          onPrev: () => {},
          onLike: () => {},
          onSeek: () => {},
          isRadioMode: true,
          onOpen,
        })
      );
    });

    await act(async () => {
      div.querySelector(".pmp-mini-bar").click();
    });

    const mini = div.querySelector('[data-testid="mini-player"]');
    expect(mini.getAttribute("data-expanded")).toBe("true");
    expect(div.querySelector('[data-testid="mini-player-sheet"]')).toBeTruthy();
    expect(div.querySelector('[aria-label="Seek"]')).toBeTruthy();
    expect(div.textContent).toMatch(/129 BPM/);
    expect(div.querySelector('[aria-label="Hide playback details"]')).toBeTruthy();
    expect(onOpen).not.toHaveBeenCalled();

    await act(async () => {
      await Promise.resolve();
    });
    expect(div.querySelector('[data-testid="pace-slot"]')).toBeTruthy();
    expect(div.textContent).toMatch(/Slow/);
    expect(div.textContent).toMatch(/Fast/);
  });

  test("expanded bar opens the full player; hide collapses details", async () => {
    const onOpen = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(GlassDock, {
          screen: "explore",
          setScreen: () => {},
          track: TRACK,
          onTogglePlay: () => {},
          onSkip: () => {},
          onPrev: () => {},
          onLike: () => {},
          onSeek: () => {},
          onOpen,
        })
      );
    });

    await act(async () => {
      div.querySelector(".pmp-mini-bar").click();
    });
    await act(async () => {
      div.querySelector(".pmp-mini-bar").click();
    });
    expect(onOpen).toHaveBeenCalledTimes(1);

    await act(async () => {
      div.querySelector('[aria-label="Hide playback details"]').click();
    });
    expect(div.querySelector('[data-testid="mini-player"]').getAttribute("data-expanded")).toBe("false");
    expect(div.querySelector('[data-testid="mini-player-sheet"]')).toBeNull();
  });

  test("hidePlayer leaves tabs only", async () => {
    await act(async () => {
      root.render(
        React.createElement(GlassDock, {
          screen: "home",
          setScreen: () => {},
          track: TRACK,
          hidePlayer: true,
          onTogglePlay: () => {},
          onSkip: () => {},
          onLike: () => {},
          onOpen: () => {},
        })
      );
    });
    expect(div.querySelector('[data-testid="mini-player"]')).toBeNull();
    expect(div.querySelector('[aria-label="Home"]')).toBeTruthy();
    expect(div.textContent).not.toMatch(/Sleeping In/);
  });
});
