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

test("theme source does not ship mint phosphor", () => {
  const theme = fs.readFileSync(path.join(root, "src/theme.js"), "utf8");
  expect(theme).not.toMatch(/#7ED9B8/i);
  expect(theme).not.toMatch(/#4E9A7A/i);
  expect(theme).not.toMatch(/#C8F5E4/i);
  expect(theme).toMatch(/lcdSignal/);
  expect(theme).not.toMatch(/lcdPhosphor/);
});

test("player surfaces use a half-width Pace slot, not energy paddles", () => {
  const files = [
    "src/components/player/ImmersivePlayer.jsx",
    "src/components/player/GlassDock.jsx",
    "src/components/player/DesktopMiniPlayer.jsx",
    "src/components/home/HeroPlayerCard.jsx",
  ];
  for (const rel of files) {
    const src = fs.readFileSync(path.join(root, rel), "utf8");
    expect(src).toMatch(/PaceSlot/);
    expect(src).not.toMatch(/EnergyShiftPaddles/);
    expect(src).not.toMatch(/EnergyShiftCapsule/);
  }
  const css = fs.readFileSync(path.join(root, "src/index.css"), "utf8");
  expect(css).toMatch(/\.pmp-pace-slot/);
  expect(css).toMatch(/max-width:\s*50%/);
});

test("Pace slider is Slow / Fast glass with DistroKid gradient", () => {
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

test("Explore and Home first paint skip channel pictogram imports", () => {
  const explore = fs.readFileSync(path.join(root, "src/lib/explore.js"), "utf8");
  expect(explore).not.toMatch(/from ["']\.\/channelArt["']/);
  const art = fs.readFileSync(path.join(root, "src/lib/channelArt.js"), "utf8");
  expect(art).not.toMatch(/from ["'].*assets\/channels/);
  expect(art).toMatch(/\/channels\/\$\{id\}\.png/);
  const card = fs.readFileSync(path.join(root, "src/components/home/ChannelCard.jsx"), "utf8");
  expect(card).toMatch(/resolveChannelArt/);
  expect(card).toMatch(/\braw\b/);
  expect(card).toMatch(/DefaultSleeve/);
  const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
  expect(app).toMatch(/setTimeout\(loadExploreScreen, 8000\)/);
  expect(app).toMatch(/runAfterDelay/);
  expect(app).not.toMatch(/timeout: 2200/);
  const screen = fs.readFileSync(path.join(root, "src/screens/ExploreScreen.jsx"), "utf8");
  expect(screen).toMatch(/runAfterDelay\(\(\) => setDeepReady\(true\), 2400\)/);
  expect(screen).not.toMatch(/will-change: transform/);
});
