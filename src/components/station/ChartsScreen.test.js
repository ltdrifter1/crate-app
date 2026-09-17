/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import ChartsScreen from "./ChartsScreen";
import { fontDisplay } from "../../theme";
import { brandStoragePrefix } from "../../brand/identity";

jest.mock("../ui/CoverImage", () => ({
  __esModule: true,
  default: function CoverImageStub() {
    return null;
  },
}));

function tracksFixture() {
  return [
    { id: "a", title: "Night Drive", artist: "Signal", albumCover: "/a.png", genre: "Electronic", duration: 180, audioUrl: "u", playCount: 40, requestCount: 20 },
    { id: "b", title: "Cascade", artist: "Rain City", albumCover: "/b.png", genre: "Rock", duration: 180, audioUrl: "u", playCount: 12, requestCount: 4 },
    { id: "c", title: "Iron Lung", artist: "Foundry", albumCover: "/c.png", genre: "Metal", duration: 180, audioUrl: "u", playCount: 8, requestCount: 2 },
  ];
}

describe("ChartsScreen", () => {
  let div;
  let root;

  beforeEach(() => {
    div = document.createElement("div");
    document.body.appendChild(div);
    root = createRoot(div);
    const prefix = `${brandStoragePrefix()}:chart:`;
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(prefix)) localStorage.removeItem(k);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });

  test("empty board uses iOS copy, not a hardware LCD plate", async () => {
    await act(async () => {
      root.render(React.createElement(ChartsScreen, { tracks: [], countdown: [] }));
    });
    expect(div.querySelector("h1").textContent).toBe("Charts");
    expect(div.textContent).toMatch(/Play and request cuts/);
    expect(div.textContent).not.toMatch(/Station charts/);
  });

  test("renders premium hierarchy, segmented scope, and underline views", async () => {
    await act(async () => {
      root.render(React.createElement(ChartsScreen, { tracks: tracksFixture(), countdown: [] }));
    });
    const h1 = div.querySelector("h1");
    expect(h1.textContent).toBe("Charts");
    expect(h1.style.fontFamily).toContain("system-ui");
    expect(h1.style.textTransform).not.toBe("uppercase");

    const scope = [...div.querySelectorAll('[aria-label="Chart scope"] [role="tab"]')].map((el) => el.textContent);
    expect(scope).toEqual(["Overall", "Channel", "Genre"]);
    scope.forEach((_, i) => {
      const btn = div.querySelectorAll('[aria-label="Chart scope"] [role="tab"]')[i];
      expect(btn.style.fontFamily).toContain("system-ui");
      expect(btn.style.textTransform).not.toBe("uppercase");
    });

    const views = [...div.querySelectorAll('[aria-label="Chart view"] [role="tab"]')].map((el) => el.textContent);
    expect(views).toEqual(["This month", "Climbers", "#1s", "Past days"]);
    expect(div.textContent).toMatch(/Top 20/);
    expect(div.textContent).toMatch(/Night Drive/);
    expect(div.querySelector('[aria-label^="Play #1"]')).toBeTruthy();
  });

  test("play this chart and add-to-queue stay wired", async () => {
    const onTuneMonthly = jest.fn();
    const onPlayTrack = jest.fn();
    const onAddToQueue = jest.fn();
    await act(async () => {
      root.render(React.createElement(ChartsScreen, {
        tracks: tracksFixture(),
        countdown: [],
        onTuneMonthly,
        onPlayTrack,
        onAddToQueue,
      }));
    });

    await act(async () => {
      [...div.querySelectorAll("button")].find((b) => b.textContent === "Play this chart").click();
    });
    expect(onTuneMonthly).toHaveBeenCalledWith(expect.objectContaining({ mode: "overall" }));

    await act(async () => {
      div.querySelector('[aria-label="Add Night Drive to queue"]').click();
    });
    expect(onAddToQueue).toHaveBeenCalledWith(expect.objectContaining({ id: "a", title: "Night Drive" }));

    await act(async () => {
      div.querySelector('[aria-label="Play #1 Night Drive"]').click();
    });
    expect(onPlayTrack).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" }),
      expect.arrayContaining([expect.objectContaining({ id: "a" })])
    );
  });

  test("genre filter uses underline list, not pill chips", async () => {
    await act(async () => {
      root.render(React.createElement(ChartsScreen, { tracks: tracksFixture(), countdown: [] }));
    });
    await act(async () => {
      [...div.querySelectorAll('[aria-label="Chart scope"] [role="tab"]')].find((el) => el.textContent === "Genre").click();
    });
    const genres = [...div.querySelectorAll('[aria-label="Genre"] [role="tab"]')];
    expect(genres.map((el) => el.textContent)).toEqual(expect.arrayContaining(["Electronic", "Rock", "Metal"]));
    expect(genres[0].style.borderRadius).toBeFalsy();
    expect(genres[0].style.fontFamily).toContain("system-ui");
    expect(genres[0].style.textTransform).not.toBe("uppercase");
  });

  test("mobile browse control is available when provided", async () => {
    const onOpenMenu = jest.fn();
    await act(async () => {
      root.render(React.createElement(ChartsScreen, {
        tracks: tracksFixture(),
        onOpenMenu,
      }));
    });
    const browse = div.querySelector('button[aria-label="Browse"]');
    expect(browse).toBeTruthy();
    await act(async () => {
      browse.click();
    });
    expect(onOpenMenu).toHaveBeenCalled();
  });

  test("climbers empty state is editorial, not mono LCD", async () => {
    await act(async () => {
      root.render(React.createElement(ChartsScreen, { tracks: tracksFixture(), countdown: [] }));
    });
    await act(async () => {
      [...div.querySelectorAll('[aria-label="Chart view"] [role="tab"]')].find((el) => el.textContent === "Climbers").click();
    });
    expect(div.textContent).toMatch(/unlock climbers/);
    const status = div.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(status.style.fontFamily).not.toMatch(/mono/i);
  });
});

describe("Charts type tokens", () => {
  test("display stack is system-ui Music.app type", () => {
    expect(fontDisplay).toMatch(/^system-ui/);
    expect(fontDisplay).toMatch(/-apple-system/);
    expect(fontDisplay).toMatch(/SF Pro Display/);
    expect(fontDisplay).not.toMatch(/Inter/);
  });
});
