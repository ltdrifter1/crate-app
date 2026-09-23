const test = require("node:test");
const assert = require("node:assert/strict");
const { toCdnTrack, publishCatalogJson, CATALOG_OBJECT } = require("./catalogJson");

test("toCdnTrack keeps lite fields and serializes createdAt", () => {
  const row = toCdnTrack("x", {
    title: "Hi",
    audioUrl: "https://x/a.mp3",
    blob: "nope",
    createdAt: { seconds: 12 },
  });
  assert.equal(row.id, "x");
  assert.equal(row.title, "Hi");
  assert.equal(row.blob, undefined);
  assert.deepEqual(row.createdAt, { seconds: 12 });
});

test("publishCatalogJson writes catalog/v1.json", async () => {
  const docs = [
    { id: "a", data: () => ({ title: "A", createdAt: { seconds: 1 }, audioUrl: "https://x/a.mp3" }) },
    { id: "b", data: () => ({ title: "B", createdAt: { seconds: 9 }, audioUrl: "https://x/b.mp3" }) },
  ];
  const saved = [];
  const db = {
    collection: () => ({
      orderBy: () => ({
        get: async () => ({ docs }),
      }),
    }),
  };
  const bucket = {
    file: (path) => {
      assert.equal(path, CATALOG_OBJECT);
      return {
        save: async (body, opts) => {
          saved.push({ body, opts });
        },
      };
    },
  };
  const payload = await publishCatalogJson(db, bucket);
  assert.equal(payload.trackCount, 2);
  assert.equal(payload.tracks[0].id, "b");
  assert.equal(saved.length, 1);
  assert.match(saved[0].opts.metadata.cacheControl, /s-maxage/);
  const parsed = JSON.parse(saved[0].body);
  assert.equal(parsed.tracks.length, 2);
});
