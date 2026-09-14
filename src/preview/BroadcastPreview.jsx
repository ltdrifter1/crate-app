/**
 * Dev-only IA preview — hash #broadcast-preview.
 * Exercises left source list (Charts + Build a set), Library, and Home Channel Surfing.
 */
import { useEffect, useState } from "react";
import BottomNavigation from "../components/home/BottomNavigation";
import HomeHeader from "../components/home/HomeHeader";
import HeroPlayerCard from "../components/home/HeroPlayerCard";
import ChannelSurfingSection from "../components/home/ChannelSurfingSection";
import ShowcasePromo from "../components/home/ShowcasePromo";
import AppSidebar from "../components/layout/AppSidebar";
import MobileNavDrawer from "../components/layout/MobileNavDrawer";
import FavoritesScreen from "../screens/FavoritesScreen";
import { primaryNavItems } from "../lib/nav";
import { SCENE_CHANNELS, getShowcaseChannel } from "../lib/sceneChannels";
import { clearShowcasePromoSeen } from "../lib/station";
import { color, fontDisplay, fontMono, glass, homeSpace } from "../theme";
import CoverImage from "../components/ui/CoverImage";

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
  const [showcaseOpen, setShowcaseOpen] = useState(true);
  const [activeChannelId, setActiveChannelId] = useState("local-pnw");
  const showcase = getShowcaseChannel();
  const channels = [...SCENE_CHANNELS].sort((a, b) => {
    if (!!a.showcase !== !!b.showcase) return a.showcase ? -1 : 1;
    return (a.num || 0) - (b.num || 0);
  });
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );

  useEffect(() => {
    clearShowcasePromoSeen();
  }, []);

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
          liveShow={{ shortTitle: "Local PNW", title: "Local Pacific Northwest" }}
        />
      </div>
      <ShowcasePromo
        channel={showcase}
        open={screen === "home" && showcaseOpen}
        onTune={(ch) => {
          setActiveChannelId(ch.id);
          setShowcaseOpen(false);
        }}
        onDismiss={() => setShowcaseOpen(false)}
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
      {isDesktop && (
        <div
          className="hide-scroll"
          style={{
            width: 336,
            flexShrink: 0,
            borderLeft: `1px solid ${glass.border}`,
            background: color.surfaceRaised,
            padding: "22px 12px 24px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              padding: "0 8px 14px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.8,
                  textTransform: "uppercase",
                  color: color.faint,
                  fontFamily: fontMono,
                  marginBottom: 4,
                }}
              >
                Queue
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 650,
                  letterSpacing: -0.25,
                  color: color.ink,
                  fontFamily: fontDisplay,
                }}
              >
                Up Next
              </div>
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                fontFamily: fontMono,
                color: color.muted,
              }}
            >
              Shuffle
            </div>
          </div>
          {SAMPLE_TRACKS.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 8px",
              }}
            >
              <div
                style={{
                  width: 18,
                  fontSize: 10,
                  fontFamily: fontMono,
                  color: color.faint,
                  textAlign: "center",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 5,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <CoverImage src={t.albumCover} alt="" width={40} height={40} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontFamily: fontDisplay,
                    color: color.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.title}
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 11,
                    color: color.muted,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.artist}
                </div>
              </div>
            </div>
          ))}
        </div>
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
      <style>{`
        @media (max-width: 767px) {
          .pmp-preview-rail { display: none !important; }
        }
      `}</style>
    </div>
  );
}
