#!/usr/bin/env node
/**
 * Cloudflare Pages serves the committed `build/` folder.
 * Fail if that bundle still contains a previous visual OS.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CHASSIS = "dark-premium-discover-20260925";
const htmlPath = path.join(ROOT, "build", "index.html");

if (!fs.existsSync(htmlPath)) {
  console.error("assert-shipped-style: missing build/index.html — run npm run build");
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, "utf8");
const cssDir = path.join(ROOT, "build", "static", "css");
const cssFiles = fs.existsSync(cssDir)
  ? fs.readdirSync(cssDir).filter((f) => f.endsWith(".css"))
  : [];
const css = cssFiles
  .map((f) => fs.readFileSync(path.join(cssDir, f), "utf8"))
  .join("\n");

const need = [
  [`pmp-chassis ${CHASSIS}`, html.includes(`content="${CHASSIS}"`) || html.includes(`content='${CHASSIS}'`)],
  ["obsidian canvas #1C222B", /#1C222B/i.test(html)],
  ["IBM Plex", /IBM\+Plex|IBM Plex/i.test(html)],
  ["Outfit", /Outfit/i.test(html)],
  ["quiet blue splash 110,168,255", /110\s*,\s*168\s*,\s*255/.test(html)],
];

const forbid = [
  ["old Syne face", /family=Syne/i.test(html)],
  ["old cyan boot splash", /101\s*,\s*230\s*,\s*255/.test(html)],
  ["retired Aqua #1E6FE8", /#1E6FE8/i.test(html + css)],
  ["retired Aqua splash 30,111,232", /30\s*,\s*111\s*,\s*232/.test(html + css)],
  ["retired acid 184,242,74", /184\s*,\s*242\s*,\s*74/.test(html + css)],
  ["retired void canvas #090A0D", /#090A0D/i.test(html + css)],
  ["retired mint phosphor #7ED9B8", /#7ED9B8/i.test(html + css)],
  ["retired mint fill #4E9A7A", /#4E9A7A/i.test(html + css)],
  ["retired light steel chassis", /steel-ps1-glass-20260919/.test(html)],
  ["retired obsidian ice chassis stamp", /obsidian-ps1-glass-20260925/.test(html)],
  ["retired token chassis stamp", /dark-premium-mp3-20260925/.test(html)],
  ["retired player-surface chassis stamp", /dark-premium-player-20260925/.test(html)],
  ["retired home chassis stamp", /dark-premium-home-20260925/.test(html)],
  ["retired neon green splash", /168\s*,\s*255\s*,\s*106/.test(html + css)],
  ["retired neon green fill", /#A8FF6A/i.test(html + css)],
  ["retired quiet-neon chassis stamp", /dark-premium-quiet-neon-20260925/.test(html)],
];

let failed = false;
for (const [label, ok] of need) {
  if (!ok) {
    console.error(`assert-shipped-style FAIL need: ${label}`);
    failed = true;
  }
}
for (const [label, hit] of forbid) {
  if (hit) {
    console.error(`assert-shipped-style FAIL leftover: ${label}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`assert-shipped-style OK chassis=${CHASSIS}`);
