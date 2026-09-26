// eslint-disable-next-line import/no-commonjs
const {
  LONG_SECONDS,
  isUnknownArtist,
  isIntentionalMix,
  isFullAlbumDump,
  isNonMusic,
  isTeaser,
  isBrokenMetadata,
  formatDuration,
  findDuplicateExtraIds,
  classifyTrack,
  auditCatalog,
  candidatesToCsv,
  parseApprovedDeleteIds,
  storageObjectPathFromUrl,
  planJunkApply,
} = require("./catalog-junk-audit.shared.cjs");

describe("catalog junk audit heuristics", () => {
  test("unknown artist matches existing cleanup script", () => {
    expect(isUnknownArtist("")).toBe(true);
    expect(isUnknownArtist("Unknown")).toBe(true);
    expect(isUnknownArtist("Unknown Artist")).toBe(true);
    expect(isUnknownArtist("Lapalux")).toBe(false);
  });

  test("intentional mix vs single-track remix language", () => {
    expect(isIntentionalMix("Boiler Room DJ set", "A")).toBe(true);
    expect(isIntentionalMix("Continuous Mix", "DJ Koze")).toBe(true);
    expect(isIntentionalMix("What's My Name [Clean Radio Mix]", "Snoop Dogg")).toBe(false);
    expect(isIntentionalMix("Girl (Original Mix)", "South City Zoo")).toBe(false);
  });

  test("full album dump needs duration + language", () => {
    expect(isFullAlbumDump("the miseducation of lauryn hill (full album)", 4677)).toBe(true);
    expect(isFullAlbumDump("Warmer Than Gold (Full Album Stream)", 2610)).toBe(true);
    expect(isFullAlbumDump("nothing is real [Full EP]", 992)).toBe(true);
    expect(isFullAlbumDump("Workinonit - Donuts (Full Album)", 192)).toBe(false);
    expect(isFullAlbumDump("Face Your Fear (Full Album Stream)", 237)).toBe(false);
  });

  test("non-music hits guides/docs, not real songs", () => {
    expect(isNonMusic({ title: "Everything You NEED To Know", artist: "MapleStory BEST Familiars Guide 2024" })).toBe(true);
    expect(isNonMusic({ title: "Go Wild", artist: "Sky Hunters, The World of the Dragonfly" })).toBe(true);
    expect(isNonMusic({ title: "Jack Sparrow is Dying... Of THIRST!", artist: "Film Theory" })).toBe(true);
    expect(isNonMusic({ title: "Great Wall: Quickest way down in cave", artist: "Tomb Raider 2" })).toBe(true);
    expect(isNonMusic({ title: "Let's Play Guitar in a Five Guitar Band", artist: "Minus the Bear" })).toBe(false);
    expect(isNonMusic({ title: "Girl Behind The Glass feat. Rare Times (Walkthrough Video)", artist: "Groundislava" })).toBe(false);
    expect(isNonMusic({ title: "Fight Test (from the Fight Test EP)", artist: "The Flaming Lips" })).toBe(false);
    expect(isNonMusic({ title: "Enjoy the Silence", artist: "Depeche Mode" })).toBe(false);
    expect(isNonMusic({ title: "I Am A Scientist", artist: "Guided By Voices" })).toBe(false);
    expect(isNonMusic({ title: "California Nights", artist: "Best Coast" })).toBe(false);
    expect(isNonMusic({ title: "How to Be a Confidante", artist: "The Bug Club" })).toBe(false);
    expect(isNonMusic({ title: "Public Star Party", artist: "Things To Do!" })).toBe(true);
    expect(isNonMusic({ title: "Campfire Stories", artist: "Baloney Bob" })).toBe(true);
  });

  test("teaser is short promo only", () => {
    expect(isTeaser("Juega (Teaser)", 42)).toBe(true);
    expect(isTeaser("Juega (Teaser)", 240)).toBe(false);
    expect(isTeaser("Trailer Park Honey", 220)).toBe(false);
  });

  test("broken metadata is placeholder/swap, not a song titled Unknown", () => {
    expect(isBrokenMetadata({ title: "YouTube", artist: "Smoker Dad // Do Ya Want It (Official Music Video)" })).toBe(true);
    expect(isBrokenMetadata({ title: "Katie Kuffel", artist: "1999 Official Music Video" })).toBe(true);
    expect(isBrokenMetadata({ title: "Unknown", artist: "Eggshells" })).toBe(false);
    expect(isBrokenMetadata({ title: "Don't Mean a Thing", artist: "Lapalux" })).toBe(false);
  });

  test("formatDuration", () => {
    expect(formatDuration(42)).toBe("0:42");
    expect(formatDuration(1266)).toBe("21:06");
    expect(formatDuration(4677)).toBe("1:17:57");
  });
});

describe("classifyTrack + auditCatalog", () => {
  test("very long album file is delete, mix is review", () => {
    const album = classifyTrack({
      id: "a1",
      title: "This Timeless Turning",
      artist: "Sky Cries Mary",
      duration: 4129,
      genre: "Rock",
    });
    expect(album.action).toBe("delete");
    expect(album.reason).toBe("VERY_LONG");
    expect(album.duration).toBeGreaterThanOrEqual(LONG_SECONDS);

    const mix = classifyTrack({
      id: "m1",
      title: "Essential Mix",
      artist: "Four Tet",
      duration: 3600,
      genre: "Electronic",
    });
    expect(mix.action).toBe("review");
    expect(mix.reason).toBe("MAYBE_KEEP_MIX");
  });

  test("André 3000 17 min ambient is not flagged", () => {
    const row = classifyTrack({
      id: "n",
      title: "Dreams Once Buried Beneath The Dungeon Floor Slowly Sprout Into Undying Gardens",
      artist: "André 3000",
      duration: 1035,
      genre: "Hip-Hop",
      album: "New Blue Sun",
    });
    expect(row).toBeNull();
  });

  test("unknown artist is review, not delete", () => {
    const row = classifyTrack({
      id: "u",
      title: "Manticore",
      artist: "Unknown",
      duration: 204,
      genre: "Electronic",
    });
    expect(row.action).toBe("review");
    expect(row.reason).toBe("UNKNOWN_ARTIST");
  });

  test("duplicates flag extras only", () => {
    const tracks = [
      { id: "keep", title: "Sound & Color", artist: "Alabama Shakes", duration: 187, playCount: 2, createdAt: "2026-01-01T00:00:00Z" },
      { id: "drop", title: "Sound & Color", artist: "Alabama Shakes", duration: 184, playCount: 0, createdAt: "2026-06-01T00:00:00Z" },
    ];
    const extras = findDuplicateExtraIds(tracks);
    expect([...extras]).toEqual(["drop"]);
    const result = auditCatalog(tracks);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].id).toBe("drop");
    expect(result.candidates[0].reason).toBe("DUPLICATE");
  });

  test("uploadBatch falls back across field names", () => {
    const row = classifyTrack({
      id: "t",
      title: "Juega (Teaser)",
      artist: "Caribombo & Pahua",
      duration: 42,
      genre: "R&B & Soul",
      uploadBatch: "audioasis",
    });
    expect(row.uploadBatch).toBe("audioasis");
    expect(row.reason).toBe("TEASER");
    expect(row.action).toBe("delete");
  });

  test("audit counts and CSV columns", () => {
    const tracks = [
      { id: "1", title: "Ok", artist: "A", duration: 200, genre: "Rock" },
      { id: "2", title: "the miseducation of lauryn hill (full album)", artist: "lauryn hill", duration: 4677, genre: "Hip-Hop" },
      { id: "3", title: "Boiler Room DJ set", artist: "B", duration: 2400, genre: "Electronic", batch: "house-wave-1" },
    ];
    const result = auditCatalog(tracks);
    expect(result.total).toBe(3);
    expect(result.deletes).toHaveLength(1);
    expect(result.mixes).toHaveLength(1);
    expect(result.longTracks).toHaveLength(2);
    const csv = candidatesToCsv(result.candidates);
    expect(csv.split("\n")[0]).toBe(
      "id,title,artist,duration,duration_label,genre,uploadBatch,action,reason,extra_reasons,detail"
    );
    expect(csv).toContain("house-wave-1");
    expect(csv).toContain("MAYBE_KEEP_MIX");
    expect(csv).toContain("FULL_ALBUM_DUMP");
  });
});

describe("apply planning", () => {
  test("parseApprovedDeleteIds keeps action=delete only", () => {
    const csv = [
      "id,title,artist,duration,duration_label,genre,uploadBatch,action,reason,extra_reasons,detail",
      "a,Full Album Stream,X,1200,20:00,Rock,,delete,VERY_LONG,,long",
      "b,Ok,Y,200,3:20,Rock,,review,UNKNOWN_ARTIST,,fix",
    ].join("\n");
    expect(parseApprovedDeleteIds(csv)).toEqual(["a"]);
  });

  test("storageObjectPathFromUrl accepts our bucket hosts", () => {
    expect(
      storageObjectPathFromUrl(
        "https://storage.googleapis.com/crate-app-58494.firebasestorage.app/audio/foo.mp3"
      )
    ).toEqual({ bucket: "crate-app-58494.firebasestorage.app", path: "audio/foo.mp3" });
    expect(
      storageObjectPathFromUrl(
        "https://firebasestorage.googleapis.com/v0/b/crate-app-58494.firebasestorage.app/o/covers%2Fbar.jpg?alt=media"
      )
    ).toEqual({ bucket: "crate-app-58494.firebasestorage.app", path: "covers/bar.jpg" });
    expect(
      storageObjectPathFromUrl("https://storage.googleapis.com/other-bucket/audio/foo.mp3")
    ).toBeNull();
  });

  test("planJunkApply intersects live deletes with the approved CSV and skips shared covers", () => {
    const dump = {
      id: "dump",
      title: "the miseducation of lauryn hill (full album)",
      artist: "lauryn hill",
      duration: 4677,
      genre: "Hip-Hop",
      audioUrl: "https://storage.googleapis.com/crate-app-58494.firebasestorage.app/audio/dump.mp3",
      albumCover: "https://storage.googleapis.com/crate-app-58494.firebasestorage.app/covers/shared.jpg",
    };
    const keep = {
      id: "keep",
      title: "Doo Wop",
      artist: "Lauryn Hill",
      duration: 240,
      genre: "Hip-Hop",
      audioUrl: "https://storage.googleapis.com/crate-app-58494.firebasestorage.app/audio/keep.mp3",
      albumCover: dump.albumCover,
    };
    const review = {
      id: "unk",
      title: "Manticore",
      artist: "Unknown",
      duration: 204,
      genre: "Electronic",
    };
    const csv = candidatesToCsv(auditCatalog([dump, keep, review]).candidates);
    const plan = planJunkApply([dump, keep, review], parseApprovedDeleteIds(csv));
    expect(plan.targets.map((t) => t.id)).toEqual(["dump"]);
    expect(plan.targets[0].action).toBe("delete");
    const audio = plan.storage.find((s) => s.path === "audio/dump.mp3");
    const cover = plan.storage.find((s) => s.path === "covers/shared.jpg");
    expect(audio.skipped).toBe(false);
    expect(cover.skipped).toBe(true);
  });
});
