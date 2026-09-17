import {
  color, font, fontDisplay, fontLcd, type, sectionTitle, ADMIN_UID, timeOfDayGradient, BRAND_TAGLINE,
  BRAND_NAME, dock, artShadow, aluminumGradient, hardware, hardwareKey, y2k, homeSpace
} from './theme';

test('theme exports core tokens', () => {
  expect(color.ink).toBeTruthy();
  expect(color.accent).toMatch(/#0A84FF/i);
  expect(color.onAccent).toMatch(/#000000/i);
  expect(color.canvas).toMatch(/#000000/i);
  expect(color.alert).toBeTruthy();
  expect(color.select).toMatch(/rgba/);
  expect(BRAND_TAGLINE).toMatch(/YOUR WORLD/i);
  expect(BRAND_NAME).toBe("Planet MP3");
  expect(font).toMatch(/^system-ui/);
  expect(font).toMatch(/-apple-system/);
  expect(fontDisplay).toMatch(/^system-ui/);
  expect(fontDisplay).toMatch(/SF Pro Display/);
  expect(font).not.toMatch(/Inter/);
  expect(fontLcd).toMatch(/^system-ui/);
  expect(type.title2.fontWeight).toBe(700);
  expect(sectionTitle.fontSize).toBe(22);
  expect(y2k.chromeBright).toBeTruthy();
  expect(y2k.chrome).toMatch(/#D1D1D6/i);
  expect(y2k.cyan).toMatch(/#0A84FF/i);
  expect(y2k.artGradient).not.toMatch(/139,\s*92,\s*246|purple/i);
  expect(homeSpace.sectionGap).toBeLessThanOrEqual(32);
  expect(homeSpace.sectionGap).toBeGreaterThan(0);
  expect(homeSpace.titleToRail).toBeGreaterThan(0);
  expect(ADMIN_UID).toHaveLength(28);
  expect(timeOfDayGradient()).toMatch(/gradient/);
  expect(aluminumGradient()).toMatch(/gradient/);
  expect(artShadow.quiet).toBeTruthy();
  expect(dock.clearPlayer).toBeGreaterThan(dock.clearTabs);
  expect(dock.radius).toBeGreaterThan(0);
  expect(hardware.keyFace).toMatch(/rgba/);
  expect(hardwareKey().backdropFilter).toBeUndefined();
  expect(hardwareKey({ pressed: true }).boxShadow).toBe(hardware.keyPressed);
});

test('radio module tokens are soft Music.app containers', () => {
  const { radio } = require('./theme');
  expect(radio.radius).toBeGreaterThanOrEqual(8);
  expect(radio.radius).toBeLessThanOrEqual(16);
  expect(radio.moduleFace).toMatch(/rgba/);
  expect(radio.glassFace || radio.moduleFace).toMatch(/rgba/);
  expect(radio.tuneFace).toMatch(/#F5F5F7|#fff/i);
  expect(radio.lcdFill).not.toMatch(/101,\s*230,\s*255/);
  expect(radio.lcdFill).toMatch(/255,\s*255,\s*255/);
});
