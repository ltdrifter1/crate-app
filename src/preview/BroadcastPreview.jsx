/**
 * Dev-only Home broadcast preview — hash #broadcast-preview.
 * Lets us exercise the four-tab dock + video stage without Firebase auth.
 */
import BottomNavigation from "../components/home/BottomNavigation";
import HomeHeader from "../components/home/HomeHeader";
import HeroPlayerCard from "../components/home/HeroPlayerCard";
import ChannelSurfingSection from "../components/home/ChannelSurfingSection";
import { primaryNavItems } from "../lib/nav";
import { color, homeSpace } from "../theme";

const SAMPLE_TRACK = {
  id: "preview-1",
  title: "Night Drive",
  artist: "Signal",
  albumCover: "/brand/planet-mp3-lockup-on-black.png",
  videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  liked: false,
};

const SAMPLE_CHANNELS = [
  { id: "rap", num: 3, shortTitle: "Rap City", title: "Rap City", tagline: "Bars after dark" },
  { id: "rock", num: 5, shortTitle: "120 Minutes", title: "120 Minutes", tagline: "Alt + volume" },
  { id: "pop", num: 1, shortTitle: "Total Request", title: "Total Request", tagline: "Countdown energy" },
];

export default function BroadcastPreview() {
  return (
    <div style={{ minHeight: "100dvh", background: color.canvas, paddingBottom: 120 }}>
      <HomeHeader onOpenSearch={() => {}} onOpenCharts={() => {}} onOpenProfile={() => {}} />
      <ChannelSurfingSection
        channels={SAMPLE_CHANNELS}
        channelCovers={{}}
        activeChannelId="rap"
        onTuneChannel={() => {}}
      />
      <div style={{ padding: `0 ${homeSpace.gutter}px`, marginTop: homeSpace.sectionGap }}>
        <HeroPlayerCard
          track={SAMPLE_TRACK}
          isRadioMode
          sceneChannel={SAMPLE_CHANNELS[0]}
          liveShow={{ shortTitle: "Rap City", title: "Rap City" }}
        />
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
        <BottomNavigation items={primaryNavItems()} activeId="home" />
      </div>
    </div>
  );
}
