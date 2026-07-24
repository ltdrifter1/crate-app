import { color, font, ADMIN_UID, timeOfDayGradient } from './theme';

test('theme exports core tokens', () => {
  expect(color.ink).toBeTruthy();
  expect(font).toMatch(/SF Pro/);
  expect(ADMIN_UID).toHaveLength(28);
  expect(timeOfDayGradient()).toMatch(/gradient/);
});
