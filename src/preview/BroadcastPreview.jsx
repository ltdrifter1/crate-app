/**
 * Dev-only IA preview — hash #broadcast-preview.
 * Exercises left source list (Charts + Build a set), Library, and Home player-first.
 */
import { useEffect, useState } from "react";
import HomeHeader from "../components/home/HomeHeader";
import HeroPlayerCard from "../components/home/HeroPlayerCard";
import CrateSpread from "../components/home/CrateSpread";
import AppSidebar from "../components/layout/AppSidebar";
import MobileNavDrawer from "../components/layout/MobileNavDrawer";
import FavoritesScreen from "../screens/FavoritesScreen";
import { SCENE_CHANNELS } from "../lib/sceneChannels";
import { brandStoragePrefix } from "../brand/identity";
import ChartsScreen from "../components/station/ChartsScreen";
import SetBuilderScreen from "../components/set/SetBuilderScreen";
import SearchScreen from "../screens/SearchScreen";
import { makeSetPreviewCatalog } from "./SetPreview";
import { color, homeSpace } from "../theme";
import { previewSleeve } from "./sleeves";
import GlassDock from "../components/player/GlassDock";
import ImmersivePlayer from "../components/player/ImmersivePlayer";
import { playerPlaybackStore } from "../lib/playerPlaybackStore";
import { playerTransportStore } from "../lib/playerTransportStore";
import { contentPadBottom } from "../components/layout/AppChrome";

const SAMPLE_COVER = previewSleeve("night-drive", "Night Drive");

const SAMPLE_TRACK = {
  id: "preview-1",
  title: "Night Drive",
  artist: "Signal",
  albumCover: SAMPLE_COVER,
  color: "#5B6574",
  liked: true,
  duration: 214,
  audioUrl: "u",
  album: "Afterglow",
  bpm: 118,
  camelot: "8A",
  genre: "Electronic",
  playCount: 48,
  requestCount: 22,
};

const SAMPLE_NEXT = {
  id: "preview-2",
  title: "After Hours",
  artist: "Low Light",
  albumCover: previewSleeve("after-hours", "After Hours"),
  liked: true,
  duration: 198,
  audioUrl: "u",
  genre: "Electronic",
  bpm: 122,
  camelot: "9A",
  playCount: 31,
  requestCount: 11,
};

const SAMPLE_TRACKS = [
  SAMPLE_TRACK,
  SAMPLE_NEXT,
  {
    id: "preview-3",
    title: "Millennium",
    artist: "Sol Park",
    albumCover: previewSleeve("millennium", "Millennium"),
    liked: true,
    duration: 187,
    audioUrl: "u",
    genre: "Pop",
    playCount: 27,
    requestCount: 9,
  },
  {
    id: "preview-4",
    title: "Cascade",
    artist: "Rain City",
    albumCover: previewSleeve("cascade", "Highways"),
    duration: 203,
    audioUrl: "u",
    genre: "Rock",
    region: "pnw",
    playCount: 19,
    requestCount: 7,
  },
  {
    id: "preview-5",
    title: "Warehouse",
    artist: "Gridlock",
    albumCover: previewSleeve("warehouse", "Night Shift"),
    duration: 241,
    audioUrl: "u",
    genre: "Electronic",
    playCount: 16,
    requestCount: 5,
  },
  {
    id: "preview-6",
    title: "Amen Break",
    artist: "Two-Step",
    albumCover: previewSleeve("amen", "Weight"),
    duration: 176,
    audioUrl: "u",
    genre: "Electronic",
    playCount: 14,
    requestCount: 4,
  },
  {
    id: "preview-7",
    title: "Haze",
    artist: "Chapterhouse",
    albumCover: previewSleeve("haze", "Walls"),
    duration: 255,
    audioUrl: "u",
    genre: "Rock",
    playCount: 12,
    requestCount: 3,
  },
  {
    id: "preview-8",
    title: "Iron Lung",
    artist: "Foundry",
    albumCover: previewSleeve("iron-lung", "Gain"),
    duration: 221,
    audioUrl: "u",
    genre: "Metal",
    playCount: 11,
    requestCount: 3,
  },
];

const SAMPLE_COUNTDOWN = SAMPLE_TRACKS.map((track, i) => ({
  rank: i + 1,
  track,
  score: 80 - i * 6,
}));

const SAMPLE_PLAYLISTS = [
  { id: "pl_1", name: "Night Drive", trackIds: ["preview-1", "preview-2"] },
  { id: "pl_2", name: "Late Signal", trackIds: ["preview-3", "preview-1"] },
];

export default function BroadcastPreview() {
  const [screen, setScreen] = useState("home");
  const [drawer, setDrawer] = useState(false);
  const [buildingSet, setBuildingSet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [immersive, setImmersive] = useState(false);
  const [activeChannelId] = useState("local-pnw");
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );

  useEffect(() => {
    playerPlaybackStore.setDuration(214);
    playerPlaybackStore.setProgress(48);
    playerTransportStore.sync({ isPlaying: true, track: SAMPLE_TRACK });
  }, []);

  useEffect(() => {
    const y = new Date();
    y.setUTCDate(y.getUTCDate() - 1);
    const yKey = y.toISOString().slice(0, 10);
    const prefix = `${brandStoragePrefix()}:chart:`;
    try {
      localStorage.setItem(
        `${prefix}day:${yKey}`,
        JSON.stringify({
          dayKey: yKey,
          entries: [
            { rank: 1, id: "preview-3", title: "Millennium", artist: "Sol Park" },
            { rank: 2, id: "preview-1", title: "Night Drive", artist: "Signal" },
            { rank: 3, id: "preview-2", title: "After Hours", artist: "Low Light" },
            { rank: 4, id: "preview-5", title: "Warehouse", artist: "Gridlock" },
            { rank: 5, id: "preview-4", title: "Cascade", artist: "Rain City" },
            { rank: 6, id: "preview-8", title: "Iron Lung", artist: "Foundry" },
          ],
        })
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const sync = () => setIsDesktop(window.innerWidth >= 768);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const home = (
    <div className="pmp-home-mtv" style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
      <HomeHeader
        onOpenSearch={() => setScreen("search")}
        onOpenMenu={isDesktop ? null : () => setDrawer(true)}
      />
      <div style={{ padding: `0 ${homeSpace.gutter}px`, marginTop: homeSpace.sectionGapFirst }}>
        <HeroPlayerCard
          track={SAMPLE_TRACK}
          upNextTrack={SAMPLE_NEXT}
          isRadioMode
          sceneChannel={SCENE_CHANNELS.find((c) => c.id === activeChannelId)}
          liveShow={{ shortTitle: "Local", title: "Local" }}
          tickerText="Planet Radio — requests open · Local on the dial"
        />
      </div>
      <CrateSpread
        title="Played before"
        subtitle="Cuts you’ve spun — worth another drop"
        tracks={SAMPLE_TRACKS.slice(0, 6)}
        activeId={SAMPLE_TRACK.id}
        onPlayTrack={() => {}}
      />
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: color.canvas }}>
      <div className="pmp-preview-rail" style={{ display: "flex" }}>
        <AppSidebar
          screen={screen}
          buildingSet={buildingSet}
          onNavigate={setScreen}
          onBuildSet={() => setBuildingSet(true)}
          user={{ name: "Luke" }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "auto", paddingBottom: contentPadBottom(true) }}>
        {screen === "favorites" ? (
          <FavoritesScreen
            tracks={SAMPLE_TRACKS}
            userPlaylists={SAMPLE_PLAYLISTS}
            onPlay={() => {}}
            onPlayTrack={() => {}}
            onCustomMix={() => setBuildingSet(true)}
            onOpenCharts={() => setScreen("charts")}
            onOpenMenu={isDesktop ? null : () => setDrawer(true)}
          />
        ) : screen === "charts" ? (
          <ChartsScreen
            countdown={SAMPLE_COUNTDOWN}
            tracks={SAMPLE_TRACKS}
            onPlayTrack={() => {}}
            onTuneMonthly={() => {}}
            onAddToQueue={() => {}}
            nowPlayingId="preview-1"
            onOpenMenu={isDesktop ? null : () => setDrawer(true)}
          />
        ) : screen === "search" ? (
          <SearchScreen
            query={searchQuery}
            setQuery={setSearchQuery}
            tracks={SAMPLE_TRACKS}
            onPlay={() => {}}
            onBack={() => setScreen("home")}
            backLabel="Home"
          />
        ) : (
          home
        )}
      </div>
      {immersive && (
        <ImmersivePlayer
          currentTrack={SAMPLE_TRACK}
          upNextTrack={SAMPLE_NEXT}
          onTogglePlay={() => {
            playerTransportStore.setPlaying(!playerTransportStore.getState().isPlaying);
          }}
          onSkip={() => setImmersive(false)}
          onPrev={() => {}}
          onClose={() => setImmersive(false)}
          onSeek={(n) => playerPlaybackStore.setProgress(n)}
          onLike={() => {}}
          onDislike={() => {}}
          isRadioMode
        />
      )}
      {isDesktop || immersive ? null : (
        <GlassDock
          screen={screen}
          setScreen={setScreen}
          track={SAMPLE_TRACK}
          onTogglePlay={() => {
            playerTransportStore.setPlaying(!playerTransportStore.getState().isPlaying);
          }}
          onSkip={() => {}}
          onPrev={() => {}}
          onLike={() => {}}
          onSeek={(n) => playerPlaybackStore.setProgress(n)}
          isRadioMode
          onOpen={() => setImmersive(true)}
          hidePlayer={screen === "home"}
        />
      )}
      <MobileNavDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        screen={screen}
        buildingSet={buildingSet}
        onNavigate={setScreen}
        onBuildSet={() => setBuildingSet(true)}
        user={{ name: "Luke" }}
      />
      {buildingSet && (
        <SetBuilderScreen
          tracks={makeSetPreviewCatalog()}
          initialActivity="night"
          intentLabel="Broadcast preview"
          onClose={() => setBuildingSet(false)}
          onPlayRoute={() => setBuildingSet(false)}
          onSavePlaylist={() => {}}
        />
      )}
      <style>{`
        @media (max-width: 767px) {
          .pmp-preview-rail { display: none !important; }
        }
      `}</style>
    </div>
  );
}
