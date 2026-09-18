import {
  color, font, fontDisplay, fontLcd, type, sectionTitle, ADMIN_UID, timeOfDayGradient, BRAND_TAGLINE,
  BRAND_NAME, dock, artShadow, aluminumGradient, hardware, hardwareKey, y2k, homeSpace, STYLE_CHASSIS
} from './theme';

test('theme exports core tokens', () => {
  expect(color.ink).toBeTruthy();
  expect(color.accent).toMatch(/#5B6574/i);
  expect(color.onAccent).toMatch(/#D8DFE8/i);
  expect(color.canvas).toMatch(/#C5CBD6/i);
  expect(color.alert).toBeTruthy();
  expect(color.select).toMatch(/rgba/);
  expect(BRAND_TAGLINE).toMatch(/YOUR WORLD/i);
  expect(BRAND_NAME).toBe("Planet MP3");
  expect(font).toMatch(/IBM Plex Sans/);
  expect(fontDisplay).toMatch(/IBM Plex Sans/);
  expect(font).not.toMatch(/^system-ui/);
  expect(fontLcd).toMatch(/IBM Plex Mono/);
  expect(STYLE_CHASSIS).toBe("steel-chrome-20260918");
  expect(type.lcd.fontFamily).toMatch(/IBM Plex Mono/);
  expect(type.lcd.fontSize).toBe(11);
  expect(sectionTitle.fontSize).toBe(22);
  expect(y2k.chromeBright).toBeTruthy();
  expect(y2k.chrome).toMatch(/#A8B2C0/i);
  expect(y2k.cyan).toMatch(/#5B6574/i);
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
  expect(radio.lcdFill).toMatch(/#8B95A4|#C5CDD8|#D8DFE8/i);
});

test('canvas is a light steel chassis', () => {
  expect(color.canvas).toMatch(/#C5CBD6/i);
  expect(color.ink).toMatch(/#3D4654/i);
  expect(y2k.offWhite).toMatch(/#3D4654/i);
  expect(color.accent).not.toMatch(/#B8F24A/i);
});
