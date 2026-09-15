/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import SetBuilderScreen from "./SetBuilderScreen";

jest.mock("../ui/CoverImage", () => ({
  __esModule: true,
  default: function CoverImageStub() {
    return null;
  },
}));

function lib() {
  return Array.from({ length: 40 }, (_, i) => ({
    id: `t${i}`,
    title: `Cut ${i}`,
    artist: `Artist ${i % 5}`,
    genre: i % 2 ? "Electronic" : "Rock",
    energy: (i % 10) + 1,
    camelot: `${(i % 12) + 1}A`,
    duration: 180,
    albumCover: i % 3 === 0 ? `/c${i}.png` : null,
  }));
}

describe("SetBuilderScreen", () => {
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

  test("opens as an immersive booth, not a 3-step form", async () => {
    await act(async () => {
      root.render(React.createElement(SetBuilderScreen, {
        tracks: lib(),
        onClose: jest.fn(),
        onPlayRoute: jest.fn(),
      }));
    });
    expect(div.querySelector('[aria-label="Build a set"]')).toBeTruthy();
    expect(div.textContent).toMatch(/Build a set/);
    expect(div.textContent).toMatch(/In the booth|Sculpt/i);
    expect(div.textContent).toMatch(/IN THE BOOTH/);
    expect(div.textContent).toMatch(/Live set/);
    expect(div.textContent).not.toMatch(/How long\?/);
    expect(div.textContent).not.toMatch(/Choose vibe/);
    expect(div.textContent).not.toMatch(/1 \/ 3/);
  });

  test("live preview lists tracks and Play set hands off a queue", async () => {
    const onPlayRoute = jest.fn();
    const onClose = jest.fn();
    await act(async () => {
      root.render(React.createElement(SetBuilderScreen, {
        tracks: lib(),
        onClose,
        onPlayRoute,
        initialActivity: "party",
      }));
    });
    expect(div.textContent).toMatch(/Cut /);
    const play = [...div.querySelectorAll("button")].find((b) => b.textContent === "Play set");
    expect(play).toBeTruthy();
    await act(async () => {
      play.click();
    });
    expect(onPlayRoute).toHaveBeenCalled();
    const [queue, kind, label] = onPlayRoute.mock.calls[0];
    expect(kind).toBe("set");
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0]._phase).toBeUndefined();
    expect(label).toMatch(/Party/);
    expect(onClose).toHaveBeenCalled();
  });

  test("duration, vibe, and genre controls are tactile and wired", async () => {
    await act(async () => {
      root.render(React.createElement(SetBuilderScreen, {
        tracks: lib(),
        onClose: jest.fn(),
        onPlayRoute: jest.fn(),
      }));
    });
    const lengths = [...div.querySelectorAll('[aria-label="Set length"] button')].map((b) => b.textContent);
    expect(lengths).toEqual(["30 min", "1 hour", "2 hours", "4 hours", "All night"]);
    const vibes = [...div.querySelectorAll('[aria-label="Set vibe"] [role="option"]')].map((b) => b.textContent);
    expect(vibes.join(" ")).toMatch(/Night out/);
    expect(vibes.join(" ")).toMatch(/Workout/);
    const genres = [...div.querySelectorAll('[aria-label="Set genre"] button')].map((b) => b.textContent);
    expect(genres[0]).toBe("All");
    expect(genres).toEqual(expect.arrayContaining(["Electronic", "Rock"]));

    await act(async () => {
      div.querySelectorAll('[aria-label="Set length"] button')[0].click();
      [...div.querySelectorAll('[aria-label="Set vibe"] [role="option"]')]
        .find((b) => b.textContent.includes("Chill"))
        .click();
      [...div.querySelectorAll('[aria-label="Set genre"] button')]
        .find((b) => b.textContent === "Electronic")
        .click();
    });
    expect(div.textContent).toMatch(/Chill/);
    expect(div.textContent).toMatch(/30 min/);
  });

  test("save writes the generated track ids", async () => {
    const onSavePlaylist = jest.fn();
    await act(async () => {
      root.render(React.createElement(SetBuilderScreen, {
        tracks: lib(),
        onClose: jest.fn(),
        onPlayRoute: jest.fn(),
        onSavePlaylist,
      }));
    });
    const save = [...div.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Save set to Library");
    await act(async () => {
      save.click();
    });
    expect(onSavePlaylist).toHaveBeenCalled();
    const [name, ids] = onSavePlaylist.mock.calls[0];
    expect(name).toMatch(/·/);
    expect(ids.length).toBeGreaterThan(0);
    expect(typeof ids[0]).toBe("string");
  });
});
