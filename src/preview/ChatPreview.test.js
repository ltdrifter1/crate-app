/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

jest.mock("../firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(() => () => {}),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  Timestamp: { fromMillis: (ms) => ({ toMillis: () => ms }) },
  where: jest.fn(),
}));

jest.mock("../usePlayerPlayback", () => ({
  usePlayerPlayback: () => ({ progress: 12, duration: 180 }),
}));

jest.mock("../usePlayerTransport", () => ({
  useIsPlaying: () => true,
  useIsBuffering: () => false,
  useCurrentTrack: () => ({
    id: "preview-1",
    title: "Night Drive",
    artist: "Signal",
  }),
}));

jest.mock("../components/brand/BrandMark", () => ({
  BrandLockup: function BrandLockupStub() {
    return null;
  },
}));

import ChatPreview from "./ChatPreview";

describe("Chat preview", () => {
  test("keeps Channel Surfing on stage with a messenger companion", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(React.createElement(ChatPreview));
    });
    expect(div.textContent).toMatch(/Channel Surfing/i);
    expect(div.querySelector("[data-testid='home-messenger']")).toBeTruthy();
    expect(
      div.querySelector("[data-testid='messenger-window']") ||
        div.querySelector("[data-testid='messenger-nub']") ||
        div.querySelector("[data-testid='messenger-pill']")
    ).toBeTruthy();
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });
});
