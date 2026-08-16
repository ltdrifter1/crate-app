import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate, useLocation }                 from "react-router-dom";
import { useAuth }                                  from "./useAuth";
import { toggleLike as fbToggleLike, recordPlay, completeOnboarding, saveTasteProfile } from "./useUserData";
import { collection, addDoc } from "firebase/firestore";
import { db }                                       from "./firebase";
import {
  font, fontDisplay, fontMono, color, chrome, radius, motion,
  glass, glassControl, homeSpace, dock, sectionRule,
  artShadow, aluminumGradient, chromeFrame,
  APP_STYLE, INPUT_ST, BTN_PRIMARY, BTN_SECONDARY, CTRL_BTN, ADMIN_UID, y2k,
  BRAND_NAME, brandStoragePrefix,
} from "./theme";
import Icon from "./components/ui/Icon";
import BottomNavigation from "./components/home/BottomNavigation";
import CoverImage from "./components/ui/CoverImage";
import VirtualList from "./components/ui/VirtualList";
import { AlbumArt } from "./components/listen/AlbumArt";
import { TrackActionsMenu, TrackMoreButton, TrackRow, useTrackMenu } from "./components/listen/TrackRow";
import { IceOrbPlay, OrbitalArtRing, OrbitalPlayControl } from "./components/player/OrbitalControls";
import { camelotCompatible, getEnergyRangeForHour, fmtTime, hexToRgbStr } from "./lib/harmony";
import {
  computeHumanState, findResonant, computeSignalTraits, pickNextTrack,
  buildSession, buildRoute, SESSION_PROFILES,
} from "./lib/engine";
import { mixLaneForDate } from "./lib/mixLanes";
import { parsePath, buildPath, documentTitleFor } from "./lib/routes";
import { explainPick } from "./lib/explain";
import { fetchCatalogTracks, isCatalogCacheFresh, readCatalogIdb, writeCatalogIdb } from "./lib/catalogLoad";
import { slugify, findArtist, findAlbum, searchEntities } from "./lib/catalog";
import {
  enrichTracksWithScenes,
  displaySceneLabel,
  trackMatchesScene,
  matchSceneFromText,
} from "./lib/scenes";
import {
  resolveListenPool,
  listenPoolLabel,
  createListenIntent,
} from "./lib/listenPool";
import { EnergyShiftFeedback, EnergyShiftModeChip, EnergyShiftControl } from "./components/listen/EnergyShiftButton";
import { playerEnergyStore } from "./lib/playerEnergyStore";
import LinerNotesSheet from "./components/catalog/LinerNotesSheet";
import {
  getAccessState,
  BILLING,
} from "./lib/entitlements";
import { startCheckout, readBillingQuery } from "./lib/billing";
import {
  canPlayOnFreeTier,
  bumpPlayMeter,
  freePlaysRemaining,
} from "./lib/freePlays";
import FreePlaysMeter from "./components/billing/FreePlaysMeter";
import { spendClubCredit } from "./lib/listeningApi";
import { usableCreditBalance } from "./lib/clubCredit";
import { memberPrice } from "./lib/physicalStatus";
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
import BrandMark, { BrandLockup } from "./components/brand/BrandMark";
import BrandTagline from "./components/brand/BrandTagline";
import GenreTasteSheet from "./components/listen/GenreTasteSheet";
import GenreTasteOnboarding from "./components/onboarding/GenreTasteOnboarding";
import { vibeForMixLane, blendPoolForSession } from "./lib/taste";
import {
  buildCountdown,
  hasRequestedToday,
  markRequestedToday,
  stationDaypart,
} from "./lib/station";
import {
  DedicateSheet,
  DedicationFlash,
  HypnoVisualizer,
  LowerThird,
  ChannelBug,
  OnAirBadge,
  StationHeatBar,
  StationTicker,
  UpNextBumper,
  useStationFeed,
} from "./components/station/StationChrome";
import CountdownRail from "./components/station/CountdownRail";
import {
  HostCreditChip,
  useLiveAiring,
} from "./components/station/ShowGuide";
import VideoStage, { VideoBadge } from "./components/station/VideoStage";
import StationBumper from "./components/station/StationBumper";
import SceneSurfRail from "./components/station/SceneSurfRail";
import {
  buildShowPool,
  getShowById,
  pickShowBumper,
  resolveShowAt,
} from "./lib/shows";
import { ensureTodayChart, buildMonthlyChart, chartScopeLabel } from "./lib/chartHistory";
import {
  buildSceneChannelPool,
  getSceneChannel,
} from "./lib/sceneChannels";
import { pickTrackBumper } from "./lib/bumpers";
import { trackHasVideo } from "./lib/video";
import { playbackClock, usePlayerPlayback } from "./usePlayerPlayback";
import { playerPlaybackStore } from "./lib/playerPlaybackStore";
import DesktopMiniPlayer from "./components/player/DesktopMiniPlayer";
import PlaybackProgressHairline from "./components/player/PlaybackProgressHairline";
import {
  transportFlags,
  useIsBuffering,
  useCurrentTrack,
  useIsPlaying,
  useTransportTrackId,
} from "./usePlayerTransport";
import { signalFlags } from "./usePlayerSignal";

const SplashScreen = lazy(() => import("./components/brand/SplashScreen"));
const LoginScreen = lazy(() => import("./components/auth/LoginScreen"));
const ClubScreen = lazy(() => import("./components/club/ClubScreen"));
const LazyMixScreen = lazy(() => import("./components/club/MixScreen"));
const LazyPaywallScreen = lazy(() => import("./components/billing/PaywallScreen"));
const LazyImmersivePlayer = lazy(() => import("./components/player/ImmersivePlayer"));
const LazyChartsScreen = lazy(() => import("./components/station/ChartsScreen"));
const HomeScreen = lazy(() => import("./screens/HomeScreen"));
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

const injectStyles = () => {
  if (document.getElementById("rooms-app-global-styles")) return;
  const s = document.createElement("style");
  s.id = "rooms-app-global-styles";
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
      background:
        radial-gradient(ellipse 110% 65% at 50% -18%, rgba(101,230,255,0.045) 0%, transparent 55%),
        radial-gradient(ellipse 70% 45% at 100% 110%, rgba(123,167,255,0.04) 0%, transparent 50%),
        var(--canvas);
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
    .flask-taste-btn.is-active .flask-steam {
      animation-play-state: running;
    }
    .flask-taste-btn.is-active .flask-bubble,
    .flask-taste-btn.is-active .flask-steam {
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
      border: 1px solid ${glass.border};
      box-shadow:
        inset 0 1px 0 ${glass.highlight},
        inset 0 -1px 0 rgba(0, 0, 0, 0.35),
        0 18px 48px rgba(0, 0, 0, 0.55),
        0 4px 12px rgba(0, 0, 0, 0.35);
      -webkit-backdrop-filter: ${glass.blurHeavy};
      backdrop-filter: ${glass.blurHeavy};
      transition: background 0.6s ease, box-shadow 0.35s ease;
    }
    /* ── Premium Home kit ─────────────────────────────────────────────── */
    .pill-nav {
      background: ${glass.fillHeavy};
      border: 1px solid ${glass.border};
      box-shadow:
        inset 0 1px 0 ${glass.highlight},
        inset 0 -1px 0 rgba(0, 0, 0, 0.35),
        0 18px 48px rgba(0, 0, 0, 0.55),
        0 4px 12px rgba(0, 0, 0, 0.35);
      -webkit-backdrop-filter: ${glass.blurHeavy};
      backdrop-filter: ${glass.blurHeavy};
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
      filter: brightness(1.05);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.72),
        inset 0 -1px 0 rgba(0,0,0,0.2),
        0 0 0 1px rgba(101,230,255,0.18),
        0 8px 20px rgba(0,0,0,0.4) !important;
    }
    .pmp-tune-key:active {
      transform: translateY(1px) scale(0.985);
      filter: brightness(0.96);
      box-shadow:
        inset 0 2px 4px rgba(0,0,0,0.28),
        inset 0 1px 0 rgba(0,0,0,0.12) !important;
    }
    .pmp-tune-key--locked:hover {
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.14),
        0 0 20px rgba(101,230,255,0.18) !important;
    }
    .pmp-schedule-cell:hover {
      border-color: rgba(101,230,255,0.32) !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.14),
        0 0 14px rgba(101,230,255,0.08),
        0 6px 16px rgba(0,0,0,0.34) !important;
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
    .pmp-hero:hover .pmp-hero-art { transform: scale(1.025); }
    .pmp-view-all { transition: color ${motion.fast} ${motion.ease}, transform ${motion.fast} ${motion.ease}; }
    .pmp-view-all:hover { color: #A9C4FF !important; transform: translateX(1px); }
    .pmp-rail { cursor: grab; }
    .pmp-rail:active { cursor: grabbing; }
    .pmp-ticket-holo {
      background-size: 220% 220%;
      animation: pmpTicketHolo 7.5s ease-in-out infinite;
    }
    .pmp-ticket-shell--live .pmp-ticket-holo {
      animation-duration: 4.8s;
    }
    @keyframes pmpTicketHolo {
      0% { background-position: 0% 40%; opacity: 0.45; }
      50% { background-position: 100% 60%; opacity: 0.85; }
      100% { background-position: 0% 40%; opacity: 0.45; }
    }
    @media (prefers-reduced-motion: reduce) {
      .pmp-ticket-holo { animation: none !important; opacity: 0.55 !important; }
    }
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
      background: ${color.accentSoft} !important;
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
  document.head.appendChild(s);
};
injectStyles();


// Engine helpers imported from ./lib/harmony + ./lib/engine

function EnergyBar({ level, size="sm" }) {
  const h = size==="lg" ? [8,10,12,10,8,12,10,8,12,10] : [5,6,7,6,5,7,6,5,7,6];
  return (
    <div style={{ display:"flex", gap:size==="lg"?3:2, alignItems:"center" }}>
      {h.map((ht,i) => (
        <div key={i} style={{
          width: size==="lg"?4:2.5, height:ht,
          borderRadius:2,
          background: i < level ? color.accent : "rgba(255,255,255,0.12)",
          transition:"background 0.2s",
        }}/>
      ))}
    </div>
  );
}

// ─── ICONS → components/ui/Icon.jsx (Lucide + TimedMixMark) ───────────────────

// AlbumArt and VinylRecord → components/listen/AlbumArt.jsx
// ─── Booth HUD — BPM / key / energy ───────────────────────────────────────────
function BoothHud({ track, size = "md", align = "left" }) {
  if (!track) return null;
  const bpm = track.bpm ? String(track.bpm) : "—";
  const key = track.camelot || "—";
  const energy = track.energy != null ? String(track.energy) : "—";
  const big = size === "lg";
  const compact = size === "sm";
  if (compact) {
    return (
      <div style={{
        fontFamily: fontMono, fontVariantNumeric:"tabular-nums",
        fontSize:10, letterSpacing:0.6, color: color.accent, fontWeight:600,
      }}>
        {bpm}<span style={{ color: color.faint }}> BPM</span>
        <span style={{ color: color.faint }}>  ·  </span>
        {key}
        <span style={{ color: color.faint }}>  ·  E</span>{energy}
      </div>
    );
  }
  const cells = [
    { label: "BPM", value: bpm },
    { label: "KEY", value: key },
    { label: "NRG", value: energy },
  ];
  return (
    <div style={{
      display:"flex", gap: big ? 22 : 14,
      justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
      fontFamily: fontMono, fontVariantNumeric:"tabular-nums",
    }}>
      {cells.map(c => (
        <div key={c.label} style={{ textAlign: align === "right" ? "right" : "left" }}>
          <div style={{
            fontSize: big ? 10 : 9, letterSpacing:1.6, color: color.faint,
            textTransform:"uppercase", marginBottom:4, fontWeight:600,
          }}>{c.label}</div>
          <div style={{
            fontSize: big ? 28 : 15, fontWeight:600, color: color.accent,
            letterSpacing: big ? -0.5 : 0, lineHeight:1,
          }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// Shared orbital controls → components/player/OrbitalControls.jsx
function dockTintStyle(track) {
  if (!track?.color) return undefined;
  const rgb = hexToRgbStr(track.color);
  return {
    background: `
      linear-gradient(165deg, rgba(${rgb},0.18) 0%, rgba(${rgb},0.06) 36%, rgba(18,20,24,0.92) 78%),
      ${glass.fillHeavy}
    `,
  };
}

// ─── RADIO — Listen Now hero (one composition) ────────────────────────────────
/**
 * Animated planet mark — looping ring + satellite (GIF-like via CSS).
 * Hero brand signal — sits in the background behind controls.
 * Fills its parent; `night` warms the palette, `playing` quickens the breath.
 * Optional `progress` (0–1) paints an ice arc on the outer orbit; `tintRgb`
 * softly colors the glow from the current track.
 */
function OrbitingPlanet({ playing = false, night = false, progress = 0, tintRgb = null }) {
  // Cool platinum daytime; soft amber at night — track tint blends in when live.
  const baseRgb = night ? "200,170,120" : "42,46,56";
  const glowRgb = tintRgb || baseRgb;
  const ringAlpha = night ? 0.35 : 0.4;
  const pct = Math.max(0, Math.min(1, progress || 0));

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        perspective: 900,
        animation: playing
          ? "planetBreathe 3.6s ease-in-out infinite"
          : "planetBreathe 5.5s ease-in-out infinite",
      }}
    >
      <div style={{
        position: "absolute",
        inset: "8%",
        borderRadius: "50%",
        background: `
          radial-gradient(circle at 38% 32%, rgba(${glowRgb},${night ? 0.14 : 0.18}) 0%, transparent 42%),
          radial-gradient(circle at 50% 50%, rgba(${glowRgb},0.08) 0%, transparent 68%)
        `,
        filter: "blur(2px)",
        transition: "background 1.5s ease",
      }}/>

      <div style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "42%",
        height: "42%",
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: night
          ? `radial-gradient(circle at 34% 28%, #C8B8A0 0%, #8A7A68 48%, #4A4038 100%)`
          : `radial-gradient(circle at 30% 24%, #D8DEE8 0%, #9AA3B0 46%, #5A6574 100%)`,
        boxShadow: `
          inset -8px -10px 22px rgba(26,29,36,0.28),
          inset 8px 10px 18px rgba(${glowRgb},${night ? 0.1 : 0.14}),
          0 8px 28px rgba(26,29,36,0.14)
        `,
        transition: "background 1.5s ease, box-shadow 1.5s ease",
      }}>
        <div style={{
          position: "absolute",
          left: "12%", right: "12%", top: "42%",
          height: "14%",
          borderRadius: "50%",
          background: `linear-gradient(90deg, transparent, rgba(${glowRgb},0.16), transparent)`,
          opacity: 0.7,
        }}/>
      </div>

      <div style={{
        position: "absolute",
        left: "4%",
        top: "33%",
        width: "92%",
        height: "34%",
        transformStyle: "preserve-3d",
        animation: "planetTiltSpin 18s linear infinite",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `1.5px solid rgba(${glowRgb},${ringAlpha})`,
          boxShadow: `
            0 0 12px rgba(${glowRgb},0.22),
            inset 0 0 12px rgba(${glowRgb},0.08)
          `,
          transition: "border-color 1.5s ease, box-shadow 1.5s ease",
        }}/>
        <div style={{
          position: "absolute",
          left: "6%", right: "6%", top: "18%", bottom: "18%",
          borderRadius: "50%",
          border: `1px solid rgba(${glowRgb},0.18)`,
        }}/>
        <div style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: 7,
          height: 7,
          marginTop: -3.5,
          marginLeft: -3.5,
          borderRadius: "50%",
          background: night && !tintRgb ? chrome.signal : color.accent,
          animation: "orbitPulse 2.4s ease-in-out infinite",
          boxShadow: tintRgb ? `0 0 12px rgba(${glowRgb},0.55)` : undefined,
        }}/>
      </div>

      <div style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "108%",
        height: "108%",
        marginLeft: "-54%",
        marginTop: "-54%",
        borderRadius: "50%",
        border: `1px dashed rgba(${glowRgb},0.08)`,
        animation: "planetRing 90s linear infinite",
      }}/>

      {/* Track progress arc on the outer orbit — listening lives in the planet */}
      {pct > 0 && (
        <svg
          viewBox="0 0 100 100"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "112%",
            height: "112%",
            marginLeft: "-56%",
            marginTop: "-56%",
            transform: "rotate(-90deg)",
            pointerEvents: "none",
          }}
        >
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke={`rgba(${glowRgb},0.12)`}
            strokeWidth="1.2"
          />
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke={color.accent}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray={`${pct * 289} ${289}`}
            style={{ transition: "stroke-dasharray 0.35s linear" }}
          />
        </svg>
      )}
    </div>
  );
}

// CoverStage → components/station/CoverStage.jsx

// Track menu and row → components/listen/TrackRow.jsx

const SectionLabel = ({ children, style={} }) => (
  <div style={{ fontSize:13, fontWeight:650, letterSpacing:-0.2, color: color.ink, marginBottom:12, fontFamily: fontDisplay, ...style }}>{children}</div>
);

function BrandGlyph({ size = 40, light = false, showWordmark }) {
  // Compact chrome: door glyph only. Larger moments keep the wordmark.
  const withWord = showWordmark ?? size >= 36;
  return <BrandMark size={size} light={light} showWordmark={withWord} />;
}

/** Soft enter for tab / route changes — respects reduced-motion via global CSS.
 *  Put `key={screen}` on the call site so React remounts and replays the animation. */
function ScreenPane({ children }) {
  return (
    <div
      style={{
        minHeight: "100%",
        animation: `screenIn 0.38s ${motion.ease} both`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Large title that collapses into a sticky compact bar on scroll.
 * Finds the nearest overflow scroll parent so it works in mobile + desktop shells.
 */
// CollapsingHeader → components/layout/CollapsingHeader.jsx

function contentPadBottom(hasPlayer) {
  const base = hasPlayer ? dock.clearPlayer : dock.clearTabs;
  return `calc(${base}px + env(safe-area-inset-bottom, 0px))`;
}

// ─── BUILD A SET — pick a length → energy arc runs in the background ─────────
function SessionBuilderModal({ tracks, onClose, onPlayRoute, onSavePlaylist = null, initialActivity = null, intentLabel = null }) {
  // 1 length → 2 vibe → 3 preview
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(60);
  const autoActivity = initialActivity && SESSION_PROFILES[initialActivity]
    ? initialActivity
    : "drive";
  const [activity, setActivity] = useState(autoActivity);
  const [session, setSession] = useState(null);
  const [savedToLibrary, setSavedToLibrary] = useState(false);

  const profile = SESSION_PROFILES[activity] || SESSION_PROFILES.drive;
  const totalMins = session ? Math.round(session.reduce((s, t) => s + (t.duration || 210), 0) / 60) : 0;
  const vibeEntries = Object.entries(SESSION_PROFILES);

  const phases = session ? (() => {
    const groups = [];
    let current = null;
    session.forEach((t) => {
      if (!current || current.name !== t._phase) {
        current = { name: t._phase, tracks: [] };
        groups.push(current);
      }
      current.tracks.push(t);
    });
    return groups;
  })() : [];

  function handleContinueFromLength() {
    setStep(2);
  }

  function handleGenerate() {
    const act = activity && SESSION_PROFILES[activity] ? activity : autoActivity;
    setActivity(act);
    setSession(buildSession(tracks, duration, act));
    setSavedToLibrary(false);
    setStep(3);
  }

  function handleRegenerate() {
    setSession(buildSession(tracks, duration, activity || autoActivity));
    setSavedToLibrary(false);
  }

  const durationLabel = duration < 60 ? `${duration} min` : duration === 60 ? "1 hour" : `${duration / 60} hours`;
  const stepLabel = step === 1 ? "Length" : step === 2 ? "Vibe" : "Preview";

  function handleSaveToLibrary() {
    if (!onSavePlaylist || !session?.length || savedToLibrary) return;
    const name = `${profile.label} · ${durationLabel}`;
    onSavePlaylist(name, session.map((t) => t.id));
    setSavedToLibrary(true);
  }

  const softChip = (selected) => ({
    borderRadius: 980,
    border: selected ? `1px solid rgba(255,255,255,0.35)` : `1px solid rgba(255,255,255,0.1)`,
    background: selected
      ? "rgba(247,248,250,0.96)"
      : "rgba(255,255,255,0.06)",
    color: selected ? color.onAccent : color.body,
    boxShadow: selected ? "0 8px 22px rgba(0,0,0,0.28)" : "none",
    cursor: "pointer",
    fontWeight: 600,
  });

  const softCard = (selected) => ({
    borderRadius: radius.lg,
    border: selected ? `1px solid rgba(255,255,255,0.28)` : `1px solid rgba(255,255,255,0.1)`,
    background: selected
      ? "rgba(247,248,250,0.96)"
      : "rgba(255,255,255,0.05)",
    color: selected ? color.onAccent : color.body,
    boxShadow: selected ? "0 10px 28px rgba(0,0,0,0.28)" : "none",
    cursor: "pointer",
    fontWeight: 600,
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: color.canvas,
      }}/>
      {session?.[0]?.albumCover && (
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, opacity: 0.14,
          backgroundImage: `url(${session[0].albumCover})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(56px) saturate(1.05) brightness(1.12)", transform: "scale(1.08)",
        }}/>
      )}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0,
        background: `
          linear-gradient(180deg, rgba(5,6,8,0.55) 0%, rgba(5,6,8,0.2) 40%, rgba(5,6,8,0.88) 100%),
          radial-gradient(ellipse 70% 45% at 50% 20%, rgba(169,199,228,0.06) 0%, transparent 60%)
        `,
      }}/>

      <div className="hide-scroll" style={{
        position: "relative", zIndex: 1, height: "100%", overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 20px 8px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step > 1 && (
              <button type="button" onClick={() => {
                if (step === 3) { setSession(null); setStep(2); }
                else setStep(1);
              }} style={{
                background: "none", border: "none", color: color.ink,
                fontSize: 17, fontWeight: 500, cursor: "pointer", padding: "6px 0",
              }}>‹ Back</button>
            )}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: 0.2,
            color: color.faint, fontFamily: fontDisplay,
          }}>
            {step} / 3 · {stepLabel}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{
            background: glass.fillStrong, border: `1px solid ${glass.borderSoft}`, borderRadius: radius.md,
            width: 36, height: 36, cursor: "pointer", color: color.muted,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `inset 0 1px 0 ${glass.highlight}`,
            backdropFilter: glass.blurSoft,
            WebkitBackdropFilter: glass.blurSoft,
          }}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: step === 3 ? "flex-start" : "center",
          padding: "12px 20px 40px", maxWidth: 560, margin: "0 auto", width: "100%",
        }}>

          {step === 1 && (
            <div style={{ width: "100%", textAlign: "center", animation: "rise 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
                <div style={{
                fontSize: 12, fontWeight: 550, letterSpacing: 0.15,
                color: color.muted, fontFamily: fontDisplay, marginBottom: 12,
              }}>
                Build a custom mix
              </div>
              <div style={{
                fontSize: 32, fontWeight: 650, color: color.ink, letterSpacing: -0.9,
                marginBottom: 10, fontFamily: fontDisplay,
              }}>How long?</div>
              <p style={{
                margin: "0 auto 32px", maxWidth: 340, fontSize: 15, color: color.body, lineHeight: 1.45,
              }}>
                Pick a length — next you’ll choose the vibe that shapes the energy arc.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 36, flexWrap: "wrap" }}>
                {[
                  { m: 30, label: "30 min" },
                  { m: 60, label: "1 hour" },
                  { m: 120, label: "2 hours" },
                  { m: 240, label: "4 hours" },
                  { m: 480, label: "All night" },
                ].map(({ m, label }) => (
                  <button type="button" key={m} onClick={() => setDuration(m)} style={{
                    minWidth: 88, height: 52, padding: "0 16px",
                    fontSize: 15, ...chromeChip(duration === m),
                  }}>
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={handleContinueFromLength} style={{
                ...BTN_PRIMARY, width: "auto", minWidth: 200, borderRadius: radius.md, padding: "16px 36px",
              }}>
                Choose vibe
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ width: "100%", animation: "rise 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div style={{
                  fontSize: 11, fontWeight: 650, letterSpacing: 1.6, textTransform: "uppercase",
                  color: color.muted, fontFamily: fontMono, marginBottom: 10,
                }}>
                  {durationLabel}
                </div>
                <div style={{
                  fontSize: 32, fontWeight: 700, color: color.ink, letterSpacing: -0.9,
                  marginBottom: 8, fontFamily: fontDisplay,
                }}>
                  What’s the vibe?
                </div>
                <p style={{
                  margin: "0 auto", maxWidth: 360, fontSize: 15, color: color.body, lineHeight: 1.45,
                }}>
                  Activity shapes the energy curve — warm up, peak, chill out — not just a shuffled list.
                </p>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
                gap: 10,
                marginBottom: 28,
              }}>
                {vibeEntries.map(([id, prof]) => {
                  const selected = activity === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActivity(id)}
                      aria-pressed={selected}
                      style={{
                        ...chromeChip(selected),
                        padding: "14px 14px 16px",
                        textAlign: "left",
                        minHeight: 96,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <span style={{
                        fontSize: 15, fontWeight: 700, fontFamily: fontDisplay,
                        letterSpacing: -0.3, lineHeight: 1.15,
                      }}>
                        {prof.label}
                      </span>
                      <span style={{
                        fontSize: 12, lineHeight: 1.35, fontWeight: 500,
                        color: selected ? "rgba(244,246,249,0.72)" : color.muted,
                      }}>
                        {prof.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>

              {profile && (
                <div style={{
                  marginBottom: 24,
                  padding: "14px 16px",
                  borderRadius: radius.lg,
                  border: `1px solid ${glass.borderSoft}`,
                  background: glass.fillStrong,
                  boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                  backdropFilter: glass.blurSoft,
                  WebkitBackdropFilter: glass.blurSoft,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
                    color: color.faint, fontFamily: fontMono, marginBottom: 10,
                  }}>
                    Energy arc · {profile.label}
                  </div>
                  <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 8, marginBottom: 8, background: "rgba(22,24,30,0.08)" }}>
                    {profile.phases.map((ph, i) => (
                      <div key={i} style={{
                        flex: ph.p,
                        background: i % 2
                          ? "rgba(22,24,30,0.45)"
                          : "rgba(22,24,30,0.22)",
                      }}/>
                    ))}
                  </div>
                  <div style={{ display: "flex" }}>
                    {profile.phases.map((ph, i) => (
                      <div key={i} style={{ flex: ph.p, textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: color.faint }}>{ph.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center" }}>
                <button type="button" onClick={handleGenerate} style={{
                  ...BTN_PRIMARY, width: "auto", minWidth: 220, borderRadius: radius.md, padding: "16px 36px",
                }}>
                  Build mix
                </button>
              </div>
            </div>
          )}

          {step === 3 && session && profile && (
            <div style={{ width: "100%", animation: "rise 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
              <div style={{ textAlign: "center", marginBottom: 28, paddingTop: 8 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: color.muted, marginBottom: 8,
                }}>
                  {durationLabel} · {profile.label}
                </div>
                <div style={{
                  fontSize: 32, fontWeight: 700, color: color.ink, letterSpacing: -0.8,
                  marginBottom: 6, fontFamily: fontDisplay,
                }}>
                  Your custom mix
                </div>
                <div style={{ fontSize: 15, color: color.body }}>
                  {session.length} songs · about {totalMins} minutes
                </div>
              </div>

              <div style={{ marginBottom: 24, padding: "0 4px" }}>
                <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 6, marginBottom: 8, background: color.surface }}>
                  {profile.phases.map((ph, i) => (
                    <div key={i} style={{ flex: ph.p, background: i % 2 ? color.accent : color.accentSoft }}/>
                  ))}
                </div>
                <div style={{ display: "flex" }}>
                  {profile.phases.map((ph, i) => (
                    <div key={i} style={{ flex: ph.p, textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: color.faint }}>{ph.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                maxHeight: "42vh", overflowY: "auto", marginBottom: 24, borderRadius: 16,
                background: "rgba(38,43,51,0.82)", border: `1px solid ${glass.border}`, padding: "8px 0",
                boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                backdropFilter: glass.blurSoft,
                WebkitBackdropFilter: glass.blurSoft,
              }}>
                {phases.map((phase, pi) => (
                  <div key={pi}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.faint,
                      textTransform: "uppercase", padding: "12px 16px 6px",
                    }}>{phase.name}</div>
                    {phase.tracks.map((t) => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 16px" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                          <AlbumArt track={t} size={36} borderRadius={6}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14, fontWeight: 550, color: color.ink,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{t.title}</div>
                          <div style={{ fontSize: 12, color: color.muted }}>{t.artist}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", width: "100%" }}>
                  <button type="button" onClick={() => {
                    const cleaned = session.map((t) => { const { _phase, ...rest } = t; return rest; });
                    onPlayRoute(cleaned, "set");
                    onClose();
                  }} style={{
                    ...BTN_PRIMARY, flex: 1, maxWidth: 280, borderRadius: radius.md, padding: "16px 28px",
                  }}>
                    Play mix
                  </button>
                  <button type="button" onClick={handleRegenerate} aria-label="Shuffle again" style={{
                    width: 52, height: 52, borderRadius: radius.md,
                    background: glass.fillStrong,
                    border: `1px solid ${glass.border}`,
                    color: color.body, fontSize: 18, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                    backdropFilter: glass.blurSoft,
                    WebkitBackdropFilter: glass.blurSoft,
                  }}>
                    ↻
                  </button>
                </div>
                {onSavePlaylist && (
                  <button
                    type="button"
                    onClick={handleSaveToLibrary}
                    disabled={savedToLibrary}
                    aria-label={savedToLibrary ? "Saved to Library" : "Save Custom Mix to Library"}
                    style={{
                      ...BTN_SECONDARY,
                      width: "auto",
                      minWidth: 200,
                      maxWidth: 332,
                      borderRadius: radius.md,
                      padding: "14px 24px",
                      opacity: savedToLibrary ? 0.72 : 1,
                      cursor: savedToLibrary ? "default" : "pointer",
                    }}
                  >
                    {savedToLibrary ? "Saved to Library" : "Save to Library"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── HARMONIC MAP — 2D visualization of library by key × energy ──────────────
function HarmonicMap({ tracks, onPlay, currentTrack }) {
  const canvasRef = useRef(null);
  const [hover, setHover] = useState(null);
  const singles = tracks.filter(t => t.camelot && t.energy && (t.duration||0) <= 900);

  // Parse camelot key to x position (1-12, A/B variants)
  function keyToX(camelot) {
    const num = parseInt(camelot);
    const isMinor = camelot.includes("A");
    return ((num - 1) / 11) * 0.85 + 0.075 + (isMinor ? 0 : 0.02);
  }

  // Energy to y position (inverted — high energy at top)
  function energyToY(e) {
    return 1 - ((e - 1) / 9) * 0.85 - 0.075;
  }

  const nodes = singles.map(t => ({
    track: t,
    x: keyToX(t.camelot),
    y: energyToY(t.energy),
    color: t.color || "#888",
    active: currentTrack?.id === t.id,
  }));

  return (
    <div style={{ padding:"24px 16px" }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:700, color: color.ink, letterSpacing:-0.3, marginBottom:4 }}>Harmonic Map</div>
        <div style={{ fontSize:12, color: color.muted, lineHeight:1.5, marginBottom:12 }}>Your library visualized by musical key and energy. Each dot is a track — click to play. Tracks nearby sound great together.</div>
        <div style={{ display:"flex", gap:16, fontSize:10, color: color.muted }}>
          <span>← Low key · High key →</span>
          <span>↑ High energy · Low energy ↓</span>
          {currentTrack && <span style={{ color: color.ink, fontWeight:600 }}>● Now playing</span>}
        </div>
      </div>
      <div style={{ position:"relative", width:"100%", aspectRatio:"2/1", background: color.surfaceRaised, borderRadius:16, border:`1px solid ${color.line}`, overflow:"hidden", cursor:"crosshair" }}>
        {/* Grid lines */}
        {[1,2,3,4,5,6,7,8,9,10].map(e => (
          <div key={`e${e}`} style={{ position:"absolute", left:0, right:0, top:`${(1-((e-1)/9)*0.85-0.075)*100}%`, height:1, background: color.line }}/>
        ))}
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(k => (
          <div key={`k${k}`} style={{ position:"absolute", top:0, bottom:0, left:`${((k-1)/11)*0.85*100+7.5}%`, width:1, background: color.line }}/>
        ))}

        {/* Key labels along bottom */}
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(k => (
          <div key={`kl${k}`} style={{ position:"absolute", bottom:4, left:`${((k-1)/11)*0.85*100+7.5}%`, transform:"translateX(-50%)", fontSize:8, color: color.muted, fontWeight:500 }}>{k}</div>
        ))}

        {/* Energy labels along left */}
        {[2,4,6,8,10].map(e => (
          <div key={`el${e}`} style={{ position:"absolute", left:4, top:`${(1-((e-1)/9)*0.85-0.075)*100}%`, transform:"translateY(-50%)", fontSize:8, color: color.muted, fontWeight:500 }}>{e}</div>
        ))}

        {/* Track dots */}
        {nodes.map((n, i) => (
          <div key={n.track.id}
            onClick={()=>onPlay(n.track)}
            onMouseEnter={()=>setHover(n.track)}
            onMouseLeave={()=>setHover(null)}
            style={{
              position:"absolute",
              left:`${n.x * 100}%`, top:`${n.y * 100}%`,
              transform:"translate(-50%,-50%)",
              width: n.active ? 14 : 8,
              height: n.active ? 14 : 8,
              borderRadius:"50%",
              background: n.active ? color.accent : `rgba(${hexToRgbStr(n.color)},0.6)`,
              border: n.active ? "2px solid #FFFFFF" : "1px solid rgba(255,255,255,0.12)",
              boxShadow: n.active ? `0 0 12px rgba(${hexToRgbStr(n.color)},0.4)` : "none",
              transition:"all 0.2s",
              cursor:"pointer",
              zIndex: n.active ? 10 : hover?.id === n.track.id ? 5 : 1,
            }}/>
        ))}

        {/* Hover tooltip */}
        {hover && (
          <div style={{
            position:"absolute",
            left:`${keyToX(hover.camelot) * 100}%`,
            top:`${energyToY(hover.energy) * 100 - 5}%`,
            transform:"translate(-50%,-100%)",
            background:"rgba(26,29,38,0.9)", backdropFilter:"blur(12px)",
            borderRadius:8, padding:"6px 10px", pointerEvents:"none",
            whiteSpace:"nowrap", zIndex:20,
          }}>
            <div style={{ fontSize:11, fontWeight:600, color: color.ink }}>{hover.title}</div>
            <div style={{ fontSize:9, color:"rgba(30,34,41,0.6)" }}>{hover.artist} · {hover.camelot} · E{hover.energy}</div>
          </div>
        )}
      </div>
    </div>
  );
}




// ─── HYPNO VISION OVERLAY — "sounds like this" full-screen ──────────────────────
function HypnoVisionOverlay({ sourceTrack, tracks, onPlay, onClose }) {
  const similar = findResonant(sourceTrack, tracks, 12);
  const rgb = hexToRgbStr(sourceTrack.color);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:95, overflow:"auto" }}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 20%, rgba(${rgb},0.12) 0%, ${color.canvas} 58%)` }} onClick={onClose}/>
      <div style={{ position:"relative", zIndex:1, maxWidth:520, margin:"0 auto", padding:"40px 24px 56px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
          <div style={{ width:72, height:72, overflow:"hidden", flexShrink:0, boxShadow:`0 12px 32px rgba(${rgb},0.22)` }}>
            <AlbumArt track={sourceTrack} size={72} borderRadius={0}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:0.4, color: color.accent, marginBottom:6 }}>Near this</div>
            <div style={{ fontSize:20, fontWeight:750, color: color.ink, letterSpacing:-0.4, fontFamily: fontDisplay, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sourceTrack.title}</div>
            <div style={{ fontSize:13, color: color.muted, marginTop:4 }}>{sourceTrack.artist} · tracks that feel like this</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: color.surface, border:`1px solid ${color.lineStrong}`, borderRadius:"50%", width:36, height:36, cursor:"pointer", color: color.muted, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        {sourceTrack._signal && (
          <div style={{ display:"flex", gap:20, marginBottom:28, justifyContent:"flex-start", paddingBottom:20, borderBottom:`1px solid ${color.line}` }}>
            {["grip","hold","pull","lift"].map(k => (
              <div key={k}>
                <div style={{ fontSize:18, fontWeight:700, color: color.ink, fontFamily: fontDisplay }}>{sourceTrack._signal[k]}</div>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.4, color: color.faint, textTransform:"uppercase", fontFamily: fontMono, marginTop:2 }}>{k}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column" }}>
          {similar.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onPlay(t); onClose(); }}
              style={{
                display:"flex", alignItems:"center", gap:14, width:"100%",
                padding:"12px 0", background:"none", border:"none",
                borderBottom:`1px solid ${color.line}`, cursor:"pointer", textAlign:"left",
              }}
            >
              <div style={{ width:52, height:52, overflow:"hidden", flexShrink:0 }}>
                <AlbumArt track={t} size={52} borderRadius={0}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:650, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily: fontDisplay, letterSpacing:-0.2 }}>{t.title}</div>
                <div style={{ fontSize:12, color: color.muted, marginTop:2 }}>{t.artist}{t._signal?.label ? ` · ${t._signal.label}` : ""}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SESSION AFTERGLOW — end-of-session overlay ──────────────────────────────
function AfterglowOverlay({ data, onClose, onSavePlaylist }) {
  if (!data || !data.tracks.length) return null;

  const tracks = data.tracks;
  const energies = tracks.map(t => t.energy || 5);
  const genres = [...new Set(tracks.map(t => t.genre).filter(Boolean))];
  const avgEnergy = (energies.reduce((s, e) => s + e, 0) / energies.length).toFixed(1);

  const width = 320;
  const height = 60;
  const step = width / Math.max(energies.length - 1, 1);
  const points = energies.map((e, i) => `${i * step},${height - ((e - 1) / 9) * height}`).join(" ");

  return (
    <div style={{ position:"fixed", inset:0, zIndex:95, display:"flex", alignItems:"center", justifyContent:"center", padding:32 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(26,29,36,0.42)", backdropFilter:"blur(10px)" }} onClick={onClose}/>
      <div style={{
        position:"relative", zIndex:1, maxWidth:420, width:"100%", textAlign:"center",
        animation:"rise 0.45s cubic-bezier(0.22,1,0.36,1) both",
        background: "rgba(52,58,68,0.92)",
        border: `1px solid ${glass.border}`,
        borderRadius: radius.lg,
        padding: "28px 24px",
        boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 20px 48px rgba(26,29,36,0.16)`,
      }}>
        <div style={{ fontSize:12, fontWeight:700, letterSpacing:0.4, color: color.accent, marginBottom:12 }}>Set rundown</div>
        <div style={{ fontSize:36, fontWeight:800, color: color.ink, letterSpacing:-1, marginBottom:8, fontFamily: fontDisplay }}>{data.durationMins} minutes</div>
        <div style={{ fontSize:14, color: color.muted, marginBottom:32 }}>{tracks.length} tracks · {genres.length} scenes · energy {avgEnergy}</div>

        <div style={{ marginBottom:28 }}>
          <svg width={width} height={height} style={{ display:"block", margin:"0 auto" }}>
            <defs>
              <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color.accentSoft}/>
                <stop offset="100%" stopColor="transparent"/>
              </linearGradient>
            </defs>
            <polyline points={points} fill="none" stroke={color.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
            <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#arcGrad)"/>
          </svg>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, maxWidth:width, marginLeft:"auto", marginRight:"auto" }}>
            <span style={{ fontSize:10, color: color.faint, fontFamily: fontMono }}>Start</span>
            <span style={{ fontSize:10, color: color.faint, fontFamily: fontMono }}>End</span>
          </div>
        </div>

        {genres.length > 0 && (
          <div style={{ marginBottom:28, fontSize:13, color: color.body, lineHeight:1.5 }}>
            {genres.slice(0, 4).join(" · ")}
          </div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button type="button" onClick={() => {
            if (onSavePlaylist) {
              const name = `Session · ${new Date(data.startTime).toLocaleDateString()} ${new Date(data.startTime).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`;
              onSavePlaylist(name, tracks.map(t => t.id));
            }
            onClose();
          }} style={{
            padding:"14px 24px", borderRadius: radius.sm,
            background: color.accent, border:"none",
            color: color.onAccent, fontSize:14, fontWeight:650, cursor:"pointer",
          }}>Save to Library</button>
          <button type="button" onClick={onClose} style={{
            padding:"14px 24px", borderRadius: radius.sm,
            background:"none", border:`1px solid ${color.lineStrong}`,
            color: color.muted, fontSize:14, fontWeight:600, cursor:"pointer",
          }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ImmersivePlayer → components/player/ImmersivePlayer.jsx

// ─── UP NEXT SHEET (mobile queue) ─────────────────────────────────────────────
function QueueSheet({ queue, currentTrack, onPlay, onClose, onClear, onShuffle, isRadioMode, radioHint, onRemove = null, onPlayNext = null }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:110 }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(5,6,8,0.55)", backdropFilter: glass.blurSoft, WebkitBackdropFilter: glass.blurSoft }}/>
      <div style={{
        position:"absolute", left:0, right:0, bottom:0, maxHeight:"72vh",
        background: glass.plate,
        borderTop: `1px solid ${glass.border}`,
        borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
        display:"flex", flexDirection:"column",
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
        backdropFilter: glass.blurHeavy,
        WebkitBackdropFilter: glass.blurHeavy,
        animation:"rise 0.35s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px 10px" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:750, color: color.ink, fontFamily: fontDisplay, letterSpacing:-0.3 }}>Up Next</div>
            {isRadioMode && (
              <div style={{ fontSize:11, color: color.muted, marginTop:2 }}>
                {radioHint || "Choosing the next song…"}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {onShuffle && (
              <button type="button" onClick={onShuffle} style={{ background: color.surface, border:"none", borderRadius:8, padding:"6px 10px", color: color.muted, fontSize:11, fontWeight:600, cursor:"pointer" }}>Shuffle</button>
            )}
            {queue.length > 0 && onClear && (
              <button type="button" onClick={onClear} style={{ background: color.surface, border:"none", borderRadius:8, padding:"6px 10px", color: color.muted, fontSize:11, fontWeight:600, cursor:"pointer" }}>Clear</button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" style={{ background:"none", border:"none", color: color.faint, cursor:"pointer", padding:4 }}>
              <Icon name="x" size={18}/>
            </button>
          </div>
        </div>
        <div className="hide-scroll" style={{ overflowY:"auto", padding:"4px 12px 28px" }}>
          {currentTrack && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 8px", marginBottom:6, borderRadius:10, background: color.accentSoft, border:`1px solid ${color.accentSoft}` }}>
              <div style={{ width:40, height:40, overflow:"hidden", flexShrink:0 }}><AlbumArt track={currentTrack} size={40} borderRadius={0}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, color: color.accent, textTransform:"uppercase", marginBottom:2 }}>Now</div>
                <div style={{ fontSize:13, fontWeight:600, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentTrack.title}</div>
                <div style={{ fontSize:11, color: color.muted }}>{currentTrack.artist}</div>
              </div>
            </div>
          )}
          {queue.length === 0 && (
            <div style={{ textAlign:"center", padding:"36px 12px", color: color.faint, fontSize:13 }}>
              {isRadioMode ? "Next pick lands after the crossfade" : "Nothing on deck"}
            </div>
          )}
          {queue.map((t, i) => (
            <div key={t.id} style={{
              display:"flex", alignItems:"center", gap:10, width:"100%", padding:"6px 0 6px 8px",
              borderBottom:`1px solid ${color.line}`,
            }}>
              <button type="button" onClick={() => { onPlay(t); onClose(); }}
                style={{
                  display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0, padding:"4px 0",
                  background:"none", border:"none", cursor:"pointer", textAlign:"left",
                }}>
                <div style={{ width:16, fontSize:10, color: color.faint, fontVariantNumeric:"tabular-nums" }}>{i + 1}</div>
                <div style={{ width:40, height:40, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={40} borderRadius={0}/></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:550, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                  <div style={{ fontSize:11, color: color.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.artist}</div>
                </div>
              </button>
              {!isRadioMode && onPlayNext && i > 0 && (
                <button type="button" onClick={() => onPlayNext(t)} aria-label={`Play ${t.title} next`}
                  style={{ background:"none", border:"none", cursor:"pointer", color: color.faint, padding:10, flexShrink:0 }}>
                  <Icon name="chev_up" size={15}/>
                </button>
              )}
              {!isRadioMode && onRemove && (
                <button type="button" onClick={() => onRemove(t)} aria-label={`Remove ${t.title} from queue`}
                  style={{ background:"none", border:"none", cursor:"pointer", color: color.faint, padding:10, flexShrink:0 }}>
                  <Icon name="x" size={15}/>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// CustomMixFeature → screens/FavoritesScreen.jsx

// ── Horizontal cover shelf (Apple Music–style) ───────────────────────────────
/**
 * Art-led horizontal shelf. Optional per-track `reasons` map (id → copy) turns
 * it into a "because…" recommendation rail. Like + ⋯ menu match TrackRow.
 */
function CoverShelf({ tracks, onPlayTrack, activeId, isPlaying, onLike, playlistCtx, reasons = null, tileSize = null, showRanks = false, compactCaptions = false, limit = 12 }) {
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();
  if (!tracks?.length) return null;
  const tile = tileSize || homeSpace.tile;
  return (
    <div
      className="hide-scroll"
      style={{
        display: "flex",
        gap: homeSpace.shelfGap,
        overflowX: "auto",
        overflowY: "hidden",
        padding: `4px ${homeSpace.gutter}px 14px`,
        scrollSnapType: "x proximity",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorX: "contain",
      }}
    >
      {tracks.slice(0, limit).map((t, i) => {
        const active = activeId === t.id;
        const reason = reasons?.[t.id];
        return (
          <div
            key={t.id}
            style={{
              flex: "0 0 auto",
              width: tile,
              scrollSnapAlign: "start",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => onPlayTrack(t, tracks)}
              onContextMenu={(e) => openFromContext(e, t)}
              aria-label={`Play ${t.title}`}
              style={{
                display: "block",
                width: tile,
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
                color: color.ink,
              }}
            >
              <div className="cover-tile" style={{
                width: tile, height: tile, borderRadius: radius.md, overflow: "hidden",
                marginBottom: 10, position: "relative",
                boxShadow: active ? artShadow.active : artShadow.quiet,
                border: `1px solid ${glass.borderSoft}`,
              }}>
                <AlbumArt track={t} size={tile} borderRadius={radius.md}/>
                <div aria-hidden="true" style={{
                  pointerEvents: "none", position: "absolute", inset: 0, borderRadius: radius.md,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`,
                }}/>
                {showRanks && (
                  <div aria-hidden="true" style={{
                    position: "absolute", left: 8, top: 8,
                    minWidth: 24, height: 24, padding: "0 6px",
                    borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(48,53,62,0.9)",
                    border: `1px solid ${glass.borderSoft}`,
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    fontFamily: fontMono, fontSize: 11, fontWeight: 700,
                    letterSpacing: 0.3, color: color.ink,
                  }}>
                    {i + 1}
                  </div>
                )}
                {active && isPlaying && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(26,29,36,0.28)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", background: color.accent,
                      animation: "pulse 1.2s ease-in-out infinite",
                    }}/>
                  </div>
                )}
              </div>
            </button>

            {/* Caption row — text + like + menu */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <button
                type="button"
                onClick={() => onPlayTrack(t, tracks)}
                style={{
                  flex: 1, minWidth: 0, background: "none", border: "none",
                  padding: 0, cursor: "pointer", textAlign: "left", color: color.ink,
                }}
              >
                <div style={{
                  fontSize: compactCaptions ? 13 : 14,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: active ? color.accent : color.ink,
                }}>{t.title}</div>
                <div style={{
                  fontSize: 12, color: color.muted, marginTop: 3,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{t.artist}</div>
                {reason && !compactCaptions && (
                  <div style={{
                    fontSize: 10, color: color.faint, marginTop: 5,
                    fontFamily: fontMono, letterSpacing: 0.3, textTransform: "uppercase",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{reason}</div>
                )}
              </button>
              {onLike && (
                <button
                  type="button"
                  aria-label={t.liked ? "Unlike" : "Like"}
                  onClick={(e) => { e.stopPropagation(); onLike(t.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: t.liked ? color.accent : color.faint, padding: 6, flexShrink: 0 }}
                >
                  <Icon name={t.liked ? "heart" : "heartempty"} size={15}/>
                </button>
              )}
              <TrackMoreButton onClick={(e) => openFromButton(e, t)} size={16}/>
            </div>
          </div>
        );
      })}

      {menu && (
        <TrackActionsMenu
          track={menu.track}
          playlistCtx={playlistCtx}
          activePlaylistId={menu.activePlaylistId}
          x={menu.x}
          y={menu.y}
          onClose={close}
        />
      )}
    </div>
  );
}

// HomeSection → screens/FavoritesScreen.jsx

// HomeCatalogStatus → screens/HomeScreen.jsx

/**
 * Selected for you — Cover Flow of recommended tracks with reason cues.
 */

/** Offline / buffering pill — subscribes to transport store so App root stays quiet. */
function AmbientNetworkPill({ isOffline }) {
  const isBuffering = useIsBuffering();
  const isPlaying = useIsPlaying();
  if (!(isOffline || (isBuffering && isPlaying))) return null;
  return (
    <div role="status" style={{
      position: "fixed",
      top: `calc(10px + env(safe-area-inset-top, 0px))`,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 120,
      display: "flex", alignItems: "center", gap: 8,
      background: isOffline ? color.ink : "rgba(52,58,68,0.92)",
      color: isOffline ? color.onDark : color.body,
      border: `1px solid ${glass.border}`,
      borderRadius: 980,
      padding: "7px 14px",
      fontSize: 12.5, fontWeight: 600,
      boxShadow: glass.shadowSoft,
      animation: "rise 0.3s cubic-bezier(0.22,1,0.36,1) both",
      pointerEvents: "none",
    }}>
      <span aria-hidden="true" style={{
        width: 7, height: 7, borderRadius: "50%",
        background: isOffline ? color.alert : color.accent,
        animation: isOffline ? "none" : "breathe 1.4s ease-in-out infinite",
      }}/>
      {isOffline ? "You're offline — playback may stall" : "Buffering…"}
    </div>
  );
}

// ForYouRiver → screens/FavoritesScreen.jsx

// HomeScreen → screens/HomeScreen.jsx

// ─── SEARCH ───────────────────────────────────────────────────────────────────
// SearchScreen → screens/SearchScreen.jsx

// ─── ENERGY SPARKLINE ─────────────────────────────────────────────────────────
function EnergySparkline({ tracks, width=120, height=24 }) {
  if (!tracks.length) return null;
  const energies = tracks.map(t => t.energy || 5);
  const max = 10;
  const step = width / Math.max(energies.length - 1, 1);
  const points = energies.map((e, i) => `${i * step},${height - (e / max) * height}`).join(" ");
  return (
    <svg width={width} height={height} style={{ display:"block", opacity:0.6 }}>
      <polyline points={points} fill="none" stroke={color.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── LIBRARY — Cover Flow collection ─────────────────────────────────────────
// FavoritesScreen → screens/FavoritesScreen.jsx

// ProfileScreen → components/club/ClubScreen.jsx

// AdminScreen → screens/AdminScreen.jsx

// ─── NOW PLAYING BAR — flat station strip ─────────────────────────────────────
function MetaChip({ children }) {
  return <span style={{ fontSize:10, padding:"4px 8px", borderRadius:6, background: color.accentSoft, color: color.accent, fontVariantNumeric:"tabular-nums", fontWeight: 600 }}>{children}</span>;
}

// ─── FLOATING GLASS DOCK — mini-player + tabs as one surface ──────────────────
function GlassDock({
  screen, setScreen, showAdmin = false,
  track,
  onTogglePlay, onSkip, onPrev, onLike, onSeek,
  isRadioMode, onOpen, playlistCtx, onShowQueue, hypnoPocket,
  hidePlayer = false,
  playsRemaining = null,
  access = null,
  onOpenPlans = null,
}) {
  const { progress, duration } = usePlayerPlayback();
  const isPlaying = useIsPlaying();
  const items = [
    { id: "home", label: "Home", icon: "home" },
    { id: "explore", label: "Explore", icon: "map" },
    { id: "charts", label: "Charts", icon: "chart" },
    { id: "favorites", label: "Library", icon: "dig" },
    { id: "search", label: "Search", icon: "search" },
    { id: "profile", label: "Club", icon: "profile" },
  ];
  if (showAdmin) items.push({ id: "admin", label: "Admin", icon: "settings" });

  // When Home radio owns the transport, dock collapses to tabs only.
  const hasPlayer = !!track && !hidePlayer;
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();
  const tint = dockTintStyle(track);

  const activeTab = items.some((i) => i.id === screen)
    ? screen
    : (screen === "artist" || screen === "album" ? "search" : "home");

  return (
    <div
      style={{
        position: "fixed",
        left: dock.insetX,
        right: dock.insetX,
        bottom: `calc(${dock.insetBottom}px + env(safe-area-inset-bottom, 0px))`,
        zIndex: 85,
        animation: `dockRise 0.45s ${motion.ease} both`,
        pointerEvents: "none",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <FreePlaysMeter
        variant="banner"
        remaining={playsRemaining}
        access={access}
        onUpgrade={onOpenPlans}
      />
      {hasPlayer && <EnergyShiftFeedback />}
      {hasPlayer && (
        <div
          className="glass-dock"
          style={{
            borderRadius: dock.radius,
            overflow: "hidden",
            pointerEvents: "auto",
            marginBottom: 8,
            ...tint,
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onContextMenu={(e) => openFromContext(e, track)}
            onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
            aria-label="Open now playing"
            style={{
              position: "relative",
              height: dock.playerH,
              padding: "8px 14px 8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              background: `
                linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)
              `,
              boxShadow: isRadioMode || hypnoPocket
                ? `inset 2px 0 0 ${y2k.chromeBright}`
                : "none",
            }}
          >
            <OrbitalArtRing
              track={track}
              size={42}
              onSeek={onSeek}
              artRadius={9}
            />

            <div key={track.id} style={{ flex: 1, minWidth: 0, animation: "fadeIn 0.3s ease both" }}>
              <div style={{
                fontSize: 14, fontWeight: 650, color: color.ink,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontFamily: fontDisplay, letterSpacing: -0.25,
              }}>
                {(isRadioMode || hypnoPocket) && (
                  <span style={{
                    display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                    background: y2k.chromeBright, marginRight: 8, verticalAlign: "middle",
                    boxShadow: isPlaying ? `0 0 0 3px ${y2k.chromeSoft}` : "none",
                    animation: isPlaying ? "breathe 2s ease-in-out infinite" : "none",
                  }}/>
                )}
                {track.title}
              </div>
              <div style={{
                fontSize: 11, color: color.muted, marginTop: 3,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.artist}
                </span>
                <span style={{
                  flexShrink: 0,
                  fontFamily: fontMono,
                  fontSize: 10,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: 0.2,
                  color: color.faint,
                }}>
                  {fmtTime(progress)}{duration ? ` / ${fmtTime(duration)}` : ""}
                </span>
              </div>
            </div>

            <button type="button" aria-label={track.liked ? "Unlike" : "Like"}
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: track.liked ? y2k.chromeBright : color.faint, padding: 8 }}>
              <span style={{ display: "flex", animation: track.liked ? "likePop 0.25s ease" : "none" }}>
                <Icon name={track.liked ? "heart" : "heartempty"} size={16}/>
              </span>
            </button>
            {onShowQueue && (
              <span className="dock-xtra" style={{ display: "flex" }}>
                <button type="button" aria-label="Up Next"
                  onClick={(e) => { e.stopPropagation(); onShowQueue(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: color.faint, padding: 8 }}>
                  <Icon name="queue" size={16}/>
                </button>
              </span>
            )}
            <span className="dock-xtra" style={{ display: "flex" }}>
              <TrackMoreButton onClick={(e) => openFromButton(e, track)} />
            </span>
            <button type="button" aria-label="Previous"
              onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: color.muted, padding: 8 }}>
              <Icon name="prev" size={16}/>
            </button>
            <IceOrbPlay
              isPlaying={isPlaying}
              onClick={onTogglePlay}
              size={34}
              iconSize={14}
              stopPropagation
            />
            <button type="button" aria-label="Next"
              onClick={(e) => { e.stopPropagation(); onSkip(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: color.muted, padding: 8 }}>
              <Icon name="skip" size={16}/>
            </button>
            <span className="dock-xtra" style={{ display: "flex" }}>
              <EnergyShiftControl size={30} />
            </span>
          </div>
        </div>
      )}

      <BottomNavigation items={items} activeId={activeTab} onSelect={setScreen} />

      {menu && (
        <TrackActionsMenu
          track={menu.track}
          playlistCtx={playlistCtx}
          activePlaylistId={menu.activePlaylistId}
          x={menu.x}
          y={menu.y}
          onClose={close}
        />
      )}
    </div>
  );
}

// ─── CATALOG SKELETON — stable layout while records load ─────────────────────
function CatalogSkeleton() {
  const tile = homeSpace.tile;
  const bone = (opts) => ({
    background: opts.strong
      ? "rgba(255,255,255,0.1)"
      : opts.mid
        ? "rgba(255,255,255,0.08)"
        : "rgba(255,255,255,0.055)",
    animation: "shimmer 1.5s ease-in-out infinite",
    animationDelay: opts.delay || "0s",
  });
  const shelf = (key) => (
    <div key={key} style={{ padding: `0 ${homeSpace.gutter}px`, marginBottom: 36 }}>
      <div style={{
        width: 140, height: 14, borderRadius: 4, marginBottom: 18,
        ...bone({ mid: true }),
      }}/>
      <div style={{ display: "flex", gap: homeSpace.shelfGap, overflow: "hidden" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ flex: "0 0 auto", width: tile }}>
            <div style={{
              width: tile, height: tile, borderRadius: radius.md,
              border: `1px solid ${glass.borderFaint}`,
              ...bone({ mid: true, delay: `${i * 0.08}s` }),
            }}/>
            <div style={{
              width: tile * 0.8, height: 11, borderRadius: 4, marginTop: 12,
              ...bone({ delay: `${i * 0.08}s` }),
            }}/>
            <div style={{
              width: tile * 0.55, height: 9, borderRadius: 4, marginTop: 7,
              ...bone({ delay: `${i * 0.08}s` }),
            }}/>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ paddingTop: 32, animation: "fadeIn 0.3s ease both" }}>
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: `0 ${homeSpace.gutter}px`,
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: chrome.signal,
            boxShadow: `0 0 10px rgba(${chrome.cyanRgb},0.45)`,
            animation: "breathe 1.4s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: color.muted,
          }}
        >
          Loading…
        </span>
      </div>
      <div aria-hidden="true" style={{ padding: `0 ${homeSpace.gutter}px`, marginBottom: 36 }}>
        <div style={{
          width: "100%", maxWidth: 420, height: 200, borderRadius: radius.xl,
          border: `1px solid ${glass.borderFaint}`,
          ...bone({ strong: true }),
        }}/>
      </div>
      {shelf("a")}
      {shelf("b")}
    </div>
  );
}

// ─── PULSE — ambient energy visualization ─────────────────────────────────────
function Pulse({ track }) {
  const isPlaying = useIsPlaying();
  // Kept intentionally empty for the minimal shell — ambient motion lives in the player only.
  return null;
}

function BgMist({ color: mistColor = "#909090" }) {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <div style={{
        position:"absolute", top:"-10%", left:"30%", width:280, height:280, borderRadius:"50%",
        background:`radial-gradient(circle,rgba(${hexToRgbStr(mistColor)},0.045) 0%,transparent 70%)`,
        filter:"blur(40px)",
      }}/>
    </div>
  );
}

const ToastEl = ({msg, onDismiss = null}) => (
  <div role="status" onClick={onDismiss || undefined} style={{
    position:"fixed",
    bottom: `calc(${dock.clearPlayer + 16}px + env(safe-area-inset-bottom, 0px))`,
    left:"50%", transform:"translateX(-50%)",
    background: color.surfaceRaised, color: color.ink, padding:"10px 18px", borderRadius: radius.md,
    fontSize:13, zIndex:200, whiteSpace:"nowrap", fontWeight:550,
    border:`1px solid ${color.lineStrong}`, boxShadow:"0 12px 32px rgba(0,0,0,0.4)",
    cursor: onDismiss ? "pointer" : "default",
    animation: "rise 0.25s cubic-bezier(0.22,1,0.36,1) both",
  }}>{msg}</div>
);

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

// ─── ROOT APP — Firebase wired ────────────────────────────────────────────────
export default function App() {
  // ── Auth (login/signup/logout + user profile) ───────────────────────────
  const { firebaseUser, profile, setProfile, loading: authLoading, authError, clearAuthError, signUp, logIn, logOut, refreshProfile, signInWithGoogle, sendPhoneOTP, verifyPhoneOTP, resetPassword } = useAuth();
  const [billingRefreshing, setBillingRefreshing] = useState(false);

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
  /** History-aware back — prefer in-app history, else Search hub. */
  const goBack = useCallback(() => {
    if (location.key && location.key !== "default") {
      navigate(-1);
      return;
    }
    navigate(buildPath("search"));
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 180);
    return () => clearTimeout(t);
  }, [searchQuery]);
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
  const [homeStageVisible, setHomeStageVisible] = useState(true);
  const onHomeStageVisibilityChange = useCallback((visible) => {
    setHomeStageVisible(!!visible);
  }, []);
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
  const [listeningRoom, setListeningRoom] = useState(null);
  const [linerTrack, setLinerTrack] = useState(null);
  const [purchasingTrackId, setPurchasingTrackId] = useState(null);
  const [showDedicate, setShowDedicate] = useState(false);
  const [requestTick, setRequestTick] = useState(0); // re-read local request ledger
  const [activeShowId, setActiveShowId] = useState(null); // tuned VJ block
  const [activeSceneChannelId, setActiveSceneChannelId] = useState(null);
  const [stationBumper, setStationBumper] = useState(null);
  const lastBumperTrackRef = useRef(null);
  // Clock mix lane follows the time of day in the background.
  // Genre focus (from Search) is the only manual listen filter; taste prefs drive 95/5.
  const [mixLane, setMixLane] = useState(() => mixLaneForDate().id);
  const [listenFocus, setListenFocus] = useState({ genre: null, scene: null });
  const [showGenreTaste, setShowGenreTaste] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [sessionInitialActivity, setSessionInitialActivity] = useState(null);
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
  useEffect(() => { activeShowIdRef.current = activeShowId; }, [activeShowId]);
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
    const sceneId = activeSceneChannelId;
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
        preferredGenres: profile?.genres || [],
        scopedPool: true,
        tasteBlend: !listenFocus.genre,
      }) || pool[0];
    });
  }, [radioPool, profile?.genres]);

  // ── Listening Memory — tracks recently played with timestamps ──
  const recentlyPlayedRef = useRef([]); // [{id, genre, energy, timestamp}]
  const playHistoryRef = useRef([]); // previous tracks for "prev" button
  const sessionStartRef = useRef(null);

  // Set arc for On Air floor (last 2 → now → next)
  const radioPickOpts = () => ({
    preferredGenres: profile?.genres || [],
    signalState: signalFlags.getState(),
    seedTrack: hypnoSeed,
    scopedPool: true,
    // Hard genre focus = play that lane; otherwise 95/5 taste blend
    tasteBlend: !listenFocus.genre,
    // Rabbit / Turtle sweep — read fresh so picks always see the latest target
    energyShift: playerEnergyStore.getState(),
  });
  const setPrev = isRadioMode && currentTrack
    ? playHistoryRef.current.filter(t => t && t.id !== currentTrack.id).slice(0, 2).reverse()
    : [];
  const setNext = useMemo(() => {
    const track = transportFlags.getState().track;
    if (!isRadioMode || !track) return null;
    return pickNextTrack(radioPool(), track, recentlyPlayedRef.current, radioPickOpts());
  }, [isRadioMode, currentTrackId, radioPool, hypnoSeed, listenFocus.genre, profile?.genres]);

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
    return list.map((t) => ({ ...t, liked: likedSet.has(t.id) }));
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

  const reloadCatalog = useCallback(async ({ background = false } = {}) => {
    if (!background) setTracksLoading(true);
    setTracksLoadError(null);
    try {
      const loaded = await fetchCatalogTracks(db);
      setTracks(applyLikedFlags(computeSignalTraits(enrichTracksWithScenes(loaded))));
      writeCatalogCache(loaded);
    } catch (err) {
      console.error("Failed to load tracks:", err);
      if (!background) {
        setTracksLoadError("We couldn't reach the music catalog. Check your connection and try again.");
        showToast("Couldn't load tracks — tap Retry on Home");
      }
    }
    if (!background) setTracksLoading(false);
  }, [applyLikedFlags, writeCatalogCache]);

  // ── Load tracks once on mount — IDB/local cache instantly, refresh behind ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fromIdb = await readCatalogIdb(CATALOG_CACHE_KEY);
      const cached = fromIdb || readCatalogCacheSync();
      if (cancelled) return;
      if (cached) {
        setTracks(applyLikedFlags(computeSignalTraits(enrichTracksWithScenes(cached.tracks))));
        setTracksLoading(false);
        if (!isCatalogCacheFresh(cached)) {
          reloadCatalog({ background: true });
        }
      } else {
        reloadCatalog();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Once profile loads, merge liked status + playlists into state ─────────
  useEffect(() => {
    if (!profile || !tracks.length) return;
    const likedSet = new Set(profile.likedTracks || []);
    setTracks(prev => prev.map(t => ({
      ...t,
      liked: likedSet.has(t.id),
      // keep scene enrichment if already present
      _scene: t._scene,
      _scenes: t._scenes,
    })));
    if (profile.playlists) setUserPlaylists(profile.playlists);
  }, [profile?.likedTracks, tracks.length]);

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

  const handleOpenPlans = useCallback(() => setShowPlans(true), []);

  const handlePurchasePhysical = useCallback(async (track, amount) => {
    if (!track?.id) return;
    if (!firebaseUser) {
      showToast("Sign in to buy with Club Credit");
      return;
    }
    const bal = usableCreditBalance(profile);
    if (bal <= 0) {
      showToast("Go Premium for Club Credit");
      setShowPlans(true);
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
      if (/Premium|Club Credit/i.test(String(msg))) setShowPlans(true);
    } finally {
      setPurchasingTrackId(null);
    }
  }, [firebaseUser, profile, access?.membershipCard]);

  // After Stripe redirect (?billing=success), refresh membership from Firestore
  useEffect(() => {
    if (!firebaseUser || !profile) return;
    const q = readBillingQuery(typeof window !== "undefined" ? window.location.search : "");
    if (q.billing !== "success") return;
    (async () => {
      try {
        await refreshProfile();
        showToast(q.plan === "premium" ? "Premium unlocked" : "Club unlocked");
        setShowPlans(false);
      } catch {
        /* ignore */
      }
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("billing");
        url.searchParams.delete("plan");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      } catch {
        /* ignore */
      }
    })();
  }, [firebaseUser, profile?.uid, refreshProfile]);

  const handleBillingRefresh = useCallback(async () => {
    setBillingRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setBillingRefreshing(false);
    }
  }, [refreshProfile]);

  // Genre + taste intake — only user choice; mix lane/energy stay automatic
  const finishOnboarding = async (tasteOrGenres = []) => {
    const taste = Array.isArray(tasteOrGenres)
      ? { genres: tasteOrGenres, adventurous: null, depth: null }
      : {
          genres: tasteOrGenres?.genres || [],
          adventurous: tasteOrGenres?.adventurous,
          depth: tasteOrGenres?.depth,
        };
    const genres = Array.isArray(taste.genres) ? taste.genres : [];
    try {
      await completeOnboarding({
        homeRooms: [],
        genres: genres.length ? genres : null,
        adventurous: taste.adventurous,
        depth: taste.depth,
      });
      setProfile((p) => ({
        ...(p || {}),
        onboarded: true,
        homeRooms: [],
        genres: genres.length ? genres : (p?.genres || []),
        ...(taste.adventurous != null ? { adventurous: taste.adventurous } : {}),
        ...(taste.depth != null ? { depth: taste.depth } : {}),
      }));
    } catch (e) { /* local dismiss still */ }
    setOnboardingDismissed(true);
  };

  // ── Crossfade audio engine ───────────────────────────────────────────────
  // Two audio elements — A and B. We alternate between them for crossfade.
  // audioRef = currently playing, nextAudioRef = the one fading in.
  const nextAudioRef   = useRef(null);
  const crossfadeRef   = useRef(null); // interval for the crossfade ramp
  const isCrossfading  = useRef(false);
  const audioUnlockedRef = useRef(false);
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
    const els = [audioRef.current, nextAudioRef.current].filter(Boolean);
    els.forEach((el) => {
      try {
        configureAudioElement(el);
        const existing = el.getAttribute("src") || "";
        if (!existing) el.src = SILENT_WAV;
        const wasMuted = el.muted;
        el.muted = true;
        const p = el.play();
        const finish = () => {
          try {
            el.pause();
            if ((el.getAttribute("src") || "").startsWith("data:audio")) {
              el.currentTime = 0;
            }
          } catch { /* ignore */ }
          el.muted = wasMuted;
          // Never clobber a real track URL that loaded during unlock
          const now = el.getAttribute("src") || "";
          if (now.startsWith("data:audio")) {
            el.removeAttribute("src");
            el.src = "";
            try { el.load(); } catch { /* ignore */ }
          }
        };
        if (p && typeof p.then === "function") {
          p.then(finish).catch(finish);
        } else {
          finish();
        }
      } catch { /* ignore */ }
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
        preferredGenres: profile?.genres || [],
        signalState: signalFlags.getState(),
        seedTrack: hypnoSeed,
        scopedPool: true,
        tasteBlend: !(listenFocusRef.current?.genre),
        energyShift: playerEnergyStore.getState(),
      });
    }
    const q = queueRef.current;
    if (!q.length) return null;
    return shuffleRef.current
      ? q[Math.floor(Math.random() * q.length)]
      : q[0];
  }, [profile?.genres, hypnoSeed]);

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
      if (isPlayingRef.current) setIsPlaying(false);
    };
    const onPlay = () => {
      if (isCrossfading.current) return;
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
    if (currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.volume = volumeRef.current;
      audio.load();
      // Resume a restored session at its saved position
      const resumeAt = pendingResumeRef.current;
      pendingResumeRef.current = null;
      if (resumeAt != null && resumeAt > 0) {
        const seekWhenReady = () => { try { audio.currentTime = resumeAt; } catch { /* ignore */ } };
        audio.addEventListener("loadedmetadata", seekWhenReady, { once: true });
        setProgress(Math.floor(resumeAt));
      } else {
        setProgress(0);
      }
      if (isPlayingRef.current) audio.play().catch(() => {});
    } else {
      audio.src = "";
      setProgress(0);
    }
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
      if (state.isPlaying) audio.play().catch(() => {});
      else audio.pause();
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
    if (!opts.keepShow) setActiveShowId(null);
    if (!opts.keepScene) setActiveSceneChannelId(null);
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
    if (!seed && !intentOverride && liveBlock && !listenFocus.genre && !listenFocus.scene) {
      playShowRef.current?.(liveBlock);
      return;
    }
    const resolved = intentOverride
      ? resolveListenPool(tracks, intentOverride, { requireAudio: true, applyMixLane: true })
      : radioResolved();
    const pool = resolved.tracks;
    if (!pool.length) return;
    const seedTrack = seed || null;
    setHypnoSeed(seedTrack);
    if (liveBlock && !seedTrack) setActiveShowId(liveBlock.id);
    // Honor the hero preview so "Up first" is what actually plays
    const first = (!seedTrack && !intentOverride && heroPreview && pool.some(t => t.id === heroPreview.id))
      ? heroPreview
      : pickNextTrack(pool, null, recentlyPlayedRef.current, {
          preferredGenres: profile?.genres || [],
          signalState: signalFlags.getState(),
          seedTrack,
          scopedPool: true,
          tasteBlend: !(intentOverride?.genre || listenFocus.genre),
        }) || pool.find(t => (t.duration || 0) <= 900) || pool[0];
    if (currentTrack) playHistoryRef.current = [currentTrack, ...playHistoryRef.current].slice(0, 50);
    setCurrent(first); setIsPlaying(true); setProgress(0); setIsRadioMode(true); setQueue([]); setImmersive(true);
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
  const currentRequested = useMemo(
    () => !!(currentTrack?.id && hasRequestedToday(currentTrack.id)),
    [currentTrackId, requestTick]
  );

  const requestCurrentTrack = useCallback(async () => {
    const track = currentTrack;
    if (!track?.id) return;
    if (!markRequestedToday(track.id)) {
      showToast("Already requested today");
      setRequestTick((n) => n + 1);
      return;
    }
    setTracks((prev) => prev.map((t) => (
      t.id === track.id ? { ...t, requestCount: (t.requestCount || 0) + 1 } : t
    )));
    setCurrent((t) => (t?.id === track.id ? { ...t, requestCount: (t.requestCount || 0) + 1 } : t));
    setRequestTick((n) => n + 1);
    showToast("Requested — climbing the countdown");
    if (firebaseUser) {
      try {
        const { doc: fdoc, updateDoc: fup, increment: finc } = await import("firebase/firestore");
        await fup(fdoc(db, "tracks", track.id), { requestCount: finc(1) });
      } catch {
        /* local bump still counts for this session */
      }
    }
  }, [currentTrack, firebaseUser]);

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
    setImmersive(true);
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
    const pool = buildSceneChannelPool(tracks, channel);
    if (!pool.length) {
      showToast("Nothing lined up on that channel yet");
      return;
    }
    unlockAudioElements();
    const first = pool[0];
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
    setImmersive(true);
    setSessionMeta(null);
    if (!sessionStartRef.current) sessionStartRef.current = Date.now();
    logTrackPlay(first);
    showToast(`${channel.title} — ${channel.tagline}`);
    commitListeningPlay(first);
  }, [tracks, currentTrack, guardFreePlay, commitListeningPlay]);

  const playMonthlyChart = useCallback((scope = { mode: "overall" }) => {
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

  // Snapshot today's chart for history / climbers
  useEffect(() => {
    if (!tracks.length) return;
    try { ensureTodayChart(tracks); } catch { /* ignore */ }
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
    playTrack(pool[0], pool, { immersive: true });
    showToast(`${activeDaypart?.label || "Countdown"} — locked in`);
  }, [countdown, activeDaypart, playRadio, playTrack, playShow]);

  const countdownRankForCurrent = useMemo(() => {
    if (!currentTrack?.id) return null;
    return countdown.find((c) => c.track.id === currentTrack.id)?.rank ?? null;
  }, [countdown, currentTrackId]);

  const stationUpNext = setNext || (countdown[0]?.track?.id !== currentTrack?.id ? countdown[0]?.track : countdown[1]?.track) || null;

  // Station bumper / ident between cuts while locked to channel or show
  useEffect(() => {
    if (!currentTrack?.id || !isPlayingRef.current) return;
    if (lastBumperTrackRef.current === currentTrack.id) return;
    const prev = lastBumperTrackRef.current;
    lastBumperTrackRef.current = currentTrack.id;
    if (!prev) return; // skip first track of session
    if (!isRadioMode && !activeShowId && !activeSceneChannelId) return;
    const bumper = pickTrackBumper({
      show: liveShow,
      nextTrack: stationUpNext,
      countdownTop: countdown[0] || null,
      sceneChannel: activeSceneChannelId ? getSceneChannel(activeSceneChannelId) : null,
    });
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

  // ── Search — ranked, diacritic-folded, memoized (debounced input) ─────────
  const searchResults = useMemo(() => {
    if (debouncedSearch.length === 0) return [];
    const fold = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    const q = fold(debouncedSearch).trim();
    if (!q) return [];
    // Energy search: "e7", "energy 5", etc.
    const energyMatch = q.match(/^e(?:nergy)?\s*(\d+)$/i);
    if (energyMatch) {
      const eVal = parseInt(energyMatch[1]);
      return tracks.filter(t => t.energy === eVal);
    }
    // BPM range search: "120bpm", "bpm 130" — but keep text matches reachable
    const bpmMatch = q.match(/^(?:bpm)?\s*(\d+)\s*(?:bpm)?$/i);
    const bpmHits = bpmMatch && parseInt(bpmMatch[1]) > 50
      ? tracks.filter(t => t.bpm && Math.abs(t.bpm - parseInt(bpmMatch[1])) <= 5)
      : [];
    // Ranked text search: title prefix > title word-start > title substring >
    // artist > album > genre/scene; liked and played tracks break ties.
    const sceneHit = matchSceneFromText(q);
    const scored = [];
    for (const t of tracks) {
      const title = fold(t.title);
      const artist = fold(t.artist);
      const album = fold(t.album);
      const genre = fold(t.genre);
      const sceneLabel = fold(t._scene?.label || displaySceneLabel(t) || "");
      let score = 0;
      if (title === q) score = 120;
      else if (title.startsWith(q)) score = 100;
      else if (title.includes(` ${q}`)) score = 85;
      else if (title.includes(q)) score = 65;
      else if (artist.startsWith(q)) score = 55;
      else if (artist.includes(q)) score = 45;
      else if (album.includes(q)) score = 30;
      else if (genre.includes(q) || sceneLabel.includes(q)) score = 20;
      else if (sceneHit && trackMatchesScene(t, sceneHit.id)) score = 18;
      else if (String(t.bpm || "").includes(q)) score = 10;
      if (score === 0) continue;
      score += (t.liked ? 8 : 0) + Math.min(6, (t.playCount || 0) / 5);
      scored.push([score, t]);
    }
    scored.sort((a, b) => b[0] - a[0]);
    const textHits = scored.map(([, t]) => t);
    if (bpmHits.length) {
      const seen = new Set(bpmHits.map((t) => t.id));
      return [...bpmHits, ...textHits.filter((t) => !seen.has(t.id))];
    }
    return textHits;
  }, [tracks, debouncedSearch]);
  const entityHits = useMemo(
    () => (debouncedSearch.length > 1 ? searchEntities(tracks, debouncedSearch) : { artists: [], albums: [] }),
    [tracks, debouncedSearch]
  );

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

  // ── Loading states ────────────────────────────────────────────────────────
  // Auth boot — brand lockup + Loading… (Lottie slot at public/brand/splash-loader.json)
  if (authLoading) {
    return (
      <div style={{ ...APP_STYLE, position: "relative" }}>
        <Suspense
          fallback={(
            <div
              role="status"
              aria-live="polite"
              aria-busy="true"
              style={{
                minHeight: "100dvh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                color: color.muted,
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2.2,
                textTransform: "uppercase",
              }}
            >
              Loading…
            </div>
          )}
        >
          <SplashScreen size={240} label="Loading…" />
        </Suspense>
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
      <GenreTasteOnboarding
        initialGenres={profile?.genres || []}
        initialAdventurous={profile?.adventurous}
        initialDepth={profile?.depth}
        onComplete={(taste) => finishOnboarding(taste)}
        onSkip={() => finishOnboarding([])}
      />
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
      {showPlans && (
        <Suspense fallback={null}>
          <LazyPaywallScreen
            access={access}
            mode="manage"
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
        <QueueSheet
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
      )}
      {resonanceTrack && (
        <HypnoVisionOverlay
          sourceTrack={resonanceTrack}
          tracks={tracks}
          onPlay={(t) => playTrack(t, tracks)}
          onClose={() => setResonanceTrack(null)}
        />
      )}
      {showGenreTaste && (
        <GenreTasteSheet
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
      )}
      {showRouteBuilder && (
        <SessionBuilderModal
          tracks={blendPoolForSession(
            resolveListenPool(
              tracks,
              activeListenIntent({ vibe: sessionInitialActivity || vibeForMixLane(mixLane) }),
              { requireAudio: false, applyMixLane: false }
            ).tracks,
            listenFocus.genre ? [listenFocus.genre] : (profile?.genres || [])
          )}
          initialActivity={sessionInitialActivity || vibeForMixLane(mixLane)}
          intentLabel={listenFocus.genre || (profile?.genres?.length ? "Your interests" : null)}
          onClose={() => {
            setShowRouteBuilder(false);
            setSessionInitialActivity(null);
          }}
          onPlayRoute={playRoute}
          onSavePlaylist={(name, trackIds) => createPlaylist(name, trackIds)}
        />
      )}
      {linerTrack && (
        <LinerNotesSheet
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
      )}
      {showDedicate && (
        <DedicateSheet
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
      )}
      {stationBumper && (
        <StationBumper
          bumper={stationBumper}
          onDone={() => setStationBumper(null)}
        />
      )}
      {afterglow && (
        <AfterglowOverlay
          data={afterglow}
          onClose={() => setAfterglow(null)}
          onSavePlaylist={(name, trackIds) => createPlaylist(name, trackIds)}
        />
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
      onRequest={requestCurrentTrack}
      requested={currentRequested}
      onDedicate={() => setShowDedicate(true)}
      dedicationFlash={dedicationFlash}
      onClearDedication={() => setDedicationFlash(null)}
      liveShow={liveShow || liveAiring?.show || null}
      tracks={tracks}
      sceneChannelsActiveId={activeSceneChannelId}
      onTuneSceneChannel={playSceneChannel}
      Icon={Icon}
      IceOrbPlay={IceOrbPlay}
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
      {tracksLoading && (
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
        {screen==="home"      && !tracksLoading && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={togglePlay} onPlayTrack={playTrack} onLike={toggleLike} isRadioMode={isRadioMode} hypnoPocket={!!hypnoSeed} playlistCtx={playlistCtx} mixLane={mixLane} radioPreview={heroPreview} radioNext={setNext} onSkipRadio={handleSkip} onPrevRadio={handlePrev} onOpenPlayer={()=>setImmersive(true)} catalogError={tracksLoadError} onRetryCatalog={reloadCatalog} onStageVisibilityChange={onHomeStageVisibilityChange} onSeek={handleSeek} countdown={countdown} onTuneCountdown={tuneCountdown} daypart={activeDaypart} tickerText={stationTicker} onRequest={requestCurrentTrack} requested={currentRequested} onDedicate={()=>setShowDedicate(true)} dedicationFlash={dedicationFlash} onClearDedication={()=>setDedicationFlash(null)} airing={liveAiring} programGuide={programGuide} activeShowId={activeShowId} onTuneShow={playShow} showBumper={showBumper} channelShow={liveShow} sceneChannelsActiveId={activeSceneChannelId} onTuneSceneChannel={playSceneChannel} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} playlists={libraryPlaylists.filter((pl)=>!isCommunityPlaylist(pl))} preferredGenres={user.genres||[]} userKey={firebaseUser?.uid||""} onOpenSearch={()=>setScreen("search")} onOpenProfile={()=>setScreen("profile")} onOpenLibrary={()=>setScreen("favorites")} onOpenCharts={()=>setScreen("charts")} onOpenPlaylist={(id)=>openStack(id)} onOpenAlbum={(slug)=>openAlbum(slug)}/>}
        {screen==="explore"   && !tracksLoading && <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading explore…</div>}><ExploreScreen tracks={tracks} preferredGenres={user.genres||[]} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} userKey={firebaseUser?.uid||""} onPlayTrack={playTrack} onOpenSearch={()=>setScreen("search")} onOpenAlbum={(slug)=>openAlbum(slug)}/></Suspense>}
        {screen==="charts"    && !tracksLoading && <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading charts…</div>}><LazyChartsScreen countdown={countdown} tracks={tracks} onPlayTrack={playTrack} onTuneMonthly={playMonthlyChart}/></Suspense>}
        {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} tracks={tracks} onPlay={(t,pool)=>{ recordRecentSearch(searchQuery); playTrack(t,pool||tracks); }} onListenIntent={(focus)=>{ const next={ genre: focus.genre || null, scene: null }; setListenFocus(next); playRadio(null, createListenIntent({ mixLane, ...next })); }} onLike={toggleLike} playlistCtx={playlistCtx} entityHits={entityHits} onOpenArtist={(slug)=>{ recordRecentSearch(searchQuery); openArtist(slug); }} onOpenAlbum={(slug)=>{ recordRecentSearch(searchQuery); openAlbum(slug); }} recentSearches={recentSearches} onPickRecent={(q)=>setSearch(q)} onClearRecent={clearRecentSearches}/>}
        {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onPlayTrack={(t,pool)=>{setIsRadioMode(false);playTrack(t,pool||tracks);}} onLike={toggleLike} playlistCtx={playlistCtx} userPlaylists={libraryPlaylists} onCreatePlaylist={createPlaylist} onDeletePlaylist={deletePlaylist} onRenamePlaylist={renamePlaylist} onSharePlaylist={sharePlaylistToClub} stackId={stackId} onOpenStack={openStack} onCloseStack={closeStack} onReorderPlaylist={reorderPlaylistTrack} communityMix={communityMix} onOpenMix={()=>communityMix && openMix(communityMix.id)} onCustomMix={()=>{ setSessionInitialActivity(vibeForMixLane(mixLane)); setShowRouteBuilder(true); }} preferredGenres={user.genres} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} userKey={firebaseUser?.uid || ""}/>}
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
            TrackRow={TrackRow}
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
            AlbumArt={AlbumArt}
            TrackRow={TrackRow}
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
            AlbumArt={AlbumArt}
            TrackRow={TrackRow}
            playlistCtx={playlistCtx}
          /></Suspense>
        )}
        {screen==="profile"   && (
          <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Opening the club…</div>}>
            <ClubScreen user={user} tracks={tracks} onLogout={logOut} access={access} onSubscribe={handleSubscribe} onOpenPlans={handleOpenPlans} profile={profile} communityMix={communityMix} onOpenMix={communityMix ? ()=>openMix(communityMix.id) : null} onEditGenres={()=>setShowGenreTaste(true)} recentTracks={profile?.recentTracks||[]} signalLabel={signalFlags.getState().label} onPlayTrack={(t,pool)=>{setIsRadioMode(false);playTrack(t,pool||tracks);}} onChoosePick={handleChoosePick} onSkipMonth={handleSkipMonth}/>
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
      {boothPlayer}
      {listeningOverlays}
    </div>
  );

  // ── Mobile: render as-is ─────────────────────────────────────────────────
  if (!isDesktop) return innerApp;

  // ── Desktop: 3-column shell (iTunes-style source list) ───────────────────
  const NAV_TOP = [
    { id: "home",      icon: "home",   label: "Home" },
    { id: "explore",   icon: "map",    label: "Explore" },
    { id: "charts",    icon: "chart",  label: "Charts" },
    { id: "favorites", icon: "dig",    label: "Library" },
    { id: "search",    icon: "search", label: "Search" },
  ];
  const NAV_BOTTOM = [];

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
      <div style={{
        width: 220, flexShrink: 0,
        background: `
          linear-gradient(180deg, rgba(38,43,51,0.8) 0%, rgba(26,29,35,0.45) 100%),
          ${color.surfaceRaised}
        `,
        borderRight: `1px solid ${glass.border}`,
        boxShadow: `inset -1px 0 0 ${glass.highlight}`,
        display: "flex", flexDirection: "column",
        padding: "18px 12px 16px",
      }}>
        <div style={{ marginBottom: 22, padding: "0 4px" }}>
          <BrandLockup size={88} glassHalo={false} compact />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minHeight: 0 }}>
          {NAV_TOP.map((item) => {
            const active = screen === item.id || ((screen === "artist" || screen === "album") && item.id === "search");
            return (
              <button
                key={item.id}
                type="button"
                className="nav-rail-btn"
                onClick={() => setScreen(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                style={{
                  width: "100%", minHeight: 38, borderRadius: radius.sm,
                  background: active ? color.select : "transparent",
                  border: active ? `1px solid ${color.accentSoft}` : "1px solid transparent",
                  color: active ? color.accent : color.body,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  textAlign: "left",
                  boxShadow: active ? `inset 0 1px 0 ${glass.highlight}` : "none",
                }}
              >
                <Icon name={item.icon} size={16}/>
                <span style={{
                  fontSize: 13, fontWeight: active ? 650 : 500,
                  letterSpacing: -0.1, lineHeight: 1.2,
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ height: 8, flexShrink: 0 }}/>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_BOTTOM.map((item) => {
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className="nav-rail-btn"
                onClick={() => setScreen(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                style={{
                  width: "100%", minHeight: 38, borderRadius: radius.sm,
                  background: active ? color.select : "transparent",
                  border: active ? `1px solid ${color.accentSoft}` : "1px solid transparent",
                  color: active ? color.accent : color.body,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  textAlign: "left",
                  boxShadow: active ? `inset 0 1px 0 ${glass.highlight}` : "none",
                }}
              >
                <Icon name={item.icon} size={16}/>
                <span style={{
                  fontSize: 13, fontWeight: active ? 650 : 500,
                  letterSpacing: -0.1, lineHeight: 1.2,
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
          {firebaseUser?.uid === ADMIN_UID && (
            <button
              type="button"
              className="nav-rail-btn"
              onClick={() => setScreen("admin")}
              title="Admin"
              aria-label="Admin"
              style={{
                width: "100%", height: 38, borderRadius: radius.sm,
                background: screen === "admin" ? color.select : "transparent",
                border: "none",
                color: screen === "admin" ? color.accent : color.body,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10, padding: "0 10px",
              }}
            >
              <Icon name="settings" size={17}/>
              <span style={{ fontSize: 14 }}>Admin</span>
            </button>
          )}
          <button
            type="button"
            className="nav-rail-btn"
            onClick={() => setScreen("profile")}
            title={user.name}
            aria-label="Club"
            aria-current={screen === "profile" ? "page" : undefined}
            style={{
              width: "100%", height: 40, borderRadius: radius.sm,
              background: screen === "profile" ? color.select : "transparent",
              border: `1px solid ${screen === "profile" ? color.accentSoft : "transparent"}`,
              display: "flex", alignItems: "center", gap: 10, padding: "0 8px",
              fontSize: 14, cursor: "pointer", marginTop: 4, color: color.ink,
            }}
          >
            <span style={{
              width: 26, height: 26, borderRadius: 7,
              background: color.surfaceSolid,
              border: `1px solid ${glass.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 650, flexShrink: 0,
            }}>
              {user.image || (user.name || "R").trim().charAt(0).toUpperCase()}
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name || "You"}
            </span>
          </button>
        </div>
      </div>

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
          {tracksLoading ? (
            <>
              <div className="sr-only" role="status">Loading your catalog…</div>
              <CatalogSkeleton/>
            </>
          ) : (
            <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading…</div>}>
            <ScreenPane key={screen === "artist" ? `artist:${artistSlug}` : screen === "album" ? `album:${albumSlug}` : screen === "mix" ? `mix:${mixId}` : screen}>
              {screen==="home"      && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={togglePlay} onPlayTrack={playTrack} onLike={toggleLike} isRadioMode={isRadioMode} hypnoPocket={!!hypnoSeed} playlistCtx={playlistCtx} mixLane={mixLane} radioPreview={heroPreview} radioNext={setNext} onSkipRadio={handleSkip} onPrevRadio={handlePrev} onOpenPlayer={()=>setImmersive(true)} catalogError={tracksLoadError} onRetryCatalog={reloadCatalog} onStageVisibilityChange={onHomeStageVisibilityChange} onSeek={handleSeek} countdown={countdown} onTuneCountdown={tuneCountdown} daypart={activeDaypart} tickerText={stationTicker} onRequest={requestCurrentTrack} requested={currentRequested} onDedicate={()=>setShowDedicate(true)} dedicationFlash={dedicationFlash} onClearDedication={()=>setDedicationFlash(null)} airing={liveAiring} programGuide={programGuide} activeShowId={activeShowId} onTuneShow={playShow} showBumper={showBumper} channelShow={liveShow} sceneChannelsActiveId={activeSceneChannelId} onTuneSceneChannel={playSceneChannel} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} playlists={libraryPlaylists.filter((pl)=>!isCommunityPlaylist(pl))} preferredGenres={user.genres||[]} userKey={firebaseUser?.uid||""} onOpenSearch={()=>setScreen("search")} onOpenProfile={()=>setScreen("profile")} onOpenLibrary={()=>setScreen("favorites")} onOpenCharts={()=>setScreen("charts")} onOpenPlaylist={(id)=>openStack(id)} onOpenAlbum={(slug)=>openAlbum(slug)}/>}
              {screen==="explore"   && <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading explore…</div>}><ExploreScreen tracks={tracks} preferredGenres={user.genres||[]} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} userKey={firebaseUser?.uid||""} onPlayTrack={playTrack} onOpenSearch={()=>setScreen("search")} onOpenAlbum={(slug)=>openAlbum(slug)}/></Suspense>}
              {screen==="charts"    && <Suspense fallback={<div style={{ padding: 32, color: color.muted }}>Loading charts…</div>}><LazyChartsScreen countdown={countdown} tracks={tracks} onPlayTrack={playTrack} onTuneMonthly={playMonthlyChart}/></Suspense>}
              {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} tracks={tracks} onPlay={(t,pool)=>{ recordRecentSearch(searchQuery); playTrack(t,pool||tracks); }} onListenIntent={(focus)=>{ const next={ genre: focus.genre || null, scene: null }; setListenFocus(next); playRadio(null, createListenIntent({ mixLane, ...next })); }} onLike={toggleLike} playlistCtx={playlistCtx} entityHits={entityHits} onOpenArtist={(slug)=>{ recordRecentSearch(searchQuery); openArtist(slug); }} onOpenAlbum={(slug)=>{ recordRecentSearch(searchQuery); openAlbum(slug); }} recentSearches={recentSearches} onPickRecent={(q)=>setSearch(q)} onClearRecent={clearRecentSearches}/>}
              {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onPlayTrack={(t,pool)=>{setIsRadioMode(false);playTrack(t,pool||tracks);}} onLike={toggleLike} playlistCtx={playlistCtx} userPlaylists={libraryPlaylists} onCreatePlaylist={createPlaylist} onDeletePlaylist={deletePlaylist} onRenamePlaylist={renamePlaylist} onSharePlaylist={sharePlaylistToClub} stackId={stackId} onOpenStack={openStack} onCloseStack={closeStack} onReorderPlaylist={reorderPlaylistTrack} communityMix={communityMix} onOpenMix={()=>communityMix && openMix(communityMix.id)} onCustomMix={()=>{ setSessionInitialActivity(vibeForMixLane(mixLane)); setShowRouteBuilder(true); }} preferredGenres={user.genres} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} userKey={firebaseUser?.uid || ""}/>}
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
                  TrackRow={TrackRow}
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
                  AlbumArt={AlbumArt}
                  TrackRow={TrackRow}
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
                  AlbumArt={AlbumArt}
                  TrackRow={TrackRow}
                  playlistCtx={playlistCtx}
                /></Suspense>
              )}
              {screen==="profile"   && (
                <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Opening the club…</div>}>
                  <ClubScreen user={user} tracks={tracks} onLogout={logOut} access={access} onSubscribe={handleSubscribe} onOpenPlans={handleOpenPlans} profile={profile} communityMix={communityMix} onOpenMix={communityMix ? ()=>openMix(communityMix.id) : null} onEditGenres={()=>setShowGenreTaste(true)} recentTracks={profile?.recentTracks||[]} signalLabel={signalFlags.getState().label} onPlayTrack={(t,pool)=>{setIsRadioMode(false);playTrack(t,pool||tracks);}} onChoosePick={handleChoosePick} onSkipMonth={handleSkipMonth}/>
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
          <DesktopMiniPlayer
            track={currentTrack}
           
            isRadioMode={isRadioMode}
            onOpen={() => setImmersive(true)}
            onTogglePlay={togglePlay}
            onSkip={handleSkip}
            onLikeToggle={onLikeToggle}
            onSeek={handleSeek}
            OrbitalArtRing={OrbitalArtRing}
            IceOrbPlay={IceOrbPlay}
            Icon={Icon}
            dockTintStyle={dockTintStyle}
            playsRemaining={playsRemaining}
            access={access}
            onOpenPlans={handleOpenPlans}
          />
        )}
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
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

        {/* Now Playing */}
        {currentTrack ? (
          <div style={{ padding: "22px 20px 18px", position: "relative" }}>
            {/* Ambient color wash behind art */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "78%",
              background: `radial-gradient(ellipse at 50% 18%, rgba(${glowRgb},0.14) 0%, transparent 68%)`,
              pointerEvents: "none",
            }}/>

            {/* Album art — framed, luminous */}
            <div style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1",
              overflow: "hidden",
              marginBottom: 18,
              borderRadius: 10,
              boxShadow: artShadow.raised,
              border: `1px solid ${glass.borderSoft}`,
            }}>
              {currentTrack.albumCover ? (
                <CoverImage
                  src={currentTrack.albumCover}
                  alt=""
                  width={360}
                  height={360}
                  sizes="(max-width: 900px) 40vw, 360px"
                  priority
                />
              ) : (
                <img
                  src="/covers/default.jpg"
                  alt=""
                  width={360}
                  height={360}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
              <div aria-hidden="true" style={{
                position: "absolute",
                inset: 0,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                pointerEvents: "none",
              }}/>
            </div>

            {/* Progress — whisper hairline under art (store-subscribed) */}
            <PlaybackProgressHairline />

            {/* Track info */}
            <div key={currentTrack.id} style={{
              position: "relative",
              animation: "trackSwap 0.35s cubic-bezier(0.22,1,0.36,1) both",
            }}>
              <div style={{
                fontSize: 17,
                fontWeight: 650,
                color: color.ink,
                letterSpacing: -0.35,
                lineHeight: 1.25,
                marginBottom: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: fontDisplay,
              }}>
                {currentTrack.title}
              </div>
              <div style={{
                fontSize: 13,
                color: color.muted,
                marginBottom: 14,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: -0.1,
              }}>
                {currentTrack.artist}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: "72px 20px",
            textAlign: "center",
            opacity: 0.55,
          }}>
            <BrandGlyph size={28}/>
            <div style={{
              marginTop: 14,
              fontSize: 11,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: color.faint,
              fontFamily: fontMono,
            }}>
              Nothing playing
            </div>
          </div>
        )}

        {/* Faded rule */}
        <div style={{
          height: 1,
          margin: "4px 20px 0",
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 80%, transparent 100%)",
        }}/>

        {/* Up Next */}
        <div style={{ flex: 1, padding: "18px 12px 24px", display: "flex", flexDirection: "column" }}>
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

      {/* Listening overlays + Booth */}
      {listeningOverlays}
      {boothPlayer}
    </div>
  );

  function onLikeToggle() { if(currentTrack) toggleLike(currentTrack.id); }
}

