/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import BottomNavigation from "./BottomNavigation";
import HomeHeader from "./HomeHeader";
import HeroPlayerCard from "./HeroPlayerCard";
import ChannelCard from "./ChannelCard";
import ChannelSurfingSection from "./ChannelSurfingSection";
import HomeScreen from "../../screens/HomeScreen";
import { TonightDeck } from "../station/ShowGuide";
import { PRIMARY_TABS, primaryNavItems } from "../../lib/nav";

jest.mock("../../usePlayerPlayback", () => ({
  usePlayerPlayback: () => ({ progress: 12, duration: 180 }),
}));

jest.mock("../../usePlayerTransport", () => ({
  useIsPlaying: () => true,
  useIsBuffering: () => false,
  useTransportTrackId: () => "t1",
  useCurrentTrack: () => ({
    id: "t1",
    title: "Night Drive",
    artist: "Signal",
    albumCover: "/brand/planet-mp3-lockup-on-black.png",
  }),
}));

describe("Home broadcast + four-tab IA", () => {
  let div;
  let root;

  beforeEach(() => {
    div = document.createElement("div");
    document.body.appendChild(div);
    root = createRoot(div);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });

  test("dock renders four primary tabs and not Charts or Search", async () => {
    await act(async () => {
      root.render(
        React.createElement(BottomNavigation, {
          items: primaryNavItems(),
          activeId: "home",
        })
      );
    });
    const labels = [...div.querySelectorAll(".pill-tab")].map((el) => el.getAttribute("aria-label"));
    expect(labels).toEqual(PRIMARY_TABS.map((t) => t.label));
    expect(labels).toHaveLength(4);
    expect(labels).not.toContain("Charts");
    expect(labels).not.toContain("Search");
  });

  test("Home header exposes Search, not Charts", async () => {
    const onOpenSearch = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(HomeHeader, { onOpenSearch })
      );
    });
    expect(div.querySelector('button[aria-label="Charts"]')).toBeNull();
    expect(div.textContent).not.toMatch(/PLANET \/ 003/);
    expect(div.textContent).toMatch(/Planet MP3/);
    expect(div.textContent).not.toMatch(/PMP3/);
    expect(div.textContent).not.toMatch(/Late signal/);
    expect(div.textContent).not.toMatch(/Prime time/);
    expect(div.querySelector('button[aria-label="Previous"]')).toBeNull();
    expect(div.querySelector('button[aria-label="Back"]')).toBeNull();
    const search = div.querySelector('button[aria-label="Search"]');
    expect(search).toBeTruthy();
    expect(search.textContent).toMatch(/Find/);
    expect(div.querySelector('button[aria-label="Club"]')).toBeNull();
    expect(div.querySelector('button[aria-label="Profile"]')).toBeNull();
    expect(div.querySelector(".pmp-onair-chip")).toBeNull();
    expect(div.textContent).not.toMatch(/98\.3/);
    expect(div.textContent).not.toMatch(/On air/i);
    await act(async () => {
      search.click();
    });
    expect(onOpenSearch).toHaveBeenCalled();
  });

  test("Home header menu opens the More overflow drawer", async () => {
    const onOpenMenu = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(HomeHeader, { onOpenMenu })
      );
    });
    const menu = div.querySelector('button[aria-label="More"]');
    expect(menu).toBeTruthy();
    await act(async () => {
      menu.click();
    });
    expect(onOpenMenu).toHaveBeenCalled();
  });

  test("hero stage mounts a synced video plane when the cut has videoUrl", async () => {
    const track = {
      id: "t1",
      title: "Night Drive",
      artist: "Signal",
      albumCover: "/brand/planet-mp3-lockup-on-black.png",
      videoUrl: "https://cdn.example/night-drive.mp4",
    };
    await act(async () => {
      root.render(
        React.createElement(HeroPlayerCard, {
          track,
          isRadioMode: true,
          sceneChannel: { id: "rap", num: 3, shortTitle: "Rap City", title: "Rap City" },
        })
      );
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    const video = div.querySelector("video");
    expect(video).toBeTruthy();
    expect(video.getAttribute("src")).toBe(track.videoUrl);
    expect(div.textContent).toMatch(/CH-03/i);
    expect(div.textContent).toMatch(/Video/i);
    expect(div.textContent).toMatch(/Night Drive/);
  });

  test("music-only stage is album-art broadcast with up next, no video plane", async () => {
    const track = {
      id: "t1",
      title: "Night Drive",
      artist: "Signal",
      albumCover: "/brand/planet-mp3-lockup-on-black.png",
      color: "#65E6FF",
    };
    const onSeek = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(HeroPlayerCard, {
          track,
          isRadioMode: true,
          upNextTrack: { title: "After Hours", artist: "Low Light" },
          onSeek,
          sceneChannel: { id: "rap", num: 3, shortTitle: "Rap City", title: "Rap City" },
        })
      );
    });
    expect(div.querySelector("video")).toBeNull();
    expect(div.querySelector(".pmp-hero-sleeve")).toBeTruthy();
    expect(div.querySelector(".pmp-hero-wash")).toBeTruthy();
    expect(div.querySelector(".pmp-glass-stage")).toBeTruthy();
    expect(div.querySelector(".pmp-planet-pip")).toBeTruthy();
    expect(div.querySelector(".pmp-play-planet")).toBeTruthy();
    expect(div.textContent).not.toMatch(/PMP3/);
    expect(div.textContent).not.toMatch(/PLANET \/ 003/);
    expect(div.querySelector('[aria-label="Previous"]')).toBeNull();
    expect(div.textContent).toMatch(/Now playing/i);
    expect(div.textContent).toMatch(/Night Drive/);
    expect(div.textContent).toMatch(/Up next/i);
    expect(div.querySelector(".pmp-upnext-glass")).toBeTruthy();
    expect(div.textContent).toMatch(/After Hours/);
    const seek = div.querySelector('[aria-label="Seek"]');
    expect(seek).toBeTruthy();
    await act(async () => {
      const rect = { left: 0, width: 100 };
      seek.getBoundingClientRect = () => rect;
      seek.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 50 }));
    });
    expect(onSeek).toHaveBeenCalled();
  });

  test("idle hero shows the preview cut as Up first", async () => {
    await act(async () => {
      root.render(
        React.createElement(HeroPlayerCard, {
          track: null,
          previewTrack: { title: "Morning Signal", artist: "Sol Park" },
          daypart: { vibe: "Soft open" },
        })
      );
    });
    expect(div.textContent).toMatch(/Up first/i);
    expect(div.textContent).toMatch(/Morning Signal/);
    expect(div.textContent).toMatch(/Sol Park/);
    expect(div.querySelector('[aria-label*="Up first Morning Signal"]')).toBeTruthy();
    expect(div.querySelectorAll("img").length).toBe(1);
    expect(div.querySelector(".pmp-hero-wash")).toBeTruthy();
    expect(div.querySelector('[data-testid="rabbit-turtle"]')).toBeTruthy();
    expect(div.querySelector('[aria-label="Start listening"]')).toBeTruthy();
    expect(div.textContent).toMatch(/Start listening/);
    expect(div.textContent).toMatch(/Turtle/);
    expect(div.textContent).toMatch(/Rabbit/);
    expect(div.querySelector(".pmp-seek__well")).toBeNull();
  });

  test("live hero has Turtle / Rabbit and dislike, not a Request button", async () => {
    await act(async () => {
      root.render(
        React.createElement(HeroPlayerCard, {
          track: {
            id: "t1",
            title: "Night Drive",
            artist: "Signal",
            albumCover: "/brand/planet-mp3-lockup-on-black.png",
          },
          isRadioMode: true,
          onDislike: () => {},
          onLike: () => {},
        })
      );
    });
    expect(div.textContent).not.toMatch(/\bRequest\b/);
    expect(div.querySelector('[data-testid="rabbit-turtle"]')).toBeTruthy();
    expect(div.querySelector('[aria-label="Turtle — slow down upcoming tracks"]')).toBeTruthy();
    expect(div.querySelector('[aria-label="Rabbit — speed up upcoming tracks"]')).toBeTruthy();
    expect(div.querySelector('[data-testid="pace-slot"]')).toBeNull();
    expect(div.querySelector(".pmp-pace-slot")).toBeNull();
    expect(div.querySelector('[data-testid="player-deck"]')).toBeTruthy();
    expect(div.querySelector(".pmp-deck-plate")).toBeTruthy();
    expect(div.querySelector(".pmp-seek__well")).toBeTruthy();
    expect(div.querySelector(".pmp-timeline")).toBeTruthy();
    expect(div.textContent).toMatch(/Turtle/);
    expect(div.textContent).toMatch(/Rabbit/);
    expect(div.textContent).toMatch(/Next picks/);
    expect(div.textContent).not.toMatch(/\bEase\b|\bLift\b|\bMiddle\b/);
    expect(div.querySelector('[aria-label="Dislike this track"]')).toBeTruthy();
  });

  test("live hero crawls a station ticker when provided", async () => {
    await act(async () => {
      root.render(
        React.createElement(HeroPlayerCard, {
          track: {
            id: "t1",
            title: "Night Drive",
            artist: "Signal",
            albumCover: "/brand/planet-mp3-lockup-on-black.png",
          },
          isRadioMode: true,
          tickerText: "Planet Radio — requests open",
        })
      );
    });
    expect(div.textContent).toMatch(/Planet Radio — requests open/);
  });

  test("channel cards are art tiles, not ticket stubs", async () => {
    const channel = {
      id: "y2k",
      num: 1,
      shortTitle: "Y2K Dance",
      title: "Y2K Dance",
      tagline: "Millennium dancefloor",
    };
    await act(async () => {
      root.render(
        React.createElement(ChannelCard, {
          channel,
          active: true,
        })
      );
    });
    expect(div.querySelector(".pmp-channel-card")).toBeTruthy();
    expect(div.querySelector(".pmp-channel-ticket")).toBeNull();
    expect(div.textContent).toMatch(/Y2K Dance/);
    expect(div.textContent).toMatch(/Millennium dancefloor/);
    expect(div.textContent).toMatch(/Playing/);
    expect(div.textContent).toMatch(/01/);
    expect(div.textContent).not.toMatch(/Admit one/i);
    expect(div.textContent).not.toMatch(/ADMIT ONE/);
    expect(div.textContent).not.toMatch(/PLANET\s*[·•]/i);
    expect(div.textContent).not.toMatch(/Tune/);
    expect(div.querySelector('[aria-label="Tune Y2K Dance — Millennium dancefloor"]')).toBeTruthy();
    expect(div.querySelector("[aria-pressed]")).toBeTruthy();
  });

  test("Local tile matches other stations — no featured halo", async () => {
    await act(async () => {
      root.render(
        React.createElement(ChannelCard, {
          channel: {
            id: "local-pnw",
            title: "Local",
            shortTitle: "Local",
            tagline: "Pacific Northwest only",
            showcase: true,
          },
        })
      );
    });
    const card = div.querySelector(".pmp-channel-card");
    expect(card).toBeTruthy();
    expect(card.className).not.toMatch(/pmp-channel-card--featured/);
    expect(card.className).not.toMatch(/pmp-channel-card--gold/);
    expect(div.textContent).toMatch(/Local/);
    expect(div.textContent).toMatch(/Pacific Northwest only/);
    expect(div.textContent).not.toMatch(/PNW/);
    expect(div.textContent).not.toMatch(/Showcase/);
    expect(div.querySelector(".pmp-showcase-promo")).toBeNull();
  });

  test("Local playing still says Playing, not Showcase", async () => {
    await act(async () => {
      root.render(
        React.createElement(ChannelCard, {
          channel: {
            id: "local-pnw",
            title: "Local",
            shortTitle: "Local",
            tagline: "Pacific Northwest only",
            showcase: true,
          },
          active: true,
        })
      );
    });
    expect(div.querySelector(".pmp-channel-card--featured")).toBeNull();
    expect(div.querySelector(".pmp-channel-card--gold")).toBeNull();
    expect(div.textContent).toMatch(/Playing/);
    expect(div.textContent).not.toMatch(/Showcase/);
  });

  test("channel card click tunes the station", async () => {
    const onClick = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ChannelCard, {
          channel: {
            id: "downtempo",
            title: "Downtempo",
            tagline: "Trip-hop, chill, late listening",
            art: "/channels/downtempo.png",
          },
          onClick,
        })
      );
    });
    div.querySelector(".pmp-channel-card").click();
    expect(onClick).toHaveBeenCalledTimes(1);
    const img = div.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toMatch(/\/channels\/downtempo\.png/);
    expect(div.querySelector("[style*='grid-template-columns']")).toBeNull();
  });

  test("Channel Surfing loads one PS1 plate per station, not a 4-up mosaic", async () => {
    await act(async () => {
      root.render(
        React.createElement(ChannelSurfingSection, {
          channels: [
            {
              id: "techno",
              num: 6,
              title: "Techno",
              shortTitle: "Techno",
              tagline: "Four-on-the-floor",
              covers: ["sleeve-a.jpg", "sleeve-b.jpg", "sleeve-c.jpg", "sleeve-d.jpg"],
            },
          ],
        })
      );
    });
    const card = div.querySelector(".pmp-channel-card");
    expect(card).toBeTruthy();
    expect(card.querySelectorAll("img").length).toBeLessThanOrEqual(1);
    expect(card.querySelector("img")?.getAttribute("src")).toMatch(/\/channels\/techno\.png/);
    expect(card.querySelector("[style*='grid-template-columns']")).toBeNull();
  });

  test("Channel Surfing rail has no ticket copy or request card", async () => {
    await act(async () => {
      root.render(
        React.createElement(ChannelSurfingSection, {
          channels: [
            { id: "rap", num: 3, title: "Rap City", tagline: "Bars after dark" },
          ],
          activeChannelId: "rap",
        })
      );
    });
    expect(div.textContent).toMatch(/Channel Surfing/);
    expect(div.textContent).toMatch(/Flip the dial/);
    expect(div.textContent).not.toMatch(/Music stays on this stage/i);
    expect(div.textContent).not.toMatch(/On the dial/i);
    expect(div.textContent).not.toMatch(/Admit one/i);
    expect(div.textContent).not.toMatch(/Request a song/i);
  });

  test("On Tonight lives in its own frosted glass stage", async () => {
    await act(async () => {
      root.render(
        React.createElement(TonightDeck, {
          airing: {
            show: {
              id: "countdown",
              title: "Most Requested Live",
              tagline: "Prime-time countdown with Dez",
              timeLabel: "8–10 PM",
              startHour: 20,
              endHour: 22,
              host: { name: "Dez Rivera", monogram: "DR" },
            },
            host: { name: "Dez Rivera", monogram: "DR" },
            remainingMinutes: 42,
            progress: 0.35,
            nextShow: { shortTitle: "Late Signal", startHour: 22 },
          },
        })
      );
    });
    const stage = div.querySelector(".pmp-tonight-glass");
    expect(stage).toBeTruthy();
    expect(stage.className).toMatch(/pmp-glass-stage/);
    expect(div.textContent).toMatch(/On Tonight/);
    expect(div.textContent).toMatch(/Prime-time countdown with Dez/);
    expect(div.textContent).not.toMatch(/PMP3/);
  });

  test("Today is a compact rail when the on-air stage is hidden", async () => {
    await act(async () => {
      root.render(
        React.createElement(TonightDeck, {
          airing: {
            show: {
              id: "countdown",
              title: "Most Requested Live",
              shortTitle: "Most Requested",
              startHour: 20,
              endHour: 22,
            },
          },
          guide: [
            { id: "sunrise", title: "Sunrise", shortTitle: "Sunrise", startHour: 5, status: "past" },
            { id: "countdown", title: "Most Requested Live", shortTitle: "Most Requested", startHour: 20, status: "live" },
          ],
          showNowPlaying: false,
        })
      );
    });
    expect(div.querySelector(".pmp-tonight-glass")).toBeNull();
    expect(div.querySelector(".pmp-today-band")).toBeTruthy();
    expect(div.textContent).toMatch(/Today/);
    expect(div.textContent).not.toMatch(/On Tonight/);
  });

  test("home does not open a showcase popup for Local", async () => {
    const onTuneSceneChannel = jest.fn();
    const tracks = [
      {
        id: "pnw-1",
        title: "Rain City",
        artist: "Fog",
        region: "pnw",
        duration: 180,
        audioUrl: "https://cdn.example/rain.mp3",
      },
      {
        id: "other",
        title: "Other",
        artist: "NYC",
        genre: "Hip-Hop",
        duration: 180,
        audioUrl: "https://cdn.example/other.mp3",
      },
    ];
    await act(async () => {
      root.render(
        React.createElement(HomeScreen, {
          tracks,
          onTuneSceneChannel,
        })
      );
    });
    expect(div.querySelector(".pmp-showcase-promo")).toBeNull();
    expect(div.textContent).not.toMatch(/Showcase/);
    expect(div.textContent).not.toMatch(/Not now/);
    expect(div.textContent).not.toMatch(/Tune in/);
    expect(div.querySelector(".pmp-channel-surf")).toBeNull();
    expect(div.textContent).not.toMatch(/Channel Surfing/);
  });

  test("Home loading shows the player, not Channel Surfing", async () => {
    await act(async () => {
      root.render(
        React.createElement(HomeScreen, {
          tracks: [],
          catalogLoading: true,
        })
      );
    });
    expect(div.querySelector(".pmp-channel-surf")).toBeNull();
    expect(div.textContent).not.toMatch(/Channel Surfing/);
    expect(div.textContent).toMatch(/Getting ready/i);
    expect(div.textContent).toMatch(/Loading your player/i);
    expect(div.textContent).not.toMatch(/Nothing here yet/);
    expect(div.textContent).not.toMatch(/Couldn.t load/);
    expect(div.querySelector(".pmp-showcase-promo")).toBeNull();
  });

  test("player then personal then one editorial — radio is off Home", async () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.join(__dirname, "../../screens/HomeScreen.jsx"),
      "utf8"
    );
    const hero = src.indexOf("<HeroPlayerCard");
    const personal = src.indexOf("<HomePersonal");
    const editorial = src.indexOf("<HomeEditorial");
    expect(hero).toBeGreaterThan(-1);
    expect(personal).toBeGreaterThan(hero);
    expect(editorial).toBeGreaterThan(personal);
    expect(src).not.toMatch(/ChannelSurfingSection/);
    expect(src).not.toMatch(/TonightDeck/);
  });

  test("signed-in empty personal shelf offers Discover; guests skip it", async () => {
    const onOpenDiscover = jest.fn();
    const playable = {
      id: "t1",
      title: "Night Drive",
      artist: "Signal",
      duration: 180,
      audioUrl: "https://cdn.example/a.mp3",
    };
    await act(async () => {
      root.render(
        React.createElement(HomeScreen, {
          tracks: [playable],
          signedIn: true,
          onOpenDiscover,
        })
      );
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });
    expect(div.querySelector('[data-testid="home-personal"]')).toBeTruthy();
    expect(div.textContent).toMatch(/Your listening/);
    expect(div.textContent).toMatch(/Find music/);
    await act(async () => {
      div.querySelector('[aria-label="Find music"]').click();
    });
    expect(onOpenDiscover).toHaveBeenCalled();

    await act(async () => {
      root.render(
        React.createElement(HomeScreen, {
          tracks: [playable],
          signedIn: false,
        })
      );
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });
    expect(div.querySelector('[data-testid="home-personal"]')).toBeNull();
    expect(div.textContent).not.toMatch(/Your listening/);
  });

  test("Home recents rail uses profile listen order", async () => {
    await act(async () => {
      root.render(
        React.createElement(HomeScreen, {
          tracks: [
            { id: "a", title: "Alpha", artist: "One", duration: 180, audioUrl: "https://cdn.example/a.mp3" },
            { id: "b", title: "Beta", artist: "Two", duration: 180, audioUrl: "https://cdn.example/b.mp3", liked: true },
          ],
          recentTrackIds: ["b", "a"],
          signedIn: true,
        })
      );
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });
    const personal = div.querySelector('[data-testid="home-personal"]');
    expect(personal).toBeTruthy();
    expect(personal.textContent).toMatch(/Recently played/);
    expect(personal.textContent).toMatch(/Beta/);
    expect(personal.textContent).toMatch(/Liked/);
  });

  test("first Channel Surfing tile is LCP-eager, later tiles lazy", async () => {
    await act(async () => {
      root.render(
        React.createElement(ChannelSurfingSection, {
          channels: [
            { id: "y2k-dance", title: "Y2K Dance", tagline: "floor", covers: ["a.jpg"] },
            { id: "downtempo", title: "Downtempo", tagline: "late", covers: ["b.jpg"] },
            { id: "punk", title: "Punk", tagline: "fast", covers: ["c.jpg"] },
            { id: "metal", title: "Metal", tagline: "gain", covers: ["d.jpg"] },
          ],
        })
      );
    });
    const imgs = [...div.querySelectorAll("img")];
    expect(imgs.length).toBeGreaterThanOrEqual(4);
    expect(imgs.every((img) => /\/channels\/.+\.png$/.test(img.getAttribute("src") || ""))).toBe(true);
    expect(imgs[0].getAttribute("fetchpriority") || imgs[0].fetchPriority).toMatch(/high/i);
    expect(imgs[0].getAttribute("loading")).toBe("eager");
    expect(imgs[1].getAttribute("loading")).toBe("eager");
    expect(imgs[3].getAttribute("loading")).toBe("lazy");
  });

  test("station tiles use PS1 plates, never catalog sleeves", async () => {
    await act(async () => {
      root.render(
        React.createElement(ChannelCard, {
          channel: {
            id: "techno",
            num: 6,
            title: "Techno",
            tagline: "Four-on-the-floor",
          },
          covers: ["sleeve-a.jpg"],
        })
      );
    });
    const img = div.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toMatch(/\/channels\/techno\.png/);
    expect(img.getAttribute("src")).not.toMatch(/sleeve-a\.jpg/);
    expect(div.textContent).toMatch(/06/);
    expect(div.querySelector(".pmp-channel-ch-bug")).toBeTruthy();
    expect(div.querySelector("[data-testid='cover-fallback']")).toBeNull();
    await act(async () => {
      root.render(
        React.createElement(ChannelCard, {
          channel: {
            id: "techno",
            num: 6,
            title: "Techno",
            tagline: "Four-on-the-floor",
          },
        })
      );
    });
    expect(div.querySelector("img").getAttribute("src")).toMatch(/\/channels\/techno\.png/);
    expect(div.querySelector("[data-testid='cover-fallback']")).toBeNull();
  });
});
