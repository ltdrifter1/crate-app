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
import { color, homeSpace } from "../theme";

const SAMPLE_COVER = "/brand/planet-mp3-lockup-on-black.png";

const SAMPLE_TRACK = {
  id: "preview-1",
  title: "Night Drive",
  artist: "Signal",
  albumCover: SAMPLE_COVER,
  color: "#65E6FF",
  liked: true,
  duration: 214,
};

const SAMPLE_NEXT = {
  id: "preview-2",
  title: "After Hours",
  artist: "Low Light",
  albumCover: SAMPLE_COVER,
  liked: true,
  duration: 198,
};

const SAMPLE_TRACKS = [
  SAMPLE_TRACK,
  SAMPLE_NEXT,
  {
    id: "preview-3",
    title: "Millennium",
    artist: "Sol Park",
    albumCover: SAMPLE_COVER,
    liked: true,
    duration: 187,
  },
];

const SAMPLE_PLAYLISTS = [
  { id: "pl_1", name: "Night Drive", trackIds: ["preview-1", "preview-2"] },
  { id: "pl_2", name: "Late Signal", trackIds: ["preview-3", "preview-1"] },
];

export default function BroadcastPreview() {
  const [screen, setScreen] = useState("home");
  const [drawer, setDrawer] = useState(false);
  const [buildingSet, setBuildingSet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );

  useEffect(() => {
    const sync = () => setIsDesktop(window.innerWidth >= 768);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const home = (
    <div style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
      <HomeHeader
        onOpenSearch={() => {}}
        onOpenProfile={() => setScreen("profile")}
        onOpenMenu={isDesktop ? null : () => setDrawer(true)}
      />
      <ChannelSurfingSection
        channels={SCENE_CHANNELS}
        activeChannelId="y2k-dance"
        onTuneChannel={() => {}}
      />
      <div style={{ padding: `0 ${homeSpace.gutter}px`, marginTop: homeSpace.sectionGap }}>
        <HeroPlayerCard
          track={SAMPLE_TRACK}
          upNextTrack={SAMPLE_NEXT}
          isRadioMode
          sceneChannel={SCENE_CHANNELS.find((c) => c.id === "y2k-dance")}
          liveShow={{ shortTitle: "Y2K Dance", title: "Y2K Dance" }}
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
          <div style={{ padding: "48px 24px", color: color.ink, fontSize: 28, fontWeight: 700 }}>
            Charts
          </div>
        ) : (
          home
        )}
      </div>
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
      <style>{`
        @media (max-width: 767px) {
          .pmp-preview-rail { display: none !important; }
        }
      `}</style>
    </div>
  );
}
