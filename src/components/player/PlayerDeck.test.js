import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import PlayerDeck from "./PlayerDeck";

test("PlayerDeck is a PS1 glass plate with LCD seek, transport, and Pace", async () => {
  localStorage.clear();
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(
      React.createElement(PlayerDeck, {
        progress: 48,
        duration: 201,
        isPlaying: true,
        onTogglePlay: () => {},
        onPrev: () => {},
        onSkip: () => {},
        onLike: () => {},
        onDislike: () => {},
      })
    );
  });
  expect(div.querySelector('[data-testid="player-deck"]')).toBeTruthy();
  expect(div.querySelector(".pmp-deck-plate")).toBeTruthy();
  expect(div.querySelector(".pmp-deck-pad")).toBeTruthy();
  expect(div.querySelector(".pmp-seek__well")).toBeTruthy();
  expect(div.querySelector(".pmp-play-planet")).toBeTruthy();
  expect(div.querySelector('[aria-label="Previous"]')).toBeTruthy();
  expect(div.querySelector('[aria-label="Pause"]')).toBeTruthy();
  expect(div.querySelector('[aria-label="Next"]')).toBeTruthy();
  expect(div.querySelector('[aria-label="Like"]')).toBeTruthy();
  expect(div.querySelector('[aria-label="Dislike this track"]')).toBeTruthy();
  expect(div.querySelector('[aria-label="Pace"]')).toBeTruthy();
  expect(div.textContent).toMatch(/Slow/);
  expect(div.textContent).toMatch(/Fast/);
  expect(div.textContent).toMatch(/Next picks/);
  expect(div.querySelector('[data-testid="deck-hint"]')?.textContent).toMatch(
    /Slow and Fast change what plays next/
  );
  expect(div.textContent).toMatch(/Dislike steers/);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});
