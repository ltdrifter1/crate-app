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
import { PRIMARY_TABS, primaryNavItems } from "../../lib/nav";

jest.mock("../../usePlayerPlayback", () => ({
  usePlayerPlayback: () => ({ progress: 12, duration: 180 }),
}));

jest.mock("../../usePlayerTransport", () => ({
  useIsPlaying: () => true,
  useIsBuffering: () => false,
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
    const search = div.querySelector('button[aria-label="Search"]');
    expect(search).toBeTruthy();
    expect(div.querySelector(".pmp-onair-chip")).toBeNull();
    expect(div.textContent).not.toMatch(/On air/i);
    await act(async () => {
      search.click();
    });
    expect(onOpenSearch).toHaveBeenCalled();
  });

  test("Home header menu opens the mobile browse drawer", async () => {
    const onOpenMenu = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(HomeHeader, { onOpenMenu })
      );
    });
    const menu = div.querySelector('button[aria-label="Browse"]');
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
    expect(div.textContent).toMatch(/On air/i);
    expect(div.textContent).toMatch(/PMP3/);
    expect(div.textContent).toMatch(/Night Drive/);
    expect(div.textContent).toMatch(/Up next/i);
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
  });

  test("live hero has energy-shift beaker and dislike, not a Request button", async () => {
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
    expect(div.querySelector('[aria-label="Energy shift — speed up or slow down the mix"]')).toBeTruthy();
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
    expect(div.textContent).not.toMatch(/Admit one/i);
    expect(div.textContent).not.toMatch(/ADMIT ONE/);
    expect(div.textContent).not.toMatch(/PLANET\s*[·•]/i);
    expect(div.textContent).not.toMatch(/Tune/);
    expect(div.querySelector('[aria-label="Tune Y2K Dance — Millennium dancefloor"]')).toBeTruthy();
    expect(div.querySelector("[aria-pressed]")).toBeTruthy();
  });

  test("Local PNW tile is featured without a Showcase badge", async () => {
    await act(async () => {
      root.render(
        React.createElement(ChannelCard, {
          channel: {
            id: "local-pnw",
            title: "Local Pacific Northwest",
            shortTitle: "Local PNW",
            tagline: "Pacific Northwest only",
            showcase: true,
          },
        })
      );
    });
    const card = div.querySelector(".pmp-channel-card");
    expect(card).toBeTruthy();
    expect(card.className).toMatch(/pmp-channel-card--featured/);
    expect(div.textContent).toMatch(/Local PNW/);
    expect(div.textContent).toMatch(/Pacific Northwest only/);
    expect(div.textContent).not.toMatch(/Showcase/);
    expect(div.querySelector(".pmp-showcase-promo")).toBeNull();
  });

  test("Local PNW playing still says Playing, not Showcase", async () => {
    await act(async () => {
      root.render(
        React.createElement(ChannelCard, {
          channel: {
            id: "local-pnw",
            title: "Local Pacific Northwest",
            shortTitle: "Local PNW",
            tagline: "Pacific Northwest only",
            showcase: true,
          },
          active: true,
        })
      );
    });
    expect(div.querySelector(".pmp-channel-card--featured")).toBeTruthy();
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
    expect(div.querySelectorAll("img")).toHaveLength(1);
    expect(div.querySelector("[style*='grid-template-columns']")).toBeNull();
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
    expect(div.textContent).toMatch(/Music stays on this stage/i);
    expect(div.textContent).not.toMatch(/On the dial/i);
    expect(div.textContent).not.toMatch(/Admit one/i);
    expect(div.textContent).not.toMatch(/Request a song/i);
  });

  test("home does not open a showcase popup for Local PNW", async () => {
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
    const surf = div.querySelector(".pmp-channel-surf");
    expect(surf).toBeTruthy();
    expect(surf.textContent).toMatch(/Local PNW/);
    const featured = [...surf.querySelectorAll(".pmp-channel-card")].find((el) =>
      el.className.includes("pmp-channel-card--featured")
    );
    expect(featured).toBeTruthy();
    expect(featured.textContent).toMatch(/Local PNW/);
    expect(featured.getAttribute("aria-label")).toMatch(/Local Pacific Northwest/);
    const otherFeatured = [...surf.querySelectorAll(".pmp-channel-card")].filter(
      (el) => el.className.includes("pmp-channel-card--featured") && !el.textContent.includes("Local PNW")
    );
    expect(otherFeatured).toHaveLength(0);
    await act(async () => {
      featured.click();
    });
    expect(onTuneSceneChannel).toHaveBeenCalled();
    expect(onTuneSceneChannel.mock.calls[0][0].id).toBe("local-pnw");
  });

  test("Home paints Channel Surfing before the catalog arrives", async () => {
    await act(async () => {
      root.render(
        React.createElement(HomeScreen, {
          tracks: [],
          catalogLoading: true,
        })
      );
    });
    expect(div.querySelector(".pmp-channel-surf")).toBeTruthy();
    expect(div.textContent).toMatch(/Channel Surfing/);
    expect(div.textContent).toMatch(/Y2K Dance/);
    expect(div.textContent).toMatch(/Stand by/i);
    expect(div.textContent).toMatch(/Pulling tonight/i);
    expect(div.textContent).not.toMatch(/Shelf is empty/);
    expect(div.textContent).not.toMatch(/Couldn.t pull the shelf/);
    expect(div.querySelector(".pmp-showcase-promo")).toBeNull();
  });

  test("first Channel Surfing tile is LCP-eager, later tiles lazy", async () => {
    await act(async () => {
      root.render(
        React.createElement(ChannelSurfingSection, {
          channels: [
            { id: "y2k-dance", title: "Y2K Dance", tagline: "floor" },
            { id: "downtempo", title: "Downtempo", tagline: "late" },
            { id: "punk", title: "Punk", tagline: "fast" },
            { id: "metal", title: "Metal", tagline: "gain" },
          ],
        })
      );
    });
    const imgs = [...div.querySelectorAll("img")];
    expect(imgs.length).toBeGreaterThanOrEqual(4);
    expect(imgs[0].getAttribute("fetchpriority") || imgs[0].fetchPriority).toMatch(/high/i);
    expect(imgs[0].getAttribute("loading")).toBe("eager");
    expect(imgs[1].getAttribute("loading")).toBe("eager");
    expect(imgs[3].getAttribute("loading")).toBe("lazy");
  });
});
