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
});
