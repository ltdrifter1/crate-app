import {
  sanitizeChatText,
  sanitizeDisplayName,
  canSendAt,
  isPresenceOnline,
  buddyInitials,
  buddyColor,
  mapChatDoc,
  mergeChatMessages,
  formatChatTime,
  chatLayoutForWidth,
  desktopMessengerPlacement,
  mobileChatPillBottomPx,
  buildChatPayload,
  onlineBuddies,
  recentChatMessages,
  readRailOpen,
  writeRailOpen,
  railStorageKey,
  CHAT_HISTORY_MS,
  CHAT_MAX_TEXT,
  CHAT_MIN_INTERVAL_MS,
  CHAT_NUB_WIDTH,
  CHAT_DESKTOP_MIN,
} from "./stationChat";
import { dock } from "../theme";

describe("stationChat sanitize + send", () => {
  test("strips tags, collapses space, caps length", () => {
    expect(sanitizeChatText("  hello   <b>there</b>  ")).toBe("hello there");
    expect(sanitizeChatText("<script>alert(1)</script>hey")).toBe("alert(1) hey");
    expect(sanitizeChatText("a".repeat(CHAT_MAX_TEXT + 40))).toHaveLength(CHAT_MAX_TEXT);
    expect(sanitizeChatText("")).toBe("");
    expect(sanitizeChatText("   ")).toBe("");
  });

  test("display names fall back to Listener", () => {
    expect(sanitizeDisplayName("")).toBe("Listener");
    expect(sanitizeDisplayName("<x>Mira</x>")).toBe("Mira");
    expect(sanitizeDisplayName("a".repeat(40))).toHaveLength(24);
  });

  test("rate-limit blocks bursts", () => {
    const now = 1_000_000;
    expect(canSendAt(null, now).ok).toBe(true);
    expect(canSendAt(now - CHAT_MIN_INTERVAL_MS, now).ok).toBe(true);
    const blocked = canSendAt(now - 400, now);
    expect(blocked.ok).toBe(false);
    expect(blocked.waitMs).toBe(CHAT_MIN_INTERVAL_MS - 400);
  });

  test("buildChatPayload requires auth + text and copies now-playing", () => {
    expect(buildChatPayload({ uid: "", text: "hi" }).error).toBe("auth");
    expect(buildChatPayload({ uid: "u1", text: "   " }).error).toBe("empty");
    const { payload } = buildChatPayload({
      uid: "u1",
      displayName: "Luke",
      text: "  spinning  this  ",
      nowPlaying: { id: "t1", title: "Night Drive" },
      clientId: "c-test",
    });
    expect(payload.text).toBe("spinning this");
    expect(payload.displayName).toBe("Luke");
    expect(payload.trackId).toBe("t1");
    expect(payload.trackTitle).toBe("Night Drive");
    expect(payload.clientId).toBe("c-test");
  });

  test("mapChatDoc + merge optimistic send/render", () => {
    const remote = [
      mapChatDoc("m1", {
        uid: "a",
        displayName: "Mira",
        text: "first",
        createdAt: 100,
        clientId: "c1",
      }),
    ];
    const optimistic = [
      { id: "tmp", uid: "b", displayName: "Luke", text: "hello station", createdAt: 120, clientId: "c2" },
      { id: "tmp2", uid: "a", displayName: "Mira", text: "first", createdAt: 105, clientId: "c1" },
    ];
    const merged = mergeChatMessages(remote, optimistic);
    expect(merged.map((m) => m.text)).toEqual(["first", "hello station"]);
  });

  test("recentChatMessages keeps only the last 30 minutes", () => {
    const now = 10_000_000;
    const rows = recentChatMessages(
      [
        { id: "old", text: "last night", createdAt: now - CHAT_HISTORY_MS - 1 },
        { id: "edge", text: "just inside", createdAt: now - CHAT_HISTORY_MS },
        { id: "fresh", text: "now", createdAt: now - 60_000 },
        { id: "pending", text: "sending", createdAt: 0 },
      ],
      now
    );
    expect(rows.map((m) => m.id)).toEqual(["edge", "fresh", "pending"]);
  });
});

describe("stationChat layout breakpoints", () => {
  test("mobile vs desktop rail", () => {
    expect(chatLayoutForWidth(375)).toBe("mobile-sheet");
    expect(chatLayoutForWidth(CHAT_DESKTOP_MIN - 1)).toBe("mobile-sheet");
    expect(chatLayoutForWidth(CHAT_DESKTOP_MIN)).toBe("desktop-rail");
    expect(chatLayoutForWidth(1280)).toBe("desktop-rail");
  });

  test("open chat docks in the queue column; collapsed is a slim nub", () => {
    const collapsed = desktopMessengerPlacement(1280, false);
    expect(collapsed.mode).toBe("nub");
    expect(collapsed.flexWidth).toBe(CHAT_NUB_WIDTH);
    expect(collapsed.overlay).toBe(false);

    const laptop = desktopMessengerPlacement(1280, true);
    expect(laptop.mode).toBe("dock");
    expect(laptop.flexWidth).toBe(336);
    expect(laptop.overlay).toBe(false);

    const wide = desktopMessengerPlacement(1600, true);
    expect(wide.mode).toBe("dock");
    expect(wide.flexWidth).toBe(336);
    expect(wide.overlay).toBe(false);
  });

  test("mobile pill sits above dock tabs / player", () => {
    expect(mobileChatPillBottomPx(false)).toBe(dock.clearTabs + 10);
    expect(mobileChatPillBottomPx(true)).toBe(dock.clearPlayer + 10);
    expect(mobileChatPillBottomPx(true)).toBeGreaterThan(mobileChatPillBottomPx(false));
  });

  test("chat rail starts collapsed until the listener opens it", () => {
    localStorage.removeItem(railStorageKey());
    expect(readRailOpen()).toBe(false);
    writeRailOpen(true);
    expect(readRailOpen()).toBe(true);
    writeRailOpen(false);
    expect(readRailOpen()).toBe(false);
  });
});

describe("stationChat presence", () => {
  test("online filter + initials + color", () => {
    const now = 5_000_000;
    const people = onlineBuddies(
      [
        { uid: "1", displayName: "Ada Lovelace", lastSeen: now - 1000 },
        { uid: "2", displayName: "Gone", lastSeen: now - 200_000 },
        { uid: "3", displayName: "Jae", lastSeen: now - 8000 },
      ],
      now
    );
    expect(people.map((p) => p.uid)).toEqual(["1", "3"]);
    expect(buddyInitials("Ada Lovelace")).toBe("AL");
    expect(buddyInitials("Jae")).toBe("JA");
    expect(buddyColor("1")).toMatch(/^#/);
    expect(isPresenceOnline(now - 1000, now)).toBe(true);
    expect(isPresenceOnline(now - 200_000, now)).toBe(false);
  });

  test("formatChatTime", () => {
    const now = Date.parse("2026-09-15T18:00:00");
    expect(formatChatTime(now - 10_000, now)).toBe("now");
    expect(formatChatTime(now - 120_000, now)).toMatch(/\d/);
  });
});
