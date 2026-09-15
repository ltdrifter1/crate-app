const test = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeChatText, moderateNewMessage, MIN_INTERVAL_MS } = require("./stationChat");

test("sanitizeChatText strips tags and caps length", () => {
  assert.equal(sanitizeChatText("  hello   world  "), "hello world");
  assert.equal(sanitizeChatText("<script>x</script>hi"), "x hi");
  assert.equal(sanitizeChatText("a".repeat(250)).length, 200);
  assert.equal(sanitizeChatText(""), "");
});

test("moderateNewMessage deletes flood and empty", async () => {
  const deleted = [];
  const updated = [];
  const db = {
    doc: (path) => ({
      path,
      delete: async () => { deleted.push(path); },
      get: async () => ({
        exists: path.includes("presence/u1"),
        data: () => ({ lastChatAt: Date.now() - 200 }),
      }),
      set: async () => {},
      update: async (payload) => { updated.push(payload); },
    }),
  };

  const flood = await moderateNewMessage(db, {
    roomId: "home",
    messageId: "m1",
    data: { uid: "u1", text: "hey" },
    now: Date.now(),
  });
  assert.equal(flood.reason, "flood");
  assert.ok(deleted.some((p) => p.includes("messages/m1")));

  const empty = await moderateNewMessage(db, {
    roomId: "home",
    messageId: "m2",
    data: { uid: "u1", text: "   " },
    now: Date.now(),
  });
  assert.equal(empty.reason, "invalid");
});

test("moderateNewMessage accepts spaced messages", async () => {
  let merged = null;
  const db = {
    doc: (path) => ({
      path,
      delete: async () => { throw new Error("should not delete"); },
      get: async () => ({
        exists: true,
        data: () => ({ lastChatAt: Date.now() - MIN_INTERVAL_MS - 10 }),
      }),
      set: async (payload) => { merged = payload; },
      update: async () => {},
    }),
  };
  const res = await moderateNewMessage(db, {
    roomId: "home",
    messageId: "m3",
    data: { uid: "u2", text: "on the station" },
    now: Date.now(),
  });
  assert.equal(res.action, "ok");
  assert.equal(merged.uid, "u2");
});
