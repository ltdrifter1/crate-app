import {
  color, font, fontDisplay, fontLcd, type, sectionTitle, ADMIN_UID, timeOfDayGradient, BRAND_TAGLINE,
  BRAND_NAME, dock, artShadow, aluminumGradient, hardware, hardwareKey, y2k, homeSpace, STYLE_CHASSIS
} from './theme';

test('theme exports core tokens', () => {
  expect(color.ink).toBeTruthy();
  expect(color.accent).toMatch(/#F74D7A/i);
  expect(color.onAccent).toMatch(/#141414/i);
  expect(color.canvas).toMatch(/#0B0909/i);
  expect(color.alert).toBeTruthy();
  expect(color.select).toMatch(/rgba/);
  expect(BRAND_TAGLINE).toMatch(/YOUR WORLD/i);
  expect(BRAND_NAME).toBe("Planet MP3");
  expect(font).toMatch(/Nippo/);
  expect(fontDisplay).toMatch(/Nippo/);
  expect(fontDisplay).toMatch(/IBM Plex Sans/);
  expect(font).not.toMatch(/^system-ui/);
  expect(fontLcd).toMatch(/Courier New/);
  expect(fontLcd).toMatch(/IBM Plex Mono/);
  expect(STYLE_CHASSIS).toBe("wavclub-night-20261028");
  expect(color.lcdSignal).toMatch(/#F74D7A/i);
  expect(color.cta).toMatch(/#F74D7A/i);
  expect(color.onCta).toMatch(/#141414/i);
  expect(color.lcdSignalSoft).toMatch(/247,\s*77,\s*122/);
  expect(color.lcdInk).toMatch(/#F1E5D7/i);
  expect(type.lcd.fontFamily).toMatch(/IBM Plex Mono/);
  expect(type.lcd.fontSize).toBe(12);
  expect(sectionTitle.fontSize).toBe(22);
  expect(y2k.chromeBright).toBeTruthy();
  expect(y2k.chrome).toMatch(/#E4D5C6/i);
  expect(y2k.cyan).toMatch(/#C4B5A6/i);
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
  expect(radio.radius).toBeGreaterThan(0);
  expect(radio.radius).toBeLessThanOrEqual(8);
  expect(radio.moduleFace).toMatch(/linear-gradient/);
  expect(radio.glassFace || radio.moduleFace).toMatch(/linear-gradient/);
  expect(radio.tuneFace).toMatch(/linear-gradient/);
  expect(radio.lcdFill).toMatch(/#F74D7A/i);
  expect(radio.lcdFill).not.toMatch(/#A8FF6A|#7DFFB3|#7ED9B8|#4E9A7A|#C8F5E4/i);
});

test('canvas is a deep cool charcoal, not a void and not the retired slate', () => {
  expect(color.canvas).toMatch(/#0B0909/i);
  expect(color.canvas).not.toMatch(/#1C222B/i);
  expect(color.ink).toMatch(/#F1E5D7/i);
  expect(y2k.offWhite).toMatch(/#F1E5D7/i);
  expect(color.canvas).not.toMatch(/#090A0D/i);
  expect(y2k.nearBlack).not.toMatch(/#090A0D/i);
  expect(color.lcdSignal).toMatch(/#F74D7A/i);
  expect(color.accent).not.toMatch(/#B8F24A|#A8FF6A/i);
  expect(color.lcdSignal).not.toMatch(/#7ED9B8|#4E9A7A|#C8F5E4/i);
  expect(color.lcdSignalGlow).not.toMatch(/126\s*,\s*217\s*,\s*184/);
});

test('primary buttons use silver, not DistroKid blue or neon green', () => {
  const { BTN_PRIMARY, trim } = require('./theme');
  expect(trim.lime).toMatch(/#C4B5A6/i);
  expect(trim.lime).not.toMatch(/#A8FF6A|#B8C430|#B8F24A/i);
  expect(trim.lime).not.toMatch(/#A8B4C6/i);
  expect(trim.blue).toMatch(/#F74D7A/i);
  expect(trim.blue).not.toMatch(/#367FC7/i);
  expect(trim.gradient).toMatch(/#C4B5A6|#F1E5D7/i);
  expect(trim.gradient).not.toMatch(/#A8FF6A|#7DFFB3|#B8C430|#367FC7/i);
  expect(BTN_PRIMARY.color).toMatch(/#141414/i);
  expect(String(BTN_PRIMARY.background)).not.toMatch(/#A8FF6A|#367FC7|#B8C430|#4A92D4|#2C6FB3/i);
});
