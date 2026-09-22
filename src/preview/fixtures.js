/**
 * Shared dev-preview catalog. Lets the auth-gated screens (Library, Charts,
 * Club, Search, Artist, Album) be reviewed without Firestore or a login.
 */
import { previewSleeve } from "./sleeves";

const COVER = {
  electronic: previewSleeve("electronic", "Night Shift"),
  y2k: previewSleeve("y2k", "Afterglow"),
  variety: previewSleeve("variety", "Y2K"),
  pnw: previewSleeve("pnw", "Highways"),
  dnb: previewSleeve("dnb", "Weight"),
  shoe: previewSleeve("shoe", "Walls"),
  metal: previewSleeve("metal", "Gain"),
  punk: previewSleeve("punk", "Unpolished"),
  folk: previewSleeve("folk", "Open Road"),
  down: previewSleeve("down", "Late"),
};

function t(partial) {
  return {
    liked: false,
    duration: 200,
    audioUrl: "u",
    playCount: 8,
    energy: 5,
    ...partial,
  };
}

/** Years are present here on purpose — the History tab needs them to appear. */
export const PREVIEW_TRACKS = [
  t({ id: "e1", title: "Warehouse", artist: "Gridlock", album: "Night Shift", albumCover: COVER.electronic, genre: "Techno", energy: 9, playCount: 40, camelot: "8A", bpm: 132, year: 2001, liked: true }),
  t({ id: "e2", title: "Concrete", artist: "Gridlock", album: "Night Shift", albumCover: COVER.electronic, genre: "Techno", energy: 8, playCount: 22, camelot: "8A", year: 2001 }),
  t({ id: "h1", title: "Deep Floor", artist: "Sol Park", album: "Afterglow", albumCover: COVER.y2k, genre: "House", energy: 6, playCount: 18, camelot: "9A", bpm: 124, year: 1999, liked: true }),
  t({ id: "h2", title: "Mirrorball", artist: "Sol Park", album: "Afterglow", albumCover: COVER.y2k, genre: "Disco", energy: 7, playCount: 15, camelot: "9A", year: 1999 }),
  t({ id: "p1", title: "Millennium", artist: "Signal", album: "Y2K", albumCover: COVER.variety, genre: "Pop", energy: 6, playCount: 28, camelot: "5B", bpm: 118, year: 2000, liked: true }),
  t({ id: "p2", title: "Chrome", artist: "Signal", album: "Y2K", albumCover: COVER.variety, genre: "Pop", energy: 5, playCount: 12, camelot: "5B", year: 2000 }),
  t({ id: "r1", title: "Cascade", artist: "Rain City", album: "Highways", albumCover: COVER.pnw, genre: "Rock", region: "pnw", energy: 5, playCount: 19, camelot: "4A", year: 2004 }),
  t({ id: "r2", title: "Ferry", artist: "Rain City", album: "Highways", albumCover: COVER.pnw, genre: "Rock", region: "seattle", energy: 4, playCount: 9, camelot: "4A", year: 2004, liked: true }),
  t({ id: "m1", title: "Iron Lung", artist: "Foundry", album: "Gain", albumCover: COVER.metal, genre: "Metal", energy: 9, playCount: 16, camelot: "11A", year: 2008 }),
  t({ id: "m2", title: "Slag", artist: "Foundry", album: "Gain", albumCover: COVER.metal, genre: "Metal", energy: 10, playCount: 11, camelot: "11A", year: 2008 }),
  t({ id: "k1", title: "Porch Light", artist: "Willow", album: "Open Road", albumCover: COVER.folk, genre: "Country & Folk", energy: 3, playCount: 10, year: 2012 }),
  t({ id: "k2", title: "Two Lane", artist: "Willow", album: "Open Road", albumCover: COVER.folk, genre: "Folk", energy: 2, playCount: 6, year: 2012 }),
  t({ id: "d1", title: "After Hours", artist: "Low Light", album: "Late", albumCover: COVER.down, genre: "Downtempo", energy: 2, playCount: 21, camelot: "2A", year: 2006, liked: true }),
  t({ id: "d2", title: "Vinyl Dust", artist: "Low Light", album: "Late", albumCover: COVER.down, genre: "Trip-Hop", energy: 3, playCount: 14, camelot: "2A", year: 2006 }),
  t({ id: "b1", title: "Amen Break", artist: "Two-Step", album: "Weight", albumCover: COVER.dnb, genre: "Drum & Bass", energy: 8, playCount: 17, camelot: "7A", year: 1997 }),
  t({ id: "b2", title: "Liquid", artist: "Two-Step", album: "Weight", albumCover: COVER.dnb, genre: "Jungle", energy: 7, playCount: 8, camelot: "7A", year: 1997 }),
  t({ id: "s1", title: "Haze", artist: "Chapterhouse", album: "Walls", albumCover: COVER.shoe, genre: "Shoegaze", energy: 4, playCount: 13, year: 2010, liked: true }),
  t({ id: "s2", title: "Bloom", artist: "Chapterhouse", album: "Walls", albumCover: COVER.shoe, genre: "Dream Pop", energy: 3, playCount: 7, year: 2010 }),
  t({ id: "u1", title: "Fast Loud", artist: "Ashcan", album: "Unpolished", albumCover: COVER.punk, genre: "Punk", energy: 8, playCount: 12, year: 2019 }),
  t({ id: "u2", title: "Stitches", artist: "Ashcan", album: "Unpolished", albumCover: COVER.punk, genre: "Punk", energy: 9, playCount: 5, year: 2019 }),
  t({ id: "j1", title: "Modal Room", artist: "Lumen", album: "Elsewhere", albumCover: COVER.down, genre: "Jazz", energy: 3, playCount: 9, year: 2021 }),
  t({ id: "j2", title: "Late Trio", artist: "Lumen", album: "Elsewhere", albumCover: COVER.down, genre: "Jazz", energy: 2, playCount: 4, year: 2021 }),
  t({ id: "hh1", title: "Sample Archaeology", artist: "Block", album: "Voice as Drum", albumCover: COVER.variety, genre: "Hip-Hop", energy: 6, playCount: 20, year: 2003, liked: true }),
  t({ id: "hh2", title: "Boom", artist: "Block", album: "Voice as Drum", albumCover: COVER.variety, genre: "Rap", energy: 7, playCount: 11, year: 2003 }),
  t({ id: "rb1", title: "Quiet Storm", artist: "Pearl", album: "Gloss", albumCover: COVER.y2k, genre: "R&B & Soul", energy: 3, playCount: 8, year: 1998 }),
  t({ id: "rb2", title: "Pocket", artist: "Pearl", album: "Gloss", albumCover: COVER.y2k, genre: "Soul", energy: 4, playCount: 6, year: 1998 }),
];

export const PREVIEW_COUNTDOWN = PREVIEW_TRACKS.slice(0, 10).map((track, i) => ({
  rank: i + 1,
  track,
  score: 94 - i * 6,
  movement: i % 3 === 0 ? "up" : i % 3 === 1 ? "down" : "hold",
  delta: i % 3 === 0 ? 2 : i % 3 === 1 ? -1 : 0,
}));

export const PREVIEW_PLAYLISTS = [
  { id: "pl1", name: "Friday Night", trackIds: ["e1", "h1", "p1", "b1"], updatedAt: Date.now() - 8.64e7 },
  { id: "pl2", name: "Late Bus Home", trackIds: ["d1", "s1", "j1"], updatedAt: Date.now() - 3 * 8.64e7 },
  { id: "pl3", name: "Loud", trackIds: ["m1", "m2", "u1", "u2", "e1"], updatedAt: Date.now() - 9 * 8.64e7 },
];

export const PREVIEW_USER = {
  uid: "preview-uid",
  name: "Luke",
  displayName: "Luke",
  username: "Luke",
  email: "listener@planetmp3.test",
  memberNumber: 142,
  genres: ["Electronic", "Rock"],
};

export const PREVIEW_PROFILE = {
  ...PREVIEW_USER,
  memberNumber: 142,
  createdAt: new Date("2026-02-11"),
  recentTracks: [{ trackId: "e1" }, { trackId: "d1" }],
};
