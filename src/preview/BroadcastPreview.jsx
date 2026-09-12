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

const SAMPLE_COVER = "/brand/planet-mp3-lockup-on-black.png";

const SAMPLE_TRACK = {
  id: "preview-1",
  title: "Night Drive",
  artist: "Signal",
  albumCover: SAMPLE_COVER,
  color: "#65E6FF",
  liked: false,
};

const SAMPLE_NEXT = {
  id: "preview-2",
  title: "After Hours",
  artist: "Low Light",
};

const SAMPLE_CHANNELS = [
  { id: "rap", num: 3, shortTitle: "Rap City", title: "Rap City", tagline: "Bars after dark" },
  { id: "rock", num: 5, shortTitle: "120 Minutes", title: "120 Minutes", tagline: "Alt + volume" },
  { id: "pop", num: 1, shortTitle: "Total Request", title: "Total Request", tagline: "Countdown energy" },
  { id: "y2k", num: 1, shortTitle: "Y2K Dance", title: "Y2K Dance", tagline: "Millennium dancefloor" },
];

const SAMPLE_COVERS = {
  rap: [SAMPLE_COVER, SAMPLE_COVER, SAMPLE_COVER, SAMPLE_COVER],
  rock: [SAMPLE_COVER],
  pop: [SAMPLE_COVER, SAMPLE_COVER],
  y2k: [SAMPLE_COVER],
};

export default function BroadcastPreview() {
  return (
    <div style={{ minHeight: "100dvh", background: color.canvas, paddingBottom: 120 }}>
      <HomeHeader onOpenSearch={() => {}} onOpenCharts={() => {}} onOpenProfile={() => {}} />
      <ChannelSurfingSection
        channels={SAMPLE_CHANNELS}
        channelCovers={SAMPLE_COVERS}
        activeChannelId="y2k"
        onTuneChannel={() => {}}
      />
      <div style={{ padding: `0 ${homeSpace.gutter}px`, marginTop: homeSpace.sectionGap }}>
        <HeroPlayerCard
          track={SAMPLE_TRACK}
          upNextTrack={SAMPLE_NEXT}
          isRadioMode
          sceneChannel={SAMPLE_CHANNELS[3]}
          liveShow={{ shortTitle: "Y2K Dance", title: "Y2K Dance" }}
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
