import {
  color, font, fontDisplay, fontLcd, type, sectionTitle, ADMIN_UID, timeOfDayGradient, BRAND_TAGLINE,
  BRAND_NAME, dock, artShadow, aluminumGradient, hardware, hardwareKey, y2k, homeSpace
} from './theme';

test('theme exports core tokens', () => {
  expect(color.ink).toBeTruthy();
  expect(color.accent).toMatch(/#1E6FE8/i);
  expect(color.onAccent).toMatch(/#FFFFFF/i);
  expect(color.canvas).toMatch(/#E6E9EF/i);
  expect(color.alert).toBeTruthy();
  expect(color.select).toMatch(/rgba/);
  expect(BRAND_TAGLINE).toMatch(/YOUR WORLD/i);
  expect(BRAND_NAME).toBe("Planet MP3");
  expect(font).toMatch(/Lucida Grande/);
  expect(font).toMatch(/Helvetica Neue/);
  expect(font).toMatch(/Inter/);
  expect(fontDisplay).toMatch(/Lucida Grande/);
  expect(fontDisplay).toMatch(/Helvetica Neue/);
  expect(font).not.toMatch(/^system-ui/);
  expect(fontLcd).toMatch(/Lucida Grande/);
  expect(type.title2.fontWeight).toBe(700);
  expect(sectionTitle.fontSize).toBe(22);
  expect(y2k.chromeBright).toBeTruthy();
  expect(y2k.chrome).toMatch(/#C5CAD3/i);
  expect(y2k.cyan).toMatch(/#6FBF3A/i);
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
  expect(hardware.keyFace).toMatch(/linear-gradient/);
  expect(hardwareKey().backdropFilter).toBeUndefined();
  expect(hardwareKey({ pressed: true }).boxShadow).toBe(hardware.keyPressed);
});

test('radio module tokens are hardware-shaped', () => {
  const { radio } = require('./theme');
  expect(radio.radius).toBeGreaterThanOrEqual(8);
  expect(radio.radius).toBeLessThanOrEqual(14);
  expect(radio.moduleFace).toMatch(/linear-gradient/);
  expect(radio.glassFace || radio.moduleFace).toMatch(/linear-gradient/);
  expect(radio.tuneFace).toMatch(/linear-gradient/);
  expect(radio.lcdFill).toMatch(/111,\s*191,\s*58/);
});

test('canvas is a light iPod chassis, not a dark studio', () => {
  expect(color.canvas).not.toMatch(/#080A0D|#0B0C0F|#000/i);
  expect(color.ink).toMatch(/#1C1F24/i);
  expect(y2k.offWhite).toMatch(/#1C1F24/i);
});
