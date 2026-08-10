import {
  color, font, fontDisplay, ADMIN_UID, timeOfDayGradient, BRAND_TAGLINE,
  BRAND_NAME, dock, artShadow, aluminumGradient, hardware, hardwareKey, y2k, homeSpace
} from './theme';

test('theme exports core tokens', () => {
  expect(color.ink).toBeTruthy();
  expect(color.accent).toMatch(/#A9C7E4/i);
  expect(color.onAccent).toMatch(/#0B0C0F/i);
  expect(color.canvas).toMatch(/#0B0C0F/i);
  expect(color.alert).toBeTruthy();
  expect(color.select).toMatch(/rgba/);
  expect(BRAND_TAGLINE).toMatch(/YOUR WORLD/i);
  expect(BRAND_NAME).toBe("Planet MP3");
  expect(font).toMatch(/Space Grotesk/);
  expect(fontDisplay).toMatch(/Space Grotesk/);
  expect(y2k.chromeBright).toBeTruthy();
  expect(y2k.chrome).toMatch(/#B8C0CC/i);
  expect(y2k.artGradient).not.toMatch(/139,\s*92,\s*246|purple/i);
  expect(homeSpace.sectionGap).toBeLessThanOrEqual(24);
  expect(homeSpace.sectionGap).toBeGreaterThan(0);
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
