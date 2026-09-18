/**
 * Dev-only IA preview — hash #broadcast-preview.
 * Exercises left source list (Charts + Build a set), Library, and Home Channel Surfing.
 */
import { useEffect, useState } from "react";
import BottomNavigation from "../components/home/BottomNavigation";
import HomeHeader from "../components/home/HomeHeader";
import HeroPlayerCard from "../components/home/HeroPlayerCard";
import ChannelSurfingSection from "../components/home/ChannelSurfingSection";
import AppSidebar from "../components/layout/AppSidebar";
import MobileNavDrawer from "../components/layout/MobileNavDrawer";
import FavoritesScreen from "../screens/FavoritesScreen";
import { primaryNavItems } from "../lib/nav";
import { SCENE_CHANNELS } from "../lib/sceneChannels";
import { brandStoragePrefix } from "../brand/identity";
import ChartsScreen from "../components/station/ChartsScreen";
import SetBuilderScreen from "../components/set/SetBuilderScreen";
import { makeSetPreviewCatalog } from "./SetPreview";
import { CHANNEL_ART } from "../lib/channelArt";
import { color, homeSpace } from "../theme";
import HomeMessenger from "../components/chat/HomeMessenger";

const SAMPLE_COVER = "/brand/planet-mp3-lockup-on-black.png";

const SAMPLE_TRACK = {
  id: "preview-1",
  title: "Night Drive",
  artist: "Signal",
  albumCover: CHANNEL_ART["y2k-dance"] || SAMPLE_COVER,
  color: "#1E6FE8",
  liked: true,
  duration: 214,
  audioUrl: "u",
  album: "Afterglow",
  bpm: 118,
  genre: "Electronic",
  playCount: 48,
  requestCount: 22,
};

const SAMPLE_NEXT = {
  id: "preview-2",
  title: "After Hours",
  artist: "Low Light",
  albumCover: CHANNEL_ART.downtempo || SAMPLE_COVER,
  liked: true,
  duration: 198,
  audioUrl: "u",
  genre: "Electronic",
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
    albumCover: CHANNEL_ART["variety-mix"] || SAMPLE_COVER,
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
    albumCover: CHANNEL_ART["local-pnw"] || SAMPLE_COVER,
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
    albumCover: CHANNEL_ART.techno || SAMPLE_COVER,
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
    albumCover: CHANNEL_ART["drum-and-bass"] || SAMPLE_COVER,
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
    albumCover: CHANNEL_ART.shoegaze || SAMPLE_COVER,
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
    albumCover: CHANNEL_ART.metal || SAMPLE_COVER,
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
  const [activeChannelId, setActiveChannelId] = useState("local-pnw");
  const channels = [...SCENE_CHANNELS].sort((a, b) => {
    if (!!a.showcase !== !!b.showcase) return a.showcase ? -1 : 1;
    return (a.num || 0) - (b.num || 0);
  });
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );

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
    <div className="pmp-home-mtv" style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
      <HomeHeader
        onOpenSearch={() => {}}
        onOpenProfile={() => setScreen("profile")}
        onOpenMenu={isDesktop ? null : () => setDrawer(true)}
      />
      <ChannelSurfingSection
        channels={channels}
        activeChannelId={activeChannelId}
        onTuneChannel={(ch) => setActiveChannelId(ch.id)}
      />
      <div style={{ padding: `0 ${homeSpace.gutter}px`, marginTop: homeSpace.sectionGap }}>
        <HeroPlayerCard
          track={SAMPLE_TRACK}
          upNextTrack={SAMPLE_NEXT}
          isRadioMode
          sceneChannel={SCENE_CHANNELS.find((c) => c.id === activeChannelId)}
          liveShow={{ shortTitle: "Local", title: "Local" }}
          tickerText="Planet Radio — requests open · Local on the dial"
        />
      </div>
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
      <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "auto", paddingBottom: 120 }}>
        {screen === "favorites" ? (
          <FavoritesScreen
            tracks={SAMPLE_TRACKS}
            userPlaylists={SAMPLE_PLAYLISTS}
            onPlay={() => {}}
            onPlayTrack={() => {}}
            onCustomMix={() => setBuildingSet(true)}
            onOpenCharts={() => setScreen("charts")}
            onOpenMenu={isDesktop ? null : () => setDrawer(true)}
            showLibraryDestinations={!isDesktop}
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
        ) : (
          home
        )}
      </div>
      {isDesktop && (
        <HomeMessenger
          variant="desktop"
          viewportWidth={1280}
          defaultOpen
          live={false}
          uid="u1"
          displayName="Luke"
          nowPlaying={SAMPLE_TRACK}
        />
      )}
      <div
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          bottom: 16,
          zIndex: 20,
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <BottomNavigation
          items={primaryNavItems()}
          activeId={screen === "favorites" ? "favorites" : "home"}
          onSelect={setScreen}
        />
      </div>
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
