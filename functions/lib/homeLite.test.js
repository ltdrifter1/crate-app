const test = require("node:test");
const assert = require("node:assert/strict");
const { toLiteTrack, HOME_LITE_LIMIT, publishHomeLite } = require("./homeLite");

test("toLiteTrack keeps play fields", () => {
  const lite = toLiteTrack("abc", { title: "Hi", audioUrl: "https://x/a.mp3", blob: "nope" });
  assert.equal(lite.id, "abc");
  assert.equal(lite.title, "Hi");
  assert.equal(lite.audioUrl, "https://x/a.mp3");
  assert.equal(lite.blob, undefined);
});

test("publishHomeLite writes newest tracks to catalog/homeLite", async () => {
  const docs = [
    { id: "a", data: () => ({ title: "A", createdAt: { seconds: 1 }, audioUrl: "https://x/a.mp3" }) },
    { id: "b", data: () => ({ title: "B", createdAt: { seconds: 9 }, audioUrl: "https://x/b.mp3" }) },
  ];
  const written = [];
  const db = {
    collection: () => ({
      orderBy: () => ({
        limit: (n) => {
          assert.equal(n, HOME_LITE_LIMIT);
          return { get: async () => ({ docs }) };
        },
      }),
    }),
    doc: (path) => {
      assert.equal(path, "catalog/homeLite");
      return {
        set: async (payload) => { written.push(payload); },
      };
    },
  };
  const payload = await publishHomeLite(db, { FieldValue: { serverTimestamp: () => "TS" } });
  assert.equal(payload.trackCount, 2);
  assert.equal(payload.tracks[0].id, "a");
  assert.equal(written[0].updatedAt, "TS");
});
