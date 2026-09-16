import {
  artForChannelId,
  buildExploreHero,
  exploreChartsTeaser,
  exploreForYou,
  exploreGenrePlates,
  exploreMoodPlates,
  exploreScenePlates,
  recentlyPlayedTracks,
  resolveExploreFocus,
  tracksForMood,
  GENRE_CHANNEL_ART,
} from "./explore";
import { CHANNEL_ART } from "./channelArt";

const tracks = [
  { id: "1", title: "Soft", artist: "A", album: "Alpha", albumCover: "a.jpg", energy: 2, genre: "Jazz", duration: 180, playCount: 1 },
  { id: "2", title: "Peak", artist: "B", album: "Beta", albumCover: "b.jpg", energy: 9, genre: "Techno", duration: 200, playCount: 8, likeCount: 2 },
  { id: "3", title: "House Cut", artist: "C", album: "Beta", albumCover: "b.jpg", energy: 7, genre: "House", duration: 210, playCount: 4 },
  { id: "4", title: "Folk", artist: "D", album: "Porch", albumCover: "d.jpg", energy: 4, genre: "Country & Folk", duration: 190, playCount: 2 },
  { id: "5", title: "Metal", artist: "E", album: "Riff", albumCover: "e.jpg", energy: 9, genre: "Metal", duration: 200, playCount: 3 },
  { id: "6", title: "Drive", artist: "F", album: "Road", albumCover: "f.jpg", energy: 5, genre: "Pop", duration: 180, playCount: 1 },
  { id: "7", title: "Rap", artist: "G", album: "Block", albumCover: "g.jpg", energy: 6, genre: "Hip-Hop", duration: 200, playCount: 2 },
  { id: "8", title: "Soul", artist: "H", album: "Quiet", albumCover: "h.jpg", energy: 3, genre: "R&B & Soul", duration: 220, playCount: 1 },
];

describe("explore collections", () => {
  test("genre plates only include lanes with catalog and honest art or sleeves", () => {
    const plates = exploreGenrePlates(tracks);
    expect(plates.length).toBeGreaterThan(0);
    expect(plates.every((p) => p.trackCount > 0)).toBe(true);
    const electronic = plates.find((p) => p.lane === "Electronic");
    expect(electronic).toBeTruthy();
    expect(electronic.usePhoto).toBe(true);
    expect(electronic.photo).toBe(CHANNEL_ART["electronic-underground"]);
    const jazz = plates.find((p) => p.lane === "Jazz");
    expect(jazz.usePhoto).toBe(false);
    expect(jazz.covers.length).toBeGreaterThan(0);
  });

  test("GENRE_CHANNEL_ART only maps honest documentary matches", () => {
    expect(GENRE_CHANNEL_ART.Jazz).toBeUndefined();
    expect(GENRE_CHANNEL_ART.Classical).toBeUndefined();
    expect(GENRE_CHANNEL_ART.Electronic).toBe("electronic-underground");
  });

  test("mood plates filter by energy and carry licensed photos", () => {
    const moods = exploreMoodPlates(tracks, 1);
    const ids = moods.map((m) => m.id);
    expect(ids).toEqual(expect.arrayContaining(["after-hours", "peak-time", "drive"]));
    const after = moods.find((m) => m.id === "after-hours");
    expect(after.photo).toBe(CHANNEL_ART.downtempo);
    expect(after.pool.every((t) => (t.energy ?? 5) <= 4)).toBe(true);
    expect(tracksForMood(tracks, "peak-time").every((t) => (t.energy ?? 5) >= 7)).toBe(true);
  });

  test("scene plates rank by depth", () => {
    const scenes = exploreScenePlates(tracks, 8);
    expect(scenes.length).toBeGreaterThan(0);
    expect(scenes.every((s) => s.count > 0 && s.label)).toBe(true);
    for (let i = 1; i < scenes.length; i += 1) {
      expect(scenes[i - 1].count).toBeGreaterThanOrEqual(scenes[i].count);
    }
  });

  test("hero prefers a live showcase channel photo over idle art", () => {
    const channels = [
      {
        id: "local-pnw",
        title: "Local",
        tagline: "Pacific Northwest only",
        showcase: true,
        ready: true,
        art: CHANNEL_ART["local-pnw"],
        artFocus: "50% 68%",
        count: 12,
      },
    ];
    const hero = buildExploreHero({ tracks, channels, releases: [], countdown: [] });
    expect(hero.kind).toBe("channel");
    expect(hero.title).toBe("Local");
    expect(hero.art).toBe(CHANNEL_ART["local-pnw"]);
    expect(hero.eyebrow).toMatch(/Showcase/);
  });

  test("hero falls back to idle club still when the catalog is empty", () => {
    const hero = buildExploreHero({ tracks: [], channels: [], releases: [], countdown: [] });
    expect(hero.kind).toBe("idle");
    expect(hero.title).toMatch(/Start anywhere/);
    expect(hero.art).toBeTruthy();
  });

  test("hero uses a featured sleeve when no station is ready", () => {
    const releases = [
      {
        slug: "beta",
        title: "Beta",
        artist: "C",
        count: 2,
        coverTrack: { albumCover: "b.jpg" },
        tracks: [tracks[1], tracks[2]],
      },
    ];
    const hero = buildExploreHero({
      tracks,
      channels: [{ id: "metal", title: "Metal", ready: false }],
      releases,
      countdown: [],
    });
    expect(hero.kind).toBe("release");
    expect(hero.title).toBe("Beta");
    expect(hero.art).toBe("b.jpg");
    expect(hero.eyebrow).toBe("");
    expect(hero.kicker).toMatch(/2 tracks/);
  });

  test("recently played de-dupes and respects limit", () => {
    const recents = recentlyPlayedTracks(tracks, ["2", "2", "1", "missing", "4"], 2);
    expect(recents.map((t) => t.id)).toEqual(["2", "1"]);
  });

  test("for you returns picks with reasons and a cold-start flag", () => {
    const fresh = [
      { id: "a", title: "A", genre: "Rock", duration: 180 },
      { id: "b", title: "B", genre: "Pop", duration: 180 },
      { id: "c", title: "C", genre: "Jazz", duration: 180 },
    ];
    const cold = exploreForYou(fresh, { limit: 4 });
    expect(cold.tracks.length).toBeGreaterThan(0);
    expect(cold.coldStart).toBe(true);
    const warm = exploreForYou(tracks, { preferredGenres: ["Jazz"], limit: 4 });
    expect(warm.coldStart).toBe(false);
  });

  test("charts teaser slices the countdown", () => {
    const countdown = [
      { rank: 1, track: tracks[1] },
      { rank: 2, track: tracks[2] },
      { rank: 3, track: tracks[4] },
    ];
    expect(exploreChartsTeaser(countdown, 2)).toHaveLength(2);
  });

  test("resolveExploreFocus opens genre, scene, and mood crates", () => {
    const genre = resolveExploreFocus({ type: "genre", id: "Electronic" }, tracks);
    expect(genre.label).toBe("Electronic");
    expect(genre.pool.length).toBeGreaterThan(0);
    const mood = resolveExploreFocus({ type: "mood", id: "peak-time" }, tracks);
    expect(mood.label).toBe("Peak time");
    expect(mood.pool.every((t) => (t.energy ?? 5) >= 7)).toBe(true);
    expect(resolveExploreFocus({ type: "nope", id: "x" }, tracks)).toBeNull();
  });

  test("artForChannelId returns licensed stills", () => {
    expect(artForChannelId("y2k-dance").src).toBe(CHANNEL_ART["y2k-dance"]);
    expect(artForChannelId("missing").src).toBeNull();
  });
});
