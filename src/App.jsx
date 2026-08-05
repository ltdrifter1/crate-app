import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { createPortal }                             from "react-dom";
import { useNavigate, useLocation }                 from "react-router-dom";
import { useAuth }                                  from "./useAuth";
import { toggleLike as fbToggleLike, recordPlay, completeOnboarding, saveGenres } from "./useUserData";
import { collection, getDocs, addDoc, query, orderBy, doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db }                                       from "./firebase";
import {
  font, fontDisplay, fontMono, color, radius, motion,
  glass, glassControl, homeSpace, dock, sectionRule,
  artShadow, aluminumGradient,
  APP_STYLE, INPUT_ST, BTN_PRIMARY, BTN_SECONDARY, CTRL_BTN, ADMIN_UID,
  BRAND_NAME, brandStoragePrefix,
} from "./theme";
import { camelotCompatible, getEnergyRangeForHour, fmtTime, hexToRgbStr } from "./lib/harmony";
import {
  computeHumanState, findResonant, computeSignalTraits, pickNextTrack,
  buildSession, buildRoute, SESSION_PROFILES,
} from "./lib/engine";
import { mixLaneForDate } from "./lib/mixLanes";
import { normalizeGenre } from "./lib/genres";
import { parsePath, buildPath, documentTitleFor } from "./lib/routes";
import { explainPick } from "./lib/explain";
import { savedTracks, trendingTracks, recommendedPicks } from "./lib/homeCollections";
import { fetchCatalogTracks, countPlayableTracks } from "./lib/catalogLoad";
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
import CoverFlow from "./components/listen/CoverFlow";
import { playerEnergyStore } from "./lib/playerEnergyStore";
import ArtistPage, { AlbumPage } from "./components/catalog/ArtistPage";
import LinerNotesSheet from "./components/catalog/LinerNotesSheet";
import LoginScreen from "./components/auth/LoginScreen";
import CommunityMixBanner from "./components/club/CommunityMixBanner";
import {
  getAccessState,
  openStripeCheckout,
} from "./lib/entitlements";
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
import BrandMark, { BrandGlyph as DoorGlyph, BrandLockup } from "./components/brand/BrandMark";
import PlanetMascot from "./components/brand/PlanetMascot";
import SplashScreen from "./components/brand/SplashScreen";
import BrandTagline from "./components/brand/BrandTagline";
import GenreSceneBrowse from "./components/search/GenreSceneBrowse";
import GenreTasteSheet from "./components/listen/GenreTasteSheet";
import FlaskTasteButton from "./components/listen/FlaskTasteButton";
import ListenInsightsSheet from "./components/listen/ListenInsightsSheet";
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
  OnAirBadge,
  StationHeatBar,
  StationTicker,
  UpNextBumper,
  useStationFeed,
} from "./components/station/StationChrome";
import CountdownRail from "./components/station/CountdownRail";
import {
  HostCreditChip,
  NowOnAirCard,
  ShowGuideRail,
  useLiveAiring,
} from "./components/station/ShowGuide";
import VideoStage, { VideoBadge } from "./components/station/VideoStage";
import StationBumper from "./components/station/StationBumper";
import ChartHistoryPanel from "./components/station/ChartHistoryPanel";
import SceneSurfRail from "./components/station/SceneSurfRail";
import {
  buildShowPool,
  getShowById,
  pickShowBumper,
  resolveShowAt,
} from "./lib/shows";
import { ensureTodayChart, buildWeeklyReveal } from "./lib/chartHistory";
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
import ImmersivePlayer from "./components/player/ImmersivePlayer";

const ClubScreen = lazy(() => import("./components/club/ClubScreen"));
const LazyMixScreen = lazy(() => import("./components/club/MixScreen"));
const LazyPaywallScreen = lazy(() => import("./components/billing/PaywallScreen"));

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
      --glass-blur: ${glass.blur};
    }
    body { font-family: var(--font); background: var(--canvas); color: var(--ink); }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(26,29,36,0.18); border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
    button { transition: opacity ${motion.fast}, background ${motion.base}, transform ${motion.fast}, box-shadow ${motion.base}; font-family: var(--font); }
    button:active { opacity: 0.72; }
    button.play-primary:active { transform: scale(0.96); opacity: 0.9; }
    button.glass-control:hover { background: ${glass.fillStrong}; border-color: ${glass.border}; }
    button:focus-visible, input:focus-visible { outline: 2px solid ${color.accent}; outline-offset: 2px; }
    input:focus { outline: none; }
    input[type="range"] { -webkit-appearance: none; height: 4px; background: rgba(26,29,36,0.12); border-radius: 2px; outline: none; cursor: pointer; }
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
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 6px rgba(22,24,30,0.22);
      cursor: pointer;
    }
    input.chrome-seek::-moz-range-thumb {
      width: 18px; height: 18px; border-radius: 50%;
      background: linear-gradient(160deg, #FFFFFF 0%, #E8ECF2 45%, #C5CAD3 100%);
      border: 1px solid rgba(22,24,30,0.16);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 6px rgba(22,24,30,0.22);
      cursor: pointer;
    }
    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    .hide-scroll::-webkit-scrollbar { display: none; }
    .glass-surface {
      background: ${glass.fillStrong};
      border: 1px solid ${glass.borderSoft};
      box-shadow: inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft};
      -webkit-backdrop-filter: ${glass.blur};
      backdrop-filter: ${glass.blur};
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
      0%, 100% { box-shadow: 0 4px 14px rgba(22,24,30,0.2), 0 1px 0 rgba(255,255,255,0.5) inset; }
      50% { box-shadow: 0 6px 18px rgba(22,24,30,0.28), 0 1px 0 rgba(255,255,255,0.55) inset; }
    }
    @keyframes coverFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
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
      from { opacity: 0; transform: translateY(10px) skewX(-2deg); }
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
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 22px rgba(26,29,36,0.16) !important;
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
      background: rgba(246, 248, 252, 0.78);
      border: 1px solid ${glass.border};
      box-shadow:
        inset 0 1px 0 ${glass.highlight},
        0 14px 40px rgba(22, 24, 30, 0.12),
        0 2px 6px rgba(22, 24, 30, 0.05);
      -webkit-backdrop-filter: ${glass.blur};
      backdrop-filter: ${glass.blur};
      transition: background 0.6s ease;
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
      background: rgba(255,255,255,0.88) !important;
      border-color: rgba(26,29,36,0.14) !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.95),
        0 16px 40px rgba(26,29,36,0.12) !important;
      transform: translateY(-1px);
    }
    .custom-mix:hover .custom-mix-play {
      transform: scale(1.04);
      box-shadow: 0 8px 20px rgba(22,24,30,0.22) !important;
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
      background: rgba(22,24,30,0.05) !important;
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
      background: rgba(22,24,30,0.05) !important;
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
          background: i < level ? color.accent : "rgba(26,29,36,0.12)",
          transition:"background 0.2s",
        }}/>
      ))}
    </div>
  );
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size=18 }) => {
  const icons = {
    play:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
    pause:      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>,
    skip:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg>,
    prev:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>,
    heart:      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
    heartempty: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    search:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
    home:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
    profile:    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
    repeat:     <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>,
    shuffle:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>,
    settings:   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>,
    plus:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
    door:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter"><path d="M6 4h12v16H6z"/><path d="M9 7h5.2l1.3 10H9z"/><circle cx="13.2" cy="12" r="0.9" fill="currentColor" stroke="none"/></svg>,
    dig:        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 8h16v3H4z"/><path d="M5 11h14v3H5z"/><path d="M6 14h12v3H6z"/><path d="M8 6l2-2h4l2 2"/></svg>,
    map:        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M12 3l7 4v10l-7 4-7-4V7l7-4z"/><path d="M12 8v8M9 10.5h6"/></svg>,
    drift:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3c2 4 2 8 0 12s-2 8 0 12" opacity="0.5"/><path d="M3 12c4-2 8-2 12 0s8 2 12 0" opacity="0.5"/></svg>,
    grid:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="7" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="19" cy="17" r="2"/><path d="M7 8l3 3M17 8l-3 3M7 16l3-3M17 16l-3-3"/></svg>,
    x:          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
    edit:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>,
    trash:      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
    chev_up:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>,
    chev_down:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>,
    queue:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="18" cy="18" r="2" fill="currentColor" stroke="none"/></svg>,
    volume:     <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>,
    hypno:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>,
    // Session Dial — length (arc) + vibe (playlist bars). Key feature mark.
    timedmix:   <TimedMixMark size={size} />,
    flask:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6"/><path d="M10 3v5.2L5.8 16.2A3.2 3.2 0 0 0 8.6 21h6.8a3.2 3.2 0 0 0 2.8-4.8L14 8.2V3"/><path d="M8.2 14.5h7.6" opacity="0.55"/><circle cx="12" cy="17.2" r="1.1" fill="currentColor" stroke="none" opacity="0.85"/></svg>,
  };
  return icons[name] || null;
};

/** Custom mark for timed playlist builder — duration dial + track bars. */
function TimedMixMark({ size = 28, accent = color.accent }) {
  const r = 9.2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.72;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Quiet dial track */}
      <circle cx="16" cy="16" r={r} stroke="rgba(255,255,255,0.16)" strokeWidth="1.6"/>
      {/* Length arc — accent segment */}
      <circle
        cx="16" cy="16" r={r}
        stroke={accent}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray={`${arc} ${c}`}
        strokeDashoffset={28}
        transform="rotate(-95 16 16)"
        style={{ animation: "dialArc 1.1s cubic-bezier(0.22,1,0.36,1) both" }}
      />
      {/* Vibe bars — a short playlist inside the dial */}
      <rect x="10.2" y="12.1" width="11.6" height="1.7" rx="0.85" fill="rgba(255,255,255,0.88)"/>
      <rect x="10.2" y="15.15" width="8.4" height="1.7" rx="0.85" fill="rgba(255,255,255,0.55)"/>
      <rect x="10.2" y="18.2" width="5.6" height="1.7" rx="0.85" fill={accent}/>
    </svg>
  );
}

// ─── ALBUM ART — jewel-case when framed by parent ─────────────────────────────
function AlbumArt({ track, size=300, borderRadius=8 }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  if (!track.albumCover || error) {
    return (
      <div style={{
        width: size, height: size, borderRadius, flexShrink: 0,
        background: `linear-gradient(135deg,rgba(${hexToRgbStr(track.color)},0.45),rgba(${hexToRgbStr(track.color)},0.12))`,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <div style={{ fontSize: size * 0.25, fontWeight: 700, color: `rgba(${hexToRgbStr(track.color)},0.75)`, letterSpacing: -2, fontFamily: fontDisplay }}>
          {track.title.charAt(0)}{track.artist.charAt(0)}
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius, flexShrink: 0, position: "relative", overflow: "hidden", background: color.surfaceRaised }}>
      {!loaded && <div style={{ position: "absolute", inset: 0, background: `rgba(${hexToRgbStr(track.color)},0.12)`, animation: "shimmer 1.5s ease-in-out infinite" }}/>}
      <img src={track.albumCover} alt={track.album} onLoad={() => setLoaded(true)} onError={() => setError(true)}
        loading="lazy" decoding="async"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: loaded ? 1 : 0, transition: "opacity 0.4s" }}/>
    </div>
  );
}

// ─── VINYL RECORD ─────────────────────────────────────────────────────────────
function VinylRecord({ track, isPlaying, size=190 }) {
  const c = size/2;
  const grooves = Array.from({length:8},(_,i)=>({ r:size*0.24+i*(size*0.23/7), op:0.06+i*0.022 }));
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", position:"relative", overflow:"hidden",
      animation:isPlaying?"spin 2.8s linear infinite":"none",
      boxShadow:"0 8px 32px rgba(0,0,0,0.25)",
    }}>
      {track.albumCover
        ? <img src={track.albumCover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        : <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg,rgba(${hexToRgbStr(track.color)},0.4),#141416)` }}/>
      }
      <svg style={{ position:"absolute", inset:0 }} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={c} fill="rgba(0,0,0,0.52)"/>
        {grooves.map((g,i)=><circle key={i} cx={c} cy={c} r={g.r} fill="none" stroke={track.color} strokeWidth="0.7" opacity={g.op}/>)}
        <circle cx={c} cy={c} r={size*0.17} fill="rgba(0,0,0,0.65)"/>
        <circle cx={c} cy={c} r={size*0.17} fill={`rgba(${hexToRgbStr(track.color)},0.2)`}/>
        <circle cx={c} cy={c} r={3.5} fill="#0f1011"/>
        <circle cx={c} cy={c} r={1.4} fill={track.color} opacity="0.7"/>
      </svg>
    </div>
  );
}

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

// ─── Shared transport primitives (ice orb + orbital progress) ─────────────────
/** Circular ice primary play — shared by hero, dock, immersive, desktop. */
function IceOrbPlay({
  isPlaying = false,
  onClick,
  size = 58,
  iconSize = null,
  disabled = false,
  glowing = false,
  ariaLabel,
  stopPropagation = false,
}) {
  const iSize = iconSize ?? Math.round(size * 0.38);
  return (
    <button
      type="button"
      className="play-primary"
      aria-label={ariaLabel || (isPlaying ? "Pause" : "Play")}
      disabled={disabled}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onClick?.(e);
      }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: disabled
          ? color.surfaceRaised
          : `
            linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(236,240,246,0.88) 48%, rgba(214,220,230,0.78) 100%)
          `,
        border: `1px solid ${disabled ? glass.borderSoft : glass.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: disabled ? color.faint : color.ink,
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        backdropFilter: disabled ? "none" : glass.blur,
        WebkitBackdropFilter: disabled ? "none" : glass.blur,
        boxShadow: disabled
          ? "none"
          : glowing
            ? `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(22,24,30,0.06), 0 0 0 5px ${color.accentSoft}, 0 12px 32px rgba(26,29,36,0.16)`
            : `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(22,24,30,0.05), 0 10px 28px rgba(26,29,36,0.14)`,
        transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}`,
      }}
    >
      <Icon name={isPlaying ? "pause" : "play"} size={iSize} />
    </button>
  );
}

/**
 * Album art wrapped in an orbital progress ring — dock / desktop scrub language.
 */
function OrbitalArtRing({
  track,
  progress = 0,
  duration = 0,
  size = 40,
  onSeek,
  artRadius = 8,
}) {
  const scrubRef = useRef(null);
  const pct = duration > 0 ? Math.max(0, Math.min(1, progress / duration)) : 0;
  const stroke = 2.4;
  const pad = 6;
  const svgSize = size + pad * 2;
  const r = (svgSize - stroke) / 2 - 0.5;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  function seekFromPoint(clientX, clientY) {
    if (!duration || !onSeek || !scrubRef.current) return;
    const rect = scrubRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    onSeek(Math.floor((deg / 360) * duration));
  }

  return (
    <div
      ref={scrubRef}
      role={onSeek ? "slider" : undefined}
      aria-label={onSeek ? "Seek" : undefined}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? duration || 0 : undefined}
      aria-valuenow={onSeek ? progress : undefined}
      onClick={(e) => {
        e.stopPropagation();
        seekFromPoint(e.clientX, e.clientY);
      }}
      style={{
        position: "relative",
        width: svgSize,
        height: svgSize,
        flexShrink: 0,
        cursor: onSeek ? "pointer" : "default",
      }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
      >
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={r}
          fill="none"
          stroke="rgba(26,29,36,0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={r}
          fill="none"
          stroke={color.ink}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${Math.max(0, circ - dash)}`}
          style={{ transition: "stroke-dasharray 0.25s linear" }}
        />
      </svg>
      <div style={{
        position: "absolute",
        left: pad,
        top: pad,
        width: size,
        height: size,
        borderRadius: artRadius,
        overflow: "hidden",
        boxShadow: `0 0 0 1px ${glass.borderSoft}`,
      }}>
        <AlbumArt track={track} size={size} borderRadius={artRadius} />
      </div>
    </div>
  );
}

/**
 * Play orb with orbital seek ring — immersive / full-player transport.
 */
function OrbitalPlayControl({
  isPlaying,
  onToggle,
  progress = 0,
  duration = 0,
  onSeek,
  size = 64,
  glowing = false,
}) {
  const scrubRef = useRef(null);
  const pct = duration > 0 ? Math.max(0, Math.min(1, progress / duration)) : 0;
  const ring = size + 18;
  const stroke = 2.6;
  const r = (ring - stroke) / 2 - 1;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  function seekFromPoint(clientX, clientY) {
    if (!duration || !onSeek || !scrubRef.current) return;
    const rect = scrubRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    onSeek(Math.floor((deg / 360) * duration));
  }

  return (
    <div
      ref={scrubRef}
      style={{
        position: "relative",
        width: ring,
        height: ring,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={ring}
        height={ring}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", pointerEvents: "none" }}
      >
        <circle cx={ring / 2} cy={ring / 2} r={r} fill="none" stroke="rgba(26,29,36,0.12)" strokeWidth={stroke} />
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={r}
          fill="none"
          stroke={color.ink}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${Math.max(0, circ - dash)}`}
          style={{ transition: "stroke-dasharray 0.2s linear" }}
        />
      </svg>
      <button
        type="button"
        aria-label="Seek"
        onClick={(e) => {
          e.stopPropagation();
          seekFromPoint(e.clientX, e.clientY);
        }}
        style={{
          position: "absolute",
          inset: 0,
          background: "none",
          border: "none",
          cursor: onSeek ? "pointer" : "default",
          borderRadius: "50%",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <IceOrbPlay
          isPlaying={isPlaying}
          onClick={onToggle}
          size={size}
          stopPropagation
          glowing={glowing}
        />
      </div>
    </div>
  );
}

function dockTintStyle(track) {
  if (!track?.color) return undefined;
  const rgb = hexToRgbStr(track.color);
  return {
    background: `
      linear-gradient(165deg, rgba(${rgb},0.14) 0%, rgba(${rgb},0.04) 38%, rgba(255,255,255,0.82) 78%),
      rgba(255,255,255,0.78)
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
          background: night && !tintRgb ? "#FFD6AA" : color.accent,
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

/**
 * Home Cover Stage atmosphere.
 * Idle → brushed aluminum. Live → full-bleed sleeve as the visual plane
 * (Cover Flow / iTunes memory — never an inset Spotify card).
 */
function CoverStageAtmosphere({ track = null, playing = false, live = false }) {
  const hasArt = !!(live && track?.albumCover);

  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: aluminumGradient() }} />

      {/* Brushed aluminum window light */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `
          linear-gradient(115deg, rgba(255,255,255,0.62) 0%, transparent 40%, transparent 60%, rgba(26,29,36,0.045) 100%),
          radial-gradient(ellipse 90% 55% at 50% -8%, rgba(255,255,255,0.78) 0%, transparent 62%)
        `,
        opacity: hasArt ? 0.35 : 1,
        transition: "opacity 0.7s ease",
      }}/>

      {/* Full-bleed sleeve — edge-to-edge when listening */}
      {hasArt && (
        <div
          key={track.id}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${track.albumCover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            animation: `fadeIn 0.7s ${motion.ease} both`,
            transform: playing ? "scale(1.03)" : "scale(1)",
            transition: "transform 8s ease",
          }}
        />
      )}

      {/* Soft aluminum veil so chrome stays readable — cool Y2K grey, never OLED */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: hasArt
          ? `
            linear-gradient(180deg, rgba(226,230,237,0.58) 0%, rgba(226,230,237,0.12) 28%, rgba(226,230,237,0.08) 48%, rgba(226,230,237,0.84) 78%, rgba(226,230,237,0.97) 100%),
            radial-gradient(ellipse 70% 50% at 50% 18%, rgba(255,255,255,0.22) 0%, transparent 65%)
          `
          : `
            radial-gradient(ellipse 80% 50% at 50% 18%, rgba(190,198,210,0.22) 0%, transparent 60%),
            linear-gradient(180deg, rgba(226,230,237,0.08) 0%, transparent 30%, transparent 55%, rgba(226,230,237,0.92) 100%)
          `,
      }}/>
    </div>
  );
}

/**
 * Home Cover Stage — one chrome for idle and live.
 * Live mode runs as The Station: ON AIR, lower third, up next, heat, ticker.
 */
function CoverStage({
  onPlay, onTogglePlay, onSkip, onPrev, onOpen,
  currentTrack, isPlaying, isRadioMode, hypnoPocket = false,
  previewTrack = null, mixLane, playDisabled = false,
  onListenFor = null,
  intentLabel = null,
  onStageVisibilityChange = null,
  onSeek = null,
  upNextTrack = null,
  countdownRank = null,
  daypart = null,
  tickerText = "",
  onRequest = null,
  requested = false,
  onDedicate = null,
  dedicationFlash = null,
  onClearDedication = null,
  stationMode = false,
  liveShow = null,
}) {
  const { progress, duration } = usePlayerPlayback();
  const stageRef = useRef(null);
  const live = !!currentTrack;
  const canStart = !playDisabled;
  const stageTrack = currentTrack || previewTrack;
  const playingVisual = !!(live && isPlaying);
  const displayTrack = currentTrack || previewTrack || null;
  const showStation = !!(live && stationMode);
  const rgb = displayTrack?.color ? hexToRgbStr(displayTrack.color) : "42,46,56";
  const onAirLabel = liveShow?.shortTitle || liveShow?.title || daypart?.label || (mixLane === "night" ? "Night Crash" : "Daytime Live");

  useEffect(() => {
    if (!onStageVisibilityChange) return undefined;
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = !!entry && entry.isIntersecting && entry.intersectionRatio >= 0.35;
        onStageVisibilityChange(visible);
      },
      { threshold: [0, 0.2, 0.35, 0.5, 1] }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      onStageVisibilityChange(true);
    };
  }, [onStageVisibilityChange]);

  const openImmersive = () => {
    if (live && onOpen) onOpen();
  };

  const handlePrimary = () => {
    if (live) onTogglePlay?.();
    else if (canStart) onPlay?.();
  };

  return (
    <div
      ref={stageRef}
      style={{
        position: "relative",
        minHeight: showStation ? "min(100dvh - 64px, 860px)" : "min(100dvh - 88px, 720px)",
        height: showStation ? "min(100dvh - 64px, 860px)" : "min(100dvh - 88px, 720px)",
        background: color.canvas,
        overflow: "hidden",
        animation: "stationIn 0.85s cubic-bezier(0.22,1,0.36,1) both",
        outline: "none",
      }}
    >
      <CoverStageAtmosphere track={stageTrack} playing={playingVisual} live={live} />

      {showStation && trackHasVideo(stageTrack) ? (
        <VideoStage
          track={stageTrack}
          playing={playingVisual}
          progress={progress}
        />
      ) : (
        showStation && <HypnoVisualizer playing={playingVisual} colorHex={rgb} />
      )}

      {live && (
        <button
          type="button"
          aria-label="Open now playing"
          onClick={openImmersive}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background: "transparent",
            border: "none",
            cursor: onOpen ? "pointer" : "default",
            padding: 0,
          }}
        />
      )}

      {/* Top chrome — On Air + Interests */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, zIndex: 3,
          padding: `calc(14px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 0`,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <div style={{ pointerEvents: "none" }}>
            {(showStation || !live) && (
              <OnAirBadge
                showTitle={liveShow ? (liveShow.shortTitle || liveShow.title) : null}
                daypartLabel={onAirLabel}
              />
            )}
          </div>
          <div style={{ pointerEvents: "auto" }}>
            <FlaskTasteButton
              onClick={onListenFor || null}
              active={playingVisual}
              labeled
            />
          </div>
        </div>
        {showStation && tickerText && (
          <div style={{ margin: `0 -${homeSpace.gutter}px`, pointerEvents: "none" }}>
            <StationTicker text={tickerText} dense />
          </div>
        )}
      </div>

      {/* Idle brand plane — mascot stays in the visual field */}
      {!live && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: `72px ${homeSpace.gutter}px calc(210px + env(safe-area-inset-bottom, 0px))`,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{
            animation: `markIn 0.7s ${motion.ease} both`,
            width: "min(72vw, 300px)",
          }}>
            <PlanetMascot size={300} />
          </div>
        </div>
      )}

      {/* Shared transport chrome — identical idle ↔ live */}
      <div
        style={{
          position: "absolute",
          left: 0, right: 0, bottom: 0, zIndex: 2,
          padding: `0 ${homeSpace.gutter}px calc(18px + env(safe-area-inset-bottom, 0px))`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxSizing: "border-box",
          pointerEvents: "none",
          gap: 10,
        }}
      >
        {showStation && dedicationFlash && (
          <DedicationFlash dedication={dedicationFlash} onDone={onClearDedication} />
        )}

        {showStation && upNextTrack && (
          <UpNextBumper track={upNextTrack} />
        )}

        {showStation && displayTrack ? (
          <div
            role="button"
            tabIndex={0}
            onClick={openImmersive}
            onKeyDown={(e) => { if (e.key === "Enter") openImmersive(); }}
            style={{ width: "100%", maxWidth: 420, cursor: onOpen ? "pointer" : "default", pointerEvents: "auto" }}
          >
            <LowerThird track={displayTrack} rank={countdownRank} daypart={daypart} show={liveShow} />
            <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              <VideoBadge track={displayTrack} dark />
              {liveShow?.host && <HostCreditChip show={liveShow} compact />}
            </div>
          </div>
        ) : (
          <div
            key={displayTrack?.id || "idle-meta"}
            role={live ? "button" : undefined}
            tabIndex={live ? 0 : undefined}
            onClick={live ? openImmersive : undefined}
            onKeyDown={live ? ((e) => { if (e.key === "Enter") openImmersive(); }) : undefined}
            style={{
              width: "100%",
              maxWidth: 420,
              textAlign: "center",
              marginBottom: 6,
              animation: live ? `trackSwap 0.45s ${motion.ease} both` : `rise 0.65s ${motion.ease} 0.08s both`,
              cursor: live && onOpen ? "pointer" : "inherit",
              pointerEvents: live ? "auto" : "none",
            }}
          >
            {displayTrack ? (
              <>
                <h1 style={{
                  margin: 0,
                  fontSize: "clamp(20px, 3.8vw, 28px)",
                  fontWeight: 750,
                  letterSpacing: -0.6,
                  lineHeight: 1.12,
                  color: color.ink,
                  fontFamily: fontDisplay,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}>
                  {displayTrack.title}
                </h1>
                <div style={{
                  marginTop: 7,
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: -0.05,
                  color: color.body,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {displayTrack.artist}
                </div>
              </>
            ) : (
              <BrandTagline size={12} style={{ letterSpacing: 2.2, textAlign: "center", maxWidth: "none", margin: "0 auto" }} />
            )}
          </div>
        )}

        {showStation && (
          <StationHeatBar
            track={displayTrack}
            onRequest={onRequest}
            requested={requested}
            onDedicate={onDedicate}
          />
        )}

        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          pointerEvents: "auto",
          width: "100%",
          maxWidth: 420,
        }}>
          <EnergyShiftModeChip />
          <EnergyShiftFeedback bottom="calc(100% + 14px)" />

          <div style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: 64,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}>
              <button
                type="button"
                aria-label="Previous"
                disabled={!live}
                onClick={() => onPrev?.()}
                style={{
                  background: "none", border: "none", padding: 8,
                  color: live ? color.ink : color.faint,
                  cursor: live ? "pointer" : "default",
                  opacity: live ? 1 : 0.45,
                }}
              >
                <Icon name="prev" size={20}/>
              </button>

              <OrbitalPlayControl
                isPlaying={live ? isPlaying : false}
                onToggle={handlePrimary}
                progress={live ? progress : 0}
                duration={live ? duration : 0}
                onSeek={live ? onSeek : null}
                size={64}
                glowing={playingVisual}
              />

              <button
                type="button"
                aria-label="Next"
                disabled={!live && !canStart}
                onClick={() => {
                  if (live) onSkip?.();
                  else if (canStart) onPlay?.();
                }}
                style={{
                  background: "none", border: "none", padding: 8,
                  color: (live || canStart) ? color.ink : color.faint,
                  cursor: (live || canStart) ? "pointer" : "default",
                  opacity: (live || canStart) ? 1 : 0.45,
                }}
              >
                <Icon name="skip" size={20}/>
              </button>
            </div>

            <div style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
            }}>
              <EnergyShiftControl size={40} stopPropagation={false} />
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: 200,
            fontSize: 11,
            fontFamily: fontMono,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: 0.3,
            color: color.faint,
            pointerEvents: "none",
          }}>
            <span>{live ? fmtTime(progress) : "0:00"}</span>
            <span>{live && duration ? fmtTime(duration) : "—:—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PLAYLIST MENU CONTEXT ────────────────────────────────────────────────────
// Passed down so every track surface can add/remove playlists
const PlaylistCtx = {
  playlists: [],
  onCreate: () => {},
  onAdd: () => {},
  onRemove: () => {},
  onToast: () => {},
  onResonance: null,
  onLike: null,
};

function clampMenuPos(x, y, w = 240, h = 320) {
  const pad = 8;
  const left = Math.max(pad, Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 400) - w - pad));
  const top = Math.max(pad, Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 700) - h - pad));
  return { left, top };
}

/** Spotify/iTunes-style track menu — ⋯ or right-click. Portaled so it never clips. */
function TrackActionsMenu({ track, playlistCtx, activePlaylistId, x, y, onClose }) {
  const ctx = playlistCtx || PlaylistCtx;
  const [newPlName, setNewPlName] = useState("");
  const [showNewPl, setShowNewPl] = useState(false);
  const menuRef = useRef(null);
  const pos = clampMenuPos(x, y);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [onClose]);

  function inPlaylist(pl) {
    return (pl.trackIds || []).includes(track.id);
  }

  function handleTogglePlaylist(pl) {
    if (inPlaylist(pl)) {
      ctx.onRemove(track.id, pl.id);
    } else {
      ctx.onAdd(track.id, pl.id);
    }
    onClose();
  }

  function handleCreateAndAdd() {
    if (!newPlName.trim()) return;
    ctx.onCreate(newPlName.trim(), track.id);
    setNewPlName("");
    setShowNewPl(false);
    onClose();
  }

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Track actions"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        zIndex: 400,
        background: "rgba(255,255,255,0.92)",
        border: `1px solid ${glass.border}`,
        borderRadius: radius.md,
        padding: "6px 0",
        minWidth: 220,
        maxWidth: 280,
        maxHeight: "min(70vh, 420px)",
        overflowY: "auto",
        boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 16px 40px rgba(26,29,36,0.16)`,
        backdropFilter: glass.blur,
        WebkitBackdropFilter: glass.blur,
        animation: "fadeIn 0.12s ease both",
      }}
    >
      <div style={{ padding: "8px 14px 10px", borderBottom: `1px solid ${glass.borderFaint}` }}>
        <div style={{ fontSize: 13, fontWeight: 650, color: color.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: fontDisplay }}>
          {track.title}
        </div>
        <div style={{ fontSize: 11, color: color.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {track.artist}
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: color.faint, padding: "10px 14px 4px", textTransform: "uppercase", fontFamily: fontMono }}>
        Add to Playlist
      </div>

      {ctx.playlists.length === 0 && !showNewPl && (
        <div style={{ fontSize: 13, color: color.muted, padding: "8px 14px 4px" }}>
          No playlists yet — create one below.
        </div>
      )}

      {ctx.playlists.map((pl) => {
        const has = inPlaylist(pl);
        return (
          <button
            key={pl.id}
            type="button"
            role="menuitem"
            onClick={() => handleTogglePlaylist(pl)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              width: "100%", textAlign: "left", background: "none", border: "none",
              color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</span>
            <span style={{
              flexShrink: 0, fontSize: 12, fontFamily: fontMono,
              color: has ? color.accent : color.faint,
            }}>
              {has ? "✓" : "+"}
            </span>
          </button>
        );
      })}

      <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />

      {showNewPl ? (
        <div style={{ padding: "8px 12px" }}>
          <input
            autoFocus
            value={newPlName}
            onChange={(e) => setNewPlName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateAndAdd();
              if (e.key === "Escape") setShowNewPl(false);
            }}
            placeholder="Playlist name…"
            style={{ ...INPUT_ST, marginBottom: 6, padding: "8px 10px", fontSize: 16 }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={handleCreateAndAdd} style={{ flex: 1, background: color.accent, border: "none", borderRadius: radius.sm, color: color.onAccent, fontSize: 13, fontWeight: 600, padding: "8px 0", cursor: "pointer" }}>
              Create
            </button>
            <button type="button" onClick={() => setShowNewPl(false)} style={{ flex: 1, background: "transparent", border: `1px solid ${color.line}`, borderRadius: radius.sm, color: color.muted, fontSize: 13, padding: "8px 0", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          role="menuitem"
          onClick={() => setShowNewPl(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer", fontWeight: 500 }}
        >
          <Icon name="plus" size={14} /> New Playlist
        </button>
      )}

      {ctx.onLike && (
        <>
          <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />
          <button
            type="button"
            role="menuitem"
            onClick={() => { ctx.onLike(track.id); onClose(); }}
            style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
          >
            {track.liked ? "Remove from Saved" : "Save track"}
          </button>
        </>
      )}

      {(ctx.onOpenArtist || ctx.onOpenAlbum) && (
        <>
          <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />
          {ctx.onOpenArtist && track.artist && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { ctx.onOpenArtist(track.artist); onClose(); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
            >
              View artist
            </button>
          )}
          {ctx.onOpenAlbum && track.album && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { ctx.onOpenAlbum(track); onClose(); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
            >
              View album
            </button>
          )}
        </>
      )}

      {ctx.onResonance && (
        <button
          type="button"
          role="menuitem"
          onClick={() => { ctx.onResonance(track); onClose(); }}
          style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
        >
          Find similar
        </button>
      )}

      {ctx.onHypnoRadio && (
        <button
          type="button"
          role="menuitem"
          onClick={() => { ctx.onHypnoRadio(track); onClose(); }}
          style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
        >
          Play similar mix
        </button>
      )}

      {activePlaylistId && activePlaylistId !== "liked" && (
        <>
          <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              ctx.onRemove(track.id, activePlaylistId);
              onClose();
            }}
            style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.alert, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
          >
            Remove from this playlist
          </button>
        </>
      )}
    </div>
  );

  return createPortal(menu, document.body);
}

function useTrackMenu() {
  const [menu, setMenu] = useState(null); // { track, x, y, activePlaylistId } | null
  const openAt = useCallback((track, x, y, activePlaylistId = null) => {
    setMenu({ track, x, y, activePlaylistId });
  }, []);
  const openFromButton = useCallback((e, track, activePlaylistId = null) => {
    e.preventDefault();
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    openAt(track, r.right - 220, r.bottom + 4, activePlaylistId);
  }, [openAt]);
  const openFromContext = useCallback((e, track, activePlaylistId = null) => {
    e.preventDefault();
    e.stopPropagation();
    openAt(track, e.clientX, e.clientY, activePlaylistId);
  }, [openAt]);
  const close = useCallback(() => setMenu(null), []);
  return { menu, openFromButton, openFromContext, close };
}

function TrackMoreButton({ onClick, size = 18 }) {
  return (
    <button
      type="button"
      aria-label="More"
      aria-haspopup="menu"
      onClick={onClick}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: color.faint, padding: "8px 10px", fontSize: size, lineHeight: 1, flexShrink: 0,
      }}
    >
      ⋯
    </button>
  );
}

// ─── TRACK ROW ────────────────────────────────────────────────────────────────
function TrackRow({ track, onPlay, active, isPlaying, onLike, extraAction, playlistCtx, activePlaylistId, rank = null }) {
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();

  return (
    <div style={{ position: "relative" }}>
      <div
        role="button"
        tabIndex={0}
        className="track-row"
        onClick={onPlay}
        onContextMenu={(e) => openFromContext(e, track, activePlaylistId)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlay(); } }}
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "9px 10px", borderRadius: radius.sm,
          cursor: "pointer", marginBottom: 1,
          background: active ? color.select : "transparent",
          border: active ? `1px solid ${color.accentSoft}` : "1px solid transparent",
        }}
      >
        {rank != null && (
          <span aria-hidden="true" style={{
            width: 22, textAlign: "center", flexShrink: 0,
            fontFamily: fontMono, fontVariantNumeric: "tabular-nums",
            fontSize: rank <= 3 ? 15 : 13,
            fontWeight: rank <= 3 ? 750 : 600,
            color: rank <= 3 ? color.accent : color.faint,
          }}>{rank}</span>
        )}
        <div style={{ width: 42, height: 42, borderRadius: 6, overflow: "hidden", flexShrink: 0, position: "relative", boxShadow: artShadow.quiet }}>
          <AlbumArt track={track} size={42} borderRadius={0} />
          {active && isPlaying && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(26,29,36,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color.accent, animation: "pulse 1.2s ease-in-out infinite" }} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: active ? 650 : 500, letterSpacing: -0.1, color: active ? color.accent : color.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
          <div style={{ fontSize: 12, color: color.muted, marginTop: 2 }}>{track.artist}{displaySceneLabel(track) ? ` · ${displaySceneLabel(track)}` : (normalizeGenre(track.genre) ? ` · ${normalizeGenre(track.genre)}` : "")}</div>
        </div>
        {onLike && (
          <button type="button" aria-label={track.liked ? "Unlike" : "Like"} onClick={(e) => { e.stopPropagation(); onLike(track.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: track.liked ? color.accent : color.faint, padding: 8 }}>
            <span style={{ display: "flex", animation: track.liked ? "likePop 0.25s ease" : "none" }}>
              <Icon name={track.liked ? "heart" : "heartempty"} size={18} />
            </span>
          </button>
        )}
        <TrackMoreButton onClick={(e) => openFromButton(e, track, activePlaylistId)} />
        {extraAction || null}
      </div>

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

  const chromeChip = (selected) => ({
    borderRadius: radius.md,
    border: selected ? `1px solid rgba(22,24,30,0.28)` : `1px solid ${glass.border}`,
    background: selected
      ? `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 45%), linear-gradient(165deg, #3A404C 0%, #1A1D24 100%)`
      : `linear-gradient(160deg, rgba(255,255,255,0.88) 0%, rgba(236,240,246,0.62) 100%)`,
    color: selected ? color.onAccent : color.body,
    boxShadow: selected
      ? `inset 0 1px 0 rgba(255,255,255,0.2), ${glass.shadowSoft}`
      : `inset 0 1px 0 ${glass.highlight}`,
    backdropFilter: selected ? "none" : glass.blurSoft,
    WebkitBackdropFilter: selected ? "none" : glass.blurSoft,
    cursor: "pointer",
    fontWeight: 600,
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: aluminumGradient(),
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
        background: "linear-gradient(180deg, rgba(230,233,239,0.2) 0%, rgba(230,233,239,0.55) 55%, rgba(230,233,239,0.92) 100%)",
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
            fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase",
            color: color.faint, fontFamily: fontMono,
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
                fontSize: 11, fontWeight: 650, letterSpacing: 1.6, textTransform: "uppercase",
                color: color.muted, fontFamily: fontMono, marginBottom: 12,
              }}>
                Build a custom mix
              </div>
              <div style={{
                fontSize: 34, fontWeight: 700, color: color.ink, letterSpacing: -1,
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
                background: "rgba(255,255,255,0.72)", border: `1px solid ${glass.border}`, padding: "8px 0",
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
              border: n.active ? "2px solid #FFFFFF" : "1px solid rgba(255,255,255,0.5)",
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
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)" }}>{hover.artist} · {hover.camelot} · E{hover.energy}</div>
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
        background: "rgba(255,255,255,0.92)",
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
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(26,29,36,0.38)", backdropFilter:"blur(10px)" }}/>
      <div style={{
        position:"absolute", left:0, right:0, bottom:0, maxHeight:"72vh",
        background: color.surfaceSolid, borderTop:`1px solid ${color.lineStrong}`,
        borderRadius:"16px 16px 0 0", display:"flex", flexDirection:"column",
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

// ── Key feature: Build a custom mix — duration + vibe session builder entry ──
function CustomMixFeature({ onClick }) {
  const steps = [
    { n: "01", label: "Length", hint: "30 min → night" },
    { n: "02", label: "Vibe", hint: "Drive, focus…" },
    { n: "03", label: "Arc", hint: "Warm → peak → chill" },
  ];

  return (
    <button
      type="button"
      className="custom-mix"
      onClick={onClick}
      aria-label="Build a custom mix — pick length, then vibe"
      style={{
        position: "relative",
        overflow: "hidden",
        display: "block",
        minHeight: 0,
        margin: `0 ${homeSpace.gutter}px`,
        width: `calc(100% - ${homeSpace.gutter * 2}px)`,
        padding: "20px 20px 18px",
        border: `1px solid ${glass.border}`,
        borderRadius: radius.xl,
        background: `
          linear-gradient(145deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.42) 48%, rgba(236,240,246,0.55) 100%),
          ${aluminumGradient()}
        `,
        boxShadow: `
          inset 0 1px 0 ${glass.highlight},
          inset 0 -1px 0 rgba(22,24,30,0.04),
          ${glass.shadow}
        `,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
        cursor: "pointer",
        textAlign: "left",
        color: color.ink,
        animation: "rise 0.55s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <div aria-hidden="true" style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `
          radial-gradient(ellipse 70% 80% at 0% 0%, rgba(255,255,255,0.7) 0%, transparent 55%),
          linear-gradient(115deg, rgba(190,198,210,0.16) 0%, transparent 42%)
        `,
      }}/>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 16,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontFamily: fontMono,
              color: color.faint,
              marginBottom: 6,
            }}>
              Custom mix
            </div>
            <div style={{
              fontSize: "clamp(18px, 4vw, 22px)",
              fontWeight: 700,
              fontFamily: fontDisplay,
              letterSpacing: -0.45,
              lineHeight: 1.12,
              marginBottom: 6,
            }}>
              Build a set
            </div>
            <p style={{
              margin: 0,
              fontSize: 13,
              color: color.muted,
              lineHeight: 1.4,
              maxWidth: 320,
            }}>
              Pick a length and vibe — we shape the energy with you.
            </p>
          </div>
          <span
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${glass.border}`,
              background: glass.fillStrong,
              boxShadow: `inset 0 1px 0 ${glass.highlight}`,
              color: color.ink,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            →
          </span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
        }}>
          {steps.map((s) => (
            <div
              key={s.n}
              style={{
                padding: "10px 10px 12px",
                borderRadius: radius.md,
                border: `1px solid ${glass.borderSoft}`,
                background: "rgba(255,255,255,0.55)",
                boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                minWidth: 0,
              }}
            >
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.1,
                color: color.faint,
                fontFamily: fontMono,
                marginBottom: 4,
              }}>
                {s.n}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                fontFamily: fontDisplay,
                letterSpacing: -0.2,
                color: color.ink,
                marginBottom: 2,
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: 11,
                color: color.muted,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {s.hint}
              </div>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}


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
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35)`,
                }}/>
                {showRanks && (
                  <div aria-hidden="true" style={{
                    position: "absolute", left: 8, top: 8,
                    minWidth: 24, height: 24, padding: "0 6px",
                    borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(255,255,255,0.88)",
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

// ── Home — three acts only ────────────────────────────────────────────────────
const HomeSection = ({ label, count, subtitle, children, delay = 0, first = false, eyebrow = null }) => (
  <section
    style={{
      margin: 0,
      paddingBottom: homeSpace.sectionPadBottom,
      animation: `rise 0.55s ${motion.ease} ${delay}s both`,
    }}
  >
    {!first && (
      <div aria-hidden="true" style={{
        padding: `${Math.round(homeSpace.sectionPadTop * 0.45)}px 0 ${Math.round(homeSpace.sectionPadTop * 0.55)}px`,
      }}>
        <div style={sectionRule(homeSpace.gutter)}/>
      </div>
    )}
    {first && <div style={{ height: label || eyebrow ? homeSpace.sectionPadTopFirst + 8 : 8 }} aria-hidden="true"/>}
    {(label || eyebrow) && (
    <div style={{
      padding: `0 ${homeSpace.gutter}px ${subtitle ? 6 : 16}px`,
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 12,
    }}>
      <div>
        {eyebrow && (
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: color.faint,
            fontFamily: fontMono,
            marginBottom: 6,
          }}>
            {eyebrow}
          </div>
        )}
        {label && (
        <h2 style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: -0.5,
          color: color.ink,
          fontFamily: fontDisplay,
        }}>{label}</h2>
        )}
      </div>
      {count != null && (
        <span style={{
          fontSize: 12,
          color: color.muted,
          fontVariantNumeric: "tabular-nums",
          fontWeight: 600,
          fontFamily: fontMono,
          letterSpacing: 0.2,
        }}>{count}</span>
      )}
    </div>
    )}
    {subtitle ? (
      <p style={{
        margin: `0 ${homeSpace.gutter}px 16px`,
        fontSize: 13,
        color: color.muted,
        lineHeight: 1.4,
        letterSpacing: -0.1,
        maxWidth: 420,
      }}>{subtitle}</p>
    ) : null}
    {children}
  </section>
);

function HomeCatalogStatus({ error, isEmpty, playableCount, totalCount, onRetry }) {
  if (!error && !isEmpty) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      style={{
        margin: `0 ${homeSpace.gutter}px ${homeSpace.sectionPadTopFirst}px`,
        padding: "16px 18px",
        borderRadius: radius.lg,
        border: `1px solid ${error ? color.lineStrong : color.line}`,
        background: glass.fillStrong,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
      }}
    >
      {error ? (
        <>
          <div style={{ fontSize: 15, fontWeight: 650, color: color.ink, marginBottom: 6 }}>
            Couldn&apos;t pull the shelf
          </div>
          <div style={{ fontSize: 13, color: color.body, lineHeight: 1.45, marginBottom: 12 }}>
            Check your connection and try again. If this keeps happening, the catalog may need a moment to sync.
          </div>
          <button
            type="button"
            onClick={onRetry}
            style={{
              ...BTN_PRIMARY,
              width: "auto",
              padding: "10px 18px",
              fontSize: 14,
            }}
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 15, fontWeight: 650, color: color.ink, marginBottom: 6 }}>
            Nothing here yet
          </div>
          <div style={{ fontSize: 13, color: color.body, lineHeight: 1.45 }}>
            {totalCount > 0 && playableCount === 0
              ? `${totalCount} catalog entries are missing audio — add audioUrl in admin or re-upload tracks.`
              : "Once tracks land in the catalog, they show up here. Tap Retry to load again."}
          </div>
          <button
            type="button"
            onClick={onRetry}
            style={{
              ...BTN_SECONDARY,
              width: "auto",
              marginTop: 12,
              padding: "10px 18px",
              fontSize: 14,
            }}
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Selected for you — Cover Flow of recommended tracks with reason cues.
 */
function ForYouRiver({
  tracks = [],
  reasons = null,
  coldStart = false,
  onPlayTrack,
  activeId,
  isPlaying,
}) {
  if (!tracks.length) return null;

  return (
    <HomeSection
      label={coldStart ? "Fresh picks" : "Selected for you"}
      delay={0.06}
      first={false}
    >
      <CoverFlow
        tracks={tracks}
        reasons={reasons}
        onPlayTrack={(t) => onPlayTrack(t, tracks)}
        activeId={activeId}
        isPlaying={isPlaying}
        size={200}
        limit={25}
      />
    </HomeSection>
  );
}

function HomeScreen({
  tracks, onPlayRadio, onTogglePlay, onPlayTrack, currentTrack, isPlaying, onLike,
  isRadioMode, playlistCtx, signalLabel, hypnoPocket = false,
  mixLane, radioPreview = null, radioNext = null, onSkipRadio, onPrevRadio,
  catalogError = null, onRetryCatalog,
  preferredGenres = [], recentTrackIds = [],
  onOpenPlayer, onListenFor = null,
  intentLabel = null,
  communityMix = null, onOpenCommunityMix = null,
  onBrowse = null,
  onCustomMix = null,
  onStageVisibilityChange = null,
  onSeek = null,
  userKey = "",
  countdown = [],
  onTuneCountdown = null,
  daypart = null,
  tickerText = "",
  onRequest = null,
  requested = false,
  onDedicate = null,
  dedicationFlash = null,
  onClearDedication = null,
  airing = null,
  programGuide = [],
  activeShowId = null,
  onTuneShow = null,
  showBumper = null,
  channelShow = null,
  sceneChannelsActiveId = null,
  onTuneSceneChannel = null,
  onTuneWeeklyReveal = null,
}) {
  const activeId = currentTrack?.id;
  const playableCount = countPlayableTracks(tracks);
  const catalogEmpty = !catalogError && tracks.length === 0;
  const catalogDepleted = !catalogError && tracks.length > 0 && playableCount === 0;

  const tasteKey = (preferredGenres || []).join("\u0001");
  const recentKey = (recentTrackIds || []).join("\u0001");
  const catalogKey = tracks.length;

  const recentlyPlayed = useMemo(
    () => [...new Set(recentTrackIds)]
      .map((id) => tracks.find((t) => t.id === id))
      .filter(Boolean)
      .slice(0, 25),
    [tracks, recentKey]
  );

  const trending = useMemo(() => trendingTracks(tracks, 25), [tracks, catalogKey]);

  const dayKey = new Date().toISOString().slice(0, 10);
  const { picks: recommended, coldStart } = useMemo(
    () => recommendedPicks(tracks, {
      preferredGenres,
      recentTrackIds,
      limit: 25,
      excludeIds: [],
      userKey,
      dayKey,
    }),
    [tracks, catalogKey, tasteKey, recentKey, userKey, dayKey]
  );

  const forYouTracks = useMemo(() => {
    const seen = new Set();
    const rail = [];
    const pushUnique = (list) => {
      for (const t of list) {
        if (!t?.id || seen.has(t.id)) continue;
        seen.add(t.id);
        rail.push(t);
        if (rail.length >= 25) return;
      }
    };
    pushUnique(recommended.map((p) => p.track));
    pushUnique(trending);
    pushUnique(recentlyPlayed);
    pushUnique(tracks);
    return rail;
  }, [recommended, trending, recentlyPlayed, tracks]);

  const forYouReasons = useMemo(() => {
    const map = {};
    for (const p of recommended) {
      if (p?.track?.id && p.reason) map[p.track.id] = p.reason;
    }
    return map;
  }, [recommended]);

  const countdownRank = useMemo(() => {
    if (!currentTrack?.id || !countdown.length) return null;
    const hit = countdown.find((c) => c.track.id === currentTrack.id);
    return hit?.rank ?? null;
  }, [countdown, currentTrack?.id]);

  return (
    <div style={{ position: "relative", paddingBottom: 48 }}>
      <CoverStage
        onPlay={onPlayRadio}
        onTogglePlay={onTogglePlay}
        onSkip={onSkipRadio}
        onPrev={onPrevRadio}
        onOpen={onOpenPlayer}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isRadioMode={isRadioMode}
        hypnoPocket={hypnoPocket}
        previewTrack={radioPreview}
        mixLane={mixLane}
        playDisabled={catalogEmpty || catalogDepleted || !!catalogError}
        onListenFor={onListenFor}
        intentLabel={intentLabel}
        onStageVisibilityChange={onStageVisibilityChange}
        onSeek={onSeek}
        upNextTrack={radioNext}
        countdownRank={countdownRank}
        daypart={daypart}
        tickerText={tickerText}
        onRequest={onRequest}
        requested={requested}
        onDedicate={onDedicate}
        dedicationFlash={dedicationFlash}
        onClearDedication={onClearDedication}
        stationMode
        liveShow={channelShow || airing?.show || null}
      />

      {(catalogError || catalogEmpty || catalogDepleted) && (
        <HomeCatalogStatus
          error={catalogError}
          isEmpty={catalogEmpty || catalogDepleted}
          playableCount={playableCount}
          totalCount={tracks.length}
          onRetry={onRetryCatalog}
        />
      )}

      <div style={{
        position: "relative",
        background: color.canvas,
      }}>
        {airing?.show && !catalogEmpty && !catalogError && (
          <div style={{ paddingTop: 18, paddingBottom: 4 }}>
            <NowOnAirCard
              airing={airing}
              bumper={showBumper}
              tuned={activeShowId === airing.show.id && !!currentTrack}
              onTuneIn={() => onTuneShow?.(airing.show)}
            />
          </div>
        )}

        {programGuide.length > 0 && !catalogEmpty && !catalogError && (
          <ShowGuideRail
            guide={programGuide}
            activeShowId={activeShowId}
            onSelectShow={(show) => onTuneShow?.(show)}
          />
        )}

        {!catalogEmpty && !catalogError && (
          <SceneSurfRail
            tracks={tracks}
            activeChannelId={sceneChannelsActiveId}
            onTuneChannel={onTuneSceneChannel}
          />
        )}

        {countdown.length > 0 && !catalogEmpty && !catalogError && (
          <CountdownRail
            entries={countdown}
            onPlayTrack={onPlayTrack}
            onTuneIn={onTuneCountdown}
            activeId={activeId}
            isPlaying={isPlaying}
          />
        )}

        {countdown.length > 0 && !catalogEmpty && !catalogError && (
          <ChartHistoryPanel
            countdown={countdown}
            tracks={tracks}
            onPlayTrack={onPlayTrack}
            onTuneWeekly={onTuneWeeklyReveal}
          />
        )}

        {forYouTracks.length > 0 && (
          <ForYouRiver
            tracks={forYouTracks}
            reasons={forYouReasons}
            coldStart={coldStart}
            onPlayTrack={onPlayTrack}
            activeId={activeId}
            isPlaying={isPlaying}
            onLike={onLike}
            playlistCtx={playlistCtx}
          />
        )}

        {onBrowse && !catalogEmpty && !catalogError && (
          <section
            aria-label="Browse the library"
            style={{
              padding: `${forYouTracks.length > 0 || countdown.length > 0 ? 8 : 22}px ${homeSpace.gutter}px 10px`,
            }}
          >
            <button
              type="button"
              onClick={onBrowse}
              aria-label="Browse the library"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "16px 18px",
                borderRadius: radius.lg,
                border: `1px solid ${glass.borderSoft}`,
                background: `
                  linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(246,248,252,0.45) 100%)
                `,
                boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
                backdropFilter: glass.blurSoft,
                WebkitBackdropFilter: glass.blurSoft,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  fontFamily: fontMono,
                  color: color.faint,
                  marginBottom: 4,
                }}>
                  Explore
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 650,
                  fontFamily: fontDisplay,
                  letterSpacing: -0.2,
                  color: color.ink,
                }}>
                  Browse the library
                </div>
              </div>
              <span aria-hidden="true" style={{ color: color.faint, fontSize: 18 }}>→</span>
            </button>
          </section>
        )}

        {onCustomMix && !catalogEmpty && !catalogError && (
          <section
            aria-label="Custom mix"
            style={{
              margin: 0,
              paddingTop: forYouTracks.length > 0 || countdown.length > 0 ? 4 : 12,
              paddingBottom: 14,
              animation: `rise 0.55s ${motion.ease} 0.04s both`,
            }}
          >
            <CustomMixFeature onClick={onCustomMix} />
          </section>
        )}

        {communityMix && onOpenCommunityMix && (
          <CommunityMixBanner
            mix={communityMix}
            onOpen={onOpenCommunityMix}
            coverTracks={(communityMix.trackIds || [])
              .map((id) => tracks.find((t) => t.id === id))
              .filter(Boolean)
              .slice(0, 4)}
            onPlay={() => {
              const pool = (communityMix.trackIds || [])
                .map((id) => tracks.find((t) => t.id === id))
                .filter(Boolean);
              if (pool[0]) onPlayTrack(pool[0], pool);
            }}
          />
        )}

        {!catalogError && !catalogEmpty && forYouTracks.length === 0 && countdown.length === 0 && (
          <div style={{ padding: `28px ${homeSpace.gutter}px 56px` }}>
            <div className="glass-surface" style={{ padding: "28px 22px", borderRadius: radius.lg }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fontDisplay, color: color.ink, marginBottom: 8, letterSpacing: -0.4 }}>
                Nothing on the shelf
              </div>
              <div style={{ fontSize: 15, color: color.muted, lineHeight: 1.5, maxWidth: 280 }}>
                Add cuts to the catalog and they land here.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function SearchScreen({
  query, setQuery, results, onPlay, onLike, currentTrack, isPlaying, playlistCtx,
  entityHits, onOpenArtist, onOpenAlbum, tracks = [], onListenIntent = null,
  recentSearches = [], onPickRecent = null, onClearRecent = null,
}) {
  const [showAllResults, setShowAllResults] = useState(false);
  useEffect(() => { setShowAllResults(false); }, [query]);
  const RESULT_CAP = 50;
  const visibleResults = showAllResults ? results : results.slice(0, RESULT_CAP);
  const hintChip = {
    background: color.surfaceRaised,
    border: `1px solid ${glass.borderSoft}`,
    borderRadius: 980,
    padding: "7px 13px",
    fontSize: 12.5,
    fontWeight: 600,
    color: color.body,
    cursor: "pointer",
    fontFamily: fontMono,
    letterSpacing: 0.2,
  };
  return (
    <div style={{ padding: "0 0 16px" }}>
      <div style={{
        padding: `calc(14px + env(safe-area-inset-top, 0px)) 16px 0`,
      }}>
      <div style={{ position:"relative", marginBottom:14 }}>
        <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: color.faint }}><Icon name="search" size={16}/></div>
        <input
          placeholder="Search"
          aria-label="Search"
          style={{...INPUT_ST, paddingLeft:42, paddingRight: query ? 42 : 16, background: color.surfaceRaised, border: "none"}}
          value={query}
          onChange={e=>setQuery(e.target.value)}
          autoFocus={typeof window !== "undefined" && window.innerWidth >= 900}
        />
        {query && (
          <button type="button" onClick={()=>setQuery("")} aria-label="Clear search"
            style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color: color.faint, padding:10 }}>
            <Icon name="x" size={15}/>
          </button>
        )}
      </div>
      {!query && recentSearches.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontSize:12, fontWeight:650, color: color.muted, textTransform:"uppercase", letterSpacing:0.6 }}>Recent</div>
            {onClearRecent && (
              <button type="button" onClick={onClearRecent}
                style={{ background:"none", border:"none", cursor:"pointer", color: color.faint, fontSize:12, fontWeight:600, padding:"2px 4px" }}>
                Clear
              </button>
            )}
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {recentSearches.map((q) => (
              <button key={q} type="button" onClick={() => (onPickRecent || setQuery)(q)}
                style={{ ...hintChip, fontFamily: font, letterSpacing: 0 }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      {query.length > 1 && entityHits?.artists?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {entityHits.artists.map((a) => (
            <button
              key={a.slug}
              type="button"
              onClick={() => onOpenArtist?.(a.slug)}
              style={{
                display:"flex", alignItems:"center", gap:12, width:"100%", padding:"10px 4px",
                background:"none", border:"none", borderBottom:`1px solid ${color.line}`,
                cursor:"pointer", textAlign:"left", color: color.ink,
              }}
            >
              <div style={{ width:48, height:48, overflow:"hidden", flexShrink:0, background: color.surfaceRaised, borderRadius: 24 }}>
                {a.coverTrack && <AlbumArt track={a.coverTrack} size={48} borderRadius={24}/>}
              </div>
              <div style={{ minWidth:0, fontSize:17, fontWeight:600, fontFamily: fontDisplay }}>{a.name}</div>
            </button>
          ))}
        </div>
      )}
      {query.length > 1 && entityHits?.albums?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {entityHits.albums.map((a) => (
            <button
              key={a.slug}
              type="button"
              onClick={() => onOpenAlbum?.(a.slug)}
              style={{
                display:"flex", alignItems:"center", gap:12, width:"100%", padding:"10px 4px",
                background:"none", border:"none", borderBottom:`1px solid ${color.line}`,
                cursor:"pointer", textAlign:"left", color: color.ink,
              }}
            >
              <div style={{ width:48, height:48, overflow:"hidden", flexShrink:0, background: color.surfaceRaised, borderRadius: 6 }}>
                {a.coverTrack && <AlbumArt track={a.coverTrack} size={48} borderRadius={6}/>}
              </div>
              <div style={{ minWidth:0, fontSize:17, fontWeight:600, fontFamily: fontDisplay }}>{a.title}</div>
            </button>
          ))}
        </div>
      )}
      {query.length>1&&!results.length&&!(entityHits?.artists?.length || entityHits?.albums?.length)&&(
        <div style={{ textAlign:"center", padding:"56px 0" }}>
          <div style={{ color: color.ink, fontSize:17, fontWeight:600, fontFamily: fontDisplay }}>No results</div>
        </div>
      )}
      {visibleResults.map(t=>(
        <TrackRow key={t.id} track={t} onPlay={()=>onPlay(t)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx}/>
      ))}
      {!showAllResults && results.length > RESULT_CAP && (
        <button type="button" onClick={() => setShowAllResults(true)}
          style={{ ...BTN_SECONDARY, marginTop: 12, fontSize: 14, padding: "11px 16px" }}>
          Show all {results.length}
        </button>
      )}
      {!query && (
        <GenreSceneBrowse
          tracks={tracks}
          onPlayPool={(t, pool) => onPlay(t, pool)}
          onListenIntent={onListenIntent}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          TrackRow={TrackRow}
          onLike={onLike}
          playlistCtx={playlistCtx}
        />
      )}
      </div>
    </div>
  );
}

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
function FavoritesScreen({
  tracks, onPlay, onLike, currentTrack, isPlaying, playlistCtx,
  userPlaylists = [], onCreatePlaylist, onDeletePlaylist, onRenamePlaylist = null,
  onPlayTrack, onSharePlaylist = null, onOpenMix = null,
  communityMix = null,
  openRequestId = null, onConsumeOpenRequest = null,
  onCustomMix = null,
}) {
  const { menu, close } = useTrackMenu();
  const activeId = currentTrack?.id;
  const saved = savedTracks(tracks, 80);
  const [libTab, setLibTab] = useState("playlists"); // playlists | liked
  const [libQuery, setLibQuery] = useState("");
  const [plSort, setPlSort] = useState("recent"); // recent | name | size
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [openPlaylistId, setOpenPlaylistId] = useState(null);
  const [showAddCuts, setShowAddCuts] = useState(false);
  const [addQuery, setAddQuery] = useState("");

  // Deep-open request (e.g. desktop sidebar stack click)
  useEffect(() => {
    if (!openRequestId) return;
    setLibTab("playlists");
    setOpenPlaylistId(openRequestId);
    onConsumeOpenRequest?.();
  }, [openRequestId, onConsumeOpenRequest]);

  // Reset the add-cuts picker when leaving a stack
  useEffect(() => {
    setShowAddCuts(false);
    setAddQuery("");
  }, [openPlaylistId]);

  const playTrackFn = onPlayTrack || ((t, pool) => onPlay(t));

  function handleCreate() {
    if (!newName.trim() || !onCreatePlaylist) return;
    const created = onCreatePlaylist(newName.trim());
    setNewName("");
    setShowNewInput(false);
    if (created?.id) setOpenPlaylistId(created.id);
  }

  const q = libQuery.trim().toLowerCase();
  const filteredPlaylists = useMemo(() => {
    const base = q
      ? userPlaylists.filter((p) => String(p.name || "").toLowerCase().includes(q))
      : [...userPlaylists];
    if (plSort === "name") {
      return base.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    }
    if (plSort === "size") {
      return base.sort((a, b) => (b.trackIds?.length || 0) - (a.trackIds?.length || 0));
    }
    // recent — keep creation-ish order (ids embed timestamps as pl_*)
    return base.sort((a, b) => String(b.id || "").localeCompare(String(a.id || "")));
  }, [userPlaylists, q, plSort]);
  const filteredSaved = q
    ? saved.filter((t) =>
        String(t.title || "").toLowerCase().includes(q)
        || String(t.artist || "").toLowerCase().includes(q))
    : saved;

  const openPlaylist = openPlaylistId
    ? userPlaylists.find((p) => p.id === openPlaylistId)
    : null;
  const openPlaylistTracks = openPlaylist
    ? (openPlaylist.trackIds || []).map((id) => tracks.find((t) => t.id === id)).filter(Boolean)
    : [];

  if (openPlaylist) {
    const community = isCommunityPlaylist(openPlaylist);
    const inStack = new Set(openPlaylist.trackIds || []);
    const addQ = addQuery.trim().toLowerCase();
    const addCandidates = showAddCuts
      ? tracks
          .filter((t) => !inStack.has(t.id) && (t.duration || 0) <= 900)
          .filter((t) => !addQ
            || String(t.title || "").toLowerCase().includes(addQ)
            || String(t.artist || "").toLowerCase().includes(addQ))
          .slice(0, 20)
      : [];
    return (
      <div style={{ padding: "24px 16px 36px" }}>
        <button type="button" onClick={() => setOpenPlaylistId(null)} style={{
          background: "none", border: "none", color: color.body, fontSize: 17, cursor: "pointer", fontWeight: 500, marginBottom: 16,
        }}>‹ Library</button>

        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 8,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 28, fontWeight: 700, color: color.ink, fontFamily: fontDisplay,
              letterSpacing: -0.8, lineHeight: 1.1,
            }}>
              {openPlaylist.name}
            </div>
            <div style={{ fontSize: 14, color: color.muted, marginTop: 8 }}>
              {community && openPlaylist.curatorName
                ? `Curated by ${openPlaylist.curatorName} · ${openPlaylistTracks.length} song${openPlaylistTracks.length === 1 ? "" : "s"}`
                : `${openPlaylistTracks.length} song${openPlaylistTracks.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>

        {/* Best single upgrade: play the whole set without hunting a track */}
        <div style={{ display: "flex", gap: 10, margin: "18px 0 20px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            disabled={openPlaylistTracks.length === 0}
            onClick={() => {
              if (!openPlaylistTracks[0]) return;
              playTrackFn(openPlaylistTracks[0], openPlaylistTracks);
            }}
            aria-label={`Play ${openPlaylist.name}`}
            style={{
              ...BTN_PRIMARY,
              width: "auto",
              minWidth: 132,
              borderRadius: radius.md,
              padding: "12px 20px",
              fontSize: 15,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: openPlaylistTracks.length === 0 ? 0.45 : 1,
              cursor: openPlaylistTracks.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <Icon name="play" size={14} />
            Play
          </button>
          {openPlaylistTracks.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const shuffled = [...openPlaylistTracks];
                for (let i = shuffled.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                playTrackFn(shuffled[0], shuffled);
              }}
              aria-label={`Shuffle ${openPlaylist.name}`}
              style={{
                ...BTN_SECONDARY,
                width: "auto",
                borderRadius: radius.md,
                padding: "12px 16px",
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="shuffle" size={14} />
              Shuffle
            </button>
          )}
          {!community && playlistCtx?.onAdd && (
            <button
              type="button"
              onClick={() => setShowAddCuts((s) => !s)}
              aria-expanded={showAddCuts}
              style={{
                ...BTN_SECONDARY, width: "auto", borderRadius: radius.md, padding: "12px 16px", fontSize: 14,
                ...(showAddCuts ? { background: color.accentSoft, color: color.accent, borderColor: color.accentSoft } : {}),
              }}
            >
              {showAddCuts ? "Done" : "Add songs"}
            </button>
          )}
          {onSharePlaylist && (
            <button
              type="button"
              onClick={() => onSharePlaylist(openPlaylist)}
              style={{ ...BTN_SECONDARY, width: "auto", borderRadius: radius.md, padding: "12px 16px", fontSize: 14 }}
            >
              Share
            </button>
          )}
        </div>
        {!community && (onRenamePlaylist || onDeletePlaylist) && (
          <div style={{ display: "flex", gap: 8, margin: "-8px 0 18px", flexWrap: "wrap" }}>
            {onRenamePlaylist && (
              <button
                type="button"
                onClick={() => {
                  const next = window.prompt("Rename this playlist", openPlaylist.name || "");
                  if (next != null && next.trim() && next.trim() !== openPlaylist.name) {
                    onRenamePlaylist(openPlaylist.id, next.trim());
                  }
                }}
                style={{
                  background: "none", border: "none", padding: "4px 2px",
                  fontSize: 12.5, fontWeight: 600, color: color.muted, cursor: "pointer",
                }}
              >
                Rename
              </button>
            )}
            {onDeletePlaylist && (
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm(`Delete “${openPlaylist.name}”? This can’t be undone.`)) return;
                  onDeletePlaylist(openPlaylist.id);
                  setOpenPlaylistId(null);
                }}
                style={{
                  background: "none", border: "none", padding: "4px 2px",
                  fontSize: 12.5, fontWeight: 600, color: color.alert, cursor: "pointer",
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
        {showAddCuts && (
          <div style={{ marginBottom: 20, padding: 14, borderRadius: radius.lg, background: color.surfaceRaised, border: `1px solid ${glass.borderSoft}` }}>
            <input
              autoFocus
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Search songs to add…"
              aria-label="Search songs to add"
              style={{ ...INPUT_ST, padding: "10px 12px", fontSize: 15, marginBottom: 8 }}
            />
            {addCandidates.length === 0 ? (
              <div style={{ fontSize: 13, color: color.faint, padding: "14px 4px", textAlign: "center" }}>
                {addQ ? "No matches" : "All songs are already in this playlist"}
              </div>
            ) : addCandidates.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 2px", borderBottom: `1px solid ${color.line}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 5, overflow: "hidden", flexShrink: 0 }}>
                  <AlbumArt track={t} size={36} borderRadius={0}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 550, color: color.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  <div style={{ fontSize: 11.5, color: color.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.artist}</div>
                </div>
                <button
                  type="button"
                  onClick={() => playlistCtx.onAdd(t.id, openPlaylist.id)}
                  aria-label={`Add ${t.title} to ${openPlaylist.name}`}
                  style={{
                    background: color.accentSoft, border: "none", borderRadius: 980,
                    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    color: color.accent, cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <Icon name="plus" size={16}/>
                </button>
              </div>
            ))}
          </div>
        )}
        {openPlaylistTracks.length === 0 ? (
          <div style={{ fontSize: 15, color: color.faint, paddingTop: 32, textAlign: "center" }}>
            {community ? "This playlist is empty" : "This playlist is empty"}
          </div>
        ) : openPlaylistTracks.map((t) => (
          <TrackRow
            key={t.id}
            track={t}
            onPlay={() => playTrackFn(t, openPlaylistTracks)}
            active={activeId === t.id}
            isPlaying={isPlaying}
            onLike={onLike}
            playlistCtx={playlistCtx}
            activePlaylistId={openPlaylist.id}
          />
        ))}
        {menu && (
          <TrackActionsMenu track={menu.track} playlistCtx={playlistCtx} activePlaylistId={menu.activePlaylistId} x={menu.x} y={menu.y} onClose={close}/>
        )}
      </div>
    );
  }

  const segmentBtn = (id, label, count) => {
    const active = libTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => { setLibTab(id); setLibQuery(""); }}
        aria-pressed={active}
        style={{
          flex: 1,
          minHeight: 40,
          border: "none",
          borderRadius: radius.sm,
          cursor: "pointer",
          background: active ? color.surfaceSolid : "transparent",
          color: active ? color.ink : color.muted,
          boxShadow: active ? `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}` : "none",
          fontSize: 14,
          fontWeight: active ? 650 : 550,
          fontFamily: fontDisplay,
          letterSpacing: -0.2,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: `background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease}`,
        }}
      >
        {label}
        {count != null && (
          <span style={{
            fontSize: 11,
            fontWeight: 650,
            fontFamily: fontMono,
            color: active ? color.accent : color.faint,
            fontVariantNumeric: "tabular-nums",
          }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  const renderPlaylistTile = (pl, { create = false } = {}) => {
    if (create) {
      return (
        <button
          key="__new"
          type="button"
          onClick={() => { setLibTab("playlists"); setShowNewInput(true); }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            color: color.ink,
            minWidth: 0,
          }}
        >
          <div style={{
            aspectRatio: "1 / 1",
            width: "100%",
            borderRadius: radius.md,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color.muted,
            fontSize: 32,
            fontWeight: 200,
            border: `1px solid ${glass.border}`,
            background: `linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(242,244,247,0.72) 100%)`,
            boxShadow: `inset 0 1px 0 ${glass.highlight}`,
          }}>
            +
          </div>
          <div style={{
            fontSize: 15,
            fontWeight: 650,
            letterSpacing: -0.25,
            fontFamily: fontDisplay,
            color: color.body,
          }}>
            New playlist
          </div>
          <div style={{
            fontSize: 12,
            color: color.faint,
            marginTop: 4,
            lineHeight: 1.3,
          }}>
            Build a set
          </div>
        </button>
      );
    }

    const plTracks = (pl.trackIds || []).map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
    const covers = plTracks.filter((t) => t.albumCover).slice(0, 4);
    const community = isCommunityPlaylist(pl);
    return (
      <div
        key={pl.id}
        role="button"
        tabIndex={0}
        onClick={() => setOpenPlaylistId(pl.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpenPlaylistId(pl.id);
          }
        }}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          color: color.ink,
          minWidth: 0,
        }}
      >
        <div style={{
          aspectRatio: "1 / 1",
          width: "100%",
          borderRadius: radius.md,
          overflow: "hidden",
          marginBottom: 12,
          position: "relative",
          display: "grid",
          gridTemplateColumns: covers.length <= 1 ? "1fr" : "1fr 1fr",
          gridTemplateRows: covers.length <= 1 ? "1fr" : "1fr 1fr",
          background: color.surfaceRaised,
          border: `1px solid ${glass.borderSoft}`,
          boxShadow: artShadow.quiet,
        }}>
          {covers.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1", gridRow: "1 / -1",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: color.faint, fontFamily: fontDisplay, fontSize: 28, fontWeight: 700,
            }}>
              {(pl.name || "P")[0]}
            </div>
          ) : covers.length === 1 ? (
            <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
              <img
                src={covers[0].albumCover}
                alt=""
                draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ) : (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ overflow: "hidden", background: color.surfaceSolid, minHeight: 0 }}>
                  {covers[i]?.albumCover ? (
                    <img
                      src={covers[i].albumCover}
                      alt=""
                      draggable={false}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : null}
                </div>
              ))}
            </>
          )}
          {plTracks.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playTrackFn(plTracks[0], plTracks);
              }}
              aria-label={`Play ${pl.name}`}
              style={{
                position: "absolute",
                right: 8,
                bottom: 8,
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "none",
                background: color.ink,
                color: color.onDark,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: glass.shadowSoft,
                cursor: "pointer",
                padding: 0,
              }}
            >
              <Icon name="play" size={12} />
            </button>
          )}
        </div>
        <div style={{
          fontSize: 15,
          fontWeight: 650,
          letterSpacing: -0.3,
          fontFamily: fontDisplay,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {pl.name}
        </div>
        <div style={{
          fontSize: 12,
          color: color.faint,
          marginTop: 4,
          fontFamily: fontMono,
          letterSpacing: 0.2,
          fontVariantNumeric: "tabular-nums",
        }}>
          {community && pl.curatorName
            ? `Community · ${pl.curatorName}`
            : plTracks.length === 0
              ? "Empty — add songs"
              : `${plTracks.length} song${plTracks.length === 1 ? "" : "s"}`}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "relative", paddingBottom: 56 }}>
      <div style={{
        position: "relative",
        background: color.canvas,
        padding: `16px 0 8px`,
      }}>
        {/* Library header — art leads; create actions stay compact */}
        <div style={{ padding: `0 ${homeSpace.gutter}px 12px` }}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.9,
                fontFamily: fontDisplay,
                color: color.ink,
                lineHeight: 1.05,
              }}>
                Library
              </h1>
              <div style={{
                marginTop: 5,
                fontSize: 12,
                color: color.faint,
                fontFamily: fontMono,
                letterSpacing: 0.2,
                fontVariantNumeric: "tabular-nums",
              }}>
                {userPlaylists.length} playlist{userPlaylists.length === 1 ? "" : "s"}
                {" · "}
                {saved.length} liked
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {onCustomMix && (
                <button
                  type="button"
                  onClick={onCustomMix}
                  aria-label="Build a custom mix"
                  style={{
                    ...BTN_SECONDARY,
                    width: "auto",
                    borderRadius: radius.md,
                    padding: "9px 12px",
                    fontSize: 12.5,
                    fontWeight: 650,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Icon name="timedmix" size={14} />
                  Custom Mix
                </button>
              )}
              <button
                type="button"
                onClick={() => { setLibTab("playlists"); setShowNewInput(true); }}
                style={{
                  ...BTN_PRIMARY,
                  width: "auto",
                  borderRadius: radius.md,
                  padding: "9px 12px",
                  fontSize: 12.5,
                  fontWeight: 650,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="plus" size={13} />
                New
              </button>
            </div>
          </div>

          {/* Glass control plate — segments + search */}
          <div style={{
            borderRadius: radius.lg,
            border: `1px solid ${glass.border}`,
            background: `
              linear-gradient(160deg, rgba(255,255,255,0.82) 0%, rgba(246,248,252,0.55) 100%)
            `,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
            backdropFilter: glass.blurSoft,
            WebkitBackdropFilter: glass.blurSoft,
            padding: 8,
            marginBottom: 10,
          }}>
            <div
              role="tablist"
              aria-label="Library sections"
              style={{
                display: "flex",
                gap: 4,
                padding: 2,
                borderRadius: radius.md,
                background: "rgba(22,24,30,0.06)",
                marginBottom: 8,
              }}
            >
              {segmentBtn("playlists", "Playlists", userPlaylists.length)}
              {segmentBtn("liked", "Liked", saved.length)}
            </div>
            <div style={{ position: "relative" }}>
              <span aria-hidden="true" style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: color.faint,
                display: "flex",
                pointerEvents: "none",
              }}>
                <Icon name="search" size={15} />
              </span>
              <input
                value={libQuery}
                onChange={(e) => setLibQuery(e.target.value)}
                placeholder={libTab === "playlists" ? "Search playlists…" : "Search liked songs…"}
                aria-label={libTab === "playlists" ? "Search playlists" : "Search liked songs"}
                style={{
                  ...INPUT_ST,
                  padding: "10px 14px 10px 36px",
                  fontSize: 15,
                  borderRadius: radius.md,
                  background: "rgba(255,255,255,0.72)",
                  border: `1px solid ${glass.borderSoft}`,
                }}
              />
            </div>
          </div>

          {showNewInput && (
            <div style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 4,
              animation: `rise 0.35s ${motion.ease} both`,
            }}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setShowNewInput(false); setNewName(""); }
                }}
                placeholder="Playlist name…"
                aria-label="Playlist name"
                style={{ flex: 1, ...INPUT_ST, padding: "10px 12px", fontSize: 16 }}
              />
              <button
                type="button"
                onClick={handleCreate}
                style={{
                  ...BTN_PRIMARY,
                  width: "auto",
                  borderRadius: radius.md,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "10px 16px",
                }}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => { setShowNewInput(false); setNewName(""); }}
                aria-label="Cancel"
                style={{
                  ...BTN_SECONDARY,
                  width: "auto",
                  borderRadius: radius.md,
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {libTab === "playlists" ? (
          <div style={{
            padding: `4px ${homeSpace.gutter}px 24px`,
            animation: `rise 0.4s ${motion.ease} both`,
          }}>
            {filteredPlaylists.length > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 14,
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: color.faint,
                  fontFamily: fontMono,
                }}>
                  Your playlists
                </div>
                <div
                  role="group"
                  aria-label="Sort playlists"
                  style={{
                    display: "inline-flex",
                    gap: 2,
                    padding: 3,
                    borderRadius: radius.sm,
                    background: "rgba(22,24,30,0.06)",
                    border: `1px solid ${glass.borderSoft}`,
                  }}
                >
                  {[
                    { id: "recent", label: "Recent" },
                    { id: "name", label: "A–Z" },
                    { id: "size", label: "Size" },
                  ].map((opt) => {
                    const on = plSort === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPlSort(opt.id)}
                        aria-pressed={on}
                        style={{
                          border: "none",
                          borderRadius: 6,
                          padding: "5px 9px",
                          fontSize: 11,
                          fontWeight: on ? 700 : 550,
                          cursor: "pointer",
                          background: on ? color.surfaceSolid : "transparent",
                          color: on ? color.ink : color.muted,
                          boxShadow: on ? `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}` : "none",
                          fontFamily: fontMono,
                          letterSpacing: 0.2,
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredPlaylists.length === 0 && !q ? (
              <div style={{
                padding: "36px 18px",
                textAlign: "center",
                borderRadius: radius.lg,
                border: `1px solid ${glass.borderSoft}`,
                background: `
                  linear-gradient(165deg, rgba(255,255,255,0.78) 0%, rgba(238,241,245,0.5) 100%)
                `,
                boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                backdropFilter: glass.blurSoft,
                WebkitBackdropFilter: glass.blurSoft,
              }}>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: fontDisplay,
                  color: color.ink,
                  letterSpacing: -0.4,
                  marginBottom: 8,
                }}>
                  Start your first playlist
                </div>
                <div style={{
                  fontSize: 14,
                  color: color.muted,
                  lineHeight: 1.45,
                  marginBottom: 18,
                  maxWidth: 280,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}>
                  Group tracks into a set — then share it with Planet Club when it’s ready.
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewInput(true)}
                  style={{
                    ...BTN_PRIMARY,
                    width: "auto",
                    minWidth: 160,
                    borderRadius: radius.md,
                    padding: "12px 22px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Icon name="plus" size={14} />
                  New playlist
                </button>
              </div>
            ) : filteredPlaylists.length === 0 && q ? (
              <div style={{
                padding: "28px 8px",
                textAlign: "center",
                fontSize: 14,
                color: color.muted,
              }}>
                No playlists match “{libQuery.trim()}”
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "22px 16px",
              }}>
                {filteredPlaylists.map((pl) => renderPlaylistTile(pl))}
                {!q && renderPlaylistTile(null, { create: true })}
              </div>
            )}

          </div>
        ) : (
          <div style={{ animation: `rise 0.4s ${motion.ease} both` }}>
            {filteredSaved.length > 0 ? (
              <>
                <div style={{
                  padding: `0 ${homeSpace.gutter}px 12px`,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}>
                  <button
                    type="button"
                    onClick={() => playTrackFn(filteredSaved[0], filteredSaved)}
                    aria-label="Play liked songs"
                    style={{
                      ...BTN_PRIMARY,
                      width: "auto",
                      minWidth: 120,
                      borderRadius: radius.md,
                      padding: "11px 18px",
                      fontSize: 14,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Icon name="play" size={13} />
                    Play all
                  </button>
                  {filteredSaved.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const shuffled = [...filteredSaved];
                        for (let i = shuffled.length - 1; i > 0; i--) {
                          const j = Math.floor(Math.random() * (i + 1));
                          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                        }
                        playTrackFn(shuffled[0], shuffled);
                      }}
                      aria-label="Shuffle liked songs"
                      style={{
                        ...BTN_SECONDARY,
                        width: "auto",
                        borderRadius: radius.md,
                        padding: "11px 16px",
                        fontSize: 14,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Icon name="shuffle" size={13} />
                      Shuffle
                    </button>
                  )}
                  <span style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    color: color.faint,
                    fontFamily: fontMono,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {filteredSaved.length} song{filteredSaved.length === 1 ? "" : "s"}
                  </span>
                </div>

                {!q && (
                  <CoverFlow
                    tracks={filteredSaved}
                    onPlayTrack={(t) => playTrackFn(t, filteredSaved)}
                    activeId={activeId}
                    isPlaying={isPlaying}
                    size={188}
                    limit={40}
                  />
                )}
                <div style={{ padding: `8px ${Math.max(0, homeSpace.gutter - 8)}px 24px` }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: color.faint,
                    fontFamily: fontMono,
                    margin: q ? "0 8px 10px" : "10px 8px 10px",
                  }}>
                    {q ? "Matches" : "All liked"}
                  </div>
                  {filteredSaved.map((t) => (
                    <TrackRow
                      key={t.id}
                      track={t}
                      onPlay={() => playTrackFn(t, filteredSaved)}
                      active={activeId === t.id}
                      isPlaying={isPlaying}
                      onLike={onLike}
                      playlistCtx={playlistCtx}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                padding: `28px ${homeSpace.gutter}px 40px`,
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 650,
                  fontFamily: fontDisplay,
                  color: color.ink,
                  marginBottom: 8,
                }}>
                  {q ? `No liked songs match “${libQuery.trim()}”` : "Nothing liked yet"}
                </div>
                <div style={{
                  fontSize: 14,
                  color: color.muted,
                  lineHeight: 1.45,
                }}>
                  {q ? "Try a different search." : "Heart a track anywhere and it lands here."}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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


// ProfileScreen → components/club/ClubScreen.jsx

// ─── ANALYTICS ROW ───────────────────────────────────────────────────────────
function AnalyticsRow({ rank, track, value, label, max, color: trackColor, accent }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background: color.surfaceSolid, borderRadius:12, marginBottom:4, border:`1px solid ${color.line}` }}>
      <div style={{ width:22, textAlign:"right", fontSize:14, fontWeight:700, color: color.faint, flexShrink:0 }}>{rank}</div>
      <div style={{ width:36, height:36, borderRadius:7, overflow:"hidden", flexShrink:0 }}>
        <AlbumArt track={track} size={36} borderRadius={0}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.title}</div>
        <div style={{ marginTop:5, background: "rgba(232,236,240,0.08)", borderRadius:2, height:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, background: accent || trackColor || color.accent, transition:"width 0.4s ease" }}/>
        </div>
      </div>
      <div style={{ flexShrink:0, textAlign:"right" }}>
        <div style={{ fontSize:18, fontWeight:700, color:accent, letterSpacing:-0.3 }}>{value}</div>
        <div style={{ fontSize:10, color: color.faint, fontWeight:600 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminScreen({
  tracks, setTracks, tab, setTab, editTrack, setEditTrack, showToast,
  userPlaylists = [], communityMix = null, onPublishCommunityMix = null,
}) {
  const EMPTY = { title:"",artist:"",album:"",genre:"",energy:"",camelot:"",bpm:"",albumCover:"",videoUrl:"" };
  const [nt, setNt] = useState(EMPTY);
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [deletingUnknown, setDeletingUnknown] = useState(false);
  const fileInputRef = useRef(null);
  const [clubCurator, setClubCurator] = useState("");
  const publishable = (userPlaylists || []).filter((p) => !isCommunityPlaylist(p) && (p.trackIds || []).length > 0);

  function isUnknownArtist(artist) {
    const a = String(artist ?? "").trim().toLowerCase();
    return !a || a === "unknown" || a === "unknown artist" || a === "n/a" || a === "na" || a === "-" || a === "none";
  }

  const unknownArtistTracks = useMemo(
    () => tracks.filter((t) => isUnknownArtist(t.artist)),
    [tracks]
  );

  async function deleteTrackDoc(trackId) {
    await deleteDoc(doc(db, "tracks", trackId));
    setTracks((ts) => ts.filter((tr) => tr.id !== trackId));
  }

  async function handleDeleteTrack(t) {
    if (!t?.id) return;
    if (!window.confirm(`Delete “${t.title || t.id}” permanently?`)) return;
    try {
      await deleteTrackDoc(t.id);
      showToast("Deleted");
    } catch (e) {
      console.error("Delete failed", e);
      showToast("Delete failed: " + (e.code || e.message || "unknown error"));
    }
  }

  async function handleDeleteUnknownArtists() {
    if (!unknownArtistTracks.length || deletingUnknown) return;
    if (!window.confirm(`Permanently delete ${unknownArtistTracks.length} track${unknownArtistTracks.length === 1 ? "" : "s"} with Unknown artist?`)) return;
    setDeletingUnknown(true);
    let deleted = 0;
    let errors = 0;
    for (const t of unknownArtistTracks) {
      try {
        await deleteTrackDoc(t.id);
        deleted += 1;
      } catch (e) {
        console.error("Delete unknown failed", t.id, e);
        errors += 1;
      }
    }
    setDeletingUnknown(false);
    showToast(errors
      ? `Deleted ${deleted}, ${errors} failed`
      : `Deleted ${deleted} unknown-artist track${deleted === 1 ? "" : "s"}`);
  }

  // ── CSV EXPORT ──
  function exportCSV() {
    const fields = ["id","title","artist","album","genre","energy","camelot","bpm","audioUrl","albumCover","videoUrl","color","duration"];
    const escape = v => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const rows = [fields.join(",")];
    tracks.forEach(t => {
      rows.push(fields.map(f => escape(t[f])).join(","));
    });
    const blob = new Blob([rows.join("\n")], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `4am-tracks-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${tracks.length} tracks`);
  }

  // ── CSV IMPORT ──
  // Prefer match by `id` so title/artist renames stick. Fall back to title+artist.
  async function importCSV(file) {
    setImporting(true); setImportProgress("Reading file...");
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) { showToast("CSV appears empty"); setImporting(false); return; }

    const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const titleIdx = header.indexOf("title");
    const artistIdx = header.indexOf("artist");
    if (titleIdx === -1 || artistIdx === -1) {
      showToast("CSV must have 'title' and 'artist' columns");
      setImporting(false); return;
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      if (!vals[titleIdx]?.trim()) continue;
      const row = {};
      header.forEach((h, idx) => { row[h] = (vals[idx] || "").trim(); });
      rows.push(row);
    }

    setImportProgress(`Parsed ${rows.length} rows. Writing to Firestore...`);

    const byId = {};
    const byName = {};
    tracks.forEach(t => {
      byId[t.id] = t;
      byName[`${(t.title||"").toLowerCase()}|||${(t.artist||"").toLowerCase()}`] = t;
    });

    let updated = 0, created = 0, errors = 0, skipped = 0;
    const cols = ["#EAE7DC","#C4BFB0","#B8B4A8","#8E8A80","#D8D4C8","#A8A498","#6E6A60"];

    function fieldUpdates(r) {
      const updates = {};
      if (r.title != null && String(r.title).trim() !== "") updates.title = String(r.title).trim();
      if (r.artist != null && String(r.artist).trim() !== "") updates.artist = String(r.artist).trim();
      if (r.album != null && String(r.album).trim() !== "") updates.album = String(r.album).trim();
      if (r.genre != null && String(r.genre).trim() !== "") updates.genre = normalizeGenre(r.genre) || String(r.genre).trim();
      if (r.camelot != null && String(r.camelot).trim() !== "") updates.camelot = String(r.camelot).trim();
      if (r.bpm && !isNaN(parseInt(r.bpm, 10))) updates.bpm = parseInt(r.bpm, 10);
      if (r.energy && !isNaN(parseInt(r.energy, 10))) updates.energy = parseInt(r.energy, 10);
      const audioUrl = r.audiourl || r.audioUrl;
      if (audioUrl && String(audioUrl).trim()) updates.audioUrl = String(audioUrl).trim();
      const albumCover = r.albumcover || r.albumCover;
      if (albumCover && String(albumCover).trim()) updates.albumCover = String(albumCover).trim();
      if (r.color && String(r.color).trim()) updates.color = String(r.color).trim();
      if (r.duration && !isNaN(parseFloat(r.duration))) updates.duration = parseFloat(r.duration);
      return updates;
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const id = (r.id || "").trim();
      const matchById = id ? byId[id] : null;
      const matchByName = byName[`${(r.title||"").toLowerCase()}|||${(r.artist||"").toLowerCase()}`];
      const match = matchById || (!id ? matchByName : null);

      try {
        if (match) {
          const updates = fieldUpdates(r);
          if (Object.keys(updates).length === 0) { skipped++; continue; }
          await updateDoc(doc(db, "tracks", match.id), updates);
          setTracks(prev => prev.map(t => t.id === match.id ? { ...t, ...updates } : t));
          // Keep lookups fresh for later rows
          byId[match.id] = { ...match, ...updates };
          updated++;
        } else if (id) {
          const trackData = {
            title: r.title || "", artist: r.artist || "", album: r.album || "",
            genre: normalizeGenre(r.genre) || "", camelot: r.camelot || "",
            energy: parseInt(r.energy, 10) || 5, bpm: parseInt(r.bpm, 10) || null,
            audioUrl: r.audiourl || r.audioUrl || "", albumCover: r.albumcover || r.albumCover || "",
            color: r.color || cols[Math.floor(Math.random() * cols.length)],
            duration: parseFloat(r.duration) || 0,
            likeCount: 0, playCount: 0, skipCount: 0,
          };
          await setDoc(doc(db, "tracks", id), trackData, { merge: true });
          byId[id] = { ...trackData, id };
          created++;
        } else {
          const trackData = {
            title: r.title || "", artist: r.artist || "", album: r.album || "",
            genre: normalizeGenre(r.genre) || "", camelot: r.camelot || "",
            energy: parseInt(r.energy, 10) || 5, bpm: parseInt(r.bpm, 10) || null,
            audioUrl: r.audiourl || r.audioUrl || "", albumCover: r.albumcover || r.albumCover || "",
            color: r.color || cols[Math.floor(Math.random() * cols.length)],
            duration: parseFloat(r.duration) || 0,
            createdAt: new Date(), likeCount: 0, playCount: 0, skipCount: 0,
          };
          const newId = `import_${Date.now()}_${i}`;
          await setDoc(doc(db, "tracks", newId), trackData);
          created++;
        }
      } catch(e) {
        console.error("Import error row", i, e);
        errors++;
      }

      if (i % 10 === 0) setImportProgress(`Processing ${i+1}/${rows.length}... (${updated} updated, ${created} created)`);
    }

    setImportProgress("Reloading library...");
    try {
      const q2 = query(collection(db, "tracks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q2);
      const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id, liked: false }));
      setTracks(computeSignalTraits(loaded));
    } catch(e) {}

    setImporting(false);
    setImportProgress("");
    showToast(`Import done: ${updated} updated, ${created} created${skipped ? `, ${skipped} unchanged` : ""}${errors ? `, ${errors} errors` : ""}`);
  }

  // Simple CSV line parser that handles quoted fields
  function parseCSVLine(line) {
    const result = []; let current = ""; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i+1] === '"') { current += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { current += c; }
      } else {
        if (c === '"') { inQuotes = true; }
        else if (c === ',') { result.push(current); current = ""; }
        else { current += c; }
      }
    }
    result.push(current);
    return result;
  }
  const addTrack = () => {
    if (!nt.title||!nt.artist) { showToast("Title and artist required"); return; }
    const cols = ["#EAE7DC","#C4BFB0","#B8B4A8","#8E8A80","#D8D4C8","#A8A498","#6E6A60"];
    setTracks(ts=>[...ts,{ id:Date.now(),...nt,energy:parseInt(nt.energy)||5,bpm:parseInt(nt.bpm)||null,liked:false,color:cols[Math.floor(Math.random()*cols.length)] }]);
    setNt(EMPTY); showToast("Track added");
  };
  return (
    <div style={{ padding:"24px 16px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <DoorGlyph size={28} title="" />
        <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color: color.ink, fontFamily: fontDisplay }}>Admin</div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:20, background: color.surfaceSolid, borderRadius:12, padding:3, border:`1px solid ${color.line}` }}>
        {["tracks","analytics","audit","club"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, textTransform:"capitalize", background:tab===t? color.accent:"transparent", color:tab===t? color.onAccent: color.muted, boxShadow:"none" }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>
      {tab==="tracks"&&(
        <div>
          {editTrack&&(
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
              <div style={{ background: color.surfaceSolid, borderRadius:20, padding:24, width:"100%", maxWidth:380, boxShadow:"0 16px 64px rgba(0,0,0,0.45)", border:`1px solid ${color.line}` }}>
                <div style={{ fontSize:18, fontWeight:600, color: color.ink, marginBottom:16 }}>Edit Track</div>
                {[["title","Title"],["artist","Artist"],["album","Album"],["genre","Genre"],["energy","Energy (1–10)"],["camelot","Camelot Key"],["bpm","BPM"],["albumCover","Cover URL"],["videoUrl","Video URL (MP4/WebM)"]].map(([k,p])=>(
                  <input key={k} placeholder={p} value={editTrack[k]||""} onChange={e=>setEditTrack(t=>({...t,[k]:e.target.value}))} style={{...INPUT_ST,marginBottom:8}}/>
                ))}
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <button onClick={async()=>{
                    const updated = {...editTrack, energy:parseInt(editTrack.energy)||5, bpm:parseInt(editTrack.bpm)||null};
                    try {
                      await updateDoc(doc(db,"tracks",editTrack.id), {
                        title:updated.title, artist:updated.artist, album:updated.album,
                        genre:updated.genre, energy:updated.energy, camelot:updated.camelot,
                        bpm:updated.bpm, albumCover:updated.albumCover,
                        videoUrl: updated.videoUrl || "",
                      });
                      setTracks(ts=>ts.map(tr=>tr.id===editTrack.id?updated:tr));
                      setEditTrack(null); showToast("Saved ✓");
                    } catch(e) {
                      console.error("Admin save error:", e);
                      showToast("Save failed: " + (e.code || e.message || "unknown error"));
                    }
                  }} style={{...BTN_PRIMARY,flex:1}}>Save</button>
                  <button onClick={()=>setEditTrack(null)} style={{...BTN_SECONDARY,flex:1}}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <SectionLabel>Add Track</SectionLabel>
          {[["title","Title *"],["artist","Artist *"],["album","Album"],["genre","Genre"],["energy","Energy (1–10)"],["camelot","Camelot Key (e.g. 8A)"],["bpm","BPM"],["albumCover","Cover URL"]].map(([k,p])=>(
            <input key={k} placeholder={p} value={nt[k]||""} onChange={e=>setNt(n=>({...n,[k]:e.target.value}))} style={{...INPUT_ST,marginBottom:8}}/>
          ))}
          <button onClick={addTrack} style={{...BTN_PRIMARY,width:"100%",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icon name="plus" size={16}/> Add Track</button>
          {unknownArtistTracks.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteUnknownArtists}
              disabled={deletingUnknown}
              style={{
                ...BTN_SECONDARY,
                width: "100%",
                marginBottom: 20,
                borderColor: "rgba(224,100,100,0.35)",
                color: "#E8A0A0",
                opacity: deletingUnknown ? 0.6 : 1,
              }}
            >
              {deletingUnknown
                ? "Deleting…"
                : `Delete ${unknownArtistTracks.length} Unknown artist track${unknownArtistTracks.length === 1 ? "" : "s"}`}
            </button>
          )}
          <SectionLabel>Library ({tracks.length})</SectionLabel>
          {tracks.map(t=>(
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(32px)", borderRadius:10, marginBottom:4, border:"1px solid rgba(255,255,255,0.16)" }}>
              <div style={{ width:36, height:36, borderRadius:7, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={36} borderRadius={0}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                <div style={{ fontSize:12, color: isUnknownArtist(t.artist) ? "#E8A0A0" : color.muted }}>{t.artist || "Unknown"}</div>
              </div>
              <div style={{ display:"flex", gap:4, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end", maxWidth:180 }}>
                {t.genre&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(26,29,38,0.06)", color: color.ink }}>{t.genre}</span>}
                {t.camelot&&<span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:6, background:"rgba(26,29,38,0.08)", color: color.ink }}>{t.camelot}</span>}
                {t.bpm&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(0,0,0,0.04)", color: color.muted }}>{t.bpm}bpm</span>}
                {t.energy&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(0,0,0,0.04)", color: color.muted }}>E{t.energy}</span>}
              </div>
              <button onClick={()=>setEditTrack(t)} style={{ background:"none",border:"none",cursor:"pointer",color: color.muted,padding:6 }}><Icon name="edit" size={14}/></button>
              <button onClick={()=>handleDeleteTrack(t)} style={{ background:"none",border:"none",cursor:"pointer",color: color.alert,padding:6 }}><Icon name="trash" size={14}/></button>
            </div>
          ))}
        </div>
      )}
      {tab==="analytics"&&(
        <div>
          {/* ── Summary stats row ── */}
          <SectionLabel>Overview</SectionLabel>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:24 }}>
            {[["Tracks",tracks.length],["Liked",tracks.filter(t=>t.liked).length],["Genres",[...new Set(tracks.map(t=>t.genre))].length],["BPMs",[...new Set(tracks.filter(t=>t.bpm).map(t=>t.bpm))].length]].map(([l,v])=>(
              <div key={l} style={{ padding:"14px 16px", background: color.surfaceSolid, borderRadius:14, border:"0.5px solid rgba(60,60,67,0.12)", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:0.5, color: color.faint, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color: color.ink }}>{v}</div>
              </div>
            ))}
          </div>

          {/* ── Most liked ── */}
          <SectionLabel>Most Liked</SectionLabel>
          {[...tracks]
            .filter(t => (t.likeCount||0) > 0 || t.liked)
            .sort((a,b) => (b.likeCount||0) - (a.likeCount||0))
            .slice(0,10)
            .map((t,i) => (
              <AnalyticsRow key={t.id} rank={i+1} track={t}
                value={t.likeCount||0} label="likes"
                max={Math.max(...tracks.map(x=>x.likeCount||0),1)}
                color={t.color} accent="rgba(224,100,100,0.7)"/>
            ))
          }
          {tracks.every(t=>!(t.likeCount||0)) && (
            <div style={{ textAlign:"center", color:"rgba(220,220,225,0.75)", padding:"24px 0", fontSize:13 }}>No like data yet — play some tracks!</div>
          )}

          {/* ── Most skipped ── */}
          <SectionLabel style={{ marginTop:24 }}>Most Skipped</SectionLabel>
          {[...tracks]
            .filter(t => (t.skipCount||0) > 0)
            .sort((a,b) => (b.skipCount||0) - (a.skipCount||0))
            .slice(0,10)
            .map((t,i) => (
              <AnalyticsRow key={t.id} rank={i+1} track={t}
                value={t.skipCount||0} label="skips"
                max={Math.max(...tracks.map(x=>x.skipCount||0),1)}
                color={t.color} accent="rgba(200,160,80,0.7)"/>
            ))
          }
          {tracks.every(t=>!(t.skipCount||0)) && (
            <div style={{ textAlign:"center", color:"rgba(220,220,225,0.75)", padding:"24px 0", fontSize:13 }}>No skip data yet — start listening!</div>
          )}

          {/* ── Most played ── */}
          <SectionLabel style={{ marginTop:24 }}>Most Played</SectionLabel>
          {[...tracks]
            .filter(t => (t.playCount||0) > 0)
            .sort((a,b) => (b.playCount||0) - (a.playCount||0))
            .slice(0,10)
            .map((t,i) => (
              <AnalyticsRow key={t.id} rank={i+1} track={t}
                value={t.playCount||0} label="plays"
                max={Math.max(...tracks.map(x=>x.playCount||0),1)}
                color={t.color} accent="rgba(100,180,140,0.7)"/>
            ))
          }
          {tracks.every(t=>!(t.playCount||0)) && (
            <div style={{ textAlign:"center", color:"rgba(220,220,225,0.75)", padding:"24px 0", fontSize:13 }}>No play data yet — start listening!</div>
          )}
        </div>
      )}
      {tab==="audit"&&(
        <div>
          {/* Export / Import */}
          <SectionLabel>Export & Import</SectionLabel>
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            <button onClick={exportCSV} style={{ flex:1, padding:"14px", borderRadius:14, background: color.accent, color: color.onAccent, border:"none", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              Export CSV ({tracks.length} tracks)
            </button>
            <button onClick={()=>fileInputRef.current?.click()} disabled={importing}
              style={{ flex:1, padding:"14px", borderRadius:14, background:"rgba(255,255,255,0.12)", backdropFilter:"blur(32px)", color: color.ink, border:"1px solid rgba(255,255,255,0.18)", fontSize:14, fontWeight:600, cursor:importing?"wait":"pointer" }}>
              {importing ? "Importing..." : "Import CSV"}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display:"none" }}
              onChange={e => { if(e.target.files[0]) importCSV(e.target.files[0]); e.target.value=""; }}/>
          </div>
          {importProgress && (
            <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", marginBottom:16, fontSize:12, color: color.muted }}>
              {importProgress}
            </div>
          )}
          <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", marginBottom:24, fontSize:11, color: color.muted, lineHeight:1.6 }}>
            <strong style={{ color: color.muted }}>How it works:</strong> Export downloads all tracks as CSV (keep the <code>id</code> column). Edit titles/artists/genres/BPM/Camelot in Sheets, then Import. Matching is by <strong>id first</strong> so renames stick; title+artist is only a fallback when id is blank. New rows without id are created. Columns: id, title, artist, album, genre, energy, camelot, bpm, audioUrl, albumCover, color, duration.
          </div>
          {(() => {
            const withKey = tracks.filter(t => t.camelot && t.camelot.trim());
            const withoutKey = tracks.filter(t => !t.camelot || !t.camelot.trim());
            const withBpm = tracks.filter(t => t.bpm);
            const withEnergy = tracks.filter(t => t.energy && t.energy !== 5);
            const withGenre = tracks.filter(t => t.genre && t.genre.trim());

            // Key distribution
            const keyCounts = {};
            withKey.forEach(t => { keyCounts[t.camelot] = (keyCounts[t.camelot]||0)+1; });
            const sortedKeys = Object.entries(keyCounts).sort((a,b) => b[1]-a[1]);

            // BPM-based camelot estimation
            function estimateCamelot(t) {
              const bpm = t.bpm || 120;
              const genre = (t.genre || "").toLowerCase();
              const energy = t.energy || 5;
              const preferMinor = ["techno","ambient","electronic","experimental","house","drum & bass","hip-hop","r&b","metal","rock"].some(g => genre.includes(g));
              const suffix = preferMinor ? "A" : "B";
              const keyNum = ((Math.floor(bpm / 10) + energy) % 12) + 1;
              return `${keyNum}${suffix}`;
            }

            async function batchAssign() {
              if (assigning) return;
              setAssigning(true);
              setAssigned(0);
              let count = 0;
              for (const t of withoutKey) {
                const estimated = estimateCamelot(t);
                try {
                  await updateDoc(doc(db, "tracks", t.id), { camelot: estimated });
                  setTracks(prev => prev.map(tr => tr.id === t.id ? { ...tr, camelot: estimated } : tr));
                  count++;
                  setAssigned(count);
                } catch(e) {
                  console.error("Failed to update", t.id, e);
                }
              }
              setAssigning(false);
              showToast(`Assigned keys to ${count} tracks`);
            }

            return (
              <>
                <SectionLabel>Data Coverage</SectionLabel>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:24 }}>
                  {[
                    ["Camelot Key", withKey.length, tracks.length],
                    ["BPM", withBpm.length, tracks.length],
                    ["Energy", withEnergy.length, tracks.length],
                    ["Genre", withGenre.length, tracks.length],
                  ].map(([label, has, total]) => {
                    const pct = total ? Math.round(has/total*100) : 0;
                    return (
                      <div key={label} style={{ padding:"14px 12px", background:"rgba(255,255,255,0.1)", backdropFilter:"blur(32px)", borderRadius:14, border:"1px solid rgba(255,255,255,0.14)" }}>
                        <div style={{ fontSize:11, fontWeight:600, color: color.ink, letterSpacing:0.5, marginBottom:8, textTransform:"uppercase" }}>{label}</div>
                        <div style={{ fontSize:28, fontWeight:700, color: color.ink }}>{has}<span style={{ fontSize:14, color: color.muted }}>/{total}</span></div>
                        <div style={{ height:4, background:"rgba(0,0,0,0.06)", borderRadius:2, marginTop:8, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background: pct === 100 ? color.accent : pct > 50 ? color.surfaceRaised : color.faint, borderRadius:2, transition:"width 0.5s" }}/>
                        </div>
                        <div style={{ fontSize:10, color: color.muted, marginTop:4 }}>{pct}% covered</div>
                      </div>
                    );
                  })}
                </div>

                {/* Key distribution */}
                {sortedKeys.length > 0 && (
                  <>
                    <SectionLabel>Key Distribution</SectionLabel>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:24 }}>
                      {sortedKeys.map(([key, count]) => (
                        <div key={key} style={{ padding:"6px 12px", borderRadius:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.14)", fontSize:12 }}>
                          <span style={{ fontWeight:700, color: color.ink, marginRight:4 }}>{key}</span>
                          <span style={{ color: color.muted }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Missing camelot keys */}
                <SectionLabel>Missing Camelot Keys ({withoutKey.length})</SectionLabel>
                {withoutKey.length === 0 ? (
                  <div style={{ padding:"24px 0", textAlign:"center", color: color.muted, fontSize:13 }}>All tracks have Camelot keys assigned</div>
                ) : (
                  <>
                    <div style={{ padding:"12px 14px", borderRadius:14, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", marginBottom:12 }}>
                      <div style={{ fontSize:12, color: color.ink, fontWeight:600, marginBottom:4 }}>{withoutKey.length} tracks missing keys</div>
                      <div style={{ fontSize:11, color: color.muted, lineHeight:1.5, marginBottom:12 }}>You can batch-assign estimated keys based on BPM and genre. These are rough estimates — for accurate keys, use DJ software like Mixed In Key or Rekordbox to analyze audio.</div>
                      <button onClick={batchAssign} disabled={assigning}
                        style={{ width:"100%", background:assigning? color.muted: color.surfaceRaised, color: color.ink, border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:600, cursor:assigning?"wait":"pointer", transition:"all 0.2s" }}>
                        {assigning ? `Assigning... ${assigned}/${withoutKey.length}` : `Batch assign ${withoutKey.length} keys`}
                      </button>
                    </div>
                    <div style={{ maxHeight:300, overflowY:"auto" }}>
                      {withoutKey.slice(0, 50).map(t => (
                        <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:8, marginBottom:2 }}>
                          <div style={{ width:28, height:28, borderRadius:5, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={28} borderRadius={0}/></div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, color: color.ink, letterSpacing:-0.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                            <div style={{ fontSize:10, color: color.muted }}>{t.artist}</div>
                          </div>
                          <span style={{ fontSize:9, color: color.faint }}>{t.bpm ? `${t.bpm}bpm` : "no bpm"}</span>
                          <span style={{ fontSize:9, color: color.faint }}>{t.genre || "no genre"}</span>
                          <button onClick={()=>setEditTrack(t)} style={{ background:"none", border:"none", cursor:"pointer", color: color.muted, padding:4 }}><Icon name="edit" size={12}/></button>
                        </div>
                      ))}
                      {withoutKey.length > 50 && <div style={{ textAlign:"center", color: color.muted, fontSize:11, padding:8 }}>... and {withoutKey.length - 50} more</div>}
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
      {tab==="club"&&(
        <div>
          <SectionLabel>Planet Club · Community Mix</SectionLabel>
          <div style={{ fontSize:14, color: color.muted, lineHeight:1.5, marginBottom:16 }}>
            Pick a member playlist to publish as this month’s Community Mix. Everyone gets it in their Library. Featured curator gets recognition (and prizes offline).
          </div>
          {communityMix ? (
            <div style={{
              padding: "14px 16px", borderRadius: 14, marginBottom: 18,
              background: color.surfaceSolid, border: `1px solid ${color.line}`,
            }}>
              <div style={{ fontSize:12, color: color.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>Live now</div>
              <div style={{ fontSize:18, fontWeight:700, fontFamily: fontDisplay, color: color.ink }}>
                {communityMix.title || COMMUNITY_MIX_TITLE}
              </div>
              <div style={{ fontSize:13, color: color.body, marginTop: 4 }}>
                {(communityMix.featuredCurator?.displayName || communityMix.ownerName || "Curator")}
                {" · "}
                {(communityMix.trackIds || []).length} tracks
                {communityMix.monthKey ? ` · ${formatMonthLabel(communityMix.monthKey)}` : ""}
              </div>
            </div>
          ) : (
            <div style={{ fontSize:13, color: color.faint, marginBottom: 16 }}>No Community Mix published this month yet.</div>
          )}
          <input
            placeholder="Featured curator name (optional)"
            value={clubCurator}
            onChange={(e)=>setClubCurator(e.target.value)}
            style={{ ...INPUT_ST, marginBottom: 14 }}
          />
          {publishable.length === 0 ? (
            <div style={{ fontSize:13, color: color.muted }}>
              Create a playlist in Library first, then publish it here.
            </div>
          ) : publishable.map((pl) => (
            <div
              key={pl.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", marginBottom: 6, borderRadius: 12,
                background: color.surfaceSolid, border: `1px solid ${color.line}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize:15, fontWeight:600, color: color.ink }}>{pl.name}</div>
                <div style={{ fontSize:12, color: color.muted }}>{(pl.trackIds || []).length} tracks</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!onPublishCommunityMix) return;
                  onPublishCommunityMix({
                    ...pl,
                    ownerName: clubCurator.trim() || pl.ownerName || undefined,
                  });
                }}
                style={{ ...BTN_PRIMARY, borderRadius: 980, padding: "10px 14px", fontSize: 13 }}
              >
                Make Community Mix
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NOW PLAYING BAR — flat station strip ─────────────────────────────────────
function MetaChip({ children }) {
  return <span style={{ fontSize:10, padding:"4px 8px", borderRadius:6, background: color.accentSoft, color: color.accent, fontVariantNumeric:"tabular-nums", fontWeight: 600 }}>{children}</span>;
}

// ─── FLOATING GLASS DOCK — mini-player + tabs as one surface ──────────────────
function GlassDock({
  screen, setScreen, showAdmin = false,
  track, isPlaying,
  onTogglePlay, onSkip, onPrev, onLike, onSeek,
  isRadioMode, onOpen, playlistCtx, onShowQueue, hypnoPocket,
  hidePlayer = false,
}) {
  const { progress, duration } = usePlayerPlayback();
  const items = [
    { id: "home", label: "Home", icon: "home" },
    { id: "favorites", label: "Library", icon: "dig" },
    { id: "search", label: "Search", icon: "search" },
    { id: "profile", label: "Club", icon: "profile" },
  ];
  if (showAdmin) items.push({ id: "admin", label: "Admin", icon: "settings" });

  // When Home radio owns the transport, dock collapses to tabs only.
  const hasPlayer = !!track && !hidePlayer;
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();
  const tabRowRef = useRef(null);
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const tint = dockTintStyle(track);

  const activeTab = items.some((i) => i.id === screen)
    ? screen
    : (screen === "artist" || screen === "album" ? "search" : "home");

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    const row = tabRowRef.current;
    if (!el || !row) return;
    const rowBox = row.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    setIndicator({
      left: box.left - rowBox.left + box.width * 0.28,
      width: box.width * 0.44,
    });
  }, [activeTab, items.length, hasPlayer]);

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
      }}
    >
      {hasPlayer && <EnergyShiftFeedback />}
      <div
        className="glass-dock"
        style={{
          borderRadius: dock.radius,
          overflow: "hidden",
          pointerEvents: "auto",
          ...tint,
        }}
      >
        {hasPlayer && (
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
              borderBottom: `1px solid ${glass.borderFaint}`,
              background: `
                linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)
              `,
              boxShadow: isRadioMode || hypnoPocket
                ? `inset 2px 0 0 ${color.accent}`
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
                    background: color.accent, marginRight: 8, verticalAlign: "middle",
                    boxShadow: isPlaying ? `0 0 0 3px ${color.accentSoft}` : "none",
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
              style={{ background: "none", border: "none", cursor: "pointer", color: track.liked ? color.accent : color.faint, padding: 8 }}>
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
        )}

        <nav aria-label="Main" ref={tabRowRef} style={{
          position: "relative",
          height: dock.tabH,
          display: "flex",
        }}>
          {!hasPlayer && (
            <div aria-hidden="true" style={{
              position: "absolute",
              top: 6,
              left: "50%",
              transform: "translateX(-50%)",
              opacity: 0.9,
              pointerEvents: "none",
              zIndex: 1,
            }}>
              <DoorGlyph size={16} title="" />
            </div>
          )}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: indicator.left,
              width: indicator.width,
              height: 2,
              borderRadius: 2,
              background: color.accent,
              boxShadow: "none",
              transition: `left ${motion.settle} ${motion.ease}, width ${motion.settle} ${motion.ease}`,
            }}
          />
          {items.map(({ id, icon, label }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                ref={(el) => { tabRefs.current[id] = el; }}
                type="button"
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onClick={() => setScreen(id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: active ? color.accent : color.muted,
                  transition: `color ${motion.base} ${motion.ease}`,
                }}
              >
                <span style={{
                  display: "flex",
                  transform: active ? "translateY(-1px)" : "none",
                  transition: `transform ${motion.settle} ${motion.ease}`,
                }}>
                  <Icon name={icon} size={18}/>
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: active ? 650 : 500,
                  letterSpacing: 0.2,
                }}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

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
  const shelf = (key) => (
    <div key={key} style={{ padding: `0 ${homeSpace.gutter}px`, marginBottom: 36 }}>
      <div style={{
        width: 140, height: 14, borderRadius: 4, marginBottom: 18,
        background: "rgba(26,29,36,0.08)", animation: "shimmer 1.5s ease-in-out infinite",
      }}/>
      <div style={{ display: "flex", gap: homeSpace.shelfGap, overflow: "hidden" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ flex: "0 0 auto", width: tile }}>
            <div style={{
              width: tile, height: tile, borderRadius: radius.md,
              background: "rgba(26,29,36,0.07)",
              animation: "shimmer 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.08}s`,
            }}/>
            <div style={{
              width: tile * 0.8, height: 11, borderRadius: 4, marginTop: 12,
              background: "rgba(26,29,36,0.07)",
              animation: "shimmer 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.08}s`,
            }}/>
            <div style={{
              width: tile * 0.55, height: 9, borderRadius: 4, marginTop: 7,
              background: "rgba(26,29,36,0.05)",
              animation: "shimmer 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.08}s`,
            }}/>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div aria-hidden="true" style={{ paddingTop: 32, animation: "fadeIn 0.3s ease both" }}>
      <div style={{ padding: `0 ${homeSpace.gutter}px`, marginBottom: 36 }}>
        <div style={{
          width: "100%", maxWidth: 420, height: 200, borderRadius: radius.xl,
          background: "rgba(26,29,36,0.06)", animation: "shimmer 1.5s ease-in-out infinite",
        }}/>
      </div>
      {shelf("a")}
      {shelf("b")}
    </div>
  );
}

// ─── PULSE — ambient energy visualization ─────────────────────────────────────
function Pulse({ track, isPlaying }) {
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
  const { screen, artistSlug, albumSlug, mixId } = parsePath(location.pathname);
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
  const [tracksLoading, setTracksLoading] = useState(true);
  const [tracksLoadError, setTracksLoadError] = useState(null);
  const [currentTrack, setCurrent]    = useState(null);
  const [isPlaying, setIsPlaying]     = useState(false);
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
  const [stackOpenRequest, setStackOpenRequest] = useState(null); // sidebar → open stack
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
  const [isBuffering, setIsBuffering] = useState(false);
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
  const [showListenInsights, setShowListenInsights] = useState(false);
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
  const radioIntentLabel = radioResolved().label;
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
  const [signalState, setSignalState] = useState({ intensity:0.5, openness:0.5, momentum:0, depth:0, direction:0, label:"Just started" });

  // Set arc for On Air floor (last 2 → now → next)
  const radioPickOpts = () => ({
    preferredGenres: profile?.genres || [],
    signalState,
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
  const setNext = isRadioMode && currentTrack
    ? pickNextTrack(radioPool(), currentTrack, recentlyPlayedRef.current, radioPickOpts())
    : null;

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
    setSignalState(computeHumanState(recentlyPlayedRef.current, sessionStartRef.current));
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
  }, [currentTrack?.id]);


  // Check if a track was played recently (within hours)

  useEffect(() => {
    let label = null;
    if (screen === "artist" && artistSlug) label = findArtist(tracks, artistSlug)?.name;
    if (screen === "album" && albumSlug) label = findAlbum(tracks, albumSlug)?.title;
    if (screen === "mix" && activeMix?.title) label = activeMix.title;
    document.title = documentTitleFor(screen, label);
  }, [screen, artistSlug, albumSlug, tracks, activeMix?.title]);

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

  // ── Catalog cache — stale-while-revalidate for instant warm starts ───────
  const CATALOG_CACHE_KEY = `${brandStoragePrefix()}.catalogCache.v1`;
  const profileForLikesRef = useRef(null);
  useEffect(() => { profileForLikesRef.current = profile; }, [profile]);
  const applyLikedFlags = useCallback((list) => {
    const likedSet = new Set(profileForLikesRef.current?.likedTracks || []);
    return list.map((t) => ({ ...t, liked: likedSet.has(t.id) }));
  }, []);
  const readCatalogCache = useCallback(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || "null");
      return Array.isArray(raw?.tracks) && raw.tracks.length ? raw.tracks : null;
    } catch { return null; }
  }, [CATALOG_CACHE_KEY]);
  const writeCatalogCache = useCallback((list) => {
    try {
      localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ ts: Date.now(), tracks: list }));
    } catch { /* quota or private mode — cache is best-effort */ }
  }, [CATALOG_CACHE_KEY]);

  const reloadCatalog = useCallback(async ({ background = false } = {}) => {
    if (!background) setTracksLoading(true);
    setTracksLoadError(null);
    try {
      const loaded = await fetchCatalogTracks(db);
      setTracks(applyLikedFlags(computeSignalTraits(loaded)));
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

  // ── Load tracks once on mount — render from cache instantly, refresh behind ──
  useEffect(() => {
    const cached = readCatalogCache();
    if (cached) {
      setTracks(applyLikedFlags(computeSignalTraits(cached)));
      setTracksLoading(false);
      reloadCatalog({ background: true });
    } else {
      reloadCatalog();
    }
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
    // Recompute when trial/sub fields change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile?.trialEndsAt, profile?.subscriptionStatus, profile?.plan, isAdminUser]
  );
  const needsPaywall = !!firebaseUser && !!profile && !needsOnboarding && !access.allowed;

  const handleSubscribe = useCallback(() => {
    openStripeCheckout(access.stripePaymentLink);
  }, [access.stripePaymentLink]);

  const handleBillingRefresh = useCallback(async () => {
    setBillingRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setBillingRefreshing(false);
    }
  }, [refreshProfile]);

  // Genre taste intake — only user choice; mix lane/energy stay automatic
  const finishOnboarding = async (genres = []) => {
    try {
      await completeOnboarding({ homeRooms: [], genres: genres.length ? genres : null });
      setProfile((p) => ({
        ...(p || {}),
        onboarded: true,
        homeRooms: [],
        genres: genres.length ? genres : (p?.genres || []),
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
  const currentRef     = useRef(null);
  const queueRef       = useRef([]);
  const repeatRef      = useRef("off");
  const shuffleRef     = useRef(false);
  const crossfadeOnRef = useRef(true);
  const isPlayingRef   = useRef(false);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { currentRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { crossfadeOnRef.current = crossfadeOn; }, [crossfadeOn]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const handleSkipRef = useRef(null);
  const startCrossfadeRef = useRef(null);
  const primaryAudioCleanupRef = useRef(() => {});

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
    const onWaiting = () => setIsBuffering(true);
    const onPlayingAgain = () => setIsBuffering(false);
    const onError = () => {
      const src = audio.getAttribute("src") || "";
      if (!src || src.startsWith("data:audio")) return; // unlock stub — not a real failure
      setIsBuffering(false);
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
  }, []);

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
      primaryAudioCleanupRef.current?.();
      a.pause(); b.pause();
      a.src = ""; b.src = "";
    };
  }, [bindPrimaryAudio]);

  function startCrossfade() {
    if (isCrossfading.current) return;
    isCrossfading.current = true;

    const radio = isRadioModeRef.current;
    let next = null;
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
      next = pickNextTrack(library, currentRef.current, recentlyPlayedRef.current, {
        preferredGenres: profile?.genres || [],
        signalState,
        seedTrack: hypnoSeed,
        scopedPool: true,
        tasteBlend: !(listenFocusRef.current?.genre),
        energyShift: playerEnergyStore.getState(),
      });
    } else {
      const q = queueRef.current;
      if (!q.length) { isCrossfading.current = false; return; }
      next = shuffleRef.current
        ? q[Math.floor(Math.random() * q.length)]
        : q[0];
    }
    if (!next?.audioUrl) { isCrossfading.current = false; return; }

    const outgoing = currentRef.current;
    const fadeOut = audioRef.current;
    const fadeIn  = nextAudioRef.current;
    const fadeSecs = radio ? RADIO_CROSSFADE_SECS : QUEUE_CROSSFADE_SECS;

    // Load and start the next track silently
    fadeIn.src    = next.audioUrl;
    fadeIn.volume = 0;
    fadeIn.play().catch(() => {});

    // Record the play
    if (firebaseUser) recordPlay(next.id, profile?.recentTracks || []).catch(()=>{});

    fadeIn.addEventListener("loadedmetadata", () => {
      setDuration(Math.floor(fadeIn.duration || 0));
    }, { once: true });

    // Ramp volumes over the crossfade window
    const steps    = fadeSecs * 20; // 20 steps per second
    const interval = 1000 / 20;
    let   step     = 0;

    clearInterval(crossfadeRef.current);
    crossfadeRef.current = setInterval(() => {
      step++;
      const t = step / steps;
      const targetVol = volumeRef.current;
      fadeOut.volume = Math.max(0, targetVol * (1 - t));
      fadeIn.volume  = Math.min(targetVol, targetVol * t);

      if (step >= steps) {
        clearInterval(crossfadeRef.current);
        fadeOut.pause();
        fadeOut.src = "";
        fadeOut.volume = targetVol;

        // Swap refs so audioRef always points to the active player
        audioRef.current     = fadeIn;
        nextAudioRef.current = fadeOut;
        bindPrimaryAudio(fadeIn);

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
  }
  startCrossfadeRef.current = startCrossfade;

  // When track changes (non-crossfade — manual play), load fresh
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    // If we're crossfading in radio mode, the engine handles it — skip
    if (isCrossfading.current) return;
    const audio = audioRef.current;
    clearInterval(crossfadeRef.current);
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
      if (isPlaying) audio.play().catch(() => {});
    } else {
      audio.src = "";
      setProgress(0);
    }
  }, [currentTrack?.id]);

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
  }, [currentTrack?.id]);
  useEffect(() => {
    if (resumeRestoredRef.current || tracksLoading || currentTrack || !tracks.length) return;
    resumeRestoredRef.current = true;
    try {
      const saved = JSON.parse(localStorage.getItem(`${brandStoragePrefix()}.lastSession`) || "null");
      if (!saved?.trackId) return;
      const track = tracks.find((t) => t.id === saved.trackId && String(t.audioUrl || "").trim());
      if (!track) return;
      const dur = track.duration || 0;
      const position = Number.isFinite(saved.position) && saved.position > 3 && (!dur || saved.position < dur - 10)
        ? saved.position
        : 0;
      pendingResumeRef.current = position;
      setCurrent(track); // paused — never autoplay on launch
      setIsRadioMode(false);
    } catch { /* ignore */ }
  }, [tracksLoading, tracks, currentTrack]);

  // Sync play/pause
  useEffect(() => {
    if (!audioRef.current || !currentTrack?.audioUrl) return;
    if (isPlaying) { audioRef.current.play().catch(() => {}); }
    else           { audioRef.current.pause(); }
  }, [isPlaying]);

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

  const playTrack = (track, q = null, opts = {}) => {
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
    if (firebaseUser) recordPlay(track.id, profile?.recentTracks || []).catch(()=>{});
  };

  const playPath = (path) => {
    if (!path?.playlist?.length) return;
    const first = path.playlist[0];
    setListeningRoom({ id: path.id, label: path.title });
    playTrack(first, path.playlist, { immersive: true, keepRoom: true, room: { id: path.id, label: path.title } });
    showToast(`Walking “${path.title}”`);
  };

  const playRadio = (seed = null, intentOverride = null) => {
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
          signalState,
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
    if (firebaseUser) recordPlay(first.id, profile?.recentTracks || []).catch(()=>{});
  };

  // Play a generated route / night as a queue — session ritual
  const playRoute = (routeTracks, kind = "night") => {
    if (!routeTracks.length) return;
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
    if (firebaseUser) recordPlay(first.id, profile?.recentTracks || []).catch(()=>{});
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
        if (firebaseUser) recordPlay(next.id, profile?.recentTracks || []).catch(()=>{});
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
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
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
  }, [currentTrack?.id, isPlaying]);


  // ── Like/unlike — optimistic UI + Firestore sync ────────────────────────
  const toggleLike = async (id) => {
    const track = tracks.find(t => t.id === id);
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
    [liveShow, liveAiring?.show?.id, currentTrack?.id]
  );
  const stationDaypartLive = useMemo(() => stationDaypart(new Date()), [mixLane, currentTrack?.id]);
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
    [currentTrack?.id, requestTick]
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
    if (firebaseUser) recordPlay(first.id, profile?.recentTracks || []).catch(() => {});
  }, [tracks, countdown, liveAiring, currentTrack, firebaseUser, profile?.recentTracks]);

  // Stable ref so playRadio (defined earlier) can tune a live block without TDZ issues
  playShowRef.current = playShow;

  const playSceneChannel = useCallback((channelInput) => {
    const channel = typeof channelInput === "string"
      ? getSceneChannel(channelInput)
      : channelInput;
    if (!channel) return;
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
    if (firebaseUser) recordPlay(first.id, profile?.recentTracks || []).catch(() => {});
  }, [tracks, currentTrack, firebaseUser, profile?.recentTracks]);

  const playWeeklyReveal = useCallback(() => {
    const weekly = buildWeeklyReveal(12);
    const pool = weekly
      .map((e) => tracks.find((t) => t.id === e.id))
      .filter(Boolean);
    if (!pool.length) {
      showToast("Weekly reveal needs a few days of chart history");
      return;
    }
    setActiveShowId(null);
    setActiveSceneChannelId(null);
    playTrack(pool[0], pool, { immersive: true });
    showToast("Weekly reveal — peak chart cuts");
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
  }, [countdown, currentTrack?.id]);

  const stationUpNext = setNext || (countdown[0]?.track?.id !== currentTrack?.id ? countdown[0]?.track : countdown[1]?.track) || null;

  // Station bumper / ident between cuts while locked to channel or show
  useEffect(() => {
    if (!currentTrack?.id || !isPlaying) return;
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
  }, [currentTrack?.id, isPlaying, isRadioMode, activeShowId, activeSceneChannelId, liveShow, stationUpNext, countdown]);

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
    showToast(`Added to ${pl.name}`);
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

  // ── Search — ranked, diacritic-folded, memoized ───────────────────────────
  const searchResults = useMemo(() => {
    if (searchQuery.length === 0) return [];
    const fold = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    const q = fold(searchQuery).trim();
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
  }, [tracks, searchQuery]);
  const entityHits = useMemo(
    () => (searchQuery.length > 1 ? searchEntities(tracks, searchQuery) : { artists: [], albums: [] }),
    [tracks, searchQuery]
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
    const isTab = screen === "home" || screen === "search" || screen === "favorites" || screen === "profile";
    el.scrollTop = isTab ? (scrollPosRef.current[screen] || 0) : 0;
  }, [screen]);

  // ── Loading states ────────────────────────────────────────────────────────
  // Auth boot — logo only (Lottie slot at public/brand/splash-loader.json)
  if (authLoading) return <SplashScreen size={240} />;

  // Not logged in — show login screen
  if (!firebaseUser) return (
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
  );

  if (needsOnboarding) {
    return (
      <GenreTasteOnboarding
        initialGenres={profile?.genres || []}
        onComplete={(genres) => finishOnboarding(genres)}
        onSkip={() => finishOnboarding([])}
      />
    );
  }

  if (needsPaywall) {
    return (
      <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>Loading membership…</div>}>
        <LazyPaywallScreen
          access={access}
          onSubscribe={handleSubscribe}
          onRefresh={handleBillingRefresh}
          onLogout={logOut}
          refreshing={billingRefreshing}
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
      {showQueue && (
        <QueueSheet
          queue={queue}
          currentTrack={currentTrack}
          isRadioMode={isRadioMode}
          radioHint={hypnoSeed
            ? `Near ${hypnoSeed.title}`
            : explainPick(setNext || currentTrack, {
                signalLabel: signalState?.label,
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
      {showListenInsights && (
        <ListenInsightsSheet
          tracks={tracks}
          genres={profile?.genres || []}
          recentTracks={profile?.recentTracks || []}
          signalLabel={signalState?.label}
          onClose={() => setShowListenInsights(false)}
          onEditGenres={() => {
            setShowListenInsights(false);
            setShowGenreTaste(true);
          }}
          onPlayTrack={(t, pool) => {
            setShowListenInsights(false);
            setIsRadioMode(false);
            playTrack(t, pool || tracks);
          }}
        />
      )}
      {showGenreTaste && (
        <GenreTasteSheet
          selectedGenres={profile?.genres || []}
          genreFocus={listenFocus.genre}
          onClose={() => setShowGenreTaste(false)}
          onClearGenreFocus={() => {
            setListenFocus({ genre: null, scene: null });
            showToast("Back to your usual mix");
          }}
          onSave={async (genres) => {
            try {
              await saveGenres(genres);
              setProfile((p) => ({ ...(p || {}), genres }));
              showToast(genres.length ? "Genres saved" : "Genres cleared");
            } catch (e) {
              showToast("Couldn’t save genres");
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
    <ImmersivePlayer
      currentTrack={currentTrack}
      isPlaying={isPlaying}
      onTogglePlay={togglePlay}
      onSkip={handleSkip}
      onPrev={handlePrev}
      onClose={() => setImmersive(false)}
      signalState={signalState}
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
      Icon={Icon}
      IceOrbPlay={IceOrbPlay}
    />
  ) : null;

  // Cover Stage owns transport on Home while visible — sticky dock returns after scroll.
  const hideDockPlayer = screen === "home" && !!currentTrack && !immersive && homeStageVisible;

  // ── Ambient status — SR announcements, offline banner, buffering pill ────
  const ambientStatus = (
    <>
      <div className="sr-only" aria-live="polite">
        {currentTrack ? `Now playing ${currentTrack.title} by ${currentTrack.artist}` : ""}
      </div>
      {(isOffline || (isBuffering && isPlaying)) && (
        <div role="status" style={{
          position: "fixed",
          top: `calc(10px + env(safe-area-inset-top, 0px))`,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 120,
          display: "flex", alignItems: "center", gap: 8,
          background: isOffline ? color.ink : "rgba(255,255,255,0.92)",
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
          {isOffline ? "Offline — playback may pause" : "Buffering…"}
        </div>
      )}
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
        <ScreenPane key={screen === "artist" ? `artist:${artistSlug}` : screen === "album" ? `album:${albumSlug}` : screen === "mix" ? `mix:${mixId}` : screen}>
        {screen==="home"      && !tracksLoading && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={togglePlay} onPlayTrack={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} onLike={toggleLike} isRadioMode={isRadioMode} hypnoPocket={!!hypnoSeed} playlistCtx={playlistCtx} signalLabel={signalState?.label} mixLane={mixLane} radioPreview={heroPreview} radioNext={setNext} onSkipRadio={handleSkip} onPrevRadio={handlePrev} onOpenPlayer={()=>setImmersive(true)} onListenFor={()=>setShowListenInsights(true)} intentLabel={radioIntentLabel} catalogError={tracksLoadError} onRetryCatalog={reloadCatalog} preferredGenres={user.genres} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} communityMix={communityMix} onOpenCommunityMix={()=>communityMix && openMix(communityMix.id)} onBrowse={()=>setScreen("search")} onCustomMix={()=>{ setSessionInitialActivity(vibeForMixLane(mixLane)); setShowRouteBuilder(true); }} onStageVisibilityChange={onHomeStageVisibilityChange} onSeek={handleSeek} userKey={firebaseUser?.uid || ""} countdown={countdown} onTuneCountdown={tuneCountdown} daypart={activeDaypart} tickerText={stationTicker} onRequest={requestCurrentTrack} requested={currentRequested} onDedicate={()=>setShowDedicate(true)} dedicationFlash={dedicationFlash} onClearDedication={()=>setDedicationFlash(null)} airing={liveAiring} programGuide={programGuide} activeShowId={activeShowId} onTuneShow={playShow} showBumper={showBumper} channelShow={liveShow} sceneChannelsActiveId={activeSceneChannelId} onTuneSceneChannel={playSceneChannel} onTuneWeeklyReveal={playWeeklyReveal}/>}
        {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} tracks={tracks} onPlay={(t,pool)=>{ recordRecentSearch(searchQuery); playTrack(t,pool||tracks); }} onListenIntent={(focus)=>{ const next={ genre: focus.genre || null, scene: null }; setListenFocus(next); playRadio(null, createListenIntent({ mixLane, ...next })); }} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx} entityHits={entityHits} onOpenArtist={(slug)=>{ recordRecentSearch(searchQuery); openArtist(slug); }} onOpenAlbum={(slug)=>{ recordRecentSearch(searchQuery); openAlbum(slug); }} recentSearches={recentSearches} onPickRecent={(q)=>setSearch(q)} onClearRecent={clearRecentSearches}/>}
        {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onPlayTrack={(t,pool)=>{setIsRadioMode(false);playTrack(t,pool||tracks);}} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx} userPlaylists={libraryPlaylists} onCreatePlaylist={createPlaylist} onDeletePlaylist={deletePlaylist} onRenamePlaylist={renamePlaylist} onSharePlaylist={sharePlaylistToClub} openRequestId={stackOpenRequest} onConsumeOpenRequest={()=>setStackOpenRequest(null)} communityMix={communityMix} onOpenMix={()=>communityMix && openMix(communityMix.id)} onCustomMix={()=>{ setSessionInitialActivity(vibeForMixLane(mixLane)); setShowRouteBuilder(true); }}/>}
        {screen==="mix"       && (
          <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Pulling the plate…</div>}>
          <LazyMixScreen
            mix={activeMix}
            tracks={tracks}
            loading={mixLoading}
            notFound={!mixLoading && !activeMix}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
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
          <ArtistPage
            artist={findArtist(tracks, artistSlug)}
            onBack={goBack}
            onPlay={(t, pool) => playTrack(t, pool)}
            onOpenAlbum={(slug) => openAlbum(slug)}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onLike={toggleLike}
            AlbumArt={AlbumArt}
            TrackRow={TrackRow}
            playlistCtx={playlistCtx}
          />
        )}
        {screen==="album"     && !tracksLoading && (
          <AlbumPage
            album={findAlbum(tracks, albumSlug)}
            onBack={goBack}
            onPlay={(t, pool) => playTrack(t, pool)}
            onOpenArtist={(slug) => openArtist(slug)}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onLike={toggleLike}
            AlbumArt={AlbumArt}
            TrackRow={TrackRow}
            playlistCtx={playlistCtx}
          />
        )}
        {screen==="profile"   && (
          <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Opening the club…</div>}>
            <ClubScreen user={user} tracks={tracks} onLogout={logOut} access={access} onSubscribe={handleSubscribe} profile={profile} communityMix={communityMix} onOpenMix={communityMix ? ()=>openMix(communityMix.id) : null} onEditGenres={()=>setShowGenreTaste(true)}/>
          </Suspense>
        )}
        {screen==="admin"     && <AdminScreen tracks={tracks} setTracks={setTracks} tab={adminTab} setTab={setAdminTab} editTrack={editTrack} setEditTrack={setEditTrack} showToast={showToast} userPlaylists={userPlaylists} communityMix={communityMix} onPublishCommunityMix={publishCommunityMixFromPlaylist}/>}
        </ScreenPane>
      </div>
      {!immersive && (
        <GlassDock
          screen={screen}
          setScreen={setScreen}
          showAdmin={firebaseUser?.uid === ADMIN_UID}
          track={currentTrack}
          isPlaying={isPlaying}
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
          linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.35) 100%),
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
                onClick={() => { setStackOpenRequest(null); setScreen(item.id); }}
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
                onClick={() => { setStackOpenRequest(null); setScreen(item.id); }}
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
          maxWidth: (screen==="home" || screen==="favorites" || screen==="artist" || screen==="album") ? "none" : 960,
          margin:"0 auto",
          padding: (screen==="home" || screen==="favorites" || screen==="artist" || screen==="album")
            ? `0 0 ${currentTrack && !(screen === "home" && homeStageVisible) ? 120 : 24}px`
            : `24px 32px ${currentTrack && !(screen === "home" && homeStageVisible) ? 120 : 24}px`,
        }}>
          <BgMist color={currentTrack?.color}/>
          <Pulse track={currentTrack} isPlaying={isPlaying}/>
          {ambientStatus}
          {toast && <ToastEl msg={toast} onDismiss={()=>setToast(null)}/>}
          {tracksLoading ? (
            <>
              <div className="sr-only" role="status">Loading your catalog…</div>
              <CatalogSkeleton/>
            </>
          ) : (
            <ScreenPane key={screen === "artist" ? `artist:${artistSlug}` : screen === "album" ? `album:${albumSlug}` : screen === "mix" ? `mix:${mixId}` : screen}>
              {screen==="home"      && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={togglePlay} onPlayTrack={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} onLike={toggleLike} isRadioMode={isRadioMode} hypnoPocket={!!hypnoSeed} playlistCtx={playlistCtx} signalLabel={signalState?.label} mixLane={mixLane} radioPreview={heroPreview} radioNext={setNext} onSkipRadio={handleSkip} onPrevRadio={handlePrev} onOpenPlayer={()=>setImmersive(true)} onListenFor={()=>setShowListenInsights(true)} intentLabel={radioIntentLabel} catalogError={tracksLoadError} onRetryCatalog={reloadCatalog} preferredGenres={user.genres} recentTrackIds={(profile?.recentTracks||[]).map(r=>r.trackId||r)} communityMix={communityMix} onOpenCommunityMix={()=>communityMix && openMix(communityMix.id)} onBrowse={()=>setScreen("search")} onCustomMix={()=>{ setSessionInitialActivity(vibeForMixLane(mixLane)); setShowRouteBuilder(true); }} onStageVisibilityChange={onHomeStageVisibilityChange} onSeek={handleSeek} userKey={firebaseUser?.uid || ""} countdown={countdown} onTuneCountdown={tuneCountdown} daypart={activeDaypart} tickerText={stationTicker} onRequest={requestCurrentTrack} requested={currentRequested} onDedicate={()=>setShowDedicate(true)} dedicationFlash={dedicationFlash} onClearDedication={()=>setDedicationFlash(null)} airing={liveAiring} programGuide={programGuide} activeShowId={activeShowId} onTuneShow={playShow} showBumper={showBumper} channelShow={liveShow} sceneChannelsActiveId={activeSceneChannelId} onTuneSceneChannel={playSceneChannel} onTuneWeeklyReveal={playWeeklyReveal}/>}
              {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} tracks={tracks} onPlay={(t,pool)=>{ recordRecentSearch(searchQuery); playTrack(t,pool||tracks); }} onListenIntent={(focus)=>{ const next={ genre: focus.genre || null, scene: null }; setListenFocus(next); playRadio(null, createListenIntent({ mixLane, ...next })); }} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx} entityHits={entityHits} onOpenArtist={(slug)=>{ recordRecentSearch(searchQuery); openArtist(slug); }} onOpenAlbum={(slug)=>{ recordRecentSearch(searchQuery); openAlbum(slug); }} recentSearches={recentSearches} onPickRecent={(q)=>setSearch(q)} onClearRecent={clearRecentSearches}/>}
              {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onPlayTrack={(t,pool)=>{setIsRadioMode(false);playTrack(t,pool||tracks);}} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx} userPlaylists={libraryPlaylists} onCreatePlaylist={createPlaylist} onDeletePlaylist={deletePlaylist} onRenamePlaylist={renamePlaylist} onSharePlaylist={sharePlaylistToClub} openRequestId={stackOpenRequest} onConsumeOpenRequest={()=>setStackOpenRequest(null)} communityMix={communityMix} onOpenMix={()=>communityMix && openMix(communityMix.id)} onCustomMix={()=>{ setSessionInitialActivity(vibeForMixLane(mixLane)); setShowRouteBuilder(true); }}/>}
              {screen==="mix"       && (
                <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Pulling the plate…</div>}>
                <LazyMixScreen
                  mix={activeMix}
                  tracks={tracks}
                  loading={mixLoading}
                  notFound={!mixLoading && !activeMix}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
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
                <ArtistPage
                  artist={findArtist(tracks, artistSlug)}
                  onBack={goBack}
                  onPlay={(t, pool) => playTrack(t, pool)}
                  onOpenAlbum={(slug) => openAlbum(slug)}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onLike={toggleLike}
                  AlbumArt={AlbumArt}
                  TrackRow={TrackRow}
                  playlistCtx={playlistCtx}
                />
              )}
              {screen==="album"     && (
                <AlbumPage
                  album={findAlbum(tracks, albumSlug)}
                  onBack={goBack}
                  onPlay={(t, pool) => playTrack(t, pool)}
                  onOpenArtist={(slug) => openArtist(slug)}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onLike={toggleLike}
                  AlbumArt={AlbumArt}
                  TrackRow={TrackRow}
                  playlistCtx={playlistCtx}
                />
              )}
              {screen==="profile"   && (
                <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Opening the club…</div>}>
                  <ClubScreen user={user} tracks={tracks} onLogout={logOut} access={access} onSubscribe={handleSubscribe} profile={profile} communityMix={communityMix} onOpenMix={communityMix ? ()=>openMix(communityMix.id) : null} onEditGenres={()=>setShowGenreTaste(true)}/>
                </Suspense>
              )}
              {screen==="admin"     && <AdminScreen tracks={tracks} setTracks={setTracks} tab={adminTab} setTab={setAdminTab} editTrack={editTrack} setEditTrack={setEditTrack} showToast={showToast} userPlaylists={userPlaylists} communityMix={communityMix} onPublishCommunityMix={publishCommunityMixFromPlaylist}/>}
            </ScreenPane>
          )}
        </div>
        </>
        {/* Desktop mini-player — sticky when Cover Stage scrolls away on Home */}
        {currentTrack && !immersive && !(screen === "home" && homeStageVisible) && (
          <DesktopMiniPlayer
            track={currentTrack}
            isPlaying={isPlaying}
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
          />
        )}
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
      <div className="hide-scroll" style={{
        width: 336,
        flexShrink: 0,
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.4) 100%),
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
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
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
              <img
                src={currentTrack.albumCover || "/covers/default.jpg"}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => { e.target.src = "/covers/default.jpg"; }}
              />
              <div aria-hidden="true" style={{
                position: "absolute",
                inset: 0,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
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
          background: "linear-gradient(90deg, transparent 0%, rgba(26,29,36,0.08) 20%, rgba(26,29,36,0.12) 50%, rgba(26,29,36,0.08) 80%, transparent 100%)",
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
                    }}>
                      <img
                        src={t.albumCover || "/covers/default.jpg"}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={(e) => { e.target.src = "/covers/default.jpg"; }}
                      />
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

