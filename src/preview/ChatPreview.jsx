/**
 * Dev-only IA preview — hash #chat-preview.
 * Home broadcast stage + ice live chat (open on desktop).
 */
import { useEffect, useState } from "react";
import HomeHeader from "../components/home/HomeHeader";
import HeroPlayerCard from "../components/home/HeroPlayerCard";
import ChannelSurfingSection from "../components/home/ChannelSurfingSection";
import AppSidebar from "../components/layout/AppSidebar";
import BottomNavigation from "../components/home/BottomNavigation";
import { primaryNavItems } from "../lib/nav";
import { SCENE_CHANNELS } from "../lib/sceneChannels";
import { CHANNEL_ART } from "../lib/channelArt";
import { color, font, glass, homeSpace } from "../theme";
import HomeMessenger from "../components/chat/HomeMessenger";
import { CHAT_DESKTOP_MIN } from "../lib/stationChat";

const SAMPLE_COVER = "/brand/planet-mp3-lockup-on-black.png";

const SAMPLE_TRACK = {
  id: "preview-1",
  title: "Night Drive",
  artist: "Signal",
  albumCover: CHANNEL_ART["y2k-dance"] || SAMPLE_COVER,
  color: "#65E6FF",
  liked: true,
  duration: 214,
  audioUrl: "u",
  album: "Afterglow",
  bpm: 118,
  genre: "Electronic",
};

const NOW = Date.parse("2026-09-15T18:04:00");

const SAMPLE_MESSAGES = [
  {
    id: "m1",
    uid: "u2",
    displayName: "Mira",
    text: "This one is for the late bus home",
    createdAt: NOW - 8 * 60_000,
    trackTitle: "Cascade",
  },
  {
    id: "m2",
    uid: "u3",
    displayName: "Jae",
    text: "Local PNW is on fire tonight",
    createdAt: NOW - 5 * 60_000,
  },
  {
    id: "m3",
    uid: "u1",
    displayName: "Luke",
    text: "Stay on this channel",
    createdAt: NOW - 90_000,
  },
];

const SAMPLE_PRESENCE = [
  { uid: "u1", displayName: "Luke", lastSeen: NOW },
  { uid: "u2", displayName: "Mira", lastSeen: NOW - 4000 },
  { uid: "u3", displayName: "Jae", lastSeen: NOW - 12_000 },
];

export default function ChatPreview() {
  const [forced, setForced] = useState(null);
  const [open, setOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= CHAT_DESKTOP_MIN
  );
  const [sent, setSent] = useState(SAMPLE_MESSAGES);

  useEffect(() => {
    const sync = () => {
      setIsDesktop(window.innerWidth >= CHAT_DESKTOP_MIN);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const desktop = forced === "desktop" ? true : forced === "mobile" ? false : isDesktop;
  const channels = [...SCENE_CHANNELS].sort((a, b) => {
    if (!!a.showcase !== !!b.showcase) return a.showcase ? -1 : 1;
    return (a.num || 0) - (b.num || 0);
  });

  const home = (
    <div style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
      <HomeHeader onOpenSearch={() => {}} onOpenProfile={() => {}} />
      <ChannelSurfingSection
        channels={channels}
        activeChannelId="local-pnw"
        onTuneChannel={() => {}}
        first
      />
      <div style={{ padding: `0 ${homeSpace.gutter}px`, marginTop: homeSpace.sectionGap }}>
        <HeroPlayerCard
          track={SAMPLE_TRACK}
          isRadioMode
          sceneChannel={SCENE_CHANNELS.find((c) => c.id === "local-pnw")}
        />
      </div>
    </div>
  );

  const messenger = (
    <HomeMessenger
      key={`${desktop ? "desk" : "mob"}-${open ? "open" : "shut"}`}
      variant={desktop ? "desktop" : "mobile"}
      viewportWidth={desktop ? 1280 : 390}
      defaultOpen={open}
      live={false}
      uid="u1"
      displayName="Luke"
      nowPlaying={SAMPLE_TRACK}
      hasDockPlayer={false}
      embedded={!desktop}
      messages={sent}
      presence={SAMPLE_PRESENCE}
      onSend={(text) => {
        setSent((prev) => [
          ...prev,
          {
            id: `local-${prev.length}`,
            uid: "u1",
            displayName: "Luke",
            text,
            createdAt: Date.now(),
          },
        ]);
        return { ok: true };
      }}
    />
  );

  const previewBar = (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        gap: 6,
        padding: 4,
        borderRadius: 980,
        background: "rgba(18,20,24,0.78)",
        border: `1px solid ${glass.border}`,
      }}
    >
      {[
        ["Desktop collapsed", () => { setForced("desktop"); setOpen(false); }],
        ["Desktop open", () => { setForced("desktop"); setOpen(true); }],
        ["Mobile", () => { setForced("mobile"); setOpen(false); }],
        ["Mobile sheet", () => { setForced("mobile"); setOpen(true); }],
      ].map(([label, fn]) => (
        <button
          key={label}
          type="button"
          onClick={fn}
          style={{
            border: "none",
            background: "transparent",
            color: color.body,
            fontFamily: font,
            fontSize: 11,
            fontWeight: 600,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );

  if (!desktop) {
    return (
      <div
        data-testid="chat-preview"
        style={{
          minHeight: "100dvh",
          background: "#05070a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
        }}
      >
        {previewBar}
        <div
          data-testid="chat-preview-phone"
          style={{
            width: 390,
            height: 844,
            position: "relative",
            overflow: "hidden",
            borderRadius: 28,
            border: `1px solid ${glass.border}`,
            background: color.canvas,
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ height: "100%", overflow: "auto", paddingBottom: 100 }}>
            {home}
          </div>
          {messenger}
          <div
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              bottom: 12,
              zIndex: 20,
            }}
          >
            <BottomNavigation items={primaryNavItems()} activeId="home" onSelect={() => {}} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="chat-preview"
      style={{ display: "flex", minHeight: "100dvh", background: color.canvas, position: "relative" }}
    >
      {previewBar}
      <div className="pmp-preview-rail">
        <AppSidebar screen="home" onNavigate={() => {}} user={{ name: "Luke" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0, overflow: "auto", paddingBottom: 24 }}>
        {home}
      </div>
      {messenger}
      <style>{`
        @media (max-width: 767px) {
          .pmp-preview-rail { display: none !important; }
        }
      `}</style>
    </div>
  );
}
