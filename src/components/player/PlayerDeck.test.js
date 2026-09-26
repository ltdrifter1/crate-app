import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import PlayerDeck from "./PlayerDeck";

test("PlayerDeck is a PS1 glass plate with LCD seek, transport, and Slow / Fast icons", async () => {
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
        onShare: () => {},
        onShowQueue: () => {},
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
  expect(div.querySelector('[aria-label="Share"]')).toBeTruthy();
  expect(div.querySelector('[aria-label="Up next"]')).toBeTruthy();
  expect(div.querySelector('[data-testid="rabbit-turtle"]')).toBeTruthy();
  expect(div.querySelector('[aria-label="Slow — slow down upcoming tracks"]')).toBeTruthy();
  expect(div.querySelector('[aria-label="Fast — speed up upcoming tracks"]')).toBeTruthy();
  expect(div.textContent).toMatch(/Slow/);
  expect(div.textContent).toMatch(/Fast/);
  expect(div.textContent).not.toMatch(/Turtle/);
  expect(div.textContent).not.toMatch(/Rabbit/);
  expect(div.querySelector('[data-testid="deck-hint"]')?.textContent).toMatch(
    /Slow or Fast changes what plays next/
  );
  expect(div.textContent).toMatch(/Dislike steers/);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});

test("idle PlayerDeck keeps Start listening plus Slow / Fast icons", async () => {
  localStorage.clear();
  const onStart = jest.fn();
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(
      React.createElement(PlayerDeck, {
        idle: true,
        onStart,
      })
    );
  });
  expect(div.querySelector('[data-testid="player-deck"]')).toBeTruthy();
  expect(div.querySelector(".pmp-seek__well")).toBeNull();
  expect(div.querySelector(".pmp-play-planet")).toBeNull();
  expect(div.querySelector('[aria-label="Start listening"]')).toBeTruthy();
  expect(div.querySelector('[data-testid="rabbit-turtle"]')).toBeTruthy();
  expect(div.querySelector('[data-testid="deck-hint"]')?.textContent).toMatch(
    /Slow or Fast changes what plays next/
  );
  expect(div.textContent).not.toMatch(/Dislike steers/);
  await act(async () => {
    div.querySelector('[aria-label="Start listening"]').click();
  });
  expect(onStart).toHaveBeenCalledTimes(1);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});
