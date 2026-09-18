/**
 * Dev-only Explore preview — hash #explore-preview.
 * Filled destination without auth / Firestore.
 */
import { useState } from "react";
import ExploreScreen from "../screens/ExploreScreen";
import { AlbumPage } from "../components/catalog/ArtistPage";
import { findAlbum } from "../lib/catalog";
import { PREVIEW_SLEEVES } from "./previewSleeves";
import { color } from "../theme";

const COVER = {
  electronic: PREVIEW_SLEEVES.nightShift,
  y2k: PREVIEW_SLEEVES.afterglow,
  variety: PREVIEW_SLEEVES.y2k,
  pnw: PREVIEW_SLEEVES.highways,
  dnb: PREVIEW_SLEEVES.weight,
  shoe: PREVIEW_SLEEVES.walls,
  metal: PREVIEW_SLEEVES.gain,
  punk: PREVIEW_SLEEVES.unpolished,
  folk: PREVIEW_SLEEVES.openRoad,
  down: PREVIEW_SLEEVES.late,
  hiphop: PREVIEW_SLEEVES.voice,
  gloss: PREVIEW_SLEEVES.gloss,
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

const SAMPLE_TRACKS = [
  t({ id: "e1", title: "Warehouse", artist: "Gridlock", album: "Night Shift", albumCover: COVER.electronic, genre: "Techno", energy: 9, playCount: 40, camelot: "8A", bpm: 132 }),
  t({ id: "e2", title: "Concrete", artist: "Gridlock", album: "Night Shift", albumCover: COVER.electronic, genre: "Techno", energy: 8, playCount: 22 }),
  t({ id: "h1", title: "Deep Floor", artist: "Sol Park", album: "Afterglow", albumCover: COVER.y2k, genre: "House", energy: 6, playCount: 18, camelot: "9A", bpm: 124 }),
  t({ id: "h2", title: "Mirrorball", artist: "Sol Park", album: "Afterglow", albumCover: COVER.y2k, genre: "Disco", energy: 7, playCount: 15 }),
  t({ id: "p1", title: "Millennium", artist: "Signal", album: "Y2K", albumCover: COVER.variety, genre: "Pop", energy: 6, playCount: 28, camelot: "5B", bpm: 118 }),
  t({ id: "p2", title: "Chrome", artist: "Signal", album: "Y2K", albumCover: COVER.variety, genre: "Pop", energy: 5, playCount: 12 }),
  t({ id: "r1", title: "Cascade", artist: "Rain City", album: "Highways", albumCover: COVER.pnw, genre: "Rock", region: "pnw", energy: 5, playCount: 19 }),
  t({ id: "r2", title: "Ferry", artist: "Rain City", album: "Highways", albumCover: COVER.pnw, genre: "Rock", region: "seattle", energy: 4, playCount: 9 }),
  t({ id: "m1", title: "Iron Lung", artist: "Foundry", album: "Gain", albumCover: COVER.metal, genre: "Metal", energy: 9, playCount: 16 }),
  t({ id: "m2", title: "Slag", artist: "Foundry", album: "Gain", albumCover: COVER.metal, genre: "Metal", energy: 10, playCount: 11 }),
  t({ id: "k1", title: "Porch Light", artist: "Willow", album: "Open Road", albumCover: COVER.folk, genre: "Country & Folk", energy: 3, playCount: 10 }),
  t({ id: "k2", title: "Two Lane", artist: "Willow", album: "Open Road", albumCover: COVER.folk, genre: "Folk", energy: 2, playCount: 6 }),
  t({ id: "d1", title: "After Hours", artist: "Low Light", album: "Late", albumCover: COVER.down, genre: "Downtempo", energy: 2, playCount: 21 }),
  t({ id: "d2", title: "Vinyl Dust", artist: "Low Light", album: "Late", albumCover: COVER.down, genre: "Trip-Hop", energy: 3, playCount: 14 }),
  t({ id: "b1", title: "Amen Break", artist: "Two-Step", album: "Weight", albumCover: COVER.dnb, genre: "Drum & Bass", energy: 8, playCount: 17 }),
  t({ id: "b2", title: "Liquid", artist: "Two-Step", album: "Weight", albumCover: COVER.dnb, genre: "Jungle", energy: 7, playCount: 8 }),
  t({ id: "s1", title: "Haze", artist: "Chapterhouse", album: "Walls", albumCover: COVER.shoe, genre: "Shoegaze", energy: 4, playCount: 13 }),
  t({ id: "s2", title: "Bloom", artist: "Chapterhouse", album: "Walls", albumCover: COVER.shoe, genre: "Dream Pop", energy: 3, playCount: 7 }),
  t({ id: "u1", title: "Fast Loud", artist: "Ashcan", album: "Unpolished", albumCover: COVER.punk, genre: "Punk", energy: 8, playCount: 12 }),
  t({ id: "u2", title: "Stitches", artist: "Ashcan", album: "Unpolished", albumCover: COVER.punk, genre: "Punk", energy: 9, playCount: 5 }),
  t({ id: "j1", title: "Modal Room", artist: "Lumen", album: "Elsewhere", albumCover: COVER.down, genre: "Jazz", energy: 3, playCount: 9 }),
  t({ id: "j2", title: "Late Trio", artist: "Lumen", album: "Elsewhere", albumCover: COVER.down, genre: "Jazz", energy: 2, playCount: 4 }),
  t({ id: "hh1", title: "Sample Archaeology", artist: "Block", album: "Voice as Drum", albumCover: COVER.hiphop, genre: "Hip-Hop", energy: 6, playCount: 20 }),
  t({ id: "hh2", title: "Boom", artist: "Block", album: "Voice as Drum", albumCover: COVER.hiphop, genre: "Rap", energy: 7, playCount: 11 }),
  t({ id: "rb1", title: "Quiet Storm", artist: "Pearl", album: "Gloss", albumCover: COVER.gloss, genre: "R&B & Soul", energy: 3, playCount: 8 }),
  t({ id: "rb2", title: "Pocket", artist: "Pearl", album: "Gloss", albumCover: COVER.gloss, genre: "Soul", energy: 4, playCount: 6 }),
];

const SAMPLE_COUNTDOWN = SAMPLE_TRACKS.slice(0, 8).map((track, i) => ({
  rank: i + 1,
  track,
  score: 90 - i * 7,
}));

export default function ExplorePreview() {
  const [log, setLog] = useState("idle");
  const [albumSlug, setAlbumSlug] = useState(null);
  const album = albumSlug ? findAlbum(SAMPLE_TRACKS, albumSlug) : null;

  if (albumSlug) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: color.canvas,
          color: color.ink,
        }}
      >
        <AlbumPage
          album={album}
          onBack={() => setAlbumSlug(null)}
          onPlay={(track) => setLog(`play:${track?.id}`)}
          onOpenArtist={() => setLog("artist")}
        />
        <div className="sr-only" data-preview-log={log}>
          {log}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: color.canvas,
        color: color.ink,
      }}
    >
      <ExploreScreen
        tracks={SAMPLE_TRACKS}
        preferredGenres={["Electronic", "Jazz"]}
        recentTrackIds={["e1", "d1", "p1", "r1"]}
        userKey="preview"
        countdown={SAMPLE_COUNTDOWN}
        sceneChannelsActiveId={null}
        onPlayTrack={(track) => setLog(`play:${track?.id}`)}
        onOpenSearch={() => setLog("search")}
        onOpenAlbum={(slug) => {
          setLog(`album:${slug}`);
          setAlbumSlug(slug);
        }}
        onOpenCharts={() => setLog("charts")}
        onTuneSceneChannel={(ch) => setLog(`tune:${ch?.id}`)}
        onListenIntent={(focus) => setLog(`intent:${focus?.genre || focus?.scene}`)}
      />
      <div className="sr-only" data-preview-log={log}>
        {log}
      </div>
    </div>
  );
}
