import fs from "fs";
import path from "path";
import { STYLE_CHASSIS, color } from "./theme";

const root = path.join(__dirname, "..");

test("boot HTML stamps the current steel chassis", () => {
  const html = fs.readFileSync(path.join(root, "public/index.html"), "utf8");
  expect(html).toContain(`content="${STYLE_CHASSIS}"`);
  expect(html).toContain(color.canvas);
  expect(html).toMatch(/IBM\+Plex|IBM Plex/);
  expect(html).not.toContain("family=Syne");
  expect(html).not.toMatch(/101\s*,\s*230\s*,\s*255/);
});

test("Home does not import the quarantined CoverStage", () => {
  const home = fs.readFileSync(path.join(root, "src/screens/HomeScreen.jsx"), "utf8");
  expect(home).not.toMatch(/CoverStage/);
  const cover = fs.readFileSync(path.join(root, "src/components/station/CoverStage.jsx"), "utf8");
  expect(cover).toMatch(/Quarantined/);
});

test("committed Pages build matches the current chassis", () => {
  const htmlPath = path.join(root, "build/index.html");
  expect(fs.existsSync(htmlPath)).toBe(true);
  const html = fs.readFileSync(htmlPath, "utf8");
  expect(html).toContain(`content="${STYLE_CHASSIS}"`);
  expect(html).toContain(color.canvas);
  expect(html).toMatch(/IBM\+Plex|IBM Plex/);
  expect(html).not.toContain("family=Syne");
  expect(html).not.toMatch(/101\s*,\s*230\s*,\s*255/);
  expect(html).not.toMatch(/#7ED9B8/i);
});

test("committed Pages CSS includes the Charts podium board", () => {
  const cssDir = path.join(root, "build", "static", "css");
  const css = fs.readdirSync(cssDir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => fs.readFileSync(path.join(cssDir, f), "utf8"))
    .join("\n");
  expect(css).toMatch(/pmp-chart-podium/);
});

test("theme source does not ship mint phosphor or DistroKid trim", () => {
  const theme = fs.readFileSync(path.join(root, "src/theme.js"), "utf8");
  expect(theme).not.toMatch(/#7ED9B8/i);
  expect(theme).not.toMatch(/#4E9A7A/i);
  expect(theme).not.toMatch(/#C8F5E4/i);
  expect(theme).not.toMatch(/DistroKid/);
  expect(theme).not.toMatch(/#B8C430/i);
  expect(theme).not.toMatch(/#367FC7/i);
  expect(theme).toMatch(/lcdSignal/);
  expect(theme).not.toMatch(/lcdPhosphor/);
});

test("player surfaces use Turtle / Rabbit, not energy paddles", () => {
  const files = [
    "src/components/player/ImmersivePlayer.jsx",
    "src/components/player/DesktopMiniPlayer.jsx",
    "src/components/player/PlayerDeck.jsx",
    "src/components/home/HeroPlayerCard.jsx",
  ];
  for (const rel of files) {
    const src = fs.readFileSync(path.join(root, rel), "utf8");
    expect(src).toMatch(/RabbitTurtleSlot|PlayerDeck/);
    expect(src).not.toMatch(/EnergyShiftPaddles/);
    expect(src).not.toMatch(/EnergyShiftCapsule/);
  }
  const dock = fs.readFileSync(path.join(root, "src/components/player/GlassDock.jsx"), "utf8");
  expect(dock).toMatch(/Open now playing/);
  expect(dock).not.toMatch(/PaceSlot/);
  expect(dock).not.toMatch(/RabbitTurtleSlot/);
  expect(dock).not.toMatch(/mini-player-sheet/);
  expect(dock).not.toMatch(/EnergyShiftPaddles/);
  const css = fs.readFileSync(path.join(root, "src/index.css"), "utf8");
  expect(css).toMatch(/\.pmp-deck-plate/);
  expect(css).toMatch(/\.pmp-seek__well/);
  expect(css).toMatch(/max-width:\s*50%/);
  expect(css).toMatch(/\.pmp-rabbit-slot/);
  expect(css).toMatch(/\.pmp-mini-player/);
  expect(css).toMatch(/\.pmp-mini-progress/);
  const hero = fs.readFileSync(path.join(root, "src/components/home/HeroPlayerCard.jsx"), "utf8");
  expect(hero).toMatch(/idle=\{!live\}/);
  const mini = fs.readFileSync(path.join(root, "src/components/player/DesktopMiniPlayer.jsx"), "utf8");
  expect(mini).toMatch(/onShare/);
  expect(mini).toMatch(/onShowQueue/);
});

test("browse lists print BPM and Camelot, and Home ranks the player over radio", () => {
  const row = fs.readFileSync(path.join(root, "src/components/listen/TrackRow.jsx"), "utf8");
  expect(row).toMatch(/trackBrowseBits/);
  const focus = fs.readFileSync(path.join(root, "src/components/explore/ExploreFocus.jsx"), "utf8");
  expect(focus).toMatch(/trackBrowseBits/);
  const home = fs.readFileSync(path.join(root, "src/screens/HomeScreen.jsx"), "utf8");
  expect(home.indexOf("<HeroPlayerCard")).toBeLessThan(home.indexOf("<HomePersonal"));
  expect(home.indexOf("<HomePersonal")).toBeLessThan(home.indexOf("<ChannelSurfingSection"));
  expect(home.indexOf("<ChannelSurfingSection")).toBeLessThan(home.indexOf("<TonightDeck"));
  expect(home).toMatch(/signedIn/);
  expect(home).toMatch(/Your listening/);
  const header = fs.readFileSync(path.join(root, "src/components/home/HomeHeader.jsx"), "utf8");
  expect(header).toMatch(/aria-label="Search"/);
  expect(header).toMatch(/Find/);
  expect(header).toMatch(/aria-label="More"/);
  expect(header).not.toMatch(/onOpenProfile/);
  const sidebar = fs.readFileSync(path.join(root, "src/components/layout/AppSidebar.jsx"), "utf8");
  expect(sidebar).toMatch(/variant === "drawer"/);
  expect(sidebar).not.toMatch(/Faceplate/);
});

test("Pace slider is Slow / Fast glass with ice LCD fill", () => {
  const src = fs.readFileSync(path.join(root, "src/components/listen/EnergyShiftButton.jsx"), "utf8");
  expect(src).toMatch(/Slow/);
  expect(src).toMatch(/Fast/);
  expect(src).toMatch(/trim\.gradient/);
  expect(src).toMatch(/pace-range/);
  const start = src.indexOf("export function PaceSlider");
  const end = src.indexOf("export function EnergyShiftCapsule");
  const slider = src.slice(start, end > start ? end : undefined);
  expect(slider).not.toMatch(/Ease/);
  expect(slider).not.toMatch(/Lift/);
  expect(slider).not.toMatch(/Middle/);
});

test("Home does not mount station chat on the critical path", () => {
  const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
  expect(app).not.toMatch(/HomeMessenger/);
  expect(app).not.toMatch(/homeChatReady/);
});

test("Explore prefetches on idle and Home Channel Surfing uses PS1 plates", () => {
  const explore = fs.readFileSync(path.join(root, "src/lib/explore.js"), "utf8");
  expect(explore).not.toMatch(/from ["']\.\/channelArt["']/);
  const art = fs.readFileSync(path.join(root, "src/lib/channelArt.js"), "utf8");
  expect(art).not.toMatch(/from ["'].*assets\/channels/);
  expect(art).toMatch(/\/channels\/\$\{id\}\.png/);
  const card = fs.readFileSync(path.join(root, "src/components/home/ChannelCard.jsx"), "utf8");
  expect(card).toMatch(/resolveChannelArt/);
  expect(card).toMatch(/\braw\b/);
  expect(card).toMatch(/DefaultSleeve/);
  expect(card).toMatch(/lcdSignal/);
  expect(card).not.toMatch(/covers\.find/);
  const surf = fs.readFileSync(path.join(root, "src/components/home/ChannelSurfingSection.jsx"), "utf8");
  expect(surf).not.toMatch(/channelCoverUrls/);
  const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
  expect(app).toMatch(/runWhenIdle\(loadExploreScreen/);
  expect(app).not.toMatch(/setTimeout\(loadExploreScreen, 8000\)/);
  expect(app).not.toMatch(/RIGHT PANEL/);
  expect(app).not.toMatch(/sidebar-queue-row/);
  expect(app).toMatch(/runAfterDelay/);
  expect(app).not.toMatch(/timeout: 2200/);
  const screen = fs.readFileSync(path.join(root, "src/screens/ExploreScreen.jsx"), "utf8");
  expect(screen).not.toMatch(/setDeepReady/);
  expect(screen).not.toMatch(/will-change: transform/);
  expect(screen).toMatch(/activeMode === "worlds"/);
});

test("ice phosphor is the play pip, dock LCD, Mix/Energy sleeves, and poster stage", () => {
  const play = fs.readFileSync(path.join(root, "src/components/player/OrbitalControls.jsx"), "utf8");
  expect(play).toMatch(/color\.lcdSignal/);
  expect(play).not.toMatch(/trimStroke/);
  expect(play).not.toMatch(/trim\.lime/);
  const dockSrc = fs.readFileSync(path.join(root, "src/components/player/GlassDock.jsx"), "utf8");
  expect(dockSrc).toMatch(/radio\.lcdFace/);
  expect(dockSrc).toMatch(/pmp-dock-faceplate/);
  expect(dockSrc).not.toMatch(/dockTintStyle/);
  const home = fs.readFileSync(path.join(root, "src/screens/HomeScreen.jsx"), "utf8");
  expect(home).toMatch(/maxWidth:\s*1100/);
  expect(home).not.toMatch(/maxWidth:\s*960/);
  const immersive = fs.readFileSync(path.join(root, "src/components/player/ImmersivePlayer.jsx"), "utf8");
  expect(immersive).toMatch(/flexShrink:\s*0/);
  expect(immersive).toMatch(/min\(72vw,\s*520px\)/);
  const mix = fs.readFileSync(path.join(root, "src/components/explore/MixBoard.jsx"), "utf8");
  expect(mix).toMatch(/position:\s*"absolute"/);
  expect(mix).toMatch(/objectFit:\s*"cover"/);
  const energy = fs.readFileSync(path.join(root, "src/components/explore/EnergyRooms.jsx"), "utf8");
  expect(energy).toMatch(/room\.photo/);
  expect(energy).toMatch(/CoverImage/);
});

test("premium drivetrain: one chassis, self-hosted Plex, no lucide", () => {
  const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
  expect((app.match(/<HomeScreen /g) || []).length).toBe(1);
  expect(app).toMatch(/keepAlive/);
  expect(app).toMatch(/from "\.\/lib\/audioEngine"/);
  expect(app).toMatch(/from "\.\/lib\/mediaSession"/);
  expect(app).toMatch(/\{innerApp\}/);
  expect(app).toMatch(/runWhenIdle\(loadExploreScreen/);
  expect(app).toMatch(/dismissBootSplash/);
  expect(app).toMatch(/peekAuthSession/);
  expect(app).toMatch(/sessionLikely/);
  expect(app).toMatch(/adoptCatalogTracks/);
  expect(app).toMatch(/bootBlocked/);
  expect(app).toMatch(/loadCatalogFirstPaint/);
  expect(app).toMatch(/createAudioPair/);
  expect(app).toMatch(/GuestMemberGate/);
  expect(app).not.toMatch(/if \(!firebaseUser\) return \(/);

  const html = fs.readFileSync(path.join(root, "public/index.html"), "utf8");
  expect(html).not.toMatch(/fonts\.googleapis/);
  expect(html).toMatch(/ibm-plex-sans-400\.woff2/);
  expect(html).toMatch(/font-display:\s*optional/);
  expect(html).toMatch(/id="boot-splash"/);
  expect(html.indexOf('id="boot-splash"')).toBeLessThan(html.indexOf('id="root"'));

  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  expect(pkg.dependencies["lucide-react"]).toBeUndefined();

  const theme = fs.readFileSync(path.join(root, "src/theme.js"), "utf8");
  expect(theme).toMatch(/blur:\s*"none"/);

  expect(fs.existsSync(path.join(root, "public/fonts/ibm-plex-sans-400.woff2"))).toBe(true);
  expect(fs.existsSync(path.join(root, "src/lib/audioEngine.js"))).toBe(true);
  expect(fs.existsSync(path.join(root, "functions/lib/catalogJson.js"))).toBe(true);
  expect(fs.existsSync(path.join(root, "public/sw.js"))).toBe(true);
  expect(fs.readFileSync(path.join(root, "src/firebase.js"), "utf8")).toMatch(/export function getFirebase/);
  expect(fs.readFileSync(path.join(root, "functions/lib/catalogJson.js"), "utf8")).toMatch(/contentEncoding:\s*"gzip"/);
});
