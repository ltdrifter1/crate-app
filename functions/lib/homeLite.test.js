const test = require("node:test");
const assert = require("node:assert/strict");
const {
  toLiteTrack,
  HOME_LITE_LIMIT,
  HOME_LITE_HEAT_LIMIT,
  mergeHomeLiteTracks,
  publishHomeLite,
} = require("./homeLite");

test("toLiteTrack keeps play fields", () => {
  const lite = toLiteTrack("abc", { title: "Hi", audioUrl: "https://x/a.mp3", blob: "nope" });
  assert.equal(lite.id, "abc");
  assert.equal(lite.title, "Hi");
  assert.equal(lite.audioUrl, "https://x/a.mp3");
  assert.equal(lite.blob, undefined);
});

test("mergeHomeLiteTracks puts heat ahead of newest", () => {
  const merged = mergeHomeLiteTracks(
    [{ id: "n1", title: "New" }, { id: "hot", title: "Also new" }],
    [{ id: "hot", title: "Heat", playCount: 40 }]
  );
  assert.equal(merged[0].id, "hot");
  assert.deepEqual(merged.map((t) => t.id), ["hot", "n1"]);
});

test("publishHomeLite writes newest + hottest tracks to catalog/homeLite", async () => {
  const newestDocs = [
    { id: "a", data: () => ({ title: "A", createdAt: { seconds: 1 }, audioUrl: "https://x/a.mp3" }) },
    { id: "b", data: () => ({ title: "B", createdAt: { seconds: 9 }, audioUrl: "https://x/b.mp3" }) },
  ];
  const hotDocs = [
    { id: "h", data: () => ({ title: "H", playCount: 80, audioUrl: "https://x/h.mp3" }) },
  ];
  const written = [];
  const db = {
    collection: () => ({
      orderBy: (field) => ({
        limit: (n) => {
          if (field === "playCount") {
            assert.equal(n, HOME_LITE_HEAT_LIMIT);
            return { get: async () => ({ docs: hotDocs }) };
          }
          assert.equal(n, HOME_LITE_LIMIT);
          return { get: async () => ({ docs: newestDocs }) };
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
  assert.equal(payload.trackCount, 3);
  assert.equal(payload.tracks[0].id, "h");
  assert.equal(written[0].updatedAt, "TS");
});
