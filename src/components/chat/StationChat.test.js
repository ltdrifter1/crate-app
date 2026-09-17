/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

jest.mock("../../firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(async () => ({ id: "new" })),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  limit: jest.fn((n) => n),
  onSnapshot: jest.fn(() => () => {}),
  orderBy: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  serverTimestamp: jest.fn(() => ({ seconds: 1 })),
  setDoc: jest.fn(async () => {}),
  Timestamp: { fromMillis: (ms) => ({ toMillis: () => ms }) },
  where: jest.fn(() => ({})),
}));

import HomeMessenger from "./HomeMessenger";
import { MessengerWindow } from "./MessengerWindow";
import { CHAT_DESKTOP_MIN, mobileChatPillBottomPx } from "../../lib/stationChat";
import { dock } from "../../theme";

const SAMPLE_MESSAGES = [
  {
    id: "m1",
    uid: "u2",
    displayName: "Mira",
    text: "This one is for the late bus",
    createdAt: Date.now() - 60_000,
  },
  {
    id: "m2",
    uid: "u1",
    displayName: "Luke",
    text: "On the station",
    createdAt: Date.now() - 10_000,
    clientId: "c2",
  },
];

const SAMPLE_PRESENCE = [
  { uid: "u1", displayName: "Luke", lastSeen: Date.now() },
  { uid: "u2", displayName: "Mira", lastSeen: Date.now() },
];

describe("MessengerWindow send + render", () => {
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

  test("renders names and bodies, sends from composer", async () => {
    const onSend = jest.fn(() => ({ ok: true }));
    await act(async () => {
      root.render(
        React.createElement(MessengerWindow, {
          messages: SAMPLE_MESSAGES,
          presence: SAMPLE_PRESENCE,
          uid: "u1",
          canSend: true,
          onSend,
        })
      );
    });
    const rows = [...div.querySelectorAll("[data-testid='chat-message']")];
    expect(rows).toHaveLength(2);
    expect(div.textContent).toMatch(/This one is for the late bus/);
    expect(div.textContent).toMatch(/On the station/);
    expect(div.textContent).toMatch(/Mira/);
    expect(div.textContent).toMatch(/Live chat/);

    const input = div.querySelector("[data-testid='chat-input']");
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, "hello station");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      div.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(onSend).toHaveBeenCalledWith("hello station");
  });
});

describe("HomeMessenger layout breakpoints", () => {
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

  test("desktop can collapse to a slim nub", async () => {
    await act(async () => {
      root.render(
        React.createElement(HomeMessenger, {
          variant: "desktop",
          viewportWidth: 1280,
          defaultOpen: false,
          live: false,
          uid: "u1",
          presence: SAMPLE_PRESENCE,
        })
      );
    });
    const host = div.querySelector("[data-testid='home-messenger']");
    expect(host.getAttribute("data-layout")).toBe("desktop-rail");
    expect(host.getAttribute("data-open")).toBe("false");
    expect(host.getAttribute("data-mode")).toBe("nub");
    expect(div.querySelector("[data-testid='messenger-nub']")).toBeTruthy();
    expect(div.querySelector("[data-testid='messenger-window']")).toBeNull();
    expect(div.querySelector("[data-testid='messenger-pill']")).toBeNull();
  });

  test("desktop starts collapsed on first visit", async () => {
    localStorage.removeItem("planetmp3.stationChat.rail");
    await act(async () => {
      root.render(
        React.createElement(HomeMessenger, {
          variant: "desktop",
          viewportWidth: 1280,
          live: false,
          uid: "u1",
          presence: SAMPLE_PRESENCE,
        })
      );
    });
    expect(div.querySelector("[data-testid='home-messenger']").getAttribute("data-open")).toBe(
      "false"
    );
    expect(div.querySelector("[data-testid='messenger-nub']")).toBeTruthy();
    expect(div.querySelector("[data-testid='messenger-window']")).toBeNull();
  });

  test("desktop open docks chat in the right column", async () => {
    await act(async () => {
      root.render(
        React.createElement(HomeMessenger, {
          variant: "desktop",
          viewportWidth: 1280,
          defaultOpen: true,
          live: false,
          uid: "u1",
          messages: SAMPLE_MESSAGES,
          presence: SAMPLE_PRESENCE,
        })
      );
    });
    const host = div.querySelector("[data-testid='home-messenger']");
    expect(host.getAttribute("data-mode")).toBe("dock");
    expect(div.querySelector("[data-testid='messenger-window']")).toBeTruthy();
    expect(div.textContent).toMatch(/On the station/);
  });

  test("mobile is a corner pill that opens a bottom sheet", async () => {
    await act(async () => {
      root.render(
        React.createElement(HomeMessenger, {
          variant: "mobile",
          viewportWidth: 390,
          defaultOpen: false,
          live: false,
          uid: "u1",
          hasDockPlayer: true,
          presence: SAMPLE_PRESENCE,
        })
      );
    });
    expect(div.querySelector("[data-testid='home-messenger']").getAttribute("data-layout")).toBe(
      "mobile-sheet"
    );
    const pill = div.querySelector("[data-testid='messenger-pill']");
    expect(pill).toBeTruthy();
    expect(pill.style.position || getComputedStyle(pill).position).toMatch(/fixed|static/);
    expect(mobileChatPillBottomPx(true)).toBeGreaterThan(dock.clearTabs);
    expect(mobileChatPillBottomPx(true)).toBe(dock.clearPlayer + 10);
    expect(div.querySelector("[data-testid='messenger-sheet']")).toBeNull();

    await act(async () => {
      pill.click();
    });
    expect(div.querySelector("[data-testid='messenger-sheet']")).toBeTruthy();
    expect(div.querySelector("[data-testid='messenger-window']")).toBeTruthy();
    expect(div.querySelector("[data-testid='messenger-pill']")).toBeNull();
  });

  test("wide desktop docks the window without overlay", async () => {
    await act(async () => {
      root.render(
        React.createElement(HomeMessenger, {
          variant: "desktop",
          viewportWidth: 1600,
          defaultOpen: true,
          live: false,
          uid: "u1",
          messages: SAMPLE_MESSAGES,
        })
      );
    });
    expect(div.querySelector("[data-testid='home-messenger']").getAttribute("data-mode")).toBe(
      "dock"
    );
  });

  test("phone width uses the mobile layout even if variant is desktop", async () => {
    await act(async () => {
      root.render(
        React.createElement(HomeMessenger, {
          variant: "desktop",
          viewportWidth: CHAT_DESKTOP_MIN - 20,
          defaultOpen: false,
          live: false,
        })
      );
    });
    expect(div.querySelector("[data-testid='home-messenger']").getAttribute("data-layout")).toBe(
      "mobile-sheet"
    );
    expect(div.querySelector("[data-testid='messenger-pill']")).toBeTruthy();
  });

  test("chat is humans only — no seeded bot thread", async () => {
    await act(async () => {
      root.render(
        React.createElement(HomeMessenger, {
          variant: "desktop",
          viewportWidth: 1280,
          defaultOpen: true,
          live: false,
        })
      );
    });
    expect(div.textContent).toMatch(/Live chat/);
    expect(div.textContent).toMatch(/Quiet on the station/);
    expect(div.textContent).not.toMatch(/Rio/);
    expect(div.textContent).not.toMatch(/Sable/);
    expect(div.textContent).not.toMatch(/this is the one i needed tonight/);
    expect(div.querySelector("[data-testid='chat-message']")).toBeNull();
  });

  test("only shows messages from the last 30 minutes", async () => {
    const now = Date.now();
    await act(async () => {
      root.render(
        React.createElement(HomeMessenger, {
          variant: "desktop",
          viewportWidth: 1280,
          defaultOpen: true,
          live: false,
          uid: "u1",
          messages: [
            {
              id: "old",
              uid: "u2",
              displayName: "Mira",
              text: "from last night",
              createdAt: now - 31 * 60_000,
            },
            {
              id: "fresh",
              uid: "u1",
              displayName: "Luke",
              text: "still on this channel",
              createdAt: now - 5 * 60_000,
            },
          ],
        })
      );
    });
    expect(div.textContent).toMatch(/still on this channel/);
    expect(div.textContent).not.toMatch(/from last night/);
    expect(div.querySelectorAll("[data-testid='chat-message']")).toHaveLength(1);
  });
});
