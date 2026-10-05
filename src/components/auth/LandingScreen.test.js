/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import LandingScreen, { liveChartRows } from "./LandingScreen";

const entry = (rank, title, deltaLabel = "·") => ({
  rank,
  deltaLabel,
  track: { id: `t${rank}`, title, artist: `Artist ${rank}` },
});

describe("liveChartRows", () => {
  test("is null until there are enough tracks to be a board", () => {
    expect(liveChartRows([])).toBeNull();
    expect(liveChartRows(undefined)).toBeNull();
    expect(liveChartRows([entry(1, "A"), entry(2, "B")])).toBeNull();
  });

  test("takes the top five of the real countdown and only claims movement the data has", () => {
    const rows = liveChartRows([
      entry(1, "One", "↑ HOT"),
      entry(2, "Two", "↑"),
      entry(3, "Three", "NEW"),
      entry(4, "Four", "●"),
      entry(5, "Five", "·"),
      entry(6, "Six", "↑ HOT"),
    ]);
    expect(rows.map((r) => r.title)).toEqual(["One", "Two", "Three", "Four", "Five"]);
    expect(rows.map((r) => r.dir)).toEqual(["▲ HOT", "▲", "NEW", "", ""]);
    expect(rows[0].artist).toBe("Artist 1");
  });
});

describe("LandingScreen chart card", () => {
  async function render(props) {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(React.createElement(LandingScreen, { onSignUp() {}, onLogIn() {}, onGoogleSignIn() {}, ...props }));
    });
    return { div, cleanup: async () => { await act(async () => root.unmount()); document.body.removeChild(div); } };
  }

  test("without catalog data the board says it is a sample and prints no movement arrows", async () => {
    const { div, cleanup } = await render({ chart: [] });
    expect(div.textContent).toMatch(/Sample board/i);
    expect(div.textContent).toMatch(/NOT LIVE DATA/);
    expect(div.textContent).not.toMatch(/[▲▼]/);
    await cleanup();
  });

  test("with a real countdown it prints that chart, not the sample", async () => {
    const chart = [1, 2, 3, 4, 5].map((n) => entry(n, `Real Track ${n}`, n === 1 ? "↑ HOT" : "·"));
    const { div, cleanup } = await render({ chart });
    expect(div.textContent).toMatch(/This Month's Chart/);
    expect(div.textContent).toMatch(/Real Track 1/);
    expect(div.textContent).not.toMatch(/Drexciya/);
    expect(div.textContent).not.toMatch(/Sample board/i);
    await cleanup();
  });
});
