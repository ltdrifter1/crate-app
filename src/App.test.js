import { color, font, fontDisplay, ADMIN_UID, timeOfDayGradient, BRAND_TAGLINE, BRAND_NAME, dock, artShadow, aluminumGradient } from './theme';

test('theme exports core tokens', () => {
  expect(color.ink).toBeTruthy();
  expect(color.accent).toMatch(/#2A2E38/i);
  expect(color.onAccent).toMatch(/#F4F6F9/i);
  expect(color.canvas).toMatch(/#D8DEE8/i);
  expect(color.alert).toBeTruthy();
  expect(color.select).toMatch(/rgba/);
  expect(BRAND_TAGLINE).toMatch(/YOUR WORLD/i);
  expect(BRAND_NAME).toBe("Planet MP3");
  expect(font).toMatch(/Rajdhani/);
  expect(fontDisplay).toMatch(/Oxanium/);
  expect(ADMIN_UID).toHaveLength(28);
  expect(timeOfDayGradient()).toMatch(/gradient/);
  expect(aluminumGradient()).toMatch(/gradient/);
  expect(artShadow.quiet).toBeTruthy();
  expect(dock.clearPlayer).toBeGreaterThan(dock.clearTabs);
  expect(dock.radius).toBeGreaterThan(0);
});
