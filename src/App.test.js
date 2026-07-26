import { color, font, fontDisplay, ADMIN_UID, timeOfDayGradient, BRAND_TAGLINE, BRAND_NAME, dock } from './theme';

test('theme exports core tokens', () => {
  expect(color.ink).toBeTruthy();
  expect(color.accent).toMatch(/#F2F3F5/i);
  expect(color.onAccent).toMatch(/#000000/i);
  expect(color.canvas).toMatch(/#0/);
  expect(color.alert).not.toMatch(/#FF|#FA24|#E54/i);
  expect(BRAND_TAGLINE).toMatch(/YOUR WORLD/i);
  expect(BRAND_NAME).toBe("Planet MP3");
  expect(font).toMatch(/SF Pro|apple-system|BlinkMacSystemFont/);
  expect(fontDisplay).toMatch(/SF Pro|apple-system|BlinkMacSystemFont/);
  expect(ADMIN_UID).toHaveLength(28);
  expect(timeOfDayGradient()).toMatch(/gradient/);
  expect(dock.clearPlayer).toBeGreaterThan(dock.clearTabs);
  expect(dock.radius).toBeGreaterThan(0);
});
