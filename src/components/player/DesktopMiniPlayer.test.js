/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import DesktopMiniPlayer from "./DesktopMiniPlayer";

jest.mock("../../usePlayerPlayback", () => ({
  usePlayerPlayback: () => ({ progress: 12, duration: 180 }),
}));

jest.mock("../../usePlayerTransport", () => ({
  useIsPlaying: () => true,
}));

test("desktop mini player has Turtle / Rabbit, Share, and Up next", async () => {
  const onShare = jest.fn();
  const onShowQueue = jest.fn();
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(
      React.createElement(DesktopMiniPlayer, {
        track: {
          id: "t1",
          title: "Night Drive",
          artist: "Signal",
          albumCover: "/brand/planet-mp3-lockup-on-black.png",
        },
        isRadioMode: true,
        onOpen: () => {},
        onTogglePlay: () => {},
        onSkip: () => {},
        onPrev: () => {},
        onLikeToggle: () => {},
        onShare,
        onShowQueue,
        onSeek: () => {},
      })
    );
  });
  expect(div.querySelector('[data-testid="rabbit-turtle"]')).toBeTruthy();
  expect(div.querySelector('[aria-label="Share"]')).toBeTruthy();
  expect(div.querySelector('[aria-label="Up next"]')).toBeTruthy();
  await act(async () => {
    div.querySelector('[aria-label="Share"]').click();
    div.querySelector('[aria-label="Up next"]').click();
  });
  expect(onShare).toHaveBeenCalled();
  expect(onShowQueue).toHaveBeenCalled();
  await act(async () => root.unmount());
  document.body.removeChild(div);
});
