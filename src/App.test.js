import { color, font, fontDisplay, ADMIN_UID, timeOfDayGradient } from './theme';

test('theme exports core tokens', () => {
  expect(color.ink).toBeTruthy();
  expect(color.accent).toBeTruthy();
  expect(color.canvas).toMatch(/#0/);
  expect(font).toMatch(/DM Sans/);
  expect(fontDisplay).toMatch(/Syne/);
  expect(ADMIN_UID).toHaveLength(28);
  expect(timeOfDayGradient()).toMatch(/gradient/);
});
