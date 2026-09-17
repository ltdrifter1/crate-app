/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import ClubScreen from "./ClubScreen";

const user = { name: "Listener", genres: ["Electronic"], memberNumber: 11 };
const profile = {
  displayName: "Listener",
  memberNumber: 11,
  onboarded: true,
  tutorialSeen: true,
  featureGuideVersion: 1,
  adventurous: 40,
  depth: 50,
};

describe("ClubScreen feature guide", () => {
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

  test("Club tab has a review entry that opens the static guide", async () => {
    const onReplayTour = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ClubScreen, {
          user,
          tracks: [],
          onLogout: jest.fn(),
          profile,
          onReplayTour,
        })
      );
    });
    expect(div.textContent).toMatch(/Review the guide/);
    const open = [...div.querySelectorAll("button")].find((b) =>
      /Review the guide/.test(b.textContent)
    );
    expect(open).toBeTruthy();
    await act(async () => {
      open.click();
    });
    expect(div.querySelector("[data-testid='feature-guide-panel']")).toBeTruthy();
    expect(div.textContent).toMatch(/How it works/);
    expect(div.textContent).toMatch(/Channel Surfing/);
    const replay = [...div.querySelectorAll("button")].find(
      (b) => b.textContent === "Replay the tour"
    );
    expect(replay).toBeTruthy();
    await act(async () => {
      replay.click();
    });
    expect(onReplayTour).toHaveBeenCalledTimes(1);
  });

  test("Guide settings tab opens the same content", async () => {
    const onReplayTour = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ClubScreen, {
          user,
          tracks: [],
          onLogout: jest.fn(),
          profile,
          initialTab: "guide",
          onReplayTour,
        })
      );
    });
    expect(div.querySelector("[data-testid='feature-guide-panel']")).toBeTruthy();
    expect(div.textContent).toMatch(/Energy \+ dislike/);
    const tab = [...div.querySelectorAll('[role="tab"]')].find((b) => b.textContent === "Guide");
    expect(tab.getAttribute("aria-selected")).toBe("true");
  });

  test("Club tab shows beta free trial and coming-soon payments", async () => {
    await act(async () => {
      root.render(
        React.createElement(ClubScreen, {
          user,
          tracks: [],
          onLogout: jest.fn(),
          profile,
          access: { tier: "free", reason: "free", streaming: "full" },
        })
      );
    });
    expect(div.textContent).toMatch(/Beta launch/i);
    expect(div.textContent).toMatch(/Free trial period/i);
    expect(div.textContent).toMatch(/coming soon/i);
    expect(div.textContent).not.toMatch(/\$0\.99/);
    expect(div.textContent).not.toMatch(/\$10\/yr/);
    expect(div.querySelector("[data-testid='beta-launch-notice']")).toBeTruthy();
  });
});
