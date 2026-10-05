/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import HomeBoard from "./HomeBoard";
import { brandStoragePrefix } from "../../brand/identity";

jest.mock("../ui/CoverImage", () => ({
  __esModule: true,
  default: function CoverImageStub() {
    return null;
  },
}));

const mk = (n) => ({
  id: `t${n}`,
  title: `Track ${n}`,
  artist: `Artist ${n}`,
  genre: "Techno",
  albumCover: "/c.png",
  requestCount: 10 - n,
  playCount: 20 - n,
  duration: 200,
  audioUrl: "u",
});
const countdown = (n) => Array.from({ length: n }, (_, i) => ({ rank: i + 1, track: mk(i + 1), score: 100 - i }));

describe("HomeBoard", () => {
  let div;
  let root;
  beforeEach(() => {
    div = document.createElement("div");
    document.body.appendChild(div);
    root = createRoot(div);
    const prefix = `${brandStoragePrefix()}:`;
    Object.keys(localStorage).forEach((k) => k.startsWith(prefix) && localStorage.removeItem(k));
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.removeChild(div);
  });

  test("renders nothing until there are enough tracks to be a board", async () => {
    await act(async () => root.render(React.createElement(HomeBoard, { countdown: countdown(2) })));
    expect(div.querySelector("section")).toBeNull();
  });

  test("stays hidden while nothing has any heat — a chart of zeroes is just the catalog in id order", async () => {
    const cold = Array.from({ length: 6 }, (_, i) => ({
      rank: i + 1,
      track: { ...mk(i + 1), requestCount: 0, playCount: 0, likeCount: 0 },
      score: 0,
    }));
    await act(async () => root.render(React.createElement(HomeBoard, { countdown: cold })));
    expect(div.querySelector("section")).toBeNull();
  });

  test("shows the top five only, in rank order, with no movement claims and no invented numbers", async () => {
    await act(async () => root.render(React.createElement(HomeBoard, { countdown: countdown(9) })));
    expect(div.querySelector("section").getAttribute("aria-label")).toBe("The Board");
    const rows = [...div.querySelectorAll(".pmp-board-row")];
    expect(rows).toHaveLength(5);
    expect(rows[0].textContent).toMatch(/01/);
    expect(rows[0].textContent).toMatch(/Track 1/);
    expect(rows[4].textContent).toMatch(/Track 5/);
    expect(div.textContent).not.toMatch(/locked in/i);
    expect(div.querySelector('[aria-label="New"]')).toBeNull(); // no yesterday on file
  });

  test("a row plays the whole countdown from that track", async () => {
    const onPlayTrack = jest.fn();
    await act(async () => root.render(React.createElement(HomeBoard, { countdown: countdown(6), onPlayTrack })));
    await act(async () => div.querySelector('[aria-label="#2 Track 2 by Artist 2"]').click());
    expect(onPlayTrack).toHaveBeenCalledTimes(1);
    expect(onPlayTrack.mock.calls[0][0].id).toBe("t2");
    expect(onPlayTrack.mock.calls[0][1]).toHaveLength(6);
  });

  test("Full chart and Play the countdown are wired", async () => {
    const onOpenCharts = jest.fn();
    const onTune = jest.fn();
    await act(async () => root.render(React.createElement(HomeBoard, { countdown: countdown(5), onOpenCharts, onTune })));
    await act(async () => [...div.querySelectorAll("button")].find((b) => /Full chart/.test(b.textContent)).click());
    await act(async () => [...div.querySelectorAll("button")].find((b) => /Play the countdown/.test(b.textContent)).click());
    expect(onOpenCharts).toHaveBeenCalledTimes(1);
    expect(onTune).toHaveBeenCalledTimes(1);
  });

  test("the request key asks for that track and flips to spent", async () => {
    const onRequest = jest.fn((id) => {
      // the real handler marks the day's ledger synchronously
      require("../../lib/station").markRequestedToday(id);
    });
    await act(async () => root.render(React.createElement(HomeBoard, { countdown: countdown(5), onRequest })));
    const key = () => div.querySelector('[aria-label="Request Track 3"], [aria-label="Requested Track 3"]');
    expect(key().getAttribute("aria-pressed")).toBe("false");
    await act(async () => key().click());
    expect(onRequest).toHaveBeenCalledWith("t3");
    expect(key().getAttribute("aria-pressed")).toBe("true");
  });
});
