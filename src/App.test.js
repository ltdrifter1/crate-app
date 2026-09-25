import {
  color, font, fontDisplay, fontLcd, type, sectionTitle, ADMIN_UID, timeOfDayGradient, BRAND_TAGLINE,
  BRAND_NAME, dock, artShadow, aluminumGradient, hardware, hardwareKey, y2k, homeSpace, STYLE_CHASSIS
} from './theme';

test('theme exports core tokens', () => {
  expect(color.ink).toBeTruthy();
  expect(color.accent).toMatch(/#A8FF6A/i);
  expect(color.onAccent).toMatch(/#1C222B/i);
  expect(color.canvas).toMatch(/#1C222B/i);
  expect(color.alert).toBeTruthy();
  expect(color.select).toMatch(/rgba/);
  expect(BRAND_TAGLINE).toMatch(/YOUR WORLD/i);
  expect(BRAND_NAME).toBe("Planet MP3");
  expect(font).toMatch(/Outfit/);
  expect(fontDisplay).toMatch(/Outfit/);
  expect(fontDisplay).toMatch(/IBM Plex Sans/);
  expect(font).not.toMatch(/^system-ui/);
  expect(fontLcd).toMatch(/IBM Plex Mono/);
  expect(STYLE_CHASSIS).toBe("dark-premium-player-20260925");
  expect(color.lcdSignal).toMatch(/#A8FF6A/i);
  expect(color.cta).toMatch(/#A8FF6A/i);
  expect(color.onCta).toMatch(/#121417/i);
  expect(color.lcdSignalSoft).toMatch(/168,\s*255,\s*106/);
  expect(color.lcdInk).toMatch(/#E8FFD0/i);
  expect(type.lcd.fontFamily).toMatch(/IBM Plex Mono/);
  expect(type.lcd.fontSize).toBe(11);
  expect(sectionTitle.fontSize).toBe(22);
  expect(y2k.chromeBright).toBeTruthy();
  expect(y2k.chrome).toMatch(/#A8B2C0/i);
  expect(y2k.cyan).toMatch(/#A8FF6A/i);
  expect(y2k.artGradient).not.toMatch(/139,\s*92,\s*246|purple/i);
  expect(homeSpace.sectionGap).toBeLessThanOrEqual(32);
  expect(homeSpace.sectionGap).toBeGreaterThan(0);
  expect(homeSpace.titleToRail).toBeGreaterThan(0);
  expect(ADMIN_UID).toHaveLength(28);
  expect(timeOfDayGradient()).toMatch(/gradient/);
  expect(aluminumGradient()).toMatch(/gradient/);
  expect(artShadow.quiet).toBeTruthy();
  expect(dock.clearPlayer).toBeGreaterThan(dock.clearTabs);
  expect(dock.playerH).toBeLessThanOrEqual(64);
  expect(dock.clearPlayer).toBeLessThanOrEqual(160);
  expect(dock.radius).toBeGreaterThan(0);
  expect(hardware.keyFace).toMatch(/linear-gradient/);
  expect(hardwareKey().backdropFilter).toBeUndefined();
  expect(hardwareKey({ pressed: true }).boxShadow).toBe(hardware.keyPressed);
});

test('radio module tokens are hardware-shaped', () => {
  const { radio } = require('./theme');
  expect(radio.radius).toBeGreaterThanOrEqual(16);
  expect(radio.radius).toBeLessThanOrEqual(22);
  expect(radio.moduleFace).toMatch(/linear-gradient/);
  expect(radio.glassFace || radio.moduleFace).toMatch(/linear-gradient/);
  expect(radio.tuneFace).toMatch(/linear-gradient/);
  expect(radio.lcdFill).toMatch(/#A8FF6A|#7DFFB3|#6EA8FF/i);
  expect(radio.lcdFill).not.toMatch(/#7ED9B8|#4E9A7A|#C8F5E4/i);
});

test('canvas is an obsidian steel chassis, not a void', () => {
  expect(color.canvas).toMatch(/#1C222B/i);
  expect(color.ink).toMatch(/#E8EDF4/i);
  expect(y2k.offWhite).toMatch(/#E8EDF4/i);
  expect(color.canvas).not.toMatch(/#090A0D/i);
  expect(y2k.nearBlack).not.toMatch(/#090A0D/i);
  expect(color.lcdSignal).toMatch(/#A8FF6A/i);
  expect(color.accent).not.toMatch(/#B8F24A/i);
  expect(color.lcdSignal).not.toMatch(/#7ED9B8|#4E9A7A|#C8F5E4/i);
  expect(color.lcdSignalGlow).not.toMatch(/126\s*,\s*217\s*,\s*184/);
});

test('primary buttons use a neon green pill, not DistroKid blue', () => {
  const { BTN_PRIMARY, trim } = require('./theme');
  expect(trim.lime).toMatch(/#A8FF6A/i);
  expect(trim.lime).not.toMatch(/#B8C430|#B8F24A/i);
  expect(trim.blue).toMatch(/#6EA8FF/i);
  expect(trim.blue).not.toMatch(/#367FC7/i);
  expect(trim.gradient).toMatch(/#A8FF6A|#7DFFB3|#6EA8FF/i);
  expect(trim.gradient).not.toMatch(/#B8C430|#367FC7/i);
  expect(BTN_PRIMARY.color).toMatch(/#121417/i);
  expect(String(BTN_PRIMARY.background)).toMatch(/#A8FF6A/i);
  expect(String(BTN_PRIMARY.background)).not.toMatch(/#367FC7|#B8C430|#4A92D4|#2C6FB3/i);
});
