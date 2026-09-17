import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, startTransition } from "react";
import { useNavigate, useLocation }                 from "react-router-dom";
import { useAuth }                                  from "./useAuth";
import { toggleLike as fbToggleLike, recordPlay, completeOnboarding, saveTasteProfile, saveDislikeTaste, saveFeatureGuideSeen } from "./useUserData";
import { collection, addDoc } from "firebase/firestore";
import { db }                                       from "./firebase";
import {
  font, fontDisplay, fontMono, color, chrome, radius, motion,
  glass, glassControl, homeSpace, dock, sectionRule,
  artShadow, aluminumGradient, chromeFrame,
  APP_STYLE, INPUT_ST, BTN_PRIMARY, BTN_SECONDARY, CTRL_BTN, ADMIN_UID, y2k,
  BRAND_NAME, brandStoragePrefix,
} from "./theme";
import CoverImage from "./components/ui/CoverImage";
import { camelotCompatible, getEnergyRangeForHour, hexToRgbStr } from "./lib/harmony";
import {
  computeHumanState, pickNextTrack,
} from "./lib/engine";
import { mixLaneForDate } from "./lib/mixLanes";
import { parsePath, buildPath, documentTitleFor } from "./lib/routes";
import {
  AUDIO_LOAD_TIMEOUT_MS,
  canAttemptPlay,
  finishAudioUnlock,
  hasPlayableAudio,
  isBenignPlayReject,
  MISSING_AUDIO_TOAST,
  PLAY_REJECTED_TOAST,
  shouldIgnoreUnlockTransportEvent,
} from "./lib/audioUnlock";
import { explainPick } from "./lib/explain";
import { fetchCatalogTracks, fetchHomeLite, isCatalogCacheFresh, readCatalogIdb, writeCatalogIdb } from "./lib/catalogLoad";
import { hydrateCatalogTracks } from "./lib/catalogHydrate";
import { runAfterPaint, runWhenIdle } from "./lib/afterPaint";
import { slugify, findArtist, findAlbum } from "./lib/catalog";
import {
  resolveListenPool,
  listenPoolLabel,
  createListenIntent,
} from "./lib/listenPool";
import { playerEnergyStore } from "./lib/playerEnergyStore";
import {
  getAccessState,
  BILLING,
  PAYWALL_ENABLED,
  PRICING_COMING_SOON,
} from "./lib/entitlements";
import { startCheckout, settleBillingReturn, stripBillingQuery } from "./lib/billing";
import {
  canPlayOnFreeTier,
  bumpPlayMeter,
  freePlaysRemaining,
} from "./lib/freePlays";
import { spendClubCredit } from "./lib/listeningApi";
import { usableCreditBalance } from "./lib/clubCredit";
import { memberPrice, PHYSICAL_COMMERCE_LIVE } from "./lib/physicalStatus";
import {
  buildCommunityMix,
  buildMixFromPlaylist,
  communityMixId,
  communityPlaylistStub,
  formatMonthLabel,
  isCommunityPlaylist,
  monthKey,
  COMMUNITY_MIX_TITLE,
} from "./lib/mixes";
import { absoluteAppUrl, shareOrCopy } from "./lib/share";
import { vibeForMixLane, blendPoolForSession } from "./lib/taste";
import {
  emptyDislikeTaste,
  normalizeDislikeTaste,
  recordDislikeEvent,
} from "./lib/dislikeTaste";
import {
  tasteFromProfile,
  defaultSetPrefs,
  isColdStartTaste,
} from "./lib/ranking";
import { trackHitsPreferredChannels, compileOnboardingTaste } from "./lib/onboardingTaste";
import { shouldAutoShowFeatureTour, featureGuideSeenPayload } from "./lib/featureGuide";
import {
  buildCountdown,
  stationDaypart,
} from "./lib/station";
import { useStationFeed } from "./components/station/useStationFeed";
import {
  useLiveAiring,
} from "./components/station/ShowGuide";
import {
  buildShowPool,
  getShowById,
  pickShowBumper,
  resolveShowAt,
} from "./lib/shows";
import {
  buildSceneChannelPool,
  getSceneChannel,
} from "./lib/sceneChannels";
import { pickTrackBumper, shouldFireTrackBumper } from "./lib/bumpers";
import { trackHasVideo } from "./lib/video";
import { playbackClock } from "./usePlayerPlayback";
import { playerPlaybackStore } from "./lib/playerPlaybackStore";
import {
  transportFlags,
  useCurrentTrack,
  useTransportTrackId,
} from "./usePlayerTransport";
import { signalFlags } from "./usePlayerSignal";
import GlassDock from "./components/player/GlassDock";
import {
  ScreenPane,
  contentPadBottom,
  AmbientNetworkPill,
  CatalogSkeleton,
  Pulse,
  BgMist,
  ToastEl,
} from "./components/layout/AppChrome";

const LoginScreen = lazy(() => import("./components/auth/LoginScreen"));
const ClubScreen = lazy(() => import("./components/club/ClubScreen"));
const LazyMixScreen = lazy(() => import("./components/club/MixScreen"));
const LazyPaywallScreen = lazy(() => import("./components/billing/PaywallScreen"));
const LazyImmersivePlayer = lazy(() => import("./components/player/ImmersivePlayer"));
const LazyChartsScreen = lazy(() => import("./components/station/ChartsScreen"));
const loadHomeScreen = () => import("./screens/HomeScreen");
const HomeScreen = lazy(loadHomeScreen);
loadHomeScreen();
const DevBroadcastPreview =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./preview/BroadcastPreview"))
    : null;
const DevPlayerPreview =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./preview/PlayerPreview"))
    : null;
const DevExplorePreview =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./preview/ExplorePreview"))
    : null;
const DevSetPreview =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./preview/SetPreview"))
    : null;
const DevOnboardingPreview =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./preview/OnboardingPreview"))
    : null;
const ExploreScreen = lazy(() => import("./screens/ExploreScreen"));
const SearchScreen = lazy(() => import("./screens/SearchScreen"));
const FavoritesScreen = lazy(() => import("./screens/FavoritesScreen"));
const AdminScreen = lazy(() => import("./screens/AdminScreen"));
const LazyArtistPage = lazy(() =>
  import("./components/catalog/ArtistPage").then((m) => ({ default: m.default }))
);
const LazyAlbumPage = lazy(() =>
  import("./components/catalog/ArtistPage").then((m) => ({ default: m.AlbumPage }))
);
const AppSidebar = lazy(() => import("./components/layout/AppSidebar"));
const MobileNavDrawer = lazy(() => import("./components/layout/MobileNavDrawer"));
const DesktopMiniPlayer = lazy(() => import("./components/player/DesktopMiniPlayer"));
const LazySetBuilder = lazy(() => import("./components/set/SetBuilderScreen"));
const LazyHypnoVision = lazy(() => import("./components/listen/HypnoVisionOverlay"));
const LazyAfterglow = lazy(() => import("./components/listen/AfterglowOverlay"));
const LazyQueueSheet = lazy(() => import("./components/listen/QueueSheet"));
const LazyGenreTasteSheet = lazy(() => import("./components/listen/GenreTasteSheet"));
const LazyTasteTuner = lazy(() => import("./components/onboarding/TasteTuner"));
const LazyFeatureTour = lazy(() => import("./components/guide/FeatureTour"));
const LazyLinerNotesSheet = lazy(() => import("./components/catalog/LinerNotesSheet"));
const LazyDedicateSheet = lazy(() => import("./components/station/DedicateSheet"));
const LazyStationBumper = lazy(() => import("./components/station/StationBumper"));
const LazyHomeMessenger = lazy(() => import("./components/chat/HomeMessenger"));
const DevChatPreview =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./preview/ChatPreview"))
    : null;
const DevGuidePreview =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./preview/GuidePreview"))
    : null;

const injectStyles = () => {
  let s = document.getElementById("rooms-app-global-styles");
  if (!s) {
    s = document.createElement("style");
    s.id = "rooms-app-global-styles";
    document.head.appendChild(s);
  }
  s.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --font: ${font}; --font-display: ${fontDisplay};
      --ink: ${color.ink}; --muted: ${color.muted}; --faint: ${color.faint};
      --line: ${color.line}; --canvas: ${color.canvas}; --accent: ${color.accent};
      --body: ${color.body}; --surface-raised: ${color.surfaceRaised};
      --glass-fill: ${glass.fillStrong}; --glass-border: ${glass.border};
      --glass-blur: ${glass.blur}; --glass-highlight: ${glass.highlight};
    }
    body {
      font-family: var(--font);
      background: var(--canvas);
      color: var(--ink);
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.14);
      border-radius: 8px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    button {
      transition: opacity ${motion.fast}, background ${motion.base}, transform ${motion.fast}, box-shadow ${motion.base}, border-color ${motion.base};
      font-family: var(--font);
    }
    button:active { opacity: 0.78; }
    button.play-primary:active { transform: scale(0.96); opacity: 0.9; }
    button.glass-control:hover {
      background: ${glass.fillHeavy} !important;
      border-color: ${glass.border} !important;
      box-shadow: inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft} !important;
    }
    button.btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), ${glass.shadowLift} !important;
    }
    button.btn-secondary:hover {
      background: ${glass.fillHeavy} !important;
      transform: translateY(-1px);
      box-shadow: inset 0 1px 0 ${glass.highlight}, ${glass.shadow} !important;
    }
    button:focus-visible, input:focus-visible, [role="button"]:focus-visible {
      outline: 2px solid ${color.accent};
      outline-offset: 2px;
    }
    input:focus {
      outline: none;
      border-color: ${glass.border} !important;
      background: rgba(42,47,55,0.85) !important;
      box-shadow: inset 0 1px 0 ${glass.highlight}, 0 0 0 3px ${color.accentSoft} !important;
    }
    input[type="range"] { -webkit-appearance: none; height: 4px; background: rgba(255,255,255,0.12); border-radius: 2px; outline: none; cursor: pointer; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${color.accent}; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(26,29,36,0.25); cursor: pointer; }
    input[type="range"]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: ${color.accent}; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(26,29,36,0.25); cursor: pointer; }
    input.chrome-seek { -webkit-appearance: none; appearance: none; background: transparent !important; height: 28px !important; }
    input.chrome-seek::-webkit-slider-runnable-track { height: 6px; background: transparent; border: none; }
    input.chrome-seek::-moz-range-track { height: 6px; background: transparent; border: none; }
    input.chrome-seek::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none; width: 18px; height: 18px; margin-top: -6px;
      border-radius: 50%;
      background: linear-gradient(160deg, #FFFFFF 0%, #E8ECF2 45%, #C5CAD3 100%);
      border: 1px solid rgba(22,24,30,0.16);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 6px rgba(0,0,0,0.4);
      cursor: pointer;
    }
    input.chrome-seek::-moz-range-thumb {
      width: 18px; height: 18px; border-radius: 50%;
      background: linear-gradient(160deg, #FFFFFF 0%, #E8ECF2 45%, #C5CAD3 100%);
      border: 1px solid rgba(22,24,30,0.16);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 6px rgba(0,0,0,0.4);
      cursor: pointer;
    }
    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    .hide-scroll::-webkit-scrollbar { display: none; }
    .glass-surface {
      background: ${glass.plate};
      border: 1px solid ${glass.borderSoft};
      box-shadow: inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft};
      -webkit-backdrop-filter: ${glass.blur};
      backdrop-filter: ${glass.blur};
    }
    .glass-card {
      background: ${glass.plate};
      border: 1px solid ${glass.borderSoft};
      border-radius: ${radius.lg}px;
      box-shadow: inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft};
      -webkit-backdrop-filter: ${glass.blur};
      backdrop-filter: ${glass.blur};
    }
    .glass-row:hover {
      background: rgba(32,36,43,0.65) !important;
      box-shadow: inset 0 1px 0 ${glass.highlight};
    }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
    @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.3} 100%{transform:scale(1.5);opacity:0} }
    @keyframes breathe { 0%,100%{opacity:0.55} 50%{opacity:1} }
    @keyframes rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes shimmer { 0%{opacity:0.35} 50%{opacity:0.7} 100%{opacity:0.35} }
    @keyframes stationIn { from{opacity:0;transform:translateY(18px) scale(0.985)} to{opacity:1;transform:none} }
    @keyframes roomEnter { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
    @keyframes trackSwap { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
    @keyframes dialArc {
      from { stroke-dashoffset: 92; opacity: 0.55; }
      to { stroke-dashoffset: 28; opacity: 1; }
    }
    @keyframes markIn {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: none; }
    }
    @keyframes screenIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
    @keyframes dockRise {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: none; }
    }
    @keyframes planetRing {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes planetTiltSpin {
      from { transform: rotateX(66deg) rotateZ(0deg); }
      to { transform: rotateX(66deg) rotateZ(360deg); }
    }
    @keyframes planetBreathe {
      0%, 100% { transform: scale(1); opacity: 0.92; }
      50% { transform: scale(1.03); opacity: 1; }
    }
    @keyframes stagePlanetBreathe {
      0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.92; }
      50% { transform: translate(-50%, -50%) scale(1.035); opacity: 1; }
    }
    @keyframes brandLockupBreathe {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 12px 28px rgba(26,29,36,0.18)); }
      50% { transform: scale(1.028); filter: drop-shadow(0 16px 36px rgba(26,29,36,0.22)); }
    }
    @keyframes stageBloom {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 0.9; }
    }
    @keyframes stageLiveDot {
      0%, 100% { opacity: 0.45; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    @keyframes orbitPulse {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 1; }
    }
    @keyframes playGlow {
      0%, 100% { box-shadow: 0 4px 14px rgba(22,24,30,0.2), 0 1px 0 rgba(30,34,41,0.6) inset; }
      50% { box-shadow: 0 6px 18px rgba(255,255,255,0.2), 0 1px 0 rgba(32,36,43,0.65) inset; }
    }
    @keyframes coverFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    @keyframes coverSettle {
      0% { transform: translateY(6px) scale(0.985); opacity: 0.88; }
      55% { transform: translateY(-3px) scale(1.01); opacity: 1; }
      100% { transform: none; opacity: 1; }
    }
    @keyframes energyPillLife {
      0% { opacity:0; transform:translateY(8px) scale(0.96) }
      14% { opacity:1; transform:none }
      78% { opacity:1; transform:none }
      100% { opacity:0; transform:translateY(-4px) }
    }
    @keyframes energyPillIn { from{opacity:0;transform:translateY(6px) scale(0.94)} to{opacity:1;transform:none} }
    @keyframes energyMenuIn { from{opacity:0;transform:translateX(-50%) translateY(6px) scale(0.95)} to{opacity:1;transform:translateX(-50%)} }
    @keyframes energyModeIn {
      from { opacity: 0; transform: translateY(6px) scale(0.94); }
      to { opacity: 1; transform: none; }
    }
    @keyframes mixArcPulse {
      0%, 100% { opacity: 0.55; stroke-dashoffset: 0; }
      50% { opacity: 1; }
    }
    @keyframes mixSeqDot {
      0%, 100% { opacity: 0.35; transform: scale(0.85); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    @keyframes shelfReveal {
      from { opacity: 0; transform: translateY(10px) scale(0.985); }
      to { opacity: 1; transform: none; }
    }
    @keyframes stationTicker {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    @keyframes stationLowerIn {
      from { opacity: 0; transform: translateY(14px) scale(0.985); }
      to { opacity: 1; transform: none; }
    }
    @keyframes stationBar {
      from { height: 10px; }
      to { height: 48px; }
    }
    @keyframes stationBurst {
      0% { opacity: 0; transform: translateX(-50%) scale(0.4) translateY(8px); }
      35% { opacity: 1; transform: translateX(-50%) scale(1.15) translateY(-6px); }
      100% { opacity: 0; transform: translateX(-50%) scale(1.4) translateY(-28px); }
    }
    @keyframes channelBugIn {
      from { opacity: 0; transform: translateX(10px) scale(0.96); }
      to { opacity: 1; transform: none; }
    }
    @keyframes channelZap {
      0% { filter: brightness(1); transform: scale(1); }
      35% { filter: brightness(1.45) contrast(1.15); transform: scale(0.97); }
      70% { filter: brightness(0.85); transform: scale(1.02); }
      100% { filter: none; transform: none; }
    }
    @keyframes stationBumperIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes likePop {
      0% { transform: scale(1); }
      40% { transform: scale(1.28); }
      100% { transform: scale(1); }
    }
    @keyframes flaskShake {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      18% { transform: rotate(-7deg) translateY(0.5px); }
      36% { transform: rotate(6deg) translateY(-0.5px); }
      54% { transform: rotate(-4deg) translateY(0.25px); }
      72% { transform: rotate(3deg); }
      88% { transform: rotate(-1.5deg); }
    }
    @keyframes flaskBubbleRise {
      0% { transform: translateY(0) scale(0.65); opacity: 0; }
      18% { opacity: 0.95; }
      100% { transform: translateY(-8px) scale(1.05); opacity: 0; }
    }
    @keyframes flaskSteamRise {
      0% { transform: translateY(0) scaleX(0.85); opacity: 0; }
      28% { opacity: 0.7; }
      100% { transform: translateY(-9px) scaleX(1.35); opacity: 0; }
    }
    .flask-taste-btn {
      position: relative;
      overflow: visible;
    }
    .flask-taste-btn.is-labeled {
      overflow: hidden;
    }
    .flask-taste-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 22px rgba(26,29,36,0.16) !important;
    }
    .flask-taste-btn:active:not(:disabled) {
      transform: translateY(0) scale(0.97);
    }
    .flask-taste-btn:hover:not(:disabled) .flask-taste-mark {
      animation: flaskShake 0.58s cubic-bezier(0.36, 0.07, 0.19, 0.97);
      transform-origin: 50% 78%;
    }
    .flask-taste-btn .flask-bubble {
      transform-box: fill-box;
      transform-origin: center;
      animation: flaskBubbleRise 2.4s ease-in-out infinite;
      animation-play-state: paused;
    }
    .flask-taste-btn .flask-bubble-a { animation-delay: 0s; }
    .flask-taste-btn .flask-bubble-b { animation-delay: 0.55s; }
    .flask-taste-btn .flask-bubble-c { animation-delay: 1.1s; }
    .flask-taste-btn .flask-steam {
      transform-box: fill-box;
      transform-origin: center bottom;
      animation: flaskSteamRise 2.1s ease-out infinite;
      animation-play-state: paused;
    }
    .flask-taste-btn .flask-steam-a { animation-delay: 0s; }
    .flask-taste-btn .flask-steam-b { animation-delay: 0.45s; }
    .flask-taste-btn .flask-steam-c { animation-delay: 0.9s; }
    .flask-taste-btn:hover:not(:disabled) .flask-bubble,
    .flask-taste-btn:hover:not(:disabled) .flask-steam,
    .flask-taste-btn.is-active .flask-bubble,
    .flask-taste-btn.is-active .flask-steam,
    .energy-shift-flask:hover:not(:disabled) .flask-bubble,
    .energy-shift-flask:hover:not(:disabled) .flask-steam,
    .energy-shift-flask.is-active .flask-bubble,
    .energy-shift-flask.is-active .flask-steam {
      animation-play-state: running;
    }
    .flask-taste-btn.is-active .flask-bubble,
    .flask-taste-btn.is-active .flask-steam,
    .energy-shift-flask.is-active .flask-bubble,
    .energy-shift-flask.is-active .flask-steam {
      animation-duration: 1.55s;
    }
    .sr-only {
      position: absolute; width: 1px; height: 1px;
      padding: 0; margin: -1px; overflow: hidden;
      clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
    }
    /* Mini-dock: hide secondary controls on narrow phones so targets stay big */
    @media (max-width: 430px) {
      .dock-xtra { display: none !important; }
    }
    .glass-dock {
      background: ${glass.fillHeavy};
      border: 1px solid ${glass.borderSoft};
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
      -webkit-backdrop-filter: ${glass.blurHeavy};
      backdrop-filter: ${glass.blurHeavy};
      transition: background 0.6s ease, box-shadow 0.35s ease;
    }
    /* ── Music.app chrome ─────────────────────────────────────────────── */
    .pill-nav {
      background: ${glass.fillHeavy};
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
      -webkit-backdrop-filter: ${glass.blurHeavy};
      backdrop-filter: ${glass.blurHeavy};
    }
    .pmp-hero-bezel {
      box-shadow: 0 12px 36px rgba(0,0,0,0.32);
    }
    .pmp-home-mtv::before { display: none; }
    .pmp-home-mtv > * { position: relative; z-index: 1; }
    /* Kill leftover Local gold bloom from older builds. No halo, no pulse. */
    @keyframes pmpGoldGlow {
      0%, 100% { opacity: 0; }
      50% { opacity: 0; }
    }
    .pmp-channel-card--gold,
    .pmp-channel-card--featured {
      filter: none !important;
    }
    .pmp-channel-card-frame,
    .pmp-channel-card--gold .pmp-channel-card-frame,
    .pmp-channel-card--featured .pmp-channel-card-frame {
      overflow: hidden !important;
      filter: none !important;
    }
    .pmp-channel-card-frame::before,
    .pmp-channel-card-frame::after,
    .pmp-channel-card--gold .pmp-channel-card-frame::before,
    .pmp-channel-card--gold .pmp-channel-card-frame::after,
    .pmp-channel-card--featured .pmp-channel-card-frame::before,
    .pmp-channel-card--featured .pmp-channel-card-frame::after {
      content: none !important;
      display: none !important;
      animation: none !important;
      background: none !important;
      box-shadow: none !important;
      filter: none !important;
    }
    .pmp-ticker-track {
      animation: stationTicker 22s linear infinite;
    }
    .pmp-lift {
      transition: transform ${motion.settle} ${motion.ease}, box-shadow ${motion.settle} ${motion.ease}, border-color ${motion.base} ${motion.ease};
    }
    .pmp-lift:hover { transform: translateY(-2px); }
    .pmp-lift:active { transform: translateY(0) scale(0.985); opacity: 1; }
    .pmp-press { transition: transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}, background ${motion.base}; }
    .pmp-press:active { transform: scale(0.94); opacity: 1; }
    .pmp-live-led {
      animation: stageLiveDot 1.45s ease-in-out infinite;
    }
    .pmp-tune-key {
      transition:
        transform ${motion.fast} ${motion.ease},
        box-shadow ${motion.base} ${motion.ease},
        border-color ${motion.base},
        background ${motion.base},
        color ${motion.fast};
    }
    .pmp-tune-key:hover {
      filter: brightness(1.06);
      box-shadow: 0 6px 16px rgba(0,0,0,0.28) !important;
    }
    .pmp-tune-key:active {
      transform: scale(0.97);
      filter: none;
      box-shadow: none !important;
    }
    .pmp-tune-key--locked:hover {
      box-shadow: 0 6px 16px rgba(0,0,0,0.28) !important;
    }
    .pmp-schedule-cell:hover {
      border-color: rgba(255,255,255,0.16) !important;
      box-shadow: 0 6px 16px rgba(0,0,0,0.28) !important;
    }
    .pmp-dial-cell:hover {
      color: #F7F8FA;
    }
    .pmp-dial-cell:hover > div:nth-child(2),
    .pmp-dial-cell:hover > div:nth-child(3) {
      opacity: 1;
    }
    .pmp-dial-cell:active {
      transform: none;
      opacity: 0.88;
    }
    .pmp-tonight-stage {
      animation: rise 0.55s ${motion.ease} 0.04s both;
    }
    .pmp-radio-module {
      transition: box-shadow ${motion.settle} ${motion.ease}, border-color ${motion.base};
    }
    .pmp-hero .pmp-hero-art { transition: transform 1.2s ${motion.ease}; }
    .pmp-hero:hover .pmp-hero-sleeve { transform: translateY(-2px); }
    .pmp-hero:hover .pmp-hero-art { transform: scale(1.04); }
    .pmp-hero-sleeve { transition: transform 0.45s ${motion.ease}; }
    .pmp-view-all { transition: color ${motion.fast} ${motion.ease}, transform ${motion.fast} ${motion.ease}; }
    .pmp-view-all:hover { color: #64B5FF !important; transform: none; }
    .pmp-rail { cursor: grab; }
    .pmp-rail:active { cursor: grabbing; }
    @media (prefers-reduced-transparency: reduce) {
      .pill-nav {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        background: ${color.surfaceSolid} !important;
      }
    }
    .nav-rail-btn {
      transition: background ${motion.base} ${motion.ease}, color ${motion.base} ${motion.ease}, transform ${motion.fast};
    }
    .nav-rail-btn:hover {
      background: rgba(255,255,255,0.08) !important;
      color: ${color.ink} !important;
    }
    .custom-mix {
      transition:
        background ${motion.base} ${motion.ease},
        border-color ${motion.base} ${motion.ease},
        transform ${motion.fast} ${motion.ease},
        box-shadow ${motion.base} ${motion.ease};
    }
    .custom-mix:hover {
      background: rgba(48,53,62,0.9) !important;
      border-color: rgba(255,255,255,0.14) !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.12),
        0 16px 40px rgba(0,0,0,0.45) !important;
      transform: translateY(-1px);
    }
    .custom-mix:hover .custom-mix-play {
      transform: scale(1.04);
      box-shadow: 0 8px 20px rgba(0,0,0,0.4) !important;
    }
    .custom-mix:active {
      transform: scale(0.992);
    }
    .custom-mix-play {
      transition: transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base} ${motion.ease};
    }
    .sidebar-queue-row {
      transition: background ${motion.base} ${motion.ease};
    }
    .sidebar-queue-row:hover {
      background: ${color.select} !important;
    }
    .sidebar-queue-row:hover .sidebar-queue-actions {
      opacity: 1 !important;
    }
    .sidebar-ghost-btn {
      transition: color ${motion.fast} ${motion.ease}, opacity ${motion.fast};
    }
    .sidebar-ghost-btn:hover {
      color: ${color.ink} !important;
      opacity: 1 !important;
    }
    .track-row:hover {
      background: ${color.select} !important;
      border-color: ${glass.border} !important;
    }
    .cover-tile {
      transition: transform ${motion.settle} ${motion.ease}, box-shadow ${motion.settle} ${motion.ease};
    }
    .cover-tile:hover {
      transform: translateY(-3px);
    }
    .cover-flow-stage .cover-tile:hover {
      transform: none;
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
    }
    @media (prefers-reduced-transparency: reduce) {
      .glass-surface, .glass-control, .glass-dock {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        background: ${color.surfaceSolid} !important;
      }
    }
  `;
};
injectStyles();

export default function App() {
  // ── Auth (login/signup/logout + user profile) ───────────────────────────
  const { firebaseUser, profile, setProfile, loading: authLoading, authError, clearAuthError, signUp, logIn, logOut, refreshProfile, signInWithGoogle, sendPhoneOTP, verifyPhoneOTP, resetPassword } = useAuth();
  const profileTaste = useMemo(
    () => tasteFromProfile(profile || {}),
    [
      profile?.genres,
      profile?.adventurous,
      profile?.depth,
      profile?.channelIds,
      profile?.artistNames,
      profile?.energyBand,
      profile?.vibe,
      profile?.seedChannelId,
    ]
  );
  const tasteColdStart = isColdStartTaste(profileTaste, {
    recentTrackIds: (profile?.recentTracks || []).map((r) => r.trackId || r.id),
    likedCount: (profile?.likedTracks || []).length,
  });
  const [billingRefreshing, setBillingRefreshing] = useState(false);
  const billingSettleKeyRef = useRef("");

  // ── URL ↔ screen ─────────────────────────────────────────────────────────
  const navigate = useNavigate();
  const location = useLocation();
  const { screen, artistSlug, albumSlug, mixId, stackId } = parsePath(location.pathname);
  const setScreen = useCallback((id, param = null) => {
    navigate(buildPath(id, param));
  }, [navigate]);
  const openArtist = useCallback((nameOrSlug) => {
    navigate(buildPath("artist", { artistSlug: slugify(nameOrSlug) }));
  }, [navigate]);
  const openAlbum = useCallback((trackOrSlug) => {
    if (typeof trackOrSlug === "string") {
      navigate(buildPath("album", { albumSlug: trackOrSlug }));
      return;
    }
    const artist = trackOrSlug?.artist || "Unknown";
    const album = trackOrSlug?.album || "Singles & Unknown";
    navigate(buildPath("album", { albumSlug: `${slugify(artist)}__${slugify(album)}` }));
  }, [navigate]);
  const openMix = useCallback((id) => {
    if (!id) return;
    navigate(buildPath("mix", { mixId: id }));
  }, [navigate]);
  const openStack = useCallback((id) => {
    if (!id) return;
    navigate(buildPath("stack", { stackId: id }));
  }, [navigate]);
  const closeStack = useCallback(() => {
    navigate(buildPath("favorites"));
  }, [navigate]);
  /** History-aware back — prefer in-app history, else Explore (Search is no longer a tab). */
  const goBack = useCallback(() => {
    if (location.key && location.key !== "default") {
      navigate(-1);
      return;
    }
    navigate(buildPath("explore"));
  }, [navigate, location.key]);

  // Retired surfaces → Home
  useEffect(() => {
    if (screen === "drift" || screen === "rooms" || screen === "paths" || screen === "map") {
      setScreen("home");
    }
  }, [screen, setScreen]);

  // ── App state ────────────────────────────────────────────────────────────
  const [tracks, setTracks]           = useState([]);          // loaded from Firestore
  const trackById = useMemo(() => {
    const m = new Map();
    for (const t of tracks) m.set(t.id, t);
    return m;
  }, [tracks]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [tracksLoadError, setTracksLoadError] = useState(null);
  // currentTrack / isPlaying live in playerTransportStore.
  // Screens subscribe themselves; App keeps the track for shell chrome and media helpers.
  const currentRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentTrack = useCurrentTrack();
  const currentTrackId = useTransportTrackId();
  const setCurrent = useCallback((trackOrUpdater) => {
    const track = typeof trackOrUpdater === "function"
      ? trackOrUpdater(currentRef.current)
      : trackOrUpdater;
    currentRef.current = track || null;
    transportFlags.setTrack(track || null);
  }, []);
  const setIsPlaying = useCallback((v) => {
    const next = typeof v === "function" ? v(!!isPlayingRef.current) : v;
    isPlayingRef.current = !!next;
    transportFlags.setPlaying(!!next);
  }, []);
  // progress/duration live in playerPlaybackStore — transport UI subscribes
  const setProgress = playbackClock.setProgress;
  const setDuration = playbackClock.setDuration;
  // Repeat: "off" | "all" | "one" · Shuffle: boolean
  const [repeat, setRepeat]           = useState("off");
  const [shuffle, setShuffle]         = useState(false);
  const [crossfadeOn, setCrossfadeOn] = useState(() => {
    try { return localStorage.getItem(`${brandStoragePrefix()}.crossfade`) !== "off"; }
    catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem(`${brandStoragePrefix()}.crossfade`, crossfadeOn ? "on" : "off"); }
    catch { /* ignore */ }
  }, [crossfadeOn]);
  const [queue, setQueue]             = useState([]);
  const [isRadioMode, setIsRadioMode] = useState(false);
  const [searchQuery, setSearch]      = useState("");
  const [adminTab, setAdminTab]       = useState("tracks");
  const [editTrack, setEditTrack]     = useState(null);
  const [toast, setToast]             = useState(null);
  const [immersive, setImmersive]     = useState(false);
  const audioRef                      = useRef(null); // the real HTML5 audio element
  // ── Desktop detection (must be before any early returns) ─────────────────
  const [isDesktop, setIsDesktop]     = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  const [userPlaylists, setUserPlaylists] = useState([]); // [{id, name, trackIds:[]}]
  const [communityMix, setCommunityMix] = useState(null);
  const [activeMix, setActiveMix] = useState(null);
  const [mixLoading, setMixLoading] = useState(false);
  const [showRouteBuilder, setShowRouteBuilder] = useState(false);
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [homeStageVisible, setHomeStageVisible] = useState(true);
  const onHomeStageVisibilityChange = useCallback((visible) => {
    setHomeStageVisible(!!visible);
  }, []);
  const [homeChatReady, setHomeChatReady] = useState(false);
  useEffect(() => runAfterPaint(() => setHomeChatReady(true)), []);
  useEffect(() => {
    if (screen !== "home") setHomeStageVisible(true);
  }, [screen]);
  const [afterglow, setAfterglow] = useState(null);
  const [resonanceTrack, setResonanceTrack] = useState(null); // Hypno Vision source
  const [sessionMeta, setSessionMeta] = useState(null); // { tracks, startTime, kind, label }
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(() => {
    try {
      const v = parseFloat(localStorage.getItem(`${brandStoragePrefix()}.volume`));
      return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1;
    } catch { return 1; }
  });
  useEffect(() => {
    try { localStorage.setItem(`${brandStoragePrefix()}.volume`, String(volume)); }
    catch { /* ignore */ }
  }, [volume]);
  const lastAudibleVolumeRef = useRef(1);
  useEffect(() => { if (volume > 0) lastAudibleVolumeRef.current = volume; }, [volume]);
  // ── Connectivity + buffering awareness ────────────────────────────────────
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);
  // Buffering lives in transport store — ambient pill subscribes; App only writes.
  // ── Recent searches (local only) ──────────────────────────────────────────
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(`${brandStoragePrefix()}.recentSearches`) || "[]");
      return Array.isArray(raw) ? raw.filter((s) => typeof s === "string").slice(0, 8) : [];
    } catch { return []; }
  });
  const recordRecentSearch = useCallback((q) => {
    const clean = String(q || "").trim();
    if (clean.length < 2) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try { localStorage.setItem(`${brandStoragePrefix()}.recentSearches`, JSON.stringify(next)); }
      catch { /* ignore */ }
      return next;
    });
  }, []);
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try { localStorage.removeItem(`${brandStoragePrefix()}.recentSearches`); }
    catch { /* ignore */ }
  }, []);
  const [hypnoSeed, setHypnoSeed] = useState(null); // pocket-mode seed track
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [featureTourDismissed, setFeatureTourDismissed] = useState(false);
  const [featureTourReplay, setFeatureTourReplay] = useState(false);
  const [pendingTune, setPendingTune] = useState(null);
  const [listeningRoom, setListeningRoom] = useState(null);
  const [linerTrack, setLinerTrack] = useState(null);
  const [purchasingTrackId, setPurchasingTrackId] = useState(null);
  const [showDedicate, setShowDedicate] = useState(false);
  const [activeShowId, setActiveShowId] = useState(null); // tuned VJ block
  const [activeSceneChannelId, setActiveSceneChannelId] = useState(null);
  const [stationBumper, setStationBumper] = useState(null);
  const lastBumperTrackRef = useRef(null);
  const lastBumperAtRef = useRef(0);
  // Clock mix lane follows the time of day in the background.
  // Genre focus (from Search) is the only manual listen filter; taste prefs drive 95/5.
  const [mixLane, setMixLane] = useState(() => mixLaneForDate().id);
  const [listenFocus, setListenFocus] = useState({ genre: null, scene: null });
  const [showGenreTaste, setShowGenreTaste] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [sessionInitialActivity, setSessionInitialActivity] = useState(null);
  const openCustomMix = useCallback(() => {
    setSessionInitialActivity(vibeForMixLane(mixLane));
    setShowRouteBuilder(true);
    setShowNavDrawer(false);
  }, [mixLane]);
  useEffect(() => {
    const sync = () => {
      const next = mixLaneForDate().id;
      setMixLane((prev) => (prev === next ? prev : next));
    };
    sync();
    const id = setInterval(sync, 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const volumeRef = useRef(1);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  const activeListenIntent = useCallback((extra = {}) => createListenIntent({
    mixLane,
    genre: listenFocus.genre,
    scene: listenFocus.scene,
    ...extra,
  }), [mixLane, listenFocus.genre, listenFocus.scene]);

  const radioResolved = useCallback(() => resolveListenPool(
    tracks,
    activeListenIntent(),
    { requireAudio: true, applyMixLane: true }
  ), [tracks, activeListenIntent]);

  const activeShowIdRef = useRef(activeShowId);
  const activeSceneChannelIdRef = useRef(activeSceneChannelId);
  useEffect(() => { activeShowIdRef.current = activeShowId; }, [activeShowId]);
  useEffect(() => { activeSceneChannelIdRef.current = activeSceneChannelId; }, [activeSceneChannelId]);
  const playShowRef = useRef(null);

  const radioPool = useCallback(() => {
    const showId = activeShowIdRef.current;
    if (showId) {
      const show = getShowById(showId);
      if (show) {
        const pool = buildShowPool(tracks, show, { countdown: buildCountdown(tracks, 40) });
        if (pool.length) return pool;
      }
    }
    const sceneId = activeSceneChannelIdRef.current;
    if (sceneId) {
      const channel = getSceneChannel(sceneId);
      if (channel) {
        const pool = buildSceneChannelPool(tracks, channel);
        if (pool.length) return pool;
      }
    }
    return radioResolved().tracks;
  }, [tracks, radioResolved, activeSceneChannelId]);
  const mixLaneRef = useRef(mixLane);
  useEffect(() => { mixLaneRef.current = mixLane; }, [mixLane]);
  const listenFocusRef = useRef(listenFocus);
  useEffect(() => { listenFocusRef.current = listenFocus; }, [listenFocus]);

  // Hero preview — the track Listen will actually start (stable until pool changes)
  const [heroPreview, setHeroPreview] = useState(null);
  useEffect(() => {
    const pool = radioPool();
    if (!pool.length) { setHeroPreview(null); return; }
    setHeroPreview((prev) => {
      if (prev && pool.some((t) => t.id === prev.id)) return prev;
      return pickNextTrack(pool, null, recentlyPlayedRef.current, {
        preferredGenres: profileTaste.genres || [],
        taste: profileTaste,
        scopedPool: true,
        tasteBlend: !listenFocus.genre,
        coldStart: tasteColdStart,
        channelHit: (t) => trackHitsPreferredChannels(t, profileTaste.channelIds),
        dislikeTaste: normalizeDislikeTaste(profile?.dislikeTaste || emptyDislikeTaste()),
      }) || pool[0];
    });
  }, [radioPool, profileTaste, profile?.dislikeTaste, listenFocus.genre, tasteColdStart]);

  // ── Listening Memory — tracks recently played with timestamps ──
  const recentlyPlayedRef = useRef([]); // [{id, genre, energy, timestamp}]
  const playHistoryRef = useRef([]); // previous tracks for "prev" button
  const sessionStartRef = useRef(null);

  // Set arc for On Air floor (last 2 → now → next)
  const radioPickOpts = () => ({
    preferredGenres: profileTaste.genres || [],
    taste: profileTaste,
    signalState: signalFlags.getState(),
    seedTrack: hypnoSeed,
    scopedPool: true,
    tasteBlend: !listenFocus.genre,
    coldStart: tasteColdStart,
    channelHit: (t) => trackHitsPreferredChannels(t, profileTaste.channelIds),
    energyShift: playerEnergyStore.getState(),
    dislikeTaste: normalizeDislikeTaste(profile?.dislikeTaste || emptyDislikeTaste()),
  });
  const setPrev = isRadioMode && currentTrack
    ? playHistoryRef.current.filter(t => t && t.id !== currentTrack.id).slice(0, 2).reverse()
    : [];
  const setNext = useMemo(() => {
    const track = transportFlags.getState().track;
    if (!isRadioMode || !track) return null;
    return pickNextTrack(radioPool(), track, recentlyPlayedRef.current, radioPickOpts());
  }, [isRadioMode, currentTrackId, radioPool, hypnoSeed, listenFocus.genre, profileTaste, profile?.dislikeTaste, tasteColdStart]);

  function logTrackPlay(track) {
    const now = Date.now();
    if (!sessionStartRef.current) sessionStartRef.current = now;
    recentlyPlayedRef.current = [
      { id: track.id, genre: track.genre, energy: track.energy || 5, ts: now },
      ...recentlyPlayedRef.current
    ].slice(0, 100);
    // Advance the Energy Shift lawnmower sweep one step
    playerEnergyStore.onTrackPlayed(track);
    // Update Aura human state
    signalFlags.setSignal(computeHumanState(recentlyPlayedRef.current, sessionStartRef.current));
  }

  // Get genre of last N played tracks for momentum
  // Flush session to Firestore when session boundary detected
  const lastFlushRef = useRef(Date.now());
  function buildAfterglowPayload() {
    const start = sessionStartRef.current || sessionMeta?.startTime;
    if (!start) return null;
    let trackObjs = [];
    if (sessionMeta?.tracks?.length) {
      // Prefer the crafted session order, clipped to what was actually reached
      const playedIds = new Set(recentlyPlayedRef.current.filter(p => p.ts >= start).map(p => p.id));
      const reached = [];
      for (const t of sessionMeta.tracks) {
        reached.push(t);
        if (!playedIds.has(t.id) && t.id !== currentTrack?.id) break;
      }
      trackObjs = reached.length ? reached : sessionMeta.tracks;
    } else {
      const sessionPlays = recentlyPlayedRef.current.filter(p => p.ts >= start);
      trackObjs = sessionPlays
        .map(p => tracksRef.current.find(t => t.id === p.id))
        .filter(Boolean)
        .reverse();
    }
    if (trackObjs.length < 2) return null;
    return {
      tracks: trackObjs,
      durationMins: Math.max(1, Math.round((Date.now() - start) / 60000)),
      startTime: start,
    };
  }

  function endSessionWithAfterglow(showGlow = true) {
    const glow = showGlow ? buildAfterglowPayload() : null;
    flushSession();
    setSessionMeta(null);
    setHypnoSeed(null);
    if (glow) setAfterglow(glow);
  }

  function flushSession() {
    const plays = recentlyPlayedRef.current;
    const start = sessionStartRef.current;
    if (!start || plays.length < 3 || !firebaseUser) {
      sessionStartRef.current = null;
      return;
    }
    const sessionPlays = plays.filter(p => p.ts >= start);
    if (sessionPlays.length < 3) {
      sessionStartRef.current = null;
      return;
    }
    const genres = [...new Set(sessionPlays.map(p => p.genre).filter(Boolean))];
    const avgEnergy = Math.round(sessionPlays.reduce((s, p) => s + p.energy, 0) / sessionPlays.length * 10) / 10;
    const sessionData = {
      uid: firebaseUser.uid,
      startTime: new Date(start),
      endTime: new Date(),
      trackCount: sessionPlays.length,
      genres,
      avgEnergy,
      durationMins: Math.round((Date.now() - start) / 60000),
      trackIds: sessionPlays.map(p => p.id),
    };
    addDoc(collection(db, "sessions"), sessionData).catch(() => {});
    sessionStartRef.current = null;
    lastFlushRef.current = Date.now();
  }

  // Auto-flush: check on each play if >30min gap from previous play
  useEffect(() => {
    if (!recentlyPlayedRef.current.length) return;
    const latest = recentlyPlayedRef.current[0]?.ts;
    const prev = recentlyPlayedRef.current[1]?.ts;
    if (prev && latest && (latest - prev > 30 * 60 * 1000)) {
      if (sessionMeta) endSessionWithAfterglow(true);
      else flushSession();
    }
  }, [currentTrackId]);


  // Check if a track was played recently (within hours)

  useEffect(() => {
    let label = null;
    if (screen === "artist" && artistSlug) label = findArtist(tracks, artistSlug)?.name;
    if (screen === "album" && albumSlug) label = findAlbum(tracks, albumSlug)?.title;
    if (screen === "mix" && activeMix?.title) label = activeMix.title;
    if (stackId) {
      const stack = (userPlaylists || []).find((p) => p.id === stackId)
        || (communityMix && (communityMix.id === stackId || `community-${communityMix.id}` === stackId) ? communityMix : null);
      label = stack?.name || stack?.title || "Stack";
      document.title = documentTitleFor("stack", label);
      return;
    }
    document.title = documentTitleFor(screen, label);
  }, [screen, artistSlug, albumSlug, tracks, activeMix?.title, stackId, userPlaylists, communityMix]);

  // ── Load this month's Community Mix ──────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser) {
      setCommunityMix(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { doc: fdoc, getDoc: fget } = await import("firebase/firestore");
        const id = communityMixId(monthKey());
        const snap = await fget(fdoc(db, "mixes", id));
        if (cancelled) return;
        setCommunityMix(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (e) {
        if (!cancelled) setCommunityMix(null);
      }
    })();
    return () => { cancelled = true; };
  }, [firebaseUser?.uid]);

  // Deep-link mix detail
  useEffect(() => {
    if (screen !== "mix" || !mixId) {
      setActiveMix(null);
      setMixLoading(false);
      return;
    }
    let cancelled = false;
    setMixLoading(true);
    (async () => {
      try {
        if (communityMix && communityMix.id === mixId) {
          if (!cancelled) {
            setActiveMix(communityMix);
            setMixLoading(false);
          }
          return;
        }
        const { doc: fdoc, getDoc: fget } = await import("firebase/firestore");
        const snap = await fget(fdoc(db, "mixes", mixId));
        if (cancelled) return;
        setActiveMix(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch {
        if (!cancelled) setActiveMix(null);
      } finally {
        if (!cancelled) setMixLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [screen, mixId, communityMix]);

  // ── Anticipatory Queue — pre-generate when tracks load ──
  const anticipatoryBuilt = useRef(false);
  useEffect(() => {
    if (anticipatoryBuilt.current || !tracks.length || queue.length > 0 || currentTrack) return;
    anticipatoryBuilt.current = true;
    const hour = new Date().getHours();
    const [eMin, eMax] = getEnergyRangeForHour(hour);
    const singles = tracks.filter(t => (t.duration||0) <= 900);
    // Prefer liked tracks in the right energy range, then any in range, then random
    const liked = singles.filter(t => t.liked && (t.energy||5) >= eMin && (t.energy||5) <= eMax);
    const energyMatch = singles.filter(t => (t.energy||5) >= eMin && (t.energy||5) <= eMax);
    const pool = liked.length >= 4 ? liked : energyMatch.length >= 4 ? energyMatch : singles;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQueue(shuffled.slice(0, 8));
  }, [tracks]);
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2200); };
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // ── Catalog cache — IndexedDB first, localStorage fallback for warm starts ─
  const CATALOG_CACHE_KEY = `${brandStoragePrefix()}.catalogCache.v1`;
  const profileForLikesRef = useRef(null);
  useEffect(() => { profileForLikesRef.current = profile; }, [profile]);
  const applyLikedFlags = useCallback((list) => {
    const likedSet = new Set(profileForLikesRef.current?.likedTracks || []);
    const dislikedSet = new Set(profileForLikesRef.current?.dislikedTracks || []);
    return list.map((t) => ({
      ...t,
      liked: likedSet.has(t.id),
      disliked: dislikedSet.has(t.id),
    }));
  }, []);
  const readCatalogCacheSync = useCallback(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || "null");
      if (!Array.isArray(raw?.tracks) || !raw.tracks.length) return null;
      return { ts: Number(raw.ts) || 0, tracks: raw.tracks };
    } catch { return null; }
  }, [CATALOG_CACHE_KEY]);
  const writeCatalogCache = useCallback((list) => {
    writeCatalogIdb(CATALOG_CACHE_KEY, list);
    // Keep a tiny localStorage stub only when shelf is small enough (quota-safe).
    try {
      if (list.length <= 80) {
        localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ ts: Date.now(), tracks: list }));
      } else {
        localStorage.removeItem(CATALOG_CACHE_KEY);
      }
    } catch { /* quota or private mode — IDB is primary */ }
  }, [CATALOG_CACHE_KEY]);

  const catalogIdleStopRef = useRef(() => {});
  const reloadCatalogRef = useRef(null);
  const reloadCatalog = useCallback(async ({ background = false, full = false } = {}) => {
    if (!background) setTracksLoading(true);
    setTracksLoadError(null);
    try {
      if (!full && !background) {
        const lite = await fetchHomeLite(db);
        if (lite.tracks.length) {
          setTracks(applyLikedFlags(lite.tracks));
          setTracksLoading(false);
          // Full catalog waits until Home images have a beat. Do not IDB-cache the lite slice.
          catalogIdleStopRef.current();
          catalogIdleStopRef.current = runWhenIdle(() => {
            reloadCatalogRef.current?.({ background: true, full: true });
          }, { timeout: 1400 });
          return;
        }
      }
      const loaded = await fetchCatalogTracks(db);
      const liked = applyLikedFlags(loaded);
      if (background) {
        const hydrated = applyLikedFlags(await hydrateCatalogTracks(loaded));
        startTransition(() => setTracks(hydrated));
        writeCatalogCache(hydrated);
      } else {
        setTracks(liked);
        setTracksLoading(false);
        runAfterPaint(() => {
          hydrateCatalogTracks(loaded).then((enriched) => {
            const hydrated = applyLikedFlags(enriched);
            startTransition(() => setTracks(hydrated));
            writeCatalogCache(hydrated);
          });
        });
      }
    } catch (err) {
      console.error("Failed to load tracks:", err);
      if (!background) {
        setTracksLoadError("We couldn't reach the music catalog. Check your connection and try again.");
        showToast("Couldn't load tracks — tap Retry on Home");
      }
    }
    if (!background) setTracksLoading(false);
  }, [applyLikedFlags, writeCatalogCache]);
  reloadCatalogRef.current = reloadCatalog;

  // ── Load tracks once on mount — IDB/local cache instantly, refresh behind ──
  useEffect(() => {
    let cancelled = false;
    const stopHydrateRef = { current: () => {} };
    (async () => {
      const fromIdb = await readCatalogIdb(CATALOG_CACHE_KEY);
      const cached = fromIdb || readCatalogCacheSync();
      if (cancelled) return;
      if (cached) {
        const list = cached.tracks;
        setTracks(applyLikedFlags(list));
        setTracksLoading(false);
        const hydratedAlready = list[0] && Object.prototype.hasOwnProperty.call(list[0], "_scene");
        if (!hydratedAlready) {
          stopHydrateRef.current = runAfterPaint(() => {
            hydrateCatalogTracks(list).then((enriched) => {
              if (cancelled) return;
              setTracks(applyLikedFlags(enriched));
            });
          });
        }
        if (!isCatalogCacheFresh(cached)) {
          catalogIdleStopRef.current = runWhenIdle(
            () => reloadCatalog({ background: true, full: true }),
            { timeout: 1400 }
          );
        }
      } else {
        reloadCatalog();
      }
    })();
    return () => {
      cancelled = true;
      stopHydrateRef.current();
      catalogIdleStopRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Once profile loads, merge liked status + playlists into state ─────────
  useEffect(() => {
    if (!profile || !tracks.length) return;
    const likedSet = new Set(profile.likedTracks || []);
    const dislikedSet = new Set(profile.dislikedTracks || []);
    setTracks((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        const liked = likedSet.has(t.id);
        const disliked = dislikedSet.has(t.id);
        if (t.liked === liked && t.disliked === disliked) return t;
        changed = true;
        return {
          ...t,
          liked,
          disliked,
          _scene: t._scene,
          _scenes: t._scenes,
        };
      });
      return changed ? next : prev;
    });
    if (profile.playlists) setUserPlaylists(profile.playlists);
  }, [profile?.likedTracks, profile?.dislikedTracks, tracks.length]);

  // ── User object shaped like the rest of the app expects ─────────────────
  const user = {
    name:   profile?.displayName || "Listener",
    image:  profile?.profileImage || "",
    genres: profile?.genres || [],
    memberNumber: profile?.memberNumber,
    uid: profile?.uid || firebaseUser?.uid || "",
  };

  // Library playlists = user mixes + this month's Community Mix (everyone gets it)
  const libraryPlaylists = useMemo(() => {
    const stub = communityPlaylistStub(communityMix);
    const own = (userPlaylists || []).filter((p) => !isCommunityPlaylist(p));
    if (!stub) return own;
    return [stub, ...own.filter((p) => p.id !== stub.id)];
  }, [userPlaylists, communityMix]);
  const needsOnboarding = !!firebaseUser && profile && profile.onboarded === false && !onboardingDismissed && !tracksLoading;
  // Taste tuner first. Short feature tour only after taste is done/skipped, once per version.
  const needsFeatureTour =
    !!firebaseUser
    && profile
    && !needsOnboarding
    && !featureTourDismissed
    && shouldAutoShowFeatureTour(profile);
  const showFeatureTour = (needsFeatureTour || featureTourReplay) && !needsOnboarding;
  const isAdminUser = !!firebaseUser && firebaseUser.uid === ADMIN_UID;
  const access = useMemo(
    () => getAccessState(profile, { isAdmin: isAdminUser }),
    // Recompute when plan / credit fields change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      profile?.trialEndsAt,
      profile?.subscriptionStatus,
      profile?.plan,
      profile?.clubCreditBalance,
      profile?.clubCreditExpiresAt,
      isAdminUser,
    ]
  );
  const playsRemaining = useMemo(
    () => freePlaysRemaining(profile, access),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile?.playsToday, profile?.playsDayKey, access]
  );
  // Free is a real tier — never hard-block the app. Plans are an upgrade sheet.

  const handleSubscribe = useCallback(async (linkOrPlan, maybePlan) => {
    if (PRICING_COMING_SOON) {
      showToast("Not available yet.");
      return;
    }
    let plan = "club";
    if (typeof linkOrPlan === "string" && !linkOrPlan.startsWith("http")) {
      plan = linkOrPlan;
    } else if (maybePlan) {
      plan = maybePlan;
    }
    try {
      await startCheckout(plan);
    } catch (e) {
      showToast(e?.message || "Couldn’t start checkout");
    }
  }, []);

  const handleOpenPlans = useCallback(() => {
    if (!PAYWALL_ENABLED) return;
    setShowPlans(true);
  }, []);

  const handlePurchasePhysical = useCallback(async (track, amount) => {
    if (!track?.id) return;
    if (!PHYSICAL_COMMERCE_LIVE || PRICING_COMING_SOON) {
      showToast("Not available yet.");
      return;
    }
    if (!firebaseUser) {
      showToast("Sign in to buy with Club Credit");
      return;
    }
    const bal = usableCreditBalance(profile);
    if (bal <= 0) {
      showToast("Go Premium for Club Credit");
      if (PAYWALL_ENABLED) setShowPlans(true);
      return;
    }
    const price = amount != null
      ? Number(amount)
      : memberPrice(track.retailPrice, {
          member: !!access?.membershipCard,
          memberRetail: track.memberPrice,
        });
    if (!Number.isFinite(price) || price <= 0) {
      showToast("No price on this edition yet");
      return;
    }
    if (bal < price) {
      showToast(`Need $${price.toFixed(2)} Club Credit (you have $${bal.toFixed(2)})`);
      return;
    }
    setPurchasingTrackId(track.id);
    try {
      const data = await spendClubCredit(track.id, price);
      setProfile((p) => ({
        ...(p || {}),
        clubCreditBalance: data.clubCreditBalance,
        collection: data.collection || p?.collection,
        clubCreditSpends: [
          { trackId: track.id, amount: data.spent, at: new Date().toISOString() },
          ...((p?.clubCreditSpends) || []),
        ].slice(0, 50),
      }));
      showToast(`Filed to your collection · $${Number(data.spent).toFixed(2)}`);
      setLinerTrack(null);
    } catch (err) {
      const msg = err?.message || err?.code || "Purchase failed";
      showToast(String(msg).replace(/^Firebase:\s*/i, "").slice(0, 120));
      if (PAYWALL_ENABLED && /Premium|Club Credit/i.test(String(msg))) setShowPlans(true);
    } finally {
      setPurchasingTrackId(null);
    }
  }, [firebaseUser, profile, access?.membershipCard]);

  // After Stripe redirect (?billing=success), confirm session + refresh membership
  useEffect(() => {
    if (!firebaseUser || !profile) return;
    if (typeof window === "undefined") return;
    const search = window.location.search || "";
    if (!/[?&]billing=success\b/.test(search)) return;
    if (billingSettleKeyRef.current === search) return;
    billingSettleKeyRef.current = search;
    let cancelled = false;
    (async () => {
      const result = await settleBillingReturn({
        search,
        refreshProfile,
      });
      if (cancelled) return;
      if (result.applied) {
        showToast(result.plan === "premium" ? "Premium unlocked" : "Club unlocked");
        setShowPlans(false);
      } else if (result.pending && PAYWALL_ENABLED) {
        showToast("Payment received — tap “I’ve paid — refresh” if Club isn’t unlocked yet");
        setShowPlans(true);
      }
      try {
        window.history.replaceState({}, "", stripBillingQuery(window.location.href));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, profile?.uid, refreshProfile]);

  const handleBillingRefresh = useCallback(async () => {
    setBillingRefreshing(true);
    try {
      const next = await refreshProfile();
      const nextAccess = getAccessState(next, { isAdmin: isAdminUser });
      if (nextAccess?.tier === "club" || nextAccess?.tier === "premium" || nextAccess?.reason === "trial") {
        setShowPlans(false);
        showToast(nextAccess.tier === "premium" ? "Premium unlocked" : "Club unlocked");
      }
    } finally {
      setBillingRefreshing(false);
    }
  }, [refreshProfile, isAdminUser]);

  // Genre + taste intake — stations / faces / this-or-that compile into the user doc
  const finishOnboarding = async (tasteOrGenres = []) => {
    const compiled = Array.isArray(tasteOrGenres)
      ? tasteFromProfile({ genres: tasteOrGenres })
      : tasteOrGenres?.skip
        ? compileOnboardingTaste({ skip: true })
        : tasteFromProfile(tasteOrGenres || {});
    const taste = compiled;
    const genres = Array.isArray(taste.genres) ? taste.genres : [];
    try {
      await completeOnboarding({
        homeRooms: [],
        genres,
        adventurous: taste.adventurous,
        depth: taste.depth,
        channelIds: taste.channelIds,
        artistNames: taste.artistNames,
        energyBand: taste.energyBand,
        vibe: taste.vibe,
        seedChannelId: taste.seedChannelId,
        onboardingVersion: 2,
      });
      setProfile((p) => ({
        ...(p || {}),
        onboarded: true,
        homeRooms: [],
        genres,
        adventurous: taste.adventurous,
        depth: taste.depth,
        channelIds: taste.channelIds,
        artistNames: taste.artistNames,
        energyBand: taste.energyBand,
        vibe: taste.vibe,
        seedChannelId: taste.seedChannelId,
        onboardingVersion: 2,
      }));
    } catch (e) { /* local dismiss still */ }
    if (taste.seedChannelId) setPendingTune(taste.seedChannelId);
    setOnboardingDismissed(true);
  };

  const finishFeatureTour = async () => {
    const payload = featureGuideSeenPayload();
    try {
      await saveFeatureGuideSeen(payload);
      setProfile((p) => ({ ...(p || {}), ...payload }));
    } catch {
      setProfile((p) => ({ ...(p || {}), ...payload }));
    }
    setFeatureTourDismissed(true);
    setFeatureTourReplay(false);
  };

  // ── Crossfade audio engine ───────────────────────────────────────────────
  // Two audio elements — A and B. We alternate between them for crossfade.
  // audioRef = currently playing, nextAudioRef = the one fading in.
  const nextAudioRef   = useRef(null);
  const crossfadeRef   = useRef(null); // interval for the crossfade ramp
  const isCrossfading  = useRef(false);
  const audioUnlockedRef = useRef(false);
  const unlockingRef = useRef(false);
  /** Locked next cut for preload → crossfade (avoids re-rolling radio picks). */
  const pendingNextRef = useRef(null); // { track, url }
  const crossfadeReadyWaitRef = useRef(null);
  const RADIO_CROSSFADE_SECS = 15; // long, on-air blend
  const QUEUE_CROSSFADE_SECS = 6;  // tighter blend for playlists / sessions
  // Tiny silent WAV — unlocks the inactive A/B element under iOS autoplay rules
  const SILENT_WAV =
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

  const configureAudioElement = (el) => {
    if (!el) return;
    try {
      el.playsInline = true;
      el.setAttribute("playsinline", "true");
      el.setAttribute("webkit-playsinline", "true");
      el.preload = "auto";
    } catch { /* ignore */ }
  };

  /** Must run inside a user gesture so both A/B elements can play later (crossfade). */
  const unlockAudioElements = () => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    unlockingRef.current = true;
    const els = [audioRef.current, nextAudioRef.current].filter(Boolean);
    let pending = els.length;
    const markDone = () => {
      pending -= 1;
      if (pending <= 0) unlockingRef.current = false;
    };
    if (!pending) {
      unlockingRef.current = false;
      return;
    }
    els.forEach((el) => {
      try {
        configureAudioElement(el);
        const existing = el.getAttribute("src") || "";
        if (!existing) el.src = SILENT_WAV;
        const wasMuted = el.muted;
        el.muted = true;
        const p = el.play();
        const finish = () => {
          finishAudioUnlock(el, { wasMuted });
          markDone();
        };
        if (p && typeof p.then === "function") {
          p.then(finish).catch(finish);
        } else {
          finish();
        }
      } catch {
        markDone();
      }
    });
  };

  // Keep a ref to isRadioMode so audio listeners can read the latest value
  const isRadioModeRef = useRef(false);
  useEffect(() => { isRadioModeRef.current = isRadioMode; }, [isRadioMode]);

  // Refs so audio listeners (bound once) always see current playback state
  const tracksRef      = useRef([]);
  const queueRef       = useRef([]);
  const repeatRef      = useRef("off");
  const shuffleRef     = useRef(false);
  const crossfadeOnRef = useRef(true);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { crossfadeOnRef.current = crossfadeOn; }, [crossfadeOn]);

  const handleSkipRef = useRef(null);
  const startCrossfadeRef = useRef(null);
  const primaryAudioCleanupRef = useRef(() => {});

  const pickCrossfadeNext = useCallback(() => {
    const radio = isRadioModeRef.current;
    if (radio) {
      const focus = listenFocusRef.current || {};
      const pool = resolveListenPool(
        tracksRef.current,
        { mixLane: mixLaneRef.current, genre: focus.genre, scene: focus.scene },
        { requireAudio: true, applyMixLane: true }
      ).tracks;
      const library = pool.length
        ? pool
        : tracksRef.current.filter((t) => (t.duration || 0) <= 900 && String(t.audioUrl || "").trim());
      return pickNextTrack(library, currentRef.current, recentlyPlayedRef.current, {
        preferredGenres: profileTaste.genres || [],
        taste: profileTaste,
        signalState: signalFlags.getState(),
        seedTrack: hypnoSeed,
        scopedPool: true,
        tasteBlend: !(listenFocusRef.current?.genre),
        coldStart: tasteColdStart,
        channelHit: (t) => trackHitsPreferredChannels(t, profileTaste.channelIds),
        energyShift: playerEnergyStore.getState(),
        dislikeTaste: normalizeDislikeTaste(profile?.dislikeTaste || emptyDislikeTaste()),
      });
    }
    const q = queueRef.current;
    if (!q.length) return null;
    return shuffleRef.current
      ? q[Math.floor(Math.random() * q.length)]
      : q[0];
  }, [profileTaste, profile?.dislikeTaste, hypnoSeed, tasteColdStart]);

  const preloadNextAudio = useCallback((track) => {
    if (!track?.audioUrl || isCrossfading.current) return;
    const fadeIn = nextAudioRef.current;
    if (!fadeIn) return;
    const url = String(track.audioUrl).trim();
    if (!url) return;
    const currentSrc = fadeIn.getAttribute("src") || "";
    if (pendingNextRef.current?.url === url && currentSrc === url) return;
    pendingNextRef.current = { track, url };
    try {
      fadeIn.pause();
    } catch { /* ignore */ }
    fadeIn.volume = 0;
    if (currentSrc !== url) {
      fadeIn.src = url;
      try { fadeIn.load(); } catch { /* ignore */ }
    }
  }, []);

  const bindPrimaryAudio = useCallback((audio) => {
    primaryAudioCleanupRef.current?.();

    const onTimeUpdate = () => {
      setProgress(Math.floor(audio.currentTime));
      if (audio.currentTime > 0 && !audio.paused) transportFlags.setBuffering(false);
      if (!audio.duration || isCrossfading.current) return;
      const radio = isRadioModeRef.current;
      const wantsQueueFade = !radio
        && crossfadeOnRef.current
        && repeatRef.current !== "one"
        && queueRef.current.length > 0;
      if (!radio && !wantsQueueFade) return;
      const fadeSecs = radio ? RADIO_CROSSFADE_SECS : QUEUE_CROSSFADE_SECS;
      const remaining = audio.duration - audio.currentTime;
      // Kick preload ~20s before the blend so the inactive element is warm
      if (remaining <= fadeSecs + 20 && remaining > fadeSecs) {
        if (!pendingNextRef.current?.url) {
          const candidate = pickCrossfadeNext();
          if (candidate) preloadNextAudio(candidate);
        }
      }
      if (remaining <= fadeSecs && remaining > 0) {
        startCrossfadeRef.current?.();
      }
    };

    const onLoadedMetadata = () => {
      setDuration(Math.floor(audio.duration || 0));
    };

    const onEnded = () => {
      if (isRadioModeRef.current) return;
      if (repeatRef.current === "one") {
        audio.currentTime = 0;
        setProgress(0);
        audio.play().catch(() => {});
        return;
      }
      handleSkipRef.current?.();
    };

    // Keep UI in sync when iOS interrupts (call, Siri, Control Center, route change)
    const onPause = () => {
      if (isCrossfading.current) return;
      const src = audio.getAttribute("src") || audio.src || "";
      if (shouldIgnoreUnlockTransportEvent({ unlocking: unlockingRef.current, src })) return;
      if (isPlayingRef.current) setIsPlaying(false);
    };
    const onPlay = () => {
      if (isCrossfading.current) return;
      const src = audio.getAttribute("src") || audio.src || "";
      if (shouldIgnoreUnlockTransportEvent({ unlocking: unlockingRef.current, src })) return;
      if (!isPlayingRef.current) setIsPlaying(true);
    };

    // Buffering + failure feedback — a stalled player should never look frozen
    const onWaiting = () => transportFlags.setBuffering(true);
    const onPlayingAgain = () => transportFlags.setBuffering(false);
    const onError = () => {
      const src = audio.getAttribute("src") || "";
      if (!src || src.startsWith("data:audio")) return; // unlock stub — not a real failure
      transportFlags.setBuffering(false);
      const failed = currentRef.current;
      showToastRef.current?.(failed?.title ? `Couldn’t play “${failed.title}” — skipping` : "Couldn’t play that cut — skipping");
      setTimeout(() => { if (isPlayingRef.current) handleSkipRef.current?.(); }, 600);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlayingAgain);
    audio.addEventListener("canplay", onPlayingAgain);
    audio.addEventListener("error", onError);

    primaryAudioCleanupRef.current = () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlayingAgain);
      audio.removeEventListener("canplay", onPlayingAgain);
      audio.removeEventListener("error", onError);
    };
  }, [pickCrossfadeNext, preloadNextAudio]);

  useEffect(() => {
    const a = new Audio();
    const b = new Audio();
    configureAudioElement(a);
    configureAudioElement(b);
    a.volume = volumeRef.current;
    b.volume = 0;
    audioRef.current     = a;
    nextAudioRef.current = b;
    bindPrimaryAudio(a);

    return () => {
      clearInterval(crossfadeRef.current);
      if (crossfadeReadyWaitRef.current) {
        clearTimeout(crossfadeReadyWaitRef.current.failSafe);
        crossfadeReadyWaitRef.current.cleanup?.();
        crossfadeReadyWaitRef.current = null;
      }
      primaryAudioCleanupRef.current?.();
      a.pause(); b.pause();
      a.src = ""; b.src = "";
    };
  }, [bindPrimaryAudio]);

  // Preload the locked next cut whenever queue / mode / current track settles
  useEffect(() => {
    if (!currentTrackId || isCrossfading.current) return;
    // Drop stale preload when the now-playing cut changes
    if (pendingNextRef.current?.track?.id === currentTrackId) {
      pendingNextRef.current = null;
    }
    const radio = isRadioMode;
    const wantsQueueFade = !radio
      && crossfadeOn
      && repeat !== "one"
      && queue.length > 0;
    if (!radio && !wantsQueueFade) {
      pendingNextRef.current = null;
      return;
    }
    if (pendingNextRef.current?.url) return; // already locked for this spin
    const candidate = pickCrossfadeNext();
    if (candidate && candidate.id !== currentTrackId) preloadNextAudio(candidate);
  }, [currentTrackId, queue, isRadioMode, crossfadeOn, repeat, pickCrossfadeNext, preloadNextAudio]);

  function startCrossfade() {
    if (isCrossfading.current) return;
    isCrossfading.current = true;

    const radio = isRadioModeRef.current;
    let next = pendingNextRef.current?.track || null;
    if (!radio) {
      const q = queueRef.current;
      if (!q.length) { isCrossfading.current = false; return; }
      const expected = shuffleRef.current
        ? (next && q.some((t) => t.id === next.id) ? next : q[Math.floor(Math.random() * q.length)])
        : q[0];
      next = expected;
    } else if (!next) {
      next = pickCrossfadeNext();
    }
    if (!next?.audioUrl) { isCrossfading.current = false; pendingNextRef.current = null; return; }

    const outgoing = currentRef.current;
    const fadeOut = audioRef.current;
    const fadeIn  = nextAudioRef.current;
    const fadeSecs = radio ? RADIO_CROSSFADE_SECS : QUEUE_CROSSFADE_SECS;
    const url = String(next.audioUrl).trim();
    pendingNextRef.current = { track: next, url };

    const currentSrc = fadeIn.getAttribute("src") || "";
    if (currentSrc !== url) {
      fadeIn.src = url;
      try { fadeIn.load(); } catch { /* ignore */ }
    }
    fadeIn.volume = 0;

    // Record the play
    commitListeningPlay(next);

    fadeIn.addEventListener("loadedmetadata", () => {
      setDuration(Math.floor(fadeIn.duration || 0));
    }, { once: true });

    const beginRamp = () => {
      fadeIn.play().catch(() => {});
      const steps    = fadeSecs * 20; // 20 steps per second
      const interval = 1000 / 20;
      let   step     = 0;

      clearInterval(crossfadeRef.current);
      crossfadeRef.current = setInterval(() => {
        step++;
        const t = Math.min(1, step / steps);
        const targetVol = volumeRef.current;
        // Equal-power crossfade — steadier perceived loudness than a linear ramp
        fadeOut.volume = Math.max(0, targetVol * Math.cos(t * Math.PI / 2));
        fadeIn.volume  = Math.min(targetVol, targetVol * Math.sin(t * Math.PI / 2));

        if (step >= steps) {
          clearInterval(crossfadeRef.current);
          fadeOut.pause();
          fadeOut.src = "";
          fadeOut.volume = targetVol;

          // Swap refs so audioRef always points to the active player
          audioRef.current     = fadeIn;
          nextAudioRef.current = fadeOut;
          bindPrimaryAudio(fadeIn);
          pendingNextRef.current = null;

          // Advance the queue for playlist/session playback
          if (!radio) {
            setQueue((prev) => {
              const rest = prev.filter((t2) => t2.id !== next.id);
              return repeatRef.current === "all" && outgoing
                ? [...rest, outgoing]
                : rest;
            });
          }

          setCurrent(next);
          if (outgoing) {
            playHistoryRef.current = [outgoing, ...playHistoryRef.current].slice(0, 50);
          }
          logTrackPlay(next);
          // Delay clearing the crossfade flag so the currentTrack useEffect
          // sees isCrossfading=true and skips reloading the audio
          setTimeout(() => { isCrossfading.current = false; }, 100);
        }
      }, interval);
    };

    // Gate the blend on canplay so we don't fade into silence / cold buffer
    if (crossfadeReadyWaitRef.current) {
      clearTimeout(crossfadeReadyWaitRef.current.failSafe);
      crossfadeReadyWaitRef.current.cleanup?.();
      crossfadeReadyWaitRef.current = null;
    }
    let started = false;
    const kick = () => {
      if (started) return;
      started = true;
      if (crossfadeReadyWaitRef.current) {
        clearTimeout(crossfadeReadyWaitRef.current.failSafe);
        crossfadeReadyWaitRef.current.cleanup?.();
        crossfadeReadyWaitRef.current = null;
      }
      beginRamp();
    };
    const onCanPlay = () => kick();
    fadeIn.addEventListener("canplay", onCanPlay);
    const failSafe = setTimeout(kick, 4500);
    crossfadeReadyWaitRef.current = {
      failSafe,
      cleanup: () => fadeIn.removeEventListener("canplay", onCanPlay),
    };
    // HAVE_FUTURE_DATA or better — already warm from preload
    if (fadeIn.readyState >= 3) kick();
  }
  startCrossfadeRef.current = startCrossfade;

  // When track changes (non-crossfade — manual play), load fresh
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    // If we're crossfading in radio mode, the engine handles it — skip
    if (isCrossfading.current) return;
    const audio = audioRef.current;
    clearInterval(crossfadeRef.current);
    pendingNextRef.current = null;
    const url = String(currentTrack.audioUrl || "").trim();
    if (!url) {
      audio.src = "";
      setProgress(0);
      transportFlags.setBuffering(false);
      setIsPlaying(false);
      return undefined;
    }
    const already = (audio.getAttribute("src") || "") === url;
    audio.volume = volumeRef.current;
    if (!already) {
      transportFlags.setBuffering(true);
      audio.src = url;
      try { audio.load(); } catch { /* ignore */ }
    }
    const resumeAt = pendingResumeRef.current;
    pendingResumeRef.current = null;
    if (resumeAt != null && resumeAt > 0) {
      const seekWhenReady = () => { try { audio.currentTime = resumeAt; } catch { /* ignore */ } };
      audio.addEventListener("loadedmetadata", seekWhenReady, { once: true });
      setProgress(Math.floor(resumeAt));
    } else if (!already) {
      setProgress(0);
    }

    let cancelled = false;
    const rejectPlay = (err) => {
      if (cancelled || isBenignPlayReject(err)) return;
      setIsPlaying(false);
      transportFlags.setBuffering(false);
      showToastRef.current?.(PLAY_REJECTED_TOAST);
    };
    const tryPlay = () => {
      if (cancelled || !isPlayingRef.current || !canAttemptPlay(audio)) return;
      const p = audio.play();
      if (p?.catch) {
        p.catch((err) => {
          if (cancelled || !isPlayingRef.current || isBenignPlayReject(err)) return;
          setTimeout(() => {
            if (!cancelled && isPlayingRef.current && canAttemptPlay(audio)) {
              audio.play().catch(rejectPlay);
            } else if (!cancelled && isPlayingRef.current) {
              rejectPlay(err);
            }
          }, 220);
        });
      }
    };
    if (audio.readyState >= 2) tryPlay();
    else audio.addEventListener("canplay", tryPlay, { once: true });
    const loadTimeout = window.setTimeout(() => {
      if (cancelled) return;
      transportFlags.setBuffering(false);
      if (audio.paused && isPlayingRef.current) {
        setIsPlaying(false);
        showToastRef.current?.("This cut is taking too long. Try another.");
      }
    }, AUDIO_LOAD_TIMEOUT_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(loadTimeout);
      audio.removeEventListener("canplay", tryPlay);
    };
  }, [currentTrackId]);

  // ── Session resume — save the listening position, restore on next launch ──
  const pendingResumeRef = useRef(null);
  const resumeRestoredRef = useRef(false);
  const lastSavedProgressRef = useRef(-10);
  useEffect(() => {
    if (!currentTrack?.id) return undefined;
    const trackId = currentTrack.id;
    const save = (progress) => {
      if (Math.abs(progress - lastSavedProgressRef.current) < 5 && progress !== 0) return;
      lastSavedProgressRef.current = progress;
      try {
        localStorage.setItem(`${brandStoragePrefix()}.lastSession`, JSON.stringify({
          trackId,
          position: progress,
          ts: Date.now(),
        }));
      } catch { /* ignore */ }
    };
    save(playerPlaybackStore.getState().progress);
    return playerPlaybackStore.subscribe((s) => save(s.progress));
  }, [currentTrackId]);
  useEffect(() => {
    if (resumeRestoredRef.current || tracksLoading || currentTrack || !tracks.length) return;
    resumeRestoredRef.current = true;
    try {
      const saved = JSON.parse(localStorage.getItem(`${brandStoragePrefix()}.lastSession`) || "null");
      if (!saved?.trackId) return;
      const track = trackById.get(saved.trackId);
      if (!track || !String(track.audioUrl || "").trim()) return;
      const dur = track.duration || 0;
      const position = Number.isFinite(saved.position) && saved.position > 3 && (!dur || saved.position < dur - 10)
        ? saved.position
        : 0;
      pendingResumeRef.current = position;
      setCurrent(track); // paused — never autoplay on launch
      setIsRadioMode(false);
    } catch { /* ignore */ }
  }, [tracksLoading, trackById, currentTrack]);

  // Sync play/pause — subscribe to transport store so App need not re-render
  useEffect(() => {
    const apply = (state) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (state.isPlaying) {
        if (canAttemptPlay(audio)) {
          audio.play().catch((err) => {
            if (isBenignPlayReject(err)) return;
            setIsPlaying(false);
            transportFlags.setBuffering(false);
            showToastRef.current?.(PLAY_REJECTED_TOAST);
          });
        }
      } else {
        audio.pause();
      }
    };
    apply(transportFlags.getState());
    return transportFlags.subscribe(apply);
  }, []);

  // Sync volume to both audio elements
  useEffect(() => {
    if (audioRef.current && !isCrossfading.current) audioRef.current.volume = volume;
    // nextAudioRef volume is managed during crossfade
  }, [volume]);

  // ── Playback actions ─────────────────────────────────────────────────────
  const togglePlay = () => {
    setIsPlaying((p) => {
      if (!p) unlockAudioElements();
      return !p;
    });
  };

  /** Server-trusted play accounting (meter + charts). Optimistic local meter. */
  const commitListeningPlay = useCallback((track) => {
    if (!firebaseUser || !track?.id) return;
    const optimistic = bumpPlayMeter(profile, access);
    if (optimistic) {
      setProfile((p) => ({ ...(p || {}), ...optimistic }));
    }
    recordPlay(track.id, profile?.recentTracks || [])
      .then((result) => {
        if (result?.allowed === false) {
          if (!PAYWALL_ENABLED) return;
          setIsPlaying(false);
          setProfile((p) => ({
            ...(p || {}),
            playsToday: result.playsToday ?? (p?.playsToday || 0),
            playsDayKey: result.playsDayKey || p?.playsDayKey || null,
          }));
          showToast(
            `Free limit reached (${result.freePlaysPerDay || BILLING.freePlaysPerDay}/day) — join Club for unlimited`
          );
          setShowPlans(true);
          return;
        }
        setProfile((p) => ({
          ...(p || {}),
          ...(result?.playsToday != null
            ? { playsToday: result.playsToday, playsDayKey: result.playsDayKey }
            : {}),
          ...(result?.recentTracks ? { recentTracks: result.recentTracks } : {}),
        }));
        if (result?.playCount != null) {
          setTracks((prev) =>
            prev.map((t) => (t.id === track.id ? { ...t, playCount: result.playCount } : t))
          );
        }
      })
      .catch(() => {});
  }, [firebaseUser, profile, access]);

  const guardFreePlay = useCallback(() => {
    if (!PAYWALL_ENABLED) return true;
    if (canPlayOnFreeTier(profile, access)) return true;
    const left = freePlaysRemaining(profile, access);
    showToast(
      left <= 0
        ? `Free limit reached (${BILLING.freePlaysPerDay}/day) — join Club for unlimited`
        : "Upgrade for unlimited listening"
    );
    setShowPlans(true);
    return false;
  }, [profile, access]);

  const playTrack = (track, q = null, opts = {}) => {
    if (!track) return;
    if (!hasPlayableAudio(track)) {
      showToast(MISSING_AUDIO_TOAST);
      return;
    }
    if (!guardFreePlay()) return;
    unlockAudioElements();
    if (currentTrack && currentTrack.id !== track.id) {
      playHistoryRef.current = [currentTrack, ...playHistoryRef.current].slice(0, 50);
    }
    // Quiet dig by default — only open Booth when asked (radio / session / explicit)
    const openImmersive = opts.immersive === true;
    setCurrent(track); setIsPlaying(true); setProgress(0); setIsRadioMode(false);
    if (!opts.keepSession) setSessionMeta(null);
    if (!opts.keepHypno) setHypnoSeed(null);
    if (!opts.keepShow) {
      activeShowIdRef.current = null;
      setActiveShowId(null);
    }
    if (!opts.keepScene) {
      activeSceneChannelIdRef.current = null;
      setActiveSceneChannelId(null);
    }
    if (opts.room) setListeningRoom(opts.room);
    else if (!opts.keepRoom) setListeningRoom(null);
    if (openImmersive) setImmersive(true);
    if (q) setQueue(q.filter(t => t.id !== track.id));
    logTrackPlay(track);
    commitListeningPlay(track);
  };

  const playPath = (path) => {
    if (!path?.playlist?.length) return;
    const first = path.playlist[0];
    setListeningRoom({ id: path.id, label: path.title });
    playTrack(first, path.playlist, { immersive: true, keepRoom: true, room: { id: path.id, label: path.title } });
    showToast(`Walking “${path.title}”`);
  };

  const playRadio = (seed = null, intentOverride = null) => {
    if (!guardFreePlay()) return;
    unlockAudioElements();
    const liveBlock = resolveShowAt(new Date()).show;
    // Default orb = tune the live VJ block (channel, not anonymous shuffle)
    if (!seed && !intentOverride && liveBlock && !listenFocus.genre && !listenFocus.scene && !(tasteColdStart && profileTaste.seedChannelId)) {
      playShowRef.current?.(liveBlock);
      return;
    }
    const resolved = intentOverride
      ? resolveListenPool(tracks, intentOverride, { requireAudio: true, applyMixLane: true })
      : radioResolved();
    const pool = resolved.tracks;
    if (!pool.length) return;
    const seedTrack = seed || null;
    // Honor the hero preview so "Up first" is what actually plays
    const first = (!seedTrack && !intentOverride && heroPreview && pool.some(t => t.id === heroPreview.id))
      ? heroPreview
      : pickNextTrack(pool, null, recentlyPlayedRef.current, {
          ...radioPickOpts(),
          seedTrack,
          tasteBlend: !(intentOverride?.genre || listenFocus.genre),
        }) || pool.find(t => (t.duration || 0) <= 900) || pool[0];
    if (!hasPlayableAudio(first)) {
      showToast("This station is missing audio.");
      return;
    }
    setHypnoSeed(seedTrack);
    if (liveBlock && !seedTrack) {
      activeShowIdRef.current = liveBlock.id;
      setActiveShowId(liveBlock.id);
    }
    if (currentTrack) playHistoryRef.current = [currentTrack, ...playHistoryRef.current].slice(0, 50);
    setCurrent(first); setIsPlaying(true); setProgress(0); setIsRadioMode(true); setQueue([]);
    setImmersive(false);
    setSessionMeta(null);
    if (!sessionStartRef.current) sessionStartRef.current = Date.now();
    logTrackPlay(first);
    showToast(seedTrack ? "Near this" : (liveBlock?.intro || "What's in the mix?"));
    commitListeningPlay(first);
  };

  // Play a generated route / night as a queue — session ritual
  const playRoute = (routeTracks, kind = "night") => {
    if (!routeTracks.length) return;
    if (!guardFreePlay()) return;
    unlockAudioElements();
    const first = routeTracks[0];
    const now = Date.now();
    setHypnoSeed(null);
    setCurrent(first); setIsPlaying(true); setProgress(0); setIsRadioMode(false); setImmersive(true);
    setQueue(routeTracks.slice(1));
    sessionStartRef.current = now;
    setSessionMeta({
      tracks: routeTracks,
      startTime: now,
      kind,
      label: "Your playlist",
    });
    logTrackPlay(first);
    showToast(`Playing ${routeTracks.length} songs`);
    commitListeningPlay(first);
  };

  const playHypnoRadio = (track) => {
    playRadio(track);
  };

  // Record a skip on the track that was skipped (only if it had played >2s, not auto-advance)
  const recordSkipOnFirestore = async (trackId) => {
    try {
      const { doc: fdoc, updateDoc: fup, increment: finc } = await import("firebase/firestore");
      await fup(fdoc(db, "tracks", trackId), { skipCount: finc(1) });
    } catch(e) {}
  };

  const handleSkip = () => {
    // Only count as a skip if user manually skipped (not end-of-track auto-advance)
    // We detect this by checking if progress < 95% of duration
    const { progress, duration } = playerPlaybackStore.getState();
    const pct = duration > 0 ? progress / duration : 0;
    if (currentTrack && firebaseUser && pct < 0.95) {
      recordSkipOnFirestore(currentTrack.id);
      // Also update local tracks state so analytics tab reflects it immediately
      setTracks(prev => prev.map(t => t.id === currentTrack.id ? { ...t, skipCount: (t.skipCount||0)+1 } : t));
    }
    if (currentTrack) playHistoryRef.current = [currentTrack, ...playHistoryRef.current].slice(0, 50);
    if (isRadioMode) {
      const next = pickNextTrack(radioPool(), currentTrack, recentlyPlayedRef.current, radioPickOpts());
      if (next) {
        setCurrent(next); setProgress(0); setIsPlaying(true);
        logTrackPlay(next);
        commitListeningPlay(next);
      }
      return;
    }
    if (!queue.length) {
      if (repeat === "one" && currentTrack) {
        handleSeek(0);
        setIsPlaying(true);
        return;
      }
      setIsPlaying(false);
      if (sessionMeta) {
        endSessionWithAfterglow(true);
        setImmersive(false);
      }
      return;
    }
    const next = shuffle
      ? queue[Math.floor(Math.random() * queue.length)]
      : queue[0];
    setQueue(repeat === "all" ? [...queue.filter(t=>t.id!==next.id), currentTrack] : queue.filter(t=>t.id!==next.id));
    setCurrent(next); setProgress(0); setIsPlaying(true);
    logTrackPlay(next);
  };
  // Keep ref in sync so the audio "ended" listener always calls the latest handleSkip
  handleSkipRef.current = handleSkip;

  // Seek: move the real audio position when the user drags the bar
  const handleSeek = (seconds) => {
    setProgress(seconds);
    if (audioRef.current) audioRef.current.currentTime = seconds;
  };

  // Prev: if more than 3 seconds in, restart the track; otherwise go to previous
  const handlePrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }
    const prev = playHistoryRef.current[0];
    if (prev) {
      playHistoryRef.current = playHistoryRef.current.slice(1);
      if (currentTrack) setQueue(q => [currentTrack, ...q.filter(t => t.id !== currentTrack.id)]);
      setCurrent(prev); setProgress(0); setIsPlaying(true);
      return;
    }
    if (audioRef.current) audioRef.current.currentTime = 0;
    setProgress(0);
  };

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  // Space play/pause · ←/→ seek ±10s · ↑/↓ volume · M mute · L like ·
  // Q queue · F player · / search · Esc close overlays
  // keyCtxRef is filled after toggleLike is declared (below) to avoid TDZ.
  const keyCtxRef = useRef({});
  useEffect(() => {
    const isTypingTarget = (el) =>
      el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const ctx = keyCtxRef.current;
      const typing = isTypingTarget(e.target);
      if (typing) {
        if (e.key === "Escape") e.target.blur?.();
        return;
      }
      switch (e.key) {
        case " ":
          if (!ctx.currentTrack) return;
          e.preventDefault();
          ctx.togglePlay();
          break;
        case "ArrowRight":
          if (!ctx.currentTrack) return;
          e.preventDefault();
          {
            const clock = playerPlaybackStore.getState();
            ctx.handleSeek(Math.min((clock.duration || 0), clock.progress + 10));
          }
          break;
        case "ArrowLeft":
          if (!ctx.currentTrack) return;
          e.preventDefault();
          {
            const clock = playerPlaybackStore.getState();
            ctx.handleSeek(Math.max(0, clock.progress - 10));
          }
          break;
        case "ArrowUp":
          if (!ctx.currentTrack) return;
          e.preventDefault();
          ctx.setVolume((v) => Math.min(1, Math.round((v + 0.05) * 100) / 100));
          break;
        case "ArrowDown":
          if (!ctx.currentTrack) return;
          e.preventDefault();
          ctx.setVolume((v) => Math.max(0, Math.round((v - 0.05) * 100) / 100));
          break;
        case "m": case "M":
          if (!ctx.currentTrack) return;
          ctx.setVolume((v) => (v > 0 ? 0 : (lastAudibleVolumeRef.current || 1)));
          break;
        case "l": case "L":
          if (!ctx.currentTrack) return;
          ctx.toggleLike(ctx.currentTrack.id);
          break;
        case "q": case "Q":
          if (!ctx.currentTrack) return;
          ctx.setShowQueue((s) => !s);
          break;
        case "f": case "F":
          if (!ctx.currentTrack) return;
          ctx.setImmersive((s) => !s);
          break;
        case "/":
          e.preventDefault();
          ctx.setScreen("search");
          break;
        case "Escape":
          if (ctx.showQueue) ctx.setShowQueue(false);
          else if (ctx.immersive) ctx.setImmersive(false);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Media Session — lock screen / headset / OS transport controls
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title || "Unknown",
        artist: currentTrack.artist || "",
        album: currentTrack.album || "",
        artwork: currentTrack.albumCover
          ? [{ src: currentTrack.albumCover, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });
      navigator.mediaSession.setActionHandler("play", () => {
        unlockAudioElements();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", () => handlePrev());
      navigator.mediaSession.setActionHandler("nexttrack", () => handleSkipRef.current?.());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setProgress(Math.floor(details.seekTime));
        }
      });
    } catch (e) {
      // MediaSession unsupported or rejected — ignore
    }
  }, [currentTrackId]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return undefined;
    const apply = (state) => {
      try {
        navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
      } catch { /* ignore */ }
    };
    apply(transportFlags.getState());
    return transportFlags.subscribe(apply);
  }, []);


  // ── Like/unlike — optimistic UI + Firestore sync ────────────────────────
  const toggleLike = async (id) => {
    const track = trackById.get(id);
    if (!track) return;
    const nowLiked = !track.liked;
    const delta = nowLiked ? 1 : -1;

    // Update local state immediately so the heart feels instant
    setTracks(prev => prev.map(t => t.id === id ? {...t, liked: nowLiked, likeCount: Math.max(0,(t.likeCount||0)+delta)} : t));
    if (currentTrack?.id === id) setCurrent(t => ({...t, liked: nowLiked}));

    // Sync to Firestore in the background
    if (firebaseUser) {
      try {
        await fbToggleLike(id, track.liked);
        // Increment/decrement global likeCount on the track doc
        const { doc: fdoc, updateDoc: fup, increment: finc } = await import("firebase/firestore");
        await fup(fdoc(db, "tracks", id), { likeCount: finc(delta) });
      } catch(e) {
        // Roll back on failure
        setTracks(prev => prev.map(t => t.id === id ? {...t, liked: track.liked, likeCount: t.likeCount - delta} : t));
        showToast("Couldn't save — check your connection");
      }
    }
  };

  // ── Station: countdown, requests, dedications, VJ shows ──────────────────
  const countdown = useMemo(() => buildCountdown(tracks, 20), [tracks]);
  const { airing: liveAiring, guide: programGuide } = useLiveAiring(30000);
  const liveShow = useMemo(() => {
    if (activeShowId) {
      const fromGuide = programGuide.find((s) => s.id === activeShowId);
      if (fromGuide) return fromGuide;
      return getShowById(activeShowId);
    }
    return liveAiring?.show || null;
  }, [activeShowId, programGuide, liveAiring]);
  const showBumper = useMemo(
    () => pickShowBumper(liveShow || liveAiring?.show, new Date()),
    [liveShow, liveAiring?.show?.id, currentTrackId]
  );
  const stationDaypartLive = useMemo(() => stationDaypart(new Date()), [mixLane, currentTrackId]);
  const {
    daypart: feedDaypart,
    ticker: stationTicker,
    dedicationFlash,
    setDedicationFlash,
    pushDedication,
  } = useStationFeed({
    countdown,
    communityMixTitle: communityMix?.title || null,
    show: liveShow || liveAiring?.show || null,
    nextShow: liveAiring?.nextShow || null,
    bumper: showBumper,
  });
  const activeDaypart = feedDaypart || stationDaypartLive;
  const dislikeCurrentTrack = useCallback(async () => {
    const track = currentTrack;
    if (!track?.id) return;
    const already = !!(track.disliked || (profile?.dislikedTracks || []).includes(track.id));
    if (!already) {
      const recorded = recordDislikeEvent(
        normalizeDislikeTaste(profile?.dislikeTaste || emptyDislikeTaste()),
        track
      );
      const dislikedTracks = Array.from(
        new Set([track.id, ...(profile?.dislikedTracks || [])])
      ).slice(0, 80);
      const likedTracks = (profile?.likedTracks || []).filter((id) => id !== track.id);
      setTracks((prev) => prev.map((t) => (
        t.id === track.id ? { ...t, disliked: true, liked: false } : t
      )));
      setCurrent((t) => (t?.id === track.id ? { ...t, disliked: true, liked: false } : t));
      setProfile((p) => ({
        ...(p || {}),
        dislikeTaste: recorded.taste,
        dislikedTracks,
        likedTracks,
      }));
      showToast(
        recorded.hard
          ? "Got it — we’ll skip that vibe"
          : "Hearing less of that"
      );
      if (firebaseUser) {
        try {
          await saveDislikeTaste(recorded.taste, dislikedTracks);
          if (track.liked) {
            await fbToggleLike(track.id, true);
          }
        } catch {
          showToast("Couldn't save — check your connection");
        }
      }
    }
    handleSkipRef.current?.();
  }, [currentTrack, profile, firebaseUser, setProfile]);

  const playShow = useCallback((showInput) => {
    const show = typeof showInput === "string"
      ? getShowById(showInput)
      : (showInput || liveAiring?.show);
    if (!show) {
      showToast("That block isn’t on the guide");
      return;
    }
    if (!guardFreePlay()) return;
    const pool = buildShowPool(tracks, show, { countdown });
    if (!pool.length) {
      showToast("Nothing lined up for this block yet");
      return;
    }
    unlockAudioElements();
    const first = pool[0];
    if (!hasPlayableAudio(first)) {
      showToast("Nothing lined up for this block yet");
      return;
    }
    activeShowIdRef.current = show.id;
    activeSceneChannelIdRef.current = null;
    setActiveShowId(show.id);
    setActiveSceneChannelId(null);
    setHypnoSeed(null);
    setListeningRoom({ id: `show:${show.id}`, label: show.title });
    if (currentTrack) playHistoryRef.current = [currentTrack, ...playHistoryRef.current].slice(0, 50);
    setCurrent(first);
    setIsPlaying(true);
    setProgress(0);
    setIsRadioMode(true);
    setQueue([]);
    // Stay on the Home broadcast stage — immersive is opt-in via the hero.
    setImmersive(false);
    setSessionMeta({
      tracks: pool.slice(0, 24),
      startTime: Date.now(),
      kind: "show",
      label: show.title,
    });
    if (!sessionStartRef.current) sessionStartRef.current = Date.now();
    logTrackPlay(first);
    showToast(show.intro || `Tuned into ${show.title}`);
    commitListeningPlay(first);
  }, [tracks, countdown, liveAiring, currentTrack, guardFreePlay, commitListeningPlay]);

  // Stable ref so playRadio (defined earlier) can tune a live block without TDZ issues
  playShowRef.current = playShow;

  const playSceneChannel = useCallback((channelInput) => {
    const channel = typeof channelInput === "string"
      ? getSceneChannel(channelInput)
      : channelInput;
    if (!channel) return;
    if (!guardFreePlay()) return;
    // Already on this dial — the tile shows pause, so toggle transport.
    if (activeSceneChannelIdRef.current === channel.id) {
      if (!isPlayingRef.current) unlockAudioElements();
      togglePlay();
      return;
    }
    const pool = buildSceneChannelPool(tracks, channel);
    if (!pool.length) {
      showToast("Nothing lined up on that channel yet");
      return;
    }
    unlockAudioElements();
    const first = pickNextTrack(pool, null, recentlyPlayedRef.current, {
      ...radioPickOpts(),
      tasteBlend: false,
      scopedPool: true,
    }) || pool.find((t) => hasPlayableAudio(t)) || pool[0];
    if (!hasPlayableAudio(first)) {
      showToast("Nothing lined up on that channel yet");
      return;
    }
    activeSceneChannelIdRef.current = channel.id;
    activeShowIdRef.current = null;
    setActiveSceneChannelId(channel.id);
    setActiveShowId(null);
    setHypnoSeed(null);
    setListeningRoom({ id: `scene:${channel.id}`, label: channel.title });
    if (currentTrack) playHistoryRef.current = [currentTrack, ...playHistoryRef.current].slice(0, 50);
    setCurrent(first);
    setIsPlaying(true);
    setProgress(0);
    setIsRadioMode(true);
    setQueue([]);
    // Channel Surfing plays on the live Home stage, not the immersive booth.
    setImmersive(false);
    setSessionMeta(null);
    if (!sessionStartRef.current) sessionStartRef.current = Date.now();
    logTrackPlay(first);
    showToast(`${channel.title} — ${channel.tagline}`);
    commitListeningPlay(first);
  }, [tracks, currentTrack, guardFreePlay, commitListeningPlay, profileTaste, tasteColdStart, profile?.dislikeTaste]);

  const playSceneChannelRef = useRef(null);
  playSceneChannelRef.current = playSceneChannel;

  useEffect(() => {
    if (!pendingTune || needsOnboarding || tracksLoading) return;
    const id = pendingTune;
    setPendingTune(null);
    const frame = requestAnimationFrame(() => playSceneChannelRef.current?.(id));
    return () => cancelAnimationFrame(frame);
  }, [pendingTune, needsOnboarding, tracksLoading]);

  const playMonthlyChart = useCallback(async (scope = { mode: "overall" }) => {
    const { buildMonthlyChart, chartScopeLabel } = await import("./lib/chartHistory");
    const monthly = buildMonthlyChart(tracks, { limit: 20, scope });
    const pool = monthly.map((c) => c.track).filter(Boolean);
    if (!pool.length) {
      showToast("Monthly chart needs plays and requests in this scope");
      return;
    }
    setActiveShowId(null);
    setActiveSceneChannelId(null);
    playTrack(pool[0], pool, { immersive: true });
    showToast(`${chartScopeLabel(scope)} — monthly chart`);
  }, [tracks, playTrack]);

  const addTrackToQueue = useCallback((track) => {
    if (!track?.id) return;
    setQueue((q) => {
      if (q.some((t) => t.id === track.id)) return q;
      return [...q, track];
    });
    showToast(`Added to queue — ${track.title}`);
  }, []);

  // Snapshot today's chart for history / climbers
  useEffect(() => {
    if (!tracks.length) return;
    import("./lib/chartHistory").then(({ ensureTodayChart }) => {
      try { ensureTodayChart(tracks); } catch { /* ignore */ }
    }).catch(() => {});
  }, [tracks]);

  const tuneCountdown = useCallback(() => {
    const liveCountdownShow = getShowById("most-requested-live");
    if (liveCountdownShow) {
      playShow(liveCountdownShow);
      return;
    }
    const pool = countdown.map((c) => c.track).filter(Boolean);
    if (!pool.length) {
      playRadio();
      return;
    }
    playTrack(pool[0], pool, { immersive: false });
    showToast(`${activeDaypart?.label || "Countdown"} — locked in`);
  }, [countdown, activeDaypart, playRadio, playTrack, playShow]);

  const countdownRankForCurrent = useMemo(() => {
    if (!currentTrack?.id) return null;
    return countdown.find((c) => c.track.id === currentTrack.id)?.rank ?? null;
  }, [countdown, currentTrackId]);

  const stationUpNext = setNext || (countdown[0]?.track?.id !== currentTrack?.id ? countdown[0]?.track : countdown[1]?.track) || null;

  // Sparse station ident between cuts — skip most changes so the live show
  // sting (e.g. Most Requested / Dez) does not restage on every song.
  useEffect(() => {
    if (!currentTrack?.id || !isPlayingRef.current) return;
    if (lastBumperTrackRef.current === currentTrack.id) return;
    const prev = lastBumperTrackRef.current;
    lastBumperTrackRef.current = currentTrack.id;
    if (!prev) return; // skip first track of session
    if (!isRadioMode && !activeShowId && !activeSceneChannelId) return;
    if (!shouldFireTrackBumper({ lastFiredAt: lastBumperAtRef.current })) return;
    const bumper = pickTrackBumper({
      show: liveShow,
      nextTrack: stationUpNext,
      countdownTop: countdown[0] || null,
      sceneChannel: activeSceneChannelId ? getSceneChannel(activeSceneChannelId) : null,
    });
    if (!bumper) return;
    lastBumperAtRef.current = Date.now();
    setStationBumper(bumper);
  }, [currentTrackId, isRadioMode, activeShowId, activeSceneChannelId, liveShow, stationUpNext, countdown]);

  // When a tuned block ends, roll the channel forward to the new live show
  useEffect(() => {
    if (!isRadioMode || !activeShowId || !liveAiring?.show) return;
    const stillOnGuide = programGuide.some((s) => s.id === activeShowId);
    if (!stillOnGuide) {
      setActiveShowId(liveAiring.show.id);
      showToast(liveAiring.show.intro || `Now: ${liveAiring.show.title}`);
    }
  }, [isRadioMode, liveAiring?.show?.id, activeShowId, programGuide]);

  // Keep shortcut handlers current each render — after toggleLike exists.
  keyCtxRef.current = {
    togglePlay, handleSkip, handlePrev, handleSeek, toggleLike, setVolume,
    currentTrack, volume, immersive, showQueue,
    setShowQueue, setImmersive, setScreen,
  };

  // ── Genre preferences (removed from profile UI) ───────────────────────────

  // ── Playlist handlers ────────────────────────────────────────────────────
  // Playlists are stored per-user in Firestore users/{uid}.playlists
  const savePlaylists = async (updated) => {
    const ownOnly = (updated || []).filter((p) => !isCommunityPlaylist(p));
    setUserPlaylists(ownOnly);
    if (firebaseUser) {
      try {
        const { doc: fdoc, updateDoc: fupdate } = await import("firebase/firestore");
        await fupdate(fdoc(db, "users", firebaseUser.uid), { playlists: ownOnly });
      } catch(e) {}
    }
  };

  const createPlaylist = (name, trackIdOrIds = null) => {
    const ids = Array.isArray(trackIdOrIds)
      ? trackIdOrIds.filter(Boolean)
      : (trackIdOrIds ? [trackIdOrIds] : []);
    const newPl = { id: `pl_${Date.now()}`, name, trackIds: ids };
    savePlaylists([...userPlaylists, newPl]);
    showToast(ids.length ? `Created “${name}”` : `Playlist “${name}” created`);
    return newPl;
  };

  const addToPlaylist = (trackId, playlistId) => {
    if (String(playlistId || "").startsWith("community-")) {
      showToast("Community Mix is curated — make your own mixtape to edit");
      return;
    }
    const pl = userPlaylists.find(p => p.id === playlistId);
    if (!pl) return;
    if ((pl.trackIds || []).includes(trackId)) {
      showToast(`Already in ${pl.name}`);
      return;
    }
    const updated = userPlaylists.map(p =>
      p.id === playlistId ? { ...p, trackIds: [...(p.trackIds || []), trackId] } : p
    );
    savePlaylists(updated);
    showToast(`Filed to ${pl.name}`);
  };

  const removeFromPlaylist = (trackId, playlistId) => {
    if (String(playlistId || "").startsWith("community-")) {
      showToast("Community Mix can’t be edited");
      return;
    }
    const pl = userPlaylists.find(p => p.id === playlistId);
    const updated = userPlaylists.map(p =>
      p.id === playlistId ? { ...p, trackIds: (p.trackIds || []).filter(id => id !== trackId) } : p
    );
    savePlaylists(updated);
    if (pl) showToast(`Removed from ${pl.name}`);
  };

  const deletePlaylist = (playlistId) => {
    if (isCommunityPlaylist({ id: playlistId })) {
      showToast("Community Mix stays in every member’s library");
      return;
    }
    savePlaylists(userPlaylists.filter(pl => pl.id !== playlistId));
    showToast("Playlist deleted");
  };

  const renamePlaylist = (playlistId, name) => {
    const clean = String(name || "").trim();
    if (!clean) return;
    if (isCommunityPlaylist({ id: playlistId })) {
      showToast("Community Mix can’t be renamed");
      return;
    }
    savePlaylists(userPlaylists.map(pl => pl.id === playlistId ? { ...pl, name: clean } : pl));
    showToast(`Renamed to “${clean}”`);
  };

  const reorderPlaylistTrack = (playlistId, trackId, delta) => {
    if (isCommunityPlaylist({ id: playlistId })) return;
    const pl = userPlaylists.find((p) => p.id === playlistId);
    if (!pl) return;
    const ids = [...(pl.trackIds || [])];
    const idx = ids.indexOf(trackId);
    if (idx < 0) return;
    const next = idx + Number(delta || 0);
    if (next < 0 || next >= ids.length) return;
    const swapped = ids[next];
    ids[next] = ids[idx];
    ids[idx] = swapped;
    savePlaylists(userPlaylists.map((p) => (p.id === playlistId ? { ...p, trackIds: ids } : p)));
  };

  const sharePlaylistToClub = async (playlist) => {
    if (!playlist || !firebaseUser) return;
    if (isCommunityPlaylist(playlist) || playlist.id === communityMix?.id) {
      const url = absoluteAppUrl(buildPath("mix", { mixId: playlist.id || communityMix?.id }));
      const result = await shareOrCopy({
        title: playlist.name || COMMUNITY_MIX_TITLE,
        text: "This month’s Community Mix on Planet MP3",
        url,
      });
      if (result.ok) showToast(result.method === "clipboard" ? "Link copied" : "Shared");
      return;
    }
    // Personal stacks share a deep link so Library back/forward works
    if (playlist.id) {
      const url = absoluteAppUrl(buildPath("stack", { stackId: playlist.id }));
      const result = await shareOrCopy({
        title: playlist.name || "Stack",
        text: `${playlist.name || "Stack"} on ${BRAND_NAME}`,
        url,
      });
      if (result.ok) showToast(result.method === "clipboard" ? "Stack link copied" : "Shared");
      return;
    }
    if (!(playlist.trackIds || []).length) {
      showToast("Add tracks before sharing");
      return;
    }
    try {
      const mix = buildMixFromPlaylist(playlist, {
        ownerUid: firebaseUser.uid,
        ownerName: profile?.displayName || user.name,
        visibility: "public",
      });
      const { doc: fdoc, setDoc: fset } = await import("firebase/firestore");
      await fset(fdoc(db, "mixes", mix.id), mix, { merge: true });
      const url = absoluteAppUrl(buildPath("mix", { mixId: mix.id }));
      const result = await shareOrCopy({
        title: mix.title,
        text: `${mix.title} — a mixtape on Planet MP3`,
        url,
      });
      showToast(result.ok
        ? (result.method === "clipboard" ? "Shared to Planet Club · link copied" : "Shared to Planet Club")
        : "Shared to Planet Club");
    } catch (e) {
      console.warn("Share mix failed", e);
      showToast("Couldn’t share — try again");
    }
  };

  const publishCommunityMixFromPlaylist = async (playlist) => {
    if (!isAdminUser || !playlist) return;
    if (!(playlist.trackIds || []).length) {
      showToast("Playlist needs tracks");
      return;
    }
    try {
      const curatorName = playlist.ownerName || profile?.displayName || "Member";
      const mix = buildCommunityMix({
        trackIds: playlist.trackIds,
        curatorUid: playlist.ownerUid || firebaseUser.uid,
        curatorName,
        sourceMixId: playlist.id,
      });
      const { doc: fdoc, setDoc: fset } = await import("firebase/firestore");
      await fset(fdoc(db, "mixes", mix.id), mix, { merge: true });
      setCommunityMix(mix);
      // Stamp featured curator on the admin profile for club badge
      if (firebaseUser) {
        try {
          await fset(fdoc(db, "users", firebaseUser.uid), {
            featuredCuratorMonth: mix.monthKey,
          }, { merge: true });
          setProfile((p) => ({ ...(p || {}), featuredCuratorMonth: mix.monthKey }));
        } catch { /* non-fatal */ }
      }
      showToast(`${COMMUNITY_MIX_TITLE} published`);
      openMix(mix.id);
    } catch (e) {
      console.warn("Publish community mix failed", e);
      showToast("Couldn’t publish Community Mix");
    }
  };

  // ── Playlist context — ⋯ / right-click menu on every track surface
  const playlistCtx = {
    playlists: libraryPlaylists.filter((p) => !isCommunityPlaylist(p)),
    onCreate:  createPlaylist,
    onAdd:     addToPlaylist,
    onRemove:  removeFromPlaylist,
    onToast:   showToast,
    onResonance: (t) => setResonanceTrack(t),
    onHypnoRadio: (t) => playHypnoRadio(t),
    onLike: (id) => toggleLike(id),
    onOpenArtist: (name) => openArtist(name),
    onOpenAlbum: (track) => openAlbum(track),
  };

  // ── Scroll memory — keep your place when switching tabs ──────────────────
  // NOTE: must stay above the early returns below — hooks after a conditional
  // return change the hook count between renders (React error #310).
  const contentScrollRef = useRef(null);
  const scrollPosRef = useRef({});
  const screenScrollKeyRef = useRef(screen);
  screenScrollKeyRef.current = screen;
  const rememberScroll = useCallback((e) => {
    scrollPosRef.current[screenScrollKeyRef.current] = e.currentTarget.scrollTop;
  }, []);
  useEffect(() => {
    const el = contentScrollRef.current;
    if (!el) return;
    const isTab = screen === "home" || screen === "explore" || screen === "charts" || screen === "search" || screen === "favorites" || screen === "profile";
    el.scrollTop = isTab ? (scrollPosRef.current[screen] || 0) : 0;
  }, [screen]);

  // Dev-only: #broadcast-preview exercises Home IA + video stage without auth.
  if (
    DevBroadcastPreview &&
    typeof window !== "undefined" &&
    window.location.hash === "#broadcast-preview"
  ) {
    return (
      <Suspense fallback={<div style={{ minHeight: "100dvh", background: color.canvas }} />}>
        <DevBroadcastPreview />
      </Suspense>
    );
  }
  if (
    DevPlayerPreview &&
    typeof window !== "undefined" &&
    window.location.hash === "#player-preview"
  ) {
    return (
      <Suspense fallback={<div style={{ minHeight: "100dvh", background: color.canvas }} />}>
        <DevPlayerPreview />
      </Suspense>
    );
  }
  if (
    DevExplorePreview &&
    typeof window !== "undefined" &&
    window.location.hash === "#explore-preview"
  ) {
    return (
      <Suspense fallback={<div style={{ minHeight: "100dvh", background: color.canvas }} />}>
        <DevExplorePreview />
      </Suspense>
    );
  }
  if (
    DevSetPreview &&
    typeof window !== "undefined" &&
    window.location.hash === "#set-preview"
  ) {
    return (
      <Suspense fallback={<div style={{ minHeight: "100dvh", background: color.canvas }} />}>
        <DevSetPreview />
      </Suspense>
    );
  }
  if (
    DevOnboardingPreview &&
    typeof window !== "undefined" &&
    window.location.hash === "#onboarding-preview"
  ) {
    return (
      <Suspense fallback={<div style={{ minHeight: "100dvh", background: color.canvas }} />}>
        <DevOnboardingPreview />
      </Suspense>
    );
  }
  if (
    DevChatPreview &&
    typeof window !== "undefined" &&
    (window.location.hash === "#chat-preview" || window.location.hash === "#chat-preview-open")
  ) {
    return (
      <Suspense fallback={<div style={{ minHeight: "100dvh", background: color.canvas }} />}>
        <DevChatPreview />
      </Suspense>
    );
  }
  if (
    DevGuidePreview &&
    typeof window !== "undefined" &&
    (window.location.hash === "#guide-preview" || window.location.hash === "#guide-preview-club")
  ) {
    return (
      <Suspense fallback={<div style={{ minHeight: "100dvh", background: color.canvas }} />}>
        <DevGuidePreview />
      </Suspense>
    );
  }

  // ── Loading states ────────────────────────────────────────────────────────
  // Auth restore — keep the HTML boot splash's dark canvas; skip Lottie on the critical path.
  if (authLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading"
        style={{
          ...APP_STYLE,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          background: color.canvas,
        }}
      >
        <span
          aria-hidden="true"
          className="pmp-live-led"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: y2k.live,
            boxShadow: "0 0 12px rgba(255,51,79,0.85)",
          }}
        />
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2.4,
            textTransform: "uppercase",
            color: y2k.cyan,
          }}
        >
          On air
        </span>
      </div>
    );
  }

  // Not logged in — show login screen
  if (!firebaseUser) return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }} />}>
      <LoginScreen
        onSignUp={signUp}
        onLogIn={logIn}
        onGoogleSignIn={signInWithGoogle}
        onPhoneOTP={sendPhoneOTP}
        onVerifyOTP={verifyPhoneOTP}
        onResetPassword={resetPassword}
        authError={authError}
        onClearAuthError={clearAuthError}
      />
    </Suspense>
  );

  if (needsOnboarding) {
    return (
      <Suspense fallback={<div style={{ minHeight: "100dvh", background: color.canvas }} />}>
        <LazyTasteTuner
          tracks={tracks}
          onComplete={(taste) => finishOnboarding(taste)}
          onSkip={(taste) => finishOnboarding(taste || { skip: true })}
        />
      </Suspense>
    );
  }

  const sessionArc = sessionMeta?.tracks?.length
    ? {
        label: sessionMeta.label || "Session arc",
        energies: sessionMeta.tracks.map(t => t.energy || 5),
        index: Math.max(0, sessionMeta.tracks.findIndex(t => t.id === currentTrack?.id)),
      }
    : (recentlyPlayedRef.current.length > 2
      ? {
          label: "Listening",
          energies: recentlyPlayedRef.current.slice(0, 12).reverse().map(p => p.energy || 5),
          index: Math.min(11, recentlyPlayedRef.current.slice(0, 12).length - 1),
        }
      : null);

  const handleVolume = (v) => {
    setVolume(v);
    if (audioRef.current && !isCrossfading.current) audioRef.current.volume = v;
  };

  const shuffleQueue = () => {
    const pool = tracks.filter(t => t.id !== currentTrack?.id && (t.duration || 0) <= 900);
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQueue(shuffled.slice(0, 8));
    setIsRadioMode(false);
    setHypnoSeed(null);
    setSessionMeta(null);
  };

  const listeningOverlays = (
    <>
      {showFeatureTour && (
        <Suspense fallback={null}>
          <LazyFeatureTour
            replay={featureTourReplay}
            onComplete={finishFeatureTour}
            onSkip={finishFeatureTour}
          />
        </Suspense>
      )}
      {PAYWALL_ENABLED && showPlans && (
        <Suspense fallback={null}>
          <LazyPaywallScreen
            access={access}
            mode={access?.tier === "free" || access?.reason === "free" ? "upgrade" : "manage"}
            onSubscribe={(link, planId) => {
              handleSubscribe(link, planId);
            }}
            onRefresh={handleBillingRefresh}
            onContinueFree={() => setShowPlans(false)}
            onLogout={null}
            refreshing={billingRefreshing}
          />
          <button
            type="button"
            onClick={() => setShowPlans(false)}
            aria-label="Close plans"
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              zIndex: 400,
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(24,27,32,0.9)",
              color: "#F7F8FA",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </Suspense>
      )}
      {showQueue && (
        <Suspense fallback={null}>
        <LazyQueueSheet
          queue={queue}
          currentTrack={currentTrack}
          isRadioMode={isRadioMode}
          radioHint={hypnoSeed
            ? `Near ${hypnoSeed.title}`
            : explainPick(setNext || currentTrack, {
                signalLabel: signalFlags.getState().label,
                preferredGenres: profile?.genres || [],
              })}
          onPlay={(t) => playTrack(t, queue)}
          onClose={() => setShowQueue(false)}
          onClear={() => setQueue([])}
          onShuffle={shuffleQueue}
          onRemove={(t) => setQueue((q) => q.filter((x) => x.id !== t.id))}
          onPlayNext={(t) => setQueue((q) => [t, ...q.filter((x) => x.id !== t.id)])}
        />
        </Suspense>
      )}
      {resonanceTrack && (
        <Suspense fallback={null}>
        <LazyHypnoVision
          sourceTrack={resonanceTrack}
          tracks={tracks}
          onPlay={(t) => playTrack(t, tracks)}
          onClose={() => setResonanceTrack(null)}
        />
        </Suspense>
      )}
      {showGenreTaste && (
        <Suspense fallback={null}>
        <LazyGenreTasteSheet
          selectedGenres={profile?.genres || []}
          adventurous={profile?.adventurous}
          depth={profile?.depth}
          genreFocus={listenFocus.genre}
          onClose={() => setShowGenreTaste(false)}
          onClearGenreFocus={() => {
            setListenFocus({ genre: null, scene: null });
            showToast("Back to your usual mix");
          }}
          onSave={async (taste) => {
            try {
              const genres = taste?.genres ?? [];
              const adventurous = taste?.adventurous;
              const depth = taste?.depth;
              await saveTasteProfile({ genres, adventurous, depth });
              setProfile((p) => ({
                ...(p || {}),
                genres,
                ...(adventurous != null ? { adventurous } : {}),
                ...(depth != null ? { depth } : {}),
              }));
              showToast(genres.length ? "Taste saved" : "Taste updated");
            } catch (e) {
              showToast("Couldn’t save taste");
            }
          }}
          onBuildSet={() => {
            setShowGenreTaste(false);
            setSessionInitialActivity(vibeForMixLane(mixLane));
            setShowRouteBuilder(true);
          }}
        />
        </Suspense>
      )}
      {showRouteBuilder && (
        <Suspense fallback={null}>
        <LazySetBuilder
          tracks={blendPoolForSession(
            resolveListenPool(
              tracks,
              activeListenIntent({ vibe: sessionInitialActivity || defaultSetPrefs(profileTaste).vibe || vibeForMixLane(mixLane) }),
              { requireAudio: false, applyMixLane: false }
            ).tracks,
            listenFocus.genre ? [listenFocus.genre] : (profileTaste.genres || [])
          )}
          initialActivity={sessionInitialActivity || defaultSetPrefs(profileTaste).vibe || vibeForMixLane(mixLane)}
          initialGenre={listenFocus.genre || defaultSetPrefs(profileTaste).genre || null}
          intentLabel={listenFocus.genre || (profileTaste.genres?.length ? "Your mix" : null)}
          taste={profileTaste}
          coldStart={tasteColdStart}
          onClose={() => {
            setShowRouteBuilder(false);
            setSessionInitialActivity(null);
          }}
          onPlayRoute={playRoute}
          onSavePlaylist={(name, trackIds) => createPlaylist(name, trackIds)}
        />
        </Suspense>
      )}
      {linerTrack && (
        <Suspense fallback={null}>
        <LazyLinerNotesSheet
          track={linerTrack}
          roomLabel={null}
          onClose={() => setLinerTrack(null)}
          onOpenArtist={(name) => openArtist(name)}
          onOpenAlbum={(t) => openAlbum(t)}
          onOpenRoom={null}
          memberPricing={!!access?.membershipCard}
          creditBalance={usableCreditBalance(profile)}
          onPurchase={handlePurchasePhysical}
          purchasing={purchasingTrackId === linerTrack?.id}
        />
        </Suspense>
      )}
      {showDedicate && (
        <Suspense fallback={null}>
        <LazyDedicateSheet
          track={currentTrack}
          defaultName={(profile?.displayName || profile?.name || "Listener").toString().slice(0, 24)}
          onClose={() => setShowDedicate(false)}
          onSubmit={(entry) => {
            pushDedication(entry);
            showToast("Dedication is live");
            if (firebaseUser && entry) {
              import("firebase/firestore").then(({ collection: col, addDoc: add }) =>
                add(col(db, "stationDedications"), {
                  uid: firebaseUser.uid,
                  text: entry.text,
                  fromName: entry.fromName,
                  trackId: entry.trackId || null,
                  trackTitle: entry.trackTitle || null,
                  createdAt: new Date().toISOString(),
                })
              ).catch(() => { /* local crawl still works */ });
            }
          }}
        />
        </Suspense>
      )}
      {stationBumper && (
        <Suspense fallback={null}>
        <LazyStationBumper
          bumper={stationBumper}
          onDone={() => setStationBumper(null)}
        />
        </Suspense>
      )}
      {afterglow && (
        <Suspense fallback={null}>
        <LazyAfterglow
          data={afterglow}
          onClose={() => setAfterglow(null)}
          onSavePlaylist={(name, trackIds) => createPlaylist(name, trackIds)}
        />
        </Suspense>
      )}
    </>
  );

  const boothPlayer = immersive && currentTrack ? (
    <Suspense fallback={null}>
    <LazyImmersivePlayer
      currentTrack={currentTrack}
     
      onTogglePlay={togglePlay}
      onSkip={handleSkip}
      onPrev={handlePrev}
      onClose={() => setImmersive(false)}
      onSeek={handleSeek}
      onLike={toggleLike}
      volume={volume}
      onVolumeChange={handleVolume}
      shuffle={shuffle}
      onToggleShuffle={() => setShuffle(s => !s)}
      repeat={repeat}
      onCycleRepeat={() => setRepeat(r => (r === "off" ? "all" : r === "all" ? "one" : "off"))}
      crossfadeOn={crossfadeOn}
      onToggleCrossfade={() => setCrossfadeOn(c => !c)}
      onHypno={(t) => setResonanceTrack(t)}
      onHypnoRadio={playHypnoRadio}
      onShowQueue={() => setShowQueue(true)}
      sessionArc={sessionArc}
      isRadioMode={isRadioMode}
      hypnoPocket={!!hypnoSeed}
      roomLabel={null}
      onOpenRoom={null}
      onOpenLiner={(t) => setLinerTrack(t)}
      onOpenArtist={(name) => { setImmersive(false); openArtist(name); }}
      upNextTrack={stationUpNext}
      countdownRank={countdownRankForCurrent}
      daypart={activeDaypart}
      tickerText={stationTicker}
      onDislike={dislikeCurrentTrack}
      onDedicate={() => setShowDedicate(true)}
      dedicationFlash={dedicationFlash}
      onClearDedication={() => setDedicationFlash(null)}
      liveShow={liveShow || liveAiring?.show || null}
      tracks={tracks}
      sceneChannelsActiveId={activeSceneChannelId}
      onTuneSceneChannel={playSceneChannel}
    /></Suspense>
  ) : null;

  // Cover Stage owns transport on Home while visible — sticky dock returns after scroll.
  const hideDockPlayer = screen === "home" && !!currentTrack && !immersive && homeStageVisible;

  // ── Ambient status — SR announcements, offline banner, buffering pill ────
  const ambientStatus = (
    <>
      <div className="sr-only" aria-live="polite">
        {currentTrack ? `Now playing ${currentTrack.title} by ${currentTrack.artist}` : ""}
      </div>
      <AmbientNetworkPill isOffline={isOffline} />
    </>
  );

  // ── Inner app (shared between mobile + desktop phone column) ─────────────
  const innerApp = (
    <div style={{ ...APP_STYLE, position:"relative" }}>
      <BgMist color={currentTrack?.color}/>
      {ambientStatus}
      {toast && <ToastEl msg={toast} onDismiss={()=>setToast(null)}/>}
      {tracksLoading && screen !== "home" && (
        <>
          <div className="sr-only" role="status">Loading your catalog…</div>
          <div style={{ position:"absolute", inset:0, zIndex:50, overflow:"hidden" }}>
            <CatalogSkeleton/>
          </div>
        </>
      )}
      <div ref={contentScrollRef} onScroll={rememberScroll} style={{ flex:1, overflow:"auto", paddingBottom: contentPadBottom(!!currentTrack && !immersive && !hideDockPlayer), zIndex:1, position:"relative" }}>
        <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading…</div>}>
        <ScreenPane key={screen === "artist" ? `artist:${artistSlug}` : screen === "album" ? `album:${albumSlug}` : screen === "mix" ? `mix:${mixId}` : screen}>
        {screen==="home"      && <HomeScreen catalogLoading={tracksLoading} tracks={tracks} onPlayRadio={playRadio} onTogglePlay={togglePlay} onPlayTrack={playTrack} onLike={toggleLike} isRadioMode={isRadioMode} hypnoPocket={!!hypnoSeed} playlistCtx={playlistCtx} mixLane={mixLane} radioPreview={heroPreview} radioNext={setNext} onSkipRadio={handleSkip} onPrevRadio={handlePrev} onOpenPlayer={()=>setImmersive(true)} catalogError={tracksLoadError} onRetryCatalog={reloadCatalog} onStageVisibilityChange={onHomeStageVisibilityChange} onSeek={handleSeek} countdown={countdown} onTuneCountdown={tuneCountdown} daypart={activeDaypart} tickerText={stationTicker} onDislike={dislikeCurrentTrack} onDedicate={()=>setShowDedicate(true)} dedicationFlash={dedicationFlash} onClearDedication={()=>setDedicationFlash(null)} airing={liveAiring} programGuide={programGuide} activeShowId={activeShowId} onTuneShow={playShow} showBumper={showBumper} channelShow={liveShow} sceneChannelsActiveId={activeSceneChannelId} onTuneSceneChannel={playSceneChannel} taste={profileTaste} dislikeTaste={profile?.dislikeTaste} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} playlists={libraryPlaylists.filter((pl)=>!isCommunityPlaylist(pl))} preferredGenres={user.genres||[]} userKey={firebaseUser?.uid||""} onOpenSearch={()=>setScreen("search")} onOpenProfile={()=>setScreen("profile")} onOpenLibrary={()=>setScreen("favorites")} onOpenCharts={()=>setScreen("charts")} onOpenMenu={()=>setShowNavDrawer(true)} onOpenPlaylist={(id)=>openStack(id)} onOpenAlbum={(slug)=>openAlbum(slug)}/>}
        {screen==="explore"   && !tracksLoading && <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading explore…</div>}><ExploreScreen tracks={tracks} preferredGenres={user.genres||[]} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} userKey={firebaseUser?.uid||""} countdown={countdown} sceneChannelsActiveId={activeSceneChannelId} onPlayTrack={playTrack} onOpenSearch={()=>setScreen("search")} onOpenAlbum={(slug)=>openAlbum(slug)} onOpenCharts={()=>setScreen("charts")} onTuneSceneChannel={playSceneChannel} onListenIntent={(focus)=>{ const next={ genre: focus.genre || null, scene: focus.scene || null }; setListenFocus(next); playRadio(null, createListenIntent({ mixLane, ...next })); }} onOpenMenu={()=>setShowNavDrawer(true)}/></Suspense>}
        {screen==="charts"    && !tracksLoading && <Suspense fallback={<div style={{ padding: 32, color: color.muted, fontFamily: font, fontSize: 15 }}>Loading charts…</div>}><LazyChartsScreen countdown={countdown} tracks={tracks} onPlayTrack={playTrack} onTuneMonthly={playMonthlyChart} onAddToQueue={addTrackToQueue} playlistCtx={playlistCtx} nowPlayingId={currentTrackId} onOpenMenu={()=>setShowNavDrawer(true)}/></Suspense>}
        {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} tracks={tracks} onPlay={(t,pool)=>{ recordRecentSearch(searchQuery); playTrack(t,pool||tracks); }} onListenIntent={(focus)=>{ const next={ genre: focus.genre || null, scene: null }; setListenFocus(next); playRadio(null, createListenIntent({ mixLane, ...next })); }} onLike={toggleLike} playlistCtx={playlistCtx} onOpenArtist={(slug)=>{ recordRecentSearch(searchQuery); openArtist(slug); }} onOpenAlbum={(slug)=>{ recordRecentSearch(searchQuery); openAlbum(slug); }} recentSearches={recentSearches} onPickRecent={(q)=>setSearch(q)} onClearRecent={clearRecentSearches} onBack={()=>setScreen("explore")}/>}
        {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onPlayTrack={(t,pool)=>{setIsRadioMode(false);playTrack(t,pool||tracks);}} onLike={toggleLike} playlistCtx={playlistCtx} userPlaylists={libraryPlaylists} onCreatePlaylist={createPlaylist} onDeletePlaylist={deletePlaylist} onRenamePlaylist={renamePlaylist} onSharePlaylist={sharePlaylistToClub} stackId={stackId} onOpenStack={openStack} onCloseStack={closeStack} onReorderPlaylist={reorderPlaylistTrack} communityMix={communityMix} onOpenMix={()=>communityMix && openMix(communityMix.id)} onCustomMix={openCustomMix} onOpenCharts={()=>setScreen("charts")} onOpenMenu={()=>setShowNavDrawer(true)} showLibraryDestinations preferredGenres={user.genres} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} userKey={firebaseUser?.uid || ""}/>}
        {screen==="mix"       && (
          <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Pulling the plate…</div>}>
          <LazyMixScreen
            mix={activeMix}
            tracks={tracks}
            loading={mixLoading}
            notFound={!mixLoading && !activeMix}
            currentTrack={currentTrack}
           
            onPlayTrack={(t, pool)=>{ setIsRadioMode(false); playTrack(t, pool||tracks); }}
            onBack={goBack}
            onShare={()=>activeMix && sharePlaylistToClub(activeMix)}
            onSaveToLibrary={()=>{
              if (!activeMix) return;
              createPlaylist(activeMix.title || "Saved mix", activeMix.trackIds || []);
            }}
            playlistCtx={playlistCtx}
            onLike={toggleLike}
          />
          </Suspense>
        )}
        {screen==="artist"    && !tracksLoading && (
          <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading…</div>}><LazyArtistPage
            artist={findArtist(tracks, artistSlug)}
            onBack={goBack}
            onPlay={(t, pool) => playTrack(t, pool)}
            onOpenAlbum={(slug) => openAlbum(slug)}
            currentTrack={currentTrack}
           
            onLike={toggleLike}
            playlistCtx={playlistCtx}
          /></Suspense>
        )}
        {screen==="album"     && !tracksLoading && (
          <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading…</div>}><LazyAlbumPage
            album={findAlbum(tracks, albumSlug)}
            onBack={goBack}
            onPlay={(t, pool) => playTrack(t, pool)}
            onOpenArtist={(slug) => openArtist(slug)}
            currentTrack={currentTrack}
           
            onLike={toggleLike}
            playlistCtx={playlistCtx}
          /></Suspense>
        )}
        {screen==="profile"   && (
          <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Opening the club…</div>}>
            <ClubScreen user={user} tracks={tracks} onLogout={logOut} access={access} onSubscribe={handleSubscribe} onOpenPlans={handleOpenPlans} profile={profile} communityMix={communityMix} onOpenMix={communityMix ? ()=>openMix(communityMix.id) : null} onEditGenres={()=>setShowGenreTaste(true)} recentTracks={profile?.recentTracks||[]} signalLabel={signalFlags.getState().label} onPlayTrack={(t,pool)=>{setIsRadioMode(false);playTrack(t,pool||tracks);}} onReplayTour={() => setFeatureTourReplay(true)}/>
          </Suspense>
        )}
        {screen==="admin"     && <AdminScreen tracks={tracks} setTracks={setTracks} tab={adminTab} setTab={setAdminTab} editTrack={editTrack} setEditTrack={setEditTrack} showToast={showToast} userPlaylists={userPlaylists} communityMix={communityMix} onPublishCommunityMix={publishCommunityMixFromPlaylist}/>}
        </ScreenPane>
        </Suspense>
      </div>
      {!immersive && (
        <GlassDock
          screen={screen}
          setScreen={setScreen}
          showAdmin={firebaseUser?.uid === ADMIN_UID}
          track={currentTrack}
         
          onTogglePlay={togglePlay}
          onSkip={handleSkip}
          onPrev={handlePrev}
          onLike={() => currentTrack && toggleLike(currentTrack.id)}
          onDislike={dislikeCurrentTrack}
          onSeek={handleSeek}
          isRadioMode={isRadioMode}
          hypnoPocket={!!hypnoSeed}
          onOpen={() => setImmersive(true)}
          onShowQueue={() => setShowQueue(true)}
          playlistCtx={playlistCtx}
          hidePlayer={hideDockPlayer}
          playsRemaining={playsRemaining}
          access={access}
          onOpenPlans={handleOpenPlans}
        />
      )}
      {homeChatReady && screen === "home" && !immersive && (
        <Suspense fallback={null}>
          <LazyHomeMessenger
            variant="mobile"
            uid={firebaseUser?.uid || null}
            displayName={profile?.displayName || profile?.username || firebaseUser?.displayName || "Listener"}
            nowPlaying={currentTrack}
            hasDockPlayer={!!currentTrack && !hideDockPlayer}
          />
        </Suspense>
      )}
      {boothPlayer}
      {listeningOverlays}
      <Suspense fallback={null}>
      <MobileNavDrawer
        open={showNavDrawer}
        onClose={() => setShowNavDrawer(false)}
        screen={screen}
        buildingSet={showRouteBuilder}
        onNavigate={setScreen}
        onBuildSet={openCustomMix}
        user={user}
        showAdmin={firebaseUser?.uid === ADMIN_UID}
      />
      </Suspense>
    </div>
  );

  // ── Mobile: render as-is ─────────────────────────────────────────────────
  if (!isDesktop) return innerApp;

  // ── Desktop: 3-column shell (iTunes-style source list) ───────────────────
  const recentTracks = [...tracks].slice(0, 6);

  // Build queue/next-up from current context
  const queueSource = queue?.length ? queue : tracks.filter(t => t.id !== currentTrack?.id && (t.duration||0) <= 900);
  const nextUpTracks = isRadioMode
    ? queueSource.filter(t => {
        if (!currentTrack) return true;
        return camelotCompatible(currentTrack.camelot, t.camelot);
      }).slice(0, 8)
    : queueSource.slice(0, 8);

  // Accent glow color from current track
  const glowRgb = currentTrack ? hexToRgbStr(currentTrack.color) : "42,46,56";

  return (
    <div style={{ display:"flex", height:"100dvh", background: color.canvas, overflow:"hidden", fontFamily: font }}>

      {/* ── LEFT SOURCE LIST (iTunes-style) ───────────────────────────── */}
      <Suspense fallback={null}>
      <AppSidebar
        screen={screen}
        buildingSet={showRouteBuilder}
        onNavigate={setScreen}
        onBuildSet={openCustomMix}
        user={user}
        showAdmin={firebaseUser?.uid === ADMIN_UID}
      />
      </Suspense>

      {/* ── MAIN CONTENT — full width ─────────────────────────────────── */}
      <div ref={contentScrollRef} onScroll={rememberScroll} style={{ flex:1, overflow:"auto", position:"relative" }}>
        <>
        {/* Accent glow behind content */}
        {currentTrack && <div style={{ position:"absolute", top:0, right:0, width:"40%", height:"30%", background:`radial-gradient(ellipse at 80% 0%, rgba(${glowRgb},0.07) 0%, transparent 70%)`, pointerEvents:"none", zIndex:0 }}/>}
        <div style={{
          position:"relative", zIndex:1,
          maxWidth: (screen==="home" || screen==="explore" || screen==="charts" || screen==="favorites" || screen==="artist" || screen==="album") ? "none" : 960,
          margin:"0 auto",
          padding: (screen==="home" || screen==="explore" || screen==="charts" || screen==="favorites" || screen==="artist" || screen==="album")
            ? `0 0 ${currentTrack && !(screen === "home" && homeStageVisible) ? 120 : 24}px`
            : `24px 32px ${currentTrack && !(screen === "home" && homeStageVisible) ? 120 : 24}px`,
        }}>
          <BgMist color={currentTrack?.color}/>
          <Pulse track={currentTrack}/>
          {ambientStatus}
          {toast && <ToastEl msg={toast} onDismiss={()=>setToast(null)}/>}
          {tracksLoading && screen !== "home" ? (
            <>
              <div className="sr-only" role="status">Loading your catalog…</div>
              <CatalogSkeleton/>
            </>
          ) : (
            <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading…</div>}>
            <ScreenPane key={screen === "artist" ? `artist:${artistSlug}` : screen === "album" ? `album:${albumSlug}` : screen === "mix" ? `mix:${mixId}` : screen}>
              {screen==="home"      && <HomeScreen catalogLoading={tracksLoading} tracks={tracks} onPlayRadio={playRadio} onTogglePlay={togglePlay} onPlayTrack={playTrack} onLike={toggleLike} isRadioMode={isRadioMode} hypnoPocket={!!hypnoSeed} playlistCtx={playlistCtx} mixLane={mixLane} radioPreview={heroPreview} radioNext={setNext} onSkipRadio={handleSkip} onPrevRadio={handlePrev} onOpenPlayer={()=>setImmersive(true)} catalogError={tracksLoadError} onRetryCatalog={reloadCatalog} onStageVisibilityChange={onHomeStageVisibilityChange} onSeek={handleSeek} countdown={countdown} onTuneCountdown={tuneCountdown} daypart={activeDaypart} tickerText={stationTicker} onDislike={dislikeCurrentTrack} onDedicate={()=>setShowDedicate(true)} dedicationFlash={dedicationFlash} onClearDedication={()=>setDedicationFlash(null)} airing={liveAiring} programGuide={programGuide} activeShowId={activeShowId} onTuneShow={playShow} showBumper={showBumper} channelShow={liveShow} sceneChannelsActiveId={activeSceneChannelId} onTuneSceneChannel={playSceneChannel} taste={profileTaste} dislikeTaste={profile?.dislikeTaste} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} playlists={libraryPlaylists.filter((pl)=>!isCommunityPlaylist(pl))} preferredGenres={user.genres||[]} userKey={firebaseUser?.uid||""} onOpenSearch={()=>setScreen("search")} onOpenProfile={()=>setScreen("profile")} onOpenLibrary={()=>setScreen("favorites")} onOpenCharts={()=>setScreen("charts")} onOpenPlaylist={(id)=>openStack(id)} onOpenAlbum={(slug)=>openAlbum(slug)}/>}
              {screen==="explore"   && <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading explore…</div>}><ExploreScreen tracks={tracks} preferredGenres={user.genres||[]} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} userKey={firebaseUser?.uid||""} countdown={countdown} sceneChannelsActiveId={activeSceneChannelId} onPlayTrack={playTrack} onOpenSearch={()=>setScreen("search")} onOpenAlbum={(slug)=>openAlbum(slug)} onOpenCharts={()=>setScreen("charts")} onTuneSceneChannel={playSceneChannel} onListenIntent={(focus)=>{ const next={ genre: focus.genre || null, scene: focus.scene || null }; setListenFocus(next); playRadio(null, createListenIntent({ mixLane, ...next })); }}/></Suspense>}
              {screen==="charts"    && <Suspense fallback={<div style={{ padding: 32, color: color.muted, fontFamily: font, fontSize: 15 }}>Loading charts…</div>}><LazyChartsScreen countdown={countdown} tracks={tracks} onPlayTrack={playTrack} onTuneMonthly={playMonthlyChart} onAddToQueue={addTrackToQueue} playlistCtx={playlistCtx} nowPlayingId={currentTrackId}/></Suspense>}
              {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} tracks={tracks} onPlay={(t,pool)=>{ recordRecentSearch(searchQuery); playTrack(t,pool||tracks); }} onListenIntent={(focus)=>{ const next={ genre: focus.genre || null, scene: null }; setListenFocus(next); playRadio(null, createListenIntent({ mixLane, ...next })); }} onLike={toggleLike} playlistCtx={playlistCtx} onOpenArtist={(slug)=>{ recordRecentSearch(searchQuery); openArtist(slug); }} onOpenAlbum={(slug)=>{ recordRecentSearch(searchQuery); openAlbum(slug); }} recentSearches={recentSearches} onPickRecent={(q)=>setSearch(q)} onClearRecent={clearRecentSearches} onBack={()=>setScreen("explore")}/>}
              {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onPlayTrack={(t,pool)=>{setIsRadioMode(false);playTrack(t,pool||tracks);}} onLike={toggleLike} playlistCtx={playlistCtx} userPlaylists={libraryPlaylists} onCreatePlaylist={createPlaylist} onDeletePlaylist={deletePlaylist} onRenamePlaylist={renamePlaylist} onSharePlaylist={sharePlaylistToClub} stackId={stackId} onOpenStack={openStack} onCloseStack={closeStack} onReorderPlaylist={reorderPlaylistTrack} communityMix={communityMix} onOpenMix={()=>communityMix && openMix(communityMix.id)} onCustomMix={openCustomMix} preferredGenres={user.genres} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} userKey={firebaseUser?.uid || ""}/>}
              {screen==="mix"       && (
                <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Pulling the plate…</div>}>
                <LazyMixScreen
                  mix={activeMix}
                  tracks={tracks}
                  loading={mixLoading}
                  notFound={!mixLoading && !activeMix}
                  currentTrack={currentTrack}
                 
                  onPlayTrack={(t, pool)=>{ setIsRadioMode(false); playTrack(t, pool||tracks); }}
                  onBack={goBack}
                  onShare={()=>activeMix && sharePlaylistToClub(activeMix)}
                  onSaveToLibrary={()=>{
                    if (!activeMix) return;
                    createPlaylist(activeMix.title || "Saved mix", activeMix.trackIds || []);
                  }}
                        playlistCtx={playlistCtx}
                  onLike={toggleLike}
                />
                </Suspense>
              )}
              {screen==="artist"    && (
                <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading…</div>}><LazyArtistPage
                  artist={findArtist(tracks, artistSlug)}
                  onBack={goBack}
                  onPlay={(t, pool) => playTrack(t, pool)}
                  onOpenAlbum={(slug) => openAlbum(slug)}
                  currentTrack={currentTrack}
                 
                  onLike={toggleLike}
                              playlistCtx={playlistCtx}
                /></Suspense>
              )}
              {screen==="album"     && (
                <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading…</div>}><LazyAlbumPage
                  album={findAlbum(tracks, albumSlug)}
                  onBack={goBack}
                  onPlay={(t, pool) => playTrack(t, pool)}
                  onOpenArtist={(slug) => openArtist(slug)}
                  currentTrack={currentTrack}
                 
                  onLike={toggleLike}
                              playlistCtx={playlistCtx}
                /></Suspense>
              )}
              {screen==="profile"   && (
                <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Opening the club…</div>}>
                  <ClubScreen user={user} tracks={tracks} onLogout={logOut} access={access} onSubscribe={handleSubscribe} onOpenPlans={handleOpenPlans} profile={profile} communityMix={communityMix} onOpenMix={communityMix ? ()=>openMix(communityMix.id) : null} onEditGenres={()=>setShowGenreTaste(true)} recentTracks={profile?.recentTracks||[]} signalLabel={signalFlags.getState().label} onPlayTrack={(t,pool)=>{setIsRadioMode(false);playTrack(t,pool||tracks);}} onReplayTour={() => setFeatureTourReplay(true)}/>
                </Suspense>
              )}
              {screen==="admin"     && <AdminScreen tracks={tracks} setTracks={setTracks} tab={adminTab} setTab={setAdminTab} editTrack={editTrack} setEditTrack={setEditTrack} showToast={showToast} userPlaylists={userPlaylists} communityMix={communityMix} onPublishCommunityMix={publishCommunityMixFromPlaylist}/>}
            </ScreenPane>
            </Suspense>
          )}
        </div>
        </>
        {/* Desktop mini-player — sticky when Cover Stage scrolls away on Home */}
        {currentTrack && !immersive && !(screen === "home" && homeStageVisible) && (
          <Suspense fallback={null}>
          <DesktopMiniPlayer
            track={currentTrack}
           
            isRadioMode={isRadioMode}
            onOpen={() => setImmersive(true)}
            onTogglePlay={togglePlay}
            onSkip={handleSkip}
            onLikeToggle={onLikeToggle}
            onDislike={dislikeCurrentTrack}
            onSeek={handleSeek}
            playsRemaining={playsRemaining}
            access={access}
            onOpenPlans={handleOpenPlans}
          />
          </Suspense>
        )}
      </div>

      {/* ── RIGHT PANEL: queue on non-Home; Home uses ice chat instead ─ */}
      {screen !== "home" ? (
      <div className="hide-scroll" style={{
        width: 336,
        flexShrink: 0,
        background: `
          linear-gradient(180deg, rgba(40,45,53,0.82) 0%, rgba(27,31,37,0.5) 100%),
          ${color.surfaceRaised}
        `,
        borderLeft: `1px solid ${glass.border}`,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        position: "relative",
      }}>
        {/* Soft top sheen */}
        <div aria-hidden="true" style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(46,51,60,0.88), transparent)",
          pointerEvents: "none",
          zIndex: 2,
        }}/>

        {/* Queue — list only; album art lives on the home stage / player */}
        <div style={{ flex: 1, padding: "22px 12px 24px", display: "flex", flexDirection: "column" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            padding: "0 8px 14px",
          }}>
            <div>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                color: color.faint,
                fontFamily: fontMono,
                marginBottom: 4,
              }}>
                Queue
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 650,
                letterSpacing: -0.25,
                color: color.ink,
                fontFamily: fontDisplay,
              }}>
                Up Next
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                type="button"
                className="sidebar-ghost-btn"
                onClick={() => {
                  const pool = tracks.filter((t) => t.id !== currentTrack?.id && (t.duration || 0) <= 900);
                  const shuffled = [...pool];
                  for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                  }
                  setQueue(shuffled.slice(0, 8));
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: color.muted,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  fontFamily: fontMono,
                }}
              >
                Shuffle
              </button>
              {queue.length > 0 && (
                <button
                  type="button"
                  className="sidebar-ghost-btn"
                  onClick={() => setQueue([])}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: color.muted,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    fontFamily: fontMono,
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Continuous premium list — no boxed cards */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {nextUpTracks.map((t, i) => {
              const active = currentTrack?.id === t.id;
              return (
                <div
                  key={t.id}
                  className="sidebar-queue-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 8px",
                    borderRadius: 8,
                    background: active ? color.select : "transparent",
                    position: "relative",
                  }}
                >
                  {active && (
                    <div aria-hidden="true" style={{
                      position: "absolute",
                      left: 0,
                      top: 10,
                      bottom: 10,
                      width: 2,
                      borderRadius: 1,
                      background: color.accent,
                    }}/>
                  )}

                  <div style={{
                    width: 18,
                    fontSize: 10,
                    fontWeight: 500,
                    color: active ? color.ink : color.faint,
                    textAlign: "center",
                    flexShrink: 0,
                    fontFamily: fontMono,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  <div
                    onClick={() => playTrack(t, tracks)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      flex: 1,
                      minWidth: 0,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 5,
                      overflow: "hidden",
                      flexShrink: 0,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                      outline: active ? `1px solid ${color.accentSoft}` : "1px solid transparent",
                      background: color.surfaceRaised,
                    }}>
                      {t.albumCover ? (
                        <CoverImage src={t.albumCover} alt="" width={40} height={40} />
                      ) : (
                        <img
                          src="/covers/default.jpg"
                          alt=""
                          width={40}
                          height={40}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12.5,
                        fontWeight: active ? 600 : 500,
                        color: color.ink,
                        letterSpacing: -0.15,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontFamily: fontDisplay,
                      }}>
                        {t.title}
                      </div>
                      <div style={{
                        marginTop: 2,
                        fontSize: 11,
                        color: color.muted,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.artist}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="sidebar-queue-actions"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flexShrink: 0,
                      opacity: 0.28,
                      transition: `opacity ${motion.base} ${motion.ease}`,
                    }}
                  >
                    {!isRadioMode && (
                      <>
                        <button
                          type="button"
                          aria-label="Move up"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (i > 0) {
                              const nq = [...nextUpTracks];
                              [nq[i - 1], nq[i]] = [nq[i], nq[i - 1]];
                              setQueue(nq);
                            }
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: i > 0 ? "pointer" : "default",
                            padding: 3,
                            opacity: i > 0 ? 1 : 0,
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={color.ink} strokeWidth="1.5" strokeLinecap="round"><path d="M3 7L6 4L9 7"/></svg>
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (i < nextUpTracks.length - 1) {
                              const nq = [...nextUpTracks];
                              [nq[i], nq[i + 1]] = [nq[i + 1], nq[i]];
                              setQueue(nq);
                            }
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: i < nextUpTracks.length - 1 ? "pointer" : "default",
                            padding: 3,
                            opacity: i < nextUpTracks.length - 1 ? 1 : 0,
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={color.ink} strokeWidth="1.5" strokeLinecap="round"><path d="M3 5L6 8L9 5"/></svg>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      aria-label="Remove from queue"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQueue(() => {
                          const nq = [...nextUpTracks];
                          nq.splice(i, 1);
                          return nq;
                        });
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 3,
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={color.ink} strokeWidth="1.5" strokeLinecap="round"><path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {nextUpTracks.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "40px 12px",
              color: color.faint,
              fontSize: 12,
              letterSpacing: -0.1,
            }}>
              Queue is clear
              <div style={{
                marginTop: 6,
                fontSize: 10,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                fontFamily: fontMono,
                opacity: 0.7,
              }}>
                Shuffle to fill it
              </div>
            </div>
          )}
        </div>
      </div>
      ) : null}

      {homeChatReady && screen === "home" && (
        <Suspense fallback={null}>
          <LazyHomeMessenger
            variant="desktop"
            uid={firebaseUser?.uid || null}
            displayName={profile?.displayName || profile?.username || firebaseUser?.displayName || "Listener"}
            nowPlaying={currentTrack}
          />
        </Suspense>
      )}

      {/* Listening overlays + Booth */}
      {listeningOverlays}
      {boothPlayer}
    </div>
  );

  function onLikeToggle() { if(currentTrack) toggleLike(currentTrack.id); }
}

