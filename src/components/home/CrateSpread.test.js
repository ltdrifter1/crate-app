/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import CrateSpread from "./CrateSpread";

const tracks = [
  {
    id: "t1",
    title: "Warehouse",
    artist: "Signal",
    albumCover: "cover-a.jpg",
    bpm: 124,
    camelot: "8A",
    energy: 7,
  },
  {
    id: "t2",
    title: "Soft Room",
    artist: "Lumen",
    albumCover: "cover-b.jpg",
    bpm: 118,
    camelot: "7A",
  },
  {
    id: "t3",
    title: "Porch Light",
    artist: "Willow",
    albumCover: "cover-c.jpg",
  },
];

function moreTracks() {
  return Array.from({ length: 9 }, (_, i) => ({
    id: `c${i + 1}`,
    title: `Cut ${i + 1}`,
    artist: "Signal",
    albumCover: `cover-${i + 1}.jpg`,
    bpm: 120 + i,
    camelot: "8A",
    energy: 5,
  }));
}

test("CrateSpread plays the lead sleeve and stacked cuts", async () => {
  const onPlayTrack = jest.fn();
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(
      React.createElement(CrateSpread, {
        title: "Selected for you",
        subtitle: "Chosen for you",
        tracks,
        onPlayTrack,
      })
    );
  });
  expect(div.querySelector(".pmp-crate-spread")).toBeTruthy();
  expect(div.querySelector(".pmp-crate-lead")).toBeTruthy();
  expect(div.textContent).toMatch(/Selected for you/);
  expect(div.textContent).toMatch(/Warehouse/);
  expect(div.textContent).toMatch(/124 BPM/);
  expect(div.textContent).toMatch(/8A/);
  expect(div.textContent).toMatch(/Soft Room/);
  const lead = div.querySelector('button[aria-label="Play Warehouse by Signal"]');
  expect(lead).toBeTruthy();
  expect(lead.className).toMatch(/pmp-crate-lead/);
  await act(async () => {
    lead.click();
  });
  expect(onPlayTrack).toHaveBeenCalledWith(tracks[0], tracks);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});

test("CrateSpread lays out a countdown as one sleeve grid with ranks", async () => {
  const catalog = moreTracks();
  const ranks = catalog.map((_, i) => i + 1);
  const onPlayTrack = jest.fn();
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(
      React.createElement(CrateSpread, {
        title: "Most Requested",
        subtitle: "Tonight's countdown",
        tracks: catalog,
        ranks,
        onPlayTrack,
      })
    );
  });
  expect(div.querySelectorAll(".pmp-crate-cell")).toHaveLength(8);
  expect(div.querySelector(".pmp-crate-lead").getAttribute("aria-label")).toMatch(/#1 Cut 1/);
  expect(div.textContent).toMatch(/#1/);
  expect(div.textContent).toMatch(/#5/);
  expect(div.textContent).toMatch(/#9/);
  expect(div.querySelectorAll("button[aria-label^='Play']")).toHaveLength(9);
  const fifth = div.querySelector('button[aria-label="Play #5 Cut 5 by Signal"]');
  expect(fifth).toBeTruthy();
  await act(async () => {
    fifth.click();
  });
  expect(onPlayTrack).toHaveBeenCalledWith(catalog[4], catalog);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});
